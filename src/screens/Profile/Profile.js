/* eslint-disable curly */
/* eslint-disable no-unused-vars */
import React, {useState, useEffect, useCallback} from 'react';
import {View, Text, RefreshControl, Image} from 'react-native';
import {useSelector} from 'react-redux';
import FeatherIcon from 'react-native-vector-icons/Feather';

// Components
import AlertModal from '../../components/Alert/AlertModal';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import LogoutAlertModal from '../../components/Alert/LogoutAlertModal';

// API
import {ProfilePicture} from '../../API/PersonalInformation/ProfilePicture/ProfilePicture';

// Auth
import {handleLogoutauth} from '../../Controller/authUtils';

// Utils
import {conditionalFontScale} from '../../store/utils/scaling';

// Design system
import {
  PageBackground,
  AnimatedCard,
  CardHeading,
  SettingRow,
  AppTokens,
  CARD_STAGGER,
} from '../../components/AppComponentsDesign/Appcomponents';
import useAppTokens from '../../components/AppComponentsDesign/useAppTokens';

import styles from '../../styles/styles';

// ─────────────────────────────────────────────────────────────────────────────

const Profile = ({navigation}) => {
  const T = useAppTokens(); // ✅ reactive theme tokens

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const userData = useSelector(state => state.user.userData);

  const fetchProfilePicture = useCallback(async () => {
    try {
      if (!userData?.employeeId) return;
      const data = await ProfilePicture({employeeId: userData.employeeId});
      const imageData = Array.isArray(data) && data.length > 0 ? data[0] : data;
      if (imageData?.StringImage) {
        const clean = imageData.StringImage.replace(/\s/g, '');
        setProfilePictureUrl(`data:image/png;base64,${clean}`);
      }
    } catch {
      setProfilePictureUrl(null);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [userData?.employeeId]);

  useEffect(() => {
    fetchProfilePicture();
  }, [fetchProfilePicture]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProfilePicture();
  };

  const confirmLogout = () => {
    setModalVisible(false);
    // Was navigate('Login') with no teardown — the previous user's entire
    // store survived into the next sign-in.
    handleLogoutauth(navigation);
  };

  const getUserInitials = () => {
    const name = userData?.name || userData?.employeeName || '?';
    return name
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const getPoweredByText = () => {
    const currentYear = new Date().getFullYear();
    const nextYearShort = String(currentYear + 1).slice(-2);
    return `Powered by Dynaface © ${currentYear}/${nextYearShort}`;
  };

  return (
    <ActionPaneContainer
      pageTitle="Profile"
      isBackButton={false}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      showTabNavigator={true}
      showPageTitleRow={true}
      onRefresh={handleRefresh}>
      {isLoading ? (
        <View style={styles.Prf_loadingWrap}>
          <CustomIndicator />
        </View>
      ) : (
        <PageBackground
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }>
          {/* ── Avatar strip ─────────────────────────────────────────────── */}
          <AnimatedCard delay={0} style={styles.Prf_avatarCard}>
            <View style={styles.Prf_avatarRow}>
              <View style={styles.Prf_avatarCircle}>
                {profilePictureUrl ? (
                  <Image
                    source={{uri: profilePictureUrl}}
                    style={styles.Prf_avatarImage}
                  />
                ) : (
                  // ✅ surface bg instead of hardcoded #E8E3F3
                  <View
                    style={[
                      styles.Prf_avatarFallback,
                      {backgroundColor: T.surface},
                    ]}>
                    <Text
                      style={[
                        styles.Prf_avatarInitials,
                        {color: AppTokens.indigo},
                      ]}>
                      {getUserInitials()}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.Prf_avatarTextBlock}>
                {/* ✅ titleText instead of hardcoded */}
                <Text
                  style={[styles.Prf_avatarName, {color: T.titleText}]}
                  numberOfLines={1}>
                  {userData?.name || userData?.employeeName || 'User'}
                </Text>
                {/* ✅ subtitleText instead of hardcoded */}
                <Text
                  style={[styles.Prf_avatarRole, {color: T.subtitleText}]}
                  numberOfLines={1}>
                  {userData?.jobTitle
                    ? userData.jobTitle
                    : userData?.employeeId
                    ? `Employee ID · ${userData.employeeId}`
                    : 'Employee'}
                </Text>
              </View>
            </View>
          </AnimatedCard>

          {/* ── General card ─────────────────────────────────────────────── */}
          <AnimatedCard delay={CARD_STAGGER * 2}>
            <CardHeading label="GENERAL" />
            <SettingRow
              icon="user"
              iconColor={AppTokens.blueStrong}
              iconBg={AppTokens.blueBg}
              title="Personal Information"
              subtitle="Manage your personal details"
              onPress={() => navigation.navigate('DisplayPersonalInfo')}
            />
            <SettingRow
              icon="settings"
              iconColor={AppTokens.slate}
              iconBg={AppTokens.slateBg}
              title="Settings"
              subtitle="App preferences and configuration"
              onPress={() => navigation.navigate('SettingsScreen')}
              isLast
            />
          </AnimatedCard>

          {/* ── Legal card ───────────────────────────────────────────────── */}
          <AnimatedCard delay={CARD_STAGGER * 3}>
            <CardHeading label="LEGAL" />
            <SettingRow
              icon="file-text"
              iconColor={AppTokens.indigo}
              iconBg={AppTokens.indigoBg}
              title="Privacy Policy"
              subtitle="How we handle your data"
              onPress={() => navigation.navigate('PrivacyPolicy')}
            />
            <SettingRow
              icon="book-open"
              iconColor={AppTokens.teal}
              iconBg={AppTokens.tealBg}
              title="Terms of Service"
              subtitle="Rules governing use of the app"
              onPress={() => navigation.navigate('TermsOfService')}
            />
            <SettingRow
              icon="shield"
              iconColor={AppTokens.green}
              iconBg={AppTokens.greenBg}
              title="Cookie Policy"
              subtitle="How we use cookies and tracking"
              onPress={() => navigation.navigate('CookiePolicy')}
              isLast
            />
          </AnimatedCard>
        </PageBackground>
      )}

      <LogoutAlertModal
        visible={modalVisible}
        heading="Logout"
        text="Are you sure you want to logout?"
        onConfirm={confirmLogout}
        onCancel={() => setModalVisible(false)}
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

export default Profile;
