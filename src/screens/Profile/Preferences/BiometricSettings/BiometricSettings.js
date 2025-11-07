// /* eslint-disable react-native/no-inline-styles */
// /* eslint-disable curly */
// /* eslint-disable no-unused-vars */
// /* eslint-disable react-hooks/exhaustive-deps */
// import React, {useState, useEffect} from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   Switch,
//   FlatList,
//   ScrollView,
//   Animated,
// } from 'react-native';
// import {jwtDecode} from 'jwt-decode';
// import {useSelector} from 'react-redux';
// import {authorize} from 'react-native-app-auth';
// import LinearGradient from 'react-native-linear-gradient';
// import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// import {
//   checkBiometricAvailability,
//   enableBiometric,
//   disableBiometric,
//   isBiometricEnabled,
//   saveSelectedAccount,
//   getSelectedAccount,
//   getAccountsByProvider,
//   saveAccountAfterLogin,
//   clearAllAccounts,
// } from '../../../../store/utils/biometricUtils';
// import {
//   getAzureConfigurationV2,
//   getGoogleConfiguration,
// } from '../../../../Controller/configuration';

// import AlertModal from '../../../../components/Alert/AlertModal';
// import ActionPaneContainer from '../../../../components/ActionPaneContainer';
// import CustomIndicator from '../../../../components/CustomIndicator/CustomIndicator';
// import ConfirmationAlert from '../../../../components/Alert/ConfirmationAlert';

// const BiometricSettings = () => {
//   const [isLoading, setIsLoading] = useState(true);
//   const [alertModal, setAlertModal] = useState(false);
//   const [alertMessage, setAlertMessage] = useState('');
//   const [biometricAvailable, setBiometricAvailable] = useState(false);
//   const [biometricType, setBiometricType] = useState(null);
//   const [biometricEnabled, setBiometricEnabled] = useState(false);
//   const [selectedAccount, setSelectedAccount] = useState(null);
//   const [groupedAccounts, setGroupedAccounts] = useState({
//     Azure: [],
//     Google: [],
//   });
//   const [authLoading, setAuthLoading] = useState(false);
//   const [showDisableConfirm, setShowDisableConfirm] = useState(false);
//   const [showClearAccountsConfirm, setShowClearAccountsConfirm] =
//     useState(false);
//   // const [refreshing, setRefreshing] = useState(false);
//   const [refreshSpinAnim] = useState(new Animated.Value(0));

//   const {userData} = useSelector(state => state.user);

//   useEffect(() => {
//     initializeBiometricSettings();
//   }, []);

//   // Refresh animation
//   const startRefreshAnimation = () => {
//     // setRefreshing(true);
//     refreshSpinAnim.setValue(0);
//     Animated.timing(refreshSpinAnim, {
//       toValue: 1,
//       duration: 1000,
//       useNativeDriver: true,
//     }).start();
//   };

//   const stopRefreshAnimation = () => {
//     // setRefreshing(false);
//     refreshSpinAnim.setValue(0);
//   };

//   const spinInterpolate = refreshSpinAnim.interpolate({
//     inputRange: [0, 1],
//     outputRange: ['0deg', '360deg'],
//   });

//   const initializeBiometricSettings = async () => {
//     try {
//       setIsLoading(true);

//       const {available, biometryType} = await checkBiometricAvailability();
//       setBiometricAvailable(available);
//       setBiometricType(biometryType);

//       const enabled = await isBiometricEnabled();
//       setBiometricEnabled(enabled);

//       const selected = await getSelectedAccount();
//       if (selected) {
//         setSelectedAccount(selected);
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

//   const handleDisableBiometric = async () => {
//     try {
//       const success = await disableBiometric();
//       if (success) {
//         setBiometricEnabled(false);
//         setShowDisableConfirm(false);
//         showAlert(`${getBiometricDisplayName()} has been disabled`);
//       }
//     } catch (error) {
//       console.error('Error disabling biometric:', error);
//       showAlert('Failed to disable biometric authentication');
//     }
//   };

//   const handleCancelDisable = () => {
//     setShowDisableConfirm(false);
//   };

//   const handleClearAccounts = async () => {
//     try {
//       await clearAllAccounts();
//       setGroupedAccounts({Azure: [], Google: []});
//       setSelectedAccount(null);
//       setBiometricEnabled(false);
//       setShowClearAccountsConfirm(false);
//       showAlert('All accounts have been cleared successfully');
//     } catch (error) {
//       console.error('Error clearing accounts:', error);
//       showAlert('Failed to clear accounts');
//     }
//   };

