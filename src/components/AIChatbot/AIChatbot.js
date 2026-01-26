/* eslint-disable no-unused-vars */
// /* eslint-disable no-shadow */
// /* eslint-disable react-native/no-inline-styles */
// import React, {useEffect, useState, useRef, useCallback} from 'react';
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
//   Alert,
//   KeyboardAvoidingView,
// } from 'react-native';
// import {useSelector, useDispatch} from 'react-redux';
// import Voice from '@react-native-voice/voice';
// import Geolocation from '@react-native-community/geolocation';
// import moment from 'moment';
// import {CreateAttendance} from '../../API/Attendance/CreateAttendance';
// import {GetGPSCoordinates} from '../../API/Attendance/GetGPSCoordinates';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// // Import Azure AI Service
// import azureAIService from '../../services/AzureAIService';

// import {
//   chatbotAddMessage,
//   chatbotSetMessages,
// } from '../../store/slices/chatbotSlice';

// /* -------------------- Geofence / Location Helpers -------------------- */
// const GEO_TTL_MS = 30 * 60 * 1000;
// const FRESH_FIX_MS = 30 * 1000;
// const MAX_ALLOWED_ACCURACY = 150;
// const GEOF_KEY = 'df_geofences_v1';

// const saveGeofences = async sites => {
//   try {
//     await AsyncStorage.setItem(
//       GEOF_KEY,
//       JSON.stringify({
//         ts: Date.now(),
//         sites: Array.isArray(sites) ? sites : [],
//       }),
//     );
//   } catch {}
// };

// const loadGeofences = async () => {
//   try {
//     const raw = await AsyncStorage.getItem(GEOF_KEY);
//     if (!raw) {
//       return {ts: 0, sites: []};
//     }
//     const obj = JSON.parse(raw);
//     return {
//       ts: obj?.ts || 0,
//       sites: Array.isArray(obj?.sites) ? obj.sites : [],
//     };
//   } catch {
//     return {ts: 0, sites: []};
//   }
// };

// const calculateDistance = (lat1, lon1, lat2, lon2) => {
//   const toRad = d => (d * Math.PI) / 180;
//   const R = 6371e3;
//   const φ1 = toRad(lat1);
//   const φ2 = toRad(lat2);
//   const dφ = toRad(lat2 - lat1);
//   const dλ = toRad(lon2 - lon1);
//   const a =
//     Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;
//   return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
// };

// const nearestWithEffective = (userLat, userLon, accuracy, points) => {
//   if (!points?.length) {
//     return null;
//   }
//   let best = null;
//   for (const p of points) {
//     const lat1 = Number(p.latitude);
//     const lon1 = Number(p.longitude);
//     if (!Number.isFinite(lat1) || !Number.isFinite(lon1)) {
//       continue;
//     }

//     const dNormal = calculateDistance(userLat, userLon, lat1, lon1);
//     const dSwapped = calculateDistance(userLat, userLon, lon1, lat1);
//     const useSwap = dSwapped < dNormal;
//     const chosenLat = useSwap ? lon1 : lat1;
//     const chosenLon = useSwap ? lat1 : lon1;
//     const d = useSwap ? dSwapped : dNormal;

//     if (!best || d < best.distance) {
//       best = {
//         latitude: chosenLat,
//         longitude: chosenLon,
//         radius: Number(p.radius),
//         distance: d,
//       };
//     }
//   }
//   if (!best) {
//     return null;
//   }
//   const acc = Number.isFinite(accuracy) ? Math.max(0, accuracy) : 0;
//   return {
//     ...best,
//     effectiveDistance: Math.max(0, best.distance - Math.min(acc, best.radius)),
//   };
// };

// /* -------------------- Language Picker Component -------------------- */
// const LanguagePickerComponent = ({
//   visible,
//   onClose,
//   currentLanguage,
//   onLanguageChange,
// }) => {
//   if (!visible) {
//     return null;
//   }

//   const languages = [
//     {code: 'en', name: 'English', flag: '🇬🇧'},
//     {code: 'ur', name: 'اردو', flag: '🇵🇰'},
//     {code: 'ar', name: 'العربية', flag: '🇸🇦'},
//   ];

//   return (
//     <View style={styles.languagePickerOverlay}>
//       <View style={styles.languagePickerContainer}>
//         <Text style={styles.languagePickerTitle}>
//           {currentLanguage === 'ur'
//             ? 'زبان منتخب کریں'
//             : currentLanguage === 'ar'
//             ? 'اختر اللغة'
//             : 'Select Language'}
//         </Text>
//         {languages.map(lang => (
//           <TouchableOpacity
//             key={lang.code}
//             style={[
//               styles.languageOption,
//               currentLanguage === lang.code && styles.selectedLanguageOption,
//             ]}
//             onPress={() => onLanguageChange(lang.code)}>
//             <Text style={styles.languageOptionText}>
//               {lang.flag} {lang.name}
//             </Text>
//             {currentLanguage === lang.code && (
//               <Text style={styles.selectedIndicator}>✓</Text>
//             )}
//           </TouchableOpacity>
//         ))}
//         <TouchableOpacity style={styles.closeLanguagePicker} onPress={onClose}>
//           <Text style={styles.closeLanguagePickerText}>
//             {currentLanguage === 'ur'
//               ? 'بند کریں'
//               : currentLanguage === 'ar'
//               ? 'إغلاق'
//               : 'Close'}
//           </Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// /* -------------------- Multilingual Support Functions -------------------- */
// // We'll use Azure AI for translations, keeping simple fallback
// const translateResponse = (text, targetLang) => {
//   // Simple fallback - in production, use Azure Translator
//   return text;
// };

