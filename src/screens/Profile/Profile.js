/* eslint-disable curly */
/* eslint-disable no-unused-vars */
import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  RefreshControl,
  TouchableOpacity,
  I18nManager,
} from 'react-native';
import {useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/Feather';

// Components
import AlertModal from '../../components/Alert/AlertModal';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import LogoutAlertModal from '../../components/Alert/LogoutAlertModal';
import LanguageModal from '../../components/Alert/LanguageModal';
import ProfilePictureEditor from '../../components/PersonalInformation/ProfilePictureEditor';

// API imports
import {ProfilePicture} from '../../API/PersonalInformation/ProfilePicture/ProfilePicture';

// Translation utility
import {translate as t} from '../../store/utils/translate';

// Styles imports
import styles from '../../styles/styles';

const Profile = ({navigation}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);
  const [isImageChanged, setIsImageChanged] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  // Select data from Redux store
  const userData = useSelector(state => state.user.userData);
  const currentLanguage = useSelector(state => state.language.currentLanguage);

  const fetchProfilePicture = useCallback(async () => {
    try {
      if (!userData?.employeeId) return;

      const data = await ProfilePicture({employeeId: userData.employeeId});
      let imageData = Array.isArray(data) && data.length > 0 ? data[0] : data;

      if (imageData?.StringImage) {
        const cleanBase64 = imageData.StringImage.replace(/\s/g, '');
        setProfilePictureUrl(`data:image/png;base64,${cleanBase64}`);
      }
    } catch (e) {
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
    setIsImageChanged(false);
    setRefreshing(true);
    await fetchProfilePicture();
  };

  const handleLogout = () => {
    setModalVisible(true);
  };

  const confirmLogout = () => {
    setModalVisible(false);
    navigation.navigate('Login');
  };

  const cancelLogout = () => {
    setModalVisible(false);
  };

  const getUserInitials = () => {
    const name = userData?.name || userData?.employeeName || 'Username';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const getSettingsItems = () => {
    return [
      {
        id: 'account',
        icon: 'user',
        title: t('profile.personalInfo'),
        subtitle: t('profile.personalInfoSubtitle'),
        screen: 'DisplayPersonalInfo',
      },
      {
        id: 'BiometricSettings',
        icon: 'shield',
        title: t('profile.biometricSettings'),
        subtitle: t('profile.biometricSubtitle'),
        screen: 'BiometricSettings',
      },
      {
        id: 'language',
        icon: 'globe',
        title: t('profile.language'),
        subtitle: t('profile.languageSubtitle'),
        onPress: () => setLanguageModalVisible(true),
      },
    ];
  };

  const getPoweredByText = () => {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    const nextYearShort = nextYear.toString().slice(-2);

    return t('profile.poweredBy')
      .replace('{currentYear}', currentYear)
      .replace('{nextYearShort}', nextYearShort);
  };

  const renderSettingItem = item => {
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.Profile_settingItem}
        onPress={() => {
          if (item.onPress) {
            item.onPress();
          } else if (item.screen && item.screen.trim() !== '') {
            navigation.navigate(item.screen);
          }
        }}>
        <View style={styles.Profile_settingContent}>
          <View style={styles.Profile_settingIconWrapper}>
            <Icon name={item.icon} size={18} color="#0A66C2" />
          </View>
          <View style={styles.Profile_settingTextContainer}>
            <Text style={styles.Profile_settingTitle}>{item.title}</Text>
            <Text style={styles.Profile_settingSubtitle}>{item.subtitle}</Text>
          </View>
          <Icon
            name={I18nManager.isRTL ? 'chevron-left' : 'chevron-right'}
            size={20}
            color="#999"
          />
        </View>
      </TouchableOpacity>
    );
  };

  const settingsItems = getSettingsItems();

  return (
    <ActionPaneContainer
      pageTitle={t('profile.title')}
      isBackButton={false}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      showTabNavigator={false}
      onRefresh={() => handleRefresh()}>
      {isLoading ? (
        <View style={styles.DLP_LoadingContainer}>
          <CustomIndicator />
        </View>
      ) : (
        <View style={styles.Profile_container}>
          <ScrollView
            contentContainerStyle={styles.Profile_scrollContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
              {/* Profile Header */}
              <View style={styles.Profile_profileHeader}>
                <View style={styles.Profile_avatarContainer}>
                  {profilePictureUrl ? (
                    <ProfilePictureEditor
                      isLoading={isLoading}
                      profilePictureUrl={profilePictureUrl}
                      onEdit={() => {}}
                      userData={userData}
                    />
                  ) : (
                    <View style={styles.Profile_avatarFallback}>
                      <Text style={styles.Profile_avatarText}>
                        {getUserInitials()}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Settings Card */}
              <View style={styles.Profile_card}>
                {settingsItems.map(renderSettingItem)}
              </View>
            </KeyboardAvoidingView>
          </ScrollView>
        </View>
      )}

      <LanguageModal
        visible={languageModalVisible}
        onClose={() => setLanguageModalVisible(false)}
      />

      <LogoutAlertModal
        visible={modalVisible}
        heading={t('profile.logoutConfirm')}
        text={t('profile.logoutConfirm')}
        onConfirm={confirmLogout}
        onCancel={cancelLogout}
      />

      <AlertModal
        visible={alertModal}
        heading={t('common.alert')}
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />
    </ActionPaneContainer>
  );
};

export default Profile;
