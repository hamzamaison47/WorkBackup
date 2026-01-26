// /* eslint-disable no-shadow */
// /* eslint-disable react-native/no-inline-styles */
// import React, {useEffect, useState, useRef} from 'react';
// import {
//   Modal,
//   View,
//   Text,
//   TouchableOpacity,
//   TextInput,
//   FlatList,
//   StyleSheet,
//   Platform,
//   PermissionsAndroid,
//   KeyboardAvoidingView,
//   Animated,
//   ActivityIndicator,
// } from 'react-native';
// import {useSelector, useDispatch} from 'react-redux';
// import Voice from '@react-native-voice/voice';
// import moment from 'moment';
// import {useNavigation} from '@react-navigation/native';
// import LinearGradient from 'react-native-linear-gradient';
// import Icon from 'react-native-vector-icons/MaterialIcons';

// import azureAIService from '../../services/AzureAIService';
// import LeaveService from '../../services/LeaveService';

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
//   const [listening, setListening] = useState(false);
//   const [isTyping, setIsTyping] = useState(false);
//   const [showQuickActions, setShowQuickActions] = useState(true);
//   const [language, setLanguage] = useState('en'); // User's preferred language

//   const processingRef = useRef(false);
//   const flatListRef = useRef(null);
//   const leaveService = useRef(new LeaveService());
//   const pulseAnim = useRef(new Animated.Value(1)).current;

//   /* -------------------- Initialize -------------------- */
//   useEffect(() => {
//     if (!visible) return;

//     if (!messages || messages.length === 0) {
//       const welcomeMsg = {
//         id: 'welcome-1',
//         text: getWelcomeMessage(language),
//         from: 'bot',
//         timestamp: Date.now(),
//       };
//       dispatch(chatbotSetMessages([welcomeMsg]));
//     }

//     return () => {
//       Voice.destroy().then(Voice.removeAllListeners);
//     };
//   }, [visible, messages.length, dispatch]);

//   /* -------------------- Welcome Message -------------------- */
//   const getWelcomeMessage = lang => {
//     const messages = {
//       en: "👋 Hello! I'm your Dynaface AI Assistant.\n\nI can help you with:\n• Leave Requests\n• Leave Balance\n• Attendance\n\nHow may I assist you today?",
//       ur: '👋 السلام علیکم! میں آپ کا Dynaface AI اسسٹنٹ ہوں۔\n\nمیں آپ کی مدد کر سکتا ہوں:\n• چھٹی کی درخواستیں\n• چھٹی کا بیلنس\n• حاضری\n\nآج میں آپ کی کیسے مدد کر سکتا ہوں؟',
//       ar: '👋 مرحباً! أنا مساعد Dynaface AI الخاص بك.\n\nيمكنني مساعدتك في:\n• طلبات الإجازة\n• رصيد الإجازة\n• الحضور\n\nكيف يمكنني مساعدتك اليوم؟',
//     };
//     return messages[lang] || messages.en;
//   };

//   /* -------------------- Pulse Animation -------------------- */
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
//       pulseAnim.setValue(1);
//     }
//   }, [isTyping, pulseAnim]);

//   /* -------------------- Voice Handling -------------------- */
//   const startListening = async () => {
//     try {
//       if (Platform.OS === 'android') {
//         const granted = await PermissionsAndroid.request(
//           PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
//         );
//         if (granted !== PermissionsAndroid.RESULTS.GRANTED) return;
//       }

//       Voice.onSpeechResults = e => {
//         const text = e?.value?.[0];
//         if (text) handleSend(text);
//         stopListening();
//       };

//       Voice.onSpeechError = () => stopListening();
//       setListening(true);
//       await Voice.start('en-US');
//     } catch (err) {
//       stopListening();
//     }
//   };

//   const stopListening = async () => {
//     try {
//       await Voice.stop();
//       Voice.removeAllListeners();
//     } catch {}
//     setListening(false);
//   };

//   /* -------------------- Message Handling -------------------- */
//   const addMessage = (text, from) => {
//     const newMsg = {
//       id: `${Date.now()}-${Math.random()}`,
//       text: String(text),
//       from,
//       timestamp: Date.now(),
//     };

//     dispatch(chatbotAddMessage(newMsg));

//     setTimeout(() => {
//       flatListRef.current?.scrollToEnd({animated: true});
//     }, 100);
//   };

//   /* -------------------- Navigation -------------------- */
//   const navigateToScreen = (screenName, params = {}) => {
//     console.log(`🚀 Navigating to: ${screenName}`);
//     onClose();

//     setTimeout(() => {
//       navigation.navigate(screenName, {
//         employeeId: userData?.employeeId,
//         employeeName: userData?.employeeName,
//         WorkerRecId: userData?.WorkerRecId,
//         userData: userData,
//         cameFrom: 'MainDashboard',
//         ...params,
//       });
//     }, 300);
//   };

//   /* -------------------- Main Send Handler -------------------- */
//   const handleSend = async textOverride => {
//     const text = (textOverride || input).trim();
//     if (!text || processingRef.current) return;

//     processingRef.current = true;
//     setInput('');
//     setShowQuickActions(false);
//     addMessage(text, 'user');
//     setIsTyping(true);

//     try {
//       // Get function definitions
//       const functions = leaveService.current.getFunctionDefinitions();

//       // Chat with AI
//       const aiResponse = await azureAIService.chat({
//         userMessage: text,
//         conversationHistory: messages,
//         availableFunctions: functions,
//         userData: userData,
//         preferredLanguage: language,
//       });

//       // Handle response
//       if (aiResponse.type === 'function_call') {
//         // AI wants to call a function
//         await handleFunctionCall(aiResponse);
//       } else {
//         // Regular message
//         addMessage(aiResponse.text, 'bot');
//       }
//     } catch (err) {
//       console.error('❌ Chat error:', err);
//       addMessage('Sorry, something went wrong. Please try again.', 'bot');
//     } finally {
//       processingRef.current = false;
//       setIsTyping(false);
//     }
//   };

//   /* -------------------- Function Call Handler -------------------- */
//   const handleFunctionCall = async functionCall => {
//     try {
//       console.log('🔧 Executing:', functionCall.function);

//       // Add employee ID if not provided
//       const params = {
//         ...functionCall.parameters,
//         employeeId: functionCall.parameters.employeeId || userData?.employeeId,
//       };

//       // Execute the function
//       const result = await leaveService.current.execute(
//         functionCall.function,
//         params,
//       );

//       console.log('✅ Function result:', result);