// const getPlaceholderText = lang => {
//   switch (lang) {
//     case 'ur':
//       return 'اپنا پیغام ٹائپ کریں...';
//     case 'ar':
//       return 'اكتب رسالتك...';
//     default:
//       return 'Type your message...';
//   }
// };

// const getFlagEmoji = lang => {
//   switch (lang) {
//     case 'en':
//       return '🇬🇧';
//     case 'ur':
//       return '🇵🇰';
//     case 'ar':
//       return '🇸🇦';
//     default:
//       return '🌐';
//   }
// };

// const getLanguageName = lang => {
//   switch (lang) {
//     case 'en':
//       return 'English';
//     case 'ur':
//       return 'اردو';
//     case 'ar':
//       return 'العربية';
//     default:
//       return 'English';
//   }
// };

// /* -------------------- Chatbot Component -------------------- */
// const AIChatbot = ({visible, onClose}) => {
//   const dispatch = useDispatch();
//   const {userData} = useSelector(s => s.user || {});

//   const messages = useSelector(s => s.chatbot?.messages || []);

//   const [input, setInput] = useState('');
//   const [listening, setListening] = useState(false);
//   const [isTyping, setIsTyping] = useState(false);
//   const [currentLanguage, setCurrentLanguage] = useState('en');
//   const [showLanguagePicker, setShowLanguagePicker] = useState(false);

//   const processingRef = useRef(false);
//   const lastCoordsRef = useRef(null);
//   const geofenceCacheRef = useRef({sites: [], ts: 0});
//   const permissionStatusRef = useRef(null);
//   const flatListRef = useRef(null);

//   /* -------------------- Welcome Message -------------------- */
//   useEffect(() => {
//     if (!visible) {
//       return;
//     }

//     if (!messages || messages.length === 0) {
//       const welcomeMsg = {
//         id: 'welcome-1',
//         text: "👋 Hey there! I'm Dynaface AI Assistant.\nHow may I help you today?",
//         from: 'bot',
//         timestamp: Date.now(),
//       };
//       dispatch(chatbotSetMessages([welcomeMsg]));
//       speak(welcomeMsg.text);
//     }
//   }, [visible, messages.length, dispatch, messages]);

//   /* -------------------- Voice Cleanup -------------------- */
//   useEffect(() => {
//     return () => {
//       Voice.destroy().then(Voice.removeAllListeners);
//     };
//   }, []);

//   const startListening = async () => {
//     try {
//       if (Platform.OS === 'android') {
//         const granted = await PermissionsAndroid.request(
//           PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
//         );
//         if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
//           return;
//         }
//       }
//       Voice.onSpeechResults = e => {
//         const text = e?.value?.[0];
//         if (text) {
//           handleSend(text);
//         }
//         stopListening();
//       };
//       Voice.onSpeechError = () => stopListening();
//       setListening(true);
//       await Voice.start('en-US');
//     } catch {
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

//   const speak = text => {
//     try {
//       const TTS =
//         require('react-native-tts').default || require('react-native-tts');
//       TTS.stop();
//       TTS.speak(String(text));
//     } catch (e) {
//       // no-op
//     }
//   };

//   /* -------------------- Location Helpers -------------------- */
//   const ensureLocationPermission = useCallback(async () => {
//     if (permissionStatusRef.current !== null) {
//       return permissionStatusRef.current;
//     }
//     try {
//       if (Platform.OS === 'android') {
//         const fine = await PermissionsAndroid.check(
//           PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
//         );
//         if (fine) {
//           permissionStatusRef.current = true;
//           return true;
//         }
//         const result = await PermissionsAndroid.request(
//           PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
//         );
//         permissionStatusRef.current =
//           result === PermissionsAndroid.RESULTS.GRANTED;
//         return permissionStatusRef.current;
//       } else {
//         const auth = await Geolocation.requestAuthorization('whenInUse');
//         permissionStatusRef.current = auth === 'granted';
//         return permissionStatusRef.current;
//       }
//     } catch {
//       permissionStatusRef.current = false;
//       return false;
//     }
//   }, []);

//   const tryGetPosition = opts =>
//     new Promise((resolve, reject) => {
//       Geolocation.getCurrentPosition(
//         pos => resolve(pos.coords),
//         err => reject(err),
//         opts,
//       );
//     });

