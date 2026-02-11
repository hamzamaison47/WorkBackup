/* eslint-disable react-native/no-inline-styles */
/* eslint-disable curly */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Text,
  TouchableOpacity,
  BackHandler,
} from 'react-native';
import * as ImagePicker from 'react-native-image-picker';
import {useSelector} from 'react-redux';
import {useNavigation, useFocusEffect} from '@react-navigation/native';

// Components
import ActionPaneContainer from '../../../../components/ActionPaneContainer';
import CustomIndicator from '../../../../components/CustomIndicator/CustomIndicator';
import AlertModal from '../../../../components/Alert/AlertModal';
import ProfilePictureEditor from '../../../../components/PersonalInformation/ProfilePictureEditor';

// API
import {ProfilePicture} from '../../../../API/PersonalInformation/ProfilePicture/ProfilePicture';
import {UpdateByEmployeeId} from '../../../../API/PersonalInformation/ProfilePicture/UpdateByEmployeeId';

// Styles
import styles from '../../../../styles/styles';

const ChangeProfileImage = () => {
  const navigation = useNavigation();
  const {userData} = useSelector(state => state.user);

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);
  const [isImageChanged, setIsImageChanged] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    fetchProfilePicture();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleGoBack();
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [navigation]),
  );

  const fetchProfilePicture = async () => {
    try {
      if (!userData?.employeeId) return;

      setIsLoading(true);
      const data = await ProfilePicture({employeeId: userData.employeeId});
      let imageData = Array.isArray(data) && data.length > 0 ? data[0] : data;

      if (imageData?.StringImage) {
        const cleanBase64 = imageData.StringImage.replace(/\s/g, '');
        const base64Image = `data:image/png;base64,${cleanBase64}`;
        setProfilePictureUrl(base64Image);
      } else {
        setProfilePictureUrl(null);
      }
    } catch (error) {
      console.error('Failed to fetch profile picture:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleProfileImageEdit = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: true,
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800,
    };

    ImagePicker.launchImageLibrary(options, response => {
      if (response.didCancel || response.error) return;

      if (response.assets && response.assets.length > 0) {
        const base64Image = response.assets[0].base64;
        if (base64Image) {
          setProfilePictureUrl(`data:image/jpeg;base64,${base64Image}`);
          setIsImageChanged(true);
        }
      }
    });
  };

  const handleTakePhoto = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: true,
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800,
    };

    ImagePicker.launchCamera(options, response => {
      if (response.didCancel || response.error) return;

      if (response.assets && response.assets.length > 0) {
        const base64Image = response.assets[0].base64;
        if (base64Image) {
          setProfilePictureUrl(`data:image/jpeg;base64,${base64Image}`);
          setIsImageChanged(true);
        }
      }
    });
  };

  const handleSaveChanges = async () => {
    try {
      setIsLoading(true);

      if (!profilePictureUrl) {
        setAlertMessage('No image to save');
        setAlertModal(true);
        return;
      }

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

  const handleGoBack = () => {
    navigation.navigate('DisplayPersonalInfo');
  };

  return (
    <ActionPaneContainer
      pageTitle="Change Profile Image"
      isBackButton={true}
      onBackPress={handleGoBack}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      showTabNavigator={true}
      onRefresh={() => fetchProfilePicture()}>
      {isLoading ? (
        <View style={styles.DLP_LoadingContainer}>
          <CustomIndicator />
        </View>
      ) : (
        <View style={styles.CPI_container}>
          <ScrollView
            contentContainerStyle={styles.CPI_scrollContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={fetchProfilePicture}
              />
            }
            showsVerticalScrollIndicator={false}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{flex: 1}}>
              <Text style={styles.CPI_title}>Your Profile Picture</Text>
              <Text style={styles.CPI_subtitle}>
                Upload a clear image of yourself to keep your account updated.
              </Text>

              <View style={styles.CPI_imageWrapper}>
                <ProfilePictureEditor
                  isLoading={isLoading}
                  profilePictureUrl={profilePictureUrl}
                  onEdit={handleProfileImageEdit}
                  userData={userData}
                />
              </View>

              {/* Gallery & Camera Buttons */}
              <View style={styles.CPI_actionButtonsContainer}>
                <TouchableOpacity
                  style={[styles.CPI_button, styles.CPI_secondaryButton]}
                  onPress={handleProfileImageEdit}>
                  <Text
                    style={[
                      styles.CPI_buttonText,
                      styles.CPI_buttonTextSecondary,
                    ]}>
                    Choose from Gallery
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.CPI_button, styles.CPI_secondaryButton]}
                  onPress={handleTakePhoto}>
                  <Text
                    style={[
                      styles.CPI_buttonText,
                      styles.CPI_buttonTextSecondary,
                    ]}>
                    Take Photo
                  </Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </ScrollView>

          {/* Save & Cancel Buttons */}
          {isImageChanged && (
            <View style={styles.CPI_actionButtonsContainer}>
              <TouchableOpacity
                style={[styles.CPI_button, styles.CPI_secondaryButton]}
                onPress={() => {
                  fetchProfilePicture();
                  setIsImageChanged(false);
                }}>
                <Text
                  style={[
                    styles.CPI_buttonText,
                    styles.CPI_buttonTextSecondary,
                  ]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.CPI_button, styles.CPI_primaryButton]}
                onPress={handleSaveChanges}
                disabled={isLoading}>
                <Text
                  style={[styles.CPI_buttonText, styles.CPI_buttonTextPrimary]}>
                  Save
                </Text>
              </TouchableOpacity>
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

export default ChangeProfileImage;