//       // Check if navigation is needed
//       if (
//         functionCall.function === 'create_and_submit_leave' &&
//         result.success
//       ) {
//         // Show success message first
//         const continueResponse = await azureAIService.continueAfterFunction({
//           previousMessages: messages,
//           functionName: functionCall.function,
//           functionResult: result,
//           userData,
//           preferredLanguage: language,
//         });

//         addMessage(continueResponse.text, 'bot');

//         // Then navigate
//         setTimeout(() => {
//           navigateToScreen('LeavesListPage', {
//             highlightRecId: result.requestId,
//           });
//         }, 2000);
//       } else {
//         // Get AI's response based on function result
//         const continueResponse = await azureAIService.continueAfterFunction({
//           previousMessages: messages,
//           functionName: functionCall.function,
//           functionResult: result,
//           userData,
//           preferredLanguage: language,
//         });

//         addMessage(continueResponse.text, 'bot');

//         // Check if AI wants to call another function
//         if (continueResponse.type === 'function_call') {
//           await handleFunctionCall(continueResponse);
//         }
//       }
//     } catch (error) {
//       console.error('❌ Function execution error:', error);
//       addMessage("Sorry, I couldn't complete that action.", 'bot');
//     }
//   };

//   /* -------------------- Language Selector -------------------- */
//   const LanguageButton = ({code, label, flag}) => (
//     <TouchableOpacity
//       onPress={() => {
//         setLanguage(code);
//         addMessage(getWelcomeMessage(code), 'bot');
//       }}
//       style={[styles.langButton, language === code && styles.langButtonActive]}>
//       <Text style={styles.langFlag}>{flag}</Text>
//       <Text style={styles.langLabel}>{label}</Text>
//     </TouchableOpacity>
//   );

//   /* -------------------- Quick Actions -------------------- */
//   const QuickActionButton = ({icon, label, gradient, onPress}) => (
//     <TouchableOpacity onPress={onPress} style={styles.quickActionWrapper}>
//       <LinearGradient
//         colors={gradient}
//         start={{x: 0, y: 0}}
//         end={{x: 1, y: 1}}
//         style={styles.quickAction}>
//         <Icon name={icon} size={28} color="#fff" />
//         <Text style={styles.quickActionLabel}>{label}</Text>
//       </LinearGradient>
//     </TouchableOpacity>
//   );

//   const renderQuickActions = () => {
//     if (!showQuickActions || messages.length > 1) return null;

//     const actions = {
//       en: [
//         {
//           icon: 'event-note',
//           label: 'Request Leave',
//           action: 'I want to request a leave',
//         },
//         {
//           icon: 'account-balance-wallet',
//           label: 'Check Balance',
//           action: 'Check my leave balance',
//         },
//         {
//           icon: 'list-alt',
//           label: 'View Leaves',
//           action: 'Show my leave requests',
//         },
//         {icon: 'schedule', label: 'Attendance', action: 'Mark attendance'},
//       ],
//       ur: [
//         {
//           icon: 'event-note',
//           label: 'چھٹی کی درخواست',
//           action: 'مجھے چھٹی چاہیے',
//         },
//         {
//           icon: 'account-balance-wallet',
//           label: 'بیلنس چیک',
//           action: 'میرا بیلنس چیک کریں',
//         },
//         {
//           icon: 'list-alt',
//           label: 'چھٹیاں دیکھیں',
//           action: 'میری چھٹیاں دکھائیں',
//         },
//         {icon: 'schedule', label: 'حاضری', action: 'حاضری لگائیں'},
//       ],
//       ar: [
//         {icon: 'event-note', label: 'طلب إجازة', action: 'أريد طلب إجازة'},
//         {
//           icon: 'account-balance-wallet',
//           label: 'رصيد',
//           action: 'تحقق من رصيدي',
//         },
//         {icon: 'list-alt', label: 'عرض الإجازات', action: 'أظهر طلبات إجازتي'},
//         {icon: 'schedule', label: 'حضور', action: 'تسجيل الحضور'},
//       ],
//     };

//     const gradients = [
//       ['#667eea', '#764ba2'],
//       ['#f093fb', '#f5576c'],
//       ['#4facfe', '#00f2fe'],
//       ['#43e97b', '#38f9d7'],
//     ];

//     return (
//       <View style={styles.quickActionsContainer}>
//         <Text style={styles.quickActionsTitle}>Quick Actions:</Text>
//         <View style={styles.quickActionsGrid}>
//           {actions[language].map((action, index) => (
//             <QuickActionButton
//               key={index}
//               icon={action.icon}
//               label={action.label}
//               gradient={gradients[index]}
//               onPress={() => handleSend(action.action)}
//             />
//           ))}
//         </View>
//       </View>
//     );
//   };

//   /* -------------------- Render Methods -------------------- */
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

//   return (
//     <Modal visible={visible} transparent animationType="slide">
//       <KeyboardAvoidingView
//         style={styles.overlay}
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
//         <View style={styles.sheet}>
//           {/* Header */}
//           <LinearGradient
//             colors={['#667eea', '#764ba2']}
//             start={{x: 0, y: 0}}
//             end={{x: 1, y: 0}}
//             style={styles.header}>
//             <View style={styles.headerLeft}>
//               <Icon
//                 name="smart-toy"
//                 size={32}
//                 color="#fff"
//                 style={{marginRight: 12}}
//               />
//               <View>
//                 <Text style={styles.title}>Dynaface AI</Text>
//                 <Text style={styles.status}>● Online</Text>
//               </View>
//             </View>
//             <TouchableOpacity onPress={onClose} style={styles.closeButton}>
//               <Icon name="close" size={24} color="#fff" />
//             </TouchableOpacity>
//           </LinearGradient>

//           {/* Language Selector */}
//           <View style={styles.languageBar}>
//             <LanguageButton code="en" label="English" flag="🇬🇧" />
//             <LanguageButton code="ur" label="اردو" flag="🇵🇰" />
//             <LanguageButton code="ar" label="العربية" flag="🇸🇦" />
//           </View>

//           {/* Messages */}
//           <FlatList
//             ref={flatListRef}
//             data={messages}
//             renderItem={renderItem}
//             keyExtractor={item => item.id}
//             contentContainerStyle={styles.chatContainer}
//             showsVerticalScrollIndicator={false}
//             ListFooterComponent={
//               <>
//                 {isTyping && renderTypingIndicator()}
//                 {renderQuickActions()}
//               </>
//             }
//           />