//   const getCurrentLocationFast = useCallback(async () => {
//     const now = Date.now();
//     if (
//       lastCoordsRef.current?.timestamp &&
//       now - lastCoordsRef.current.timestamp < FRESH_FIX_MS &&
//       (lastCoordsRef.current.accuracy ?? 9999) <= MAX_ALLOWED_ACCURACY
//     ) {
//       return lastCoordsRef.current;
//     }
//     const lowP = tryGetPosition({
//       enableHighAccuracy: false,
//       timeout: 3000,
//       maximumAge: 15000,
//     });
//     const hiP = tryGetPosition({
//       enableHighAccuracy: true,
//       timeout: 5000,
//       maximumAge: 10000,
//     });
//     let first;
//     try {
//       first = await Promise.race([lowP, hiP]);
//     } catch {
//       first = await tryGetPosition({
//         enableHighAccuracy: true,
//         timeout: 4000,
//         maximumAge: 5000,
//       });
//     }
//     lastCoordsRef.current = {...first, timestamp: Date.now()};
//     return first;
//   }, []);

//   const getGeofencesCached = useCallback(async (forceRefresh = false) => {
//     const now = Date.now();
//     if (forceRefresh) {
//       const sites = await GetGPSCoordinates().catch(() => []);
//       geofenceCacheRef.current = {sites, ts: now};
//       saveGeofences(sites);
//       return sites;
//     }
//     if (
//       geofenceCacheRef.current.sites.length &&
//       now - geofenceCacheRef.current.ts < GEO_TTL_MS
//     ) {
//       return geofenceCacheRef.current.sites;
//     }
//     const persisted = await loadGeofences();
//     if (persisted.sites.length && now - persisted.ts < GEO_TTL_MS) {
//       geofenceCacheRef.current = persisted;
//       return persisted.sites;
//     }
//     const sites = await GetGPSCoordinates().catch(() => []);
//     geofenceCacheRef.current = {sites, ts: now};
//     saveGeofences(sites);
//     return sites;
//   }, []);

//   const markAttendance = async () => {
//     if (!userData?.employeeId) {
//       return;
//     }
//     try {
//       const ok = await ensureLocationPermission();
//       if (!ok) {
//         Alert.alert('Error', 'Location permission required');
//         return;
//       }
//       addMessage('Fetching your location…', 'bot');

//       const [coords, geofences] = await Promise.all([
//         getCurrentLocationFast(),
//         getGeofencesCached(),
//       ]);
//       if (!coords?.latitude || !coords?.longitude) {
//         throw new Error('Unable to get valid location');
//       }
//       if (!geofences.length) {
//         throw new Error('No office geofence available');
//       }

//       const nearest = nearestWithEffective(
//         coords.latitude,
//         coords.longitude,
//         coords.accuracy,
//         geofences,
//       );
//       if (!nearest || nearest.effectiveDistance > nearest.radius) {
//         throw new Error(
//           `You are too far from office (~${Math.round(
//             nearest?.distance || 0,
//           )}m)`,
//         );
//       }

//       const payload = {
//         employeeId: userData.employeeId,
//         punchDateTime: moment().format('YYYY-MM-DDTHH:mm:ss[Z]'),
//         location: `${coords.latitude},${coords.longitude} (±${Math.round(
//           coords.accuracy,
//         )}m)`,
//       };
//       const res = await CreateAttendance(payload);

//       if (res?.isSuccess || res === true) {
//         addMessage('✅ Attendance marked successfully!', 'bot');
//         speak('Attendance marked successfully');
//       } else {
//         throw new Error(res?.message || 'Failed to mark attendance');
//       }
//     } catch (err) {
//       const msg = err?.message || 'Error marking attendance';
//       addMessage(`❌ ${msg}`, 'bot');
//       speak('Error marking attendance');
//     }
//   };

//   const handleLanguageChange = langCode => {
//     setCurrentLanguage(langCode);
//     setShowLanguagePicker(false);
//     // Show language change message
//     const changeMsg =
//       langCode === 'en'
//         ? 'Language changed to English'
//         : langCode === 'ur'
//         ? 'زبان اردو میں تبدیل ہو گئی'
//         : 'تم تغيير اللغة إلى العربية';
//     speak(changeMsg);
//   };

//   /* -------------------- SIMPLIFIED handleSend Function with Azure AI -------------------- */
//   const handleSend = async textOverride => {
//     const text = (textOverride || input).trim();
//     if (!text || processingRef.current) {
//       return;
//     }

//     processingRef.current = true;
//     setInput('');
//     addMessage(text, 'user');
//     setIsTyping(true);

//     try {
//       console.log('🤖 Processing with Azure AI:', text);

//       // Get conversation context
//       const context = await azureAIService.handleConversationFlow(messages);

//       // Send to Azure AI for intent detection and response
//       const aiResponse = await azureAIService.detectIntentWithAzureAI({
//         userInput: text,
//         context: context,
//       });

//       console.log('✅ Azure AI Response:', aiResponse);

//       // Show AI response
//       addMessage(aiResponse.responseText, 'bot');
//       speak(aiResponse.responseText);

//       // Execute action based on AI decision
//       switch (aiResponse.action) {
//         case 'mark_attendance':
//           // AI will handle confirmation in responseText
//           // We just need to execute if confirmed
//           if (
//             aiResponse.intent === 'attendance' &&
//             aiResponse.nextStep === 'confirming'
//           ) {
//             await markAttendance();
//           }
//           break;

//         case 'start_leave_flow':
//           // AI manages the conversation flow
//           // Parameters are already extracted
//           console.log('Leave parameters:', aiResponse.parameters);
//           // You can save these parameters for later use
//           break;

