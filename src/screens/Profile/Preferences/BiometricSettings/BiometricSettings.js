// /* eslint-disable curly */
// /* eslint-disable react-hooks/exhaustive-deps */
// import React, {useState, useEffect, useCallback} from 'react';
// import {useFocusEffect, useNavigation} from '@react-navigation/native';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   FlatList,
//   ScrollView,
//   BackHandler,
// } from 'react-native';
// import LinearGradient from 'react-native-linear-gradient';
// import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
// import {useSelector} from 'react-redux';
// import {getActiveConfig} from '../../../../Controller/secureConfig';

// import {
//   checkBiometricAvailability,
//   enableBiometric,
//   disableBiometric,
//   isBiometricEnabled,
//   getAccountsByProvider,
//   hasPersistentBiometricCredentials,
//   getBiometricCredentials,
// } from '../../../../store/utils/biometricUtils';

// import AlertModal from '../../../../components/Alert/AlertModal';
// import ActionPaneContainer from '../../../../components/ActionPaneContainer';
// import CustomIndicator from '../../../../components/CustomIndicator/CustomIndicator';
// import ConfirmationAlert from '../../../../components/Alert/ConfirmationAlert';
// import styles from '../../../../styles/styles';

// const BiometricSettings = () => {
//   const [isLoading, setIsLoading] = useState(true);
//   const [alertModal, setAlertModal] = useState(false);
//   const [alertMessage, setAlertMessage] = useState('');
//   const [biometricAvailable, setBiometricAvailable] = useState(false);
//   const [biometricType, setBiometricType] = useState(null);
//   const [biometricEnabled, setBiometricEnabled] = useState(false);
//   const [selectedAccount, setSelectedAccount] = useState(null);
//   const [biometricEmail, setBiometricEmail] = useState(null);
//   const [groupedAccounts, setGroupedAccounts] = useState({
//     Azure: [],
//     Google: [],
//   });
//   const [showDisableConfirm, setShowDisableConfirm] = useState(false);
//   const [showEnableConfirm, setShowEnableConfirm] = useState(false);

//   const userData = useSelector(state => state.user.userData);
//   const navigation = useNavigation();

//   useEffect(() => {
//     initializeBiometricSettings();
//   }, []);

//   useFocusEffect(
//     useCallback(() => {
//       const onBackPress = () => {
//         handleGoBack();
//         return true;
//       };

//       BackHandler.addEventListener('hardwareBackPress', onBackPress);

//       return () =>
//         BackHandler.removeEventListener('hardwareBackPress', onBackPress);
//     }, [navigation]),
//   );

//   const handleGoBack = () => {
//     navigation.navigate('Profile');
//   };

//   const initializeBiometricSettings = async () => {
//     try {
//       setIsLoading(true);

//       const {available, biometryType} = await checkBiometricAvailability();
//       setBiometricAvailable(available);
//       setBiometricType(biometryType);

//       const hasPersistentCredentials =
//         await hasPersistentBiometricCredentials();

//       if (hasPersistentCredentials) {
//         const credentials = await getBiometricCredentials();
//         setBiometricEnabled(true);
//         setBiometricEmail(credentials.email);

//         // Find matching account from accounts list
//         const accounts = await getAccountsByProvider();
//         const allAccounts = [...accounts.Azure, ...accounts.Google];
//         const matchingAccount = allAccounts.find(
//           acc => acc.email === credentials.email,
//         );
//         setSelectedAccount(matchingAccount);
//       } else {
//         const enabled = await isBiometricEnabled();
//         setBiometricEnabled(enabled);
//       }

//       const accounts = await getAccountsByProvider();
//       setGroupedAccounts(accounts);
//     } catch (error) {
//       console.error('Error initializing biometric settings:', error);
//       showAlert('Failed to load biometric settings');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const showAlert = message => {
//     setAlertMessage(message);
//     setAlertModal(true);
//   };

//   const handleShowDisableConfirm = () => {
//     setShowDisableConfirm(true);
//   };

//   const handleShowEnableConfirm = account => {
//     setSelectedAccount(account);
//     setShowEnableConfirm(true);
//   };

