/* eslint-disable no-unused-vars */
/* eslint-disable curly */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useEffect, useState, useRef, useMemo} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Animated,
  ActivityIndicator,
  Alert,
  InteractionManager,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import moment from 'moment';
import {useNavigation} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import azureAIService from '../../services/AzureAIService';
import LeaveService from '../../services/LeaveService';
import VoiceRecordingService from '../../services/VoiceRecordingService';

import {
  chatbotAddMessage,
  chatbotSetMessages,
} from '../../store/slices/chatbotSlice';

const {width, height} = Dimensions.get('window');
const PRIMARY_COLOR = '#0A66C2';
const SECONDARY_COLOR = '#0765A2';
const ACCENT_COLOR = '#E7F3FF';
const BG_COLOR = '#F3F6F8';
const USER_BUBBLE = '#0A66C2';
const BOT_BUBBLE = '#FFFFFF';

// Separate component for message bubbles to properly use hooks
const MessageBubble = React.memo(({item, index}) => {
  const isUser = item.from === 'user';
  const slideAnim = useRef(new Animated.Value(isUser ? 50 : -50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.messageWrapper,
        isUser ? styles.userWrapper : styles.botWrapper,
        {
          opacity: opacityAnim,
          transform: [{translateX: slideAnim}],
        },
      ]}>
      {!isUser && (
        <View style={styles.avatarContainer}>
          <LinearGradient colors={['#0A66C2', '#0765A2']} style={styles.avatar}>
            <Icon name="robot-excited" size={22} color="#fff" />
          </LinearGradient>
        </View>
      )}

      <View
        style={[styles.bubbleContainer, isUser && styles.userBubbleContainer]}>
        <View
          style={[
            styles.bubble,
            isUser ? styles.userBubble : styles.botBubble,
          ]}>
          <Text style={[styles.messageText, isUser && styles.userMessageText]}>
            {item.text}
          </Text>
          <Text style={[styles.timestamp, isUser && styles.userTimestamp]}>
            {moment(item.timestamp).format('HH:mm')}
          </Text>
        </View>
      </View>

      {isUser && (
        <View style={styles.avatarContainer}>
          <LinearGradient colors={['#0765A2', '#0A66C2']} style={styles.avatar}>
            <Icon name="account" size={22} color="#fff" />
          </LinearGradient>
        </View>
      )}
    </Animated.View>
  );
});

