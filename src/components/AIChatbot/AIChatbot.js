// /* eslint-disable curly */
// /* eslint-disable react-hooks/exhaustive-deps */
// /* eslint-disable react-native/no-inline-styles */
// import React, {useEffect, useState, useRef, useMemo} from 'react';
// import {
//   Modal,
//   View,
//   Text,
//   TouchableOpacity,
//   TextInput,
//   FlatList,
//   StyleSheet,
//   Platform,
//   KeyboardAvoidingView,
//   Animated,
//   ActivityIndicator,
//   Alert,
//   InteractionManager,
// } from 'react-native';
// import {useSelector, useDispatch} from 'react-redux';
// import moment from 'moment';
// import {useNavigation} from '@react-navigation/native';
// import LinearGradient from 'react-native-linear-gradient';
// import Icon from 'react-native-vector-icons/MaterialIcons';

// import azureAIService from '../../services/AzureAIService';
// import LeaveService from '../../services/LeaveService';
// import SpeechRecordingService from '../../services/SpeechRecordingService';
// import AzureSpeechService from '../../services/AzureSpeechService';

// import {
//   chatbotAddMessage,
//   chatbotSetMessages,
// } from '../../store/slices/chatbotSlice';

// const AIChatbot = ({visible, onClose}) => {
//   const dispatch = useDispatch();
//   const navigation = useNavigation();

//   const {userData} = useSelector(s => s.user || {});
//   const messages = useSelector(s => s.chatbot?.messages || []);

//   const [input, setInput] = useState('');
//   const [isTyping, setIsTyping] = useState(false);

//   const [isRecording, setIsRecording] = useState(false);
//   const [recordingDuration, setRecordingDuration] = useState(0);

//   // Speech service status (no @react-native-voice/voice anymore)
//   const [voiceServiceReady, setVoiceServiceReady] = useState(true);
//   const [voiceStatus, setVoiceStatus] = useState('Voice Ready');

//   const processingRef = useRef(false);
//   const flatListRef = useRef(null);
//   const leaveService = useRef(new LeaveService());

//   const pulseAnim = useRef(new Animated.Value(1)).current;
//   const micScaleAnim = useRef(new Animated.Value(1)).current;

//   const recordingTimer = useRef(null);
//   const isMountedRef = useRef(true);
//   const lastRecordingTime = useRef(0);
//   const stopRequestedRef = useRef(false);

//   const isPressToTalk = useMemo(() => {
//     return Platform.OS === 'android' || Platform.OS === 'ios';
//   }, []);

//   /* -------------------- Lifecycle -------------------- */
//   useEffect(() => {
//     isMountedRef.current = true;
//     return () => {
//       isMountedRef.current = false;
//       clearTimers();
//       // stop recorder safely on unmount
//       VoiceRecordingService.cancelRecording?.();
//     };
//   }, []);

//   useEffect(() => {
//     if (!visible) {
//       clearTimers();
//       VoiceRecordingService.cancelRecording?.();
//       return;
//     }

//     if (!messages || messages.length === 0) {
//       const welcomeMsg = {
//         id: 'welcome-1',
//         text: "👋 Hello! I'm your Dynaface AI Assistant. How may I assist you?",
//         from: 'bot',
//         timestamp: Date.now(),
//       };
//       dispatch(chatbotSetMessages([welcomeMsg]));
//     }

//     // Keep it simple: recorder will request permission when starting
//     setVoiceServiceReady(true);
//     setVoiceStatus('Voice Ready');

//     return () => {
//       if (isRecording) VoiceRecordingService.cancelRecording?.();
//       clearTimers();
//     };
//   }, [visible]);

//   /* -------------------- Auto-scroll -------------------- */
//   useEffect(() => {
//     if (messages.length > 0 && flatListRef.current) {
//       InteractionManager.runAfterInteractions(() => {
//         try {
//           flatListRef.current?.scrollToEnd({animated: true});
//         } catch (error) {}
//       });
//     }
//   }, [messages]);

//   useEffect(() => {
//     if (isTyping && flatListRef.current) {
//       const t = setTimeout(() => {
//         try {
//           flatListRef.current?.scrollToEnd({animated: true});
//         } catch (error) {}
//       }, 400);
//       return () => clearTimeout(t);
//     }
//   }, [isTyping]);