//           {/* Input Bar */}
//           <View style={styles.inputRow}>
//             <TouchableOpacity
//               onPress={listening ? stopListening : startListening}
//               style={styles.iconButton}>
//               <LinearGradient
//                 colors={
//                   listening ? ['#f5576c', '#f093fb'] : ['#667eea', '#764ba2']
//                 }
//                 style={styles.iconButtonGradient}>
//                 <Icon
//                   name={listening ? 'mic' : 'mic-none'}
//                   size={24}
//                   color="#fff"
//                 />
//               </LinearGradient>
//             </TouchableOpacity>

//             <TextInput
//               value={input}
//               onChangeText={setInput}
//               placeholder="Type your message..."
//               placeholderTextColor="#999"
//               style={styles.input}
//               onSubmitEditing={() => handleSend()}
//               multiline
//               maxLength={500}
//             />

//             <TouchableOpacity
//               onPress={() => handleSend()}
//               style={styles.iconButton}
//               disabled={!input.trim()}>
//               <LinearGradient
//                 colors={
//                   input.trim() ? ['#43e97b', '#38f9d7'] : ['#ddd', '#ccc']
//                 }
//                 style={styles.iconButtonGradient}>
//                 <Icon name="send" size={24} color="#fff" />
//               </LinearGradient>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </KeyboardAvoidingView>
//     </Modal>
//   );
// };

// /* -------------------- Styles -------------------- */
// const styles = StyleSheet.create({
//   overlay: {
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
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: -4},
//     shadowOpacity: 0.2,
//     shadowRadius: 8,
//     elevation: 10,
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 16,
//     paddingTop: 20,
//   },
//   headerLeft: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   title: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#fff',
//   },
//   status: {
//     fontSize: 12,
//     color: '#e0e0e0',
//     marginTop: 2,
//   },
//   closeButton: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: 'rgba(255,255,255,0.2)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   languageBar: {
//     flexDirection: 'row',
//     padding: 8,
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//     justifyContent: 'center',
//   },
//   langButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     marginHorizontal: 4,
//     borderRadius: 16,
//     backgroundColor: '#f5f5f5',
//   },
//   langButtonActive: {
//     backgroundColor: '#667eea',
//   },
//   langFlag: {
//     fontSize: 16,
//     marginRight: 4,
//   },
//   langLabel: {
//     fontSize: 12,
//     fontWeight: '600',
//     color: '#333',
//   },
//   chatContainer: {
//     padding: 16,
//     paddingBottom: 8,
//   },
//   quickActionsContainer: {
//     marginTop: 16,
//     padding: 16,
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: 2},
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   quickActionsTitle: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#666',
//     marginBottom: 12,
//   },
//   quickActionsGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 8,
//   },
//   quickActionWrapper: {
//     width: '48%',
//     marginBottom: 8,
//   },
//   quickAction: {
//     padding: 12,
//     borderRadius: 12,
//     alignItems: 'center',
//     minHeight: 80,
//     justifyContent: 'center',
//   },
//   quickActionLabel: {
//     fontSize: 12,
//     color: '#fff',
//     fontWeight: '600',
//     textAlign: 'center',
//     marginTop: 4,
//   },
//   messageContainer: {
//     flexDirection: 'row',
//     marginVertical: 6,
//     alignItems: 'flex-end',
//   },
//   botContainer: {
//     justifyContent: 'flex-start',
//   },
//   userContainer: {
//     justifyContent: 'flex-end',
//   },
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
//   botBubble: {
//     backgroundColor: '#ffffff',
//     borderBottomLeftRadius: 4,
//   },
//   userBubble: {
//     backgroundColor: '#667eea',
//     borderBottomRightRadius: 4,
//   },
//   messageText: {
//     fontSize: 15,
//     color: '#1a1a1a',
//     lineHeight: 20,
//   },
//   userMessageText: {
//     color: '#ffffff',
//   },
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
//   inputRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 12,
//     backgroundColor: '#ffffff',
//     borderTopWidth: 1,
//     borderTopColor: '#eee',
//   },
//   iconButton: {
//     width: 48,
//     height: 48,
//   },
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
//   },
// });

// export default AIChatbot;

// Working for Text above
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// /* eslint-disable no-shadow */
// /* eslint-disable react-native/no-inline-styles */
// import React, {useEffect, useState, useRef} from 'react';
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
// } from 'react-native';
// import {useSelector, useDispatch} from 'react-redux';
// import moment from 'moment';
// import {useNavigation} from '@react-navigation/native';
// import LinearGradient from 'react-native-linear-gradient';
// import Icon from 'react-native-vector-icons/MaterialIcons';

// import azureAIService from '../../services/AzureAIService';
// import LeaveService from '../../services/LeaveService';
// import VoiceRecordingService from '../../services/VoiceRecordingService';
// import SpeechToTextService from '../../services/SpeechToTextService';

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
//   const [showQuickActions, setShowQuickActions] = useState(true);
//   const [language, setLanguage] = useState('en');

//   // Voice recording states
//   const [isRecording, setIsRecording] = useState(false);
//   const [recordingDuration, setRecordingDuration] = useState(0);
//   const [isProcessingVoice, setIsProcessingVoice] = useState(false);

//   const processingRef = useRef(false);
//   const flatListRef = useRef(null);
//   const leaveService = useRef(new LeaveService());
//   const pulseAnim = useRef(new Animated.Value(1)).current;
//   const recordingTimer = useRef(null);
//   const micScaleAnim = useRef(new Animated.Value(1)).current;

//   /* -------------------- Initialize -------------------- */
//   useEffect(() => {
//     if (!visible) return;

//     if (!messages || messages.length === 0) {
//       const welcomeMsg = {
//         id: 'welcome-1',
//         text: getWelcomeMessage(language),
//         from: 'bot',
//         timestamp: Date.now(),
//       };
//       dispatch(chatbotSetMessages([welcomeMsg]));
//     }

//     return () => {
//       // Cleanup on unmount
//       if (isRecording) {
//         VoiceRecordingService.cancelRecording();
//       }
//     };
//   }, [visible, messages.length, dispatch]);

//   /* -------------------- Welcome Message -------------------- */
//   const getWelcomeMessage = lang => {
//     const messages = {
//       en: "👋 Hello! I'm your Dynaface AI Assistant.\n\nI can help you with:\n• Leave Requests\n• Leave Balance\n• Attendance\n\nHow may I assist you today?",
//       ur: '👋 السلام علیکم! میں آپ کا Dynaface AI اسسٹنٹ ہوں۔\n\nمیں آپ کی مدد کر سکتا ہوں:\n• چھٹی کی درخواستیں\n• چھٹی کا بیلنس\n• حاضری\n\nآج میں آپ کی کیسے مدد کر سکتا ہوں؟',
//       ar: '👋 مرحباً! أنا مساعد Dynaface AI الخاص بك.\n\nيمكنني مساعدتك في:\n• طلبات الإجازة\n• رصيد الإجازة\n• الحضور\n\nكيف يمكنني مساعدتك اليوم؟',
//     };
//     return messages[lang] || messages.en;
//   };