//         case 'check_balance':
//           // AI already knows which leave type
//           console.log('Balance check for:', aiResponse.parameters.leaveType);
//           // You can call your API here
//           break;

//         case 'show_info':
//           // Info already shown in responseText
//           break;

//         case 'ask_clarification':
//           // AI already asked for clarification in responseText
//           break;

//         default:
//           // Default case handled by AI response
//           break;
//       }
//     } catch (err) {
//       console.error('❌ Chat error:', err);
//       addMessage('Sorry, something went wrong. Please try again.', 'bot');
//       speak('Sorry, something went wrong');
//     } finally {
//       processingRef.current = false;
//       setIsTyping(false);
//     }
//   };

//   /* -------------------- Render Item -------------------- */
//   const renderItem = ({item}) => {
//     const isUser = item.from === 'user';
//     return (
//       <View
//         style={[
//           styles.messageContainer,
//           isUser ? styles.userContainer : styles.botContainer,
//         ]}>
//         {!isUser && (
//           <View style={styles.avatar}>
//             <Text style={styles.avatarText}>🤖</Text>
//           </View>
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
//           <View style={styles.avatar}>
//             <Text style={styles.avatarText}>👤</Text>
//           </View>
//         )}
//       </View>
//     );
//   };

//   const renderTypingIndicator = () => (
//     <View style={[styles.messageContainer, styles.botContainer]}>
//       <View style={styles.avatar}>
//         <Text style={styles.avatarText}>🤖</Text>
//       </View>
//       <View style={[styles.bubble, styles.botBubble]}>
//         <Text style={styles.typingText}>
//           {currentLanguage === 'ur'
//             ? 'ڈائنا فیس ٹائپ کر رہا ہے...'
//             : currentLanguage === 'ar'
//             ? 'ديانا فيس يكتب...'
//             : 'Dynaface is typing...'}
//         </Text>
//         <View style={styles.typingDots}>
//           <Text style={styles.dot}>•</Text>
//           <Text style={[styles.dot, {animationDelay: '0.2s'}]}>•</Text>
//           <Text style={[styles.dot, {animationDelay: '0.4s'}]}>•</Text>
//         </View>
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
//           <View style={styles.header}>
//             <View style={{flexDirection: 'row', alignItems: 'center'}}>
//               <Text style={styles.botAvatarLarge}>🤖</Text>
//               <View>
//                 <Text style={styles.title}>Dynaface AI Assistant</Text>
//                 <Text style={styles.status}>
//                   Online • {getLanguageName(currentLanguage)}
//                 </Text>
//               </View>
//             </View>

//             <View style={{flexDirection: 'row', alignItems: 'center'}}>
//               <TouchableOpacity
//                 onPress={() => setShowLanguagePicker(true)}
//                 style={styles.languageButton}>
//                 <Text style={styles.languageButtonText}>
//                   {getFlagEmoji(currentLanguage)}
//                 </Text>
//               </TouchableOpacity>
//               <TouchableOpacity onPress={onClose} style={styles.closeButton}>
//                 <Text style={styles.close}>✕</Text>
//               </TouchableOpacity>
//             </View>
//           </View>

//           {/* Messages */}
//           <FlatList
//             ref={flatListRef}
//             data={messages}
//             renderItem={renderItem}
//             keyExtractor={item => item.id}
//             contentContainerStyle={styles.chatContainer}
//             showsVerticalScrollIndicator={false}
//             ListFooterComponent={isTyping ? renderTypingIndicator : null}
//           />

//           {/* Input Bar */}
//           <View style={styles.inputRow}>
//             <TouchableOpacity
//               onPress={listening ? stopListening : startListening}
//               style={[styles.iconButton, listening && styles.listeningButton]}>
//               <Text style={styles.micIcon}>{listening ? '🎙️' : '🎤'}</Text>
//             </TouchableOpacity>

//             <TextInput
//               value={input}
//               onChangeText={setInput}
//               placeholder={getPlaceholderText(currentLanguage)}
//               placeholderTextColor="#888"
//               style={[
//                 styles.input,
//                 (currentLanguage === 'ur' || currentLanguage === 'ar') && {
//                   textAlign: 'right',
//                   fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
//                 },
//               ]}
//               onSubmitEditing={() => handleSend()}
//               multiline
//               textAlignVertical="center"
//             />

//             <TouchableOpacity
//               onPress={() => handleSend()}
//               style={[styles.iconButton, styles.sendButton]}
//               disabled={!input.trim()}>
//               <Text style={styles.sendIcon}>↑</Text>
//             </TouchableOpacity>
//           </View>

//           {/* Language Picker */}
//           <LanguagePickerComponent
//             visible={showLanguagePicker}
//             onClose={() => setShowLanguagePicker(false)}
//             currentLanguage={currentLanguage}
//             onLanguageChange={handleLanguageChange}
//           />
//         </View>
//       </KeyboardAvoidingView>
//     </Modal>
//   );
// };