//   const handleEnableBiometric = async () => {
//     try {
//       if (!userData || !userData.employeeId) {
//         showAlert(
//           'No active session found. Please login first to enable biometric.',
//         );
//         setShowEnableConfirm(false);
//         return;
//       }

//       const activeConfigId = await getActiveConfig();
//       if (!activeConfigId) {
//         showAlert(
//           'No active configuration found.\nPlease select a configuration first from the Configuration screen.',
//         );
//         setShowEnableConfirm(false);
//         return;
//       }

//       // Only store email and provider
//       const success = await enableBiometric(
//         selectedAccount.email,
//         selectedAccount.provider,
//       );

//       if (success) {
//         setBiometricEnabled(true);
//         setBiometricEmail(selectedAccount.email);
//         setShowEnableConfirm(false);
//         showAlert(
//           `${getBiometricDisplayName()} enabled for\n${selectedAccount.email}`,
//         );

//         await initializeBiometricSettings();
//       } else {
//         showAlert('Failed to enable biometric authentication');
//       }
//     } catch (error) {
//       console.error('Error enabling biometric:', error);
//       showAlert('Failed to enable biometric authentication');
//     }
//   };

//   const handleDisableBiometric = async () => {
//     try {
//       const success = await disableBiometric();
//       if (success) {
//         setBiometricEnabled(false);
//         setSelectedAccount(null);
//         setBiometricEmail(null);
//         setShowDisableConfirm(false);
//         showAlert(`${getBiometricDisplayName()} has been disabled`);

//         await initializeBiometricSettings();
//       } else {
//         showAlert('Failed to disable biometric authentication');
//       }
//     } catch (error) {
//       console.error('Error disabling biometric:', error);
//       showAlert('Failed to disable biometric authentication');
//     }
//   };

//   const handleCancelDisable = () => {
//     setShowDisableConfirm(false);
//   };

//   const handleCancelEnable = () => {
//     setShowEnableConfirm(false);
//     setSelectedAccount(null);
//   };

//   const handleAccountSelection = async account => {
//     if (biometricEnabled && biometricEmail === account.email) {
//       handleShowDisableConfirm();
//     } else {
//       handleShowEnableConfirm(account);
//     }
//   };

//   const getBiometricIcon = () => {
//     switch (biometricType) {
//       case 'FaceID':
//       case 'Face':
//         return 'face-recognition';
//       case 'Fingerprint':
//       case 'TouchID':
//         return 'fingerprint';
//       default:
//         return 'shield-check';
//     }
//   };

//   const getBiometricDisplayName = () => {
//     const normalizedType =
//       biometricType === 'Biometrics' ? 'Biometric' : biometricType;

//     switch (normalizedType) {
//       case 'FaceID':
//         return 'Face ID';
//       case 'TouchID':
//         return 'Touch ID';
//       case 'Fingerprint':
//         return 'Fingerprint';
//       case 'Face':
//         return 'Face Recognition';
//       default:
//         return normalizedType || 'Biometric';
//     }
//   };

//   const getProviderIcon = provider => {
//     return provider === 'Azure' ? 'microsoft' : 'google';
//   };

//   const getProviderColor = provider => {
//     return provider === 'Azure' ? '#0078D4' : '#EA4335';
//   };

//   const getSectionTitle = () => {
//     return biometricEnabled
//       ? 'Select Account to Change/Disable Biometric'
//       : 'Select Account to Enable Biometric';
//   };

//   const renderAccountItem = ({item}) => {
//     const isEnabled = biometricEnabled && biometricEmail === item.email;
//     const shouldHighlight = isEnabled;

