// /* eslint-disable curly */
// /* eslint-disable no-unused-vars */
// /* eslint-disable react-hooks/exhaustive-deps */
// import React, {useState, useEffect} from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   ActivityIndicator,
//   Modal,
//   Animated,
//   I18nManager,
//   Platform,
// } from 'react-native';
// import RNQRGenerator from 'rn-qr-generator';
// import {
//   Camera,
//   useCameraDevice,
//   useCodeScanner,
// } from 'react-native-vision-camera';
// import Icon from 'react-native-vector-icons/FontAwesome';
// import {launchImageLibrary} from 'react-native-image-picker';
// import {useNavigation, useRoute} from '@react-navigation/native';
// import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';

// import {
//   getAllConfigs,
//   saveConfig,
//   saveConfigWithId,
// } from '../../Controller/secureConfig';
// import {translate as t} from '../../store/utils/translate';
// import {decryptQRData} from '../../Controller/decryptQRData';

// import AlertModal from '../../components/Alert/AlertModal';

// import styles from '../../styles/styles';
// import {conditionalVerticalScale, iconSize} from '../../store/utils/scaling';

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

//   const device = useCameraDevice('back');
//   const codeScanner = useCodeScanner({
//     codeTypes: ['qr'],
//     onCodeScanned: codes => {
//       if (isScanning && !isProcessingGalleryImage && codes.length > 0) {
//         handleQRCodeRead({data: codes[0].value});
//       }
//     },
//   });

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

//       if (!resource) return t('qrSetup.unknownConfig');

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
//       return t('qrSetup.unknownConfig');
//     }
//   };

//   const processQRData = async qrData => {
//     try {
//       if (!qrData) throw new Error(t('qrSetup.noQRData'));

//       const parsedData = decryptQRData(qrData, secretKey);
//       console.log('QR decrypted successfully, keys:', Object.keys(parsedData));

//       if (!parsedData || Object.keys(parsedData).length === 0) {
//         throw new Error(t('qrSetup.invalidQRData'));
//       }

//       const allConfigs = await getAllConfigs();

//       // FIX (Issue #5): Previously isDuplicate used a 3-field check (resource +
//       // client_id + grant_type) but the subsequent .find() for the name only
//       // used 2 fields (resource + client_id). When isDuplicate was true but
//       // the 2-field find returned undefined, the alert showed "undefined" as
//       // the config name.
//       //
//       // Fix: use a single .find() for both purposes so the check and the name
//       // lookup are always the same operation and can never diverge.
//       const existingConfig = allConfigs.find(config => {
//         const configData = config.data;
//         return (
//           configData.resource === parsedData.resource &&
//           configData.client_id === parsedData.client_id &&
//           configData.grant_type === parsedData.grant_type
//         );
//       });

//       if (existingConfig) {
//         setAlertMessage(
//           t('qrSetup.duplicateConfig', {
//             // existingConfig is guaranteed to exist here, so .name/.customTitle
//             // will never be undefined
//             configName:
//               existingConfig.customTitle ||
//               existingConfig.name ||
//               t('qrSetup.existingConfig'),
//           }),
//         );
//         setAlertModal(true);
//         return false;
//       }

//       if (isFromConfigSelection) {
//         const configName = extractTitle(parsedData.resource);
//         await saveConfigWithId(parsedData, configName);
//         setAlertMessage(t('qrSetup.configAdded'));
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
//       setAlertMessage(t('qrSetup.qrNotRecognized'));
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
//           setAlertMessage(t('qrSetup.photoPermissionRequired'));
//           setAlertModal(true);
//           return;
//         }
//       } else if (permissionResult === RESULTS.BLOCKED) {
//         setAlertMessage(t('qrSetup.photoPermissionBlocked'));
//         setAlertModal(true);
//         return;
//       }

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
//         setAlertMessage(t('qrSetup.imagePickerFailed'));
//         setAlertModal(true);
//         return;
//       }

//       if (result.assets && result.assets.length > 0) {
//         setIsProcessingGalleryImage(true);
//         setIsScanning(false);

