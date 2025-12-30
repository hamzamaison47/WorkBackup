/* eslint-disable react-native/no-inline-styles */
/* eslint-disable curly */
import React, {useEffect, useState, useRef, useCallback} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
  Platform,
  PermissionsAndroid,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import {useSelector} from 'react-redux';
import Voice from '@react-native-voice/voice';
import Geolocation from '@react-native-community/geolocation';
import moment from 'moment';
import {CreateAttendance} from '../../API/Attendance/CreateAttendance';
import {GetGPSCoordinates} from '../../API/Attendance/GetGPSCoordinates';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {LeaveRequestHandler} from './ChatbotIntentHandler';
import {
  detectIntent,
  generateIntelligentResponse,
} from './ChatbotIntentHandler';

/* -------------------- Geofence / Location Helpers -------------------- */
const GEO_TTL_MS = 30 * 60 * 1000;
const FRESH_FIX_MS = 30 * 1000;
const MAX_ALLOWED_ACCURACY = 150;
const GEOF_KEY = 'df_geofences_v1';

const saveGeofences = async sites => {
  try {
    await AsyncStorage.setItem(
      GEOF_KEY,
      JSON.stringify({
        ts: Date.now(),
        sites: Array.isArray(sites) ? sites : [],
      }),
    );
  } catch {}
};

