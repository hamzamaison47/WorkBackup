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
import styles from '../../styles/styles';
import usePalette from '../../hooks/usePalette';

const AlertModal = ({
  visible,
  heading = t('common.alert'),
  text,
  onPress,
  type = 'info',
  iconName,
  buttonText = t('common.ok'),
}) => {
  const translateYAnim = useRef(new Animated.Value(300)).current;
  const overlayOpacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const currentLanguage = useSelector(state => state.language.currentLanguage);
  const P = usePalette();

  // Get configuration based on alert type
  const getAlertConfig = () => {
    const configs = {
      info: {
        icon: 'information-outline',
        iconColor: P.primary,
        primaryColor: P.primary,
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
            styles.Alert_overlay,
            {
              opacity: overlayOpacityAnim,
            },
          ]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.Alert_modalContainer,
                {
                  transform: [{translateY: translateYAnim}, {scale: scaleAnim}],
                },
              ]}>
              {/* Content Section */}
              <View style={styles.Alert_contentContainer}>
                <Text style={styles.Alert_heading}>{heading}</Text>
                <Text style={styles.Alert_description}>{text}</Text>
              </View>

              {/* Action Button */}
              <TouchableOpacity
                style={[
                  styles.Alert_button,
                  {backgroundColor: alertConfig.primaryColor},
                ]}
                onPress={handlePress}
                activeOpacity={0.8}>
                <Text style={styles.Alert_buttonText}>{buttonText}</Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default AlertModal;
