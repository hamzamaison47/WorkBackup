/* eslint-disable curly */
import React, {useState, useEffect, useCallback} from 'react';
import {useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {Switch} from 'react-native';

import ActionPaneContainer from '../../components/ActionPaneContainer';
import LanguageModal from '../../components/Alert/LanguageModal';
import AlertModal from '../../components/Alert/AlertModal';
import {translate as t} from '../../store/utils/translate';
import {getActiveConfig} from '../../Controller/secureConfig';
import useTheme from '../../theme/useTheme';

import {
  checkBiometricAvailability,
  enableBiometric,
  disableBiometric,
  hasPersistentBiometricCredentials,
  getBiometricCredentials,
} from '../../store/utils/biometricUtils';

import {
  PageBackground,
  AnimatedCard,
  CardHeading,
  SettingRow,
  FooterNote,
  AppTokens,
  CARD_STAGGER,
} from '../../components/AppComponentsDesign/Appcomponents';

const SettingsScreen = ({navigation: navProp}) => {
  const navHook = useNavigation();
  const navigation = navProp ?? navHook;

  // ✅ Theme at the top
  const {colors, mode, isDark, toggleTheme} = useTheme();

  // ── Selectors ─────────────────────────────────────────────────────────────
  const currentLanguage = useSelector(state => state.language.currentLanguage);
  const userData = useSelector(state => state.user.userData);
  const accessToken = useSelector(state => state.auth.accessToken);

  // ── State ─────────────────────────────────────────────────────────────────
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricEmail, setBiometricEmail] = useState(null);
  const [biometricAccount, setBiometricAccount] = useState(null);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [biometricLoading, setBiometricLoading] = useState(false);

  const langLabel = currentLanguage
    ? currentLanguage.charAt(0).toUpperCase() + currentLanguage.slice(1)
    : 'English';

  useEffect(() => {
    initBiometric();
  }, []);

  const initBiometric = async (silent = false) => {
    try {
      const {available, biometryType} = await checkBiometricAvailability();
      setBiometricAvailable(available);
      setBiometricType(biometryType);
      const hasCreds = await hasPersistentBiometricCredentials();
      if (hasCreds) {
        const credentials = await getBiometricCredentials();
        setBiometricEnabled(true);
        setBiometricEmail(credentials.email);
        setBiometricAccount({
          email: credentials.email,
          provider: credentials.provider,
        });
      } else {
        setBiometricEnabled(false);
        setBiometricEmail(null);
        setBiometricAccount(null);
      }
    } catch (error) {
      console.error('Biometric init error:', error);
    }
  };

  const getBiometricDisplayName = () => {
    const normalized =
      biometricType === 'Biometrics' ? 'Fingerprint' : biometricType;
    switch (normalized) {
      case 'FaceID':
        return 'Face ID';
      case 'TouchID':
        return 'Touch ID';
      case 'Fingerprint':
        return 'Fingerprint';
      case 'Face':
        return 'Face Recognition';
      default:
        return normalized || 'Fingerprint';
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

  const showAlert = message => {
    setAlertMessage(message);
    setAlertModal(true);
  };

  const handleBiometricToggle = async value => {
    if (biometricLoading) return;
    setBiometricLoading(true);
    try {
      if (value) {
        if (!userData?.employeeId) {
          showAlert('No active session found. Please log in again.');
          return;
        }
        const activeConfigId = await getActiveConfig();
        if (!activeConfigId) {
          showAlert('No active configuration found.');
          return;
        }
        const target = biometricAccount ?? {
          email: userData.email,
          provider: userData.provider,
        };
        const success = await enableBiometric(target.email, target.provider);
        if (success) {
          setBiometricEnabled(true);
          setBiometricEmail(target.email);
          await initBiometric(true);
          showAlert(`${getBiometricDisplayName()} enabled for ${target.email}`);
        } else {
          showAlert('Failed to enable biometric. Please try again.');
        }
      } else {
        const emailToShow = biometricEmail;
        const success = await disableBiometric();
        if (success) {
          setBiometricEnabled(false);
          setBiometricEmail(null);
          setBiometricAccount(null);
          await initBiometric(true);
          showAlert(`${getBiometricDisplayName()} disabled for ${emailToShow}`);
        } else {
          showAlert('Failed to disable biometric. Please try again.');
        }
      }
    } catch (error) {
      console.error('Biometric toggle error:', error);
      showAlert(
        value
          ? 'Failed to enable biometric. Please try again.'
          : 'Failed to disable biometric. Please try again.',
      );
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainDashboard');
    }
  };

  // ✅ Switches use theme colors
  const BiometricToggle = (
    <Switch
      value={biometricEnabled}
      onValueChange={handleBiometricToggle}
      disabled={biometricLoading}
      trackColor={{false: colors.border, true: colors.primary}}
      thumbColor={colors.card}
      ios_backgroundColor={colors.border}
    />
  );

  const ThemeToggle = (
    <Switch
      value={isDark}
      onValueChange={toggleTheme}
      trackColor={{false: colors.border, true: colors.primary}}
      thumbColor={colors.card}
      ios_backgroundColor={colors.border}
    />
  );

  return (
    <ActionPaneContainer
      pageTitle="Settings"
      isBackButton={false}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      showTabNavigator={true}
      showPageTitleRow={true}
      onBackPress={handleGoBack}>
      <PageBackground>
        {/* ── GENERAL ──────────────────────────────────────────────────── */}
        <AnimatedCard delay={0}>
          <CardHeading label="GENERAL" />
          {/* <SettingRow
            icon="globe"
            iconColor={AppTokens.blue}
            iconBg={AppTokens.blueBg}
            title={t('profile.language') || 'Language'}
            subtitle={`Current: ${langLabel}`}
            onPress={() => setLanguageModalVisible(true)}
          /> */}
          <SettingRow
            icon={isDark ? 'moon' : 'sun'}
            iconColor={isDark ? AppTokens.purple : AppTokens.amber}
            iconBg={isDark ? AppTokens.purpleBg : AppTokens.amberBg}
            title="Dark Mode"
            subtitle={`Current: ${isDark ? 'Dark' : 'Light'}`} // ✅ cleaner
            rightElement={ThemeToggle}
            isLast
          />
          {/* <SettingRow
            icon="clock"
            iconColor={AppTokens.indigo}
            iconBg={AppTokens.indigoBg}
            title="Date & Time Settings"
            subtitle="Manage your date & time format preferences."
            onPress={() => navigation.navigate('DateFormatSettingsScreen')}
            isLast
          /> */}
          {/* {!!accessToken && (
            <SettingRow
              icon="calendar"
              iconColor={AppTokens.indigo}
              iconBg={AppTokens.indigoBg}
              title="Outlook Calendar"
              subtitle="View and manage your calendar events"
              onPress={() => navigation.navigate('OutlookCalendarScreen')}
              isLast
            />
          )} */}
          {/* <SettingRow
            icon="shopping-cart"
            iconColor={AppTokens.indigo}
            iconBg={AppTokens.indigoBg}
            title="Purchase Orders"
            subtitle="View and manage purchase orders"
            onPress={() =>
              navigation.navigate('PurchaseOrderListPage', {
                employeeId: userData?.employeeId,
                employeeName: userData?.employeeName,
                WorkerRecId: userData?.WorkerRecId,
                cameFrom: 'Settings',
                userData: userData,
              })
            }
            isLast
          /> */}
        </AnimatedCard>

        {/* ── SECURITY ─────────────────────────────────────────────────── */}
        <AnimatedCard delay={CARD_STAGGER}>
          <CardHeading label="SECURITY" />
          <SettingRow
            icon="lock"
            iconColor={AppTokens.teal}
            iconBg={AppTokens.tealBg}
            title={t('profile.biometricSettings') || 'Biometric & Security'}
            subtitle={
              t('profile.biometricSubtitle') ||
              'Manage fingerprint and face unlock settings.'
            }
            rightElement={biometricAvailable ? BiometricToggle : undefined}
            isLast
          />
        </AnimatedCard>

        {/* ── NOTIFICATIONS ──────────────────────────────────────────────
        <AnimatedCard delay={CARD_STAGGER * 2}>
          <CardHeading label="NOTIFICATIONS" />
          <SettingRow
            icon="bell"
            iconColor={AppTokens.amber}
            iconBg={AppTokens.amberBg}
            title="Push Notifications"
            subtitle="Manage alerts and notification preferences"
            onPress={() => navigation.navigate('NotificationSettings')}
          />
          <SettingRow
            icon="mail"
            iconColor={AppTokens.purple}
            iconBg={AppTokens.purpleBg}
            title="Email Notifications"
            subtitle="Control what gets sent to your inbox"
            onPress={() => navigation.navigate('EmailNotificationSettings')}
            isLast
          />
        </AnimatedCard> */}

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <FooterNote
          icon="cube-outline"
          iconLib="ion"
          text={`Employee ID: ${userData?.employeeId ?? '—'}`}
        />
      </PageBackground>

      <LanguageModal
        visible={languageModalVisible}
        onClose={() => setLanguageModalVisible(false)}
      />
      <AlertModal
        visible={alertModal}
        heading="Alert"
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />
    </ActionPaneContainer>
  );
};

export default SettingsScreen;