//   /* -------------------- Pulse Animation -------------------- */
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
//       pulseAnim.setValue(1);
//     }
//   }, [isTyping, pulseAnim]);

//   /* -------------------- Recording Animation -------------------- */
//   useEffect(() => {
//     if (isRecording) {
//       Animated.loop(
//         Animated.sequence([
//           Animated.timing(micScaleAnim, {
//             toValue: 1.3,
//             duration: 600,
//             useNativeDriver: true,
//           }),
//           Animated.timing(micScaleAnim, {
//             toValue: 1,
//             duration: 600,
//             useNativeDriver: true,
//           }),
//         ]),
//       ).start();
//     } else {
//       micScaleAnim.setValue(1);
//     }
//   }, [isRecording, micScaleAnim]);

//   /* -------------------- Voice Recording -------------------- */
//   const startRecording = async () => {
//     try {
//       console.log('🎤 Starting voice recording...');

//       const result = await VoiceRecordingService.startRecording();

//       if (!result.success) {
//         Alert.alert(
//           'Permission Required',
//           'Please allow microphone access to use voice messages.',
//         );
//         return;
//       }

//       setIsRecording(true);
//       setRecordingDuration(0);

//       // Update duration every 100ms
//       recordingTimer.current = setInterval(() => {
//         setRecordingDuration(prev => prev + 0.1);
//       }, 100);

//       console.log('✅ Recording started');
//     } catch (error) {
//       console.error('❌ Start recording error:', error);
//       Alert.alert('Error', 'Failed to start recording. Please try again.');
//     }
//   };

//   const stopRecording = async () => {
//     try {
//       console.log('🛑 Stopping voice recording...');

//       // Clear timer
//       if (recordingTimer.current) {
//         clearInterval(recordingTimer.current);
//         recordingTimer.current = null;
//       }

//       setIsRecording(false);
//       setIsProcessingVoice(true);

//       // Get transcription directly from voice service
//       const result = await VoiceRecordingService.stopRecording();

//       if (!result.success) {
//         throw new Error('Failed to get transcription');
//       }

//       console.log('✅ Transcription:', {
//         text: result.text,
//         resultsCount: result.results?.length || 0,
//       });

//       let finalText = result.text || '';

//       // Check if we have valid text
//       if (!finalText.trim()) {
//         Alert.alert(
//           'No Speech Detected',
//           'Please speak clearly and try again.',
//         );
//         setIsProcessingVoice(false);
//         return;
//       }

//       setIsProcessingVoice(false);

//       // Show what was said
//       addMessage(`🎤 "${finalText}"`, 'user');

//       // Process the transcribed text
//       await handleSend(finalText);
//     } catch (error) {
//       console.error('❌ Voice processing error:', error);
//       Alert.alert(
//         'Error',
//         'Failed to process voice message. Please try again.',
//       );
//       setIsProcessingVoice(false);
//     }
//   };

//   const cancelRecording = async () => {
//     try {
//       if (recordingTimer.current) {
//         clearInterval(recordingTimer.current);
//         recordingTimer.current = null;
//       }

//       await VoiceRecordingService.cancelRecording();
//       setIsRecording(false);
//       setRecordingDuration(0);

//       console.log('🗑️ Recording cancelled');
//     } catch (error) {
//       console.error('❌ Cancel error:', error);
//     }
//   };

//   /* -------------------- Message Handling -------------------- */
//   const addMessage = (text, from) => {
//     const newMsg = {
//       id: `${Date.now()}-${Math.random()}`,
//       text: String(text),
//       from,
//       timestamp: Date.now(),
//     };

//     dispatch(chatbotAddMessage(newMsg));

//     setTimeout(() => {
//       flatListRef.current?.scrollToEnd({animated: true});
//     }, 100);
//   };

//   /* -------------------- Navigation -------------------- */
//   const navigateToScreen = (screenName, params = {}) => {
//     console.log(`🚀 Navigating to: ${screenName}`);
//     onClose();

//     setTimeout(() => {
//       navigation.navigate(screenName, {
//         employeeId: userData?.employeeId,
//         employeeName: userData?.employeeName,
//         WorkerRecId: userData?.WorkerRecId,
//         userData: userData,
//         cameFrom: 'MainDashboard',
//         ...params,
//       });
//     }, 300);
//   };

//   /* -------------------- Main Send Handler -------------------- */
//   const handleSend = async textOverride => {
//     const text = (textOverride || input).trim();
//     if (!text || processingRef.current) return;

//     processingRef.current = true;
//     setInput('');
//     setShowQuickActions(false);

//     // Only add user message if not already added (from voice)
//     if (!textOverride) {
//       addMessage(text, 'user');
//     }

//     setIsTyping(true);

//     try {
//       const functions = leaveService.current.getFunctionDefinitions();

//       const aiResponse = await azureAIService.chat({
//         userMessage: text,
//         conversationHistory: messages,
//         availableFunctions: functions,
//         userData: userData,
//         preferredLanguage: language,
//       });

//       if (aiResponse.type === 'function_call') {
//         await handleFunctionCall(aiResponse);
//       } else {
//         addMessage(aiResponse.text, 'bot');
//       }
//     } catch (err) {
//       console.error('❌ Chat error:', err);
//       addMessage('Sorry, something went wrong. Please try again.', 'bot');
//     } finally {
//       processingRef.current = false;
//       setIsTyping(false);
//     }
//   };

//   /* -------------------- Function Call Handler -------------------- */
//   const handleFunctionCall = async functionCall => {
//     try {
//       console.log('🔧 Executing:', functionCall.function);

//       const params = {
//         ...functionCall.parameters,
//         employeeId: functionCall.parameters.employeeId || userData?.employeeId,
//       };

//       const result = await leaveService.current.execute(
//         functionCall.function,
//         params,
//       );

//       console.log('✅ Function result:', result);

//       if (
//         functionCall.function === 'create_and_submit_leave' &&
//         result.success
//       ) {
//         const continueResponse = await azureAIService.continueAfterFunction({
//           previousMessages: messages,
//           functionName: functionCall.function,
//           functionResult: result,
//           userData,
//           preferredLanguage: language,
//         });

//         addMessage(continueResponse.text, 'bot');