//         const imageUri = result.assets[0].uri;
//         console.log('Selected image URI:', imageUri);

//         try {
//           const response = await RNQRGenerator.detect({
//             uri: imageUri,
//           });

//           console.log('QR Detection Response:', response);

//           if (response && response.values && response.values.length > 0) {
//             const qrData = response.values[0];
//             console.log('QR Data from image:', qrData);

//             await processQRData(qrData);
//           } else {
//             setAlertMessage(t('qrSetup.noQRInImage'));
//             setAlertModal(true);
//           }
//         } catch (error) {
//           console.log('Error decoding QR from image:', error);
//           setAlertMessage(t('qrSetup.qrReadFailed'));
//           setAlertModal(true);
//         } finally {
//           setIsProcessingGalleryImage(false);
//           setTimeout(() => setIsScanning(true), 2000);
//         }
//       }
//     } catch (error) {
//       console.error('Error in handleScanFromGallery:', error);
//       setAlertMessage(t('qrSetup.imageProcessingError'));
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
//           setAlertMessage(t('qrSetup.cameraPermissionRequired'));
//           setAlertModal(true);
//         }
//       } else if (result === RESULTS.BLOCKED) {
//         setAlertMessage(t('qrSetup.cameraPermissionRequired'));
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

//   const SCAN_FRAME_HEIGHT = conditionalVerticalScale(220, 250, 270, 320);
//   const SCAN_LINE_HEIGHT = 2;

//   const scanLineTranslate = scanAnimation.interpolate({
//     inputRange: [0, 1],
//     outputRange: [0, SCAN_FRAME_HEIGHT - SCAN_LINE_HEIGHT],
//   });

//   return (
//     <View style={styles.QRSetup_Container}>
//       {/* Header */}
//       <View style={styles.QRSetup_Header}>
//         {isFromConfigSelection && (
//           <TouchableOpacity
//             style={styles.QRSetup_BackButton}
//             onPress={() => navigation.navigate('ConfigSelectionScreen')}
//             activeOpacity={0.7}>
//             <Icon
//               name={I18nManager.isRTL ? 'arrow-right' : 'arrow-left'}
//               size={iconSize.sm}
//               color="#0A66C2"
//             />
//           </TouchableOpacity>
//         )}

//         <View style={styles.QRSetup_HeaderContent}>
//           <View style={styles.QRSetup_IconBackground}>
//             <Icon name="qrcode" size={iconSize.xl} color="#0A66C2" />
//           </View>
//           <Text style={styles.QRSetup_Title}>
//             {isFromConfigSelection
//               ? t('qrSetup.addConfig')
//               : t('qrSetup.environmentSetup')}
//           </Text>
//           <Text style={styles.QRSetup_Subtitle}>
//             {isFromConfigSelection
//               ? t('qrSetup.scanToAdd')
//               : t('qrSetup.scanToBegin')}
//           </Text>
//         </View>
//       </View>

//       {/* Scanner Container */}
//       <View style={styles.QRSetup_ScannerWrapper}>
//         <View style={styles.QRSetup_ScannerContainer}>
//           {hasPermission ? (
//             isScanning && !isProcessingGalleryImage && device ? (
//               <>
//                 <Camera
//                   style={styles.QRSetup_Camera || StyleSheet.absoluteFill}
//                   device={device}
//                   isActive={true}
//                   codeScanner={codeScanner}
//                 />

//                 {/* Custom Scanner Overlay */}
//                 <View style={styles.QRSetup_Overlay}>
//                   {/* Top overlay */}
//                   <View style={styles.QRSetup_OverlaySection} />

//                   {/* Middle section with scanner frame */}
//                   <View style={styles.QRSetup_MiddleSection}>
//                     <View style={styles.QRSetup_OverlaySection} />
//                     <View style={styles.QRSetup_ScannerFrame}>
//                       {/* Corner decorations */}
//                       <View
//                         style={[styles.QRSetup_Corner, styles.QRSetup_TopLeft]}
//                       />
//                       <View
//                         style={[styles.QRSetup_Corner, styles.QRSetup_TopRight]}
//                       />
//                       <View
//                         style={[
//                           styles.QRSetup_Corner,
//                           styles.QRSetup_BottomLeft,
//                         ]}
//                       />
//                       <View
//                         style={[
//                           styles.QRSetup_Corner,
//                           styles.QRSetup_BottomRight,
//                         ]}
//                       />

