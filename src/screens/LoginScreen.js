// /* eslint-disable react-hooks/exhaustive-deps */
// /* eslint-disable curly */
// /* eslint-disable no-unused-vars */
// /* eslint-disable react-native/no-inline-styles */
// import React, {useEffect, useState, useCallback} from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   Image,
//   BackHandler,
//   ToastAndroid,
//   Platform,
// } from 'react-native';
// import {useNavigation} from '@react-navigation/native';
// import LinearGradient from 'react-native-linear-gradient';
// import Icon from 'react-native-vector-icons/FontAwesome';
// import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
// import PopupDialog from 'react-native-popup-dialog';
// import {useDispatch, useSelector} from 'react-redux';
// import {translate as t} from '../store/utils/translate';

// import CustomIndicator from '../components/CustomIndicator/CustomIndicator';
// import AlertModal from '../components/Alert/AlertModal';
// import {fetchUserInfo} from '../Controller/authUtils';
// import {setUserData} from '../store/slices/userSlice';
// import {
//   setLegalEntities,
//   initializeLegalEntity,
// } from '../store/slices/companySlice';
// import {setMenuItems} from '../store/slices/menuItemSlice';
// import {
//   authenticateWithBiometrics,
//   getBiometricCredentials,
//   hasPersistentBiometricCredentials,
// } from '../store/utils/biometricUtils';
// import {
//   fetchEmployeeLegalEntities,
//   fetchEmployeeMenuItems,
//   handleLogin,
// } from '../Controller/authUtils';
// import {
//   getActiveConfigData,
//   getActiveConfig,
//   saveConfig,
// } from '../Controller/secureConfig';
// import styles from '../styles/styles';
// import {iconSize} from '../store/utils/scaling';

// const LoginScreen = () => {
//   const navigation = useNavigation();
//   const dispatch = useDispatch();

//   const currentLanguage = useSelector(state => state.language.currentLanguage);

//   const [loading, setLoading] = useState(false);
//   const [dialogVisible, setDialogVisible] = useState(false);
//   const [dialogMessage, setDialogMessage] = useState('');
//   const [alertModal, setAlertModal] = useState(false);
//   const [alertMessage, setAlertMessage] = useState('');
//   const [backPressedOnce, setBackPressedOnce] = useState(false);

//   const [onAlertConfirm, setOnAlertConfirm] = useState(null);
//   const [onDialogConfirm, setOnDialogConfirm] = useState(null);

//   useEffect(() => {
//     let cancelled = false;

//     const tryAutoBiometricLogin = async () => {
//       if (!navigation.isFocused()) return;

//       try {
//         const hasCredentials = await hasPersistentBiometricCredentials();
//         if (cancelled || !hasCredentials) return;

//         const activeConfigId = await getActiveConfig();
//         if (cancelled || !activeConfigId) {
//           console.log('Auto-login: No active config found');
//           return;
//         }

//         const activeConfig = await getActiveConfigData();
//         if (cancelled || !activeConfig) {
//           console.error(
//             'Auto-login: Active config ID exists but data not found',
//           );
//           if (!cancelled) {
//             setAlertMessage(
//               'Configuration Error\nYour saved configuration could not be loaded. Please select a valid configuration from the QR code screen.',
//             );
//             setAlertModal(true);
//           }
//           return;
//         }

//         await saveConfig(activeConfig);
//         if (cancelled) return;

//         const biometricSuccess = await authenticateWithBiometrics();
//         if (cancelled || !biometricSuccess) {
//           console.log(
//             'Auto-login: Biometric authentication failed or cancelled',
//           );
//           return;
//         }

//         if (!cancelled) setLoading(true);

//         const credentials = await getBiometricCredentials();
//         if (cancelled) return;

//         await loadUserDataFromBiometric(
//           credentials.email,
//           credentials.provider,
//         );

//         if (cancelled) return;

//         navigation.navigate('DrawerNavigator');
//       } catch (error) {
//         if (cancelled) return;
//         console.error('Auto-login error:', error);
//         setAlertMessage(
//           `Auto-Login Failed\n${
//             error.message ||
//             'An unexpected error occurred during automatic login.'
//           }\nPlease login manually.`,
//         );
//         setAlertModal(true);
//       } finally {
//         if (!cancelled) setLoading(false);
//       }
//     };