//     return (
//       <TouchableOpacity
//         style={[
//           styles.Biometric_accountItem,
//           shouldHighlight && styles.Biometric_selectedAccountItem,
//         ]}
//         onPress={() => handleAccountSelection(item)}>
//         <View
//           style={[
//             styles.Biometric_accountIcon,
//             shouldHighlight && {
//               backgroundColor: `${getProviderColor(item.provider)}15`,
//             },
//           ]}>
//           <MaterialCommunityIcons
//             name={getProviderIcon(item.provider)}
//             size={styles.Biometric_accountIconSize}
//             color={getProviderColor(item.provider)}
//           />
//         </View>
//         <View style={styles.Biometric_accountInfo}>
//           <Text
//             style={[
//               styles.Biometric_accountEmail,
//               shouldHighlight && styles.Biometric_selectedAccountEmail,
//             ]}>
//             {item.email}
//           </Text>
//           {item.displayName && (
//             <Text style={styles.Biometric_accountName}>{item.displayName}</Text>
//           )}
//           {isEnabled && (
//             <Text style={styles.Biometric_enabledBadge}>Biometric Enabled</Text>
//           )}
//         </View>
//         {shouldHighlight && (
//           <MaterialCommunityIcons
//             name="check-circle"
//             size={styles.Biometric_checkIconSize}
//             color="#007AFF"
//           />
//         )}
//       </TouchableOpacity>
//     );
//   };

//   const renderProviderSection = (provider, accounts) => {
//     if (accounts.length === 0) return null;

//     return (
//       <View key={provider} style={styles.Biometric_providerSection}>
//         <FlatList
//           data={accounts}
//           renderItem={renderAccountItem}
//           keyExtractor={item => item.id}
//           scrollEnabled={false}
//         />
//       </View>
//     );
//   };

//   if (isLoading) {
//     return (
//       <ActionPaneContainer
//         pageTitle="Biometric Settings"
//         isBackButton={false}
//         showFooter={false}
//         showFloatingButton={false}
//         isHeaderActive={true}
//         showTabNavigator={true}>
//         <CustomIndicator />
//       </ActionPaneContainer>
//     );
//   }

//   if (!biometricAvailable) {
//     return (
//       <ActionPaneContainer
//         pageTitle="Biometric Settings"
//         isBackButton={false}
//         showFooter={false}
//         showFloatingButton={false}
//         isHeaderActive={true}
//         showTabNavigator={true}>
//         <View style={styles.Biometric_unavailableContainer}>
//           <MaterialCommunityIcons
//             name="alert-circle-outline"
//             size={styles.Biometric_unavailableIconSize}
//             color="#FF9500"
//           />
//           <Text style={styles.Biometric_unavailableTitle}>
//             Biometric Not Available
//           </Text>
//           <Text style={styles.Biometric_unavailableText}>
//             Your device doesn't support biometric authentication or it's not set
//             up.
//           </Text>
//         </View>
//       </ActionPaneContainer>
//     );
//   }

//   const totalAccounts =
//     groupedAccounts.Azure.length + groupedAccounts.Google.length;

//   return (
//     <ActionPaneContainer
//       pageTitle="Biometric Settings"
//       isBackButton={false}
//       showFooter={false}
//       showFloatingButton={false}
//       isHeaderActive={true}
//       showTabNavigator={true}>
//       <View style={styles.Biometric_container}>
//         <ScrollView
//           style={styles.Biometric_scrollView}
//           showsVerticalScrollIndicator={false}
//           contentContainerStyle={styles.Biometric_scrollContent}>
//           <LinearGradient
//             colors={['#0A66C2', '#0A66C2']}
//             start={{x: 0, y: 0}}
//             end={{x: 1, y: 1}}
//             style={styles.Biometric_headerContainer}>
//             <View style={styles.Biometric_headerContent}>
//               <View style={styles.Biometric_headerTitleRow}>
//                 <View style={styles.Biometric_headerIconContainer}>
//                   <MaterialCommunityIcons
//                     name={getBiometricIcon()}
//                     size={styles.Biometric_headerIconSize}
//                     color="#FFFFFF"
//                   />
//                 </View>
//                 <Text style={styles.Biometric_headerTitle}>
//                   Biometric Login
//                 </Text>
//               </View>

//               <Text style={styles.Biometric_headerSubtitle}>
//                 Use {getBiometricDisplayName().toLowerCase()} for faster, more
//                 secure access to your accounts
//               </Text>

