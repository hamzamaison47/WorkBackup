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

const {width, height} = Dimensions.get('window');

// Scaling functions
const scale = size => (width / 375) * size;
const verticalScale = size => (height / 812) * size;
const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;
const fontScale = size => Math.min(scale(size), size + 4);

const AlertModal = ({
  visible,
  heading = 'Alert',
  text,
  onPress,
  type = 'info',
  iconName,
  buttonText = 'OK',
}) => {
  const translateYAnim = useRef(new Animated.Value(300)).current;
  const overlayOpacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Get configuration based on alert type
  const getAlertConfig = () => {
    const configs = {
      info: {
        icon: 'information-outline',
        iconColor: '#0A66C2',
        primaryColor: '#0A66C2',
        iconBg: '#E3F2FD',
      },
      success: {
        icon: 'check-circle-outline',
        iconColor: '#10B981',
        primaryColor: '#10B981',
        iconBg: '#ECFDF5',
      },
      warning: {
        icon: 'alert-outline',
        iconColor: '#F59E0B',
        primaryColor: '#F59E0B',
        iconBg: '#FEF3E7',
      },
      error: {
        icon: 'close-circle-outline',
        iconColor: '#DC2626',
        primaryColor: '#DC2626',
        iconBg: '#FEF2F2',
      },
    };
    return configs[type] || configs.info;
  };

  const alertConfig = getAlertConfig();
  const finalIconName = iconName || alertConfig.icon;

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

      // Start pulse animation for icon
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ).start();
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

      // Reset pulse animation
      pulseAnim.setValue(1);
    }
  }, [visible]);

  const handlePress = () => {
    onPress && onPress();
  };

  const handleOverlayPress = () => {
    onPress && onPress();
  };

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={handlePress}
      statusBarTranslucent={true}>
      <TouchableWithoutFeedback onPress={handleOverlayPress}>
        <Animated.View
          style={[
            alertStyles.overlay,
            {
              opacity: overlayOpacityAnim,
            },
          ]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                alertStyles.modalContainer,
                {
                  transform: [{translateY: translateYAnim}, {scale: scaleAnim}],
                },
              ]}>
              {/* Content Section */}
              <View style={alertStyles.contentContainer}>
                <Text style={alertStyles.heading}>{heading}</Text>
                <Text style={alertStyles.description}>{text}</Text>
              </View>

              {/* Action Button */}
              <TouchableOpacity
                style={[
                  alertStyles.button,
                  {backgroundColor: alertConfig.primaryColor},
                ]}
                onPress={handlePress}
                activeOpacity={0.8}>
                <Text style={alertStyles.buttonText}>{buttonText}</Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// Modern alert modal styles
const alertStyles = {
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
    alignItems: 'center',
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
    width: '100%',
  },
  heading: {
    fontSize: fontScale(20),
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: verticalScale(12),
    lineHeight: fontScale(26),
  },
  description: {
    fontSize: fontScale(15),
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: fontScale(22),
  },
  button: {
    width: '100%',
    paddingVertical: verticalScale(14),
    paddingHorizontal: scale(20),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: verticalScale(48),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: verticalScale(4),
    },
    shadowOpacity: 0.3,
    shadowRadius: moderateScale(8),
    elevation: 8,
  },
  buttonText: {
    fontSize: fontScale(15),
    fontWeight: '600',
    color: '#FFFFFF',
  },
};

export default AlertModal;
