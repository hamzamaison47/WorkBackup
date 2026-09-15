/* eslint-disable react-native/no-inline-styles */
/* eslint-disable curly */
/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useEffect, useState, useRef, useMemo} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  Platform,
  KeyboardAvoidingView,
  Animated,
  ActivityIndicator,
  Alert,
  InteractionManager,
  Dimensions,
  TouchableWithoutFeedback,
  Linking,
} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import moment from 'moment';
import {useNavigation} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import usePalette from '../../hooks/usePalette';
import azureAIService from '../../services/AzureAIService';
import VoiceRecordingService from '../../services/VoiceRecordingService';

import {
  chatbotAddMessage,
  chatbotSetMessages,
} from '../../store/slices/chatbotSlice';
import styles from '../../styles/styles';

const {width, height} = Dimensions.get('window');

// Message bubble component
const MessageBubble = React.memo(({item, index}) => {
  const P = usePalette();
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
        styles.AIChat_messageWrapper,
        isUser ? styles.AIChat_userWrapper : styles.AIChat_botWrapper,
        {
          opacity: opacityAnim,
          transform: [{translateX: slideAnim}],
        },
      ]}>
      {!isUser && (
        <View style={styles.AIChat_avatarContainer}>
          <LinearGradient
            colors={[P.primary, P.primary]}
            style={styles.AIChat_avatar}>
            <Icon name="robot-excited" size={22} color={P.onPrimary} />
          </LinearGradient>
        </View>
      )}

      <View
        style={[
          styles.AIChat_bubbleContainer,
          isUser && styles.AIChat_userBubbleContainer,
        ]}>
        <View
          style={[
            styles.AIChat_bubble,
            isUser ? styles.AIChat_userBubble : styles.AIChat_botBubble,
          ]}>
          <Text
            style={[
              styles.AIChat_messageText,
              isUser && styles.AIChat_userMessageText,
            ]}>
            {item.text}
          </Text>
          <Text
            style={[
              styles.AIChat_timestamp,
              isUser && styles.AIChat_userTimestamp,
            ]}>
            {moment(item.timestamp).format('HH:mm')}
          </Text>
        </View>
      </View>

      {isUser && (
        <View style={styles.AIChat_avatarContainer}>
          <LinearGradient
            colors={[P.primary, P.primary]}
            style={styles.AIChat_avatar}>
            <Icon name="account" size={22} color={P.onPrimary} />
          </LinearGradient>
        </View>
      )}
    </Animated.View>
  );
});

/**
 * GENERIC AI Chatbot
 * Works with ANY service that provides getFunctionDefinitions() and execute()
 */