// /* -------------------- Styles -------------------- */
// const styles = StyleSheet.create({
//   overlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.5)',
//     justifyContent: 'flex-end',
//   },
//   sheet: {
//     height: '80%',
//     backgroundColor: '#f8f9fa',
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     overflow: 'hidden',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 16,
//     backgroundColor: '#ffffff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//   },
//   title: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#1a1a1a',
//   },
//   status: {
//     fontSize: 12,
//     color: '#4CAF50',
//     marginTop: 2,
//   },
//   close: {
//     fontSize: 28,
//     color: '#666',
//   },
//   botAvatarLarge: {
//     fontSize: 32,
//     marginRight: 12,
//   },
//   languageButton: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: '#f0f0f0',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 10,
//   },
//   languageButtonText: {
//     fontSize: 20,
//   },
//   closeButton: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: '#f0f0f0',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   chatContainer: {
//     padding: 12,
//     paddingBottom: 8,
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
//     backgroundColor: '#e0e0e0',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginHorizontal: 8,
//   },
//   avatarText: {
//     fontSize: 20,
//   },
//   bubble: {
//     maxWidth: '75%',
//     paddingHorizontal: 14,
//     paddingVertical: 10,
//     borderRadius: 18,
//   },
//   botBubble: {
//     backgroundColor: '#ffffff',
//     borderBottomLeftRadius: 4,
//   },
//   userBubble: {
//     backgroundColor: '#007AFF',
//     borderBottomRightRadius: 4,
//   },
//   messageText: {
//     fontSize: 16,
//     color: '#1a1a1a',
//     lineHeight: 22,
//     textAlign: 'left',
//   },
//   userMessageText: {
//     color: '#ffffff',
//   },
//   timestamp: {
//     fontSize: 11,
//     color: '#999',
//     marginTop: 4,
//     alignSelf: 'flex-end',
//   },
//   typingText: {
//     fontSize: 15,
//     color: '#666',
//     fontStyle: 'italic',
//   },
//   typingDots: {
//     flexDirection: 'row',
//     marginTop: 4,
//   },
//   dot: {
//     fontSize: 18,
//     color: '#999',
//     marginHorizontal: 2,
//   },
//   inputRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 10,
//     backgroundColor: '#ffffff',
//     borderTopWidth: 1,
//     borderTopColor: '#eee',
//   },
//   iconButton: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f0f0f0',
//   },
//   listeningButton: {
//     backgroundColor: '#ff4444',
//   },
//   sendButton: {
//     backgroundColor: '#007AFF',
//   },
//   micIcon: {
//     fontSize: 22,
//   },
//   sendIcon: {
//     fontSize: 24,
//     color: '#fff',
//   },
//   input: {
//     flex: 1,
//     minHeight: 44,
//     maxHeight: 100,
//     borderRadius: 22,
//     paddingHorizontal: 16,
//     backgroundColor: '#f0f0f0',
//     marginHorizontal: 8,
//     fontSize: 16,
//     paddingVertical: 10,
//   },
//   languagePickerOverlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     backgroundColor: 'rgba(0,0,0,0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   languagePickerContainer: {
//     width: '80%',
//     maxHeight: '70%',
//     backgroundColor: 'white',
//     borderRadius: 20,
//     padding: 20,
//   },
//   languagePickerTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginBottom: 15,
//     textAlign: 'center',
//   },
//   languageOption: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 15,
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//   },
//   selectedLanguageOption: {
//     backgroundColor: '#e3f2fd',
//   },
//   languageOptionText: {
//     fontSize: 16,
//   },
//   selectedIndicator: {
//     fontSize: 18,
//     color: '#007AFF',
//     fontWeight: 'bold',
//   },
//   closeLanguagePicker: {
//     marginTop: 15,
//     padding: 12,
//     backgroundColor: '#007AFF',
//     borderRadius: 10,
//     alignItems: 'center',
//   },
//   closeLanguagePickerText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
// });

// export default AIChatbot;
// /* eslint-disable no-shadow */
// /* eslint-disable react-native/no-inline-styles */
// import React, {useEffect, useState, useRef, useCallback} from 'react';
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
// } from 'react-native';
// import {useSelector, useDispatch} from 'react-redux';
// import Voice from '@react-native-voice/voice';
// import moment from 'moment';
// import {useNavigation} from '@react-navigation/native';

// // Services
// import azureAIService from '../../services/AzureAIService';

// // Redux
// import {
//   chatbotAddMessage,
//   chatbotSetMessages,
//   chatbotSetPendingAction,
// } from '../../store/slices/chatbotSlice';

// /* -------------------- Language Picker -------------------- */
// const LanguagePickerComponent = ({
//   visible,
//   onClose,
//   currentLanguage,
//   onLanguageChange,
// }) => {
//   if (!visible) return null;

//   const languages = [
//     {code: 'en', name: 'English', flag: '🇬🇧'},
//     {code: 'ur', name: 'اردو', flag: '🇵🇰'},
//     {code: 'ar', name: 'العربية', flag: '🇸🇦'},
//   ];

//   return (
//     <View style={styles.languagePickerOverlay}>
//       <View style={styles.languagePickerContainer}>
//         <Text style={styles.languagePickerTitle}>
//           {currentLanguage === 'ur'
//             ? 'زبان منتخب کریں'
//             : currentLanguage === 'ar'
//             ? 'اختر اللغة'
//             : 'Select Language'}
//         </Text>

