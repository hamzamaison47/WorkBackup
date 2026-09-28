/* eslint-disable curly */
/* eslint-disable no-unused-vars */
/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useState, useCallback, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Image,
  BackHandler,
  ToastAndroid,
  Platform,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import PopupDialog from 'react-native-popup-dialog';
import {useDispatch, useSelector} from 'react-redux';
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
  LOGIN_ERROR,
  loginError,
  describeLoginError,
  describeMissingEmployeeFields,
} from '../Controller/authErrors';
import {
  getActiveConfigData,
  getActiveConfig,
  saveConfig,
} from '../Controller/secureConfig';
import {
  CONFIG_UNLOCK_TAP_COUNT,
  verifyConfigPin,
  isConfigAccessUnlocked,
  unlockConfigAccess,
  lockConfigAccess,
} from '../Controller/Configaccess ';
import {iconSize} from '../store/utils/scaling';
import brand from '../theme/brand';
import {AppTokens} from '../components/AppComponentsDesign/Tokens';

const {width} = Dimensions.get('window');

// Shown on devices where the QR screen is hidden and no environment exists yet
const NOT_CONFIGURED_MESSAGE =
  'Setup Required\nThis device is not set up for IDAP360 yet.\nPlease contact your IT administrator.';

const TAP_RESET_MS = 1500; // taps must be closer together than this
const MAX_PIN_ATTEMPTS = 5;
const PIN_LOCKOUT_MS = 30000;

// ─────────────────────────────────────────────
// Attendance Login Modal — shown while logging in
// for the attendance shortcut flow
// ─────────────────────────────────────────────
const AttendanceLoginModal = ({visible}) => {
  if (!visible) return null;
  return (
    <View style={AL.overlay}>
      <View style={AL.card}>
        <ActivityIndicator
          size="large"
          color={brand.primaryStrong}
          style={{marginBottom: 12}}
        />
        <Text style={AL.title}>Attendance Login</Text>
        <Text style={AL.sub}>
          Signing in with Microsoft.{'\n'}Please complete authentication…
        </Text>
      </View>
    </View>
  );
};

const AL = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  card: {
    backgroundColor: brand.surface,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    width: 260,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: brand.divider,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: brand.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  sub: {
    fontSize: 12,
    color: brand.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});

// ─────────────────────────────────────────────
// Config Access PIN Modal — hidden admin unlock
// ─────────────────────────────────────────────
const ConfigPinModal = ({
  visible,
  value,
  error,
  onChangeText,
  onSubmit,
  onCancel,
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onCancel}>
    <KeyboardAvoidingView
      style={PIN.overlay}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={PIN.card}>
        <View style={PIN.iconCircle}>
          <MaterialCommunityIcons
            name="shield-key-outline"
            size={26}
            color={brand.primaryStrong}
          />
        </View>
        <Text style={PIN.title}>Enter admin PIN</Text>
        <Text style={PIN.sub}>
          Unlocks environment setup on this device only.
        </Text>

        <TextInput
          value={value}
          onChangeText={text => onChangeText(text.replace(/[^0-9]/g, ''))}
          onSubmitEditing={onSubmit}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={4}
          autoFocus
          style={[PIN.input, !!error && PIN.inputError]}
          placeholder="••••"
          placeholderTextColor={AppTokens.chevronColor}
          textAlign="center"
        />
        <Text style={PIN.error}>{error || ' '}</Text>

        <View style={PIN.buttonRow}>
          <TouchableOpacity
            style={[PIN.button, PIN.cancelButton]}
            onPress={onCancel}>
            <Text style={PIN.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              PIN.button,
              PIN.unlockButton,
              value.length < 4 && {opacity: 0.5},
            ]}
            onPress={onSubmit}
            disabled={value.length < 4}>
            <Text style={PIN.unlockText}>Unlock</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  </Modal>
);

const PIN = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: brand.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: brand.divider,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: brand.tint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {fontSize: 17, fontWeight: '700', color: brand.text},
  sub: {
    fontSize: 12,
    color: brand.secondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 18,
  },
  input: {
    width: 160,
    borderWidth: 1.5,
    borderColor: brand.divider,
    borderRadius: 12,
    paddingVertical: 10,
    fontSize: 22,
    letterSpacing: 10,
    color: brand.text,
    backgroundColor: brand.surfaceAlt,
  },
  inputError: {borderColor: '#DC2626'},
  error: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 8,
    textAlign: 'center',
    minHeight: 16,
  },
  buttonRow: {flexDirection: 'row', gap: 10, marginTop: 14, width: '100%'},
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: brand.surfaceAlt,
    borderWidth: 1,
    borderColor: brand.divider,
  },
  unlockButton: {backgroundColor: brand.primary},
  cancelText: {fontWeight: '600', color: brand.secondary, fontSize: 14},
  unlockText: {fontWeight: '700', color: brand.onPrimary, fontSize: 14},
});

