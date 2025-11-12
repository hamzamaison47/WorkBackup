/* eslint-disable no-unused-vars */
/* eslint-disable curly */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/Feather';
import {useNavigation} from '@react-navigation/native';

// Components
import ProfilePictureEditor from '../../components/PersonalInformation/ProfilePictureEditor';
import AlertModal from '../../components/Alert/AlertModal';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import LogoutAlertModal from '../../components/Alert/LogoutAlertModal';

// API imports
import {ProfilePicture} from '../../API/PersonalInformation/ProfilePicture/ProfilePicture';

const Profile = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);
  const [isImageChanged, setIsImageChanged] = useState(false);

  const [alertModal, setAlertModal] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const navigation = useNavigation();
  const {userData} = useSelector(state => state.user);

  useEffect(() => {
    fetchProfilePicture();
  }, []);

  const fetchProfilePicture = async () => {
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
  };

  const handleRefresh = async () => {
    setIsImageChanged(false);
    setRefreshing(true);
    await fetchProfilePicture();
  };

  const handleLogout = () => setModalVisible(true);
  const confirmLogout = () => {
    setModalVisible(false);
    handleLogout(userData.Provider);
    navigation.navigate('Login');
  };
  const cancelLogout = () => setModalVisible(false);

  const settingsItems = [
    {
      id: 'account',
      icon: 'user',
      title: 'Personal Information',
      subtitle: 'Addresses, Billing, Contact, Image',
      screen: 'DisplayPersonalInfo',
    },
    {
      id: 'BiometricSettings',
      icon: 'shield',
      title: 'Biometric Settings',
      subtitle: 'Set up fingerprint authentication for quick access',
      screen: 'BiometricSettings',
    },
    // {
    //   id: 'preferences',
    //   icon: 'settings',
    //   title: 'Preferences',
    //   subtitle: 'Biometric Settings, Notifications, Appearance, Language',
    //   screen: 'Preferences',
    // },
    // {
    //   id: 'help',
    //   icon: 'help-circle',
    //   title: 'Help & Support',
    //   subtitle: 'FAQ, Contact us, Feedback',
    //   screen: '',
    // },
  ];

  const renderSettingItem = item => (
    <TouchableOpacity
      key={item.id}
      style={styles.settingItem}
      onPress={() => {
        if (item.screen && item.screen.trim() !== '') {
          navigation.navigate(item.screen);
        }
      }}>
      <View style={styles.settingContent}>
        <View style={styles.settingIconWrapper}>
          <Icon name={item.icon} size={18} color="#0A66C2" />
        </View>
        <View style={styles.settingTextContainer}>
          <Text style={styles.settingTitle}>{item.title}</Text>
          <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
        </View>
        <Icon name="chevron-right" size={20} color="#999" />
      </View>
    </TouchableOpacity>
  );

  const getUserInitials = () => {
    const name = userData?.name || userData?.employeeName || 'Username';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <ActionPaneContainer
      pageTitle="Profile"
      isBackButton={false}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      showTabNavigator={false}
      onRefresh={() => handleRefresh()}>
      {isLoading ? (
        <CustomIndicator />
      ) : (
        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
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
              <View style={styles.profileHeader}>
                <View style={styles.avatarContainer}>
                  {profilePictureUrl ? (
                    <ProfilePictureEditor
                      isLoading={isLoading}
                      profilePictureUrl={profilePictureUrl}
                      onEdit={() => {}}
                      userData={userData}
                    />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarText}>{getUserInitials()}</Text>
                    </View>
                  )}
                </View>
                {/* <Text style={styles.profileName}>
                  {userData?.name || userData?.employeeName || 'Username'}
                </Text> */}
                {/* <Text style={styles.joinedDate}>
                  Joined {userData?.joinDate || 'August 17, 2023'}
                </Text> */}
              </View>

              {/* Settings Card */}
              <View style={styles.card}>
                {settingsItems.map(renderSettingItem)}
              </View>

              {/* SignOut Button */}
              <TouchableOpacity
                style={styles.signOutButton}
                onPress={handleLogout}>
                <Text style={styles.signOutText}>Log out</Text>
              </TouchableOpacity>

              {/* Version Info */}
              <View style={styles.versionContainer}>
                <Text style={styles.versionText}>Version 1.18.5 (1185001)</Text>
                <Text style={styles.versionText}>
                  ©2025-26 Powered by Maison
                </Text>
              </View>
            </KeyboardAvoidingView>
          </ScrollView>
        </View>
      )}

      <LogoutAlertModal
        visible={modalVisible}
        heading="Are you sure you want to logout?"
        text="Are you sure you want to logout?"
        onConfirm={confirmLogout}
        onCancel={cancelLogout}
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

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    paddingBottom: 30,
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 30,
  },
  avatarContainer: {
    // marginBottom: 16,
  },
  avatarFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8E3F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#6366F1',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  joinedDate: {
    fontSize: 14,
    color: '#666',
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  versionText: {
    fontSize: 12,
    color: '#999',
  },
  signOutButton: {
    marginHorizontal: 20,
    marginTop: 30,
    paddingVertical: 14,
    backgroundColor: '#ff6464ff',
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffffff',
  },
};

export default Profile;
