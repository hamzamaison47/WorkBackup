/* eslint-disable no-unused-vars */
import React, {useState, useEffect} from 'react';
import {View, Text, Modal, TouchableOpacity, I18nManager} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import RNRestart from 'react-native-restart';
import {useDispatch, useSelector} from 'react-redux';

import {persistor} from '../../store';
import {
  setLanguage,
  setSkipLoginAfterRestart,
} from '../../store/slices/languageSlice';
import ConfirmationAlert from './ConfirmationAlert';
import {translate as t} from '../../store/utils/translate';
import styles from '../../styles/styles';
import usePalette from '../../hooks/usePalette';

const LanguageModal = ({visible, onClose}) => {
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const dispatch = useDispatch();

  // Select data from Redux store
  const currentLanguage = useSelector(state => state.language.currentLanguage);
  const accessToken = useSelector(state => state.auth.accessToken);
  const idToken = useSelector(state => state.auth.idToken);
  const userToken = useSelector(state => state.auth.userToken);
  const userData = useSelector(state => state.user.userData);
  const P = usePalette();

  // Initialize selected language when component mounts or currentLanguage changes
  useEffect(() => {
    if (currentLanguage) {
      setSelectedLanguage(currentLanguage);
    }
  }, [currentLanguage]);

  // Update selected language when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedLanguage(currentLanguage);
    }
  }, [visible, currentLanguage]);

  const getLanguages = () => {
    return [
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
      // {
      //   code: 'ur',
      //   apiCode: 'ur',
      //   name: 'Urdu',
      //   nativeName: 'اردو',
      //   isRTL: true,
      // },
    ];
  };

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

    const languages = getLanguages();
    const selectedLang = languages.find(lang => lang.code === selectedLanguage);
    const currentLang = languages.find(lang => lang.code === currentLanguage);

    try {
      // Update Redux with new format (includes API code)
      dispatch(
        setLanguage({
          code: selectedLang.code,
          apiCode: selectedLang.apiCode,
          isRTL: selectedLang.isRTL,
        }),
      );

      // Check for active session
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

      // Restart app after a short delay
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
    setSelectedLanguage(currentLanguage);
  };

  const languages = getLanguages();

  return (
    <>
      <Modal
        transparent
        visible={visible}
        animationType="slide"
        onRequestClose={onClose}>
        <View style={styles.LanguageModal_overlay}>
          <View style={styles.LanguageModal_modal}>
            <View style={styles.LanguageModal_header}>
              <Text style={styles.LanguageModal_heading}>
                {t('languageModal.title')}
              </Text>
              <TouchableOpacity
                onPress={onClose}
                style={styles.LanguageModal_closeButton}>
                <Icon name="x" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.LanguageModal_languageList}>
              {languages.map(language => (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.LanguageModal_languageItem,
                    selectedLanguage === language.code &&
                      styles.LanguageModal_selectedItem,
                  ]}
                  onPress={() => handleLanguageSelection(language.code)}>
                  <View style={styles.LanguageModal_languageInfo}>
                    <Text style={styles.LanguageModal_languageName}>
                      {language.nativeName}
                    </Text>
                    <Text style={styles.LanguageModal_languageSubname}>
                      ({language.name})
                    </Text>
                  </View>
                  {selectedLanguage === language.code && (
                    <Icon
                      name="check-circle"
                      size={24}
                      color={P.primaryStrong}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.LanguageModal_buttonRow}>
              <TouchableOpacity
                style={[
                  styles.LanguageModal_button,
                  styles.LanguageModal_cancelButton,
                ]}
                onPress={onClose}>
                <Text style={styles.LanguageModal_cancelButtonText}>
                  {t('languageModal.cancel')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirmation Alert Modal */}
      <ConfirmationAlert
        visible={showConfirmModal}
        heading={t('languageModal.changeLanguage')}
        text={t('languageModal.confirmMessage')}
        primaryButtonText={t('languageModal.yesChange')}
        secondaryButtonText={t('languageModal.cancel')}
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

export default LanguageModal;