//   const handleShowClearAccountsConfirm = () => {
//     const totalAccounts =
//       groupedAccounts.Azure.length + groupedAccounts.Google.length;
//     if (totalAccounts > 0) {
//       setShowClearAccountsConfirm(true);
//     } else {
//       showAlert('No accounts to clear');
//     }
//   };

//   const handleAuthLogin = async provider => {
//     setAuthLoading(true);
//     try {
//       const config =
//         provider === 'Azure'
//           ? getAzureConfigurationV2()
//           : getGoogleConfiguration();

//       const result = await authorize(config);

//       if (result) {
//         const tokenToUse =
//           provider === 'Azure' ? result.accessToken : result.idToken;
//         const decodedToken = jwtDecode(tokenToUse);

//         const userEmail =
//           provider === 'Azure' ? decodedToken.upn : decodedToken.email;
//         const displayName = decodedToken.name;

//         // Check if account already exists
//         const existingAccounts = await getAccountsByProvider();
//         const allAccounts = [
//           ...existingAccounts.Azure,
//           ...existingAccounts.Google,
//         ];
//         const accountExists = allAccounts.some(acc => acc.email === userEmail);

//         if (accountExists) {
//           showAlert(`Account already exists!\nEmail: ${userEmail}`);
//           setAuthLoading(false);
//           return;
//         }

//         await saveAccountAfterLogin(userEmail, provider, {
//           displayName: displayName,
//         });

//         const accounts = await getAccountsByProvider();
//         setGroupedAccounts(accounts);

//         const updatedAccounts = [...accounts.Azure, ...accounts.Google];
//         const newAccount = updatedAccounts.find(acc => acc.email === userEmail);

//         if (newAccount) {
//           await handleSelectAccount(newAccount);
//         }

//         showAlert(
//           `${provider} account added successfully!\nEmail: ${userEmail}`,
//         );
//       }
//     } catch (error) {
//       console.error('Authentication error:', error);
//       showAlert(`Failed to sign in with ${provider}. Please try again.`);
//     } finally {
//       setAuthLoading(false);
//     }
//   };

//   const handleToggleBiometric = async value => {
//     try {
//       if (value) {
//         if (!selectedAccount) {
//           showAlert('Please select an account first for biometric login');
//           return;
//         }

//         const success = await enableBiometric(selectedAccount);
//         if (success) {
//           setBiometricEnabled(true);
//           showAlert(
//             `${getBiometricDisplayName()} enabled for\n${
//               selectedAccount.email
//             }`,
//           );
//         }
//       } else {
//         handleShowDisableConfirm();
//       }
//     } catch (error) {
//       console.error('Error toggling biometric:', error);
//       showAlert('Failed to update biometric settings');
//     }
//   };

//   const handleSelectAccount = async account => {
//     try {
//       const success = await saveSelectedAccount(account);
//       if (success) {
//         setSelectedAccount(account);

//         if (biometricEnabled) {
//           await enableBiometric(account);
//         }

//         showAlert(`Biometric login selected account\n ${account.email}`);
//       }
//     } catch (error) {
//       console.error('Error selecting account:', error);
//       showAlert('Failed to select account');
//     }
//   };

//   const refreshAccounts = async () => {
//     try {
//       startRefreshAnimation();
//       const accounts = await getAccountsByProvider();
//       setGroupedAccounts(accounts);

//       // Simulate loading for better UX
//       setTimeout(() => {
//         stopRefreshAnimation();
//         showAlert('Accounts refreshed successfully');
//       }, 500);
//     } catch (error) {
//       console.error('Error refreshing accounts:', error);
//       stopRefreshAnimation();
//       showAlert('Failed to refresh accounts');
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
//     switch (biometricType) {
//       case 'FaceID':
//         return 'Face ID';
//       case 'TouchID':
//         return 'Touch ID';
//       case 'Fingerprint':
//         return 'Fingerprint';
//       case 'Face':
//         return 'Face Recognition';
//       default:
//         return biometricType || 'Biometric';
//     }
//   };

//   const getProviderIcon = (provider, isSelected = false) => {
//     if (provider === 'Azure') {
//       return 'microsoft';
//     } else {
//       return 'google';
//     }
//   };

//   const getProviderColor = provider => {
//     return provider === 'Azure' ? '#0078D4' : '#EA4335';
//   };

//   const renderAccountItem = ({item}) => {
//     const isSelected = selectedAccount && selectedAccount.id === item.id;