//         {languages.map(lang => (
//           <TouchableOpacity
//             key={lang.code}
//             style={[
//               styles.languageOption,
//               currentLanguage === lang.code && styles.selectedLanguageOption,
//             ]}
//             onPress={() => onLanguageChange(lang.code)}>
//             <Text style={styles.languageOptionText}>
//               {lang.flag} {lang.name}
//             </Text>
//             {currentLanguage === lang.code && <Text>✓</Text>}
//           </TouchableOpacity>
//         ))}

//         <TouchableOpacity onPress={onClose}>
//           <Text style={styles.closeLanguagePickerText}>
//             {currentLanguage === 'ur'
//               ? 'بند کریں'
//               : currentLanguage === 'ar'
//               ? 'إغلاق'
//               : 'Close'}
//           </Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// /* -------------------- AI CHATBOT -------------------- */
// const AIChatbot = ({visible, onClose}) => {
//   const dispatch = useDispatch();
//   const navigation = useNavigation();

//   const messages = useSelector(state => state.chatbot?.messages || []);
//   const pendingAction = useSelector(state => state.chatbot?.pendingAction);

//   const [input, setInput] = useState('');
//   const [listening, setListening] = useState(false);
//   const [isTyping, setIsTyping] = useState(false);
//   const [currentLanguage, setCurrentLanguage] = useState('en');
//   const [showLanguagePicker, setShowLanguagePicker] = useState(false);

//   const flatListRef = useRef(null);
//   const processingRef = useRef(false);

//   /* -------------------- Helpers -------------------- */
//   const addMessage = useCallback(
//     (text, from) => {
//       dispatch(
//         chatbotAddMessage({
//           id: `${Date.now()}-${Math.random()}`,
//           text: String(text),
//           from,
//           timestamp: Date.now(),
//         }),
//       );

//       setTimeout(() => {
//         flatListRef.current?.scrollToEnd({
//           animated: true,
//         });
//       }, 100);
//     },
//     [dispatch],
//   );

//   const speak = text => {
//     try {
//       const TTS =
//         require('react-native-tts').default || require('react-native-tts');
//       TTS.stop();
//       TTS.speak(String(text));
//     } catch {}
//   };

//   /* -------------------- Pending Action (FIXED) -------------------- */
//   const handlePendingAction = useCallback(() => {
//     if (!pendingAction) return;

//     if (pendingAction.type === 'leave_request') {
//       addMessage(
//         'I understand you want to apply for leave. Navigating you shortly.',
//         'bot',
//       );
//     }

//     dispatch(chatbotSetPendingAction(null));
//   }, [pendingAction, dispatch, addMessage]);

//   /* -------------------- Effect (NO ERRORS) -------------------- */
//   useEffect(() => {
//     if (!visible) return;

//     azureAIService.setNavigationHandler({
//       navigateToScreen: (screenName, params) => {
//         onClose();
//         setTimeout(() => {
//           if (screenName === 'AttendanceScreen') {
//             navigation.navigate('CreateAttendanceScreen', params);
//           } else if (screenName === 'HomeScreen') {
//             navigation.navigate('Home');
//           }
//         }, 300);
//       },
//     });

//     if (messages.length === 0) {
//       const welcome = {
//         id: 'welcome',
//         text:
//           "👋 Hey! I'm Dynaface AI Assistant.\n\n" +
//           '• Mark attendance\n' +
//           '• Navigate screens\n' +
//           '• HR help\n\n' +
//           'How can I help?',
//         from: 'bot',
//         timestamp: Date.now(),
//       };
//       dispatch(chatbotSetMessages([welcome]));
//       speak(welcome.text);
//     }

//     if (pendingAction) {
//       handlePendingAction();
//     }

//     return () => {
//       Voice.destroy().then(Voice.removeAllListeners);
//     };
//   }, [
//     visible,
//     pendingAction,
//     navigation,
//     dispatch,
//     handlePendingAction,
//     messages.length,
//     onClose,
//   ]);

//   /* -------------------- Voice -------------------- */
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

//       setListening(true);
//       await Voice.start('en-US');
//     } catch {
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

//   /* -------------------- Send -------------------- */
//   const handleSend = async override => {
//     const text = (override || input).trim();
//     if (!text || processingRef.current) return;

//     processingRef.current = true;
//     setInput('');
//     addMessage(text, 'user');
//     setIsTyping(true);

//     try {
//       const aiResponse = await azureAIService.detectIntentWithAzureAI({
//         userInput: text,
//         context: messages,
//       });

//       addMessage(aiResponse.responseText, 'bot');
//       speak(aiResponse.responseText);

//       if (aiResponse.action === 'mark_attendance') {
//         onClose();
//         setTimeout(() => {
//           navigation.navigate('CreateAttendanceScreen');
//         }, 300);
//       }
//     } catch {
//       addMessage('Sorry, something went wrong.', 'bot');
//     } finally {
//       processingRef.current = false;
//       setIsTyping(false);
//     }
//   };