//         setTimeout(() => {
//           navigateToScreen('LeavesListPage', {
//             highlightRecId: result.requestId,
//           });
//         }, 2000);
//       } else {
//         const continueResponse = await azureAIService.continueAfterFunction({
//           previousMessages: messages,
//           functionName: functionCall.function,
//           functionResult: result,
//           userData,
//           preferredLanguage: language,
//         });

//         addMessage(continueResponse.text, 'bot');

//         if (continueResponse.type === 'function_call') {
//           await handleFunctionCall(continueResponse);
//         }
//       }
//     } catch (error) {
//       console.error('❌ Function execution error:', error);
//       addMessage("Sorry, I couldn't complete that action.", 'bot');
//     }
//   };

//   /* -------------------- Language Selector -------------------- */
//   const LanguageButton = ({code, label, flag}) => (
//     <TouchableOpacity
//       onPress={() => {
//         setLanguage(code);
//         addMessage(getWelcomeMessage(code), 'bot');
//       }}
//       style={[styles.langButton, language === code && styles.langButtonActive]}>
//       <Text style={styles.langFlag}>{flag}</Text>
//       <Text style={[styles.langLabel, language === code && {color: '#fff'}]}>
//         {label}
//       </Text>
//     </TouchableOpacity>
//   );

//   /* -------------------- Quick Actions -------------------- */
//   const QuickActionButton = ({icon, label, gradient, onPress}) => (
//     <TouchableOpacity onPress={onPress} style={styles.quickActionWrapper}>
//       <LinearGradient
//         colors={gradient}
//         start={{x: 0, y: 0}}
//         end={{x: 1, y: 1}}
//         style={styles.quickAction}>
//         <Icon name={icon} size={28} color="#fff" />
//         <Text style={styles.quickActionLabel}>{label}</Text>
//       </LinearGradient>
//     </TouchableOpacity>
//   );

//   const renderQuickActions = () => {
//     if (!showQuickActions || messages.length > 1) return null;

//     const actions = {
//       en: [
//         {
//           icon: 'event-note',
//           label: 'Request Leave',
//           action: 'I want to request a leave',
//         },
//         {
//           icon: 'account-balance-wallet',
//           label: 'Check Balance',
//           action: 'Check my leave balance',
//         },
//         {
//           icon: 'list-alt',
//           label: 'View Leaves',
//           action: 'Show my leave requests',
//         },
//         {icon: 'schedule', label: 'Attendance', action: 'Mark attendance'},
//       ],
//       ur: [
//         {
//           icon: 'event-note',
//           label: 'چھٹی کی درخواست',
//           action: 'مجھے چھٹی چاہیے',
//         },
//         {
//           icon: 'account-balance-wallet',
//           label: 'بیلنس چیک',
//           action: 'میرا بیلنس چیک کریں',
//         },
//         {
//           icon: 'list-alt',
//           label: 'چھٹیاں دیکھیں',
//           action: 'میری چھٹیاں دکھائیں',
//         },
//         {icon: 'schedule', label: 'حاضری', action: 'حاضری لگائیں'},
//       ],
//       ar: [
//         {icon: 'event-note', label: 'طلب إجازة', action: 'أريد طلب إجازة'},
//         {
//           icon: 'account-balance-wallet',
//           label: 'رصيد',
//           action: 'تحقق من رصيدي',
//         },
//         {icon: 'list-alt', label: 'عرض الإجازات', action: 'أظهر طلبات إجازتي'},
//         {icon: 'schedule', label: 'حضور', action: 'تسجيل الحضور'},
//       ],
//     };

//     const gradients = [
//       ['#667eea', '#764ba2'],
//       ['#f093fb', '#f5576c'],
//       ['#4facfe', '#00f2fe'],
//       ['#43e97b', '#38f9d7'],
//     ];

//     return (
//       <View style={styles.quickActionsContainer}>
//         <Text style={styles.quickActionsTitle}>Quick Actions:</Text>
//         <View style={styles.quickActionsGrid}>
//           {actions[language].map((action, index) => (
//             <QuickActionButton
//               key={index}
//               icon={action.icon}
//               label={action.label}
//               gradient={gradients[index]}
//               onPress={() => handleSend(action.action)}
//             />
//           ))}
//         </View>
//       </View>
//     );
//   };

//   /* -------------------- Render Methods -------------------- */
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

//   /* -------------------- Voice Recording UI -------------------- */
//   const renderRecordingUI = () => {
//     if (!isRecording && !isProcessingVoice) return null;

//     return (
//       <View style={styles.recordingOverlay}>
//         <LinearGradient
//           colors={['rgba(245, 87, 108, 0.95)', 'rgba(240, 147, 251, 0.95)']}
//           style={styles.recordingContainer}>
//           {isProcessingVoice ? (
//             <>
//               <ActivityIndicator size="large" color="#fff" />
//               <Text style={styles.recordingText}>Processing voice...</Text>
//             </>
//           ) : (
//             <>
//               <Animated.View style={{transform: [{scale: micScaleAnim}]}}>
//                 <Icon name="mic" size={60} color="#fff" />
//               </Animated.View>
//               <Text style={styles.recordingText}>
//                 Recording... {recordingDuration.toFixed(1)}s
//               </Text>
//               <Text style={styles.recordingHint}>
//                 Release to send • Slide to cancel
//               </Text>
//             </>
//           )}
//         </LinearGradient>
//       </View>
//     );
//   };

//   return (
//     <Modal visible={visible} transparent animationType="slide">
//       <KeyboardAvoidingView
//         style={styles.overlay}
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
//         <View style={styles.sheet}>
//           {/* Header */}
//           <LinearGradient
//             colors={['#667eea', '#764ba2']}
//             start={{x: 0, y: 0}}
//             end={{x: 1, y: 0}}
//             style={styles.header}>
//             <View style={styles.headerLeft}>
//               <Icon
//                 name="smart-toy"
//                 size={32}
//                 color="#fff"
//                 style={{marginRight: 12}}
//               />
//               <View>
//                 <Text style={styles.title}>Dynaface AI</Text>
//                 <Text style={styles.status}>● Online</Text>
//               </View>
//             </View>
//             <TouchableOpacity onPress={onClose} style={styles.closeButton}>
//               <Icon name="close" size={24} color="#fff" />
//             </TouchableOpacity>
//           </LinearGradient>

//           {/* Language Selector */}
//           <View style={styles.languageBar}>
//             <LanguageButton code="en" label="English" flag="🇬🇧" />
//             <LanguageButton code="ur" label="اردو" flag="🇵🇰" />
//             <LanguageButton code="ar" label="العربية" flag="🇸🇦" />
//           </View>

