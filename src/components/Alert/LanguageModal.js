/* eslint-disable no-unused-vars */
import React, {useState} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  I18nManager,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import RNRestart from 'react-native-restart';
import {useDispatch, useSelector} from 'react-redux';
import {persistor} from '../../store';
import {
  setLanguage,
  setSkipLoginAfterRestart,
} from '../../store/slices/languageSlice';
import ConfirmationAlert from './ConfirmationAlert';

const LanguageModal = ({visible, onClose}) => {
  const dispatch = useDispatch();
  const currentLanguage = useSelector(state => state.language.currentLanguage);
  const accessToken = useSelector(state => state.auth.accessToken);
  const idToken = useSelector(state => state.auth.idToken);
  const userToken = useSelector(state => state.auth.userToken);
  const userData = useSelector(state => state.user.userData);
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const languages = [
    {
      code: 'en',
      apiCode: 'en-us',
      name: 'English',
      nativeName: 'English',
      isRTL: false,
    },
    {
      code: 'ar',
      apiCode: 'ar',
      name: 'Arabic',
      nativeName: 'العربية',
      isRTL: true,
    },
  ];

  const currentLang = languages.find(lang => lang.code === currentLanguage);
  const selectedLang = languages.find(lang => lang.code === selectedLanguage);

  const handleLanguageSelection = languageCode => {
    setSelectedLanguage(languageCode);

    // Show confirmation only if language is different
    if (languageCode !== currentLanguage) {
      setShowConfirmModal(true);
    } else {
      onClose();
    }
  };

  const handleLanguageChange = async () => {
    if (selectedLanguage === currentLanguage) {
      onClose();
      return;
    }

    const willChangeDirection = selectedLang.isRTL !== currentLang.isRTL;

    try {
      // Update Redux with new format (includes API code)
      dispatch(
        setLanguage({
          code: selectedLang.code,
          apiCode: selectedLang.apiCode,
          isRTL: selectedLang.isRTL,
        }),
      );

      // Always restart app to ensure API calls use new language code
      const hasSession = Boolean(
        accessToken || idToken || userToken || userData?.employeeId,
      );

      dispatch(setSkipLoginAfterRestart(hasSession));

      // Force RTL if the selected language is RTL
      if (selectedLang.isRTL) {
        I18nManager.forceRTL(true);
      } else {
        I18nManager.forceRTL(false);
      }

      onClose();

      setTimeout(() => {
        const persistAndRestart = async () => {
          try {
            await persistor.flush();
          } catch (e) {
            console.error('Persistor flush error:', e);
          }

          RNRestart.Restart();
        };

        persistAndRestart();
      }, 300);
    } catch (error) {
      console.error('Error changing language:', error);
      onClose();
    }
  };

  const handleCancelChange = () => {
    setShowConfirmModal(false);
    // Reset selection to current language
    setSelectedLanguage(currentLanguage);
  };

  return (
    <>
      <Modal
        transparent
        visible={visible}
        animationType="slide"
        onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.header}>
              <Text style={styles.heading}>Select Language</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Icon name="x" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.languageList}>
              {languages.map(language => (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.languageItem,
                    selectedLanguage === language.code && styles.selectedItem,
                  ]}
                  onPress={() => handleLanguageSelection(language.code)}>
                  <View style={styles.languageInfo}>
                    <Text style={styles.languageName}>
                      {language.nativeName}
                    </Text>
                    <Text style={styles.languageSubname}>
                      ({language.name})
                    </Text>
                  </View>
                  {selectedLanguage === language.code && (
                    <Icon name="check-circle" size={24} color="#0A66C2" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              {/* <TouchableOpacity
                style={[
                  styles.button,
                  styles.confirmButton,
                  selectedLanguage === currentLanguage && styles.disabledButton,
                ]}
                onPress={() => {
                  if (selectedLanguage !== currentLanguage) {
                    setShowConfirmModal(true);
                  }
                }}
                disabled={selectedLanguage === currentLanguage}>
                <Text style={styles.buttonText}>Apply & Restart</Text>
              </TouchableOpacity> */}
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirmation Alert Modal */}
      <ConfirmationAlert
        visible={showConfirmModal}
        heading="Change Language"
        text="Are you sure you want to change the language? The app will restart to apply the changes."
        primaryButtonText="Yes, Change"
        secondaryButtonText="Cancel"
        onPrimaryPress={() => {
          setShowConfirmModal(false);
          handleLanguageChange();
        }}
        onSecondaryPress={handleCancelChange}
        type="info"
      />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 300,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  closeButton: {
    padding: 5,
  },
  languageList: {
    marginBottom: 20,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#F8F9FA',
  },
  selectedItem: {
    backgroundColor: '#EEF2FF',
    borderWidth: 2,
    borderColor: '#0A66C2',
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginEnd: 8,
  },
  languageSubname: {
    fontSize: 14,
    color: '#666',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F1F1F1',
  },
  confirmButton: {
    backgroundColor: '#0A66C2',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default LanguageModal;