//     tryAutoBiometricLogin();

//     return () => {
//       cancelled = true;
//     };
//   }, [navigation]);

//   useEffect(() => {
//     const backAction = () => {
//       if (navigation.isFocused()) {
//         if (!backPressedOnce) {
//           if (Platform.OS === 'android') {
//             ToastAndroid.show(t('login.pressAgainToExit'), ToastAndroid.SHORT);
//           } else {
//             setAlertMessage(t('login.pressAgainToExit'));
//             setAlertModal(true);
//           }

//           setBackPressedOnce(true);

//           setTimeout(() => {
//             setBackPressedOnce(false);
//           }, 2000);

//           return true;
//         }

//         BackHandler.exitApp();
//         return true;
//       }
//       return false;
//     };

//     const backHandler = BackHandler.addEventListener(
//       'hardwareBackPress',
//       backAction,
//     );

//     return () => backHandler.remove();
//   }, [backPressedOnce, navigation]);

//   const handleProviderLogin = async provider => {
//     try {
//       const activeConfig = await getActiveConfigData();
//       if (!activeConfig) {
//         setAlertMessage(
//           'Configuration Required\nNo configuration found. Please scan a QR code first to set up your environment.',
//         );
//         setOnAlertConfirm(
//           () => () => navigation.navigate('ConfigSelectionScreen'),
//         );
//         setAlertModal(true);
//         return;
//       }

//       handleLogin(
//         setLoading,
//         data => dispatch(setUserData(data)),
//         navigation,
//         setDialogVisible,
//         setDialogMessage,
//         setAlertModal,
//         message => {
//           let errorMessage = message;

//           if (message.includes('Network') || message.includes('network')) {
//             errorMessage = `Network Error\n${message}\nPossible causes:\n• No internet connection\n• Server is unreachable\n• Firewall blocking access`;
//           } else if (
//             message.includes('401') ||
//             message.includes('Unauthorized')
//           ) {
//             errorMessage = `Authentication Failed\n${message}\nPossible causes:\n• Invalid credentials\n• Session expired\n• Account not authorized`;
//           } else if (message.includes('404') || message.includes('Not Found')) {
//             errorMessage = `Server Error\n${message}\nPossible causes:\n• Dynamics VM is down\n• API endpoint not found\n• Configuration is incorrect`;
//           } else if (
//             message.includes('500') ||
//             message.includes('Internal Server')
//           ) {
//             errorMessage = `Dynamics Server Error\n${message}\nPossible causes:\n• Dynamics VM is down or restarting\n• Database connection issue\n• Server maintenance in progress`;
//           } else if (
//             message.includes('timeout') ||
//             message.includes('Timeout')
//           ) {
//             errorMessage = `Connection Timeout\n${message}\nPossible causes:\n• Slow internet connection\n• Dynamics server not responding\n• Request taking too long`;
//           } else if (
//             !message.includes('Error') &&
//             !message.includes('Failed')
//           ) {
//             errorMessage = `${message}`;
//           }

//           setAlertMessage(errorMessage);
//         },
//         legalEntity => dispatch(initializeLegalEntity(legalEntity)),
//         list => dispatch(setLegalEntities(list)),
//         menus => dispatch(setMenuItems(menus)),
//         provider,
//         setOnAlertConfirm,
//         setOnDialogConfirm,
//       );
//     } catch (error) {
//       console.error('Error in handleProviderLogin:', error);

//       let errorMessage = 'Login Error\n';
//       if (error.message) {
//         errorMessage += error.message;
//       } else {
//         errorMessage += 'An unexpected error occurred during login.';
//       }
//       errorMessage += '\nPlease check:\n';
//       errorMessage += '• Your internet connection\n';
//       errorMessage += '• Dynamics VM status\n';
//       errorMessage += '• Configuration settings';

//       setAlertMessage(errorMessage);
//       setAlertModal(true);
//     }
//   };

