/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
  Animated,
} from 'react-native';
import {useSelector} from 'react-redux';
import {translate as t} from '../../store/utils/translate';

const {width, height} = Dimensions.get('window');

const LogoutAlertModal = ({visible, heading, text, onConfirm, onCancel}) => {
  const translateYAnim = useRef(new Animated.Value(300)).current;
  const overlayOpacityAnim = useRef(new Animated.Value(0)).current;
  const currentLanguage = useSelector(state => state.language.currentLanguage);

  useEffect(() => {
    if (visible) {
      // Open animation - slide up from bottom
      Animated.parallel([
        Animated.timing(overlayOpacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Close animation - slide down to bottom
      Animated.parallel([
        Animated.timing(overlayOpacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 300,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={onCancel}
      statusBarTranslucent={true}>
      <TouchableWithoutFeedback onPress={onCancel}>
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: overlayOpacityAnim,
            },
          ]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.modalContainer,
                {
                  transform: [{translateY: translateYAnim}],
                },
              ]}>
              {/* Icon/Visual Element */}
              <View style={styles.iconContainer}>
                <View style={styles.warningIcon}>
                  <Text style={styles.warningIconText}>!</Text>
                </View>
              </View>

              {/* Content */}
              <View style={styles.contentContainer}>
                <Text style={styles.heading}>{heading}</Text>
                {/* <Text style={styles.description}>{text}</Text> */}
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={onCancel}
                  activeOpacity={0.8}>
                  <Text style={styles.cancelButtonText}>
                    {t('common.cancel')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.confirmButton]}
                  onPress={onConfirm}
                  activeOpacity={0.8}>
                  <Text style={styles.confirmButtonText}>
                    {t('profile.logout')}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = {
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    width: Math.min(width * 0.85, 340),
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 25,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  warningIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3E7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#F59E0B',
  },
  warningIconText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#F59E0B',
  },
  contentContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 28,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  confirmButton: {
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
};

export default LogoutAlertModal;