const loadGeofences = async () => {
  try {
    const raw = await AsyncStorage.getItem(GEOF_KEY);
    if (!raw) return {ts: 0, sites: []};
    const obj = JSON.parse(raw);
    return {
      ts: obj?.ts || 0,
      sites: Array.isArray(obj?.sites) ? obj.sites : [],
    };
  } catch {
    return {ts: 0, sites: []};
  }
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = d => (d * Math.PI) / 180;
  const R = 6371e3;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const dφ = toRad(lat2 - lat1);
  const dλ = toRad(lon2 - lon1);
  const a =
    Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const nearestWithEffective = (userLat, userLon, accuracy, points) => {
  if (!points?.length) return null;
  let best = null;
  for (const p of points) {
    const lat1 = Number(p.latitude);
    const lon1 = Number(p.longitude);
    if (!Number.isFinite(lat1) || !Number.isFinite(lon1)) continue;

    const dNormal = calculateDistance(userLat, userLon, lat1, lon1);
    const dSwapped = calculateDistance(userLat, userLon, lon1, lat1);
    const useSwap = dSwapped < dNormal;
    const chosenLat = useSwap ? lon1 : lat1;
    const chosenLon = useSwap ? lat1 : lon1;
    const d = useSwap ? dSwapped : dNormal;

    if (!best || d < best.distance) {
      best = {
        latitude: chosenLat,
        longitude: chosenLon,
        radius: Number(p.radius),
        distance: d,
      };
    }
  }
  if (!best) return null;
  const acc = Number.isFinite(accuracy) ? Math.max(0, accuracy) : 0;
  return {
    ...best,
    effectiveDistance: Math.max(0, best.distance - Math.min(acc, best.radius)),
  };
};

/* -------------------- Chatbot Component -------------------- */
const AIChatbot = ({visible, onClose}) => {
  const {userData} = useSelector(s => s.user || {});
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const processingRef = useRef(false);
  const lastCoordsRef = useRef(null);
  const geofenceCacheRef = useRef({sites: [], ts: 0});
  const permissionStatusRef = useRef(null);
  const flatListRef = useRef(null);
  const leaveHandlerRef = useRef(new LeaveRequestHandler());

  /* -------------------- Welcome Message -------------------- */
  useEffect(() => {
    if (visible && messages.length === 0) {
      const welcomeMsg = {
        id: 'welcome-1',
        text: "👋 Hey there! I'm Dynaface AI Assistant.\nHow may I help you today?",
        from: 'bot',
        timestamp: Date.now(),
      };
      setMessages([welcomeMsg]);
      speak(welcomeMsg.text);
    }
    if (!visible) {
      setMessages([]);
      setInput('');
      stopListening();
      leaveHandlerRef.current = new LeaveRequestHandler(); // Reset on close
    }
  }, [messages.length, visible]);

  /* -------------------- Voice Cleanup -------------------- */
  useEffect(() => {
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const startListening = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) return;
      }
      Voice.onSpeechResults = e => {
        const text = e?.value?.[0];
        if (text) handleSend(text);
        stopListening();
      };
      Voice.onSpeechError = () => stopListening();
      setListening(true);
      await Voice.start('en-US');
    } catch {
      stopListening();
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
      Voice.removeAllListeners();
    } catch {}
    setListening(false);
  };

  const addMessage = (text, from) => {
    const newMsg = {
      id: `${Date.now()}-${Math.random()}`,
      text,
      from,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, newMsg]);
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({animated: true});
    }, 100);
  };

  const speak = text => {
    try {
      const TTS =
        require('react-native-tts').default || require('react-native-tts');
      TTS.stop();
      TTS.speak(String(text));
    } catch (e) {
      console.log('TTS not available');
    }
  };

  /* -------------------- Location Helpers -------------------- */
  const ensureLocationPermission = useCallback(async () => {
    if (permissionStatusRef.current !== null)
      return permissionStatusRef.current;
    try {
      if (Platform.OS === 'android') {
        const fine = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        if (fine) {
          permissionStatusRef.current = true;
          return true;
        }
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        permissionStatusRef.current =
          result === PermissionsAndroid.RESULTS.GRANTED;
        return permissionStatusRef.current;
      } else {
        const auth = await Geolocation.requestAuthorization('whenInUse');
        permissionStatusRef.current = auth === 'granted';
        return permissionStatusRef.current;
      }
    } catch {
      permissionStatusRef.current = false;
      return false;
    }
  }, []);

  const tryGetPosition = opts =>
    new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        pos => resolve(pos.coords),
        err => reject(err),
        opts,
      );
    });

  const getCurrentLocationFast = useCallback(async () => {
    const now = Date.now();
    if (
      lastCoordsRef.current?.timestamp &&
      now - lastCoordsRef.current.timestamp < FRESH_FIX_MS &&
      (lastCoordsRef.current.accuracy ?? 9999) <= MAX_ALLOWED_ACCURACY
    ) {
      return lastCoordsRef.current;
    }
    const lowP = tryGetPosition({
      enableHighAccuracy: false,
      timeout: 3000,
      maximumAge: 15000,
    });
    const hiP = tryGetPosition({
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 10000,
    });
    let first;
    try {
      first = await Promise.race([lowP, hiP]);
    } catch {
      first = await tryGetPosition({
        enableHighAccuracy: true,
        timeout: 4000,
        maximumAge: 5000,
      });
    }
    lastCoordsRef.current = {...first, timestamp: Date.now()};
    return first;
  }, []);

  const getGeofencesCached = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    if (forceRefresh) {
      const sites = await GetGPSCoordinates().catch(() => []);
      geofenceCacheRef.current = {sites, ts: now};
      saveGeofences(sites);
      return sites;
    }
    if (
      geofenceCacheRef.current.sites.length &&
      now - geofenceCacheRef.current.ts < GEO_TTL_MS
    )
      return geofenceCacheRef.current.sites;
    const persisted = await loadGeofences();
    if (persisted.sites.length && now - persisted.ts < GEO_TTL_MS) {
      geofenceCacheRef.current = persisted;
      return persisted.sites;
    }
    const sites = await GetGPSCoordinates().catch(() => []);
    geofenceCacheRef.current = {sites, ts: now};
    saveGeofences(sites);
    return sites;
  }, []);

  const markAttendance = async () => {
    if (!userData?.employeeId) return;
    try {
      const ok = await ensureLocationPermission();
      if (!ok) {
        Alert.alert('Error', 'Location permission required');
        return;
      }
      addMessage('Fetching your location…', 'bot');

      const [coords, geofences] = await Promise.all([
        getCurrentLocationFast(),
        getGeofencesCached(),
      ]);
      if (!coords?.latitude || !coords?.longitude)
        throw new Error('Unable to get valid location');
      if (!geofences.length) throw new Error('No office geofence available');

      const nearest = nearestWithEffective(
        coords.latitude,
        coords.longitude,
        coords.accuracy,
        geofences,
      );
      if (!nearest || nearest.effectiveDistance > nearest.radius)
        throw new Error(
          `You are too far from office (~${Math.round(
            nearest?.distance || 0,
          )}m)`,
        );

      const payload = {
        employeeId: userData.employeeId,
        punchDateTime: moment().format('YYYY-MM-DDTHH:mm:ss[Z]'),
        location: `${coords.latitude},${coords.longitude} (±${Math.round(
          coords.accuracy,
        )}m)`,
      };
      const res = await CreateAttendance(payload);

      if (res?.isSuccess || res === true) {
        addMessage('✅ Attendance marked successfully!', 'bot');
        speak('Attendance marked successfully');
      } else {
        throw new Error(res?.message || 'Failed to mark attendance');
      }
    } catch (err) {
      const msg = err?.message || 'Error marking attendance';
      addMessage(`❌ ${msg}`, 'bot');
      speak(msg);
    }
  };

  const handleSend = async textOverride => {
    const text = (textOverride || input).trim();
    if (!text || processingRef.current) return;
    processingRef.current = true;
    setInput('');
    addMessage(text, 'user');
    setIsTyping(true);

    try {
      const leaveHandler = leaveHandlerRef.current;

      // Check for ongoing leave flow first
      if (leaveHandler.state !== null) {
        // Handle continuation of leave flow
        if (leaveHandler.state === 'awaiting_leave_type') {
          // Parse leave type
          const parseResult = leaveHandler.parseLeaveTypeSelection(
            text,
            leaveHandler.leaveData.availableLeaveCodes,
          );

          if (parseResult.success) {
            const categoryResult = leaveHandler.askForLeaveCategory();
            setIsTyping(false);
            addMessage(categoryResult.response, 'bot');
            speak(categoryResult.response);
          } else {
            setIsTyping(false);
            addMessage(
              '❌ Please select a valid leave type from the list.',
              'bot',
            );
            speak('Please select a valid leave type from the list');
          }
        } else if (leaveHandler.state === 'awaiting_leave_category') {
          // Parse leave category
          const parseResult = leaveHandler.parseLeaveCategory(text);

          if (parseResult.success) {
            const dateResult = leaveHandler.askForStartDate();
            setIsTyping(false);
            addMessage(dateResult.response, 'bot');
            speak(dateResult.response);
          } else {
            setIsTyping(false);
            addMessage(
              '❌ Please reply with 1 for Full Day or 2 for Half Day.',
              'bot',
            );
            speak('Please reply with 1 for Full Day or 2 for Half Day');
          }
        } else if (leaveHandler.state === 'awaiting_start_date') {
          // Parse start date
          const parseResult = leaveHandler.parseStartDate(text);

          if (parseResult.success) {
            const daysResult = leaveHandler.askForNumberOfDays();
            setIsTyping(false);
            addMessage(daysResult.response, 'bot');
            speak(daysResult.response);
          } else {
            setIsTyping(false);
            addMessage(
              '❌ Please provide a valid date in YYYY-MM-DD format.',
              'bot',
            );
            speak('Please provide a valid date in YYYY-MM-DD format');
          }
        } else if (leaveHandler.state === 'awaiting_days') {
          // Parse leave days
          const parseResult = leaveHandler.parseLeaveDays(text);

          if (parseResult.success) {
            const reasonResult = leaveHandler.askForReason();
            setIsTyping(false);
            addMessage(reasonResult.response, 'bot');
            speak(reasonResult.response);
          } else {
            setIsTyping(false);
            addMessage(
              `❌ ${
                parseResult.error ||
                'Please enter a valid number of days (1-30).'
              }`,
              'bot',
            );
            speak(parseResult.error || 'Please enter a valid number of days');
          }
        } else if (leaveHandler.state === 'awaiting_reason') {
          // Parse reason
          const parseResult = leaveHandler.parseReason(text);

          if (parseResult.success) {
            const confirmResult = leaveHandler.askForConfirmation();
            setIsTyping(false);
            addMessage(confirmResult.response, 'bot');
            speak('Please confirm the details');
          } else {
            setIsTyping(false);
            addMessage('❌ Please provide a reason (3-500 characters).', 'bot');
            speak('Please provide a reason');
          }
        } else if (leaveHandler.state === 'awaiting_confirmation') {
          // Handle confirmation
          const confirmText = text.toLowerCase();

          if (confirmText.includes('yes') || confirmText.includes('confirm')) {
            addMessage('⏳ Submitting your leave request...', 'bot');
            speak('Submitting your leave request');

            const submitResult = await leaveHandler.submitLeave(userData);

            setIsTyping(false);
            if (submitResult.success) {
              addMessage(submitResult.message, 'bot');
              speak(submitResult.message);
              leaveHandlerRef.current = new LeaveRequestHandler();
            } else {
              addMessage(submitResult.message, 'bot');
              speak(submitResult.message);
              leaveHandlerRef.current = new LeaveRequestHandler();
            }
          } else if (
            confirmText.includes('no') ||
            confirmText.includes('cancel')
          ) {
            setIsTyping(false);
            addMessage(
              '❌ Leave request cancelled. How else can I help?',
              'bot',
            );
            speak('Leave request cancelled');
            leaveHandlerRef.current = new LeaveRequestHandler();
          } else {
            setIsTyping(false);
            addMessage(
              'Please reply with "yes" to confirm or "no" to cancel.',
              'bot',
            );
            speak('Please reply with yes or no');
          }
        }
      } else {
        // No ongoing flow, detect new intent
        const intent = detectIntent(text);

        if (intent === 'mark_attendance') {
          setIsTyping(false);
          Alert.alert(
            'Confirm Attendance',
            'Do you want me to mark your attendance now?',
            [
              {text: 'Cancel', style: 'cancel'},
              {text: 'Yes', onPress: markAttendance},
            ],
          );
        } else if (intent === 'request_leave') {
          const result = await leaveHandler.askForLeaveType(userData);
          setIsTyping(false);
          addMessage(result.response, 'bot');
          speak(result.response);
        } else if (intent === 'info_dynaface') {
          const response = generateIntelligentResponse(intent);
          setIsTyping(false);
          addMessage(response, 'bot');
          speak(response);
        } else {
          // Fallback
          const response = generateIntelligentResponse('unknown');
          setIsTyping(false);
          addMessage(response, 'bot');
          speak(response);
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      setIsTyping(false);
      addMessage('Sorry, something went wrong. Please try again.', 'bot');
      speak('Sorry, something went wrong');
    } finally {
      processingRef.current = false;
    }
  };

  /* -------------------- Render Item -------------------- */
  const renderItem = ({item}) => {
    const isUser = item.from === 'user';
    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userContainer : styles.botContainer,
        ]}>
        {!isUser && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>🤖</Text>
          </View>
        )}
        <View
          style={[
            styles.bubble,
            isUser ? styles.userBubble : styles.botBubble,
          ]}>
          <Text style={[styles.messageText, isUser && styles.userMessageText]}>
            {item.text}
          </Text>
          <Text style={styles.timestamp}>
            {moment(item.timestamp).format('HH:mm')}
          </Text>
        </View>
        {isUser && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
        )}
      </View>
    );
  };

  const renderTypingIndicator = () => (
    <View style={[styles.messageContainer, styles.botContainer]}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>🤖</Text>
      </View>
      <View style={[styles.bubble, styles.botBubble]}>
        <Text style={styles.typingText}>Dynaface is typing</Text>
        <View style={styles.typingDots}>
          <Text style={styles.dot}>•</Text>
          <Text style={[styles.dot, {animationDelay: '0.2s'}]}>•</Text>
          <Text style={[styles.dot, {animationDelay: '0.4s'}]}>•</Text>
        </View>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Text style={styles.botAvatarLarge}>🤖</Text>
              <View>
                <Text style={styles.title}>Dynaface AI Assistant</Text>
                <Text style={styles.status}>Online • Ready to help</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.chatContainer}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={isTyping ? renderTypingIndicator : null}
          />

          {/* Input Bar */}
          <View style={styles.inputRow}>
            <TouchableOpacity
              onPress={listening ? stopListening : startListening}
              style={[styles.iconButton, listening && styles.listeningButton]}>
              <Text style={styles.micIcon}>{listening ? '🎙️' : '🎤'}</Text>
            </TouchableOpacity>

            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Type your message..."
              placeholderTextColor="#888"
              style={styles.input}
              onSubmitEditing={() => handleSend()}
            />

            <TouchableOpacity
              onPress={() => handleSend()}
              style={[styles.iconButton, styles.sendButton]}
              disabled={!input.trim()}>
              <Text style={styles.sendIcon}>↑</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

/* -------------------- Styles -------------------- */
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    height: '80%',
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  status: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 2,
  },
  close: {
    fontSize: 28,
    color: '#666',
  },
  botAvatarLarge: {
    fontSize: 32,
    marginRight: 12,
  },
  chatContainer: {
    padding: 12,
    paddingBottom: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 6,
    alignItems: 'flex-end',
  },
  botContainer: {
    justifyContent: 'flex-start',
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  avatarText: {
    fontSize: 20,
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  botBubble: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#1a1a1a',
    lineHeight: 22,
  },
  userMessageText: {
    color: '#ffffff',
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  typingText: {
    fontSize: 15,
    color: '#666',
    fontStyle: 'italic',
  },
  typingDots: {
    flexDirection: 'row',
    marginTop: 4,
  },
  dot: {
    fontSize: 18,
    color: '#999',
    marginHorizontal: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  listeningButton: {
    backgroundColor: '#ff4444',
  },
  sendButton: {
    backgroundColor: '#007AFF',
  },
  micIcon: {
    fontSize: 22,
  },
  sendIcon: {
    fontSize: 24,
    color: '#fff',
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 8,
    fontSize: 16,
  },
});

export default AIChatbot;
