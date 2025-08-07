/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect} from 'react';
import {
  View,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Platform,
  Dimensions,
  RefreshControl,
} from 'react-native';
import * as ImagePicker from 'react-native-image-picker';
import {useSelector} from 'react-redux';

// Components
import ProfilePictureEditor from '../../components/PersonalInformation/ProfilePictureEditor';
import SaveButton from '../../components/PersonalInformation/SaveButton';
import {AlertModal} from '../../components/Alert/AlertModal';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';

// API imports
import {ProfilePicture} from '../../API/PersonalInformation/ProfilePicture/ProfilePicture';
import {UpdateByEmployeeId} from '../../API/PersonalInformation/ProfilePicture/UpdateByEmployeeId';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

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
  const {selectedLegalEntity, defaultLegalEntity} = useSelector(
    state => state.company,
  );
  const {userData} = useSelector(state => state.user);
  const companyToUse = selectedLegalEntity || defaultLegalEntity;

  // Effects
  useEffect(() => {
    initializeData();
  }, []);

  useEffect(() => {
    if (companyToUse) {
      fetchData(companyToUse);
    }
  }, [companyToUse]);

  // Initialize component data
  const initializeData = async () => {
    try {
      setIsLoading(true);
      await fetchProfilePicture(companyToUse);
    } catch (error) {
      console.error('Error initializing data:', error);
      setAlertMessage('Failed to load personal information');
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all data
  const fetchData = async (company = companyToUse) => {
    setIsLoading(true);
    setRefreshing(true);
    try {
      await fetchProfilePicture(company);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = async (company = companyToUse) => {
    setIsImageChanged(false);
    await fetchData(company);
  };

  // Fetch profile picture with error handling
  const fetchProfilePicture = async (company = companyToUse) => {
    try {
      if (!userData?.employeeId) {
        console.warn('Employee ID not available');
        return;
      }

      const data = await ProfilePicture({
        employeeId: userData.employeeId,
        defaultCompany: company,
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
        defaultCompany: companyToUse,
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
      onRefresh={() => handleRefresh(companyToUse)}>
      {isLoading ? (
        <CustomIndicator />
      ) : (
        <View style={styles.container}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }>
            <KeyboardAvoidingView
              style={styles.topContainer}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
              <View style={styles.imageContainer}>
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
            <View style={styles.fixedButtonContainer}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: screenHeight * 0.1, // Extra padding for fixed button
  },
  topContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  imageContainer: {
    paddingHorizontal: screenWidth * 0.05,
    paddingTop: screenHeight * 0.025,
    paddingBottom: screenHeight * 0.01,
    alignItems: 'center',
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: screenWidth * 0.025,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
});

export default DisplayPersonalInfo;
