/* eslint-disable curly */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useState, useRef} from 'react';
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
} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import moment from 'moment';
import {useNavigation} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

import azureAIService from '../../services/AzureAIService';
import LeaveService from '../../services/LeaveService';
import VoiceRecordingService from '../../services/VoiceRecordingService';

import {
  chatbotAddMessage,
  chatbotSetMessages,
} from '../../store/slices/chatbotSlice';

const AIChatbot = ({visible, onClose}) => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const {userData} = useSelector(s => s.user || {});
  const messages = useSelector(s => s.chatbot?.messages || []);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const processingRef = useRef(false);
  const flatListRef = useRef(null);
  const leaveService = useRef(new LeaveService());
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const micScaleAnim = useRef(new Animated.Value(1)).current;
  const recordingTimer = useRef(null);

  /* -------------------- Initialize -------------------- */
  useEffect(() => {
    if (!visible) return;

    if (!messages || messages.length === 0) {
      const welcomeMsg = {
        id: 'welcome-1',
        text: "👋 Hello! I'm your Dynaface AI Assistant. How may I assist you?",
        from: 'bot',
        timestamp: Date.now(),
      };
      dispatch(chatbotSetMessages([welcomeMsg]));
    }

    return () => {
      if (isRecording) {
        VoiceRecordingService.cancelRecording();
      }
      clearTimers();
    };
  }, [visible]);

  /* -------------------- Auto-scroll -------------------- */
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      InteractionManager.runAfterInteractions(() => {
        flatListRef.current?.scrollToEnd({animated: true});
      });
    }
  }, [messages]);

  useEffect(() => {
    if (isTyping && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({animated: true});
      }, 500);
    }
  }, [isTyping]);

  const clearTimers = () => {
    if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
      recordingTimer.current = null;
    }
  };

  /* -------------------- Animations -------------------- */
  useEffect(() => {
    if (isTyping) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isTyping]);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(micScaleAnim, {
            toValue: 1.3,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(micScaleAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      micScaleAnim.setValue(1);
    }
  }, [isRecording]);

  /* -------------------- Voice Recording -------------------- */
  const startRecording = async () => {
    try {
      console.log('🎤 Starting recording...');
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration timer
      recordingTimer.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      const result = await VoiceRecordingService.startRecording();

      if (!result.success) {
        console.error('❌ Recording failed to start:', result.error);
        Alert.alert('Recording Error', result.error);
        stopRecording();
      }
    } catch (error) {
      console.error('❌ Start recording error:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
      stopRecording();
    }
  };

  const stopRecording = async () => {
    try {
      console.log('🛑 Stopping recording...');
      clearTimers();
      setIsRecording(false);

      // Wait a moment before stopping to ensure we get results
      await new Promise(resolve => setTimeout(resolve, 300));

      const result = await VoiceRecordingService.stopRecording();

      if (result.success && result.text) {
        console.log('✅ Transcription:', result.text);
        // Put transcribed text in the input field
        setInput(result.text);
      } else {
        console.warn('⚠️ No transcription:', result.error);
        if (result.error) {
          Alert.alert('Transcription', result.error);
        }
      }

      setRecordingDuration(0);
    } catch (error) {
      console.error('❌ Stop recording error:', error);
      Alert.alert('Error', 'Failed to process recording.');
      setRecordingDuration(0);
    }
  };

  const cancelRecording = async () => {
    try {
      console.log('🗑️ Cancelling recording...');
      clearTimers();
      setIsRecording(false);
      setRecordingDuration(0);
      await VoiceRecordingService.cancelRecording();
    } catch (error) {
      console.error('❌ Cancel recording error:', error);
    }
  };

  /* -------------------- Message Handling -------------------- */
  const addMessage = (text, from) => {
    const newMsg = {
      id: `${Date.now()}-${Math.random()}`,
      text: String(text),
      from,
      timestamp: Date.now(),
    };

    dispatch(chatbotAddMessage(newMsg));

    // Auto-scroll after message is added
    setTimeout(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd({animated: true});
      }
    }, 100);
  };

  /* -------------------- Navigation -------------------- */
  const navigateToScreen = (screenName, params = {}) => {
    console.log(`🚀 Navigating to: ${screenName}`);
    onClose();

    setTimeout(() => {
      navigation.navigate(screenName, {
        employeeId: userData?.employeeId,
        employeeName: userData?.employeeName,
        WorkerRecId: userData?.WorkerRecId,
        userData: userData,
        cameFrom: 'MainDashboard',
        ...params,
      });
    }, 300);
  };

  /* -------------------- Main Send Handler -------------------- */
  const handleSend = async textOverride => {
    const text = (textOverride || input).trim();
    if (!text || processingRef.current) return;

    processingRef.current = true;
    setInput('');

    if (!textOverride) {
      addMessage(text, 'user');
    }

    setIsTyping(true);

    try {
      const functions = leaveService.current.getFunctionDefinitions();

      // Get language hint (optional)
      const langHint = text.match(/[آ-ی]/) ? 'auto' : 'en';

      const aiResponse = await azureAIService.chat({
        userMessage: text,
        conversationHistory: messages,
        availableFunctions: functions,
        userData: userData,
        preferredLanguage: langHint,
      });

      if (aiResponse.type === 'function_call') {
        await handleFunctionCall(aiResponse);
      } else {
        addMessage(aiResponse.text, 'bot');
      }
    } catch (err) {
      console.error('❌ Chat error:', err);
      addMessage('Sorry, I encountered an error. Please try again.', 'bot');
    } finally {
      processingRef.current = false;
      setIsTyping(false);
    }
  };

  /* -------------------- Handle Function Call -------------------- */
  const handleFunctionCall = async functionCall => {
    try {
      console.log('🔧 Executing function:', functionCall.function);
      console.log('📥 Parameters:', functionCall.parameters);

      // SPECIAL HANDLING FOR NAVIGATION
      if (functionCall.function === 'navigate_to_screen') {
        const {screenName, message} = functionCall.parameters;

        if (message) {
          addMessage(message, 'bot');
        }

        setTimeout(() => {
          navigateToScreen(screenName);
        }, 1000);

        processingRef.current = false;
        return;
      }

      // Execute other functions normally
      const result = await leaveService.current.execute(
        functionCall.function,
        functionCall.parameters,
        userData,
      );

      console.log('📤 Function result:', result);

      if (!result.success) {
        await handleFunctionError(functionCall, result);
        return;
      }

      // Check if result contains navigation action
      if (result.action === 'navigate') {
        if (result.message) {
          addMessage(result.message, 'bot');
        }

        setTimeout(() => {
          navigateToScreen(result.screenName, result.params || {});
        }, 1000);

        processingRef.current = false;
        return;
      }

      // Handle successful function execution
      await handleFunctionSuccess(functionCall, result);
    } catch (error) {
      console.error('❌ Function execution error:', error);
      addMessage('I failed to process your request. Please try again.', 'bot');
    }
  };

  /* -------------------- Handle Function Errors -------------------- */
  const handleFunctionError = async (functionCall, result) => {
    console.log('⚠️ Function error:', result.error);

    const errorContext = {
      ...result,
      originalFunction: functionCall.function,
      originalParameters: functionCall.parameters,
    };

    const continueResponse = await azureAIService.continueAfterFunction({
      previousMessages: messages,
      functionName: functionCall.function,
      functionResult: errorContext,
      userData,
      preferredLanguage: 'auto',
      availableFunctions: leaveService.current.getFunctionDefinitions(),
      toolCallId: functionCall.toolCallId,
    });

    addMessage(continueResponse.text, 'bot');

    if (continueResponse.type === 'function_call') {
      await handleFunctionCall(continueResponse);
    }
  };

  /* -------------------- Handle Function Success -------------------- */
  const handleFunctionSuccess = async (functionCall, result) => {
    console.log('✅ Function succeeded');

    const continueResponse = await azureAIService.continueAfterFunction({
      previousMessages: messages,
      functionName: functionCall.function,
      functionResult: result,
      userData,
      preferredLanguage: 'auto',
      availableFunctions: leaveService.current.getFunctionDefinitions(),
      toolCallId: functionCall.toolCallId,
    });

    addMessage(continueResponse.text, 'bot');

    if (continueResponse.type === 'function_call') {
      await handleFunctionCall(continueResponse);
    }
  };

  /* -------------------- Format Recording Duration -------------------- */
  const formatDuration = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /* -------------------- UI Components -------------------- */
  const renderItem = ({item}) => {
    const isUser = item.from === 'user';

    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userContainer : styles.botContainer,
        ]}>
        {!isUser && (
          <LinearGradient colors={['#667eea', '#764ba2']} style={styles.avatar}>
            <Icon name="smart-toy" size={20} color="#fff" />
          </LinearGradient>
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
          <LinearGradient colors={['#00c6ff', '#0072ff']} style={styles.avatar}>
            <Icon name="person" size={20} color="#fff" />
          </LinearGradient>
        )}
      </View>
    );
  };

  const renderTypingIndicator = () => (
    <View style={[styles.messageContainer, styles.botContainer]}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.avatar}>
        <Animated.View style={{transform: [{scale: pulseAnim}]}}>
          <Icon name="smart-toy" size={20} color="#fff" />
        </Animated.View>
      </LinearGradient>
      <View
        style={[
          styles.bubble,
          styles.botBubble,
          {flexDirection: 'row', alignItems: 'center'},
        ]}>
        <ActivityIndicator size="small" color="#667eea" />
        <Text style={styles.typingText}>Thinking...</Text>
      </View>
    </View>
  );

  const handleClose = () => {
    if (isRecording) {
      cancelRecording();
    }
    clearTimers();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={handleClose}>
          <TouchableOpacity
            style={styles.sheet}
            activeOpacity={1}
            onPress={e => e.stopPropagation()}>
            {/* Header */}
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={styles.header}>
              <View style={styles.headerLeft}>
                <Icon
                  name="smart-toy"
                  size={32}
                  color="#fff"
                  style={{marginRight: 12}}
                />
                <View>
                  <Text style={styles.title}>Dynaface AI</Text>
                  <Text style={styles.status}>● Online</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeButton}>
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>

            {/* Messages Container with KeyboardAvoidingView */}
            <KeyboardAvoidingView
              style={styles.chatArea}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
              {/* Messages */}
              <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.chatContainer}
                showsVerticalScrollIndicator={false}
                ListFooterComponent={<>{isTyping && renderTypingIndicator()}</>}
                keyboardDismissMode="on-drag"
                keyboardShouldPersistTaps="handled"
                onContentSizeChange={() => {
                  InteractionManager.runAfterInteractions(() => {
                    flatListRef.current?.scrollToEnd({animated: true});
                  });
                }}
              />

              {/* Recording Indicator */}
              {isRecording && (
                <View style={styles.recordingIndicator}>
                  <View style={styles.recordingContent}>
                    <Animated.View style={{transform: [{scale: micScaleAnim}]}}>
                      <Icon name="mic" size={24} color="#ff4444" />
                    </Animated.View>
                    <Text style={styles.recordingText}>
                      Recording... {formatDuration(recordingDuration)}
                    </Text>
                    <TouchableOpacity
                      onPress={cancelRecording}
                      style={styles.cancelButton}>
                      <Icon name="close" size={20} color="#666" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Input Bar */}
              <View style={styles.inputRow}>
                {/* Voice Button */}
                <TouchableOpacity
                  onPress={isRecording ? stopRecording : startRecording}
                  onLongPress={startRecording}
                  style={styles.iconButton}>
                  <LinearGradient
                    colors={
                      isRecording
                        ? ['#ff4444', '#cc0000']
                        : ['#667eea', '#764ba2']
                    }
                    style={styles.iconButtonGradient}>
                    <Animated.View
                      style={
                        isRecording ? {transform: [{scale: micScaleAnim}]} : {}
                      }>
                      <Icon
                        name={isRecording ? 'stop' : 'mic'}
                        size={24}
                        color="#fff"
                      />
                    </Animated.View>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Text Input */}
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  placeholder={
                    isRecording
                      ? 'Recording...'
                      : 'Type or speak your message...'
                  }
                  placeholderTextColor="#999"
                  style={styles.input}
                  onSubmitEditing={() => handleSend()}
                  multiline
                  maxLength={500}
                  editable={!isRecording}
                  color="#000000"
                />

                {/* Send Button */}
                <TouchableOpacity
                  onPress={() => handleSend()}
                  style={styles.iconButton}
                  disabled={!input.trim() || isRecording}>
                  <LinearGradient
                    colors={
                      input.trim() && !isRecording
                        ? ['#43e97b', '#38f9d7']
                        : ['#ddd', '#ccc']
                    }
                    style={styles.iconButtonGradient}>
                    <Icon name="send" size={24} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