//   /* -------------------- Render -------------------- */
//   const renderItem = ({item}) => (
//     <View
//       style={[
//         styles.messageContainer,
//         item.from === 'user' ? styles.userContainer : styles.botContainer,
//       ]}>
//       <View style={styles.bubble}>
//         <Text>{item.text}</Text>
//         <Text style={styles.timestamp}>
//           {moment(item.timestamp).format('HH:mm')}
//         </Text>
//       </View>
//     </View>
//   );

//   return (
//     <Modal visible={visible} transparent>
//       <KeyboardAvoidingView
//         style={styles.overlay}
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
//         <View style={styles.sheet}>
//           <FlatList
//             ref={flatListRef}
//             data={messages}
//             renderItem={renderItem}
//             keyExtractor={i => i.id}
//           />

//           <View style={styles.inputRow}>
//             <TouchableOpacity
//               onPress={listening ? stopListening : startListening}>
//               <Text>{listening ? '🎙️' : '🎤'}</Text>
//             </TouchableOpacity>

//             <TextInput
//               value={input}
//               onChangeText={setInput}
//               placeholder="Type..."
//               style={styles.input}
//               onSubmitEditing={() => handleSend()}
//             />

//             <TouchableOpacity onPress={() => handleSend()}>
//               <Text>↑</Text>
//             </TouchableOpacity>
//           </View>

//           <LanguagePickerComponent
//             visible={showLanguagePicker}
//             onClose={() => setShowLanguagePicker(false)}
//             currentLanguage={currentLanguage}
//             onLanguageChange={setCurrentLanguage}
//           />
//         </View>
//       </KeyboardAvoidingView>
//     </Modal>
//   );
// };

// export default AIChatbot;

// /* -------------------- Styles -------------------- */
// const styles = StyleSheet.create({
//   overlay: {flex: 1, backgroundColor: '#00000088'},
//   sheet: {
//     height: '85%',
//     backgroundColor: '#fff',
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//   },
//   inputRow: {
//     flexDirection: 'row',
//     padding: 10,
//     alignItems: 'center',
//   },
//   input: {
//     flex: 1,
//     borderWidth: 1,
//     marginHorizontal: 8,
//     padding: 8,
//     borderRadius: 8,
//   },
//   messageContainer: {marginVertical: 4},
//   bubble: {
//     padding: 10,
//     backgroundColor: '#eee',
//     borderRadius: 10,
//   },
//   timestamp: {fontSize: 10, color: '#666'},
//   botContainer: {alignSelf: 'flex-start'},
//   userContainer: {alignSelf: 'flex-end'},
//   languagePickerOverlay: {
//     ...StyleSheet.absoluteFillObject,
//     backgroundColor: '#00000066',
//     justifyContent: 'center',
//   },
//   languagePickerContainer: {
//     margin: 20,
//     backgroundColor: '#fff',
//     padding: 16,
//     borderRadius: 12,
//   },
//   languageOption: {
//     padding: 10,
//   },
//   selectedLanguageOption: {
//     backgroundColor: '#eee',
//   },
//   languagePickerTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     marginBottom: 10,
//   },
//   languageOptionText: {fontSize: 14},
//   closeLanguagePickerText: {
//     marginTop: 12,
//     textAlign: 'center',
//     color: 'blue',
//   },
// });
// /* eslint-disable no-shadow */
// /* eslint-disable react-native/no-inline-styles */
// /* eslint-disable no-shadow */
// /* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-native/no-inline-styles */
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
  KeyboardAvoidingView,
} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import Voice from '@react-native-voice/voice';
import moment from 'moment';
import {useNavigation} from '@react-navigation/native';

// Import Azure AI Service
import azureAIService from '../../services/AzureAIService';

// Redux Actions
import {
  chatbotAddMessage,
  chatbotSetMessages,
} from '../../store/slices/chatbotSlice';