//               <View
//                 style={[
//                   styles.Biometric_statusBadge,
//                   biometricEnabled
//                     ? styles.Biometric_statusActive
//                     : styles.Biometric_statusInactive,
//                 ]}>
//                 <MaterialCommunityIcons
//                   name={biometricEnabled ? 'shield-check' : 'shield-off'}
//                   size={styles.Biometric_statusIconSize}
//                   color={biometricEnabled ? '#10B981' : '#6B7280'}
//                 />
//                 <Text
//                   style={[
//                     styles.Biometric_statusText,
//                     biometricEnabled
//                       ? styles.Biometric_statusTextActive
//                       : styles.Biometric_statusTextInactive,
//                   ]}>
//                   {biometricEnabled
//                     ? `${getBiometricDisplayName()} Active`
//                     : `${getBiometricDisplayName()} Inactive`}
//                 </Text>
//               </View>
//             </View>
//           </LinearGradient>

//           <View style={styles.Biometric_sectionAccount}>
//             <View style={styles.Biometric_sectionHeader}>
//               <Text style={styles.Biometric_sectionTitle}>
//                 {getSectionTitle()}
//               </Text>
//             </View>

//             {totalAccounts > 0 ? (
//               <View style={styles.Biometric_accountsContainer}>
//                 {renderProviderSection('Azure', groupedAccounts.Azure)}
//                 {renderProviderSection('Google', groupedAccounts.Google)}
//               </View>
//             ) : (
//               <View style={styles.Biometric_emptyState}>
//                 <MaterialCommunityIcons
//                   name="account-multiple-outline"
//                   size={styles.Biometric_emptyStateIconSize}
//                   color="#C7C7CC"
//                 />
//                 <Text style={styles.Biometric_emptyStateText}>
//                   No accounts added
//                 </Text>
//                 <Text style={styles.Biometric_emptyStateSubtext}>
//                   Sign in with Microsoft or Google to get started
//                 </Text>
//               </View>
//             )}
//           </View>
//         </ScrollView>
//       </View>

//       <AlertModal
//         visible={alertModal}
//         heading="Alert"
//         text={alertMessage}
//         onPress={() => setAlertModal(false)}
//       />

//       <ConfirmationAlert
//         visible={showEnableConfirm}
//         heading={`Enable ${getBiometricDisplayName()}`}
//         text={`${
//           biometricEnabled
//             ? 'This will replace your current biometric configuration.\n\n'
//             : ''
//         }Enable ${getBiometricDisplayName()} authentication for\n${
//           selectedAccount?.email
//         }?\n\nNote: Biometric will work with the currently active configuration.`}
//         primaryButtonText="Enable"
//         secondaryButtonText="Cancel"
//         onPrimaryPress={handleEnableBiometric}
//         onSecondaryPress={handleCancelEnable}
//         type="info"
//       />

//       <ConfirmationAlert
//         visible={showDisableConfirm}
//         heading={`Disable ${getBiometricDisplayName()}`}
//         text={`Are you sure you want to disable ${getBiometricDisplayName()} authentication for\n${biometricEmail}\nYou'll need to use your password to sign in.`}
//         primaryButtonText="Disable"
//         secondaryButtonText="Cancel"
//         onPrimaryPress={handleDisableBiometric}
//         onSecondaryPress={handleCancelDisable}
//         type="warning"
//       />
//     </ActionPaneContainer>
//   );
// };

// export default BiometricSettings;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/* eslint-disable curly */
/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect, useCallback} from 'react';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  BackHandler,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSelector} from 'react-redux';
import {getActiveConfig} from '../../../../Controller/secureConfig';
import {translate as t} from '../../../../store/utils/translate';

import {
  checkBiometricAvailability,
  enableBiometric,
  disableBiometric,
  isBiometricEnabled,
  getAccountsByProvider,
  hasPersistentBiometricCredentials,
  getBiometricCredentials,
} from '../../../../store/utils/biometricUtils';

import AlertModal from '../../../../components/Alert/AlertModal';
import ActionPaneContainer from '../../../../components/ActionPaneContainer';
import CustomIndicator from '../../../../components/CustomIndicator/CustomIndicator';
import ConfirmationAlert from '../../../../components/Alert/ConfirmationAlert';
import styles from '../../../../styles/styles';