const AIChatbot = ({visible, onClose, serviceInstance}) => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const P = usePalette();

  const {userData} = useSelector(s => s.user || {});
  const messages = useSelector(s => s.chatbot?.messages || []);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [voiceServiceReady, setVoiceServiceReady] = useState(false);

  const processingRef = useRef(false);
  const flatListRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;
  const micScaleAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const recordingTimer = useRef(null);
  const isMountedRef = useRef(true);
  const permissionInitializedRef = useRef(false);
  const endLockRef = useRef(false);

  /* -------------------- Initialization -------------------- */
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearTimers();
      VoiceRecordingService.cancelRecording?.();
    };
  }, []);

  useEffect(() => {
    if (visible) {
      // Animations
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

      // Check permissions
      if (!permissionInitializedRef.current) {
        permissionInitializedRef.current = true;
        initializePermission();
      } else {
        VoiceRecordingService.checkPermission().then(hasPerm => {
          setVoiceServiceReady(hasPerm);
        });
      }

      // Welcome message
      if (!messages || messages.length === 0) {
        const welcomeMsg = {
          id: 'welcome-1',
          text: "👋 Hello! I'm your AI Assistant. How may I help you today?",
          from: 'bot',
          timestamp: Date.now(),
        };
        dispatch(chatbotSetMessages([welcomeMsg]));
      }
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
      clearTimers();
      VoiceRecordingService.cancelRecording?.();
    }
  }, [visible]);

  const initializePermission = async () => {
    const hasPerm = await VoiceRecordingService.checkPermission();
    if (hasPerm) {
      setVoiceServiceReady(true);
    } else {
      const granted = await VoiceRecordingService.requestPermission();
      setVoiceServiceReady(granted);
    }
  };

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

  const clearTimers = () => {
    if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
      recordingTimer.current = null;
    }
  };

  /* -------------------- Voice Recording -------------------- */
  const startRecording = async () => {
    if (!voiceServiceReady) {
      Alert.alert('Voice Not Ready', 'Please type instead.');
      return;
    }

    try {
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

  /* -------------------- Navigation -------------------- */
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

  /**
   * GENERIC: Send message and handle AI response
   * Works with any service that implements getFunctionDefinitions() and execute()
   * In Foundry Agent mode, serviceInstance is not needed — the agent handles tools via MCP.
   */
  const handleSend = async (textOverride, preferredLanguageOverride) => {
    const text = (textOverride ?? input).trim();
    if (!text) return;
    if (processingRef.current) return;

    // In Foundry Agent mode, serviceInstance is not required
    const isFoundryMode = azureAIService.useFoundryAgent;
    if (!isFoundryMode && !serviceInstance) {
      addMessage('Service not configured. Please contact support.', 'bot');
      return;
    }

    processingRef.current = true;
    addMessage(text, 'user');
    setInput('');
    setIsTyping(true);

    try {
      // Get functions from the service (only needed in direct OpenAI mode)
      const functions = isFoundryMode
        ? []
        : serviceInstance.getFunctionDefinitions();
      const langHint = preferredLanguageOverride || 'auto';

      // Foundry Agent mode needs longer timeout (agent does MCP calls internally)
      const timeoutMs = isFoundryMode ? 65000 : 30000;
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('AI response timeout')), timeoutMs);
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
        // In Foundry mode, only navigation function_calls come through
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

  /**
   * GENERIC: Handle function call execution
   * Delegates to the service's execute() method
   */
  const handleFunctionCall = async functionCall => {
    try {
      // Special handling for navigation
      if (functionCall.function === 'navigate_to_screen') {
        const {screenName, message} = functionCall.parameters || {};
        if (message) addMessage(message, 'bot');
        setTimeout(() => navigateToScreen(screenName), 700);
        return;
      }

      // Execute function through service (generic)
      const result = await serviceInstance.execute(
        functionCall.function,
        functionCall.parameters,
        userData,
      );

      if (!result?.success) {
        await handleFunctionError(functionCall, result);
        return;
      }

      // Handle navigation action
      if (result.action === 'navigate') {
        if (result.message) addMessage(result.message, 'bot');
        setTimeout(
          () => navigateToScreen(result.screenName, result.params || {}),
          700,
        );
        return;
      }

      // Continue conversation with result
      await handleFunctionSuccess(functionCall, result);
    } catch (error) {
      addMessage('Failed to process request. Please try again.', 'bot');
    }
  };

  /**
   * GENERIC: Handle function error
   */
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
        availableFunctions: serviceInstance.getFunctionDefinitions(),
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

  /**
   * GENERIC: Handle function success
   */
  const handleFunctionSuccess = async (functionCall, result) => {
    try {
      const continueResponse = await azureAIService.continueAfterFunction({
        previousMessages: messages,
        functionName: functionCall.function,
        functionResult: result,
        userData,
        preferredLanguage: 'auto',
        availableFunctions: serviceInstance.getFunctionDefinitions(),
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

  /* -------------------- Render -------------------- */
  const renderItem = ({item, index}) => {
    return <MessageBubble item={item} index={index} />;
  };

  const renderTypingIndicator = () => (
    <View style={[styles.AIChat_messageWrapper, styles.AIChat_botWrapper]}>
      <View style={styles.AIChat_avatarContainer}>
        <LinearGradient
          colors={[P.primary, P.primary]}
          style={styles.AIChat_avatar}>
          <Icon name="robot-excited" size={22} color={P.onPrimary} />
        </LinearGradient>
      </View>
      <View style={[styles.AIChat_bubble, styles.AIChat_typingBubble]}>
        <View style={styles.AIChat_typingContainer}>
          <ActivityIndicator size="small" color={P.primaryStrong} />
          <Text style={styles.AIChat_typingText}>Dynaface is typing...</Text>
        </View>
      </View>
    </View>
  );

  const handleClose = () => {
    if (isRecording) cancelRecording();
    clearTimers();
    onClose?.();
  };

  const micPressIn = async () => {
    if (!voiceServiceReady) {
      const granted = await VoiceRecordingService.requestPermission();
      if (granted) {
        setVoiceServiceReady(true);
        startRecording();
      } else {
        Alert.alert(
          'Microphone Access Required',
          'Voice input requires microphone access.',
          [
            {text: 'Cancel', style: 'cancel'},
            {text: 'Open Settings', onPress: () => Linking.openSettings()},
          ],
        );
      }
      return;
    }
    startRecording();
  };

  const micPressOut = () => {
    if (isRecording) stopRecording();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}>
      <Animated.View style={[styles.AIChat_overlay, {opacity: fadeAnim}]}>
        <View style={styles.AIChat_container}>
          <TouchableWithoutFeedback onPress={handleClose}>
            <View style={styles.AIChat_backdrop} />
          </TouchableWithoutFeedback>

          <Animated.View
            style={[
              styles.AIChat_sheet,
              {transform: [{translateY: slideAnim}]},
            ]}>
            {/* Header */}
            <LinearGradient
              colors={[P.primary, P.primary]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.AIChat_header}>
              <View style={styles.AIChat_headerContent}>
                <View style={styles.AIChat_headerLeft}>
                  <View style={styles.AIChat_iconContainer}>
                    <Icon name="robot-excited" size={28} color="#fff" />
                    <View style={styles.AIChat_statusDot} />
                  </View>
                  <View style={styles.AIChat_headerText}>
                    <Text style={styles.AIChat_title}>Dynaface AI</Text>
                    <Text style={styles.AIChat_status}>
                      {voiceServiceReady ? '● Online' : '○ Offline'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={handleClose}
                  style={styles.AIChat_closeButton}
                  hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}>
                  <Icon name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {/* Chat Area */}
            <View style={styles.AIChat_chatArea}>
              <KeyboardAvoidingView
                style={{flex: 1}}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={0}>
                <FlatList
                  ref={flatListRef}
                  data={messages}
                  renderItem={renderItem}
                  keyExtractor={item => item.id}
                  contentContainerStyle={styles.AIChat_chatContainer}
                  showsVerticalScrollIndicator={true}
                  ListFooterComponent={
                    <>{isTyping && renderTypingIndicator()}</>
                  }
                  keyboardDismissMode="on-drag"
                  keyboardShouldPersistTaps="handled"
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
                  <View style={styles.AIChat_recordingOverlay}>
                    <Animated.View
                      style={[
                        styles.AIChat_waveContainer,
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
                      <View style={styles.AIChat_wave} />
                    </Animated.View>

                    <View style={styles.AIChat_recordingContent}>
                      <Animated.View
                        style={[
                          styles.AIChat_recordingIcon,
                          {transform: [{scale: micScaleAnim}]},
                        ]}>
                        <Icon name="microphone" size={32} color="#fff" />
                      </Animated.View>
                      <Text style={styles.AIChat_recordingText}>
                        {formatDuration(recordingDuration)}
                      </Text>
                      <Text style={styles.AIChat_recordingSubtext}>
                        Release to send
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={cancelRecording}
                      style={styles.AIChat_cancelRecordingButton}>
                      <Icon name="close" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}
              </KeyboardAvoidingView>

              {/* Input Area */}
              <View style={styles.AIChat_inputContainer}>
                <View style={styles.AIChat_inputWrapper}>
                  <TouchableOpacity
                    onPressIn={micPressIn}
                    onPressOut={micPressOut}
                    style={[
                      styles.AIChat_micButton,
                      isRecording && styles.AIChat_micButtonActive,
                      !voiceServiceReady &&
                        !isRecording &&
                        styles.AIChat_micButtonDisabled,
                    ]}
                    disabled={isTyping}>
                    <LinearGradient
                      colors={
                        isRecording
                          ? ['#FF4444', '#CC0000']
                          : !voiceServiceReady || isTyping
                          ? ['#CCCCCC', '#999999']
                          : [P.primary, P.primary]
                      }
                      style={styles.AIChat_gradientButton}>
                      <Icon
                        name={isRecording ? 'stop' : 'microphone'}
                        size={22}
                        color={
                          !voiceServiceReady || isTyping ? '#888' : P.onPrimary
                        }
                      />
                    </LinearGradient>
                  </TouchableOpacity>

                  <View style={styles.AIChat_textInputContainer}>
                    <TextInput
                      value={input}
                      onChangeText={setInput}
                      placeholder={
                        isRecording
                          ? 'Listening...'
                          : isTyping
                          ? 'Dynaface is typing...'
                          : 'Type a message...'
                      }
                      placeholderTextColor="#8E9AAF"
                      style={styles.AIChat_input}
                      onSubmitEditing={() => handleSend()}
                      multiline
                      maxLength={1000}
                      editable={!isRecording && !isTyping}
                    />
                  </View>

                  <TouchableOpacity
                    onPress={() => handleSend()}
                    style={[
                      styles.AIChat_sendButton,
                      (!input.trim() || isRecording || isTyping) &&
                        styles.AIChat_sendButtonDisabled,
                    ]}
                    disabled={!input.trim() || isRecording || isTyping}>
                    <LinearGradient
                      colors={
                        input.trim() && !isRecording && !isTyping
                          ? ['#00b875', '#00c96b']
                          : ['#E4E9F2', '#D1D8E0']
                      }
                      style={styles.AIChat_gradientButton}>
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
                  <View style={styles.AIChat_voiceWarning}>
                    <Icon name="microphone-off" size={12} color="#FF6B6B" />
                    <Text style={styles.AIChat_voiceWarningText}>
                      Tap mic to enable voice access
                    </Text>
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

export default AIChatbot;
