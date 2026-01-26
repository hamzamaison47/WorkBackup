/* eslint-disable no-unused-vars */
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
} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import moment from 'moment';
import {useNavigation} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

import azureAIService from '../../services/AzureAIService';
import LeaveService from '../../services/LeaveService';
// import VoiceRecordingService from '../../services/VoiceRecordingService';

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
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [language, setLanguage] = useState('en');

  // Voice states - DISABLED
  // const [isRecording, setIsRecording] = useState(false);
  // const [recordingDuration, setRecordingDuration] = useState(0);
  // const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  const processingRef = useRef(false);
  const flatListRef = useRef(null);
  const leaveService = useRef(new LeaveService());
  const pulseAnim = useRef(new Animated.Value(1)).current;
  // const recordingTimer = useRef(null);
  // const micScaleAnim = useRef(new Animated.Value(1)).current;

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
      // Voice cleanup disabled
      // if (isRecording) {
      //   VoiceRecordingService.cancelRecording();
      // }
      // clearTimers();
    };
  }, [visible]);

  // const clearTimers = () => {
  //   if (recordingTimer.current) {
  //     clearInterval(recordingTimer.current);
  //     recordingTimer.current = null;
  //   }
  // };

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

  // Voice animation disabled
  // useEffect(() => {
  //   if (isRecording) {
  //     Animated.loop(
  //       Animated.sequence([
  //         Animated.timing(micScaleAnim, {
  //           toValue: 1.3,
  //           duration: 500,
  //           useNativeDriver: true,
  //         }),
  //         Animated.timing(micScaleAnim, {
  //           toValue: 1,
  //           duration: 500,
  //           useNativeDriver: true,
  //         }),
  //       ]),
  //     ).start();
  //   } else {
  //     micScaleAnim.setValue(1);
  //   }
  // }, [isRecording]);

  /* -------------------- Voice Recording - DISABLED -------------------- */
  // const startRecording = async () => {
  //   // Disabled - do nothing
  // };

  // const stopRecording = async () => {
  //   // Disabled - do nothing
  // };

  // const cancelRecording = async () => {
  //   // Disabled - do nothing
  // };

  /* -------------------- Message Handling -------------------- */
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

  /* -------------------- Detect Language -------------------- */
  /* -------------------- Detect Language -------------------- */
  const detectLanguage = text => {
    // Very simple detection - just to give AI a hint
    const cleanText = text.trim();

    // Check script type
    if (/[آ-ی]/.test(cleanText)) {
      // Could be Urdu or Arabic - let AI decide
      return 'auto';
    }

    if (/[a-zA-Z]/.test(cleanText)) {
      return 'en';
    }

    return 'en'; // Default
  };

  /* -------------------- Detect Attendance Intent -------------------- */
  const detectAttendanceIntent = text => {
    // Remove this entire function or leave it empty
    // AI will handle intent detection
    return false;
  };

  /* -------------------- Detect Attendance Intent -------------------- */
  // const detectAttendanceIntent = text => {
  //   // Simplify - just check for any attendance-related keywords in any language
  //   // AI will handle the actual intent detection
  //   const lowerText = text.toLowerCase().trim();

  //   // Very basic keywords in multiple languages
  //   const keywords = [
  //     // English
  //     'attendance',
  //     'mark',
  //     'punch',
  //     'check in',
  //     'check out',
  //     // Roman Urdu
  //     'haazri',
  //     'hazri',
  //     'attendance',
  //     'mark',
  //     // Urdu script (partial)
  //     'حاضری',
  //     'حاضر',
  //     'مارک',
  //     // Arabic
  //     'حضور',
  //     'تسجيل',
  //   ];

  //   return keywords.some(keyword => {
  //     if (keyword.includes(' ')) {
  //       return lowerText.includes(keyword.toLowerCase());
  //     }
  //     const words = lowerText.split(/\s+/);
  //     return words.some(word => word.includes(keyword.toLowerCase()));
  //   });
  // };

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
  // const handleSend = async textOverride => {
  //   const text = (textOverride || input).trim();
  //   if (!text || processingRef.current) {
  //     return;
  //   }

  //   processingRef.current = true;
  //   setInput('');
  //   setShowQuickActions(false);

  //   if (!textOverride) {
  //     addMessage(text, 'user');
  //   }

  //   // Detect language - simplified
  //   const detectedLanguage = detectLanguage(text);
  //   console.log(`🌍 Language setting: ${detectedLanguage}`);

  //   setIsTyping(true);

  //   try {
  //     const functions = leaveService.current.getFunctionDefinitions();

  //     console.log('💬 User message:', text);

  //     const aiResponse = await azureAIService.chat({
  //       userMessage: text,
  //       conversationHistory: messages,
  //       availableFunctions: functions,
  //       userData: userData,
  //       preferredLanguage: detectedLanguage,
  //     });

  //     console.log('🤖 AI response:', aiResponse);

  //     if (aiResponse.type === 'function_call') {
  //       await handleFunctionCall(aiResponse);
  //     } else {
  //       addMessage(aiResponse.text, 'bot');
  //     }
  //   } catch (err) {
  //     console.error('❌ Chat error:', err);

  //     // Error message in appropriate language
  //     const errorMessage =
  //       detectedLanguage === 'ur'
  //         ? 'معذرت، مجھے ایک خرابی کا سامنا ہوا۔ براہ کرم دوبارہ کوشش کریں۔'
  //         : detectedLanguage === 'ar'
  //         ? 'عذراً، واجهت خطأ. يرجى المحاولة مرة أخرى.'
  //         : 'Sorry, I encountered an error. Please try again.';

  //     addMessage(errorMessage, 'bot');
  //   } finally {
  //     processingRef.current = false;
  //     setIsTyping(false);
  //   }
  // };

  /* -------------------- Handle Function Call -------------------- */
  const handleFunctionCall = async functionCall => {
    try {
      console.log('🔧 Executing function:', functionCall.function);
      console.log('📥 Parameters:', functionCall.parameters);

      // SPECIAL HANDLING FOR NAVIGATION
      if (functionCall.function === 'navigate_to_screen') {
        // Handle navigation immediately
        const {screenName, message} = functionCall.parameters;

        // Show message if provided
        if (message) {
          addMessage(message, 'bot');
        }

        // Navigate after a short delay
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
        // Handle navigation from other functions
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

      // Get language from current context
      const lastUserMessage = messages[messages.length - 1];
      const lang =
        lastUserMessage && lastUserMessage.from === 'user'
          ? detectLanguage(lastUserMessage.text)
          : 'en';

      const errorMsg =
        lang === 'ur'
          ? 'میں آپ کی درخواست پر کارروائی کرنے میں ناکام رہا۔ براہ کرم دوبارہ کوشش کریں۔'
          : lang === 'ar'
          ? 'فشلت في معالجة طلبك. يرجى المحاولة مرة أخرى.'
          : 'I failed to process your request. Please try again.';

      addMessage(errorMsg, 'bot');
    }
  };
  // const handleSend = async textOverride => {
  //   const text = (textOverride || input).trim();
  //   if (!text || processingRef.current) {
  //     return;
  //   }

  //   processingRef.current = true;
  //   setInput('');
  //   setShowQuickActions(false);

  //   if (!textOverride) {
  //     addMessage(text, 'user');
  //   }

  //   // Detect language - let AI handle the nuances
  //   const detectedLanguage = detectLanguage(text);
  //   console.log(`🌍 Language setting: ${detectedLanguage}`);

  //   // Check for attendance intent
  //   if (detectAttendanceIntent(text)) {
  //     processingRef.current = false;

  //     // Don't send a response here - let AI handle it
  //     // This way AI can respond in the correct language
  //   }

  //   setIsTyping(true);

  //   try {
  //     const functions = leaveService.current.getFunctionDefinitions();

  //     console.log('💬 User message:', text);
  //     console.log('🌍 Language mode:', detectedLanguage);

  //     const aiResponse = await azureAIService.chat({
  //       userMessage: text,
  //       conversationHistory: messages,
  //       availableFunctions: functions,
  //       userData: userData,
  //       preferredLanguage: detectedLanguage, // 'auto' or actual language
  //     });

  //     console.log('🤖 AI response:', aiResponse);

  //     if (aiResponse.type === 'function_call') {
  //       await handleFunctionCall(aiResponse);
  //     } else {
  //       addMessage(aiResponse.text, 'bot');
  //     }
  //   } catch (err) {
  //     console.error('❌ Chat error:', err);

  //     // Let AI decide error message language based on context
  //     addMessage('Sorry, I encountered an error. Please try again.', 'bot');
  //   } finally {
  //     processingRef.current = false;
  //     setIsTyping(false);
  //   }
  // };

  /* -------------------- Detect Language -------------------- */
  // const detectLanguage = text => {
  //   // Arabic detection - check for Arabic Unicode range
  //   const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
  //   if (arabicPattern.test(text)) {
  //     return 'ar';
  //   }

  //   // Urdu detection - check for Urdu Unicode range
  //   const urduPattern = /[\u0600-\u06FF]/;

  //   // Roman Urdu keywords (Urdu written in English)
  //   const romanUrduKeywords = [
  //     'karo',
  //     'karein',
  //     'karna',
  //     'hai',
  //     'hain',
  //     'ka',
  //     'ki',
  //     'ko',
  //     'mera',
  //     'meri',
  //     'mere',
  //     'haazri',
  //     'chutti',
  //     'lagao',
  //     'dikhaao',
  //     'batao',
  //     'dekhna',
  //     'chahiye',
  //     'chahte',
  //     'kya',
  //     'kyun',
  //     'kab',
  //     'balance',
  //     'check',
  //     'kitne',
  //     'kitni',
  //     'din',
  //     'mahina',
  //     'saal',
  //     'aaj',
  //     'kal',
  //     'parso',
  //     'abhi',
  //     'phir',
  //     'wapas',
  //     'shukria',
  //   ];

  //   const lowerText = text.toLowerCase();
  //   const hasRomanUrdu = romanUrduKeywords.some(keyword =>
  //     lowerText.split(/\s+/).includes(keyword),
  //   );

  //   if (urduPattern.test(text) || hasRomanUrdu) {
  //     return 'ur';
  //   }

  //   // Default to English
  //   return 'en';
  // };

  /* -------------------- Detect Attendance Intent -------------------- */
  // const detectAttendanceIntent = text => {
  //   const lowerText = text.toLowerCase().trim();

  //   // English keywords
  //   const englishKeywords = [
  //     'mark attendance',
  //     'attendance',
  //     'mark my attendance',
  //     'punch in',
  //     'punch out',
  //     'clock in',
  //     'clock out',
  //     'check in',
  //     'check out',
  //     'present',
  //     'mark present',
  //     'attendance mark',
  //     'register attendance',
  //     'log attendance',
  //     'attendance today',
  //     'today attendance',
  //     'mark today',
  //     'i want to mark',
  //     'need to mark',
  //     'marking attendance',
  //   ];

  //   // Roman Urdu keywords (Urdu written in English letters)
  //   const romanUrduKeywords = [
  //     'haazri',
  //     'hazri',
  //     'haaziri',
  //     'haziri',
  //     'haazri lagao',
  //     'hazri lagao',
  //     'haazri lagaao',
  //     'haazri karo',
  //     'hazri karo',
  //     'attendance karo',
  //     'present karo',
  //     'mark karo',
  //     'lagao haazri',
  //     'meri haazri',
  //     'meri hazri',
  //     'attendance laga do',
  //     'haazri mark karo',
  //     'aaj ki haazri',
  //     'aaj haazri',
  //   ];

  //   // Urdu keywords (in Urdu script)
  //   const urduKeywords = [
  //     'حاضری',
  //     'حاضري',
  //     'ہاضری',
  //     'حاضری لگاؤ',
  //     'حاضری لگائیں',
  //     'حاضری کرو',
  //     'حاضری مارک کریں',
  //     'میری حاضری',
  //     'آج کی حاضری',
  //   ];

  //   // Arabic keywords
  //   const arabicKeywords = [
  //     'حضور',
  //     'الحضور',
  //     'تسجيل الحضور',
  //     'سجل الحضور',
  //     'حضوري',
  //     'الحضور اليوم',
  //     'تسجيل',
  //     'احضر',
  //     'حاضر',
  //   ];

  //   // Combine all keywords
  //   const allKeywords = [
  //     ...englishKeywords,
  //     ...romanUrduKeywords,
  //     ...urduKeywords,
  //     ...arabicKeywords,
  //   ];

  //   return allKeywords.some(keyword => {
  //     // For multi-word phrases, check if text includes the phrase
  //     if (keyword.includes(' ')) {
  //       return lowerText.includes(keyword.toLowerCase());
  //     }
  //     // For single words, check if it exists as a separate word
  //     const words = lowerText.split(/\s+/);
  //     return words.includes(keyword.toLowerCase());
  //   });
  // };

  /* -------------------- Main Send Handler -------------------- */
  // const handleSend = async textOverride => {
  //   const text = (textOverride || input).trim();
  //   if (!text || processingRef.current) {
  //     return;
  //   }

  //   processingRef.current = true;
  //   setInput('');
  //   setShowQuickActions(false);

  //   if (!textOverride) {
  //     addMessage(text, 'user');
  //   }

  //   // Detect language from user input
  //   const detectedLanguage = detectLanguage(text);

  //   // Update language state if different
  //   if (detectedLanguage !== language) {
  //     setLanguage(detectedLanguage);
  //     console.log(`🌍 Language auto-detected: ${detectedLanguage}`);
  //   }

  //   // Check for attendance intent FIRST
  //   if (detectAttendanceIntent(text)) {
  //     processingRef.current = false;

  //     // Respond in detected language
  //     const responses = {
  //       en: "I'll help you mark your attendance. Taking you to the attendance screen...",
  //       ur: 'میں آپ کی حاضری لگانے میں مدد کروں گا۔ آپ کو حاضری کی سکرین پر لے جا رہا ہوں...',
  //       ar: 'سأساعدك في تسجيل حضورك. سأنقلك إلى شاشة الحضور...',
  //     };

  //     addMessage(responses[detectedLanguage] || responses.en, 'bot');

  //     setTimeout(() => {
  //       navigateToScreen('CreateAttendanceScreen');
  //     }, 1000);

  //     return;
  //   }

  //   setIsTyping(true);

  //   try {
  //     const functions = leaveService.current.getFunctionDefinitions();

  //     console.log('💬 User message:', text);
  //     console.log('🌍 Detected language:', detectedLanguage);

  //     const aiResponse = await azureAIService.chat({
  //       userMessage: text,
  //       conversationHistory: messages,
  //       availableFunctions: functions,
  //       userData: userData,
  //       preferredLanguage: detectedLanguage, // Use detected language
  //     });

  //     console.log('🤖 AI response:', aiResponse);

  //     if (aiResponse.type === 'function_call') {
  //       await handleFunctionCall(aiResponse);
  //     } else {
  //       addMessage(aiResponse.text, 'bot');
  //     }
  //   } catch (err) {
  //     console.error('❌ Chat error:', err);

  //     // Error messages in detected language
  //     const errorMessages = {
  //       en: 'Sorry, I encountered an error. Please try again or rephrase your request.',
  //       ur: 'معذرت، مجھے ایک خرابی کا سامنا ہوا۔ براہ کرم دوبارہ کوشش کریں یا اپنی درخواست دوبارہ لکھیں۔',
  //       ar: 'عذراً، واجهت خطأ. يرجى المحاولة مرة أخرى أو إعادة صياغة طلبك.',
  //     };

  //     addMessage(errorMessages[detectedLanguage] || errorMessages.en, 'bot');
  //   } finally {
  //     processingRef.current = false;
  //     setIsTyping(false);
  //   }
  // };

  /* -------------------- Smart Function Call Handler -------------------- */
  // const handleFunctionCall = async functionCall => {
  //   try {
  //     console.log('🔧 Executing function:', functionCall.function);
  //     console.log('📥 Parameters:', functionCall.parameters);

  //     // Execute the function with smart parameter filling
  //     const result = await leaveService.current.execute(
  //       functionCall.function,
  //       functionCall.parameters,
  //       userData,
  //     );

  //     console.log('📤 Function result:', result);

  //     // Handle function result based on success/error
  //     if (!result.success) {
  //       await handleFunctionError(functionCall, result);
  //       return;
  //     }

  //     // Handle successful function execution
  //     await handleFunctionSuccess(functionCall, result);
  //   } catch (error) {
  //     console.error('❌ Function execution error:', error);
  //     addMessage(
  //       "I encountered an error while processing your request. Let's try a different approach.",
  //       'bot',
  //     );
  //   }
  // };

  /* -------------------- Handle Function Errors -------------------- */
  const handleFunctionError = async (functionCall, result) => {
    console.log('⚠️ Function error:', result.error);

    // Build error context for AI
    const errorContext = {
      ...result,
      originalFunction: functionCall.function,
      originalParameters: functionCall.parameters,
    };

    // Let AI handle the error intelligently
    const continueResponse = await azureAIService.continueAfterFunction({
      previousMessages: messages,
      functionName: functionCall.function,
      functionResult: errorContext,
      userData,
      preferredLanguage: language, // Use current language state
      availableFunctions: leaveService.current.getFunctionDefinitions(),
      toolCallId: functionCall.toolCallId,
    });

    addMessage(continueResponse.text, 'bot');

    // If AI wants to call another function (e.g., retry with more params)
    if (continueResponse.type === 'function_call') {
      await handleFunctionCall(continueResponse);
    }
  };

  /* -------------------- Handle Function Success -------------------- */
  const handleFunctionSuccess = async (functionCall, result) => {
    console.log('✅ Function succeeded');

    // Continue conversation, AI will maintain language context
    const continueResponse = await azureAIService.continueAfterFunction({
      previousMessages: messages,
      functionName: functionCall.function,
      functionResult: result,
      userData,
      preferredLanguage: 'auto', // Let AI maintain language from context
      availableFunctions: leaveService.current.getFunctionDefinitions(),
      toolCallId: functionCall.toolCallId,
    });

    addMessage(continueResponse.text, 'bot');

    // Handle chained function calls
    if (continueResponse.type === 'function_call') {
      await handleFunctionCall(continueResponse);
    }
  };
  // const handleFunctionSuccess = async (functionCall, result) => {
  //   console.log('✅ Function succeeded');

  //   // Special handling for leave creation
  //   if (functionCall.function === 'create_leave_request' && result.success) {
  //     // Ask AI to summarize and offer to submit
  //     const continueResponse = await azureAIService.continueAfterFunction({
  //       previousMessages: messages,
  //       functionName: functionCall.function,
  //       functionResult: result,
  //       userData,
  //       preferredLanguage: language, // Use current language state
  //       availableFunctions: leaveService.current.getFunctionDefinitions(),
  //       toolCallId: functionCall.toolCallId,
  //     });

  //     addMessage(continueResponse.text, 'bot');

  //     // If user confirms submission, AI might call submit_leave_request
  //     if (continueResponse.type === 'function_call') {
  //       await handleFunctionCall(continueResponse);
  //     }

  //     return;
  //   }

  //   // Special handling for leave submission
  //   if (functionCall.function === 'submit_leave_request' && result.success) {
  //     const continueResponse = await azureAIService.continueAfterFunction({
  //       previousMessages: messages,
  //       functionName: functionCall.function,
  //       functionResult: result,
  //       userData,
  //       preferredLanguage: language, // Use current language state
  //       availableFunctions: leaveService.current.getFunctionDefinitions(),
  //       toolCallId: functionCall.toolCallId,
  //     });

  //     addMessage(continueResponse.text, 'bot');

  //     // Navigate to leaves list after a delay
  //     setTimeout(() => {
  //       navigateToScreen('LeavesListPage', {
  //         highlightRecId: result.requestId,
  //       });
  //     }, 2000);

  //     return;
  //   }

  //   // Default: Let AI interpret and respond
  //   const continueResponse = await azureAIService.continueAfterFunction({
  //     previousMessages: messages,
  //     functionName: functionCall.function,
  //     functionResult: result,
  //     userData,
  //     preferredLanguage: language, // Use current language state
  //     availableFunctions: leaveService.current.getFunctionDefinitions(),
  //     toolCallId: functionCall.toolCallId,
  //   });

  //   addMessage(continueResponse.text, 'bot');

  //   // Handle chained function calls
  //   if (continueResponse.type === 'function_call') {
  //     await handleFunctionCall(continueResponse);
  //   }
  // };

  /* -------------------- UI Components -------------------- */
  // Language buttons removed

  // Quick action buttons removed
  // const QuickActionButton = ({icon, label, gradient, onPress}) => (
  //   <TouchableOpacity onPress={onPress} style={styles.quickActionWrapper}>
  //     <LinearGradient
  //       colors={gradient}
  //       start={{x: 0, y: 0}}
  //       end={{x: 1, y: 1}}
  //       style={styles.quickAction}>
  //       <Icon name={icon} size={28} color="#fff" />
  //       <Text style={styles.quickActionLabel}>{label}</Text>
  //     </LinearGradient>
  //   </TouchableOpacity>
  // );

  // const renderQuickActions = () => {
  //   return null; // Disabled
  // };

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

  // Recording UI disabled
  // const renderRecordingUI = () => {
  //   return null;
  // };

  const handleClose = () => {
    // Voice cleanup disabled
    // if (isRecording) {
    //   cancelRecording();
    // }
    // clearTimers();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
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

            {/* Language Bar - REMOVED */}

            {/* Messages */}
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.chatContainer}
              showsVerticalScrollIndicator={false}
              ListFooterComponent={<>{isTyping && renderTypingIndicator()}</>}
            />

            {/* Input Bar */}
            <View style={styles.inputRow}>
              {/* Mic button - DISABLED appearance */}
              <TouchableOpacity style={styles.iconButton} disabled={true}>
                <LinearGradient
                  colors={['#ccc', '#aaa']}
                  style={styles.iconButtonGradient}>
                  <Icon name="mic-off" size={24} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>

              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Type your message..."
                placeholderTextColor="#999"
                style={styles.input}
                onSubmitEditing={() => handleSend()}
                multiline
                maxLength={500}
              />

              <TouchableOpacity
                onPress={() => handleSend()}
                style={styles.iconButton}
                disabled={!input.trim()}>
                <LinearGradient
                  colors={
                    input.trim() ? ['#43e97b', '#38f9d7'] : ['#ddd', '#ccc']
                  }
                  style={styles.iconButtonGradient}>
                  <Icon name="send" size={24} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Recording Overlay - REMOVED */}
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
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
  chatContainer: {padding: 16, paddingBottom: 8},
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
  },
});

export default AIChatbot;
