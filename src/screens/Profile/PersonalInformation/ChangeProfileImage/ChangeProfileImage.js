// export default ChangeProfileImage;
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable curly */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Text,
  TouchableOpacity,
  BackHandler,
  StyleSheet,
  PermissionsAndroid,
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
import useAppTokens from '../../../../components/AppComponentsDesign/useAppTokens';

// Adjust this if your enum2Str output differs (e.g. 'In Review')
const IN_REVIEW_STATUS = 'In review';

const ChangeProfileImage = () => {
  const navigation = useNavigation();
  const {userData} = useSelector(state => state.user);
  const T = useAppTokens();
  const CPI = useMemo(() => createCPIStyles(T), [T]);

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);
  const [isImageChanged, setIsImageChanged] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [approvalStatus, setApprovalStatus] = useState(null);

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
      console.log('here is the data', data);

      if (imageData?.StringImage) {
        const cleanBase64 = imageData.StringImage.replace(/\s/g, '');
        const base64Image = `data:image/png;base64,${cleanBase64}`;
        setProfilePictureUrl(base64Image);
      } else {
        setProfilePictureUrl(null);
      }

      setApprovalStatus(imageData?.ApprovalStatus ?? null);
    } catch (error) {
      console.error('Failed to fetch profile picture:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const isPendingApproval = approvalStatus === IN_REVIEW_STATUS;

  const handleProfileImageEdit = () => {
    if (isPendingApproval) return;

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

  const requestCameraPermission = async () => {
    if (Platform.OS !== 'android') return true;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'This app needs access to your camera to take photos.',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  const handleTakePhoto = async () => {
    if (isPendingApproval) return;

    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      setAlertMessage('Camera permission is required to take a photo.');
      setAlertModal(true);
      return;
    }

    const options = {
      mediaType: 'photo',
      includeBase64: true,
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800,
    };

    ImagePicker.launchCamera(options, response => {
      console.log('[TakePhoto] response:', JSON.stringify(response));
      if (response.didCancel) return;
      if (response.errorCode) {
        console.log(
          '[TakePhoto] error:',
          response.errorCode,
          response.errorMessage,
        );
        setAlertMessage('Unable to open camera. Please try again.');
        setAlertModal(true);
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

      const response = await UpdateByEmployeeId({
        employeeId: userData.employeeId,
        stringImage: base64Image,
      });

      // The X++ GeneralContract message reads like "<id> is created." or
      // "<id> is updated." — use that to decide which copy to show.
      const wasCreated = response?.message?.toLowerCase().includes('created');

      setAlertMessage(
        wasCreated
          ? 'Profile Picture created and submitted successfully'
          : 'Profile Picture updated and submitted successfully',
      );

      setIsImageChanged(false);
      setAlertModal(true);

      // Refresh so ApprovalStatus reflects the new InReview state
      // and the gallery/camera buttons disable themselves.
      fetchProfilePicture();
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
        <View
          style={[styles.DLP_LoadingContainer, {backgroundColor: T.pageBg}]}>
          <CustomIndicator />
        </View>
      ) : (
        <View style={CPI.container}>
          <ScrollView
            contentContainerStyle={CPI.scrollContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={fetchProfilePicture}
                tintColor={T.blue}
                colors={[T.blue]}
              />
            }
            showsVerticalScrollIndicator={false}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{flex: 1}}>
              <Text style={CPI.title}>Your Profile Picture</Text>
              <Text style={CPI.subtitle}>
                Upload a clear image of yourself to keep your account updated.
              </Text>

              <View style={CPI.imageWrapper}>
                <ProfilePictureEditor
                  isLoading={isLoading}
                  profilePictureUrl={profilePictureUrl}
                  onEdit={handleProfileImageEdit}
                  userData={userData}
                />
              </View>

              {/* Gallery & Camera Buttons */}
              <View style={CPI.actionButtonsContainer}>
                <TouchableOpacity
                  style={[
                    CPI.button,
                    CPI.secondaryButton,
                    isPendingApproval && CPI.disabled,
                  ]}
                  disabled={isPendingApproval}
                  onPress={handleProfileImageEdit}>
                  <Text style={[CPI.buttonText, CPI.buttonTextSecondary]}>
                    Choose from Gallery
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    CPI.button,
                    CPI.secondaryButton,
                    isPendingApproval && CPI.disabled,
                  ]}
                  disabled={isPendingApproval}
                  onPress={handleTakePhoto}>
                  <Text style={[CPI.buttonText, CPI.buttonTextSecondary]}>
                    Take Photo
                  </Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </ScrollView>

          {/* Save & Cancel Buttons */}
          {isImageChanged && (
            <View style={CPI.actionButtonsContainer}>
              <TouchableOpacity
                style={[CPI.button, CPI.secondaryButton]}
                onPress={() => {
                  fetchProfilePicture();
                  setIsImageChanged(false);
                }}>
                <Text style={[CPI.buttonText, CPI.buttonTextSecondary]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[CPI.button, CPI.primaryButton]}
                onPress={handleSaveChanges}
                disabled={isLoading}>
                <Text style={[CPI.buttonText, CPI.buttonTextPrimary]}>
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

// ─────────────────────────────────────────────────────────────
// Theme-aware CPI_* styles — createStyles(T) factory, same pattern
// as bulkAllStyles/getDSRStyles elsewhere. Recomputes on theme change.
// ─────────────────────────────────────────────────────────────
const createCPIStyles = T =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: T.pageBg,
    },
    scrollContainer: {
      flexGrow: 1,
      padding: 20,
      backgroundColor: T.formPageBg,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: T.titleText,
      textAlign: 'center',
      marginTop: 8,
    },
    subtitle: {
      fontSize: 13,
      color: T.subtitleText,
      textAlign: 'center',
      marginTop: 6,
      marginBottom: 20,
      paddingHorizontal: 12,
    },
    imageWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
    },
    actionButtonsContainer: {
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 4,
      paddingVertical: 12,
    },
    button: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    secondaryButton: {
      backgroundColor: T.cardBg,
      borderColor: T.inputBorder,
    },
    primaryButton: {
      backgroundColor: T.blue,
      borderColor: T.blue,
    },
    disabled: {
      opacity: 0.5,
    },
    buttonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    buttonTextSecondary: {
      color: T.titleText,
    },
    buttonTextPrimary: {
      color: '#FFFFFF',
    },
  });

export default ChangeProfileImage;
