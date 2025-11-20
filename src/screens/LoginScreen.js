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
import {getActiveConfigData, getActiveConfig} from '../Controller/secureConfig';
import styles from '../styles/styles';
import {fontScale} from '../store/utils/scaling';

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
      // Check if biometric credentials exist
      const hasCredentials = await hasPersistentBiometricCredentials();

      if (!hasCredentials) {
        setAlertMessage(
          'Biometric login is not configured.\nPlease login with Microsoft or Google first, then enable biometric in settings.',
        );
        setAlertModal(true);
        return;
      }

      // Check if there's an active configuration
      const activeConfigId = await getActiveConfig();
      if (!activeConfigId) {
        setAlertMessage(
          'No active configuration found.\nPlease select a configuration first.',
        );
        setAlertModal(true);
        global.onDialogOk = () => {
          setAlertModal(false);
          navigation.navigate('ConfigSelectionScreen');
        };
        return;
      }

      // Get the stored credentials (only email and provider)
      const credentials = await getBiometricCredentials();
      if (
        !credentials ||
        !credentials.email ||
        !credentials.isBiometricEnabled
      ) {
        setAlertMessage(
          'Biometric configuration is invalid.\nPlease login again and enable biometric in settings.',
        );
        setAlertModal(true);
        return;
      }

      // Authenticate with biometrics
      const biometricSuccess = await authenticateWithBiometrics();
      if (!biometricSuccess) {
        setAlertMessage('Authentication cancelled or failed');
        setAlertModal(true);
        return;
      }

      setLoading(true);

      // Get active configuration (fetched fresh at login time)
      const activeConfig = await getActiveConfigData();
      if (!activeConfig) {
        setAlertMessage(
          'Failed to load configuration.\nPlease check your configuration settings.',
        );
        setAlertModal(true);
        setLoading(false);
        return;
      }

      // Fetch user data fresh using the email
      await loadUserDataFromBiometric(credentials.email, credentials.provider);

      navigation.navigate('DrawerNavigator');
      setLoading(false);
    } catch (error) {
      console.error('Biometric login error:', error);
      setAlertMessage('Biometric login failed. Please try again.');
      setAlertModal(true);
      setLoading(false);
    }
  };

  const loadUserDataFromBiometric = async (email, provider) => {
    try {
      // Fetch fresh user data from API using email
      const userInfo = await fetchUserInfo(email);

      if (
        !userInfo.length ||
        !userInfo[0].EmployeeName ||
        !userInfo[0].EmployeeId ||
        userInfo[0].WorkerRecId === 0
      ) {
        throw new Error('User data not found or invalid');
      }

      const user = userInfo[0];

      // Prepare complete user data object
      const completeUserData = {
        userName: user.EmployeeName,
        employeeName: user.EmployeeName,
        employeeId: user.EmployeeId,
        WorkerRecId: user.WorkerRecId,
        email: email,
        jobId: user.JobId,
        department: user.Department,
        defaultLegalEntity: user.DefaultLegalEntity,
        PositionDescription: user.PositionDescription,
        CreatedBy: user.CreatedBy,
        CreatedDateTime: user.CreatedDateTime,
        DataAreaId: user.DataAreaId,
        IsEnrolledInPayroll: user.IsEnrolledInPayroll,
        JobDescription: user.JobDescription,
        ModifiedBy: user.ModifiedBy,
        ModifiedDateTime: user.ModifiedDateTime,
        OriginalHireDate: user.OriginalHireDate,
        Partition: user.Partition,
        Person: user.Person,
        Positionid: user.Positionid,
        RecId: user.RecId,
        isDynamicsUser: user.isDynamicsUser,
        employeeFullInfo: user,
      };

      // Set user data in Redux
      dispatch(setUserData(completeUserData));

      // Initialize legal entity
      await dispatch(initializeLegalEntity(user.DefaultLegalEntity));

      // Fetch legal entities and menu items
      const legalEntities = await fetchEmployeeLegalEntities(user.EmployeeId);
      const menus = await fetchEmployeeMenuItems(user.EmployeeId);

      dispatch(setLegalEntities(legalEntities));
      dispatch(setMenuItems(menus));

      console.log('Biometric login successful for:', email);
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
            <Icon name="qrcode" size={fontScale(25)} color="#0A66C2" />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.Login_Header}>
            <Image
              source={require('../assets/cloud.png')}
              style={styles.Login_Logo}
            />
            <Text style={styles.Login_Title}>Welcome to Dynaface</Text>
            <Text style={styles.Login_Subtitle}>
              Manage your HR services anytime, anywhere
            </Text>
          </View>

          {/* Login Buttons Container */}
          <View style={styles.Login_ButtonsContainer}>
            {/* Login Button - Microsoft */}
            <TouchableOpacity
              style={styles.Login_Button}
              onPress={() => handleProviderLogin('Azure')}
              disabled={loading}>
              <Icon
                name="windows"
                size={fontScale(20)}
                color="#0A66C2"
                style={styles.Login_Icon}
              />
              <Text style={styles.Login_ButtonText}>
                Sign in with Microsoft
              </Text>
            </TouchableOpacity>

            {/* Login Button - Google */}
            <TouchableOpacity
              style={styles.Login_Button}
              onPress={() => handleProviderLogin('Google')}
              disabled={loading}>
              <Icon
                name="google"
                size={fontScale(20)}
                color="#0A66C2"
                style={styles.Login_Icon}
              />
              <Text style={styles.Login_ButtonText}>Sign in with Google</Text>
            </TouchableOpacity>
          </View>

          {/* Biometric button */}
          <TouchableOpacity
            style={styles.Login_FingerprintButton}
            onPress={handleBiometricLogin}
            disabled={loading}>
            <MaterialCommunityIcons
              name="fingerprint"
              size={fontScale(32)}
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