//   const handleBiometricLogin = async () => {
//     try {
//       const hasCredentials = await hasPersistentBiometricCredentials();
//       if (!hasCredentials) {
//         setAlertMessage(
//           'Biometric login is not set up for any account.\nPlease:\n1. Login with Microsoft or Google\n2. Go to Profile > Biometric Settings\n3. Enable biometric authentication',
//         );
//         setAlertModal(true);
//         return;
//       }

//       const activeConfigId = await getActiveConfig();
//       if (!activeConfigId) {
//         setAlertMessage(
//           'Configuration Required\nNo active configuration found.\nPlease select a configuration from the QR code screen before using biometric login.',
//         );
//         setOnAlertConfirm(
//           () => () => navigation.navigate('ConfigSelectionScreen'),
//         );
//         setAlertModal(true);
//         return;
//       }

//       const credentials = await getBiometricCredentials();
//       if (!credentials?.email || !credentials?.isBiometricEnabled) {
//         setAlertMessage(
//           'Invalid Biometric Configuration\nYour biometric settings are corrupted or incomplete.\nPlease:\n1. Login manually with Microsoft or Google\n2. Re-enable biometric authentication in settings',
//         );
//         setAlertModal(true);
//         return;
//       }

//       const biometricSuccess = await authenticateWithBiometrics();
//       if (!biometricSuccess) {
//         setAlertMessage(
//           'Authentication Failed\nBiometric authentication was cancelled or failed.\nPlease try again or use password login.',
//         );
//         setAlertModal(true);
//         return;
//       }

//       setLoading(true);

//       const activeConfig = await getActiveConfigData();
//       if (!activeConfig) {
//         setAlertMessage(
//           'Configuration Load Failed\nCould not load the active configuration.\nPossible causes:\n• Configuration was deleted\n• Keychain access denied\n• Corrupted configuration data\nPlease select a valid configuration.',
//         );
//         setAlertModal(true);
//         setLoading(false);
//         return;
//       }

//       await saveConfig(activeConfig);
//       await loadUserDataFromBiometric(credentials.email, credentials.provider);
//       navigation.navigate('DrawerNavigator');
//     } catch (error) {
//       console.error('Biometric login error:', error);

//       let errorMessage = 'Biometric Login Failed\n';
//       if (error.message) {
//         errorMessage += error.message;
//       } else {
//         errorMessage += 'An unexpected error occurred.';
//       }
//       errorMessage += '\nPossible solutions:\n';
//       errorMessage += '• Try logging in manually\n';
//       errorMessage += '• Check your internet connection\n';
//       errorMessage += '• Verify Dynamics VM is running\n';
//       errorMessage += '• Re-configure biometric authentication';

//       setAlertMessage(errorMessage);
//       setAlertModal(true);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadUserDataFromBiometric = useCallback(
//     async (email, provider) => {
//       try {
//         console.log(`Loading user data for: ${email} (${provider})`);

//         const userInfo = await fetchUserInfo(email);

//         if (!userInfo || !Array.isArray(userInfo) || userInfo.length === 0) {
//           throw new Error(
//             `User Not Found\nNo user account found for email: ${email}\nPossible causes:\n• User not configured in Dynamics\n• Email address mismatch\n• Dynamics VM is down\n• Database connection issue\nPlease contact your administrator.`,
//           );
//         }

//         const user = userInfo[0];

//         if (!user.EmployeeName || !user.EmployeeId || user.WorkerRecId === 0) {
//           throw new Error(
//             `Invalid User Data\nUser account exists but is incomplete:\n• Employee Name: ${
//               user.EmployeeName || 'Missing'
//             }\n• Employee ID: ${
//               user.EmployeeId || 'Missing'
//             }\n• Worker Record ID: ${
//               user.WorkerRecId || '0 (Invalid)'
//             }\nPossible causes:\n• Incomplete user setup in Dynamics\n• User account not properly configured\n• Data synchronization issue\nPlease contact your administrator.`,
//           );
//         }

