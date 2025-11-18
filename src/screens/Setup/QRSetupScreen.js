// /* eslint-disable curly */
// /* eslint-disable no-unused-vars */
// /* eslint-disable react-hooks/exhaustive-deps */
// import React, {useState, useEffect} from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   ActivityIndicator,
//   Modal,
//   Platform,
//   Dimensions,
//   Animated,
// } from 'react-native';
// import QRCodeScanner from 'react-native-qrcode-scanner';
// import Icon from 'react-native-vector-icons/FontAwesome';
// import {launchImageLibrary} from 'react-native-image-picker';
// import RNQRGenerator from 'rn-qr-generator';
// import {
//   getAllConfigs,
//   saveConfig,
//   saveConfigWithId,
// } from '../../Controller/secureConfig';
// import {useNavigation, useRoute} from '@react-navigation/native';
// import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
// import {decryptQRData} from '../../Controller/decryptQRData';
// import AlertModal from '../../components/Alert/AlertModal';

// const {width, height} = Dimensions.get('window');
// const secretKey = 'P@$sw0rd321';

// const QRSetupScreen = () => {
//   const [isScanning, setIsScanning] = useState(true);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [hasPermission, setHasPermission] = useState(false);
//   const [alertModal, setAlertModal] = useState(false);
//   const [alertMessage, setAlertMessage] = useState('');
//   const [scanAnimation] = useState(new Animated.Value(0));
//   const [isProcessingGalleryImage, setIsProcessingGalleryImage] =
//     useState(false);

//   const navigation = useNavigation();
//   const route = useRoute();

//   const isFromConfigSelection = route.params?.isFromConfigSelection || false;
//   const returnScreen = route.params?.returnScreen || 'Login';

//   // Scanning animation
//   useEffect(() => {
//     if (isScanning) {
//       Animated.loop(
//         Animated.sequence([
//           Animated.timing(scanAnimation, {
//             toValue: 1,
//             duration: 2000,
//             useNativeDriver: true,
//           }),
//           Animated.timing(scanAnimation, {
//             toValue: 0,
//             duration: 2000,
//             useNativeDriver: true,
//           }),
//         ]),
//       ).start();
//     }
//   }, [isScanning]);

//   const extractTitle = configOrUrl => {
//     try {
//       const resource =
//         typeof configOrUrl === 'string'
//           ? configOrUrl
//           : configOrUrl?.resource || '';

//       if (!resource) return 'Unknown Configuration';

//       let withoutProtocol = resource.replace(/(^\w+:|^)\/\//, '');
//       const hostname = withoutProtocol.split('/')[0];
//       const firstPart = hostname.split('.')[0];
//       const hyphenParts = firstPart.split('-');

//       if (hyphenParts.length >= 2) {
//         return `${hyphenParts[0]}-${hyphenParts[1]}`;
//       }

//       return firstPart || 'Unknown Configuration';
//     } catch (err) {
//       console.error('extractTitle parsing error:', err);
//       return 'Unknown Configuration';
//     }
//   };

//   const processQRData = async qrData => {
//     try {
//       if (!qrData) throw new Error('No data found in QR code');

//       const parsedData = decryptQRData(qrData, secretKey);
//       console.log('QR decrypted successfully, keys:', Object.keys(parsedData));

//       if (!parsedData || Object.keys(parsedData).length === 0) {
//         throw new Error('Invalid QR code data');
//       }

//       // Enhanced duplicate check
//       const allConfigs = await getAllConfigs();
//       const isDuplicate = allConfigs.some(config => {
//         const configData = config.data;

//         // Check multiple properties to determine duplicates
//         const sameResource = configData.resource === parsedData.resource;
//         const sameClientId = configData.client_id === parsedData.client_id;
//         const sameGrantType = configData.grant_type === parsedData.grant_type;

//         // Consider it a duplicate if core properties match
//         return sameResource && sameClientId && sameGrantType;
//       });

//       if (isDuplicate) {
//         const existingConfig = allConfigs.find(
//           config =>
//             config.data.resource === parsedData.resource &&
//             config.data.client_id === parsedData.client_id,
//         );
//         console.log(existingConfig);
//         setAlertMessage(
//           `This configuration already exists as "${
//             existingConfig?.name || 'Existing Config'
//           }".`,
//         );
//         setAlertModal(true);
//         return false;
//       }

//       if (isFromConfigSelection) {
//         const configName = extractTitle(parsedData.resource);
//         await saveConfigWithId(parsedData, configName);
//         setAlertMessage('Configuration added successfully!');
//         setAlertModal(true);

//         setTimeout(() => {
//           setAlertModal(false);
//           navigation.navigate('ConfigSelectionScreen');
//         }, 2000);
//       } else {
//         await saveConfig(parsedData);
//         navigation.replace('Login');
//       }

