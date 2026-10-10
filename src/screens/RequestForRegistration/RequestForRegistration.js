/* eslint-disable curly */
/* eslint-disable react-native/no-inline-styles */
import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DeviceInfo from 'react-native-device-info';

import {RegisterDevice} from '../../API/RequestForRegistration/RegisterDevice';
import AlertModal from '../../components/Alert/AlertModal';
import firebaseService from '../../store/FirebaseService';
import {getActiveConfigData} from '../../Controller/secureConfig';
import {describeLoginError, LOGIN_ERROR} from '../../Controller/authErrors';
import {acquireProviderEmail} from '../../Controller/authUtils';

const {width} = Dimensions.get('window');

// SOAP booleans arrive as the strings 'true'/'false'. A bare truthiness check
// treats 'false' as success.
const isTrue = value => String(value).toLowerCase() === 'true';

// Gathers the DFDeviceRegistrationSvcContract fields. Every read is wrapped:
// a registration must not fail because one optional attribute is unavailable.
// Anything that throws resolves to '' and lands in D365 as a blank column.
const collectDeviceInfo = async () => {
  const safe = async (fn, fallback = '') => {
    try {
      const value = await fn();
      return value === null || value === undefined ? fallback : String(value);
    } catch (e) {
      console.warn('deviceInfo: field unavailable', e?.message);
      return fallback;
    }
  };

  // Same value FirebaseService registers against, so a device that registers
  // and later signs in resolves to one DFDeviceRegistration row, not two.
  const DeviceID = await safe(() => DeviceInfo.getUniqueId());

  // getDeviceName needs a runtime permission on some Android builds; the model
  // is always readable and is what the D365 grid actually displays.
  const DeviceName = await safe(
    () => DeviceInfo.getDeviceName(),
    DeviceInfo.getModel(),
  );

  const OSVersion = await safe(
    () =>
      `${
        Platform.OS === 'ios' ? 'iOS' : 'Android'
      } ${DeviceInfo.getSystemVersion()}`,
  );

  const APPVersion = await safe(
    () => `${DeviceInfo.getVersion()} (${DeviceInfo.getBuildNumber()})`,
  );

  const IPAddress = await safe(() => DeviceInfo.getIpAddress());

  // getFCMToken() returns null rather than throwing when the user declined
  // notifications, so the fallback covers both paths. Registration proceeds
  // without a token — it is written again by syncDeviceAfterLogin on the
  // first successful sign-in.
  const DeviceToken = await safe(() => firebaseService.getFCMToken());

  return {
    DeviceID,
    DeviceName,
    DeviceType: Platform.OS === 'ios' ? 'iOS' : 'Android',
    DeviceToken,
    APPVersion,
    OSVersion,
    IPAddress,
  };
};