//           {/* Messages */}
//           <FlatList
//             ref={flatListRef}
//             data={messages}
//             renderItem={renderItem}
//             keyExtractor={item => item.id}
//             contentContainerStyle={styles.chatContainer}
//             showsVerticalScrollIndicator={false}
//             ListFooterComponent={
//               <>
//                 {isTyping && renderTypingIndicator()}
//                 {renderQuickActions()}
//               </>
//             }
//           />

//           {/* Input Bar */}
//           <View style={styles.inputRow}>
//             {/* Voice Button - WhatsApp Style */}
//             <TouchableOpacity
//               onPressIn={startRecording}
//               onPressOut={stopRecording}
//               onLongPress={() => {}} // Prevent context menu
//               delayLongPress={500}
//               style={styles.iconButton}
//               disabled={isProcessingVoice}>
//               <LinearGradient
//                 colors={
//                   isRecording ? ['#f5576c', '#f093fb'] : ['#667eea', '#764ba2']
//                 }
//                 style={styles.iconButtonGradient}>
//                 <Icon
//                   name={isRecording ? 'stop' : 'mic'}
//                   size={24}
//                   color="#fff"
//                 />
//               </LinearGradient>
//             </TouchableOpacity>

//             <TextInput
//               value={input}
//               onChangeText={setInput}
//               placeholder="Type or hold mic to speak..."
//               placeholderTextColor="#999"
//               style={styles.input}
//               onSubmitEditing={() => handleSend()}
//               multiline
//               maxLength={500}
//               editable={!isRecording && !isProcessingVoice}
//             />

//             <TouchableOpacity
//               onPress={() => handleSend()}
//               style={styles.iconButton}
//               disabled={!input.trim() || isRecording || isProcessingVoice}>
//               <LinearGradient
//                 colors={
//                   input.trim() ? ['#43e97b', '#38f9d7'] : ['#ddd', '#ccc']
//                 }
//                 style={styles.iconButtonGradient}>
//                 <Icon name="send" size={24} color="#fff" />
//               </LinearGradient>
//             </TouchableOpacity>
//           </View>

//           {/* Recording Overlay */}
//           {renderRecordingUI()}
//         </View>
//       </KeyboardAvoidingView>
//     </Modal>
//   );
// };

// /* -------------------- Styles -------------------- */
// const styles = StyleSheet.create({
//   overlay: {
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
//   headerLeft: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   title: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#fff',
//   },
//   status: {
//     fontSize: 12,
//     color: '#e0e0e0',
//     marginTop: 2,
//   },
//   closeButton: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: 'rgba(255,255,255,0.2)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   languageBar: {
//     flexDirection: 'row',
//     padding: 8,
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//     justifyContent: 'center',
//   },
//   langButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     marginHorizontal: 4,
//     borderRadius: 16,
//     backgroundColor: '#f5f5f5',
//   },
//   langButtonActive: {
//     backgroundColor: '#667eea',
//   },
//   langFlag: {
//     fontSize: 16,
//     marginRight: 4,
//   },
//   langLabel: {
//     fontSize: 12,
//     fontWeight: '600',
//     color: '#333',
//   },
//   chatContainer: {
//     padding: 16,
//     paddingBottom: 8,
//   },
//   quickActionsContainer: {
//     marginTop: 16,
//     padding: 16,
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: 2},
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   quickActionsTitle: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#666',
//     marginBottom: 12,
//   },
//   quickActionsGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 8,
//   },
//   quickActionWrapper: {
//     width: '48%',
//     marginBottom: 8,
//   },
//   quickAction: {
//     padding: 12,
//     borderRadius: 12,
//     alignItems: 'center',
//     minHeight: 80,
//     justifyContent: 'center',
//   },
//   quickActionLabel: {
//     fontSize: 12,
//     color: '#fff',
//     fontWeight: '600',
//     textAlign: 'center',
//     marginTop: 4,
//   },
//   messageContainer: {
//     flexDirection: 'row',
//     marginVertical: 6,
//     alignItems: 'flex-end',
//   },
//   botContainer: {
//     justifyContent: 'flex-start',
//   },
//   userContainer: {
//     justifyContent: 'flex-end',
//   },
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
//   botBubble: {
//     backgroundColor: '#ffffff',
//     borderBottomLeftRadius: 4,
//   },
//   userBubble: {
//     backgroundColor: '#667eea',
//     borderBottomRightRadius: 4,
//   },
//   messageText: {
//     fontSize: 15,
//     color: '#1a1a1a',
//     lineHeight: 20,
//   },
//   userMessageText: {
//     color: '#ffffff',
//   },
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
//   inputRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 12,
//     backgroundColor: '#ffffff',
//     borderTopWidth: 1,
//     borderTopColor: '#eee',
//   },
//   iconButton: {
//     width: 48,
//     height: 48,
//   },
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
//   },
//   recordingOverlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0,0,0,0.3)',
//   },
//   recordingContainer: {
//     padding: 40,
//     borderRadius: 24,
//     alignItems: 'center',
//     minWidth: 200,
//   },
//   recordingText: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: '600',
//     marginTop: 16,
//   },
//   recordingHint: {
//     color: '#fff',
//     fontSize: 12,
//     marginTop: 8,
//     opacity: 0.9,
//   },
// });
// export default AIChatbot;

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/* eslint-disable no-shadow */
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
// import {LeaveRequestHandler} from './ChatbotIntentHandler';
import VoiceRecordingService from '../../services/VoiceRecordingService';

import {
  chatbotAddMessage,
  chatbotSetMessages,
} from '../../store/slices/chatbotSlice';