//       return true;
//     } catch (err) {
//       console.log('Error with QR data:', err.message);
//       setAlertMessage('QR code not recognized. Please try again.');
//       setAlertModal(true);
//       return false;
//     }
//   };

//   const handleQRCodeRead = async e => {
//     setIsScanning(false);
//     console.log('QR Data scanned:', e);

//     await processQRData(e.data);
//     setTimeout(() => setIsScanning(true), 2000);
//   };

//   const handleScanFromGallery = async () => {
//     try {
//       // Check photo library permission
//       const permissionType =
//         Platform.OS === 'ios'
//           ? PERMISSIONS.IOS.PHOTO_LIBRARY
//           : Platform.Version >= 33
//           ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
//           : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;

//       const permissionResult = await check(permissionType);

//       if (permissionResult === RESULTS.DENIED) {
//         const requestResult = await request(permissionType);
//         if (requestResult !== RESULTS.GRANTED) {
//           setAlertMessage(
//             'Photo library permission is required to scan QR codes from images.',
//           );
//           setAlertModal(true);
//           return;
//         }
//       } else if (permissionResult === RESULTS.BLOCKED) {
//         setAlertMessage(
//           'Photo library permission is required. Please enable it from settings.',
//         );
//         setAlertModal(true);
//         return;
//       }

//       // Launch image picker
//       const result = await launchImageLibrary({
//         mediaType: 'photo',
//         selectionLimit: 1,
//         quality: 1,
//         includeBase64: false,
//       });

//       if (result.didCancel) {
//         console.log('User cancelled image picker');
//         return;
//       }

//       if (result.errorCode) {
//         console.log('ImagePicker Error: ', result.errorMessage);
//         setAlertMessage('Failed to open image picker. Please try again.');
//         setAlertModal(true);
//         return;
//       }

//       if (result.assets && result.assets.length > 0) {
//         setIsProcessingGalleryImage(true);
//         setIsScanning(false);

//         const imageUri = result.assets[0].uri;
//         console.log('Selected image URI:', imageUri);

//         try {
//           // Detect QR code from the selected image
//           const response = await RNQRGenerator.detect({
//             uri: imageUri,
//           });

//           console.log('QR Detection Response:', response);

//           if (response && response.values && response.values.length > 0) {
//             const qrData = response.values[0];
//             console.log('QR Data from image:', qrData);

//             await processQRData(qrData);
//           } else {
//             setAlertMessage(
//               'No valid QR code found in the selected image. Please try another image.',
//             );
//             setAlertModal(true);
//           }
//         } catch (error) {
//           console.log('Error decoding QR from image:', error);
//           setAlertMessage(
//             'Failed to read QR code from image. Please ensure the image contains a valid QR code.',
//           );
//           setAlertModal(true);
//         } finally {
//           setIsProcessingGalleryImage(false);
//           setTimeout(() => setIsScanning(true), 2000);
//         }
//       }
//     } catch (error) {
//       console.error('Error in handleScanFromGallery:', error);
//       setAlertMessage(
//         'An error occurred while processing the image. Please try again.',
//       );
//       setAlertModal(true);
//       setIsProcessingGalleryImage(false);
//       setTimeout(() => setIsScanning(true), 2000);
//     }
//   };

//   const handleSkipPress = () => setModalVisible(true);

//   const handleSkipConfirm = () => {
//     setModalVisible(false);
//     if (isFromConfigSelection) {
//       navigation.navigate('ConfigSelectionScreen');
//     } else {
//       navigation.replace('Login');
//     }
//   };

//   useEffect(() => {
//     const checkCameraPermission = async () => {
//       const permissionType =
//         Platform.OS === 'ios'
//           ? PERMISSIONS.IOS.CAMERA
//           : PERMISSIONS.ANDROID.CAMERA;

//       const result = await check(permissionType);

//       if (result === RESULTS.GRANTED) {
//         setHasPermission(true);
//       } else if (result === RESULTS.DENIED) {
//         const requestResult = await request(permissionType);
//         if (requestResult === RESULTS.GRANTED) {
//           setHasPermission(true);
//         } else if (requestResult === RESULTS.BLOCKED) {
//           setAlertMessage(
//             'Camera permission is required. Please enable it from settings.',
//           );
//           setAlertModal(true);
//         }
//       } else if (result === RESULTS.BLOCKED) {
//         setAlertMessage(
//           'Camera permission is required. Please enable it from settings.',
//         );
//         setAlertModal(true);
//       } else if (result === RESULTS.LIMITED) {
//         setHasPermission(true);
//       }
//     };

//     checkCameraPermission();
//   }, []);

//   const handleAlertPress = () => {
//     setAlertModal(false);
//   };

