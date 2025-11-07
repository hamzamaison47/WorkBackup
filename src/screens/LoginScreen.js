/* eslint-disable react-native/no-inline-styles */
import React, {useState} from 'react';
import {View, Text, TouchableOpacity, Image} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import PopupDialog from 'react-native-popup-dialog';
import {useDispatch} from 'react-redux';

import CustomIndicator from '../components/CustomIndicator/CustomIndicator';
import AlertModal from '../components/Alert/AlertModal';
import {handleLogin} from '../Controller/authUtils';
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
} from '../Controller/authUtils';
import styles from '../styles/styles';

const LoginScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const handleProviderLogin = async provider => {
    try {
      handleLogin(
        setLoading,
        data => dispatch(setUserData(data)),
        navigation,
        setDialogVisible,
        setDialogMessage,
        setAlertModal,
        setAlertMessage,
        legalEntity => dispatch(initializeLegalEntity(legalEntity)),
        list => dispatch(setLegalEntities(list)),
        menus => dispatch(setMenuItems(menus)),
        provider,
      );
    } catch (error) {
      console.error('Error in handleProviderLogin:', error);
      setAlertMessage('Login error. Please try again.');
      setAlertModal(true);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const hasCredentials = await hasPersistentBiometricCredentials();

      if (!hasCredentials) {
        setAlertMessage(
          'Biometric login is not configured.\nPlease login with Microsoft or Google first, then enable biometric in settings.',
        );
        setAlertModal(true);
        return;
      }

      const credentials = await getBiometricCredentials();
      if (
        !credentials ||
        !credentials.userData ||
        !credentials.isBiometricEnabled
      ) {
        setAlertMessage(
          'Biometric configuration is invalid.\nPlease login again and enable biometric in settings.',
        );
        setAlertModal(true);
        return;
      }

      const biometricSuccess = await authenticateWithBiometrics();
      if (!biometricSuccess) {
        setAlertMessage('Authentication cancelled or failed');
        setAlertModal(true);
        setLoading(false);
        return;
      }

      setLoading(true);

      await loadUserDataFromBiometric(credentials);

      navigation.navigate('DrawerNavigator');
      setLoading(false);
    } catch (error) {
      console.error('Biometric login error:', error);
      setAlertMessage('Biometric login failed. Please try again.');
      setAlertModal(true);
      setLoading(false);
    }
  };

  const loadUserDataFromBiometric = async credentials => {
    try {
      const {userData, account} = credentials;

      dispatch(setUserData(userData));

      await dispatch(initializeLegalEntity(userData.defaultLegalEntity));

      const legalEntities = await fetchEmployeeLegalEntities(
        userData.employeeId,
      );
      const menus = await fetchEmployeeMenuItems(userData.employeeId);

      dispatch(setLegalEntities(legalEntities));
      dispatch(setMenuItems(menus));

      console.log('Biometric login successful for:', account.email);
      return true;
    } catch (error) {
      console.error('Error loading user data from biometric:', error);
      throw error;
    }
  };

  return (
    <LinearGradient
      colors={['#FFFFFF', '#ffffffff']}
      style={styles.Login_Container}>
      {!loading && (
        <>
          {/* QR Code Setup Button - Top Right */}
          <TouchableOpacity
            style={styles.Login_QRButton}
            onPress={() => navigation.navigate('ConfigSelectionScreen')}>
            <Icon name="qrcode" size={24} color="#0A66C2" />
          </TouchableOpacity>

          {/* Header */}
          <Image
            source={require('../assets/cloud.png')}
            style={styles.Login_Logo}
          />
          <Text style={styles.Login_Title}>Welcome to Dynaface</Text>
          <Text style={styles.Login_Subtitle}>
            Manage your HR services anytime, anywhere
          </Text>

          {/* Login Button - Microsoft */}
          <TouchableOpacity
            style={styles.Login_Button}
            onPress={() => handleProviderLogin('Azure')}
            disabled={loading}>
            <Icon
              name="windows"
              size={24}
              color="#0A66C2"
              style={styles.Login_Icon}
            />
            <Text style={styles.Login_ButtonText}>Sign in with Microsoft</Text>
          </TouchableOpacity>

          {/* Login Button - Google */}
          <TouchableOpacity
            style={styles.Login_Button}
            onPress={() => handleProviderLogin('Google')}
            disabled={loading}>
            <Icon
              name="google"
              size={24}
              color="#0A66C2"
              style={styles.Login_Icon}
            />
            <Text style={styles.Login_ButtonText}>Sign in with Google</Text>
          </TouchableOpacity>

          {/* Biometric button */}
          <TouchableOpacity
            style={styles.Login_FingerprintButton}
            onPress={handleBiometricLogin}
            disabled={loading}>
            <MaterialCommunityIcons
              name="fingerprint"
              size={24}
              color="#0A66C2"
            />
          </TouchableOpacity>
        </>
      )}

      {loading && (
        <View style={styles.Login_LoadingContainer}>
          <CustomIndicator />
          <Text style={styles.Login_LoadingText}>
            Connecting to your account, Please wait...
          </Text>
        </View>
      )}

      <PopupDialog
        visible={dialogVisible}
        onTouchOutside={() => setDialogVisible(false)}
        dialogStyle={styles.Login_DialogContainer}
        width={0.8}
        height={0.3}
        dialogTitle={
          <Text style={styles.Login_DialogTitle}>Notification</Text>
        }>
        <Text style={styles.Login_DialogMessage}>{dialogMessage}</Text>

        <View style={styles.Login_DialogButtonsRow}>
          <TouchableOpacity
            style={[styles.Login_DialogButton, {backgroundColor: '#999'}]}
            onPress={() => setDialogVisible(false)}>
            <Text style={styles.Login_DialogButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.Login_DialogButton, {backgroundColor: '#0A66C2'}]}
            onPress={() => {
              setDialogVisible(false);
              if (global.onDialogOk) {
                global.onDialogOk();
                global.onDialogOk = null;
              }
            }}>
            <Text style={styles.Login_DialogButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </PopupDialog>

      <AlertModal
        visible={alertModal}
        heading="Alert"
        text={alertMessage}
        onPress={() => {
          setAlertModal(false);
          if (global.onDialogOk) {
            global.onDialogOk();
            global.onDialogOk = null;
          }
        }}
      />
    </LinearGradient>
  );
};

export default LoginScreen;