//   const clearTimers = () => {
//     if (recordingTimer.current) {
//       clearInterval(recordingTimer.current);
//       recordingTimer.current = null;
//     }
//   };

//   /* -------------------- Animations -------------------- */
//   useEffect(() => {
//     if (isTyping) {
//       Animated.loop(
//         Animated.sequence([
//           Animated.timing(pulseAnim, {
//             toValue: 1.2,
//             duration: 800,
//             useNativeDriver: true,
//           }),
//           Animated.timing(pulseAnim, {
//             toValue: 1,
//             duration: 800,
//             useNativeDriver: true,
//           }),
//         ]),
//       ).start();
//     } else {
//       pulseAnim.stopAnimation?.();
//       pulseAnim.setValue(1);
//     }
//   }, [isTyping]);

//   useEffect(() => {
//     if (isRecording) {
//       Animated.loop(
//         Animated.sequence([
//           Animated.timing(micScaleAnim, {
//             toValue: 1.25,
//             duration: 500,
//             useNativeDriver: true,
//           }),
//           Animated.timing(micScaleAnim, {
//             toValue: 1,
//             duration: 500,
//             useNativeDriver: true,
//           }),
//         ]),
//       ).start();
//     } else {
//       micScaleAnim.stopAnimation?.();
//       micScaleAnim.setValue(1);
//     }
//   }, [isRecording]);

//   /* -------------------- Voice Recording (Azure STT) -------------------- */
//   const startRecording = async () => {
//     const now = Date.now();
//     if (now - lastRecordingTime.current < 700) return;
//     lastRecordingTime.current = now;

//     if (!voiceServiceReady) {
//       Alert.alert(
//         'Voice Not Ready',
//         'Voice is not ready. Please type instead.',
//       );
//       return;
//     }

//     try {
//       stopRequestedRef.current = false;

//       setIsRecording(true);
//       setRecordingDuration(0);
//       setInput('');

//       recordingTimer.current = setInterval(() => {
//         if (!isMountedRef.current) return;
//         setRecordingDuration(prev => {
//           const next = prev + 1;
//           if (next >= 15) stopRecording();
//           return next;
//         });
//       }, 1000);

//       const res = await SpeechRecordingService.startRecording();
//       if (!res?.success) {
//         throw new Error(res?.error || 'Failed to start recording');
//       }
//     } catch (e) {
//       clearTimers();
//       setIsRecording(false);
//       setRecordingDuration(0);
//       Alert.alert('Recording Error', e?.message || 'Failed to start recording');
//     }
//   };

//   const endLockRef = useRef(false);

//   const urduToRoman = async urduText => {
//     const r = await azureAIService.chat({
//       userMessage: `Convert to Roman Urdu (English letters). Do NOT translate to English; keep Urdu words:\n\n${urduText}`,
//       conversationHistory: [],
//       availableFunctions: [],
//       userData,
//       preferredLanguage: 'en',
//     });

//     return (r?.text || urduText).trim();
//   };

//   const stopRecording = async () => {
//     if (endLockRef.current) return;
//     endLockRef.current = true;

//     try {
//       clearTimers();
//       setIsRecording(false);

//       const rec = await SpeechRecordingService.stopRecording();
//       if (!rec?.success)
//         throw new Error(rec?.error || 'Failed to stop recording');

//       if ((rec.duration || 0) < 1) {
//         Alert.alert(
//           'Recording Too Short',
//           'Please speak for at least 1 second.',
//         );
//         return;
//       }

//       const stt = await AzureSpeechService.speechToTextFromWavFileMulti({
//         wavFilePath: rec.filePath,
//         candidateLanguages: ['ur-PK', 'ar-SA', 'en-US'],
//         format: 'detailed',
//       });

//       console.log('🧠 detectedLanguage:', stt?.detectedLanguage);
//       console.log('🧠 STT raw:', stt?.raw);
//       console.log('🧠 STT status:', stt?.recognitionStatus);
//       console.log('🧠 STT text:', stt?.text);
//       console.log('🧠 confidence:', stt?.confidence);

