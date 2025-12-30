/* eslint-disable no-unused-vars */
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
import {useSelector, useDispatch} from 'react-redux';
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

import {
  chatbotAddMessage,
  chatbotSetMessages,
  chatbotSetLeaveFlow,
  chatbotClearChat,
} from '../../store/slices/chatbotSlice';

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
  const dispatch = useDispatch();
  const {userData} = useSelector(s => s.user || {});

  const messages = useSelector(s => s.chatbot?.messages || []);
  const leaveFlow = useSelector(s => s.chatbot?.leaveFlow || null);

  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const processingRef = useRef(false);
  const lastCoordsRef = useRef(null);
  const geofenceCacheRef = useRef({sites: [], ts: 0});
  const permissionStatusRef = useRef(null);
  const flatListRef = useRef(null);

  const leaveHandlerRef = useRef(new LeaveRequestHandler());

  /* -------------------- Restore Leave Flow From Redux -------------------- */
  useEffect(() => {
    const h = new LeaveRequestHandler();
    if (leaveFlow) {
      console.log('🔄 RESTORING from Redux:', leaveFlow);
      h.fromJSON(leaveFlow);
    }
    leaveHandlerRef.current = h;
  }, [leaveFlow]);

  /* -------------------- Welcome Message -------------------- */
  useEffect(() => {
    if (!visible) return;

    if (!messages || messages.length === 0) {
      const welcomeMsg = {
        id: 'welcome-1',
        text: "👋 Hey there! I'm Dynaface AI Assistant.\nHow may I help you today?",
        from: 'bot',
        timestamp: Date.now(),
      };
      dispatch(chatbotSetMessages([welcomeMsg]));
      speak(welcomeMsg.text);
    }
  }, [visible, messages.length, dispatch, messages]);

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
      text: String(text),
      from,
      timestamp: Date.now(),
    };

    dispatch(chatbotAddMessage(newMsg));

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
      // no-op
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

  const persistFlowToRedux = () => {
    try {
      const h = leaveHandlerRef.current;
      const flowData = h.toJSON();
      console.log('💾 SAVING to Redux:', flowData);
      dispatch(chatbotSetLeaveFlow(flowData));
    } catch (error) {
      console.error('Error persisting flow:', error);
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
      const lower = text.toLowerCase();

      console.log('📝 Processing:', text);
      console.log('📊 Current state:', leaveHandler.state);
      console.log('📦 Current leave data:', leaveHandler.leaveData);

      // Global cancel
      if (
        leaveHandler.state !== null &&
        (lower.includes('cancel') || lower.includes('stop'))
      ) {
        setIsTyping(false);
        addMessage('❌ Cancelled. How else can I help?', 'bot');
        speak('Cancelled');
        leaveHandler.reset();
        persistFlowToRedux();
        processingRef.current = false;
        return;
      }

      // Continue leave flow
      if (leaveHandler.state !== null) {
        console.log(`🔍 Processing in state: ${leaveHandler.state}`);

        if (leaveHandler.state === 'awaiting_leave_type') {
          const parsed = leaveHandler.parseLeaveTypeSelection(text);
          console.log('✅ Parsed leave type result:', parsed);

          if (!parsed.success) {
            setIsTyping(false);
            addMessage(
              '❌ Please select a valid leave type from the list above. Reply with the number or name.',
              'bot',
            );
            speak('Please select a valid leave type');
          } else {
            console.log('🎯 Selected leave:', parsed.selected);
            console.log('📋 Now leaveData is:', leaveHandler.leaveData);

            // IMMEDIATELY SAVE TO REDUX after selection
            persistFlowToRedux();

            if (leaveHandler.leaveData.mode === 'leave_balance') {
              addMessage('⏳ Checking your balance…', 'bot');
              await leaveHandler.buildBalanceOnly(userData);
              const resp = leaveHandler.askForConfirmation();
              setIsTyping(false);
              addMessage(resp.response, 'bot');
              speak('Here is your leave balance');
            } else {
              const resp = leaveHandler.askForLeaveCategory();
              setIsTyping(false);
              addMessage(resp.response, 'bot');
              speak(resp.response);
            }
          }
          persistFlowToRedux(); // Save again
          processingRef.current = false;
          return;
        }

        if (leaveHandler.state === 'awaiting_leave_category') {
          const parsed = leaveHandler.parseLeaveCategory(text);
          if (!parsed.success) {
            setIsTyping(false);
            addMessage('❌ Reply 1 for Full Day or 2 for Half Day.', 'bot');
            speak('Reply 1 for Full Day or 2 for Half Day');
          } else {
            const resp = leaveHandler.askForStartDate();
            setIsTyping(false);
            addMessage(resp.response, 'bot');
            speak(resp.response);
          }
          persistFlowToRedux();
          processingRef.current = false;
          return;
        }

        if (leaveHandler.state === 'awaiting_start_date') {
          const parsed = leaveHandler.parseStartDate(text);
          if (!parsed.success) {
            setIsTyping(false);
            addMessage(
              '❌ Please provide a valid date (YYYY-MM-DD or DD/MM/YYYY). Example: 2025-12-30',
              'bot',
            );
            speak('Please provide a valid date');
          } else {
            if (parsed.autoEndDate) {
              addMessage('⏳ Calculating leave details…', 'bot');
              await leaveHandler.fetchLeaveDaysBalanceQuotaEligibility(
                userData,
              );
              const resp = leaveHandler.askForReason();
              setIsTyping(false);
              addMessage(resp.response, 'bot');
              speak(resp.response);
            } else {
              const resp = leaveHandler.askForEndDate();
              setIsTyping(false);
              addMessage(resp.response, 'bot');
              speak(resp.response);
            }
          }
          persistFlowToRedux();
          processingRef.current = false;
          return;
        }

        if (leaveHandler.state === 'awaiting_end_date') {
          const parsed = leaveHandler.parseEndDate(text);
          if (!parsed.success) {
            setIsTyping(false);
            addMessage(
              `❌ ${
                parsed.error ||
                'Invalid end date. Please use format YYYY-MM-DD or DD/MM/YYYY.'
              }`,
              'bot',
            );
            speak('Invalid end date');
          } else {
            addMessage('⏳ Calculating leave details…', 'bot');
            await leaveHandler.fetchLeaveDaysBalanceQuotaEligibility(userData);
            const resp = leaveHandler.askForReason();
            setIsTyping(false);
            addMessage(resp.response, 'bot');
            speak(resp.response);
          }
          persistFlowToRedux();
          processingRef.current = false;
          return;
        }

        if (leaveHandler.state === 'awaiting_reason') {
          const parsed = leaveHandler.parseReason(text);
          if (!parsed.success) {
            setIsTyping(false);
            addMessage(
              `❌ ${
                parsed.error ||
                'Please provide a valid reason (3-500 characters).'
              }`,
              'bot',
            );
            speak('Please provide a valid reason');
          } else {
            const resp = leaveHandler.askForConfirmation();
            setIsTyping(false);
            addMessage(resp.response, 'bot');
            speak(resp.response);
          }
          persistFlowToRedux();
          processingRef.current = false;
          return;
        }

        if (leaveHandler.state === 'awaiting_confirmation') {
          // Balance mode
          if (leaveHandler.leaveData.mode === 'leave_balance') {
            const parsed = leaveHandler.parseLeaveTypeSelection(text);
            if (parsed.success) {
              addMessage('⏳ Checking your balance…', 'bot');
              await leaveHandler.buildBalanceOnly(userData);
              const resp = leaveHandler.askForConfirmation();
              setIsTyping(false);
              addMessage(resp.response, 'bot');
              speak('Here is your leave balance');
            } else {
              setIsTyping(false);
              addMessage(
                'Type a leave type (number or name) to check again, or type "cancel".',
                'bot',
              );
              speak('Type a leave type to check again or cancel');
            }
            persistFlowToRedux();
            processingRef.current = false;
            return;
          }

          // Leave request mode - FINAL CONFIRMATION
          if (
            lower.includes('save') ||
            lower === '1' ||
            (lower.includes('yes') && lower.includes('save'))
          ) {
            addMessage('⏳ Saving your leave request…', 'bot');
            speak('Saving your leave request');

            console.log('🔄 Final data before save:', leaveHandler.leaveData);

            const res = await leaveHandler.createOrSubmitLeave(
              userData,
              'save',
            );
            setIsTyping(false);
            addMessage(res.message, 'bot');
            speak(res.message);
            leaveHandler.reset();
            persistFlowToRedux();
            processingRef.current = false;
            return;
          }

          if (
            lower.includes('submit') ||
            lower === '2' ||
            (lower.includes('yes') && lower.includes('submit'))
          ) {
            addMessage('⏳ Submitting your leave request…', 'bot');
            speak('Submitting your leave request');

            console.log('🔄 Final data before submit:', leaveHandler.leaveData);

            const res = await leaveHandler.createOrSubmitLeave(
              userData,
              'submit',
            );
            setIsTyping(false);
            addMessage(res.message, 'bot');
            speak(res.message);
            leaveHandler.reset();
            persistFlowToRedux();
            processingRef.current = false;
            return;
          }

          if (
            lower.includes('cancel') ||
            lower === '3' ||
            lower.includes('no')
          ) {
            setIsTyping(false);
            addMessage(
              '❌ Leave request cancelled. How else can I help?',
              'bot',
            );
            speak('Leave request cancelled');
            leaveHandler.reset();
            persistFlowToRedux();
            processingRef.current = false;
            return;
          }

          setIsTyping(false);
          addMessage(
            'Please reply with "save" (1), "submit" (2), or "cancel" (3).',
            'bot',
          );
          speak('Please reply with save submit or cancel');
          persistFlowToRedux();
          processingRef.current = false;
          return;
        }
      }

      // No ongoing flow -> detect intent
      const intent = detectIntent(text);
      console.log('🎯 Detected intent:', intent);

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
        processingRef.current = false;
        return;
      }

      if (intent === 'request_leave') {
        const resp = await leaveHandler.startLeaveRequestFlow(userData);
        setIsTyping(false);
        addMessage(resp.response, 'bot');
        speak(resp.response);
        persistFlowToRedux();
        processingRef.current = false;
        return;
      }

      if (intent === 'check_leave_balance') {
        const resp = await leaveHandler.startLeaveBalanceFlow(userData);
        setIsTyping(false);
        addMessage(resp.response, 'bot');
        speak(resp.response);
        persistFlowToRedux();
        processingRef.current = false;
        return;
      }

      if (intent === 'info_dynaface') {
        const response = generateIntelligentResponse(intent);
        setIsTyping(false);
        addMessage(response, 'bot');
        speak(response);
        processingRef.current = false;
        return;
      }

      const fallback = generateIntelligentResponse('unknown');
      setIsTyping(false);
      addMessage(fallback, 'bot');
      speak(fallback);
    } catch (err) {
      console.error('❌ Chat error:', err);
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

            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.close}>✕</Text>
              </TouchableOpacity>
            </View>
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