//   const scanLineTranslate = scanAnimation.interpolate({
//     inputRange: [0, 1],
//     outputRange: [0, 250],
//   });

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         {isFromConfigSelection && (
//           <TouchableOpacity
//             style={styles.backButton}
//             onPress={() => navigation.navigate('ConfigSelectionScreen')}
//             activeOpacity={0.7}>
//             <Icon name="arrow-left" size={22} color="#0A66C2" />
//           </TouchableOpacity>
//         )}

//         <View style={styles.headerContent}>
//           <View style={styles.iconWrapper}>
//             <View style={styles.iconBackground}>
//               <Icon name="qrcode" size={36} color="#0A66C2" />
//             </View>
//           </View>
//           <Text style={styles.title}>
//             {isFromConfigSelection ? 'Add Configuration' : 'Environment Setup'}
//           </Text>
//           <Text style={styles.subtitle}>
//             {isFromConfigSelection
//               ? 'Scan QR code to add a new configuration'
//               : 'Scan your configuration QR code to begin'}
//           </Text>
//         </View>
//       </View>

//       {/* Scanner Container */}
//       <View style={styles.scannerWrapper}>
//         <View style={styles.scannerContainer}>
//           {hasPermission ? (
//             isScanning && !isProcessingGalleryImage ? (
//               <>
//                 <QRCodeScanner
//                   onRead={handleQRCodeRead}
//                   reactivate={false}
//                   showMarker={false}
//                   cameraStyle={styles.camera}
//                 />

//                 {/* Custom Scanner Overlay */}
//                 <View style={styles.overlay}>
//                   {/* Top overlay */}
//                   <View style={styles.overlaySection} />

//                   {/* Middle section with scanner frame */}
//                   <View style={styles.middleSection}>
//                     <View style={styles.overlaySection} />
//                     <View style={styles.scannerFrame}>
//                       {/* Corner decorations */}
//                       <View style={[styles.corner, styles.topLeft]} />
//                       <View style={[styles.corner, styles.topRight]} />
//                       <View style={[styles.corner, styles.bottomLeft]} />
//                       <View style={[styles.corner, styles.bottomRight]} />

//                       {/* Animated scan line */}
//                       <Animated.View
//                         style={[
//                           styles.scanLine,
//                           {
//                             transform: [{translateY: scanLineTranslate}],
//                           },
//                         ]}
//                       />
//                     </View>
//                     <View style={styles.overlaySection} />
//                   </View>

//                   {/* Bottom overlay */}
//                   <View style={styles.overlaySection} />
//                 </View>

//                 {/* Scanning Instructions */}
//                 <View style={styles.instructionsContainer}>
//                   <View style={styles.instructionCard}>
//                     <Icon name="crosshairs" size={24} color="#0A66C2" />
//                     <Text style={styles.instructionText}>
//                       Position QR code within the frame
//                     </Text>
//                   </View>
//                 </View>
//               </>
//             ) : (
//               <View style={styles.processingContainer}>
//                 <View style={styles.processingCard}>
//                   <ActivityIndicator size="large" color="#0A66C2" />
//                   <Text style={styles.processingText}>
//                     {isProcessingGalleryImage
//                       ? 'Processing Image'
//                       : 'Processing QR Code'}
//                   </Text>
//                   <Text style={styles.processingSubtext}>
//                     Please wait while we validate your configuration...
//                   </Text>
//                 </View>
//               </View>
//             )
//           ) : (
//             <View style={styles.permissionContainer}>
//               <View style={styles.permissionCard}>
//                 <View style={styles.permissionIcon}>
//                   <Icon name="camera" size={48} color="#999" />
//                 </View>
//                 <Text style={styles.permissionTitle}>
//                   Camera Access Required
//                 </Text>
//                 <Text style={styles.permissionText}>
//                   Please grant camera permission to scan QR codes
//                 </Text>
//               </View>
//             </View>
//           )}
//         </View>
//       </View>

//       {/* Footer Actions */}
//       <View style={styles.footer}>
//         <View style={styles.footerContent}>
//           {/* Gallery Scan Button */}
//           <TouchableOpacity
//             style={styles.galleryButton}
//             onPress={handleScanFromGallery}
//             activeOpacity={0.8}
//             disabled={isProcessingGalleryImage}>
//             <Icon
//               name="picture-o"
//               size={16}
//               color="#fff"
//               style={styles.buttonIcon}
//             />
//             <Text style={styles.galleryButtonText}>Scan QR from Gallery</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.skipButton}
//             onPress={handleSkipPress}
//             activeOpacity={0.8}>
//             <Icon
//               name={isFromConfigSelection ? 'times' : 'forward'}
//               size={16}
//               color="#0A66C2"
//               style={styles.buttonIcon}
//             />
//             <Text style={styles.skipButtonText}>
//               {isFromConfigSelection ? 'Cancel' : 'Skip for now'}
//             </Text>
//           </TouchableOpacity>

//           <View style={styles.helpContainer}>
//             <Icon name="question-circle" size={16} color="#999" />
//             <Text style={styles.helpText}>
//               Need help? Contact your system administrator
//             </Text>
//           </View>
//         </View>
//       </View>

//       {/* Skip Confirmation Modal */}
//       <Modal
//         animationType="fade"
//         transparent={true}
//         visible={modalVisible}
//         onRequestClose={() => setModalVisible(false)}>
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContainer}>
//             <View style={styles.modalIconContainer}>
//               <Icon
//                 name={
//                   isFromConfigSelection
//                     ? 'times-circle'
//                     : 'exclamation-triangle'
//                 }
//                 size={50}
//                 color="#ff9800"
//               />
//             </View>

//             <Text style={styles.modalTitle}>
//               {isFromConfigSelection ? 'Cancel Setup?' : 'Skip Setup?'}
//             </Text>

//             <Text style={styles.modalMessage}>
//               {isFromConfigSelection
//                 ? 'You will be returned to the configuration list without adding a new configuration.'
//                 : 'You can always set up your environment later from the settings menu.'}
//             </Text>

//             <View style={styles.modalButtons}>
//               <TouchableOpacity
//                 style={styles.modalButtonSecondary}
//                 onPress={() => setModalVisible(false)}
//                 activeOpacity={0.8}>
//                 <Text style={styles.modalButtonSecondaryText}>
//                   Continue Scanning
//                 </Text>
//               </TouchableOpacity>

//               <TouchableOpacity
//                 style={styles.modalButtonPrimary}
//                 onPress={handleSkipConfirm}
//                 activeOpacity={0.8}>
//                 <Text style={styles.modalButtonPrimaryText}>
//                   {isFromConfigSelection ? 'Cancel Setup' : 'Skip'}
//                 </Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>

//       <AlertModal
//         visible={alertModal}
//         heading="Configuration"
//         text={alertMessage}
//         onPress={handleAlertPress}
//       />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f5f7fa',
//   },
//   header: {
//     paddingTop: Platform.OS === 'ios' ? 60 : 40,
//     paddingBottom: 24,
//     paddingHorizontal: 20,
//     backgroundColor: '#fff',
//     borderBottomLeftRadius: 24,
//     borderBottomRightRadius: 24,
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: 4},
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 5,
//   },
//   backButton: {
//     position: 'absolute',
//     left: 20,
//     top: Platform.OS === 'ios' ? 60 : 40,
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     backgroundColor: '#f0f8ff',
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 10,
//   },
//   headerContent: {
//     alignItems: 'center',
//   },
//   iconWrapper: {
//     marginBottom: 16,
//   },
//   iconBackground: {
//     width: 80,
//     height: 80,
//     borderRadius: 20,
//     backgroundColor: '#f0f8ff',
//     justifyContent: 'center',
//     alignItems: 'center',
//     shadowColor: '#0A66C2',
//     shadowOffset: {width: 0, height: 4},
//     shadowOpacity: 0.2,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   title: {
//     fontSize: 26,
//     fontWeight: '700',
//     color: '#1a1a1a',
//     marginBottom: 8,
//     textAlign: 'center',
//   },
//   subtitle: {
//     fontSize: 15,
//     color: '#666',
//     textAlign: 'center',
//     lineHeight: 22,
//     maxWidth: '85%',
//   },
//   scannerWrapper: {
//     flex: 1,
//     padding: 16,
//   },
//   scannerContainer: {
//     flex: 1,
//     borderRadius: 24,
//     overflow: 'hidden',
//     backgroundColor: '#000',
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: 8},
//     shadowOpacity: 0.3,
//     shadowRadius: 16,
//     elevation: 8,
//   },
//   camera: {
//     height: '100%',
//   },
//   overlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//   },
//   overlaySection: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.6)',
//   },
//   middleSection: {
//     flexDirection: 'row',
//   },
//   scannerFrame: {
//     width: 250,
//     height: 250,
//     position: 'relative',
//   },
//   corner: {
//     position: 'absolute',
//     width: 30,
//     height: 30,
//     borderColor: '#0A66C2',
//   },
//   topLeft: {
//     top: 0,
//     left: 0,
//     borderTopWidth: 4,
//     borderLeftWidth: 4,
//     borderTopLeftRadius: 8,
//   },
//   topRight: {
//     top: 0,
//     right: 0,
//     borderTopWidth: 4,
//     borderRightWidth: 4,
//     borderTopRightRadius: 8,
//   },
//   bottomLeft: {
//     bottom: 0,
//     left: 0,
//     borderBottomWidth: 4,
//     borderLeftWidth: 4,
//     borderBottomLeftRadius: 8,
//   },
//   bottomRight: {
//     bottom: 0,
//     right: 0,
//     borderBottomWidth: 4,
//     borderRightWidth: 4,
//     borderBottomRightRadius: 8,
//   },
//   scanLine: {
//     width: '100%',
//     height: 2,
//     backgroundColor: '#0A66C2',
//     shadowColor: '#0A66C2',
//     shadowOffset: {width: 0, height: 0},
//     shadowOpacity: 0.8,
//     shadowRadius: 10,
//     elevation: 5,
//   },
//   instructionsContainer: {
//     position: 'absolute',
//     bottom: 10,
//     left: 20,
//     right: 20,
//     alignItems: 'center',
//   },
//   instructionCard: {
//     backgroundColor: 'rgba(255, 255, 255, 0.95)',
//     paddingHorizontal: 24,
//     paddingVertical: 16,
//     borderRadius: 16,
//     flexDirection: 'row',
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: 4},
//     shadowOpacity: 0.2,
//     shadowRadius: 8,
//     elevation: 5,
//   },
//   instructionText: {
//     fontSize: 15,
//     fontWeight: '600',
//     color: '#1a1a1a',
//     marginLeft: 12,
//   },
//   processingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#000',
//   },
//   processingCard: {
//     backgroundColor: 'rgba(255, 255, 255, 0.95)',
//     padding: 32,
//     borderRadius: 20,
//     alignItems: 'center',
//     minWidth: 280,
//   },
//   processingText: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#1a1a1a',
//     marginTop: 20,
//     marginBottom: 8,
//   },
//   processingSubtext: {
//     fontSize: 14,
//     color: '#666',
//     textAlign: 'center',
//     lineHeight: 20,
//   },
//   permissionContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   permissionCard: {
//     backgroundColor: '#fff',
//     padding: 32,
//     borderRadius: 20,
//     alignItems: 'center',
//     maxWidth: 320,
//   },
//   permissionIcon: {
//     width: 100,
//     height: 100,
//     borderRadius: 50,
//     backgroundColor: '#f5f7fa',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   permissionTitle: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#1a1a1a',
//     marginBottom: 12,
//     textAlign: 'center',
//   },
//   permissionText: {
//     fontSize: 15,
//     color: '#666',
//     textAlign: 'center',
//     lineHeight: 22,
//   },
//   footer: {
//     backgroundColor: '#fff',
//     borderTopLeftRadius: 24,
//     borderTopRightRadius: 24,
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: -4},
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 5,
//   },
//   footerContent: {
//     padding: 20,
//     paddingBottom: Platform.OS === 'ios' ? 34 : 20,
//   },
//   galleryButton: {
//     backgroundColor: '#0A66C2',
//     paddingVertical: 16,
//     paddingHorizontal: 24,
//     borderRadius: 14,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 12,
//     shadowColor: '#0A66C2',
//     shadowOffset: {width: 0, height: 4},
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   galleryButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '700',
//   },
//   skipButton: {
//     backgroundColor: '#f0f8ff',
//     paddingVertical: 16,
//     paddingHorizontal: 24,
//     borderRadius: 14,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderWidth: 2,
//     borderColor: '#0A66C2',
//     marginBottom: 16,
//   },
//   buttonIcon: {
//     marginRight: 8,
//   },
//   skipButtonText: {
//     color: '#0A66C2',
//     fontSize: 16,
//     fontWeight: '700',
//   },
//   helpContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: 8,
//   },
//   helpText: {
//     fontSize: 13,
//     color: '#999',
//     textAlign: 'center',
//     lineHeight: 18,
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.6)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   modalContainer: {
//     backgroundColor: '#fff',
//     borderRadius: 24,
//     padding: 28,
//     width: '100%',
//     maxWidth: 380,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: 10},
//     shadowOpacity: 0.3,
//     shadowRadius: 20,
//     elevation: 10,
//   },
//   modalIconContainer: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     backgroundColor: '#fff3e0',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   modalTitle: {
//     fontSize: 22,
//     fontWeight: '700',
//     color: '#1a1a1a',
//     marginBottom: 12,
//     textAlign: 'center',
//   },
//   modalMessage: {
//     fontSize: 15,
//     color: '#666',
//     textAlign: 'center',
//     lineHeight: 22,
//     marginBottom: 28,
//   },
//   modalButtons: {
//     flexDirection: 'column',
//     width: '100%',
//     gap: 12,
//   },
//   modalButtonPrimary: {
//     backgroundColor: '#0A66C2',
//     paddingVertical: 16,
//     borderRadius: 12,
//     alignItems: 'center',
//     shadowColor: '#0A66C2',
//     shadowOffset: {width: 0, height: 4},
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   modalButtonPrimaryText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '700',
//   },
//   modalButtonSecondary: {
//     backgroundColor: '#f5f7fa',
//     paddingVertical: 16,
//     borderRadius: 12,
//     alignItems: 'center',
//     borderWidth: 2,
//     borderColor: '#e8eaed',
//   },
//   modalButtonSecondaryText: {
//     color: '#666',
//     fontSize: 16,
//     fontWeight: '600',
//   },
// });

// export default QRSetupScreen;

/* eslint-disable curly */
/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Animated,
} from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import Icon from 'react-native-vector-icons/FontAwesome';
import {launchImageLibrary} from 'react-native-image-picker';
import RNQRGenerator from 'rn-qr-generator';
import {
  getAllConfigs,
  saveConfig,
  saveConfigWithId,
} from '../../Controller/secureConfig';
import {useNavigation, useRoute} from '@react-navigation/native';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import {decryptQRData} from '../../Controller/decryptQRData';
import {fontScale} from '../../store/utils/scaling';
import AlertModal from '../../components/Alert/AlertModal';
import styles from '../../styles/styles';
import {Platform} from 'react-native';