//         const completeUserData = {
//           userName: user.EmployeeName,
//           employeeName: user.EmployeeName,
//           employeeId: user.EmployeeId,
//           WorkerRecId: user.WorkerRecId,
//           email: email,
//           jobId: user.JobId,
//           department: user.Department,
//           defaultLegalEntity: user.DefaultLegalEntity,
//           PositionDescription: user.PositionDescription,
//           CreatedBy: user.CreatedBy,
//           CreatedDateTime: user.CreatedDateTime,
//           DataAreaId: user.DataAreaId,
//           IsEnrolledInPayroll: user.IsEnrolledInPayroll,
//           JobDescription: user.JobDescription,
//           ModifiedBy: user.ModifiedBy,
//           ModifiedDateTime: user.ModifiedDateTime,
//           OriginalHireDate: user.OriginalHireDate,
//           Partition: user.Partition,
//           Person: user.Person,
//           Positionid: user.Positionid,
//           RecId: user.RecId,
//           isDynamicsUser: user.isDynamicsUser,
//           employeeFullInfo: user,
//         };

//         dispatch(setUserData(completeUserData));

//         await dispatch(initializeLegalEntity(user.DefaultLegalEntity));

//         console.log(`Fetching legal entities for employee: ${user.EmployeeId}`);
//         const legalEntities = await fetchEmployeeLegalEntities(user.EmployeeId);

//         console.log(`Fetching menu items for person: ${user.Person}`);
//         const menus = await fetchEmployeeMenuItems(user.Person);

//         dispatch(setLegalEntities(legalEntities));
//         dispatch(setMenuItems(menus));

//         console.log('Biometric login successful for:', email);
//         return true;
//       } catch (error) {
//         console.error('Error loading user data from biometric:', error);

//         if (error.message && error.message.includes('\n')) {
//           throw error;
//         }

//         let errorMessage = 'User Data Load Failed\n';
//         if (error.message) {
//           errorMessage += error.message;
//         } else {
//           errorMessage += 'Could not load user information from Dynamics.';
//         }
//         errorMessage += '\nPossible causes:\n';
//         errorMessage += '• Dynamics VM is down or unreachable\n';
//         errorMessage += '• Network connection issue\n';
//         errorMessage += '• User account not found in system\n';
//         errorMessage += '• Database query timeout\n';
//         errorMessage += 'Please try again or contact your administrator.';

//         throw new Error(errorMessage);
//       }
//     },
//     [dispatch],
//   );

//   const googleIcon = require('../assets/google.png');
//   const microsoftIcon = require('../assets/microsoft.png');

//   const handleAlertConfirm = useCallback(() => {
//     setAlertModal(false);
//     if (onAlertConfirm) {
//       onAlertConfirm();
//       setOnAlertConfirm(null);
//     }
//   }, [onAlertConfirm]);

//   const handleDialogConfirm = useCallback(() => {
//     setDialogVisible(false);
//     if (onDialogConfirm) {
//       onDialogConfirm();
//       setOnDialogConfirm(null);
//     }
//   }, [onDialogConfirm]);

//   return (
//     <LinearGradient
//       colors={['#FFFFFF', '#ffffffff']}
//       style={styles.Login_Container}>
//       {!loading && (
//         <>
//           {/* QR Code Setup Button - Top Right */}
//           <TouchableOpacity
//             style={styles.Login_QRButton}
//             onPress={() => navigation.navigate('ConfigSelectionScreen')}>
//             <Icon name="qrcode" size={iconSize.md} color="#0A66C2" />
//           </TouchableOpacity>

//           {/* Header */}
//           <View style={styles.Login_Header}>
//             {/* <Image
//               source={require('../assets/cloud.png')}
//               style={styles.Login_Logo}
//             /> */}
//             <Text style={styles.Login_Title}>{t('login.welcomeTitle')}</Text>
//             <Text style={styles.Login_Subtitle}>
//               {t('login.welcomeSubtitle')}
//             </Text>
//           </View>

//           {/* Login Buttons Container */}
//           <View style={styles.Login_ButtonsContainer}>
//             {/* Login Button - Microsoft */}
//             <TouchableOpacity
//               style={styles.Login_Button}
//               onPress={() => handleProviderLogin('Azure')}
//               disabled={loading}>
//               <Image source={microsoftIcon} style={styles.Login_Icon} />
//               <Text style={styles.Login_ButtonText}>
//                 {t('login.signInMicrosoft')}
//               </Text>
//             </TouchableOpacity>