//                       {/* Animated scan line */}
//                       <Animated.View
//                         style={[
//                           styles.QRSetup_ScanLine,
//                           {
//                             transform: [{translateY: scanLineTranslate}],
//                           },
//                         ]}
//                       />
//                     </View>
//                     <View style={styles.QRSetup_OverlaySection} />
//                   </View>

//                   {/* Bottom overlay */}
//                   <View style={styles.QRSetup_OverlaySection} />
//                 </View>

//                 {/* Scanning Instructions */}
//                 <View style={styles.QRSetup_InstructionsContainer}>
//                   <View style={styles.QRSetup_InstructionCard}>
//                     <Icon
//                       name="crosshairs"
//                       size={iconSize.md}
//                       color="#0A66C2"
//                     />
//                     <Text style={styles.QRSetup_InstructionText}>
//                       {t('qrSetup.positionQR')}
//                     </Text>
//                   </View>
//                 </View>
//               </>
//             ) : (
//               <View style={styles.QRSetup_ProcessingContainer}>
//                 <View style={styles.QRSetup_ProcessingCard}>
//                   <ActivityIndicator size="large" color="#0A66C2" />
//                   <Text style={styles.QRSetup_ProcessingText}>
//                     {isProcessingGalleryImage
//                       ? t('qrSetup.processingImage')
//                       : t('qrSetup.processingQR')}
//                   </Text>
//                   <Text style={styles.QRSetup_ProcessingSubtext}>
//                     {t('qrSetup.pleaseWait')}
//                   </Text>
//                 </View>
//               </View>
//             )
//           ) : (
//             <View style={styles.QRSetup_PermissionContainer}>
//               <View style={styles.QRSetup_PermissionCard}>
//                 <View style={styles.QRSetup_PermissionIcon}>
//                   <Icon name="camera" size={iconSize.xl} color="#999" />
//                 </View>
//                 <Text style={styles.QRSetup_PermissionTitle}>
//                   {t('qrSetup.cameraAccessRequired')}
//                 </Text>
//                 <Text style={styles.QRSetup_PermissionText}>
//                   {t('qrSetup.grantCameraPermission')}
//                 </Text>
//               </View>
//             </View>
//           )}
//         </View>
//       </View>

//       {/* Footer Actions */}
//       <View style={styles.QRSetup_Footer}>
//         <View style={styles.QRSetup_FooterContent}>
//           {/* Gallery Scan Button */}
//           <TouchableOpacity
//             style={styles.QRSetup_GalleryButton}
//             onPress={handleScanFromGallery}
//             activeOpacity={0.8}
//             disabled={isProcessingGalleryImage}>
//             <Icon
//               name="picture-o"
//               size={iconSize.xs}
//               color="#fff"
//               style={styles.QRSetup_ButtonIcon}
//             />
//             <Text style={styles.QRSetup_GalleryButtonText}>
//               {t('qrSetup.scanFromGallery')}
//             </Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.QRSetup_SkipButton}
//             onPress={handleSkipPress}
//             activeOpacity={0.8}>
//             <Icon
//               name={isFromConfigSelection ? 'times' : 'forward'}
//               size={iconSize.xs}
//               color="#0A66C2"
//               style={styles.QRSetup_ButtonIcon}
//             />
//             <Text style={styles.QRSetup_SkipButtonText}>
//               {isFromConfigSelection
//                 ? t('common.cancel')
//                 : t('qrSetup.skipForNow')}
//             </Text>
//           </TouchableOpacity>

//           <View style={styles.QRSetup_HelpContainer}>
//             <Icon name="question-circle" size={iconSize.xs} color="#999" />
//             <Text style={styles.QRSetup_HelpText}>{t('qrSetup.needHelp')}</Text>
//           </View>
//         </View>
//       </View>