const RequestForRegistration = () => {
  const navigation = useNavigation();

  const [busy, setBusy] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [onAlertConfirm, setOnAlertConfirm] = useState(null);

  const showAlert = (message, onConfirm = null) => {
    setAlertMessage(message);
    setOnAlertConfirm(() => onConfirm);
    setAlertModal(true);
  };

  const handleAlertConfirm = () => {
    setAlertModal(false);
    if (onAlertConfirm) {
      onAlertConfirm();
      setOnAlertConfirm(null);
    }
  };

  const handleRegister = async provider => {
    if (busy) return;

    try {
      const config = await getActiveConfigData();
      if (!config) {
        showAlert(
          'Configuration Required\nNo environment configuration found. Please scan your setup QR code first.',
          () => navigation.navigate('ConfigSelectionScreen'),
        );
        return;
      }

      // Account picker first, overlay after. Showing the overlay before the
      // provider UI appears leaves it stranded on screen if the user backs
      // out of the system sheet.
      const email = await acquireProviderEmail(provider);

      if (!email) {
        // No account returned means the user dismissed the picker. That is a
        // cancellation, not a failure, so nothing is shown.
        return;
      }

      setBusy(true);

      const deviceInfo = await collectDeviceInfo();

      const response = await RegisterDevice({
        registrationData: {
          ...deviceInfo,
          Email: email,
        },
      });

      setBusy(false);

      if (!response) {
        showAlert(
          'The server returned an unexpected response. Please try again.',
        );
        return;
      }

      if (isTrue(response.IsSuccess)) {
        showAlert(
          `${response.Message}\n\nYou can sign in once an administrator has approved your account.`,
          () => navigation.navigate('Login'),
        );
        return;
      }

      // registerDevice already classified the failure (already registered,
      // missing email, server error) and returned final text — show it
      // verbatim rather than sniffing keywords out of it.
      showAlert(response.Message || 'Registration could not be completed.');
    } catch (error) {
      setBusy(false);
      console.error('Registration error:', error);

      const {kind, message} = describeLoginError(error);
      if (kind === LOGIN_ERROR.CANCELLED) return;

      showAlert(message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.bgShape1} />
      <View style={styles.bgShape2} />

      {busy && (
        <View style={styles.overlay}>
          <View style={styles.overlayCard}>
            <ActivityIndicator
              size="large"
              color="#0A66C2"
              style={{marginBottom: 14}}
            />
            <Text style={styles.overlayTitle}>Please wait</Text>
            <Text style={styles.overlaySub}>
              Registering your email address…
            </Text>
          </View>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.iconButton}
            onPress={() => navigation.goBack()}
            disabled={busy}>
            <MaterialCommunityIcons
              name="arrow-left"
              size={22}
              color="#64748B"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.identitySection}>
          <Image
            source={require('../../assets/IDAPLOGO.jpeg')}
            style={styles.mainLogo}
            resizeMode="contain"
          />
          <View style={styles.textStack}>
            <Text style={styles.welcomeTitle}>Register your device</Text>
            <Text style={styles.welcomeSubtitle}>
              Choose the account you use at work. We'll send your details to
              your administrator for approval.
            </Text>
          </View>
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.authButton, styles.shadow]}
            onPress={() => handleRegister('Azure')}
            disabled={busy}>
            <Image
              source={require('../../assets/microsoft.png')}
              style={styles.providerIcon}
            />
            <Text style={styles.authButtonText}>Register with Microsoft</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.authButton, styles.shadow]}
            onPress={() => handleRegister('Google')}
            disabled={busy}>
            <Image
              source={require('../../assets/google.png')}
              style={styles.providerIcon}
            />
            <Text style={styles.authButtonText}>Register with Google</Text>
          </TouchableOpacity>

          <View style={styles.noteBox}>
            <MaterialCommunityIcons
              name="information-outline"
              size={16}
              color="#0A66C2"
            />
            <Text style={styles.noteText}>
              Registration does not grant access immediately. An administrator
              must approve your account first.
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Login')}
            disabled={busy}>
            <Text style={styles.footerLink}>
              Already registered?{' '}
              <Text style={styles.footerLinkStrong}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <AlertModal
        visible={alertModal}
        heading="IDAP360"
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
    top: -width * 0.4,
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

  content: {
    flexGrow: 1,
    paddingHorizontal: 30,
    justifyContent: 'space-between',
  },

  topBar: {flexDirection: 'row', justifyContent: 'flex-start', marginTop: 15},
  iconButton: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  identitySection: {alignItems: 'center', marginTop: 30},
  mainLogo: {width: 150, height: 150, marginBottom: 10},
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
    marginTop: 8,
    textAlign: 'center',
    maxWidth: '90%',
    lineHeight: 21,
  },

  actionSection: {marginTop: 36},
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

  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F7FF',
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
    gap: 10,
  },
  noteText: {flex: 1, fontSize: 12, color: '#475569', lineHeight: 17},

  footer: {paddingVertical: 30, alignItems: 'center'},
  footerLink: {fontSize: 13, color: '#94A3B8'},
  footerLinkStrong: {color: '#0A66C2', fontWeight: '700'},

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  overlayCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    width: 270,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  overlayTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  overlaySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default RequestForRegistration;