//     return (
//       <TouchableOpacity
//         style={[styles.accountItem, isSelected && styles.selectedAccountItem]}
//         onPress={() => handleSelectAccount(item)}>
//         <View
//           style={[
//             styles.accountIcon,
//             isSelected && {
//               backgroundColor: `${getProviderColor(item.provider)}15`,
//             },
//           ]}>
//           <MaterialCommunityIcons
//             name={getProviderIcon(item.provider, isSelected)}
//             size={20}
//             color={getProviderColor(item.provider)}
//           />
//         </View>
//         <View style={styles.accountInfo}>
//           <Text
//             style={[
//               styles.accountEmail,
//               isSelected && styles.selectedAccountEmail,
//             ]}>
//             {item.email}
//           </Text>
//           {item.displayName && (
//             <Text style={styles.accountName}>{item.displayName}</Text>
//           )}
//         </View>
//         {isSelected && (
//           <MaterialCommunityIcons
//             name="check-circle"
//             size={20}
//             color="#007AFF"
//           />
//         )}
//       </TouchableOpacity>
//     );
//   };

//   const renderProviderSection = (provider, accounts) => {
//     if (accounts.length === 0) return null;

//     return (
//       <View key={provider} style={styles.providerSection}>
//         <View style={styles.providerHeader}>
//           <View style={styles.providerTitleContainer}>
//             <MaterialCommunityIcons
//               name={getProviderIcon(provider)}
//               size={18}
//               color={getProviderColor(provider)}
//             />
//             <Text style={styles.providerTitle}>
//               {provider === 'Azure' ? 'Microsoft Accounts' : 'Google Accounts'}
//             </Text>
//           </View>
//           <Text style={styles.accountCount}>{accounts.length}</Text>
//         </View>
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
//         {/* <View style={styles.loadingContainer}> */}
//         <CustomIndicator />
//         {/* <Text style={styles.loadingText}>Loading settings...</Text> */}
//         {/* </View> */}
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
//         <View style={styles.unavailableContainer}>
//           <MaterialCommunityIcons
//             name="alert-circle-outline"
//             size={64}
//             color="#FF9500"
//           />
//           <Text style={styles.unavailableTitle}>Biometric Not Available</Text>
//           <Text style={styles.unavailableText}>
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
//       <View style={styles.container}>
//         <ScrollView
//           style={styles.scrollView}
//           showsVerticalScrollIndicator={false}
//           contentContainerStyle={styles.scrollContent}>
//           {/* 🌟 Modern Header */}
//           <LinearGradient
//             colors={['#0A66C2', '#0A66C2']}
//             start={{x: 0, y: 0}}
//             end={{x: 1, y: 1}}
//             style={styles.headerContainer}>
//             <View style={styles.headerContent}>
//               {/* Icon and Title Row */}
//               <View style={styles.headerTitleRow}>
//                 <View style={styles.headerIconContainer}>
//                   <MaterialCommunityIcons
//                     name={getBiometricIcon()}
//                     size={28}
//                     color="#FFFFFF"
//                   />
//                 </View>
//                 <Text style={styles.headerTitle}>Biometric Login</Text>
//               </View>

//               {/* Subtitle */}
//               <Text style={styles.headerSubtitle}>
//                 Use {getBiometricDisplayName().toLowerCase()} for faster, more
//                 secure access to your accounts
//               </Text>

//               {/* Status Badge */}
//               <View
//                 style={[
//                   styles.statusBadge,
//                   biometricEnabled
//                     ? styles.statusActive
//                     : styles.statusInactive,
//                 ]}>
//                 <MaterialCommunityIcons
//                   name={biometricEnabled ? 'shield-check' : 'shield-off'}
//                   size={14}
//                   color={biometricEnabled ? '#10B981' : '#6B7280'}
//                 />
//                 <Text
//                   style={[
//                     styles.statusText,
//                     biometricEnabled
//                       ? styles.statusTextActive
//                       : styles.statusTextInactive,
//                   ]}>
//                   {biometricEnabled
//                     ? `${getBiometricDisplayName()} Active`
//                     : `${getBiometricDisplayName()} Inactive`}
//                 </Text>
//               </View>
//             </View>
//           </LinearGradient>

//           {/* Add Account Section */}
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Add Account</Text>
//             <Text style={styles.sectionDescription}>
//               Sign in to enable biometric login for your accounts
//             </Text>