//       const text = (stt?.text || '').trim();
//       if (!text) {
//         Alert.alert(
//           'Speech Not Recognized',
//           "I couldn't understand. Please try again.",
//         );
//         return;
//       }

//       setInput(text);

//       setTimeout(() => {
//         if (isMountedRef.current) {
//           // let your AI decide language from text, or pass detectedLanguage if you want
//           handleSend(text, 'auto');
//         }
//       }, 200);
//     } catch (e) {
//       setIsRecording(false);
//       Alert.alert('Speech Error', e?.message || 'Failed to recognize speech');
//     } finally {
//       endLockRef.current = false;
//     }
//   };

//   const cancelRecording = async () => {
//     if (endLockRef.current) return;
//     endLockRef.current = true;
//     try {
//       clearTimers();
//       stopRequestedRef.current = false;
//       setIsRecording(false);
//       setRecordingDuration(0);
//       await VoiceRecordingService.cancelRecording?.();
//     } catch (error) {
//     } finally {
//       endLockRef.current = false;
//     }
//   };

//   /* -------------------- Message Handling -------------------- */
//   const addMessage = (text, from) => {
//     if (!text || typeof text !== 'string' || text.trim().length === 0) return;

//     const newMsg = {
//       id: `${Date.now()}-${Math.random()}`,
//       text: String(text).substring(0, 1000),
//       from,
//       timestamp: Date.now(),
//     };

//     dispatch(chatbotAddMessage(newMsg));

//     setTimeout(() => {
//       if (!flatListRef.current) return;
//       try {
//         flatListRef.current.scrollToEnd({animated: true});
//       } catch (e) {}
//     }, 100);
//   };

//   /* -------------------- Navigation -------------------- */
//   const navigateToScreen = (screenName, params = {}) => {
//     onClose?.();

//     setTimeout(() => {
//       try {
//         navigation.navigate(screenName, {
//           employeeId: userData?.employeeId,
//           employeeName: userData?.employeeName,
//           WorkerRecId: userData?.WorkerRecId,
//           userData,
//           cameFrom: 'MainDashboard',
//           ...params,
//         });
//       } catch (navError) {
//         Alert.alert('Navigation Error', 'Cannot navigate to that screen.');
//       }
//     }, 300);
//   };

//   /* -------------------- Main Send Handler -------------------- */
//   const handleSend = async (textOverride, preferredLanguageOverride) => {
//     const text = (textOverride ?? input).trim();
//     if (!text) return;

//     if (processingRef.current) return;
//     processingRef.current = true;

//     addMessage(text, 'user');
//     setInput('');
//     setIsTyping(true);

//     try {
//       const functions = leaveService.current.getFunctionDefinitions();
//       const langHint =
//         preferredLanguageOverride || (text.match(/[آ-ی]/) ? 'auto' : 'en');

//       const timeoutPromise = new Promise((_, reject) => {
//         setTimeout(() => reject(new Error('AI response timeout')), 30000);
//       });

//       const aiResponse = await Promise.race([
//         azureAIService.chat({
//           userMessage: text,
//           conversationHistory: messages,
//           availableFunctions: functions,
//           userData,
//           preferredLanguage: langHint,
//         }),
//         timeoutPromise,
//       ]);

//       if (aiResponse?.type === 'function_call') {
//         await handleFunctionCall(aiResponse);
//       } else {
//         addMessage(aiResponse?.text || 'Sorry, I could not respond.', 'bot');
//       }
//     } catch (err) {
//       const errorMessage = err?.message?.toLowerCase?.().includes('timeout')
//         ? 'The AI is taking too long to respond. Please try again.'
//         : 'Sorry, I encountered an error. Please try again.';
//       addMessage(errorMessage, 'bot');
//     } finally {
//       processingRef.current = false;
//       setIsTyping(false);
//     }
//   };

//   /* -------------------- Handle Function Call -------------------- */
//   const handleFunctionCall = async functionCall => {
//     try {
//       if (functionCall.function === 'navigate_to_screen') {
//         const {screenName, message} = functionCall.parameters || {};
//         if (message) addMessage(message, 'bot');
//         setTimeout(() => navigateToScreen(screenName), 700);
//         return;
//       }

//       const result = await leaveService.current.execute(
//         functionCall.function,
//         functionCall.parameters,
//         userData,
//       );