// ─────────────────────────────────────────────
// Main Login Screen
// ─────────────────────────────────────────────
const LoginScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const currentLanguage = useSelector(state => state.language.currentLanguage);

  const [loading, setLoading] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [backPressedOnce, setBackPressedOnce] = useState(false);
  const [onAlertConfirm, setOnAlertConfirm] = useState(null);
  const [onDialogConfirm, setOnDialogConfirm] = useState(null);

  // ── Hidden config access (QR screen) ──────────────────────
  const [configAccess, setConfigAccess] = useState(false);
  const configAccessRef = useRef(false); // readable inside the auto-login effect
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const [pinError, setPinError] = useState('');
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef(null);
  const failedAttemptsRef = useRef(0);
  const lockoutUntilRef = useRef(0);

  const applyConfigAccess = useCallback(value => {
    configAccessRef.current = value;
    setConfigAccess(value);
  }, []);

  useEffect(() => {
    let active = true;
    isConfigAccessUnlocked().then(value => {
      if (active) applyConfigAccess(value);
    });
    return () => {
      active = false;
      clearTimeout(tapTimerRef.current);
    };
  }, [applyConfigAccess]);

  const notify = useCallback(message => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      setAlertMessage(message);
      setAlertModal(true);
    }
  }, []);

  // Missing/broken config: unlocked devices get routed to the QR screen,
  // everyone else is told to contact their administrator.
  const showConfigRequired = useCallback(
    unlockedMessage => {
      if (configAccessRef.current) {
        setAlertMessage(unlockedMessage);
        setOnAlertConfirm(
          () => () => navigation.navigate('ConfigSelectionScreen'),
        );
      } else {
        setAlertMessage(NOT_CONFIGURED_MESSAGE);
        setOnAlertConfirm(null);
      }
      setAlertModal(true);
    },
    [navigation],
  );

  const handleLogoTap = () => {
    tapCountRef.current += 1;
    clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, TAP_RESET_MS);

    if (tapCountRef.current < CONFIG_UNLOCK_TAP_COUNT) return;

    tapCountRef.current = 0;
    clearTimeout(tapTimerRef.current);

    if (configAccessRef.current) {
      notify('Environment setup is already enabled on this device');
      return;
    }
    setPinValue('');
    setPinError('');
    setPinModalVisible(true);
  };

  const handlePinSubmit = async () => {
    const remainingMs = lockoutUntilRef.current - Date.now();
    if (remainingMs > 0) {
      setPinError(
        `Too many attempts. Try again in ${Math.ceil(remainingMs / 1000)}s.`,
      );
      setPinValue('');
      return;
    }

    if (!verifyConfigPin(pinValue)) {
      failedAttemptsRef.current += 1;
      if (failedAttemptsRef.current >= MAX_PIN_ATTEMPTS) {
        failedAttemptsRef.current = 0;
        lockoutUntilRef.current = Date.now() + PIN_LOCKOUT_MS;
        setPinError('Too many incorrect attempts. Try again in 30s.');
      } else {
        setPinError('Incorrect PIN');
      }
      setPinValue('');
      return;
    }

    try {
      await unlockConfigAccess();
    } catch (error) {
      console.error('Config unlock save failed:', error);
      setPinError('Could not save. Try again.');
      return;
    }

    failedAttemptsRef.current = 0;
    applyConfigAccess(true);
    setPinModalVisible(false);
    setPinValue('');
    setPinError('');
    notify('Environment setup enabled on this device');
  };

  const handlePinCancel = () => {
    setPinModalVisible(false);
    setPinValue('');
    setPinError('');
  };

  // Long-press the QR icon to hide it again on this device
  const handleLockConfigAccess = async () => {
    await lockConfigAccess();
    applyConfigAccess(false);
    notify('Environment setup hidden on this device');
  };

  // ── Load user data (biometric path) ───────────────────────
  // Errors propagate as-is; both callers run them through describeLoginError()
  // so the user sees the specific cause rather than a catch-all message.
  const loadUserDataFromBiometric = useCallback(
    async (email, provider) => {
      console.log(`Loading user data for: ${email} (${provider})`);

      // fetchUserInfo() now throws the real cause (network, auth, server,
      // config) instead of returning [], so an empty result here means the
      // saved biometric account genuinely has no Dynamics record anymore.
      const userInfo = await fetchUserInfo(email);

      if (!userInfo || !Array.isArray(userInfo) || userInfo.length === 0) {
        throw loginError(LOGIN_ERROR.BIOMETRIC_STALE, email);
      }

      const user = userInfo[0];

      if (!user.EmployeeName || !user.EmployeeId || user.WorkerRecId === 0) {
        throw loginError(
          LOGIN_ERROR.INCOMPLETE_PROFILE,
          describeMissingEmployeeFields(user),
        );
      }

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

      dispatch(setUserData(completeUserData));
      await dispatch(initializeLegalEntity(user.DefaultLegalEntity));

      // console.log(`Fetching legal entities for employee: ${user.EmployeeId}`);
      const legalEntities = await fetchEmployeeLegalEntities(user.EmployeeId);

      // console.log(`Fetching menu items for person: ${user.Person}`);
      const menus = await fetchEmployeeMenuItems(user.Person);
      // console.log(`Fetching menus for person: ${menus}`);

      dispatch(setLegalEntities(legalEntities));
      dispatch(setMenuItems(menus));

      // Brand colour is a compile-time constant (src/theme/brand.js); the
      // D365 palette fetch that used to run here is intentionally not called.
      // See src/Controller/authUtils.js for the same note on the normal path.

      console.log('Biometric login successful for:', email);
      return true;
    },
    [dispatch],
  );

  // ── Auto biometric login on mount ─────────────────────────
  useEffect(() => {
    let cancelled = false;

    const tryAutoBiometricLogin = async () => {
      if (!navigation.isFocused()) return;

      try {
        const hasCredentials = await hasPersistentBiometricCredentials();
        if (cancelled || !hasCredentials) return;

        const activeConfigId = await getActiveConfig();
        if (cancelled || !activeConfigId) {
          console.log('Auto-login: No active config found');
          return;
        }

        const activeConfig = await getActiveConfigData();
        if (cancelled || !activeConfig) {
          console.error(
            'Auto-login: Active config ID exists but data not found',
          );
          if (!cancelled) {
            setAlertMessage(
              configAccessRef.current
                ? 'Configuration Error\nYour saved configuration could not be loaded. Please select a valid configuration from the QR code screen.'
                : NOT_CONFIGURED_MESSAGE,
            );
            setAlertModal(true);
          }
          return;
        }

        await saveConfig(activeConfig);
        if (cancelled) return;

        const biometricSuccess = await authenticateWithBiometrics();
        if (cancelled || !biometricSuccess) {
          console.log(
            'Auto-login: Biometric authentication failed or cancelled',
          );
          return;
        }

        if (!cancelled) setLoading(true);

        const credentials = await getBiometricCredentials();
        if (cancelled) return;

        await loadUserDataFromBiometric(
          credentials.email,
          credentials.provider,
        );

        if (cancelled) return;

        // navigation.navigate('AttendanceManagement', {
        //   initialScreen: 'TimeClock',
        //   fromLogin: true,
        // });
        navigation.navigate('DrawerNavigator');
      } catch (error) {
        if (cancelled) return;
        console.error('Auto-login error:', error);

        const {kind, message} = describeLoginError(error);

        // The user dismissing the biometric prompt is not a failure
        if (kind === LOGIN_ERROR.CANCELLED) return;

        setAlertMessage(`${message}\n\nYou can also sign in manually.`);
        setAlertModal(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    tryAutoBiometricLogin();

    return () => {
      cancelled = true;
    };
  }, [navigation, loadUserDataFromBiometric]);

  // ── Hardware back handler ──────────────────────────────────
  useEffect(() => {
    const backAction = () => {
      if (navigation.isFocused()) {
        if (!backPressedOnce) {
          if (Platform.OS === 'android') {
            ToastAndroid.show(t('login.pressAgainToExit'), ToastAndroid.SHORT);
          } else {
            setAlertMessage(t('login.pressAgainToExit'));
            setAlertModal(true);
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

  // ── Standard provider login ────────────────────────────────
  const handleProviderLogin = async provider => {
    try {
      const activeConfig = await getActiveConfigData();
      if (!activeConfig) {
        showConfigRequired(
          'Configuration Required\nNo configuration found. Please scan a QR code first to set up your environment.',
        );
        return;
      }

      handleLogin(
        setLoading,
        data => dispatch(setUserData(data)),
        navigation,
        setDialogVisible,
        setDialogMessage,
        setAlertModal,
        // handleLogin already classifies the failure via describeLoginError(),
        // so the message arrives final — no keyword sniffing or re-wrapping.
        setAlertMessage,
        legalEntity => dispatch(initializeLegalEntity(legalEntity)),
        list => dispatch(setLegalEntities(list)),
        menus => dispatch(setMenuItems(menus)),
        provider,
        setOnAlertConfirm,
        setOnDialogConfirm,
      );
    } catch (error) {
      console.error('Error in handleProviderLogin:', error);

      const {kind, message} = describeLoginError(error);
      if (kind === LOGIN_ERROR.CANCELLED) return;

      setAlertMessage(message);
      setAlertModal(true);
    }
  };

  // ── Biometric login ────────────────────────────────────────
  const handleBiometricLogin = async () => {
    try {
      const hasCredentials = await hasPersistentBiometricCredentials();
      if (!hasCredentials) {
        setAlertMessage(
          'Biometric login is not set up for any account.\nPlease:\n1. Login with Microsoft or Google\n2. Go to Profile > Biometric Settings\n3. Enable biometric authentication',
        );
        setAlertModal(true);
        return;
      }

      const activeConfigId = await getActiveConfig();
      if (!activeConfigId) {
        showConfigRequired(
          'Configuration Required\nNo active configuration found.\nPlease select a configuration from the QR code screen before using biometric login.',
        );
        return;
      }

      const credentials = await getBiometricCredentials();
      if (!credentials?.email || !credentials?.isBiometricEnabled) {
        setAlertMessage(
          'Invalid Biometric Configuration\nYour biometric settings are corrupted or incomplete.\nPlease:\n1. Login manually with Microsoft or Google\n2. Re-enable biometric authentication in settings',
        );
        setAlertModal(true);
        return;
      }

      const biometricSuccess = await authenticateWithBiometrics();
      if (!biometricSuccess) {
        setAlertMessage(
          'Authentication Failed\nBiometric authentication was cancelled or failed.\nPlease try again or use password login.',
        );
        setAlertModal(true);
        return;
      }

      setLoading(true);

      const activeConfig = await getActiveConfigData();
      if (!activeConfig) {
        setLoading(false);
        showConfigRequired(
          'Configuration Load Failed\nCould not load the active configuration.\nPossible causes:\n• Configuration was deleted\n• Keychain access denied\n• Corrupted configuration data\nPlease select a valid configuration.',
        );
        return;
      }

      await saveConfig(activeConfig);
      await loadUserDataFromBiometric(credentials.email, credentials.provider);
      // navigation.navigate('AttendanceManagement', {
      //   initialScreen: 'TimeClock',
      //   fromLogin: true,
      // });
      navigation.navigate('DrawerNavigator');
    } catch (error) {
      console.error('Biometric login error:', error);

      const {kind, message} = describeLoginError(error);
      if (kind === LOGIN_ERROR.CANCELLED) return;

      setAlertMessage(
        `${message}\n\nYou can also sign in with Microsoft or Google.`,
      );
      setAlertModal(true);
    } finally {
      setLoading(false);
    }
  };

  // ── Attendance shortcut login ──────────────────────────────
  const handleAttendanceLogin = async () => {
    if (loading || attendanceLoading) return;

    try {
      const activeConfig = await getActiveConfigData();
      if (!activeConfig) {
        showConfigRequired(
          'Configuration Required\nNo environment configuration found.\nPlease tap the QR icon (top-right) and scan your setup QR code first.',
        );
        return;
      }

      setAttendanceLoading(true);

      handleLogin(
        () => {},
        data => dispatch(setUserData(data)),
        {
          navigate: (screen, params) => {
            if (screen === 'DrawerNavigator') {
              setAttendanceLoading(false);
              navigation.navigate('AttendanceManagement', {
                initialScreen: 'TimeClock',
                fromLogin: true,
              });
            } else {
              setAttendanceLoading(false);
              navigation.navigate(screen, params);
            }
          },
          isFocused: () => navigation.isFocused(),
          reset: opts => {
            setAttendanceLoading(false);
            navigation.reset(opts);
          },
        },
        setDialogVisible,
        setDialogMessage,
        setAlertModal,
        // Message is already classified by handleLogin — just clear the
        // overlay and show it verbatim.
        message => {
          setAttendanceLoading(false);
          setAlertMessage(message);
        },
        legalEntity => dispatch(initializeLegalEntity(legalEntity)),
        list => dispatch(setLegalEntities(list)),
        menus => dispatch(setMenuItems(menus)),
        'Azure',
        setOnAlertConfirm,
        setOnDialogConfirm,
      );
    } catch (error) {
      console.error('Attendance login error:', error);
      setAttendanceLoading(false);

      const {kind, message} = describeLoginError(error);
      if (kind === LOGIN_ERROR.CANCELLED) return;

      setAlertMessage(message);
      setAlertModal(true);
    }
  };

  // ── Alert / Dialog handlers ────────────────────────────────
  const handleAlertConfirm = useCallback(() => {
    setAlertModal(false);
    if (onAlertConfirm) {
      onAlertConfirm();
      setOnAlertConfirm(null);
    }
  }, [onAlertConfirm]);

  const handleDialogConfirm = useCallback(() => {
    setDialogVisible(false);
    if (onDialogConfirm) {
      onDialogConfirm();
      setOnDialogConfirm(null);
    }
  }, [onDialogConfirm]);

  // ── Render ─────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      {/* Decorative background shapes */}
      <View style={styles.bgShape1} />
      <View style={styles.bgShape2} />

      {/* Attendance login overlay */}
      <AttendanceLoginModal visible={attendanceLoading} />

      {!loading ? (
        <View style={styles.content}>
          {/* ── Top bar: Attendance shortcut (left) + QR (right, unlocked devices only) ── */}
          <View style={styles.topBar}>
            {/* <TouchableOpacity
              activeOpacity={0.7}
              style={styles.iconButton}
              onPress={handleAttendanceLogin}
              disabled={loading || attendanceLoading}>
              <MaterialCommunityIcons
                name="clock-time-four-outline"
                size={22}
                color={brand.secondary}
              />
            </TouchableOpacity> */}

            {configAccess && (
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.iconButton}
                onPress={() => navigation.navigate('ConfigSelectionScreen')}
                onLongPress={handleLockConfigAccess}
                delayLongPress={1500}>
                <MaterialCommunityIcons
                  name="qrcode-scan"
                  size={22}
                  color={brand.secondary}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* ── Identity section: logo + welcome text ── */}
          <View style={styles.identitySection}>
            {/* Tapping the logo 7 times opens the admin PIN prompt */}
            <Pressable onPress={handleLogoTap}>
              <Image
                source={require('../assets/IDAPNewLogo.jpg')}
                style={styles.mainLogo}
                resizeMode="contain"
              />
            </Pressable>
            <View style={styles.textStack}>
              <Text style={styles.welcomeTitle}>IDAP360</Text>
              <Text style={styles.welcomeSubtitle}>معمارِ پنجاب</Text>
            </View>
          </View>

          {/* ── Action section: sign-in buttons ── */}
          <View style={styles.actionSection}>
            {/* <Text style={styles.actionLabel}>Secure Sign In</Text> */}

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.authButton, styles.shadow]}
              onPress={() => handleProviderLogin('Azure')}
              disabled={loading}>
              <Image
                source={require('../assets/microsoft.png')}
                style={styles.providerIcon}
              />
              <Text style={styles.authButtonText}>
                {t('login.signInMicrosoft')}
              </Text>
            </TouchableOpacity>

            {/* <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.authButton, styles.shadow]}
              onPress={() => handleProviderLogin('Google')}
              disabled={loading}>
              <Image
                source={require('../assets/google.png')}
                style={styles.providerIcon}
              />
              <Text style={styles.authButtonText}>
                {t('login.signInGoogle')}
              </Text>
            </TouchableOpacity> */}

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.line} />
            </View>

            {/* Biometric button */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.biometricButton}
              onPress={handleBiometricLogin}
              disabled={loading}>
              <View style={styles.biometricIconCircle}>
                <MaterialCommunityIcons
                  name="fingerprint"
                  size={32}
                  color={brand.primaryStrong}
                />
              </View>
              <Text style={styles.biometricText}>Biometric Login</Text>
            </TouchableOpacity>
          </View>

          {/* ── Footer ── */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>IDAP</Text>
          </View>
        </View>
      ) : (
        <View style={styles.loadingContainer}>
          <CustomIndicator />
          <Text style={styles.loadingText}>{t('login.connectingMessage')}</Text>
        </View>
      )}

      {/* RETIRED: this confirm dialog existed only to ask "Would you like to
          create an account?" and route to RequestForRegistration. Login
          failures are now reported through AlertModal with a specific cause,
          so nothing sets dialogVisible and this could never appear.
      <PopupDialog
        visible={dialogVisible}
        onTouchOutside={() => setDialogVisible(false)}
        dialogStyle={dialog.container}
        width={0.8}
        height={0.3}
        dialogTitle={
          <Text style={dialog.title}>{t('login.notification')}</Text>
        }>
        <Text style={dialog.message}>{dialogMessage}</Text>
        <View style={dialog.buttonsRow}>
          <TouchableOpacity
            style={[dialog.button, {backgroundColor: '#999'}]}
            onPress={() => {
              setDialogVisible(false);
              setOnDialogConfirm(null);
            }}>
            <Text style={dialog.buttonText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[dialog.button, {backgroundColor: brand.primary}]}
            onPress={handleDialogConfirm}>
            <Text style={dialog.buttonText}>{t('common.ok')}</Text>
          </TouchableOpacity>
        </View>
      </PopupDialog>
      */}

      <ConfigPinModal
        visible={pinModalVisible}
        value={pinValue}
        error={pinError}
        onChangeText={text => {
          setPinValue(text);
          if (pinError) setPinError('');
        }}
        onSubmit={handlePinSubmit}
        onCancel={handlePinCancel}
      />

      <AlertModal
        visible={alertModal}
        heading={t('common.dynaface')}
        text={alertMessage}
        onPress={handleAlertConfirm}
      />
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: brand.surface},

  // Decorative circles
  bgShape1: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: 600,
    backgroundColor: brand.pageBg,
    top: -width * 0.4,
    left: -width * 0.3,
    zIndex: -1,
  },
  bgShape2: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: 400,
    backgroundColor: brand.tint,
    bottom: -width * 0.4,
    right: -width * 0.2,
    zIndex: -1,
  },

  content: {flex: 1, paddingHorizontal: 30, justifyContent: 'space-between'},

  // Top bar — attendance icon on left, QR on right
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
  },
  iconButton: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: brand.surfaceAlt,
    borderWidth: 1,
    borderColor: brand.divider,
  },

  // Logo + welcome text
  identitySection: {alignItems: 'center', marginTop: 34},
  mainLogo: {width: 180, height: 180, marginBottom: 0},
  textStack: {alignItems: 'center'},
  welcomeTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: brand.text,
    textAlign: 'center',
    letterSpacing: 1,
  },
  welcomeSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginTop: 8,
    textAlign: 'center',
    maxWidth: '85%',
    lineHeight: 26,
  },

  // Sign-in buttons area
  actionSection: {flex: 1, justifyContent: 'center', marginTop: 20},
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: brand.secondary,
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.surface,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: brand.divider,
  },
  shadow: {
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  providerIcon: {width: 22, height: 22, position: 'absolute', left: 20},
  authButtonText: {fontSize: 16, fontWeight: '700', color: '#334155'},

  // OR divider
  dividerRow: {flexDirection: 'row', alignItems: 'center', marginVertical: 22},
  line: {flex: 1, height: 1, backgroundColor: brand.divider},
  dividerText: {
    marginHorizontal: 15,
    color: AppTokens.chevronColor,
    fontSize: 11,
    fontWeight: '800',
  },

  // Biometric
  biometricButton: {alignItems: 'center'},
  biometricIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: brand.tint,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: brand.tint,
  },
  biometricText: {color: brand.primaryStrong, fontWeight: '700', fontSize: 14},

  // Footer
  footer: {paddingBottom: 25, alignItems: 'center'},
  footerText: {
    fontSize: 11,
    color: AppTokens.chevronColor,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Loading state
  loadingContainer: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  loadingText: {
    marginTop: 15,
    fontSize: 14,
    color: brand.secondary,
    fontWeight: '600',
    paddingBottom: 60,
  },
});

// PopupDialog local styles (replaces styles.Login_Dialog*)
const dialog = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: brand.text,
    textAlign: 'center',
    paddingVertical: 12,
  },
  message: {
    fontSize: 14,
    color: '#334155',
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: brand.onPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
});

export default LoginScreen;
