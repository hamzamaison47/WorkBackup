import React, {useState} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  I18nManager,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import Icon from 'react-native-vector-icons/Feather';
import RNRestart from 'react-native-restart';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LanguageModal = ({visible, onClose}) => {
  const {t, i18n} = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);

  const languages = [
    {
      code: 'en',
      name: t('languageModal.english'),
      nativeName: 'English',
      isRTL: false,
    },
    {
      code: 'ur',
      name: t('languageModal.urdu'),
      nativeName: 'اردو',
      isRTL: true,
    },
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language);
  const selectedLang = languages.find(lang => lang.code === selectedLanguage);

  const handleLanguageChange = async () => {
    if (selectedLanguage === i18n.language) {
      onClose();
      return;
    }

    const willChangeDirection = selectedLang.isRTL !== currentLanguage.isRTL;

    try {
      // Change language
      await i18n.changeLanguage(selectedLanguage);
      await AsyncStorage.setItem('@app_language', selectedLanguage);

      if (willChangeDirection) {
        // Set flag to skip login after restart
        await AsyncStorage.setItem('@skip_login_after_restart', 'true');

        // Force RTL
        I18nManager.forceRTL(selectedLang.isRTL);

        // Close modal first
        onClose();

        // Restart after a short delay (so modal closes first)
        setTimeout(() => {
          RNRestart.Restart();
        }, 300);
      } else {
        // Just close if direction doesn't change
        onClose();
      }
    } catch (error) {
      console.error('Error changing language:', error);
      onClose();
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.heading}>{t('languageModal.title')}</Text>
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
                onPress={() => setSelectedLanguage(language.code)}>
                <View style={styles.languageInfo}>
                  <Text style={styles.languageName}>{language.nativeName}</Text>
                  <Text style={styles.languageSubname}>({language.name})</Text>
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
              <Text style={styles.cancelButtonText}>
                {t('languageModal.cancel')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={handleLanguageChange}>
              <Text style={styles.buttonText}>
                {selectedLang?.isRTL !== currentLanguage?.isRTL
                  ? t('languageModal.applyRestart')
                  : t('languageModal.apply')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
  restartIcon: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  restartMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
});

export default LanguageModal;