//       if (!result?.success) {
//         await handleFunctionError(functionCall, result);
//         return;
//       }

//       if (result.action === 'navigate') {
//         if (result.message) addMessage(result.message, 'bot');
//         setTimeout(
//           () => navigateToScreen(result.screenName, result.params || {}),
//           700,
//         );
//         return;
//       }

//       await handleFunctionSuccess(functionCall, result);
//     } catch (error) {
//       addMessage('I failed to process your request. Please try again.', 'bot');
//     }
//   };

//   const handleFunctionError = async (functionCall, result) => {
//     const errorContext = {
//       ...result,
//       originalFunction: functionCall.function,
//       originalParameters: functionCall.parameters,
//     };

//     try {
//       const continueResponse = await azureAIService.continueAfterFunction({
//         previousMessages: messages,
//         functionName: functionCall.function,
//         functionResult: errorContext,
//         userData,
//         preferredLanguage: 'auto',
//         availableFunctions: leaveService.current.getFunctionDefinitions(),
//         toolCallId: functionCall.toolCallId,
//       });

//       addMessage(continueResponse?.text || 'Something went wrong.', 'bot');

//       if (continueResponse?.type === 'function_call') {
//         await handleFunctionCall(continueResponse);
//       }
//     } catch (error) {
//       addMessage('Sorry, something went wrong. Please try again.', 'bot');
//     }
//   };

//   const handleFunctionSuccess = async (functionCall, result) => {
//     try {
//       const continueResponse = await azureAIService.continueAfterFunction({
//         previousMessages: messages,
//         functionName: functionCall.function,
//         functionResult: result,
//         userData,
//         preferredLanguage: 'auto',
//         availableFunctions: leaveService.current.getFunctionDefinitions(),
//         toolCallId: functionCall.toolCallId,
//       });

//       addMessage(continueResponse?.text || 'Done.', 'bot');

//       if (continueResponse?.type === 'function_call') {
//         await handleFunctionCall(continueResponse);
//       }
//     } catch (error) {
//       addMessage('Sorry, something went wrong. Please try again.', 'bot');
//     }
//   };