//             {authLoading ? (
//               <View style={styles.authLoading}>
//                 <CustomIndicator />
//                 <Text style={styles.authLoadingText}>Signing in...</Text>
//               </View>
//             ) : (
//               <View style={styles.authButtons}>
//                 <TouchableOpacity
//                   style={[styles.authButton, styles.microsoftButton]}
//                   onPress={() => handleAuthLogin('Azure')}>
//                   <MaterialCommunityIcons
//                     name="microsoft"
//                     size={24}
//                     color="#0078D4"
//                   />
//                   <Text style={styles.authButtonText}>Microsoft</Text>
//                 </TouchableOpacity>

//                 <TouchableOpacity
//                   style={[styles.authButton, styles.googleButton]}
//                   onPress={() => handleAuthLogin('Google')}>
//                   <MaterialCommunityIcons
//                     name="google"
//                     size={24}
//                     color="#EA4335"
//                   />
//                   <Text style={styles.authButtonText}>Google</Text>
//                 </TouchableOpacity>
//               </View>
//             )}
//           </View>

//           {/* Biometric Toggle */}
//           <View style={styles.section}>
//             <View style={styles.toggleCard}>
//               <View style={styles.toggleHeader}>
//                 <View style={styles.toggleInfo}>
//                   <Text style={styles.toggleTitle}>
//                     {getBiometricDisplayName()} Login
//                   </Text>
//                   <Text style={styles.toggleSubtitle}>
//                     {selectedAccount
//                       ? `Enabled for Email Account\n${selectedAccount.email}`
//                       : 'Select an account to enable'}
//                   </Text>
//                 </View>
//                 <Switch
//                   value={biometricEnabled}
//                   onValueChange={handleToggleBiometric}
//                   trackColor={{false: '#E5E5EA', true: '#007AFF'}}
//                   thumbColor="#FFFFFF"
//                   disabled={!selectedAccount}
//                 />
//               </View>
//             </View>
//           </View>

//           {/* Account Selection */}
//           <View style={styles.sectionAccount}>
//             <View style={styles.sectionHeader}>
//               <Text style={styles.sectionTitle}>Select Account</Text>
//               <View style={styles.headerActions}>
//                 <TouchableOpacity
//                   onPress={handleShowClearAccountsConfirm}
//                   style={styles.clearButton}>
//                   <MaterialCommunityIcons
//                     name="trash-can-outline"
//                     size={18}
//                     color="#FF3B30"
//                   />
//                   <Text style={{color: '#FF3B30'}}>Clear All</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity
//                   onPress={refreshAccounts}
//                   style={styles.refreshButton}>
//                   <Animated.View
//                     style={{transform: [{rotate: spinInterpolate}]}}>
//                     <MaterialCommunityIcons
//                       name="refresh"
//                       size={18}
//                       color="#007AFF"
//                     />
//                   </Animated.View>
//                   <Text style={{color: '#007AFF'}}>Refresh</Text>
//                 </TouchableOpacity>
//               </View>
//             </View>

//             {totalAccounts > 0 ? (
//               <View style={styles.accountsContainer}>
//                 {renderProviderSection('Azure', groupedAccounts.Azure)}
//                 {renderProviderSection('Google', groupedAccounts.Google)}
//               </View>
//             ) : (
//               <View style={styles.emptyState}>
//                 <MaterialCommunityIcons
//                   name="account-multiple-outline"
//                   size={48}
//                   color="#C7C7CC"
//                 />
//                 <Text style={styles.emptyStateText}>No accounts added</Text>
//                 <Text style={styles.emptyStateSubtext}>
//                   Sign in with Microsoft or Google to get started
//                 </Text>
//               </View>
//             )}
//           </View>

//           {/* Information Section */}
//           <View style={styles.infoSection}>
//             <View style={styles.infoItem}>
//               <MaterialCommunityIcons
//                 name="shield-check-outline"
//                 size={18}
//                 color="#007AFF"
//               />
//               <Text style={styles.infoText}>
//                 Securely stored on your device
//               </Text>
//             </View>
//             <View style={styles.infoItem}>
//               <MaterialCommunityIcons
//                 name="lightning-bolt-outline"
//                 size={18}
//                 color="#007AFF"
//               />
//               <Text style={styles.infoText}>Faster than typing passwords</Text>
//             </View>
//             <View style={styles.infoItem}>
//               <MaterialCommunityIcons
//                 name="account-outline"
//                 size={18}
//                 color="#007AFF"
//               />
//               <Text style={styles.infoText}>One account at a time</Text>
//             </View>
//           </View>
//         </ScrollView>
//       </View>

//       {/* Regular Alert Modal */}
//       <AlertModal
//         visible={alertModal}
//         heading="Alert"
//         text={alertMessage}
//         onPress={() => setAlertModal(false)}
//       />

