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
  ActivityIndicator,
} from 'react-native';
import {useSelector} from 'react-redux';
import {translate as t} from '../../store/utils/translate';
import styles from '../../styles/styles';

const {width, height} = Dimensions.get('window');

// Scaling functions
const scale = size => (width / 375) * size;
const verticalScale = size => (height / 812) * size;
const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;
const fontScale = size => Math.min(scale(size), size + 4);

const AlertDeleteModal = ({
  visible,
  heading = t('modals.confirmDeletion'),
  text,
  onPress,
  onCancel,
  isProcessing = false,
}) => {
  const translateYAnim = useRef(new Animated.Value(300)).current;
  const overlayOpacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const currentLanguage = useSelector(state => state.language.currentLanguage);

  // Delete alert configuration
  const deleteConfig = {
    icon: 'alert-circle-outline',
    iconColor: '#DC2626',
    primaryColor: '#DC2626',
    iconBg: '#FEF2F2',
    secondaryColor: '#6B7280',
  };

  useEffect(() => {
    if (visible) {
      // Open animation
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
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Close animation
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
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Shake animation for attention
  const startShakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleDeletePress = () => {
    if (!isProcessing) {
      onPress && onPress();
      // Note: The modal will remain open until the parent component
      // sets isProcessing to false and then calls onCancel
    }
  };

  const handleCancelPress = () => {
    if (!isProcessing) {
      onCancel && onCancel();
    } else {
      startShakeAnimation();
    }
  };

  const handleOverlayPress = () => {
    if (!isProcessing) {
      onCancel && onCancel();
    } else {
      startShakeAnimation();
    }
  };

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={handleCancelPress}
      statusBarTranslucent={true}>
      <TouchableWithoutFeedback onPress={handleOverlayPress}>
        <Animated.View
          style={[
            deleteStyles.overlay,
            {
              opacity: overlayOpacityAnim,
            },
          ]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                deleteStyles.modalContainer,
                {
                  transform: [
                    {translateY: translateYAnim},
                    {scale: scaleAnim},
                    {translateX: shakeAnim},
                  ],
                },
              ]}>
              {/* Content Section */}
              <View style={deleteStyles.contentContainer}>
                <Text style={deleteStyles.heading}>{heading}</Text>
                <Text style={deleteStyles.description}>{text}</Text>
              </View>

              {/* Action Buttons */}
              <View style={deleteStyles.buttonContainer}>
                <TouchableOpacity
                  style={[
                    deleteStyles.button,
                    deleteStyles.secondaryButton,
                    isProcessing && deleteStyles.disabledButton,
                  ]}
                  onPress={handleCancelPress}
                  disabled={isProcessing}
                  activeOpacity={0.8}>
                  <Text style={deleteStyles.secondaryButtonText}>
                    {t('common.cancel')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    deleteStyles.button,
                    deleteStyles.primaryButton,
                    {backgroundColor: deleteConfig.primaryColor},
                    isProcessing && deleteStyles.processingButton,
                  ]}
                  onPress={handleDeletePress}
                  disabled={isProcessing}
                  activeOpacity={0.8}>
                  {isProcessing ? (
                    <View style={deleteStyles.processingButtonContent}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={deleteStyles.primaryButtonText}>
                        {t('modals.deleting')}
                      </Text>
                    </View>
                  ) : (
                    <Text style={deleteStyles.primaryButtonText}>
                      {t('buttons.delete')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// Modern delete modal styles
const deleteStyles = {
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(20),
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: moderateScale(24),
    paddingVertical: verticalScale(28),
    paddingHorizontal: scale(24),
    width: Math.min(width * 0.85, scale(340)),
    maxWidth: scale(340),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: verticalScale(20),
    },
    shadowOpacity: 0.25,
    shadowRadius: moderateScale(25),
    elevation: 25,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  iconBackground: {
    width: scale(64),
    height: scale(64),
    borderRadius: scale(32),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: moderateScale(2),
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  iconSize: fontScale(32),
  contentContainer: {
    alignItems: 'center',
    marginBottom: verticalScale(24),
  },
  heading: {
    fontSize: fontScale(20),
    fontWeight: '700',
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: verticalScale(12),
    lineHeight: fontScale(26),
  },
  description: {
    fontSize: fontScale(15),
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: fontScale(22),
    marginBottom: verticalScale(8),
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: scale(12),
  },
  button: {
    flex: 1,
    paddingVertical: verticalScale(14),
    paddingHorizontal: scale(20),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: verticalScale(48),
  },
  secondaryButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: moderateScale(1.5),
    borderColor: '#E5E7EB',
  },
  primaryButton: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: verticalScale(4),
    },
    shadowOpacity: 0.3,
    shadowRadius: moderateScale(8),
    elevation: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  processingButton: {
    opacity: 0.8,
  },
  secondaryButtonText: {
    fontSize: fontScale(15),
    fontWeight: '600',
    color: '#6B7280',
  },
  primaryButtonText: {
    fontSize: fontScale(15),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: verticalScale(8),
    gap: scale(8),
  },
  processingText: {
    fontSize: fontScale(14),
    color: '#DC2626',
    fontWeight: '500',
  },
  processingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
  },
};

export default AlertDeleteModal;