//   /* -------------------- Format Recording Duration -------------------- */
//   const formatDuration = seconds => {
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${mins}:${secs.toString().padStart(2, '0')}`;
//   };

//   /* -------------------- UI Components -------------------- */
//   const renderItem = ({item}) => {
//     const isUser = item.from === 'user';

//     return (
//       <View
//         style={[
//           styles.messageContainer,
//           isUser ? styles.userContainer : styles.botContainer,
//         ]}>
//         {!isUser && (
//           <LinearGradient colors={['#667eea', '#764ba2']} style={styles.avatar}>
//             <Icon name="smart-toy" size={20} color="#fff" />
//           </LinearGradient>
//         )}

//         <View
//           style={[
//             styles.bubble,
//             isUser ? styles.userBubble : styles.botBubble,
//           ]}>
//           <Text style={[styles.messageText, isUser && styles.userMessageText]}>
//             {item.text}
//           </Text>
//           <Text style={styles.timestamp}>
//             {moment(item.timestamp).format('HH:mm')}
//           </Text>
//         </View>

//         {isUser && (
//           <LinearGradient colors={['#00c6ff', '#0072ff']} style={styles.avatar}>
//             <Icon name="person" size={20} color="#fff" />
//           </LinearGradient>
//         )}
//       </View>
//     );
//   };

//   const renderTypingIndicator = () => (
//     <View style={[styles.messageContainer, styles.botContainer]}>
//       <LinearGradient colors={['#667eea', '#764ba2']} style={styles.avatar}>
//         <Animated.View style={{transform: [{scale: pulseAnim}]}}>
//           <Icon name="smart-toy" size={20} color="#fff" />
//         </Animated.View>
//       </LinearGradient>
//       <View
//         style={[
//           styles.bubble,
//           styles.botBubble,
//           {flexDirection: 'row', alignItems: 'center'},
//         ]}>
//         <ActivityIndicator size="small" color="#667eea" />
//         <Text style={styles.typingText}>Thinking...</Text>
//       </View>
//     </View>
//   );

//   const handleClose = () => {
//     if (isRecording) cancelRecording();
//     clearTimers();
//     onClose?.();
//   };

//   /* -------------------- Mic handlers -------------------- */
//   const micPressIn = () => {
//     if (!isPressToTalk) return;
//     startRecording();
//   };

//   const micPressOut = () => {
//     if (!isPressToTalk) return;
//     if (isRecording) stopRecording();
//   };

//   const micTogglePress = () => {
//     if (isPressToTalk) return;
//     if (isRecording) stopRecording();
//     else startRecording();
//   };

//   return (
//     <Modal
//       visible={visible}
//       transparent
//       animationType="slide"
//       onRequestClose={handleClose}>
//       <View style={styles.overlay}>
//         <TouchableOpacity
//           style={styles.modalOverlay}
//           activeOpacity={1}
//           onPressOut={handleClose}>
//           <TouchableOpacity
//             style={styles.sheet}
//             activeOpacity={1}
//             onPress={e => e.stopPropagation()}>
//             {/* Header */}
//             <LinearGradient
//               colors={['#667eea', '#764ba2']}
//               start={{x: 0, y: 0}}
//               end={{x: 1, y: 0}}
//               style={styles.header}>
//               <View style={styles.headerLeft}>
//                 <Icon
//                   name="smart-toy"
//                   size={32}
//                   color="#fff"
//                   style={{marginRight: 12}}
//                 />
//                 <View>
//                   <Text style={styles.title}>Dynaface AI</Text>
//                   <Text style={styles.status}>
//                     ● Online{' '}
//                     {voiceServiceReady ? '• Voice Ready' : `• ${voiceStatus}`}
//                   </Text>
//                 </View>
//               </View>
//               <TouchableOpacity
//                 onPress={handleClose}
//                 style={styles.closeButton}>
//                 <Icon name="close" size={24} color="#fff" />
//               </TouchableOpacity>
//             </LinearGradient>

//             {/* Messages */}
//             <KeyboardAvoidingView
//               style={styles.chatArea}
//               behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//               keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
//               <FlatList
//                 ref={flatListRef}
//                 data={messages}
//                 renderItem={renderItem}
//                 keyExtractor={item => item.id}
//                 contentContainerStyle={styles.chatContainer}
//                 showsVerticalScrollIndicator={false}
//                 ListFooterComponent={<>{isTyping && renderTypingIndicator()}</>}
//                 keyboardDismissMode="on-drag"
//                 keyboardShouldPersistTaps="handled"
//                 onContentSizeChange={() => {
//                   InteractionManager.runAfterInteractions(() => {
//                     try {
//                       flatListRef.current?.scrollToEnd({animated: true});
//                     } catch (e) {}
//                   });
//                 }}
//               />

//               {/* Recording Indicator */}
//               {isRecording && (
//                 <View style={styles.recordingIndicator}>
//                   <View style={styles.recordingContent}>
//                     <Animated.View style={{transform: [{scale: micScaleAnim}]}}>
//                       <Icon name="mic" size={24} color="#ff4444" />
//                     </Animated.View>
//                     <View style={styles.recordingTextContainer}>
//                       <Text style={styles.recordingText}>
//                         Recording... {formatDuration(recordingDuration)}
//                       </Text>
//                       <Text style={styles.recordingHint}>
//                         {isPressToTalk ? 'Release to send' : 'Tap stop to send'}
//                       </Text>
//                     </View>
//                     <TouchableOpacity
//                       onPress={cancelRecording}
//                       style={styles.cancelButton}>
//                       <Icon name="close" size={20} color="#666" />
//                     </TouchableOpacity>
//                   </View>
//                 </View>
//               )}

//               {/* Input Row */}
//               <View style={styles.inputRow}>
//                 <TouchableOpacity
//                   // onPress={micTogglePress}
//                   onPressIn={micPressIn}
//                   onPressOut={micPressOut}
//                   style={styles.iconButton}
//                   disabled={!voiceServiceReady || isTyping}>
//                   <LinearGradient
//                     colors={
//                       isRecording
//                         ? ['#ff4444', '#cc0000']
//                         : voiceServiceReady
//                         ? ['#667eea', '#764ba2']
//                         : ['#ccc', '#999']
//                     }
//                     style={styles.iconButtonGradient}>
//                     <Animated.View
//                       style={
//                         isRecording
//                           ? {transform: [{scale: micScaleAnim}]}
//                           : null
//                       }>
//                       <Icon
//                         name={isRecording ? 'stop' : 'mic'}
//                         size={24}
//                         color="#fff"
//                       />
//                     </Animated.View>
//                   </LinearGradient>
//                 </TouchableOpacity>

//                 <TextInput
//                   value={input}
//                   onChangeText={setInput}
//                   placeholder={
//                     isRecording
//                       ? 'Recording...'
//                       : voiceServiceReady
//                       ? 'Type or speak your message...'
//                       : 'Type your message...'
//                   }
//                   placeholderTextColor="#999"
//                   style={styles.input}
//                   onSubmitEditing={() => handleSend()}
//                   multiline
//                   maxLength={500}
//                   editable={!isRecording && !isTyping}
//                 />

//                 <TouchableOpacity
//                   onPress={() => handleSend()}
//                   style={styles.iconButton}
//                   disabled={!input.trim() || isRecording || isTyping}>
//                   <LinearGradient
//                     colors={
//                       input.trim() && !isRecording && !isTyping
//                         ? ['#43e97b', '#38f9d7']
//                         : ['#ddd', '#ccc']
//                     }
//                     style={styles.iconButtonGradient}>
//                     <Icon name="send" size={24} color="#fff" />
//                   </LinearGradient>
//                 </TouchableOpacity>
//               </View>

//               {!voiceServiceReady && (
//                 <TouchableOpacity onPress={() => {}} style={styles.voiceStatus}>
//                   <Icon name="info-outline" size={14} color="#667eea" />
//                   <Text style={styles.voiceStatusText}>{voiceStatus}</Text>
//                 </TouchableOpacity>
//               )}
//             </KeyboardAvoidingView>
//           </TouchableOpacity>
//         </TouchableOpacity>
//       </View>
//     </Modal>
//   );
// };

// /* -------------------- Styles -------------------- */
// const styles = StyleSheet.create({
//   overlay: {flex: 1},
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.6)',
//     justifyContent: 'flex-end',
//   },
//   sheet: {
//     height: '90%',
//     backgroundColor: '#f8f9fa',
//     borderTopLeftRadius: 24,
//     borderTopRightRadius: 24,
//     overflow: 'hidden',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 16,
//     paddingTop: 20,
//   },
//   headerLeft: {flexDirection: 'row', alignItems: 'center'},
//   title: {fontSize: 18, fontWeight: '700', color: '#fff'},
//   status: {fontSize: 12, color: '#e0e0e0', marginTop: 2},
//   closeButton: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: 'rgba(255,255,255,0.2)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   chatArea: {flex: 1},
//   chatContainer: {
//     paddingHorizontal: 16,
//     paddingTop: 16,
//     paddingBottom: 16,
//   },
//   messageContainer: {
//     flexDirection: 'row',
//     marginVertical: 6,
//     alignItems: 'flex-end',
//   },
//   botContainer: {justifyContent: 'flex-start'},
//   userContainer: {justifyContent: 'flex-end'},
//   avatar: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginHorizontal: 8,
//   },
//   bubble: {
//     maxWidth: '70%',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderRadius: 20,
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: 1},
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//     elevation: 2,
//   },
//   botBubble: {backgroundColor: '#ffffff', borderBottomLeftRadius: 4},
//   userBubble: {backgroundColor: '#667eea', borderBottomRightRadius: 4},
//   messageText: {fontSize: 15, color: '#1a1a1a', lineHeight: 20},
//   userMessageText: {color: '#ffffff'},
//   timestamp: {
//     fontSize: 10,
//     color: '#999',
//     marginTop: 4,
//     alignSelf: 'flex-end',
//   },
//   typingText: {
//     fontSize: 14,
//     color: '#667eea',
//     fontStyle: 'italic',
//     marginLeft: 8,
//   },
//   recordingIndicator: {
//     backgroundColor: '#fff3cd',
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     borderTopWidth: 1,
//     borderTopColor: '#ffeaa7',
//   },
//   recordingContent: {flexDirection: 'row', alignItems: 'center'},
//   recordingTextContainer: {flex: 1, marginLeft: 12},
//   recordingText: {fontSize: 14, color: '#856404', fontWeight: '600'},
//   recordingHint: {fontSize: 12, color: '#b38f00', marginTop: 2},
//   cancelButton: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: '#f8d7da',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   inputRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 12,
//     backgroundColor: '#ffffff',
//     borderTopWidth: 1,
//     borderTopColor: '#eee',
//   },
//   iconButton: {width: 48, height: 48},
//   iconButtonGradient: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   input: {
//     flex: 1,
//     minHeight: 48,
//     maxHeight: 100,
//     borderRadius: 24,
//     paddingHorizontal: 16,
//     backgroundColor: '#f5f5f5',
//     marginHorizontal: 8,
//     fontSize: 15,
//     paddingTop: 12,
//     color: '#000000',
//   },
//   voiceStatus: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 8,
//     backgroundColor: '#f0f4ff',
//     borderTopWidth: 1,
//     borderTopColor: '#e2e8f0',
//   },
//   voiceStatusText: {fontSize: 12, color: '#667eea', marginLeft: 6},
// });

// export default AIChatbot;

/* eslint-disable curly */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
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
} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import moment from 'moment';
import {useNavigation} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

import azureAIService from '../../services/AzureAIService';
import LeaveService from '../../services/LeaveService';
// import SpeechRecordingService from '../../services/SpeechRecordingService';
// import AzureSpeechService from '../../services/AzureSpeechService';
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

  // Speech service status
  const [voiceServiceReady, setVoiceServiceReady] = useState(true);
  const [voiceStatus, setVoiceStatus] = useState('Voice Ready');

  const processingRef = useRef(false);
  const flatListRef = useRef(null);
  const leaveService = useRef(new LeaveService());

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const micScaleAnim = useRef(new Animated.Value(1)).current;

  const recordingTimer = useRef(null);
  const isMountedRef = useRef(true);
  const lastRecordingTime = useRef(0);
  const stopRequestedRef = useRef(false);

  const isPressToTalk = useMemo(() => {
    return Platform.OS === 'android' || Platform.OS === 'ios';
  }, []);

  /* -------------------- Lifecycle -------------------- */
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
        text: "👋 Hello! I'm your Dynaface AI Assistant. How may I assist you?",
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
      pulseAnim.stopAnimation?.();
      pulseAnim.setValue(1);
    }
  }, [isTyping]);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(micScaleAnim, {
            toValue: 1.25,
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
      micScaleAnim.stopAnimation?.();
      micScaleAnim.setValue(1);
    }
  }, [isRecording]);

  /* -------------------- Voice Recording (Azure STT) -------------------- */
  const startRecording = async () => {
    const now = Date.now();
    if (now - lastRecordingTime.current < 700) return;
    lastRecordingTime.current = now;

    if (!voiceServiceReady) {
      Alert.alert(
        'Voice Not Ready',
        'Voice is not ready. Please type instead.',
      );
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
          if (next >= 15) stopRecording();
          return next;
        });
      }, 1000);

      // ✅ Use your VoiceRecordingService directly
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

  const endLockRef = useRef(false);

  const stopRecording = async () => {
    if (endLockRef.current) return;
    endLockRef.current = true;

    try {
      clearTimers();
      setIsRecording(false);

      // ✅ This returns: { success: true, text, duration }
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

      // Optional: show recognized text in input
      setInput(text);

      setTimeout(() => {
        if (isMountedRef.current) {
          // ✅ send to AI (auto language)
          handleSend(text, 'auto');
        }
      }, 200);
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
      id: `${Date.now()}-${Math.random()}`,
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

  /* -------------------- Main Send Handler -------------------- */
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

      // ✅ Let AI auto-detect language from text
      // Voice (ur-PK) returns native اردو → AI responds in اردو
      // Text can be Roman Urdu → AI responds in Roman Urdu
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
        ? 'The AI is taking too long to respond. Please try again.'
        : 'Sorry, I encountered an error. Please try again.';
      addMessage(errorMessage, 'bot');
    } finally {
      processingRef.current = false;
      setIsTyping(false);
    }
  };

  /* -------------------- Handle Function Call -------------------- */
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
      addMessage('I failed to process your request. Please try again.', 'bot');
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
      addMessage('Sorry, something went wrong. Please try again.', 'bot');
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

      addMessage(continueResponse?.text || 'Done.', 'bot');

      if (continueResponse?.type === 'function_call') {
        await handleFunctionCall(continueResponse);
      }
    } catch (error) {
      addMessage('Sorry, something went wrong. Please try again.', 'bot');
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
    if (isRecording) cancelRecording();
    clearTimers();
    onClose?.();
  };

  /* -------------------- Mic handlers -------------------- */
  const micPressIn = () => {
    if (!isPressToTalk) return;
    startRecording();
  };

  const micPressOut = () => {
    if (!isPressToTalk) return;
    if (isRecording) stopRecording();
  };

  const micTogglePress = () => {
    if (isPressToTalk) return;
    if (isRecording) stopRecording();
    else startRecording();
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
                  <Text style={styles.status}>
                    ● Online{' '}
                    {voiceServiceReady ? '• Voice Ready' : `• ${voiceStatus}`}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeButton}>
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>

            {/* Messages */}
            <KeyboardAvoidingView
              style={styles.chatArea}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
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
                    try {
                      flatListRef.current?.scrollToEnd({animated: true});
                    } catch (e) {}
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
                    <View style={styles.recordingTextContainer}>
                      <Text style={styles.recordingText}>
                        Recording... {formatDuration(recordingDuration)}
                      </Text>
                      <Text style={styles.recordingHint}>
                        {isPressToTalk ? 'Release to send' : 'Tap stop to send'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={cancelRecording}
                      style={styles.cancelButton}>
                      <Icon name="close" size={20} color="#666" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Input Row */}
              <View style={styles.inputRow}>
                <TouchableOpacity
                  onPressIn={micPressIn}
                  onPressOut={micPressOut}
                  style={styles.iconButton}
                  disabled={!voiceServiceReady || isTyping}>
                  <LinearGradient
                    colors={
                      isRecording
                        ? ['#ff4444', '#cc0000']
                        : voiceServiceReady
                        ? ['#667eea', '#764ba2']
                        : ['#ccc', '#999']
                    }
                    style={styles.iconButtonGradient}>
                    <Animated.View
                      style={
                        isRecording
                          ? {transform: [{scale: micScaleAnim}]}
                          : null
                      }>
                      <Icon
                        name={isRecording ? 'stop' : 'mic'}
                        size={24}
                        color="#fff"
                      />
                    </Animated.View>
                  </LinearGradient>
                </TouchableOpacity>

                <TextInput
                  value={input}
                  onChangeText={setInput}
                  placeholder={
                    isRecording
                      ? 'Recording...'
                      : voiceServiceReady
                      ? 'Type or speak your message...'
                      : 'Type your message...'
                  }
                  placeholderTextColor="#999"
                  style={styles.input}
                  onSubmitEditing={() => handleSend()}
                  multiline
                  maxLength={500}
                  editable={!isRecording && !isTyping}
                />

                <TouchableOpacity
                  onPress={() => handleSend()}
                  style={styles.iconButton}
                  disabled={!input.trim() || isRecording || isTyping}>
                  <LinearGradient
                    colors={
                      input.trim() && !isRecording && !isTyping
                        ? ['#43e97b', '#38f9d7']
                        : ['#ddd', '#ccc']
                    }
                    style={styles.iconButtonGradient}>
                    <Icon name="send" size={24} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {!voiceServiceReady && (
                <TouchableOpacity onPress={() => {}} style={styles.voiceStatus}>
                  <Icon name="info-outline" size={14} color="#667eea" />
                  <Text style={styles.voiceStatusText}>{voiceStatus}</Text>
                </TouchableOpacity>
              )}
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
  chatArea: {flex: 1},
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
  recordingContent: {flexDirection: 'row', alignItems: 'center'},
  recordingTextContainer: {flex: 1, marginLeft: 12},
  recordingText: {fontSize: 14, color: '#856404', fontWeight: '600'},
  recordingHint: {fontSize: 12, color: '#b38f00', marginTop: 2},
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
  voiceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#f0f4ff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  voiceStatusText: {fontSize: 12, color: '#667eea', marginLeft: 6},
});

export default AIChatbot;