//             {/* Login Button - Google */}
//             <TouchableOpacity
//               style={styles.Login_Button}
//               onPress={() => handleProviderLogin('Google')}
//               disabled={loading}>
//               <Image source={googleIcon} style={styles.Login_Icon} />
//               <Text style={styles.Login_ButtonText}>
//                 {t('login.signInGoogle')}
//               </Text>
//             </TouchableOpacity>
//           </View>

//           {/* Biometric button */}
//           <TouchableOpacity
//             style={styles.Login_FingerprintButton}
//             onPress={handleBiometricLogin}
//             disabled={loading}>
//             <MaterialCommunityIcons
//               name="fingerprint"
//               size={iconSize.lg}
//               color="#0A66C2"
//             />
//           </TouchableOpacity>
//           <Image
//             source={require('../assets/cloud.png')}
//             style={styles.Login_Logo}
//           />
//         </>
//       )}

//       {loading && (
//         <View style={styles.Login_LoadingContainer}>
//           <CustomIndicator />
//           <Text style={styles.Login_LoadingText}>
//             {t('login.connectingMessage')}
//           </Text>
//         </View>
//       )}

//       <PopupDialog
//         visible={dialogVisible}
//         onTouchOutside={() => setDialogVisible(false)}
//         dialogStyle={styles.Login_DialogContainer}
//         width={0.8}
//         height={0.3}
//         dialogTitle={
//           <Text style={styles.Login_DialogTitle}>
//             {t('login.notification')}
//           </Text>
//         }>
//         <Text style={styles.Login_DialogMessage}>{dialogMessage}</Text>

//         <View style={styles.Login_DialogButtonsRow}>
//           <TouchableOpacity
//             style={[styles.Login_DialogButton, {backgroundColor: '#999'}]}
//             onPress={() => {
//               setDialogVisible(false);
//               setOnDialogConfirm(null);
//             }}>
//             <Text style={styles.Login_DialogButtonText}>
//               {t('common.cancel')}
//             </Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={[styles.Login_DialogButton, {backgroundColor: '#0A66C2'}]}
//             onPress={handleDialogConfirm}>
//             <Text style={styles.Login_DialogButtonText}>{t('common.ok')}</Text>
//           </TouchableOpacity>
//         </View>
//       </PopupDialog>

//       <AlertModal
//         visible={alertModal}
//         heading={t('common.dynaface')}
//         text={alertMessage}
//         onPress={handleAlertConfirm}
//       />
//     </LinearGradient>
//   );
// };

// export default LoginScreen;
import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  BackHandler,
  ToastAndroid,
  Platform,
  StatusBar,
  SafeAreaView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useDispatch} from 'react-redux';
import {translate as t} from '../store/utils/translate';

// Components & Utils
import CustomIndicator from '../components/CustomIndicator/CustomIndicator';
import AlertModal from '../components/Alert/AlertModal';
import {fetchUserInfo} from '../Controller/authUtils';
import {setUserData} from '../store/slices/userSlice';
import {
  setLegalEntities,
  initializeLegalEntity,
} from '../store/slices/companySlice';
import {setMenuItems} from '../store/slices/menuItemSlice';
import {
  authenticateWithBiometrics,
  getBiometricCredentials,
  hasPersistentBiometricCredentials,
} from '../store/utils/biometricUtils';
import {
  fetchEmployeeLegalEntities,
  fetchEmployeeMenuItems,
  handleLogin,
} from '../Controller/authUtils';
import {
  getActiveConfigData,
  getActiveConfig,
  saveConfig,
} from '../Controller/secureConfig';

const {width} = Dimensions.get('window');

const LoginScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [backPressedOnce, setBackPressedOnce] = useState(false);
  const [onAlertConfirm, setOnAlertConfirm] = useState(null);
  const [onDialogConfirm, setOnDialogConfirm] = useState(null);

  const loadUserDataFromBiometric = useCallback(
    async (email, provider) => {
      const userInfo = await fetchUserInfo(email);
      if (!userInfo || userInfo.length === 0) throw new Error('User not found');
      const user = userInfo[0];

      const completeUserData = {
        userName: user.EmployeeName,
        employeeName: user.EmployeeName,
        employeeId: user.EmployeeId,
        WorkerRecId: user.WorkerRecId,
        email: email,
        person: user.Person,
        defaultLegalEntity: user.DefaultLegalEntity,
      };

      dispatch(setUserData(completeUserData));
      await dispatch(initializeLegalEntity(user.DefaultLegalEntity));

      const [legalEntities, menus] = await Promise.all([
        fetchEmployeeLegalEntities(user.EmployeeId),
        fetchEmployeeMenuItems(user.Person),
      ]);

      dispatch(setLegalEntities(legalEntities));
      dispatch(setMenuItems(menus));
    },
    [dispatch],
  );

  useEffect(() => {
    let cancelled = false;
    const tryAutoBiometricLogin = async () => {
      if (!navigation.isFocused()) return;
      try {
        const hasCredentials = await hasPersistentBiometricCredentials();
        if (cancelled || !hasCredentials) return;

        const activeConfigId = await getActiveConfig();
        if (cancelled || !activeConfigId) return;

        const activeConfig = await getActiveConfigData();
        if (cancelled || !activeConfig) return;

        await saveConfig(activeConfig);
        const biometricSuccess = await authenticateWithBiometrics();
        if (cancelled || !biometricSuccess) return;

        if (!cancelled) setLoading(true);
        const credentials = await getBiometricCredentials();

        await loadUserDataFromBiometric(
          credentials.email,
          credentials.provider,
        );

        if (!cancelled) navigation.navigate('DrawerNavigator');
      } catch (error) {
        console.error('Auto-login error:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    tryAutoBiometricLogin();
    return () => {
      cancelled = true;
    };
  }, [navigation, loadUserDataFromBiometric]);

  useEffect(() => {
    const backAction = () => {
      if (navigation.isFocused()) {
        if (!backPressedOnce) {
          if (Platform.OS === 'android') {
            ToastAndroid.show(t('login.pressAgainToExit'), ToastAndroid.SHORT);
          }
          setBackPressedOnce(true);
          setTimeout(() => setBackPressedOnce(false), 2000);
          return true;
        }
        BackHandler.exitApp();
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );
    return () => backHandler.remove();
  }, [backPressedOnce, navigation]);

  const handleProviderLogin = async provider => {
    try {
      const activeConfig = await getActiveConfigData();
      if (!activeConfig) {
        setAlertMessage('Configuration Required\nPlease scan a QR code first.');
        setOnAlertConfirm(
          () => () => navigation.navigate('ConfigSelectionScreen'),
        );
        setAlertModal(true);
        return;
      }

      handleLogin(
        setLoading,
        data => dispatch(setUserData(data)),
        navigation,
        () => {},
        () => {},
        setAlertModal,
        message => setAlertMessage(message),
        le => dispatch(initializeLegalEntity(le)),
        list => dispatch(setLegalEntities(list)),
        menus => dispatch(setMenuItems(menus)),
        provider,
        setOnAlertConfirm,
        setOnDialogConfirm,
      );
    } catch (error) {
      setAlertMessage('Login Error: ' + error.message);
      setAlertModal(true);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const hasCredentials = await hasPersistentBiometricCredentials();
      if (!hasCredentials) {
        setAlertMessage(
          'Biometric login is not set up.\nPlease login manually first.',
        );
        setAlertModal(true);
        return;
      }
      const biometricSuccess = await authenticateWithBiometrics();
      if (!biometricSuccess) return;

      setLoading(true);
      const credentials = await getBiometricCredentials();
      const activeConfig = await getActiveConfigData();
      if (activeConfig) await saveConfig(activeConfig);

      await loadUserDataFromBiometric(credentials.email, credentials.provider);
      navigation.navigate('DrawerNavigator');
    } catch (error) {
      setAlertMessage('Biometric Login Failed: ' + error.message);
      setAlertModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAlertConfirm = useCallback(() => {
    setAlertModal(false);
    if (onAlertConfirm) {
      onAlertConfirm();
      setOnAlertConfirm(null);
    }
  }, [onAlertConfirm]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.bgShape1} />
      <View style={styles.bgShape2} />

      {!loading ? (
        <View style={styles.content}>
          <View style={styles.topBar}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.qrIconButton}
              onPress={() => navigation.navigate('ConfigSelectionScreen')}>
              <MaterialCommunityIcons
                name="qrcode-scan"
                size={22}
                color="#64748B"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.identitySection}>
            <Image
              source={require('../assets/cloud.png')}
              style={styles.mainLogo}
              resizeMode="contain"
            />
            <View style={styles.textStack}>
              <Text style={styles.welcomeTitle}>{t('login.welcomeTitle')}</Text>
              <Text style={styles.welcomeSubtitle}>
                {t('login.welcomeSubtitle')}
              </Text>
            </View>
          </View>

          <View style={styles.actionSection}>
            <Text style={styles.actionLabel}>Secure Sign In</Text>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.authButton, styles.shadow]}
              onPress={() => handleProviderLogin('Azure')}>
              <Image
                source={require('../assets/microsoft.png')}
                style={styles.providerIcon}
              />
              <Text style={styles.authButtonText}>
                {t('login.signInMicrosoft')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.authButton, styles.shadow]}
              onPress={() => handleProviderLogin('Google')}>
              <Image
                source={require('../assets/google.png')}
                style={styles.providerIcon}
              />
              <Text style={styles.authButtonText}>
                {t('login.signInGoogle')}
              </Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.line} />
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.biometricButton}
              onPress={handleBiometricLogin}>
              <View style={styles.biometricIconCircle}>
                <MaterialCommunityIcons
                  name="fingerprint"
                  size={32}
                  color="#0A66C2"
                />
              </View>
              <Text style={styles.biometricText}>Biometric Login</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Maison Consulting and Solutions
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.loadingContainer}>
          <CustomIndicator />
          <Text style={styles.loadingText}>{t('login.connectingMessage')}</Text>
        </View>
      )}

      <AlertModal
        visible={alertModal}
        heading="System Security"
        text={alertMessage}
        onPress={handleAlertConfirm}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FFFFFF'},
  bgShape1: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: 600,
    backgroundColor: '#F7FAFF',
    top: -width * 0.4, // Moved down from 0.6
    left: -width * 0.3,
    zIndex: -1,
  },
  bgShape2: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: 400,
    backgroundColor: '#EFF6FF',
    bottom: -width * 0.4,
    right: -width * 0.2,
    zIndex: -1,
  },
  content: {flex: 1, paddingHorizontal: 30, justifyContent: 'space-between'},
  topBar: {flexDirection: 'row', justifyContent: 'flex-end', marginTop: 15},
  qrIconButton: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  identitySection: {alignItems: 'center', marginTop: 60}, // Increased from 20 to move logo down
  mainLogo: {width: 90, height: 90, marginBottom: 15},
  textStack: {alignItems: 'center'},
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
    maxWidth: '85%',
    lineHeight: 20,
  },
  actionSection: {flex: 1, justifyContent: 'center', marginTop: 20}, // Added top margin
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  shadow: {
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  providerIcon: {width: 22, height: 22, position: 'absolute', left: 20},
  authButtonText: {fontSize: 16, fontWeight: '700', color: '#334155'},
  dividerRow: {flexDirection: 'row', alignItems: 'center', marginVertical: 22},
  line: {flex: 1, height: 1, backgroundColor: '#F1F5F9'},
  dividerText: {
    marginHorizontal: 15,
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '800',
  },
  biometricButton: {alignItems: 'center'},
  biometricIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  biometricText: {color: '#0A66C2', fontWeight: '700', fontSize: 14},
  footer: {paddingBottom: 25, alignItems: 'center'}, // Slightly more bottom padding
  footerText: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loadingContainer: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  loadingText: {
    marginTop: 15,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
});

export default LoginScreen;