//       {/* Skip Confirmation Modal */}
//       <Modal
//         animationType="fade"
//         transparent={true}
//         visible={modalVisible}
//         onRequestClose={() => setModalVisible(false)}>
//         <View style={styles.QRSetup_ModalOverlay}>
//           <View style={styles.QRSetup_ModalContainer}>
//             <View style={styles.QRSetup_ModalIconContainer}>
//               <Icon
//                 name={
//                   isFromConfigSelection
//                     ? 'times-circle'
//                     : 'exclamation-triangle'
//                 }
//                 size={iconSize.xl}
//                 color="#ff9800"
//               />
//             </View>

//             <Text style={styles.QRSetup_ModalTitle}>
//               {isFromConfigSelection
//                 ? t('qrSetup.cancelSetup')
//                 : t('qrSetup.skipSetup')}
//             </Text>

//             <Text style={styles.QRSetup_ModalMessage}>
//               {isFromConfigSelection
//                 ? t('qrSetup.cancelSetupMessage')
//                 : t('qrSetup.skipSetupMessage')}
//             </Text>

//             <View style={styles.QRSetup_ModalButtons}>
//               <TouchableOpacity
//                 style={styles.QRSetup_ModalButtonSecondary}
//                 onPress={() => setModalVisible(false)}
//                 activeOpacity={0.8}>
//                 <Text style={styles.QRSetup_ModalButtonSecondaryText}>
//                   {t('qrSetup.continueScanning')}
//                 </Text>
//               </TouchableOpacity>

//               <TouchableOpacity
//                 style={styles.QRSetup_ModalButtonPrimary}
//                 onPress={handleSkipConfirm}
//                 activeOpacity={0.8}>
//                 <Text style={styles.QRSetup_ModalButtonPrimaryText}>
//                   {isFromConfigSelection
//                     ? t('qrSetup.cancelSetup')
//                     : t('qrSetup.skip')}
//                 </Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>

//       <AlertModal
//         visible={alertModal}
//         heading={t('qrSetup.configuration')}
//         text={alertMessage}
//         onPress={handleAlertPress}
//       />
//     </View>
//   );
// };

// export default QRSetupScreen;
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Animated,
  I18nManager,
  Platform,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Pressable,
} from 'react-native';
import RNQRGenerator from 'rn-qr-generator';
import {
  Camera,
  useCameraDevice,
  useCodeScanner,
} from 'react-native-vision-camera';
import Icon from 'react-native-vector-icons/Feather';
import {launchImageLibrary} from 'react-native-image-picker';
import {useNavigation, useRoute} from '@react-navigation/native';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import LinearGradient from 'react-native-linear-gradient';

import {
  getAllConfigs,
  saveConfig,
  saveConfigWithId,
} from '../../Controller/secureConfig';
import {translate as t} from '../../store/utils/translate';
import {decryptQRData} from '../../Controller/decryptQRData';
import AlertModal from '../../components/Alert/AlertModal';

const {width} = Dimensions.get('window');
const SCANNER_SIZE = Math.min(width * 0.72, 300);
const secretKey = 'P@$sw0rd321';

const QRSetupScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const device = useCameraDevice('back');

  const [isScanning, setIsScanning] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);

  const [lineAnim] = useState(new Animated.Value(0));
  const [successAnim] = useState(new Animated.Value(0));
  const [buttonScale] = useState(new Animated.Value(1));

  const isFromConfigSelection = route.params?.isFromConfigSelection || false;

  // Button Press Animation
  const onPressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    if (isScanning && !isProcessing) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(lineAnim, {
            toValue: 1,
            duration: 2500,
            useNativeDriver: true,
          }),
          Animated.timing(lineAnim, {
            toValue: 0,
            duration: 2500,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }
  }, [isScanning, isProcessing]);

  useEffect(() => {
    if (scanSuccess) {
      Animated.sequence([
        Animated.spring(successAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.delay(1200),
        Animated.timing(successAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setScanSuccess(false));
    }
  }, [scanSuccess]);

  const extractTitle = useCallback(configOrUrl => {
    try {
      const resource =
        typeof configOrUrl === 'string'
          ? configOrUrl
          : configOrUrl?.resource || '';
      if (!resource) return t('qrSetup.unknownConfig');
      let withoutProtocol = resource.replace(/(^\w+:|^)\/\//, '');
      const hostname = withoutProtocol.split('/')[0];
      const firstPart = hostname.split('.')[0];
      const hyphenParts = firstPart.split('-');
      if (hyphenParts.length >= 2) {
        return `${
          hyphenParts[0].charAt(0).toUpperCase() + hyphenParts[0].slice(1)
        } ${hyphenParts[1].charAt(0).toUpperCase() + hyphenParts[1].slice(1)}`;
      }
      return (
        firstPart.charAt(0).toUpperCase() + firstPart.slice(1) || 'Environment'
      );
    } catch (err) {
      return t('qrSetup.unknownConfig');
    }
  }, []);

  const processQRData = useCallback(
    async qrData => {
      try {
        if (!qrData) throw new Error(t('qrSetup.noQRData'));
        setIsProcessing(true);
        setIsScanning(false);

        const parsedData = decryptQRData(qrData, secretKey);
        if (!parsedData || Object.keys(parsedData).length === 0) {
          throw new Error(t('qrSetup.invalidQRData'));
        }

        const allConfigs = await getAllConfigs();
        const existingConfig = allConfigs.find(
          config =>
            config.data.resource === parsedData.resource &&
            config.data.client_id === parsedData.client_id,
        );

        if (existingConfig) {
          setAlertMessage(
            t('qrSetup.duplicateConfig', {
              configName:
                existingConfig.customTitle ||
                existingConfig.name ||
                t('qrSetup.existingConfig'),
            }),
          );
          setAlertModal(true);
          setIsProcessing(false);
          setIsScanning(true);
          return;
        }

        setScanSuccess(true);

        if (isFromConfigSelection) {
          const configName = extractTitle(parsedData.resource);
          await saveConfigWithId(parsedData, configName);
          setTimeout(() => navigation.navigate('ConfigSelectionScreen'), 800);
        } else {
          await saveConfig(parsedData);
          setTimeout(() => navigation.replace('Login'), 800);
        }
      } catch (err) {
        setAlertMessage(t('qrSetup.qrNotRecognized'));
        setAlertModal(true);
        setIsProcessing(false);
        setIsScanning(true);
      }
    },
    [isFromConfigSelection, navigation, extractTitle],
  );

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: codes => {
      if (isScanning && !isProcessing && codes.length > 0) {
        processQRData(codes[0].value);
      }
    },
  });

  const handleScanFromGallery = async () => {
    try {
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
          setAlertMessage(t('qrSetup.photoPermissionRequired'));
          setAlertModal(true);
          return;
        }
      }

      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.5, // ← lower quality = faster processing
        selectionLimit: 1,
      });

      // User cancelled — do nothing
      if (!result.assets || result.assets.length === 0) return;

      const imageUri = result.assets[0]?.uri;
      if (!imageUri) {
        setAlertMessage('Could not read the selected image. Please try again.');
        setAlertModal(true);
        return;
      }

      // Show processing overlay IMMEDIATELY before any async work
      setIsProcessing(true);
      setIsScanning(false);

      // Give React one frame to render the overlay before blocking work starts
      await new Promise(resolve => setTimeout(resolve, 50));

      // Race between detection and a 5 second timeout
      let response;
      try {
        response = await Promise.race([
          RNQRGenerator.detect({uri: imageUri}),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error('timeout')),
              5000, // 5 seconds max
            ),
          ),
        ]);
      } catch (detectError) {
        const isTimeout = detectError.message === 'timeout';
        setAlertMessage(
          isTimeout
            ? 'Scan timed out. Please select a smaller or clearer image.'
            : 'This image could not be scanned. Please select a clear QR code image.',
        );
        setAlertModal(true);
        setIsProcessing(false);
        setIsScanning(true);
        return;
      }

      if (response?.values && response.values.length > 0) {
        processQRData(response.values[0]);
      } else {
        setAlertMessage(
          'No QR code found in this image. Please select an image that contains a valid QR code.',
        );
        setAlertModal(true);
        setIsProcessing(false);
        setIsScanning(true);
      }
    } catch (error) {
      setAlertMessage(
        'Something went wrong while reading the image. Please try again.',
      );
      setAlertModal(true);
      setIsProcessing(false);
      setIsScanning(true);
    }
  };

  useEffect(() => {
    (async () => {
      const status = await request(
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.CAMERA
          : PERMISSIONS.ANDROID.CAMERA,
      );
      setHasPermission(status === RESULTS.GRANTED);
    })();
  }, []);

  const handleSkip = () => {
    setModalVisible(false);
    isFromConfigSelection
      ? navigation.navigate('ConfigSelectionScreen')
      : navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            isFromConfigSelection ? navigation.goBack() : setModalVisible(true)
          }
          style={styles.iconButton}>
          <Icon
            name={I18nManager.isRTL ? 'arrow-right' : 'arrow-left'}
            size={20}
            color="#1E293B"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {isFromConfigSelection
            ? t('qrSetup.addConfig')
            : t('qrSetup.environmentSetup')}
        </Text>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setModalVisible(true)}>
          <Icon name="help-circle" size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.topSection}>
          <View style={styles.iconWrapper}>
            <LinearGradient
              colors={['#0A66C2', '#0A66C2']}
              style={styles.qrIconGradient}>
              <Icon name="maximize" size={24} color="#FFFFFF" />
            </LinearGradient>
          </View>

          <Text style={styles.instructionTitle}>
            {isFromConfigSelection
              ? 'Configure your enviornment.'
              : 'Scan to Get Started'}
          </Text>

          <Text style={styles.instructionSubtext}>
            Align the QR code within the frame to automatically configure your
            environment.
          </Text>
        </View>

        <View style={styles.scannerSection}>
          <View style={styles.scannerContainer}>
            <View style={styles.cameraFrame}>
              {hasPermission && device ? (
                <>
                  <Camera
                    style={StyleSheet.absoluteFill}
                    device={device}
                    isActive={isScanning && !isProcessing}
                    codeScanner={codeScanner}
                  />
                  <View style={styles.overlayContainer}>
                    <View style={styles.darkOverlay} />
                    <View style={[styles.cornerMarker, styles.topLeftMarker]} />
                    <View
                      style={[styles.cornerMarker, styles.topRightMarker]}
                    />
                    <View
                      style={[styles.cornerMarker, styles.bottomLeftMarker]}
                    />
                    <View
                      style={[styles.cornerMarker, styles.bottomRightMarker]}
                    />

                    <Animated.View
                      style={[
                        styles.scanLine,
                        {
                          transform: [
                            {
                              translateY: lineAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [20, SCANNER_SIZE - 24],
                              }),
                            },
                          ],
                        },
                      ]}
                    />
                  </View>
                </>
              ) : (
                <View style={styles.noPermissionView}>
                  <Icon name="camera-off" size={40} color="#CBD5E1" />
                  <Text style={styles.noPermissionText}>
                    {t('qrSetup.cameraAccessRequired')}
                  </Text>
                </View>
              )}

              {scanSuccess && (
                <Animated.View
                  style={[
                    styles.successOverlay,
                    {
                      transform: [{scale: successAnim}],
                      opacity: successAnim,
                    },
                  ]}>
                  <View style={styles.successContent}>
                    <Icon name="check-circle" size={56} color="#FFFFFF" />
                    <Text style={styles.successText}>Success</Text>
                  </View>
                </Animated.View>
              )}

              {isProcessing && (
                <View style={styles.processingOverlay}>
                  <ActivityIndicator size="small" color="#0F172A" />
                  <Text style={styles.processingText}>Verifying...</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.bottomSection}>
          <View style={styles.tipContainer}>
            <View style={styles.tipItem}>
              <View style={styles.tipIconDot} />
              <Text style={styles.tipText}>Clear lens</Text>
            </View>
            <View style={styles.tipItem}>
              <View style={styles.tipIconDot} />
              <Text style={styles.tipText}>Steady focus</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Animated.View style={{transform: [{scale: buttonScale}]}}>
          <Pressable
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            onPress={handleScanFromGallery}
            disabled={isProcessing}
            style={({pressed}) => [
              styles.galleryButton,
              {backgroundColor: pressed ? '#08539D' : '#0A66C2'}, // Deepens slightly on press
            ]}>
            <Icon name="image" size={19} color="#FFFFFF" />
            <Text style={styles.galleryButtonText}>Upload from Gallery</Text>
          </Pressable>
        </Animated.View>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
          disabled={isProcessing}>
          <Text style={styles.skipButtonText}>
            {isFromConfigSelection ? 'Cancel' : 'Skip for Now'}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal transparent visible={modalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconWrapper}>
              <Icon name="alert-circle" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.modalTitle}>
              {isFromConfigSelection ? 'Cancel Setup?' : 'Skip Setup?'}
            </Text>
            <Text style={styles.modalBody}>
              {isFromConfigSelection
                ? 'Are you sure you want to cancel? No configuration will be added.'
                : 'You can always scan a QR code later from the settings menu.'}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleSkip}>
                <Text style={styles.modalConfirmText}>
                  {isFromConfigSelection ? 'Confirm' : 'Skip'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <AlertModal
        visible={alertModal}
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c0d0f',
    letterSpacing: -0.2,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  topSection: {
    alignItems: 'center',
    paddingHorizontal: 40,
    marginBottom: 32,
  },
  qrIconGradient: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  instructionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0A66C2',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  instructionSubtext: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  scannerSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerContainer: {
    borderRadius: 30,
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 10,
  },
  cameraFrame: {
    width: SCANNER_SIZE,
    height: SCANNER_SIZE,
    borderRadius: 22,
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.1)',
  },
  cornerMarker: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#FFFFFF',
    borderWidth: 3,
  },
  topLeftMarker: {
    top: 20,
    left: 20,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 10,
  },
  topRightMarker: {
    top: 20,
    right: 20,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 10,
  },
  bottomLeftMarker: {
    bottom: 20,
    left: 20,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 10,
  },
  bottomRightMarker: {
    bottom: 20,
    right: 20,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 10,
  },
  scanLine: {
    width: '85%',
    alignSelf: 'center',
    height: 2,
    backgroundColor: '#38BDF8',
    shadowColor: '#38BDF8',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 10,
  },
  noPermissionView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  noPermissionText: {
    marginTop: 12,
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(16, 185, 129, 0.98)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContent: {alignItems: 'center'},
  successText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 10,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '700',
  },
  bottomSection: {
    marginTop: 24,
  },
  tipContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  tipItem: {flexDirection: 'row', alignItems: 'center', gap: 6},
  tipIconDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#94A3B8',
  },
  tipText: {fontSize: 12, color: '#94A3B8', fontWeight: '600'},
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 34,
    paddingTop: 12,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    // Professional blue background
    backgroundColor: '#0A66C2',
    gap: 10,
    // Subtle shadow for depth
    shadowColor: '#0A66C2',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  galleryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF', // White text as requested
    letterSpacing: 0.2,
  },
  skipButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    // "Hint of blue" - very light background with a soft border
    backgroundColor: '#F0F7FF',
    borderWidth: 1,
    borderColor: '#E0EEFF',
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0369A1', // Blue text to match the hint of blue theme
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
  },
  modalIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFBEB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  modalBody: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalButtons: {flexDirection: 'row', gap: 10},
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F1F5F9', // Neutral for balance
    alignItems: 'center',
  },
  modalCancelText: {fontSize: 14, fontWeight: '700', color: '#475569'},
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#0A66C2',
    alignItems: 'center',
  },
  modalConfirmText: {fontSize: 14, fontWeight: '700', color: '#FFFFFF'},
});

export default QRSetupScreen;
