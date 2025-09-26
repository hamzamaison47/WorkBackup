/* eslint-disable curly */
/* eslint-disable no-unused-vars */
/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import CryptoJS from 'crypto-js';
import QRCodeScanner from 'react-native-qrcode-scanner';
import Icon from 'react-native-vector-icons/FontAwesome';
import {saveConfig, saveConfigWithId} from '../../Controller/secureConfig';
import {useNavigation, useRoute} from '@react-navigation/native';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import {decryptQRData} from '../../Controller/decryptQRData';

import AlertModal from '../../components/Alert/AlertModal';

const secretKey = 'P@$sw0rd321';

const QRSetupScreen = () => {
  const [isScanning, setIsScanning] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const navigation = useNavigation();
  const route = useRoute();

  // Check if coming from ConfigSelectionScreen
  const isFromConfigSelection = route.params?.isFromConfigSelection || false;
  const returnScreen = route.params?.returnScreen || 'Login';

  // Handle QR Code Read
  const handleQRCodeRead = async e => {
    setIsScanning(false);
    console.log('QR Data scanned:', e);

    try {
      if (!e.data) throw new Error('No data found in QR code');

      // Decrypt + parse JSON (throws on failure)
      const parsedData = decryptQRData(e.data, secretKey);

      // SUCCESS: parsedData is your object from X++
      // Do NOT console.log the whole object in production (contains client_secret)
      console.log('QR decrypted successfully, keys:', Object.keys(parsedData));

      if (!parsedData || Object.keys(parsedData).length === 0) {
        throw new Error('Invalid QR code data');
      }

      if (isFromConfigSelection) {
        const configName = `Config ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
        await saveConfigWithId(parsedData, configName);
        setAlertMessage('Configuration added successfully!');
        setAlertModal(true);

        setTimeout(() => {
          setAlertModal(false);
          navigation.navigate('ConfigSelectionScreen');
        }, 2000);
      } else {
        await saveConfig(parsedData);
        navigation.replace('Login');
      }
    } catch (err) {
      console.log('Error with QR data:', err.message);
      setAlertMessage('QR code not recognized. Please try again.');
      setAlertModal(true);
    } finally {
      setTimeout(() => setIsScanning(true), 2000);
    }
  };

  // Skip button pressed
  const handleSkipPress = () => setModalVisible(true);

  // Handle skip confirmation
  const handleSkipConfirm = () => {
    setModalVisible(false);
    if (isFromConfigSelection) {
      navigation.navigate('ConfigSelectionScreen');
    } else {
      navigation.replace('Login');
    }
  };

  // Camera permission check
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
          setAlertMessage(
            'Camera permission is required. Please enable it from settings.',
          );
          setAlertModal(true);
        }
      } else if (result === RESULTS.BLOCKED) {
        // User previously denied and OS will not ask again
        setAlertMessage(
          'Camera permission is required. Please enable it from settings.',
        );
        setAlertModal(true);
      } else if (result === RESULTS.LIMITED) {
        setHasPermission(true);
      }
    };

    checkCameraPermission();
  }, []);

  const handleAlertPress = () => {
    setAlertModal(false);
    if (isFromConfigSelection) {
      navigation.navigate('ConfigSelectionScreen');
    } else {
      navigation.replace('Login');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {isFromConfigSelection && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('ConfigSelectionScreen')}>
            <Icon name="arrow-left" size={20} color="#0A66C2" />
          </TouchableOpacity>
        )}

        <View
          style={[
            styles.headerContent,
            isFromConfigSelection && {marginLeft: 40},
          ]}>
          <Icon
            name="qrcode"
            size={50}
            color="#0A66C2"
            style={styles.headerIcon}
          />
          <Text style={styles.title}>
            {isFromConfigSelection
              ? 'Add New Configuration'
              : 'Environment Setup'}
          </Text>
          <Text style={styles.info}>
            {isFromConfigSelection
              ? 'Scan QR code to add a new configuration'
              : 'Scan your environment configuration QR code to get started'}
          </Text>
        </View>
      </View>

      {/* Scanner area */}
      <View style={styles.scannerContainer}>
        {hasPermission ? (
          isScanning ? (
            <QRCodeScanner
              onRead={handleQRCodeRead}
              reactivate={false}
              showMarker={true}
              markerStyle={styles.marker}
              cameraStyle={styles.camera}
            />
          ) : (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color="#0A66C2" />
              <Text style={styles.processingText}>Processing QR code...</Text>
            </View>
          )
        ) : (
          <View style={styles.processingContainer}>
            <Text style={{color: '#fff'}}>
              Waiting for camera permission...
            </Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkipPress}>
          <Text style={styles.skipButtonText}>
            {isFromConfigSelection ? 'Cancel' : 'Skip for now'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.helpText}>
          Need help? Contact your system administrator for the configuration QR
          code.
        </Text>
      </View>

      {/* Custom Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {isFromConfigSelection ? 'Cancel Setup?' : 'Skip Setup?'}
            </Text>
            <Text style={styles.modalMessage}>
              {isFromConfigSelection
                ? 'Are you sure you want to cancel adding a new configuration?'
                : 'Are you sure you want to skip the environment setup?'}
            </Text>
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}>
                <Text style={styles.modalButtonText}>Continue Scanning</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.skipModalButton]}
                onPress={handleSkipConfirm}>
                <Text style={styles.modalButtonText}>
                  {isFromConfigSelection ? 'Cancel' : 'Skip'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <AlertModal
        visible={alertModal}
        heading="Configuration"
        text={alertMessage}
        onPress={handleAlertPress}
      />
    </View>
  );
};

export default QRSetupScreen;

// Styles
const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderColor: '#e6e6e6',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    position: 'absolute',
    left: 20,
    top: 60,
    zIndex: 1,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerIcon: {marginBottom: 15},
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  info: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    maxWidth: '80%',
  },
  scannerContainer: {flex: 1, backgroundColor: '#000'},
  camera: {height: '100%'},
  marker: {borderColor: '#0A66C2', borderWidth: 3, borderRadius: 10},
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  processingText: {color: '#fff', fontSize: 16, marginTop: 15},
  footer: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#e6e6e6',
  },
  skipButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0A66C2',
    marginBottom: 15,
  },
  skipButtonText: {color: '#0A66C2', fontSize: 16, fontWeight: '600'},
  helpText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
    maxWidth: '80%',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {fontSize: 20, fontWeight: 'bold', marginBottom: 10},
  modalMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  cancelButton: {backgroundColor: '#ccc'},
  skipModalButton: {backgroundColor: '#0A66C2'},
  modalButtonText: {color: '#fff', fontWeight: '600', fontSize: 16},
});