//       {/* Disable Biometric Confirmation Modal */}
//       <ConfirmationAlert
//         visible={showDisableConfirm}
//         heading={`Disable ${getBiometricDisplayName()}`}
//         text={`Are you sure you want to disable ${getBiometricDisplayName()} authentication? You'll need to use your password to sign in.`}
//         primaryButtonText="Disable"
//         secondaryButtonText="Cancel"
//         onPrimaryPress={handleDisableBiometric}
//         onSecondaryPress={handleCancelDisable}
//         type="warning"
//       />

//       {/* Clear Accounts Confirmation Modal */}
//       <ConfirmationAlert
//         visible={showClearAccountsConfirm}
//         heading="Clear All Accounts"
//         text="Are you sure you want to remove all registered accounts? This action cannot be undone and will also disable biometric authentication."
//         primaryButtonText="Clear All"
//         secondaryButtonText="Cancel"
//         onPrimaryPress={handleClearAccounts}
//         onSecondaryPress={() => setShowClearAccountsConfirm(false)}
//         type="error"
//       />
//     </ActionPaneContainer>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#FFFFFF',
//   },
//   scrollView: {
//     flex: 1,
//   },
//   scrollContent: {
//     flexGrow: 1,
//     paddingTop: 0,
//   },
//   headerContainer: {
//     paddingTop: 30,
//     paddingBottom: 30,
//     paddingHorizontal: 24,
//     borderBottomLeftRadius: 24,
//     borderBottomRightRadius: 24,
//     elevation: 8,
//     shadowColor: '#0A66C2',
//     shadowOpacity: 0.3,
//     shadowRadius: 12,
//     shadowOffset: {width: 0, height: 6},
//     marginBottom: 8,
//   },
//   headerContent: {
//     gap: 16,
//   },
//   headerTitleRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//   },
//   headerIconContainer: {
//     width: 52,
//     height: 52,
//     borderRadius: 26,
//     backgroundColor: 'rgba(255, 255, 255, 0.2)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 1.5,
//     borderColor: 'rgba(255, 255, 255, 0.3)',
//   },
//   headerTitle: {
//     fontSize: 28,
//     fontWeight: '700',
//     color: '#FFFFFF',
//     flex: 1,
//   },
//   headerSubtitle: {
//     fontSize: 16,
//     color: '#E0E7FF',
//     lineHeight: 22,
//     marginTop: 4,
//   },
//   statusBadge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     alignSelf: 'flex-start',
//     paddingHorizontal: 14,
//     paddingVertical: 8,
//     borderRadius: 20,
//     gap: 6,
//     borderWidth: 1,
//   },
//   statusActive: {
//     backgroundColor: 'rgba(16, 185, 129, 0.15)',
//     borderColor: 'rgba(16, 185, 129, 0.3)',
//   },
//   statusInactive: {
//     backgroundColor: 'rgba(255, 255, 255, 0.15)',
//     borderColor: 'rgba(255, 255, 255, 0.3)',
//   },
//   statusText: {
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   statusTextActive: {
//     color: '#10B981',
//   },
//   statusTextInactive: {
//     color: '#E0E7FF',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#FFFFFF',
//   },
//   loadingText: {
//     marginTop: 16,
//     fontSize: 16,
//     color: '#8E8E93',
//   },
//   unavailableContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 40,
//     backgroundColor: '#FFFFFF',
//   },
//   unavailableTitle: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#1C1C1E',
//     marginTop: 24,
//     marginBottom: 8,
//   },
//   unavailableText: {
//     fontSize: 16,
//     color: '#8E8E93',
//     textAlign: 'center',
//     lineHeight: 22,
//   },
//   section: {
//     padding: 24,
//   },
//   sectionAccount: {
//     padding: 24,
//     backgroundColor: '#fafafaff',
//   },
//   sectionHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   headerActions: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   clearButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 4,
//     padding: 6,
//   },
//   refreshButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 4,
//     padding: 6,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#1C1C1E',
//     marginBottom: 4,
//   },
//   sectionDescription: {
//     fontSize: 14,
//     color: '#8E8E93',
//     marginBottom: 20,
//   },
//   authButtons: {
//     flexDirection: 'row',
//     gap: 12,
//   },
//   authButton: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 16,
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: '#E5E5EA',
//     backgroundColor: '#FFFFFF',
//     gap: 8,
//   },
//   microsoftButton: {
//     borderColor: '#0078D4',
//   },
//   googleButton: {
//     borderColor: '#EA4335',
//   },
//   authButtonText: {
//     fontSize: 16,
//     fontWeight: '500',
//     color: '#1C1C1E',
//   },
//   authLoading: {
//     alignItems: 'center',
//     padding: 20,
//   },
//   authLoadingText: {
//     marginTop: 12,
//     fontSize: 14,
//     color: '#8E8E93',
//   },
//   toggleCard: {
//     backgroundColor: '#F8F9FA',
//     borderRadius: 12,
//     padding: 16,
//   },
//   toggleHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//   },
//   toggleInfo: {
//     flex: 1,
//   },
//   toggleTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#1C1C1E',
//     marginBottom: 4,
//   },
//   toggleSubtitle: {
//     fontSize: 14,
//     color: '#8E8E93',
//   },
//   accountsContainer: {
//     gap: 20,
//   },
//   providerSection: {
//     gap: 8,
//   },
//   providerHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   providerTitleContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   providerTitle: {
//     fontSize: 16,
//     fontWeight: '500',
//     color: '#1C1C1E',
//   },
//   accountCount: {
//     fontSize: 14,
//     fontWeight: '500',
//     color: '#8E8E93',
//     backgroundColor: '#F2F2F7',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 10,
//   },
//   accountItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 16,
//     backgroundColor: '#F8F9FA',
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: 'transparent',
//   },
//   selectedAccountItem: {
//     backgroundColor: '#E3F2FD',
//     borderColor: '#007AFF',
//   },
//   accountIcon: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: '#FFFFFF',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 12,
//     borderWidth: 1,
//     borderColor: '#F2F2F7',
//   },
//   accountInfo: {
//     flex: 1,
//   },
//   accountEmail: {
//     fontSize: 16,
//     fontWeight: '500',
//     color: '#1C1C1E',
//     marginBottom: 2,
//   },
//   selectedAccountEmail: {
//     color: '#007AFF',
//     fontWeight: '600',
//   },
//   accountName: {
//     fontSize: 14,
//     color: '#8E8E93',
//   },
//   emptyState: {
//     alignItems: 'center',
//     padding: 40,
//   },
//   emptyStateText: {
//     fontSize: 16,
//     fontWeight: '500',
//     color: '#8E8E93',
//     marginTop: 16,
//     marginBottom: 8,
//   },
//   emptyStateSubtext: {
//     fontSize: 14,
//     color: '#C7C7CC',
//     textAlign: 'center',
//     lineHeight: 20,
//   },
//   infoSection: {
//     padding: 24,
//     gap: 16,
//   },
//   infoItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//   },
//   infoText: {
//     fontSize: 14,
//     color: '#8E8E93',
//   },
// });

// export default BiometricSettings;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/* eslint-disable curly */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect, useCallback} from 'react';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ScrollView,
  BackHandler,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSelector} from 'react-redux';