/* -------------------- Styles -------------------- */
const styles = StyleSheet.create({
  overlay: {flex: 1},
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    height: '90%',
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
  },
  headerLeft: {flexDirection: 'row', alignItems: 'center'},
  title: {fontSize: 18, fontWeight: '700', color: '#fff'},
  status: {fontSize: 12, color: '#e0e0e0', marginTop: 2},
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
    paddingTop: 16,
    paddingBottom: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 6,
    alignItems: 'flex-end',
  },
  botContainer: {justifyContent: 'flex-start'},
  userContainer: {justifyContent: 'flex-end'},
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  bubble: {
    maxWidth: '70%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  botBubble: {backgroundColor: '#ffffff', borderBottomLeftRadius: 4},
  userBubble: {backgroundColor: '#667eea', borderBottomRightRadius: 4},
  messageText: {fontSize: 15, color: '#1a1a1a', lineHeight: 20},
  userMessageText: {color: '#ffffff'},
  timestamp: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  typingText: {
    fontSize: 14,
    color: '#667eea',
    fontStyle: 'italic',
    marginLeft: 8,
  },
  recordingIndicator: {
    backgroundColor: '#fff3cd',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#ffeaa7',
  },
  recordingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingText: {
    fontSize: 14,
    color: '#856404',
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
  cancelButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8d7da',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  iconButton: {width: 48, height: 48},
  iconButtonGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 100,
    borderRadius: 24,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
    marginHorizontal: 8,
    fontSize: 15,
    paddingTop: 12,
    color: '#000000',
  },
});

export default AIChatbot;