/* -------------------- Chatbot Component -------------------- */
const AIChatbot = ({visible, onClose}) => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const {userData} = useSelector(s => s.user || {});

  const messages = useSelector(s => s.chatbot?.messages || []);

  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  const processingRef = useRef(false);
  const flatListRef = useRef(null);

  /* -------------------- Initialize -------------------- */
  useEffect(() => {
    if (!visible) {
      return;
    }

    // Welcome message
    if (!messages || messages.length === 0) {
      const welcomeMsg = {
        id: 'welcome-1',
        text: "👋 Hey there! I'm Dynaface AI Assistant.\nHow may I help you today?",
        from: 'bot',
        timestamp: Date.now(),
      };
      dispatch(chatbotSetMessages([welcomeMsg]));
    }

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, [visible, messages.length, dispatch, messages]);

  /* -------------------- Voice Handling -------------------- */
  const startListening = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          return;
        }
      }
      Voice.onSpeechResults = e => {
        const text = e?.value?.[0];
        if (text) {
          handleSend(text);
        }
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

  /* -------------------- Handle Screen Navigation -------------------- */
  const navigateToScreen = (screenName, params = {}) => {
    console.log(`🚀 Navigating to: ${screenName}`, params);
    onClose(); // Close chatbot first

    // Small delay for smooth transition
    setTimeout(() => {
      switch (screenName) {
        case 'AttendanceScreen':
        case 'CreateAttendanceScreen':
          navigation.navigate('CreateAttendanceScreen', params);
          break;
        case 'HomeScreen':
        case 'Dashboard':
          navigation.navigate('Home', params);
          break;
        case 'LeaveScreen':
          // Add when you implement leave screen
          // navigation.navigate('LeaveScreen', params);
          addMessage('Leave screen is coming soon!', 'bot');
          break;
        case 'ProfileScreen':
          // Add when you implement profile
          // navigation.navigate('Profile', params);
          addMessage('Profile screen is coming soon!', 'bot');
          break;
        case 'SummaryScreen':
        case 'AttendanceSummary':
          // Add when you implement summary
          // navigation.navigate('AttendanceSummary', params);
          addMessage('Attendance summary screen is coming soon!', 'bot');
          break;
        default:
          console.warn(`Unknown screen: ${screenName}`);
          addMessage(`I can't navigate to ${screenName} yet.`, 'bot');
      }
    }, 300);
  };

  /* -------------------- Execute AI Commands -------------------- */
  const executeAIAction = async aiResponse => {
    const {action, parameters = {}, responseText} = aiResponse;

    // Show AI response first
    addMessage(responseText, 'bot');
    speak(responseText);

    // Execute the action
    switch (action) {
      case 'mark_attendance':
        // Navigate to attendance screen
        navigateToScreen('CreateAttendanceScreen');
        break;

      case 'navigate_to_screen':
        if (parameters.screenName) {
          navigateToScreen(parameters.screenName, parameters.screenParams);
        }
        break;

      case 'check_balance':
        // You can implement leave balance check here
        addMessage('Leave balance feature is coming soon!', 'bot');
        break;

      case 'show_info':
        // Already shown in responseText
        break;

      case 'ask_clarification':
        // Already asked in responseText
        break;

      default:
        // Default handling
        console.log('AI Action:', action);
    }
  };

  /* -------------------- Main Send Handler -------------------- */
  const handleSend = async textOverride => {
    const text = (textOverride || input).trim();
    if (!text || processingRef.current) {
      return;
    }

    processingRef.current = true;
    setInput('');
    addMessage(text, 'user');
    setIsTyping(true);

    try {
      console.log('🤖 Processing with Azure AI:', text);

      // Get conversation context
      const context = await azureAIService.handleConversationFlow(messages);

      // Send to Azure AI for intent detection and response
      const aiResponse = await azureAIService.detectIntentWithAzureAI({
        userInput: text,
        context: context,
      });

      console.log('✅ Azure AI Response:', aiResponse);

      // Execute the AI action
      await executeAIAction(aiResponse);
    } catch (err) {
      console.error('❌ Chat error:', err);
      addMessage('Sorry, something went wrong. Please try again.', 'bot');
      speak('Sorry, something went wrong');
    } finally {
      processingRef.current = false;
      setIsTyping(false);
    }
  };

  // /* -------------------- Quick Actions -------------------- */
  // const QuickActionButton = ({icon, label, onPress}) => (
  //   <TouchableOpacity style={styles.quickAction} onPress={onPress}>
  //     <Text style={styles.quickActionIcon}>{icon}</Text>
  //     <Text style={styles.quickActionLabel}>{label}</Text>
  //   </TouchableOpacity>
  // );

  // const renderQuickActions = () => (
  //   <View style={styles.quickActionsContainer}>
  //     <Text style={styles.quickActionsTitle}>Quick Actions:</Text>
  //     <View style={styles.quickActionsRow}>
  //       <QuickActionButton
  //         icon="📅"
  //         label="Mark Attendance"
  //         onPress={() => {
  //           addMessage('Mark attendance', 'user');
  //           setTimeout(() => handleSend('mark attendance'), 100);
  //         }}
  //       />
  //       <QuickActionButton
  //         icon="🏠"
  //         label="Go to Home"
  //         onPress={() => {
  //           addMessage('Go to home', 'user');
  //           setTimeout(() => handleSend('navigate to home'), 100);
  //         }}
  //       />
  //       <QuickActionButton
  //         icon="ℹ️"
  //         label="My Info"
  //         onPress={() => {
  //           addMessage('Show my information', 'user');
  //           setTimeout(() => handleSend('my information'), 100);
  //         }}
  //       />
  //     </View>
  //   </View>
  // );

  /* -------------------- Render Methods -------------------- */
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
        <Text style={styles.typingText}>Dynaface AI is thinking...</Text>
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
                <Text style={styles.status}>
                  Global Assistant • Multilingual
                </Text>
              </View>
            </View>

            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
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
            ListFooterComponent={
              <>
                {isTyping && renderTypingIndicator()}
                {/* {messages.length > 0 && renderQuickActions()} */}
              </>
            }
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
              placeholder="Speak or type in any language..."
              placeholderTextColor="#888"
              style={styles.input}
              onSubmitEditing={() => handleSend()}
              multiline
              textAlignVertical="center"
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
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatContainer: {
    padding: 12,
    paddingBottom: 8,
  },
  quickActionsContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  quickActionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    minWidth: 90,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  quickActionLabel: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
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
    textAlign: 'left',
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
    minHeight: 44,
    maxHeight: 100,
    borderRadius: 22,
    paddingHorizontal: 16,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 8,
    fontSize: 16,
    paddingVertical: 10,
  },
});

export default AIChatbot;
