/* eslint-disable curly */
/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Animated,
  I18nManager,
  Platform,
} from 'react-native';
import RNQRGenerator from 'rn-qr-generator';
import QRCodeScanner from 'react-native-qrcode-scanner';
import Icon from 'react-native-vector-icons/FontAwesome';
import {launchImageLibrary} from 'react-native-image-picker';
import {useNavigation, useRoute} from '@react-navigation/native';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';

import {
  getAllConfigs,
  saveConfig,
  saveConfigWithId,
} from '../../Controller/secureConfig';
import {translate as t} from '../../store/utils/translate';
import {decryptQRData} from '../../Controller/decryptQRData';

import AlertModal from '../../components/Alert/AlertModal';

import styles from '../../styles/styles';
import {conditionalVerticalScale, iconSize} from '../../store/utils/scaling';

const secretKey = 'P@$sw0rd321';

const QRSetupScreen = () => {
  const [isScanning, setIsScanning] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [scanAnimation] = useState(new Animated.Value(0));
  const [isProcessingGalleryImage, setIsProcessingGalleryImage] =
    useState(false);

  const navigation = useNavigation();
  const route = useRoute();

  const isFromConfigSelection = route.params?.isFromConfigSelection || false;
  const returnScreen = route.params?.returnScreen || 'Login';

  // Scanning animation
  useEffect(() => {
    if (isScanning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanAnimation, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }
  }, [isScanning]);

  const extractTitle = configOrUrl => {
    try {
      const resource =
        typeof configOrUrl === 'string'
          ? configOrUrl
          : configOrUrl?.resource || '';

      if (!resource) return t('qrSetup.unknownConfig');

      let withoutProtocol = resource.replace(/(^\w+:|^)\/\//, '');
      const hostname = withoutProtocol.split('/')[0];
      const firstPart = hostname.split('.')[0];
      const hyphenParts = firstPart.split('-');

      if (hyphenParts.length >= 2) {
        return `${hyphenParts[0]}-${hyphenParts[1]}`;
      }

      return firstPart || 'Unknown Configuration';
    } catch (err) {
      console.error('extractTitle parsing error:', err);
      return t('qrSetup.unknownConfig');
    }
  };

  const processQRData = async qrData => {
    try {
      if (!qrData) throw new Error(t('qrSetup.noQRData'));

      const parsedData = decryptQRData(qrData, secretKey);
      console.log('QR decrypted successfully, keys:', Object.keys(parsedData));

      if (!parsedData || Object.keys(parsedData).length === 0) {
        throw new Error(t('qrSetup.invalidQRData'));
      }

      // Enhanced duplicate check
      const allConfigs = await getAllConfigs();
      const isDuplicate = allConfigs.some(config => {
        const configData = config.data;

        // Check multiple properties to determine duplicates
        const sameResource = configData.resource === parsedData.resource;
        const sameClientId = configData.client_id === parsedData.client_id;
        const sameGrantType = configData.grant_type === parsedData.grant_type;

        // Consider it a duplicate if core properties match
        return sameResource && sameClientId && sameGrantType;
      });

      if (isDuplicate) {
        const existingConfig = allConfigs.find(
          config =>
            config.data.resource === parsedData.resource &&
            config.data.client_id === parsedData.client_id,
        );
        console.log(existingConfig);
        setAlertMessage(
          t('qrSetup.duplicateConfig', {
            configName: existingConfig?.name || t('qrSetup.existingConfig'),
          }),
        );
        setAlertModal(true);
        return false;
      }

      if (isFromConfigSelection) {
        const configName = extractTitle(parsedData.resource);
        await saveConfigWithId(parsedData, configName);
        setAlertMessage(t('qrSetup.configAdded'));
        setAlertModal(true);

        setTimeout(() => {
          setAlertModal(false);
          navigation.navigate('ConfigSelectionScreen');
        }, 2000);
      } else {
        await saveConfig(parsedData);
        navigation.replace('Login');
      }

      return true;
    } catch (err) {
      console.log('Error with QR data:', err.message);
      setAlertMessage(t('qrSetup.qrNotRecognized'));
      setAlertModal(true);
      return false;
    }
  };

  const handleQRCodeRead = async e => {
    setIsScanning(false);
    console.log('QR Data scanned:', e);

    await processQRData(e.data);
    setTimeout(() => setIsScanning(true), 2000);
  };

  const handleScanFromGallery = async () => {
    try {
      // Check photo library permission
      const permissionType =
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.PHOTO_LIBRARY
          : Platform.Version >= 33
          ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
          : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;

      const permissionResult = await check(permissionType);

      if (permissionResult === RESULTS.DENIED) {
        const requestResult = await request(permissionType);
        if (requestResult !== RESULTS.GRANTED) {
          setAlertMessage(t('qrSetup.photoPermissionRequired'));
          setAlertModal(true);
          return;
        }
      } else if (permissionResult === RESULTS.BLOCKED) {
        setAlertMessage(t('qrSetup.photoPermissionBlocked'));
        setAlertModal(true);
        return;
      }

      // Launch image picker
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 1,
        includeBase64: false,
      });

      if (result.didCancel) {
        console.log('User cancelled image picker');
        return;
      }

      if (result.errorCode) {
        console.log('ImagePicker Error: ', result.errorMessage);
        setAlertMessage(t('qrSetup.imagePickerFailed'));
        setAlertModal(true);
        return;
      }

      if (result.assets && result.assets.length > 0) {
        setIsProcessingGalleryImage(true);
        setIsScanning(false);

        const imageUri = result.assets[0].uri;
        console.log('Selected image URI:', imageUri);

        try {
          // Detect QR code from the selected image
          const response = await RNQRGenerator.detect({
            uri: imageUri,
          });

          console.log('QR Detection Response:', response);

          if (response && response.values && response.values.length > 0) {
            const qrData = response.values[0];
            console.log('QR Data from image:', qrData);

            await processQRData(qrData);
          } else {
            setAlertMessage(t('qrSetup.noQRInImage'));
            setAlertModal(true);
          }
        } catch (error) {
          console.log('Error decoding QR from image:', error);
          setAlertMessage(t('qrSetup.qrReadFailed'));
          setAlertModal(true);
        } finally {
          setIsProcessingGalleryImage(false);
          setTimeout(() => setIsScanning(true), 2000);
        }
      }
    } catch (error) {
      console.error('Error in handleScanFromGallery:', error);
      setAlertMessage(t('qrSetup.imageProcessingError'));
      setAlertModal(true);
      setIsProcessingGalleryImage(false);
      setTimeout(() => setIsScanning(true), 2000);
    }
  };

  const handleSkipPress = () => setModalVisible(true);

  const handleSkipConfirm = () => {
    setModalVisible(false);
    if (isFromConfigSelection) {
      navigation.navigate('ConfigSelectionScreen');
    } else {
      navigation.replace('Login');
    }
  };

  useEffect(() => {
    const checkCameraPermission = async () => {
      const permissionType =
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.CAMERA
          : PERMISSIONS.ANDROID.CAMERA;

      const result = await check(permissionType);

      if (result === RESULTS.GRANTED) {
        setHasPermission(true);
      } else if (result === RESULTS.DENIED) {
        const requestResult = await request(permissionType);
        if (requestResult === RESULTS.GRANTED) {
          setHasPermission(true);
        } else if (requestResult === RESULTS.BLOCKED) {
          setAlertMessage(t('qrSetup.cameraPermissionRequired'));
          setAlertModal(true);
        }
      } else if (result === RESULTS.BLOCKED) {
        setAlertMessage(t('qrSetup.cameraPermissionRequired'));
        setAlertModal(true);
      } else if (result === RESULTS.LIMITED) {
        setHasPermission(true);
      }
    };

    checkCameraPermission();
  }, []);

  const handleAlertPress = () => {
    setAlertModal(false);
  };

  // const scanLineTranslate = scanAnimation.interpolate({
  //   inputRange: [0, 1],
  //   outputRange: [0, 250],
  // });
  const SCAN_FRAME_HEIGHT = conditionalVerticalScale(220, 250, 270, 320);
  const SCAN_LINE_HEIGHT = 2;

  const scanLineTranslate = scanAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCAN_FRAME_HEIGHT - SCAN_LINE_HEIGHT],
  });

  return (
    <View style={styles.QRSetup_Container}>
      {/* Header */}
      <View style={styles.QRSetup_Header}>
        {isFromConfigSelection && (
          <TouchableOpacity
            style={styles.QRSetup_BackButton}
            onPress={() => navigation.navigate('ConfigSelectionScreen')}
            activeOpacity={0.7}>
            <Icon
              name={I18nManager.isRTL ? 'arrow-right' : 'arrow-left'}
              size={iconSize.sm}
              color="#0A66C2"
            />
          </TouchableOpacity>
        )}

        <View style={styles.QRSetup_HeaderContent}>
          <View style={styles.QRSetup_IconBackground}>
            <Icon name="qrcode" size={iconSize.xl} color="#0A66C2" />
          </View>
          <Text style={styles.QRSetup_Title}>
            {isFromConfigSelection
              ? t('qrSetup.addConfig')
              : t('qrSetup.environmentSetup')}
          </Text>
          <Text style={styles.QRSetup_Subtitle}>
            {isFromConfigSelection
              ? t('qrSetup.scanToAdd')
              : t('qrSetup.scanToBegin')}
          </Text>
        </View>
      </View>

      {/* Scanner Container */}
      <View style={styles.QRSetup_ScannerWrapper}>
        <View style={styles.QRSetup_ScannerContainer}>
          {hasPermission ? (
            isScanning && !isProcessingGalleryImage ? (
              <>
                <QRCodeScanner
                  onRead={handleQRCodeRead}
                  reactivate={false}
                  showMarker={false}
                  cameraStyle={styles.QRSetup_Camera}
                />

                {/* Custom Scanner Overlay */}
                <View style={styles.QRSetup_Overlay}>
                  {/* Top overlay */}
                  <View style={styles.QRSetup_OverlaySection} />

                  {/* Middle section with scanner frame */}
                  <View style={styles.QRSetup_MiddleSection}>
                    <View style={styles.QRSetup_OverlaySection} />
                    <View style={styles.QRSetup_ScannerFrame}>
                      {/* Corner decorations */}
                      <View
                        style={[styles.QRSetup_Corner, styles.QRSetup_TopLeft]}
                      />
                      <View
                        style={[styles.QRSetup_Corner, styles.QRSetup_TopRight]}
                      />
                      <View
                        style={[
                          styles.QRSetup_Corner,
                          styles.QRSetup_BottomLeft,
                        ]}
                      />
                      <View
                        style={[
                          styles.QRSetup_Corner,
                          styles.QRSetup_BottomRight,
                        ]}
                      />

                      {/* Animated scan line */}
                      <Animated.View
                        style={[
                          styles.QRSetup_ScanLine,
                          {
                            transform: [{translateY: scanLineTranslate}],
                          },
                        ]}
                      />
                    </View>
                    <View style={styles.QRSetup_OverlaySection} />
                  </View>

                  {/* Bottom overlay */}
                  <View style={styles.QRSetup_OverlaySection} />
                </View>

                {/* Scanning Instructions */}
                <View style={styles.QRSetup_InstructionsContainer}>
                  <View style={styles.QRSetup_InstructionCard}>
                    <Icon
                      name="crosshairs"
                      size={iconSize.md}
                      color="#0A66C2"
                    />
                    <Text style={styles.QRSetup_InstructionText}>
                      {t('qrSetup.positionQR')}
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.QRSetup_ProcessingContainer}>
                <View style={styles.QRSetup_ProcessingCard}>
                  <ActivityIndicator size="large" color="#0A66C2" />
                  <Text style={styles.QRSetup_ProcessingText}>
                    {isProcessingGalleryImage
                      ? t('qrSetup.processingImage')
                      : t('qrSetup.processingQR')}
                  </Text>
                  <Text style={styles.QRSetup_ProcessingSubtext}>
                    {t('qrSetup.pleaseWait')}
                  </Text>
                </View>
              </View>
            )
          ) : (
            <View style={styles.QRSetup_PermissionContainer}>
              <View style={styles.QRSetup_PermissionCard}>
                <View style={styles.QRSetup_PermissionIcon}>
                  <Icon name="camera" size={iconSize.xl} color="#999" />
                </View>
                <Text style={styles.QRSetup_PermissionTitle}>
                  {t('qrSetup.cameraAccessRequired')}
                </Text>
                <Text style={styles.QRSetup_PermissionText}>
                  {t('qrSetup.grantCameraPermission')}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Footer Actions */}
      <View style={styles.QRSetup_Footer}>
        <View style={styles.QRSetup_FooterContent}>
          {/* Gallery Scan Button */}
          <TouchableOpacity
            style={styles.QRSetup_GalleryButton}
            onPress={handleScanFromGallery}
            activeOpacity={0.8}
            disabled={isProcessingGalleryImage}>
            <Icon
              name="picture-o"
              size={iconSize.xs}
              color="#fff"
              style={styles.QRSetup_ButtonIcon}
            />
            <Text style={styles.QRSetup_GalleryButtonText}>
              {t('qrSetup.scanFromGallery')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.QRSetup_SkipButton}
            onPress={handleSkipPress}
            activeOpacity={0.8}>
            <Icon
              name={isFromConfigSelection ? 'times' : 'forward'}
              size={iconSize.xs}
              color="#0A66C2"
              style={styles.QRSetup_ButtonIcon}
            />
            <Text style={styles.QRSetup_SkipButtonText}>
              {isFromConfigSelection
                ? t('common.cancel')
                : t('qrSetup.skipForNow')}
            </Text>
          </TouchableOpacity>

          <View style={styles.QRSetup_HelpContainer}>
            <Icon name="question-circle" size={iconSize.xs} color="#999" />
            <Text style={styles.QRSetup_HelpText}>{t('qrSetup.needHelp')}</Text>
          </View>
        </View>
      </View>

      {/* Skip Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.QRSetup_ModalOverlay}>
          <View style={styles.QRSetup_ModalContainer}>
            <View style={styles.QRSetup_ModalIconContainer}>
              <Icon
                name={
                  isFromConfigSelection
                    ? 'times-circle'
                    : 'exclamation-triangle'
                }
                size={iconSize.xl}
                color="#ff9800"
              />
            </View>

            <Text style={styles.QRSetup_ModalTitle}>
              {isFromConfigSelection
                ? t('qrSetup.cancelSetup')
                : t('qrSetup.skipSetup')}
            </Text>

            <Text style={styles.QRSetup_ModalMessage}>
              {isFromConfigSelection
                ? t('qrSetup.cancelSetupMessage')
                : t('qrSetup.skipSetupMessage')}
            </Text>

            <View style={styles.QRSetup_ModalButtons}>
              <TouchableOpacity
                style={styles.QRSetup_ModalButtonSecondary}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.8}>
                <Text style={styles.QRSetup_ModalButtonSecondaryText}>
                  {t('qrSetup.continueScanning')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.QRSetup_ModalButtonPrimary}
                onPress={handleSkipConfirm}
                activeOpacity={0.8}>
                <Text style={styles.QRSetup_ModalButtonPrimaryText}>
                  {isFromConfigSelection
                    ? t('qrSetup.cancelSetup')
                    : t('qrSetup.skip')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <AlertModal
        visible={alertModal}
        heading={t('qrSetup.configuration')}
        text={alertMessage}
        onPress={handleAlertPress}
      />
    </View>
  );
};

export default QRSetupScreen;