const AIChatbot = ({visible, onClose}) => {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const {userData} = useSelector(s => s.user || {});
  const messages = useSelector(s => s.chatbot?.messages || []);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [voiceServiceReady, setVoiceServiceReady] = useState(true);
  const [voiceStatus, setVoiceStatus] = useState('Voice Ready');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const processingRef = useRef(false);
  const flatListRef = useRef(null);
  const leaveService = useRef(new LeaveService());

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const micScaleAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const recordingTimer = useRef(null);
  const isMountedRef = useRef(true);
  const lastRecordingTime = useRef(0);
  const stopRequestedRef = useRef(false);
  const endLockRef = useRef(false);

  const isPressToTalk = useMemo(() => {
    return Platform.OS === 'android' || Platform.OS === 'ios';
  }, []);

  /* -------------------- Keyboard Handling -------------------- */
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      e => {
        setKeyboardHeight(e.endCoordinates.height);
      },
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      },
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  /* -------------------- Animations -------------------- */
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearTimers();
      VoiceRecordingService.cancelRecording?.();
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      clearTimers();
      VoiceRecordingService.cancelRecording?.();
      return;
    }

    if (!messages || messages.length === 0) {
      const welcomeMsg = {
        id: 'welcome-1',
        text: "👋 Hello! I'm your AI Assistant. How may I help you today?",
        from: 'bot',
        timestamp: Date.now(),
      };
      dispatch(chatbotSetMessages([welcomeMsg]));
    }

    setVoiceServiceReady(true);
    setVoiceStatus('Voice Ready');

    return () => {
      if (isRecording) VoiceRecordingService.cancelRecording?.();
      clearTimers();
    };
  }, [visible]);

  /* -------------------- Auto-scroll -------------------- */
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      InteractionManager.runAfterInteractions(() => {
        try {
          flatListRef.current?.scrollToEnd({animated: true});
        } catch (error) {}
      });
    }
  }, [messages]);

  useEffect(() => {
    if (isTyping && flatListRef.current) {
      const t = setTimeout(() => {
        try {
          flatListRef.current?.scrollToEnd({animated: true});
        } catch (error) {}
      }, 400);
      return () => clearTimeout(t);
    }
  }, [isTyping]);

  /* -------------------- Recording Animations -------------------- */
  useEffect(() => {
    if (isRecording) {
      Animated.parallel([
        Animated.loop(
          Animated.sequence([
            Animated.timing(micScaleAnim, {
              toValue: 1.3,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(micScaleAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
        ),
        Animated.loop(
          Animated.timing(waveAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ),
      ]).start();
    } else {
      micScaleAnim.stopAnimation?.();
      micScaleAnim.setValue(1);
      waveAnim.stopAnimation?.();
      waveAnim.setValue(0);
    }
  }, [isRecording]);

  useEffect(() => {
    if (isTyping) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.stopAnimation?.();
      pulseAnim.setValue(1);
    }
  }, [isTyping]);

  const clearTimers = () => {
    if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
      recordingTimer.current = null;
    }
  };

  /* -------------------- Voice Recording -------------------- */
  const startRecording = async () => {
    const now = Date.now();
    if (now - lastRecordingTime.current < 700) return;
    lastRecordingTime.current = now;

    if (!voiceServiceReady) {
      Alert.alert('Voice Not Ready', 'Please type instead.');
      return;
    }

    try {
      stopRequestedRef.current = false;
      setIsRecording(true);
      setRecordingDuration(0);
      setInput('');

      recordingTimer.current = setInterval(() => {
        if (!isMountedRef.current) return;
        setRecordingDuration(prev => {
          const next = prev + 1;
          if (next >= 60) stopRecording();
          return next;
        });
      }, 1000);

      const res = await VoiceRecordingService.startRecording();
      if (!res?.success) {
        throw new Error(res?.error || 'Failed to start recording');
      }
    } catch (e) {
      clearTimers();
      setIsRecording(false);
      setRecordingDuration(0);
      Alert.alert('Recording Error', e?.message || 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (endLockRef.current) return;
    endLockRef.current = true;

    try {
      clearTimers();
      setIsRecording(false);

      const rec = await VoiceRecordingService.stopRecording();

      if (!rec?.success) {
        throw new Error(rec?.error || 'Failed to stop recording');
      }

      if ((rec.duration || 0) < 1) {
        Alert.alert(
          'Recording Too Short',
          'Please speak for at least 1 second.',
        );
        return;
      }

      const text = (rec?.text || '').trim();
      if (!text) {
        Alert.alert(
          'Speech Not Recognized',
          "I couldn't understand. Please try again.",
        );
        return;
      }

      setInput(text);

      const normalized = await azureAIService.normalizeVoiceText({
        sttText: text,
        detectedLanguage: rec?.detectedLanguage || 'unknown',
      });

      const finalText = normalized?.text || text;
      const langHint = normalized?.preferredLanguage || 'auto';

      setTimeout(() => {
        if (isMountedRef.current) {
          handleSend(finalText, langHint);
        }
      }, 300);
    } catch (e) {
      setIsRecording(false);
      Alert.alert('Speech Error', e?.message || 'Failed to recognize speech');
    } finally {
      endLockRef.current = false;
    }
  };

  const cancelRecording = async () => {
    if (endLockRef.current) return;
    endLockRef.current = true;

    try {
      clearTimers();
      stopRequestedRef.current = false;
      setIsRecording(false);
      setRecordingDuration(0);
      await VoiceRecordingService.cancelRecording?.();
    } catch (error) {
    } finally {
      endLockRef.current = false;
    }
  };

  /* -------------------- Message Handling -------------------- */
  const addMessage = (text, from) => {
    if (!text || typeof text !== 'string' || text.trim().length === 0) return;

    const newMsg = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: String(text).substring(0, 1000),
      from,
      timestamp: Date.now(),
    };

    dispatch(chatbotAddMessage(newMsg));

    setTimeout(() => {
      if (!flatListRef.current) return;
      try {
        flatListRef.current.scrollToEnd({animated: true});
      } catch (e) {}
    }, 100);
  };

  /* -------------------- Navigation & Send -------------------- */
  const navigateToScreen = (screenName, params = {}) => {
    onClose?.();
    setTimeout(() => {
      try {
        navigation.navigate(screenName, {
          employeeId: userData?.employeeId,
          employeeName: userData?.employeeName,
          WorkerRecId: userData?.WorkerRecId,
          userData,
          cameFrom: 'MainDashboard',
          ...params,
        });
      } catch (navError) {
        Alert.alert('Navigation Error', 'Cannot navigate to that screen.');
      }
    }, 300);
  };

  const handleSend = async (textOverride, preferredLanguageOverride) => {
    const text = (textOverride ?? input).trim();
    if (!text) return;
    if (processingRef.current) return;

    processingRef.current = true;
    addMessage(text, 'user');
    setInput('');
    setIsTyping(true);

    try {
      const functions = leaveService.current.getFunctionDefinitions();
      const langHint = preferredLanguageOverride || 'auto';

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('AI response timeout')), 30000);
      });

      const aiResponse = await Promise.race([
        azureAIService.chat({
          userMessage: text,
          conversationHistory: messages,
          availableFunctions: functions,
          userData,
          preferredLanguage: langHint,
        }),
        timeoutPromise,
      ]);

      if (aiResponse?.type === 'function_call') {
        await handleFunctionCall(aiResponse);
      } else {
        addMessage(aiResponse?.text || 'Sorry, I could not respond.', 'bot');
      }
    } catch (err) {
      const errorMessage = err?.message?.toLowerCase?.().includes('timeout')
        ? 'Response taking too long. Please try again.'
        : 'Sorry, something went wrong. Please try again.';
      addMessage(errorMessage, 'bot');
    } finally {
      processingRef.current = false;
      setIsTyping(false);
    }
  };

  const handleFunctionCall = async functionCall => {
    try {
      if (functionCall.function === 'navigate_to_screen') {
        const {screenName, message} = functionCall.parameters || {};
        if (message) addMessage(message, 'bot');
        setTimeout(() => navigateToScreen(screenName), 700);
        return;
      }

      const result = await leaveService.current.execute(
        functionCall.function,
        functionCall.parameters,
        userData,
      );

      if (!result?.success) {
        await handleFunctionError(functionCall, result);
        return;
      }

      if (result.action === 'navigate') {
        if (result.message) addMessage(result.message, 'bot');
        setTimeout(
          () => navigateToScreen(result.screenName, result.params || {}),
          700,
        );
        return;
      }

      await handleFunctionSuccess(functionCall, result);
    } catch (error) {
      addMessage('Failed to process request. Please try again.', 'bot');
    }
  };

  const handleFunctionError = async (functionCall, result) => {
    const errorContext = {
      ...result,
      originalFunction: functionCall.function,
      originalParameters: functionCall.parameters,
    };

    try {
      const continueResponse = await azureAIService.continueAfterFunction({
        previousMessages: messages,
        functionName: functionCall.function,
        functionResult: errorContext,
        userData,
        preferredLanguage: 'auto',
        availableFunctions: leaveService.current.getFunctionDefinitions(),
        toolCallId: functionCall.toolCallId,
      });

      addMessage(continueResponse?.text || 'Something went wrong.', 'bot');
      if (continueResponse?.type === 'function_call') {
        await handleFunctionCall(continueResponse);
      }
    } catch (error) {
      addMessage('Sorry, something went wrong.', 'bot');
    }
  };

  const handleFunctionSuccess = async (functionCall, result) => {
    try {
      const continueResponse = await azureAIService.continueAfterFunction({
        previousMessages: messages,
        functionName: functionCall.function,
        functionResult: result,
        userData,
        preferredLanguage: 'auto',
        availableFunctions: leaveService.current.getFunctionDefinitions(),
        toolCallId: functionCall.toolCallId,
      });

      addMessage(continueResponse?.text || 'Done!', 'bot');
      if (continueResponse?.type === 'function_call') {
        await handleFunctionCall(continueResponse);
      }
    } catch (error) {
      addMessage('Sorry, something went wrong.', 'bot');
    }
  };

  const formatDuration = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /* -------------------- Render Components -------------------- */
  const renderItem = ({item, index}) => {
    return <MessageBubble item={item} index={index} />;
  };

  const renderTypingIndicator = () => (
    <View style={[styles.messageWrapper, styles.botWrapper]}>
      <View style={styles.avatarContainer}>
        <LinearGradient colors={['#0A66C2', '#0765A2']} style={styles.avatar}>
          <Animated.View style={{transform: [{scale: pulseAnim}]}}>
            <Icon name="robot-excited" size={22} color="#fff" />
          </Animated.View>
        </LinearGradient>
      </View>
      <View style={[styles.bubble, styles.typingBubble]}>
        <View style={styles.typingContainer}>
          <ActivityIndicator size="small" color="#0A66C2" />
          <Text style={styles.typingText}>AI is thinking...</Text>
        </View>
      </View>
    </View>
  );

  const handleClose = () => {
    if (isRecording) cancelRecording();
    clearTimers();
    Keyboard.dismiss();
    onClose?.();
  };

  const micPressIn = () => {
    if (!isPressToTalk) return;
    startRecording();
  };

  const micPressOut = () => {
    if (!isPressToTalk) return;
    if (isRecording) stopRecording();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}>
      <Animated.View style={[styles.overlay, {opacity: fadeAnim}]}>
        <View style={styles.container}>
          {/* Backdrop - only this should close the modal */}
          <TouchableWithoutFeedback onPress={handleClose}>
            <View style={styles.backdrop} />
          </TouchableWithoutFeedback>

          {/* Sheet - Fixed position, doesn't move with keyboard */}
          <Animated.View
            style={[styles.sheet, {transform: [{translateY: slideAnim}]}]}>
            {/* Header */}
            <LinearGradient
              colors={['#0A66C2', '#0765A2', '#054A8C']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.header}>
              <View style={styles.headerContent}>
                <View style={styles.headerLeft}>
                  <View style={styles.iconContainer}>
                    <Icon name="robot-excited" size={28} color="#fff" />
                    <View style={styles.statusDot} />
                  </View>
                  <View style={styles.headerText}>
                    <Text style={styles.title}>Dynaface AI</Text>
                    <Text style={styles.status}>
                      {voiceServiceReady ? '● Online' : '○ Offline'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={handleClose}
                  style={styles.closeButton}
                  hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}>
                  <Icon name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {/* Chat Area */}
            <View style={styles.chatArea}>
              <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={[
                  styles.chatContainer,
                  {
                    paddingBottom:
                      keyboardHeight > 0 ? keyboardHeight + 20 : 100,
                  },
                ]}
                showsVerticalScrollIndicator={true}
                ListFooterComponent={<>{isTyping && renderTypingIndicator()}</>}
                keyboardDismissMode="on-drag"
                keyboardShouldPersistTaps="handled"
                bounces={true}
                scrollEnabled={true}
                nestedScrollEnabled={true}
                removeClippedSubviews={false}
                scrollEventThrottle={16}
                decelerationRate="normal"
                directionalLockEnabled={true}
                alwaysBounceVertical={true}
                onContentSizeChange={() => {
                  InteractionManager.runAfterInteractions(() => {
                    try {
                      flatListRef.current?.scrollToEnd({animated: true});
                    } catch (e) {}
                  });
                }}
              />

              {/* Recording Overlay */}
              {isRecording && (
                <View
                  style={[
                    styles.recordingOverlay,
                    {bottom: keyboardHeight > 0 ? keyboardHeight + 20 : 100},
                  ]}>
                  <Animated.View
                    style={[
                      styles.waveContainer,
                      {
                        transform: [
                          {
                            scale: waveAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1, 1.5],
                            }),
                          },
                        ],
                        opacity: waveAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.5, 0],
                        }),
                      },
                    ]}>
                    <View style={styles.wave} />
                  </Animated.View>

                  <View style={styles.recordingContent}>
                    <Animated.View
                      style={[
                        styles.recordingIcon,
                        {transform: [{scale: micScaleAnim}]},
                      ]}>
                      <Icon name="microphone" size={32} color="#fff" />
                    </Animated.View>
                    <Text style={styles.recordingText}>
                      {formatDuration(recordingDuration)}
                    </Text>
                    <Text style={styles.recordingSubtext}>
                      {isPressToTalk ? 'Release to send' : 'Tap to stop'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={cancelRecording}
                    style={styles.cancelRecordingButton}>
                    <Icon name="close" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Input Area - Moves up with keyboard */}
              <View style={[styles.inputContainer, {bottom: keyboardHeight}]}>
                <View style={styles.inputWrapper}>
                  <TouchableOpacity
                    onPressIn={micPressIn}
                    onPressOut={micPressOut}
                    style={[
                      styles.micButton,
                      isRecording && styles.micButtonActive,
                    ]}
                    disabled={!voiceServiceReady || isTyping}>
                    <LinearGradient
                      colors={
                        isRecording
                          ? ['#FF4444', '#CC0000']
                          : isTyping
                          ? ['#CCCCCC', '#999999']
                          : ['#0A66C2', '#0765A2']
                      }
                      style={styles.gradientButton}>
                      <Icon
                        name={isRecording ? 'stop' : 'microphone'}
                        size={22}
                        color={isTyping ? '#666' : '#fff'}
                      />
                    </LinearGradient>
                  </TouchableOpacity>

                  <View style={styles.textInputContainer}>
                    <TextInput
                      value={input}
                      onChangeText={setInput}
                      placeholder={
                        isRecording
                          ? 'Listening...'
                          : isTyping
                          ? 'AI is thinking...'
                          : 'Type a message...'
                      }
                      placeholderTextColor="#8E9AAF"
                      style={styles.input}
                      onSubmitEditing={() => handleSend()}
                      multiline
                      maxLength={1000}
                      editable={!isRecording && !isTyping}
                    />
                  </View>

                  <TouchableOpacity
                    onPress={() => handleSend()}
                    style={[
                      styles.sendButton,
                      (!input.trim() || isRecording || isTyping) &&
                        styles.sendButtonDisabled,
                    ]}
                    disabled={!input.trim() || isRecording || isTyping}>
                    <LinearGradient
                      colors={
                        input.trim() && !isRecording && !isTyping
                          ? ['#00B894', '#00C9A7']
                          : ['#E4E9F2', '#D1D8E0']
                      }
                      style={styles.gradientButton}>
                      <Icon
                        name="send"
                        size={20}
                        color={
                          input.trim() && !isRecording && !isTyping
                            ? '#fff'
                            : '#8E9AAF'
                        }
                      />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                {!voiceServiceReady && (
                  <View style={styles.voiceWarning}>
                    <Icon name="microphone-off" size={12} color="#FF6B6B" />
                    <Text style={styles.voiceWarningText}>{voiceStatus}</Text>
                  </View>
                )}
              </View>
            </View>
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.9,
    backgroundColor: BG_COLOR,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00D084',
    position: 'absolute',
    bottom: 2,
    right: 2,
    borderWidth: 2,
    borderColor: '#0A66C2',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  status: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    fontWeight: '500',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatArea: {
    flex: 1,
  },
  chatContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 100,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginVertical: 8,
    alignItems: 'flex-end',
  },
  botWrapper: {
    justifyContent: 'flex-start',
  },
  userWrapper: {
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    marginHorizontal: 4,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  bubbleContainer: {
    maxWidth: '75%',
  },
  userBubbleContainer: {
    alignItems: 'flex-end',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  botBubble: {
    backgroundColor: BOT_BUBBLE,
    borderTopLeftRadius: 4,
    marginLeft: 4,
  },
  userBubble: {
    backgroundColor: USER_BUBBLE,
    borderTopRightRadius: 4,
    marginRight: 4,
  },
  typingBubble: {
    backgroundColor: BOT_BUBBLE,
    borderTopLeftRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginLeft: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageText: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 22,
    fontWeight: '400',
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  timestamp: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 6,
    alignSelf: 'flex-end',
    fontWeight: '500',
  },
  userTimestamp: {
    color: 'rgba(255,255,255,0.7)',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    fontWeight: '500',
  },
  recordingOverlay: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 120,
    backgroundColor: 'rgba(10, 102, 194, 0.95)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0A66C2',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    overflow: 'hidden',
  },
  waveContainer: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  wave: {
    flex: 1,
    borderRadius: 100,
  },
  recordingContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  recordingIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordingText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
  recordingSubtext: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    fontWeight: '500',
  },
  cancelRecordingButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E9F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  micButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 8,
  },
  micButtonActive: {
    shadowColor: '#FF4444',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  gradientButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    marginHorizontal: 8,
    maxHeight: 120,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 20,
    maxHeight: 100,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  voiceWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 4,
  },
  voiceWarningText: {
    fontSize: 12,
    color: '#FF6B6B',
    marginLeft: 6,
    fontWeight: '500',
  },
});

export default AIChatbot;