import {getActiveConfigData} from '../../../../Controller/secureConfig';

import {
  checkBiometricAvailability,
  enableBiometric,
  disableBiometric,
  isBiometricEnabled,
  getSelectedAccount,
  getAccountsByProvider,
  hasPersistentBiometricCredentials,
  getBiometricCredentials,
} from '../../../../store/utils/biometricUtils';

import AlertModal from '../../../../components/Alert/AlertModal';
import ActionPaneContainer from '../../../../components/ActionPaneContainer';
import CustomIndicator from '../../../../components/CustomIndicator/CustomIndicator';
import ConfirmationAlert from '../../../../components/Alert/ConfirmationAlert';

const BiometricSettings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [groupedAccounts, setGroupedAccounts] = useState({
    Azure: [],
    Google: [],
  });
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [showEnableConfirm, setShowEnableConfirm] = useState(false);

  const userData = useSelector(state => state.user.userData);
  const navigation = useNavigation();

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
    navigation.navigate('Preferences');
  };

  const initializeBiometricSettings = async () => {
    try {
      setIsLoading(true);

      const {available, biometryType} = await checkBiometricAvailability();
      setBiometricAvailable(available);
      setBiometricType(biometryType);

      // Check persistent storage first
      const hasPersistentCredentials =
        await hasPersistentBiometricCredentials();

      if (hasPersistentCredentials) {
        const credentials = await getBiometricCredentials();
        setBiometricEnabled(true);
        setSelectedAccount(credentials.account);
      } else {
        // Fallback to AsyncStorage for UI state
        const enabled = await isBiometricEnabled();
        setBiometricEnabled(enabled);

        if (enabled) {
          const selected = await getSelectedAccount();
          setSelectedAccount(selected);
        }
      }

      const accounts = await getAccountsByProvider();
      setGroupedAccounts(accounts);
    } catch (error) {
      console.error('Error initializing biometric settings:', error);
      showAlert('Failed to load biometric settings');
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
      // Check if user is logged in
      if (!userData || !userData.employeeId) {
        showAlert(
          'No active session found. Please login first to enable biometric.',
        );
        setShowEnableConfirm(false);
        return;
      }

      // Get current config data
      const sourceConfig = await getActiveConfigData();

      // No need to manually disable - enableBiometric does it automatically
      // Call enableBiometric with userData and config
      const success = await enableBiometric(
        selectedAccount,
        userData,
        sourceConfig,
      );

      if (success) {
        setBiometricEnabled(true);
        setShowEnableConfirm(false);
        showAlert(
          `${getBiometricDisplayName()} enabled for\n${selectedAccount.email}`,
        );

        // Refresh the settings to show updated state
        await initializeBiometricSettings();
      } else {
        showAlert('Failed to enable biometric authentication');
      }
    } catch (error) {
      console.error('Error enabling biometric:', error);
      showAlert('Failed to enable biometric authentication');
    }
  };

  const handleDisableBiometric = async () => {
    try {
      const success = await disableBiometric();
      if (success) {
        setBiometricEnabled(false);
        setSelectedAccount(null);
        setShowDisableConfirm(false);
        showAlert(`${getBiometricDisplayName()} has been disabled`);

        // Refresh the settings to show updated state
        await initializeBiometricSettings();
      } else {
        showAlert('Failed to disable biometric authentication');
      }
    } catch (error) {
      console.error('Error disabling biometric:', error);
      showAlert('Failed to disable biometric authentication');
    }
  };

  const handleCancelDisable = () => {
    setShowDisableConfirm(false);
  };

  const handleCancelEnable = () => {
    setShowEnableConfirm(false);
    setSelectedAccount(null);
  };

  // Removed the condition to disable first
  const handleAccountSelection = async account => {
    if (
      biometricEnabled &&
      selectedAccount &&
      selectedAccount.id === account.id
    ) {
      // If clicking on currently enabled account, show disable confirmation
      handleShowDisableConfirm();
    } else {
      // Allow direct enabling - it will auto-disable previous one
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
    switch (biometricType) {
      case 'FaceID':
        return 'Face ID';
      case 'TouchID':
        return 'Touch ID';
      case 'Fingerprint':
        return 'Fingerprint';
      case 'Face':
        return 'Face Recognition';
      default:
        return biometricType || 'Biometric';
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
      ? 'Select Account to Change/Disable Biometric'
      : 'Select Account to Enable Biometric';
  };

  const renderAccountItem = ({item}) => {
    const isSelected = selectedAccount && selectedAccount.id === item.id;
    const isEnabled = biometricEnabled && isSelected;

    // Only highlight if biometric is enabled and this is the selected account
    const shouldHighlight = isEnabled;

    return (
      <TouchableOpacity
        style={[
          styles.accountItem,
          shouldHighlight && styles.selectedAccountItem,
        ]}
        onPress={() => handleAccountSelection(item)}>
        <View
          style={[
            styles.accountIcon,
            shouldHighlight && {
              backgroundColor: `${getProviderColor(item.provider)}15`,
            },
          ]}>
          <MaterialCommunityIcons
            name={getProviderIcon(item.provider)}
            size={20}
            color={getProviderColor(item.provider)}
          />
        </View>
        <View style={styles.accountInfo}>
          <Text
            style={[
              styles.accountEmail,
              shouldHighlight && styles.selectedAccountEmail,
            ]}>
            {item.email}
          </Text>
          {item.displayName && (
            <Text style={styles.accountName}>{item.displayName}</Text>
          )}
          {isEnabled && (
            <Text style={styles.enabledBadge}>Biometric Enabled</Text>
          )}
        </View>
        {shouldHighlight && (
          <MaterialCommunityIcons
            name="check-circle"
            size={20}
            color="#007AFF"
          />
        )}
      </TouchableOpacity>
    );
  };

  const renderProviderSection = (provider, accounts) => {
    if (accounts.length === 0) return null;

    return (
      <View key={provider} style={styles.providerSection}>
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
        pageTitle="Biometric Settings"
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
        pageTitle="Biometric Settings"
        isBackButton={false}
        showFooter={false}
        showFloatingButton={false}
        isHeaderActive={true}
        showTabNavigator={true}>
        <View style={styles.unavailableContainer}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={64}
            color="#FF9500"
          />
          <Text style={styles.unavailableTitle}>Biometric Not Available</Text>
          <Text style={styles.unavailableText}>
            Your device doesn't support biometric authentication or it's not set
            up.
          </Text>
        </View>
      </ActionPaneContainer>
    );
  }

  const totalAccounts =
    groupedAccounts.Azure.length + groupedAccounts.Google.length;

  return (
    <ActionPaneContainer
      pageTitle="Biometric Settings"
      isBackButton={false}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      showTabNavigator={true}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          <LinearGradient
            colors={['#0A66C2', '#0A66C2']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.headerContainer}>
            <View style={styles.headerContent}>
              <View style={styles.headerTitleRow}>
                <View style={styles.headerIconContainer}>
                  <MaterialCommunityIcons
                    name={getBiometricIcon()}
                    size={28}
                    color="#FFFFFF"
                  />
                </View>
                <Text style={styles.headerTitle}>Biometric Login</Text>
              </View>

              <Text style={styles.headerSubtitle}>
                Use {getBiometricDisplayName().toLowerCase()} for faster, more
                secure access to your accounts
              </Text>

              <View
                style={[
                  styles.statusBadge,
                  biometricEnabled
                    ? styles.statusActive
                    : styles.statusInactive,
                ]}>
                <MaterialCommunityIcons
                  name={biometricEnabled ? 'shield-check' : 'shield-off'}
                  size={14}
                  color={biometricEnabled ? '#10B981' : '#6B7280'}
                />
                <Text
                  style={[
                    styles.statusText,
                    biometricEnabled
                      ? styles.statusTextActive
                      : styles.statusTextInactive,
                  ]}>
                  {biometricEnabled
                    ? `${getBiometricDisplayName()} Active`
                    : `${getBiometricDisplayName()} Inactive`}
                </Text>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.sectionAccount}>
            {/* Dynamic Section Title */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{getSectionTitle()}</Text>
            </View>

            {totalAccounts > 0 ? (
              <View style={styles.accountsContainer}>
                {renderProviderSection('Azure', groupedAccounts.Azure)}
                {renderProviderSection('Google', groupedAccounts.Google)}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="account-multiple-outline"
                  size={48}
                  color="#C7C7CC"
                />
                <Text style={styles.emptyStateText}>No accounts added</Text>
                <Text style={styles.emptyStateSubtext}>
                  Sign in with Microsoft or Google to get started
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      <AlertModal
        visible={alertModal}
        heading="Alert"
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />

      <ConfirmationAlert
        visible={showEnableConfirm}
        heading={`Enable ${getBiometricDisplayName()}`}
        text={`${
          biometricEnabled
            ? 'This will replace your current biometric configuration.\n\n'
            : ''
        }Enable ${getBiometricDisplayName()} authentication for\n${
          selectedAccount?.email
        }?`}
        primaryButtonText="Enable"
        secondaryButtonText="Cancel"
        onPrimaryPress={handleEnableBiometric}
        onSecondaryPress={handleCancelEnable}
        type="info"
      />

      <ConfirmationAlert
        visible={showDisableConfirm}
        heading={`Disable ${getBiometricDisplayName()}`}
        text={`Are you sure you want to disable ${getBiometricDisplayName()} authentication for\n${
          selectedAccount?.email
        }\nYou'll need to use your password to sign in.`}
        primaryButtonText="Disable"
        secondaryButtonText="Cancel"
        onPrimaryPress={handleDisableBiometric}
        onSecondaryPress={handleCancelDisable}
        type="warning"
      />
    </ActionPaneContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 0,
  },
  headerContainer: {
    paddingTop: 30,
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
    shadowColor: '#0A66C2',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 6},
    marginBottom: 8,
  },
  headerContent: {
    gap: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E0E7FF',
    lineHeight: 22,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
  },
  statusActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusTextActive: {
    color: '#10B981',
  },
  statusTextInactive: {
    color: '#E0E7FF',
  },
  unavailableContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
  },
  unavailableTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 24,
    marginBottom: 8,
  },
  unavailableText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  sectionAccount: {
    padding: 24,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  accountsContainer: {
    gap: 20,
  },
  providerSection: {
    gap: 8,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedAccountItem: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#F2F2F7',
  },
  accountInfo: {
    flex: 1,
  },
  accountEmail: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  selectedAccountEmail: {
    color: '#007AFF',
    fontWeight: '600',
  },
  accountName: {
    fontSize: 14,
    color: '#8E8E93',
  },
  enabledBadge: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#C7C7CC',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default BiometricSettings;