const AIChatbot = ({visible, onClose}) => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  // const navigation = useNavigation();
  const {userData} = useSelector(s => s.user || {});
  const messages = useSelector(s => s.chatbot?.messages || []);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [language, setLanguage] = useState('en');

  // Voice states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  const processingRef = useRef(false);
  const flatListRef = useRef(null);
  const leaveService = useRef(new LeaveService());
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const recordingTimer = useRef(null);
  const micScaleAnim = useRef(new Animated.Value(1)).current;

  /* -------------------- Initialize -------------------- */
  useEffect(() => {
    if (!visible) return;

    if (!messages || messages.length === 0) {
      const welcomeMsg = {
        id: 'welcome-1',
        text: getWelcomeMessage(language),
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

  const clearTimers = () => {
    if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
      recordingTimer.current = null;
    }
  };

  /* -------------------- Welcome Message -------------------- */
  const getWelcomeMessage = lang => {
    const messages = {
      en: "👋 Hello! I'm your Dynaface AI Assistant.\n\nI can help you with:\n• Leave Requests\n• Leave Balance\n• Attendance\n\nJust tell me what you need in your own words!",
      ur: '👋 السلام علیکم! میں آپ کا Dynaface AI اسسٹنٹ ہوں۔\n\nمیں آپ کی مدد کر سکتا ہوں:\n• چھٹی کی درخواستیں\n• چھٹی کا بیلنس\n• حاضری\n\nبس اپنے الفاظ میں بتائیں کہ آپ کو کیا چاہیے!',
      ar: '👋 مرحباً! أنا مساعد Dynaface AI الخاص بك.\n\nيمكنني مساعدتك في:\n• طلبات الإجازة\n• رصيد الإجازة\n• الحضور\n\nفقط أخبرني بما تحتاجه بكلماتك الخاصة!',
    };
    return messages[lang] || messages.en;
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
      console.log('🎤 User pressed mic button');

      const result = await VoiceRecordingService.startRecording();

      if (!result.success) {
        Alert.alert('Permission Required', result.error);
        return;
      }

      setIsRecording(true);
      setRecordingDuration(0);

      // Update duration every 100ms
      recordingTimer.current = setInterval(() => {
        setRecordingDuration(prev => prev + 0.1);
      }, 100);

      console.log('✅ Recording UI started');
    } catch (error) {
      console.error('❌ Start recording UI error:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    try {
      console.log('🛑 User released mic button');

      clearTimers();
      setIsRecording(false);
      setIsProcessingVoice(true);

      const result = await VoiceRecordingService.stopRecording();

      console.log('📊 Voice result:', result);

      if (!result.success) {
        // Show error with helpful tip
        const errorMessage = result.tip
          ? `${result.error}\n\n💡 ${result.tip}`
          : result.error;

        Alert.alert(
          'Voice Recognition',
          errorMessage,
          [
            {
              text: 'Type Instead',
              onPress: () => {
                // Focus on text input
                setIsProcessingVoice(false);
              },
            },
            {
              text: 'Try Again',
              onPress: () => {
                setIsProcessingVoice(false);
              },
            },
          ],
          {cancelable: false},
        );

        setIsProcessingVoice(false);
        return;
      }

      const finalText = result.text?.trim();

      if (!finalText || finalText.length === 0) {
        Alert.alert(
          'No Speech Detected',
          'Please speak clearly and try again, or type your message instead.',
          [{text: 'OK', onPress: () => setIsProcessingVoice(false)}],
        );
        setIsProcessingVoice(false);
        return;
      }

      setIsProcessingVoice(false);

      // Show what was recognized
      addMessage(`🎤 "${finalText}"`, 'user');

      // Process the text
      await handleSend(finalText);
    } catch (error) {
      console.error('❌ Stop recording error:', error);
      Alert.alert(
        'Error',
        'Failed to process voice. Please try typing your message instead.',
        [{text: 'OK', onPress: () => setIsProcessingVoice(false)}],
      );
      setIsProcessingVoice(false);
    }
  };

  const cancelRecording = async () => {
    try {
      clearTimers();
      await VoiceRecordingService.cancelRecording();
      setIsRecording(false);
      setRecordingDuration(0);
      console.log('🗑️ Recording cancelled');
    } catch (error) {
      console.error('❌ Cancel error:', error);
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

  /* -------------------- Main Send Handler -------------------- */
  const handleSend = async textOverride => {
    const text = (textOverride || input).trim();
    if (!text || processingRef.current) {
      return;
    }

    processingRef.current = true;
    setInput('');
    setShowQuickActions(false);

    if (!textOverride) {
      addMessage(text, 'user');
    }

    setIsTyping(true);

    try {
      const functions = leaveService.current.getFunctionDefinitions();

      console.log('💬 User message:', text);

      const aiResponse = await azureAIService.chat({
        userMessage: text,
        conversationHistory: messages,
        availableFunctions: functions,
        userData: userData,
        preferredLanguage: language,
      });

      console.log('🤖 AI response:', aiResponse);

      if (aiResponse.type === 'function_call') {
        await handleFunctionCall(aiResponse);
      } else {
        addMessage(aiResponse.text, 'bot');
      }
    } catch (err) {
      console.error('❌ Chat error:', err);
      addMessage(
        'Sorry, I encountered an error. Please try again or rephrase your request.',
        'bot',
      );
    } finally {
      processingRef.current = false;
      setIsTyping(false);
    }
  };

  /* -------------------- Smart Function Call Handler -------------------- */
  const handleFunctionCall = async functionCall => {
    try {
      console.log('🔧 Executing function:', functionCall.function);
      console.log('📥 Parameters:', functionCall.parameters);

      // Execute the function with smart parameter filling
      const result = await leaveService.current.execute(
        functionCall.function,
        functionCall.parameters,
        userData,
      );

      console.log('📤 Function result:', result);

      // Handle function result based on success/error
      if (!result.success) {
        await handleFunctionError(functionCall, result);
        return;
      }

      // Handle successful function execution
      await handleFunctionSuccess(functionCall, result);
    } catch (error) {
      console.error('❌ Function execution error:', error);
      addMessage(
        "I encountered an error while processing your request. Let's try a different approach.",
        'bot',
      );
    }
  };

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
      preferredLanguage: language,
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

    // Special handling for leave creation
    if (functionCall.function === 'create_leave_request' && result.success) {
      // Ask AI to summarize and offer to submit
      const continueResponse = await azureAIService.continueAfterFunction({
        previousMessages: messages,
        functionName: functionCall.function,
        functionResult: result,
        userData,
        preferredLanguage: language,
        availableFunctions: leaveService.current.getFunctionDefinitions(),
        toolCallId: functionCall.toolCallId,
      });

      addMessage(continueResponse.text, 'bot');

      // If user confirms submission, AI might call submit_leave_request
      if (continueResponse.type === 'function_call') {
        await handleFunctionCall(continueResponse);
      }

      return;
    }

    // Special handling for leave submission
    if (functionCall.function === 'submit_leave_request' && result.success) {
      const continueResponse = await azureAIService.continueAfterFunction({
        previousMessages: messages,
        functionName: functionCall.function,
        functionResult: result,
        userData,
        preferredLanguage: language,
        availableFunctions: leaveService.current.getFunctionDefinitions(),
        toolCallId: functionCall.toolCallId,
      });

      addMessage(continueResponse.text, 'bot');

      // Navigate to leaves list after a delay
      setTimeout(() => {
        navigateToScreen('LeavesListPage', {
          highlightRecId: result.requestId,
        });
      }, 2000);

      return;
    }

    // Default: Let AI interpret and respond
    const continueResponse = await azureAIService.continueAfterFunction({
      previousMessages: messages,
      functionName: functionCall.function,
      functionResult: result,
      userData,
      preferredLanguage: language,
      availableFunctions: leaveService.current.getFunctionDefinitions(),
      toolCallId: functionCall.toolCallId,
    });

    addMessage(continueResponse.text, 'bot');

    // Handle chained function calls
    if (continueResponse.type === 'function_call') {
      await handleFunctionCall(continueResponse);
    }
  };

  /* -------------------- UI Components -------------------- */
  const LanguageButton = ({code, label, flag}) => (
    <TouchableOpacity
      onPress={() => {
        setLanguage(code);
        addMessage(getWelcomeMessage(code), 'bot');
      }}
      style={[styles.langButton, language === code && styles.langButtonActive]}>
      <Text style={styles.langFlag}>{flag}</Text>
      <Text style={[styles.langLabel, language === code && {color: '#fff'}]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const QuickActionButton = ({icon, label, gradient, onPress}) => (
    <TouchableOpacity onPress={onPress} style={styles.quickActionWrapper}>
      <LinearGradient
        colors={gradient}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.quickAction}>
        <Icon name={icon} size={28} color="#fff" />
        <Text style={styles.quickActionLabel}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderQuickActions = () => {
    if (!showQuickActions || messages.length > 1) return null;

    const actions = {
      en: [
        {
          icon: 'event-note',
          label: 'Request Leave',
          action: 'I want to request a leave',
        },
        {
          icon: 'account-balance-wallet',
          label: 'Check Balance',
          action: 'Check my leave balance',
        },
        {
          icon: 'list-alt',
          label: 'View Leaves',
          action: 'Show my leave requests',
        },
        {icon: 'schedule', label: 'Attendance', action: 'Mark attendance'},
      ],
      ur: [
        {
          icon: 'event-note',
          label: 'چھٹی کی درخواست',
          action: 'مجھے چھٹی چاہیے',
        },
        {
          icon: 'account-balance-wallet',
          label: 'بیلنس چیک',
          action: 'میرا بیلنس چیک کریں',
        },
        {
          icon: 'list-alt',
          label: 'چھٹیاں دیکھیں',
          action: 'میری چھٹیاں دکھائیں',
        },
        {icon: 'schedule', label: 'حاضری', action: 'حاضری لگائیں'},
      ],
      ar: [
        {icon: 'event-note', label: 'طلب إجازة', action: 'أريد طلب إجازة'},
        {
          icon: 'account-balance-wallet',
          label: 'رصيد',
          action: 'تحقق من رصيدي',
        },
        {icon: 'list-alt', label: 'عرض الإجازات', action: 'أظهر طلبات إجازتي'},
        {icon: 'schedule', label: 'حضور', action: 'تسجيل الحضور'},
      ],
    };

    const gradients = [
      ['#667eea', '#764ba2'],
      ['#f093fb', '#f5576c'],
      ['#4facfe', '#00f2fe'],
      ['#43e97b', '#38f9d7'],
    ];

    return (
      <View style={styles.quickActionsContainer}>
        <Text style={styles.quickActionsTitle}>Quick Actions:</Text>
        <View style={styles.quickActionsGrid}>
          {actions[language].map((action, index) => (
            <QuickActionButton
              key={index}
              icon={action.icon}
              label={action.label}
              gradient={gradients[index]}
              onPress={() => handleSend(action.action)}
            />
          ))}
        </View>
      </View>
    );
  };

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

  const renderRecordingUI = () => {
    if (!isRecording && !isProcessingVoice) return null;

    return (
      <View style={styles.recordingOverlay}>
        <LinearGradient
          colors={['rgba(245, 87, 108, 0.95)', 'rgba(240, 147, 251, 0.95)']}
          style={styles.recordingContainer}>
          {isProcessingVoice ? (
            <>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.recordingText}>Processing voice...</Text>
            </>
          ) : (
            <>
              <Animated.View style={{transform: [{scale: micScaleAnim}]}}>
                <Icon name="mic" size={60} color="#fff" />
              </Animated.View>
              <Text style={styles.recordingText}>
                Recording... {recordingDuration.toFixed(1)}s
              </Text>
              <Text style={styles.recordingHint}>Release to send</Text>
            </>
          )}
        </LinearGradient>
      </View>
    );
  };

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

            {/* Language Bar */}
            <View style={styles.languageBar}>
              <LanguageButton code="en" label="English" flag="🇬🇧" />
              <LanguageButton code="ur" label="اردو" flag="🇵🇰" />
              <LanguageButton code="ar" label="العربية" flag="🇸🇦" />
            </View>

            {/* Messages */}
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.chatContainer}
              showsVerticalScrollIndicator={false}
              ListFooterComponent={
                <>
                  {isTyping && renderTypingIndicator()}
                  {renderQuickActions()}
                </>
              }
            />

            {/* Input Bar */}
            <View style={styles.inputRow}>
              <TouchableOpacity
                onPressIn={startRecording}
                onPressOut={stopRecording}
                style={styles.iconButton}
                disabled={isProcessingVoice}>
                <LinearGradient
                  colors={
                    isRecording
                      ? ['#FF3B30', '#FF9500']
                      : ['#667eea', '#764ba2']
                  }
                  style={styles.iconButtonGradient}>
                  <Icon name="mic" size={24} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>

              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Type or hold mic to speak..."
                placeholderTextColor="#999"
                style={styles.input}
                onSubmitEditing={() => handleSend()}
                multiline
                maxLength={500}
                editable={!isRecording && !isProcessingVoice}
              />

              <TouchableOpacity
                onPress={() => handleSend()}
                style={styles.iconButton}
                disabled={!input.trim() || isRecording || isProcessingVoice}>
                <LinearGradient
                  colors={
                    input.trim() ? ['#43e97b', '#38f9d7'] : ['#ddd', '#ccc']
                  }
                  style={styles.iconButtonGradient}>
                  <Icon name="send" size={24} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Recording Overlay */}
            {renderRecordingUI()}
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
  languageBar: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    justifyContent: 'center',
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
  },
  langButtonActive: {backgroundColor: '#667eea'},
  langFlag: {fontSize: 16, marginRight: 4},
  langLabel: {fontSize: 12, fontWeight: '600', color: '#333'},
  chatContainer: {padding: 16, paddingBottom: 8},
  quickActionsContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickActionWrapper: {width: '48%', marginBottom: 8},
  quickAction: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
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
  recordingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingContainer: {
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    minWidth: 200,
  },
  recordingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  recordingHint: {
    color: '#fff',
    fontSize: 12,
    marginTop: 8,
    opacity: 0.9,
  },
});

export default AIChatbot;
