/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect} from 'react';
import {
  View,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  RefreshControl,
} from 'react-native';
import * as ImagePicker from 'react-native-image-picker';
import {useSelector} from 'react-redux';

// Components
import ProfilePictureEditor from '../../components/PersonalInformation/ProfilePictureEditor';
import SaveButton from '../../components/PersonalInformation/SaveButton';
import AlertModal from '../../components/Alert/AlertModal';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';

// API imports
import {ProfilePicture} from '../../API/PersonalInformation/ProfilePicture/ProfilePicture';
import {UpdateByEmployeeId} from '../../API/PersonalInformation/ProfilePicture/UpdateByEmployeeId';
import styles from '../../styles/styles';

const DisplayPersonalInfo = () => {
  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);
  const [isImageChanged, setIsImageChanged] = useState(false);

  // Alert modal states
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // Redux selectors
  const {userData} = useSelector(state => state.user);

  // Effects
  useEffect(() => {
    initializeData();
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  // Initialize component data
  const initializeData = async () => {
    try {
      setIsLoading(true);
      await fetchProfilePicture();
    } catch (error) {
      console.error('Error initializing data:', error);
      setAlertMessage('Failed to load personal information');
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all data
  const fetchData = async () => {
    setIsLoading(true);
    setRefreshing(true);
    try {
      await fetchProfilePicture();
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsImageChanged(false);
    await fetchData();
  };

  // Fetch profile picture with error handling
  const fetchProfilePicture = async () => {
    try {
      if (!userData?.employeeId) {
        console.warn('Employee ID not available');
        return;
      }

      const data = await ProfilePicture({
        employeeId: userData.employeeId,
      });

      // Handle both array and object responses
      let imageData = null;
      if (Array.isArray(data) && data.length > 0) {
        imageData = data[0];
      } else if (data && typeof data === 'object') {
        imageData = data;
      }

      if (imageData?.StringImage) {
        const cleanBase64 = imageData.StringImage.replace(/\s/g, '');
        const base64Image = `data:image/png;base64,${cleanBase64}`;
        setProfilePictureUrl(base64Image);
      } else {
        setProfilePictureUrl(null);
      }
    } catch (error) {
      console.error('Failed to fetch profile picture:', error);
      setProfilePictureUrl(null);
    }
  };

  // Handle image edit
  const handleProfileImageEdit = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: true,
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800,
    };

    ImagePicker.launchImageLibrary(options, response => {
      if (response.didCancel || response.error) {
        return;
      }

      if (response.assets && response.assets.length > 0) {
        const base64Image = response.assets[0].base64;
        if (base64Image) {
          setProfilePictureUrl(`data:image/jpeg;base64,${base64Image}`);
          setIsImageChanged(true);
        }
      }
    });
  };

  // Save profile picture changes
  const handleSaveChanges = async () => {
    try {
      setIsLoading(true);

      if (!profilePictureUrl) {
        setAlertMessage('No image to save');
        setAlertModal(true);
        return;
      }

      // Extract base64 data
      const base64Image = profilePictureUrl.replace(
        /^data:image\/(png|jpg|jpeg);base64,/,
        '',
      );

      await UpdateByEmployeeId({
        employeeId: userData.employeeId,
        stringImage: base64Image,
      });

      setIsImageChanged(false);
      setAlertMessage('Profile picture updated successfully');
      setAlertModal(true);
    } catch (error) {
      console.error('Failed to update profile picture:', error);
      setAlertMessage('Failed to update profile picture');
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ActionPaneContainer
      pageTitle="Profile"
      isBackButton={false}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      onRefresh={() => handleRefresh()}>
      {isLoading ? (
        <CustomIndicator />
      ) : (
        <View style={styles.DPI_Container}>
          <ScrollView
            style={styles.DPI_ScrollView}
            contentContainerStyle={styles.DPI_ScrollContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }>
            <KeyboardAvoidingView
              style={styles.DPI_TopContainer}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
              <View style={styles.DPI_ImageContainer}>
                <ProfilePictureEditor
                  isLoading={isLoading}
                  profilePictureUrl={profilePictureUrl}
                  onEdit={handleProfileImageEdit}
                  userData={userData}
                />
              </View>
            </KeyboardAvoidingView>
          </ScrollView>

          {/* Fixed Save Button at bottom */}
          {isImageChanged && (
            <View style={styles.DPI_FixedButtonContainer}>
              <SaveButton isLoading={isLoading} onSave={handleSaveChanges} />
            </View>
          )}
        </View>
      )}

      <AlertModal
        visible={alertModal}
        heading="Alert"
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />
    </ActionPaneContainer>
  );
};

export default DisplayPersonalInfo;