const BiometricSettings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [biometricEmail, setBiometricEmail] = useState(null);
  const [groupedAccounts, setGroupedAccounts] = useState({
    Azure: [],
    Google: [],
  });
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [showEnableConfirm, setShowEnableConfirm] = useState(false);

  const navigation = useNavigation();
  const userData = useSelector(state => state.user.userData);
  const currentLanguage = useSelector(state => state.language.currentLanguage);

  useEffect(() => {
    initializeBiometricSettings();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleGoBack();
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [navigation]),
  );

  const handleGoBack = () => {
    navigation.navigate('Profile');
  };

  const initializeBiometricSettings = async () => {
    try {
      setIsLoading(true);

      const {available, biometryType} = await checkBiometricAvailability();
      setBiometricAvailable(available);
      setBiometricType(biometryType);

      const hasPersistentCredentials =
        await hasPersistentBiometricCredentials();

      if (hasPersistentCredentials) {
        const credentials = await getBiometricCredentials();
        setBiometricEnabled(true);
        setBiometricEmail(credentials.email);

        // Find matching account from accounts list
        const accounts = await getAccountsByProvider();
        const allAccounts = [...accounts.Azure, ...accounts.Google];
        const matchingAccount = allAccounts.find(
          acc => acc.email === credentials.email,
        );
        setSelectedAccount(matchingAccount);
      } else {
        const enabled = await isBiometricEnabled();
        setBiometricEnabled(enabled);
      }

      const accounts = await getAccountsByProvider();
      setGroupedAccounts(accounts);
    } catch (error) {
      console.error('Error initializing biometric settings:', error);
      showAlert(t('biometricSettings.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const showAlert = message => {
    setAlertMessage(message);
    setAlertModal(true);
  };

  const handleShowDisableConfirm = () => {
    setShowDisableConfirm(true);
  };

  const handleShowEnableConfirm = account => {
    setSelectedAccount(account);
    setShowEnableConfirm(true);
  };

  const handleEnableBiometric = async () => {
    try {
      if (!userData || !userData.employeeId) {
        showAlert(t('biometricSettings.noSessionFound'));
        setShowEnableConfirm(false);
        return;
      }

      const activeConfigId = await getActiveConfig();
      if (!activeConfigId) {
        showAlert(t('biometricSettings.noActiveConfig'));
        setShowEnableConfirm(false);
        return;
      }

      // Only store email and provider
      const success = await enableBiometric(
        selectedAccount.email,
        selectedAccount.provider,
      );

      if (success) {
        setBiometricEnabled(true);
        setBiometricEmail(selectedAccount.email);
        setShowEnableConfirm(false);
        showAlert(
          `${getBiometricDisplayName()} ${t('biometricSettings.enabledFor')}\n${
            selectedAccount.email
          }`,
        );

        await initializeBiometricSettings();
      } else {
        showAlert(t('biometricSettings.enableFailed'));
      }
    } catch (error) {
      console.error('Error enabling biometric:', error);
      showAlert(t('biometricSettings.enableFailed'));
    }
  };

  const handleDisableBiometric = async () => {
    try {
      const success = await disableBiometric();
      if (success) {
        setBiometricEnabled(false);
        setSelectedAccount(null);
        setBiometricEmail(null);
        setShowDisableConfirm(false);
        showAlert(
          `${getBiometricDisplayName()} ${t(
            'biometricSettings.hasBeenDisabled',
          )}`,
        );

        await initializeBiometricSettings();
      } else {
        showAlert(t('biometricSettings.disableFailed'));
      }
    } catch (error) {
      console.error('Error disabling biometric:', error);
      showAlert(t('biometricSettings.disableFailed'));
    }
  };

  const handleCancelDisable = () => {
    setShowDisableConfirm(false);
  };

  const handleCancelEnable = () => {
    setShowEnableConfirm(false);
    setSelectedAccount(null);
  };

  const handleAccountSelection = async account => {
    if (biometricEnabled && biometricEmail === account.email) {
      handleShowDisableConfirm();
    } else {
      handleShowEnableConfirm(account);
    }
  };

  const getBiometricIcon = () => {
    switch (biometricType) {
      case 'FaceID':
      case 'Face':
        return 'face-recognition';
      case 'Fingerprint':
      case 'TouchID':
        return 'fingerprint';
      default:
        return 'shield-check';
    }
  };

  const getBiometricDisplayName = () => {
    const normalizedType =
      biometricType === 'Biometrics' ? 'Biometric' : biometricType;

    switch (normalizedType) {
      case 'FaceID':
        return 'Face ID';
      case 'TouchID':
        return 'Touch ID';
      case 'Fingerprint':
        return 'Fingerprint';
      case 'Face':
        return 'Face Recognition';
      default:
        return normalizedType || 'Biometric';
    }
  };

  const getProviderIcon = provider => {
    return provider === 'Azure' ? 'microsoft' : 'google';
  };

  const getProviderColor = provider => {
    return provider === 'Azure' ? '#0078D4' : '#EA4335';
  };

  const getSectionTitle = () => {
    return biometricEnabled
      ? t('biometricSettings.selectAccountToChange')
      : t('biometricSettings.selectAccountToEnable');
  };

  const renderAccountItem = ({item}) => {
    const isEnabled = biometricEnabled && biometricEmail === item.email;
    const shouldHighlight = isEnabled;

    return (
      <TouchableOpacity
        style={[
          styles.Biometric_accountItem,
          shouldHighlight && styles.Biometric_selectedAccountItem,
        ]}
        onPress={() => handleAccountSelection(item)}>
        <View
          style={[
            styles.Biometric_accountIcon,
            shouldHighlight && {
              backgroundColor: `${getProviderColor(item.provider)}15`,
            },
          ]}>
          <MaterialCommunityIcons
            name={getProviderIcon(item.provider)}
            size={styles.Biometric_accountIconSize}
            color={getProviderColor(item.provider)}
          />
        </View>
        <View style={styles.Biometric_accountInfo}>
          <Text
            style={[
              styles.Biometric_accountEmail,
              shouldHighlight && styles.Biometric_selectedAccountEmail,
            ]}>
            {item.email}
          </Text>
          {item.displayName && (
            <Text style={styles.Biometric_accountName}>{item.displayName}</Text>
          )}
          {isEnabled && (
            <Text style={styles.Biometric_enabledBadge}>
              {t('biometricSettings.biometricEnabled')}
            </Text>
          )}
        </View>
        {shouldHighlight && (
          <MaterialCommunityIcons
            name="check-circle"
            size={styles.Biometric_checkIconSize}
            color="#007AFF"
          />
        )}
      </TouchableOpacity>
    );
  };

  const renderProviderSection = (provider, accounts) => {
    if (accounts.length === 0) return null;

    return (
      <View key={provider} style={styles.Biometric_providerSection}>
        <FlatList
          data={accounts}
          renderItem={renderAccountItem}
          keyExtractor={item => item.id}
          scrollEnabled={false}
        />
      </View>
    );
  };

  if (isLoading) {
    return (
      <ActionPaneContainer
        pageTitle={t('biometricSettings.pageTitle')}
        isBackButton={false}
        showFooter={false}
        showFloatingButton={false}
        isHeaderActive={true}
        showTabNavigator={true}>
        <CustomIndicator />
      </ActionPaneContainer>
    );
  }

  if (!biometricAvailable) {
    return (
      <ActionPaneContainer
        pageTitle={t('biometricSettings.pageTitle')}
        isBackButton={false}
        showFooter={false}
        showFloatingButton={false}
        isHeaderActive={true}
        showTabNavigator={true}>
        <View style={styles.Biometric_unavailableContainer}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={styles.Biometric_unavailableIconSize}
            color="#FF9500"
          />
          <Text style={styles.Biometric_unavailableTitle}>
            {t('biometricSettings.notAvailable')}
          </Text>
          <Text style={styles.Biometric_unavailableText}>
            {t('biometricSettings.notAvailableMessage')}
          </Text>
        </View>
      </ActionPaneContainer>
    );
  }

  const totalAccounts =
    groupedAccounts.Azure.length + groupedAccounts.Google.length;

  return (
    <ActionPaneContainer
      pageTitle={t('biometricSettings.pageTitle')}
      isBackButton={false}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      showTabNavigator={true}>
      <View style={styles.Biometric_container}>
        <ScrollView
          style={styles.Biometric_scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.Biometric_scrollContent}>
          <LinearGradient
            colors={['#0A66C2', '#0A66C2']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.Biometric_headerContainer}>
            <View style={styles.Biometric_headerContent}>
              <View style={styles.Biometric_headerTitleRow}>
                <View style={styles.Biometric_headerIconContainer}>
                  <MaterialCommunityIcons
                    name={getBiometricIcon()}
                    size={styles.Biometric_headerIconSize}
                    color="#FFFFFF"
                  />
                </View>
                <Text style={styles.Biometric_headerTitle}>
                  {t('biometricSettings.biometricLogin')}
                </Text>
              </View>

              <Text style={styles.Biometric_headerSubtitle}>
                {t('biometricSettings.headerSubtitle', {
                  biometricType: getBiometricDisplayName().toLowerCase(),
                })}
              </Text>

              <View
                style={[
                  styles.Biometric_statusBadge,
                  biometricEnabled
                    ? styles.Biometric_statusActive
                    : styles.Biometric_statusInactive,
                ]}>
                <MaterialCommunityIcons
                  name={biometricEnabled ? 'shield-check' : 'shield-off'}
                  size={styles.Biometric_statusIconSize}
                  color={biometricEnabled ? '#10B981' : '#6B7280'}
                />
                <Text
                  style={[
                    styles.Biometric_statusText,
                    biometricEnabled
                      ? styles.Biometric_statusTextActive
                      : styles.Biometric_statusTextInactive,
                  ]}>
                  {biometricEnabled
                    ? `${getBiometricDisplayName()} ${t(
                        'biometricSettings.active',
                      )}`
                    : `${getBiometricDisplayName()} ${t(
                        'biometricSettings.inactive',
                      )}`}
                </Text>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.Biometric_sectionAccount}>
            <View style={styles.Biometric_sectionHeader}>
              <Text style={styles.Biometric_sectionTitle}>
                {getSectionTitle()}
              </Text>
            </View>

            {totalAccounts > 0 ? (
              <View style={styles.Biometric_accountsContainer}>
                {renderProviderSection('Azure', groupedAccounts.Azure)}
                {renderProviderSection('Google', groupedAccounts.Google)}
              </View>
            ) : (
              <View style={styles.Biometric_emptyState}>
                <MaterialCommunityIcons
                  name="account-multiple-outline"
                  size={styles.Biometric_emptyStateIconSize}
                  color="#C7C7CC"
                />
                <Text style={styles.Biometric_emptyStateText}>
                  {t('biometricSettings.noAccountsAdded')}
                </Text>
                <Text style={styles.Biometric_emptyStateSubtext}>
                  {t('biometricSettings.signInToStart')}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      <AlertModal
        visible={alertModal}
        heading={t('common.alert')}
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />

      <ConfirmationAlert
        visible={showEnableConfirm}
        heading={`${t(
          'biometricSettings.enable',
        )} ${getBiometricDisplayName()}`}
        text={`${
          biometricEnabled
            ? `${t('biometricSettings.replaceCurrentConfig')}\n\n`
            : ''
        }${t('biometricSettings.enableAuthFor')}\n${
          selectedAccount?.email
        }?\n\n${t('biometricSettings.noteActiveConfig')}`}
        primaryButtonText={t('biometricSettings.enable')}
        secondaryButtonText={t('common.cancel')}
        onPrimaryPress={handleEnableBiometric}
        onSecondaryPress={handleCancelEnable}
        type="info"
      />

      <ConfirmationAlert
        visible={showDisableConfirm}
        heading={`${t(
          'biometricSettings.disable',
        )} ${getBiometricDisplayName()}`}
        text={`${t('biometricSettings.disableConfirmMessage', {
          biometricType: getBiometricDisplayName(),
          email: biometricEmail,
        })}`}
        primaryButtonText={t('biometricSettings.disable')}
        secondaryButtonText={t('common.cancel')}
        onPrimaryPress={handleDisableBiometric}
        onSecondaryPress={handleCancelDisable}
        type="warning"
      />
    </ActionPaneContainer>
  );
};

export default BiometricSettings;