const secretKey = 'P@$sw0rd321';

const QRSetupScreen = () => {
  const [isScanning, setIsScanning] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [scanAnimation] = useState(new Animated.Value(0));
  const [isProcessingGalleryImage, setIsProcessingGalleryImage] =
    useState(false);

  const navigation = useNavigation();
  const route = useRoute();

  const isFromConfigSelection = route.params?.isFromConfigSelection || false;
  const returnScreen = route.params?.returnScreen || 'Login';

  // Scanning animation
  useEffect(() => {
    if (isScanning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanAnimation, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }
  }, [isScanning]);

  const extractTitle = configOrUrl => {
    try {
      const resource =
        typeof configOrUrl === 'string'
          ? configOrUrl
          : configOrUrl?.resource || '';

      if (!resource) return 'Unknown Configuration';

      let withoutProtocol = resource.replace(/(^\w+:|^)\/\//, '');
      const hostname = withoutProtocol.split('/')[0];
      const firstPart = hostname.split('.')[0];
      const hyphenParts = firstPart.split('-');

      if (hyphenParts.length >= 2) {
        return `${hyphenParts[0]}-${hyphenParts[1]}`;
      }

      return firstPart || 'Unknown Configuration';
    } catch (err) {
      console.error('extractTitle parsing error:', err);
      return 'Unknown Configuration';
    }
  };

  const processQRData = async qrData => {
    try {
      if (!qrData) throw new Error('No data found in QR code');

      const parsedData = decryptQRData(qrData, secretKey);
      console.log('QR decrypted successfully, keys:', Object.keys(parsedData));

      if (!parsedData || Object.keys(parsedData).length === 0) {
        throw new Error('Invalid QR code data');
      }

      // Enhanced duplicate check
      const allConfigs = await getAllConfigs();
      const isDuplicate = allConfigs.some(config => {
        const configData = config.data;

        // Check multiple properties to determine duplicates
        const sameResource = configData.resource === parsedData.resource;
        const sameClientId = configData.client_id === parsedData.client_id;
        const sameGrantType = configData.grant_type === parsedData.grant_type;

        // Consider it a duplicate if core properties match
        return sameResource && sameClientId && sameGrantType;
      });

      if (isDuplicate) {
        const existingConfig = allConfigs.find(
          config =>
            config.data.resource === parsedData.resource &&
            config.data.client_id === parsedData.client_id,
        );
        console.log(existingConfig);
        setAlertMessage(
          `This configuration already exists as "${
            existingConfig?.name || 'Existing Config'
          }".`,
        );
        setAlertModal(true);
        return false;
      }

      if (isFromConfigSelection) {
        const configName = extractTitle(parsedData.resource);
        await saveConfigWithId(parsedData, configName);
        setAlertMessage('Configuration added successfully!');
        setAlertModal(true);

        setTimeout(() => {
          setAlertModal(false);
          navigation.navigate('ConfigSelectionScreen');
        }, 2000);
      } else {
        await saveConfig(parsedData);
        navigation.replace('Login');
      }

      return true;
    } catch (err) {
      console.log('Error with QR data:', err.message);
      setAlertMessage('QR code not recognized. Please try again.');
      setAlertModal(true);
      return false;
    }
  };

  const handleQRCodeRead = async e => {
    setIsScanning(false);
    console.log('QR Data scanned:', e);

    await processQRData(e.data);
    setTimeout(() => setIsScanning(true), 2000);
  };

  const handleScanFromGallery = async () => {
    try {
      // Check photo library permission
      const permissionType =
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.PHOTO_LIBRARY
          : Platform.Version >= 33
          ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
          : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;

      const permissionResult = await check(permissionType);

      if (permissionResult === RESULTS.DENIED) {
        const requestResult = await request(permissionType);
        if (requestResult !== RESULTS.GRANTED) {
          setAlertMessage(
            'Photo library permission is required to scan QR codes from images.',
          );
          setAlertModal(true);
          return;
        }
      } else if (permissionResult === RESULTS.BLOCKED) {
        setAlertMessage(
          'Photo library permission is required. Please enable it from settings.',
        );
        setAlertModal(true);
        return;
      }

      // Launch image picker
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 1,
        includeBase64: false,
      });

      if (result.didCancel) {
        console.log('User cancelled image picker');
        return;
      }

      if (result.errorCode) {
        console.log('ImagePicker Error: ', result.errorMessage);
        setAlertMessage('Failed to open image picker. Please try again.');
        setAlertModal(true);
        return;
      }

      if (result.assets && result.assets.length > 0) {
        setIsProcessingGalleryImage(true);
        setIsScanning(false);

        const imageUri = result.assets[0].uri;
        console.log('Selected image URI:', imageUri);

        try {
          // Detect QR code from the selected image
          const response = await RNQRGenerator.detect({
            uri: imageUri,
          });

          console.log('QR Detection Response:', response);

          if (response && response.values && response.values.length > 0) {
            const qrData = response.values[0];
            console.log('QR Data from image:', qrData);

            await processQRData(qrData);
          } else {
            setAlertMessage(
              'No valid QR code found in the selected image. Please try another image.',
            );
            setAlertModal(true);
          }
        } catch (error) {
          console.log('Error decoding QR from image:', error);
          setAlertMessage(
            'Failed to read QR code from image. Please ensure the image contains a valid QR code.',
          );
          setAlertModal(true);
        } finally {
          setIsProcessingGalleryImage(false);
          setTimeout(() => setIsScanning(true), 2000);
        }
      }
    } catch (error) {
      console.error('Error in handleScanFromGallery:', error);
      setAlertMessage(
        'An error occurred while processing the image. Please try again.',
      );
      setAlertModal(true);
      setIsProcessingGalleryImage(false);
      setTimeout(() => setIsScanning(true), 2000);
    }
  };

  const handleSkipPress = () => setModalVisible(true);

  const handleSkipConfirm = () => {
    setModalVisible(false);
    if (isFromConfigSelection) {
      navigation.navigate('ConfigSelectionScreen');
    } else {
      navigation.replace('Login');
    }
  };

  useEffect(() => {
    const checkCameraPermission = async () => {
      const permissionType =
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.CAMERA
          : PERMISSIONS.ANDROID.CAMERA;

      const result = await check(permissionType);

      if (result === RESULTS.GRANTED) {
        setHasPermission(true);
      } else if (result === RESULTS.DENIED) {
        const requestResult = await request(permissionType);
        if (requestResult === RESULTS.GRANTED) {
          setHasPermission(true);
        } else if (requestResult === RESULTS.BLOCKED) {
          setAlertMessage(
            'Camera permission is required. Please enable it from settings.',
          );
          setAlertModal(true);
        }
      } else if (result === RESULTS.BLOCKED) {
        setAlertMessage(
          'Camera permission is required. Please enable it from settings.',
        );
        setAlertModal(true);
      } else if (result === RESULTS.LIMITED) {
        setHasPermission(true);
      }
    };

    checkCameraPermission();
  }, []);

  const handleAlertPress = () => {
    setAlertModal(false);
  };

  const scanLineTranslate = scanAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 250],
  });

  return (
    <View style={styles.QRSetup_Container}>
      {/* Header */}
      <View style={styles.QRSetup_Header}>
        {isFromConfigSelection && (
          <TouchableOpacity
            style={styles.QRSetup_BackButton}
            onPress={() => navigation.navigate('ConfigSelectionScreen')}
            activeOpacity={0.7}>
            <Icon name="arrow-left" size={fontScale(22)} color="#0A66C2" />
          </TouchableOpacity>
        )}

        <View style={styles.QRSetup_HeaderContent}>
          <View style={styles.QRSetup_IconBackground}>
            <Icon name="qrcode" size={fontScale(36)} color="#0A66C2" />
          </View>
          <Text style={styles.QRSetup_Title}>
            {isFromConfigSelection ? 'Add Configuration' : 'Environment Setup'}
          </Text>
          <Text style={styles.QRSetup_Subtitle}>
            {isFromConfigSelection
              ? 'Scan QR code to add a new configuration'
              : 'Scan your configuration QR code to begin'}
          </Text>
        </View>
      </View>

      {/* Scanner Container */}
      <View style={styles.QRSetup_ScannerWrapper}>
        <View style={styles.QRSetup_ScannerContainer}>
          {hasPermission ? (
            isScanning && !isProcessingGalleryImage ? (
              <>
                <QRCodeScanner
                  onRead={handleQRCodeRead}
                  reactivate={false}
                  showMarker={false}
                  cameraStyle={styles.QRSetup_Camera}
                />

                {/* Custom Scanner Overlay */}
                <View style={styles.QRSetup_Overlay}>
                  {/* Top overlay */}
                  <View style={styles.QRSetup_OverlaySection} />

                  {/* Middle section with scanner frame */}
                  <View style={styles.QRSetup_MiddleSection}>
                    <View style={styles.QRSetup_OverlaySection} />
                    <View style={styles.QRSetup_ScannerFrame}>
                      {/* Corner decorations */}
                      <View
                        style={[styles.QRSetup_Corner, styles.QRSetup_TopLeft]}
                      />
                      <View
                        style={[styles.QRSetup_Corner, styles.QRSetup_TopRight]}
                      />
                      <View
                        style={[
                          styles.QRSetup_Corner,
                          styles.QRSetup_BottomLeft,
                        ]}
                      />
                      <View
                        style={[
                          styles.QRSetup_Corner,
                          styles.QRSetup_BottomRight,
                        ]}
                      />

                      {/* Animated scan line */}
                      <Animated.View
                        style={[
                          styles.QRSetup_ScanLine,
                          {
                            transform: [{translateY: scanLineTranslate}],
                          },
                        ]}
                      />
                    </View>
                    <View style={styles.QRSetup_OverlaySection} />
                  </View>

                  {/* Bottom overlay */}
                  <View style={styles.QRSetup_OverlaySection} />
                </View>

                {/* Scanning Instructions */}
                <View style={styles.QRSetup_InstructionsContainer}>
                  <View style={styles.QRSetup_InstructionCard}>
                    <Icon
                      name="crosshairs"
                      size={fontScale(24)}
                      color="#0A66C2"
                    />
                    <Text style={styles.QRSetup_InstructionText}>
                      Position QR code within the frame
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.QRSetup_ProcessingContainer}>
                <View style={styles.QRSetup_ProcessingCard}>
                  <ActivityIndicator size="large" color="#0A66C2" />
                  <Text style={styles.QRSetup_ProcessingText}>
                    {isProcessingGalleryImage
                      ? 'Processing Image'
                      : 'Processing QR Code'}
                  </Text>
                  <Text style={styles.QRSetup_ProcessingSubtext}>
                    Please wait while we validate your configuration...
                  </Text>
                </View>
              </View>
            )
          ) : (
            <View style={styles.QRSetup_PermissionContainer}>
              <View style={styles.QRSetup_PermissionCard}>
                <View style={styles.QRSetup_PermissionIcon}>
                  <Icon name="camera" size={fontScale(48)} color="#999" />
                </View>
                <Text style={styles.QRSetup_PermissionTitle}>
                  Camera Access Required
                </Text>
                <Text style={styles.QRSetup_PermissionText}>
                  Please grant camera permission to scan QR codes
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Footer Actions */}
      <View style={styles.QRSetup_Footer}>
        <View style={styles.QRSetup_FooterContent}>
          {/* Gallery Scan Button */}
          <TouchableOpacity
            style={styles.QRSetup_GalleryButton}
            onPress={handleScanFromGallery}
            activeOpacity={0.8}
            disabled={isProcessingGalleryImage}>
            <Icon
              name="picture-o"
              size={fontScale(16)}
              color="#fff"
              style={styles.QRSetup_ButtonIcon}
            />
            <Text style={styles.QRSetup_GalleryButtonText}>
              Scan QR from Gallery
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.QRSetup_SkipButton}
            onPress={handleSkipPress}
            activeOpacity={0.8}>
            <Icon
              name={isFromConfigSelection ? 'times' : 'forward'}
              size={fontScale(16)}
              color="#0A66C2"
              style={styles.QRSetup_ButtonIcon}
            />
            <Text style={styles.QRSetup_SkipButtonText}>
              {isFromConfigSelection ? 'Cancel' : 'Skip for now'}
            </Text>
          </TouchableOpacity>

          <View style={styles.QRSetup_HelpContainer}>
            <Icon name="question-circle" size={fontScale(16)} color="#999" />
            <Text style={styles.QRSetup_HelpText}>
              Need help? Contact your system administrator
            </Text>
          </View>
        </View>
      </View>

      {/* Skip Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.QRSetup_ModalOverlay}>
          <View style={styles.QRSetup_ModalContainer}>
            <View style={styles.QRSetup_ModalIconContainer}>
              <Icon
                name={
                  isFromConfigSelection
                    ? 'times-circle'
                    : 'exclamation-triangle'
                }
                size={fontScale(50)}
                color="#ff9800"
              />
            </View>

            <Text style={styles.QRSetup_ModalTitle}>
              {isFromConfigSelection ? 'Cancel Setup?' : 'Skip Setup?'}
            </Text>

            <Text style={styles.QRSetup_ModalMessage}>
              {isFromConfigSelection
                ? 'You will be returned to the configuration list without adding a new configuration.'
                : 'You can always set up your environment later from the settings menu.'}
            </Text>

            <View style={styles.QRSetup_ModalButtons}>
              <TouchableOpacity
                style={styles.QRSetup_ModalButtonSecondary}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.8}>
                <Text style={styles.QRSetup_ModalButtonSecondaryText}>
                  Continue Scanning
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.QRSetup_ModalButtonPrimary}
                onPress={handleSkipConfirm}
                activeOpacity={0.8}>
                <Text style={styles.QRSetup_ModalButtonPrimaryText}>
                  {isFromConfigSelection ? 'Cancel Setup' : 'Skip'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <AlertModal
        visible={alertModal}
        heading="Configuration"
        text={alertMessage}
        onPress={handleAlertPress}
      />
    </View>
  );
};

export default QRSetupScreen;
