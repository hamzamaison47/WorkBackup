/* eslint-disable curly */
import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  I18nManager,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Icon from 'react-native-vector-icons/Feather';
import {useSelector} from 'react-redux';

import ActionPaneContainer from '../components/ActionPaneContainer';
import LanguageModal from '../components/Alert/LanguageModal';
import {translate as t} from '../store/utils/translate';
import {
  conditionalScale,
  conditionalVerticalScale,
  conditionalFontScale,
} from '../store/utils/scaling';

// ─── Stagger delay per card ────────────────────────────────────────────────
const STAGGER = 60;

// ─── Single animated settings group card ──────────────────────────────────
const AnimatedCard = ({children, delay = 0}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 320,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        speed: 14,
        bounciness: 3,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, delay]);

  return (
    <Animated.View style={[styles.card, {opacity, transform: [{translateY}]}]}>
      {children}
    </Animated.View>
  );
};

// ─── Section heading above a card ─────────────────────────────────────────
const CardHeading = ({label}) => (
  <Text style={styles.cardHeading}>{label}</Text>
);

// ─── One row inside a card ─────────────────────────────────────────────────
const SettingRow = ({
  icon,
  iconColor,
  iconBg,
  title,
  subtitle,
  onPress,
  isLast = false,
}) => (
  <TouchableOpacity
    style={[styles.settingRow, isLast && styles.settingRowLast]}
    onPress={onPress}
    activeOpacity={0.72}>
    {/* Icon badge */}
    <View style={[styles.iconBadge, {backgroundColor: iconBg}]}>
      <Icon
        name={icon}
        size={conditionalFontScale(15, 15, 16, 16)}
        color={iconColor}
      />
    </View>
    {/* Text */}
    <View style={styles.settingTextBlock}>
      <Text style={styles.settingTitle}>{title}</Text>
      {subtitle ? (
        <Text style={styles.settingSubtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      ) : null}
    </View>
    {/* Chevron */}
    <Icon
      name={I18nManager.isRTL ? 'chevron-left' : 'chevron-right'}
      size={conditionalFontScale(14, 15, 16, 16)}
      color="#CBD5E1"
    />
  </TouchableOpacity>
);

// ─── Main screen ───────────────────────────────────────────────────────────
const SettingsScreen = ({navigation}) => {
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const currentLanguage = useSelector(state => state.language.currentLanguage);
  const userData = useSelector(state => state.user.userData);

  const langLabel = currentLanguage
    ? currentLanguage.charAt(0).toUpperCase() + currentLanguage.slice(1)
    : 'English';

  return (
    <ActionPaneContainer
      pageTitle="Settings"
      isBackButton={true}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      showTabNavigator={true}
      showPageTitleRow={true}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* ── GENERAL section ──────────────────────────────────── */}
        <AnimatedCard delay={0}>
          <CardHeading label="GENERAL" />

          <SettingRow
            icon="globe"
            iconColor="#0A66C2"
            iconBg="#E8F1FB"
            title={t('profile.language') || 'Language'}
            subtitle={`Current: ${langLabel}`}
            onPress={() => setLanguageModalVisible(true)}
          />

          <SettingRow
            icon="calendar"
            iconColor="#6366F1"
            iconBg="#EDEFFD"
            title={t('Date & Time Settings') || 'Date & Time Settings'}
            subtitle={
              t('Manage your date & time format preferences.') ||
              'Manage your date & time format preferences.'
            }
            onPress={() => navigation.navigate('DateFormatSettingsScreen')}
            isLast
          />
        </AnimatedCard>

        {/* ── SECURITY section ─────────────────────────────────── */}
        <AnimatedCard delay={STAGGER}>
          <CardHeading label="SECURITY" />

          <SettingRow
            icon="shield"
            iconColor="#0D9488"
            iconBg="#CCFBF1"
            title={t('profile.biometricSettings') || 'Biometric & Security'}
            subtitle={
              t('profile.biometricSubtitle') ||
              'Manage fingerprint and face unlock settings.'
            }
            onPress={() => navigation.navigate('BiometricSettings')}
            isLast
          />
        </AnimatedCard>

        {/* ── ACCOUNT section ──────────────────────────────────── */}
        <AnimatedCard delay={STAGGER * 2}>
          <CardHeading label="ACCOUNT" />

          <SettingRow
            icon="user"
            iconColor="#F59E0B"
            iconBg="#FEF3C7"
            title={t('profile.personalInfo') || 'Personal Information'}
            subtitle={
              t('profile.personalInfoSubtitle') ||
              'View and manage your personal details.'
            }
            onPress={() => navigation.navigate('DisplayPersonalInfo')}
            isLast
          />
        </AnimatedCard>

        {/* ── App info footer ───────────────────────────────────── */}
        <Animated.View style={styles.appInfo}>
          <Ionicons
            name="cube-outline"
            size={conditionalFontScale(16, 17, 18, 18)}
            color="#CBD5E1"
          />
          <Text style={styles.appInfoText}>
            {`Employee ID: ${userData?.employeeId ?? '—'}`}
          </Text>
        </Animated.View>
      </ScrollView>

      {/* Language modal triggered inline */}
      <LanguageModal
        visible={languageModalVisible}
        onClose={() => setLanguageModalVisible(false)}
      />
    </ActionPaneContainer>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: conditionalScale(14, 16, 18, 18),
    paddingTop: conditionalVerticalScale(14, 16, 18, 18),
    paddingBottom: conditionalVerticalScale(32, 36, 40, 40),
  },

  // ── Card container
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: conditionalScale(12, 13, 14, 14),
    marginBottom: conditionalVerticalScale(12, 14, 16, 16),
    // Shadow
    shadowColor: '#0F172A',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },

  // ── Card heading
  cardHeading: {
    fontSize: conditionalFontScale(9, 9, 10, 10),
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
    paddingHorizontal: conditionalScale(14, 15, 16, 16),
    paddingTop: conditionalVerticalScale(12, 13, 14, 14),
    paddingBottom: conditionalVerticalScale(6, 7, 8, 8),
    backgroundColor: '#FAFBFC',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  // ── Setting row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: conditionalScale(14, 15, 16, 16),
    paddingVertical: conditionalVerticalScale(13, 14, 15, 15),
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  settingRowLast: {
    borderBottomWidth: 0,
  },

  // ── Icon badge
  iconBadge: {
    width: conditionalScale(36, 37, 38, 38),
    height: conditionalScale(36, 37, 38, 38),
    borderRadius: conditionalScale(10, 10, 11, 11),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: conditionalScale(12, 13, 14, 14),
  },

  // ── Text block
  settingTextBlock: {flex: 1, marginRight: conditionalScale(8, 9, 10, 10)},
  settingTitle: {
    fontSize: conditionalFontScale(13, 13, 14, 14),
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: conditionalFontScale(10, 10, 11, 11),
    color: '#94A3B8',
    fontWeight: '400',
    lineHeight: conditionalFontScale(14, 14, 15, 15),
  },

  // ── App info footer
  appInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: conditionalScale(6, 7, 8, 8),
    marginTop: conditionalVerticalScale(8, 10, 12, 12),
  },
  appInfoText: {
    fontSize: conditionalFontScale(10, 10, 11, 11),
    color: '#CBD5E1',
    fontWeight: '500',
  },
});

export default SettingsScreen;
