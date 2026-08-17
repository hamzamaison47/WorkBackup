/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  ActivityIndicator,
} from 'react-native';
import {useSelector} from 'react-redux';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {translate as t} from '../../store/utils/translate';
import styles from '../../styles/styles';

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
    icon: 'trash-can',
    iconColor: '#DC2626',
    primaryColor: '#DC2626',
    iconBg: '#FEF2F2',
    secondaryColor: '#6B7280',
  };

  useEffect(() => {
    if (visible) {
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
          style={[styles.DeleteAlert_overlay, {opacity: overlayOpacityAnim}]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.DeleteAlert_modalContainer,
                {
                  transform: [
                    {translateY: translateYAnim},
                    {scale: scaleAnim},
                    {translateX: shakeAnim},
                  ],
                },
              ]}>
              {/* Icon Section */}
              <View style={styles.DeleteAlert_iconContainer}>
                <View
                  style={[
                    styles.DeleteAlert_iconBackground,
                    {backgroundColor: deleteConfig.iconBg},
                  ]}>
                  <MaterialCommunityIcons
                    name={deleteConfig.icon}
                    size={styles.DeleteAlert_iconSize}
                    color={deleteConfig.iconColor}
                  />
                </View>
              </View>

              {/* Content Section */}
              <View style={styles.DeleteAlert_contentContainer}>
                <Text style={styles.DeleteAlert_heading}>{heading}</Text>
                <Text style={styles.DeleteAlert_description}>{text}</Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.DeleteAlert_buttonContainer}>
                <TouchableOpacity
                  style={[
                    styles.DeleteAlert_button,
                    styles.DeleteAlert_secondaryButton,
                    isProcessing && styles.DeleteAlert_disabledButton,
                  ]}
                  onPress={handleCancelPress}
                  disabled={isProcessing}
                  activeOpacity={0.8}>
                  <Text style={styles.DeleteAlert_secondaryButtonText}>
                    {t('common.cancel')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.DeleteAlert_button,
                    styles.DeleteAlert_primaryButton,
                    {backgroundColor: deleteConfig.primaryColor},
                    isProcessing && styles.DeleteAlert_processingButton,
                  ]}
                  onPress={handleDeletePress}
                  disabled={isProcessing}
                  activeOpacity={0.8}>
                  {isProcessing ? (
                    <View style={styles.DeleteAlert_processingButtonContent}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.DeleteAlert_primaryButtonText}>
                        {t('modals.deleting')}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.DeleteAlert_primaryButtonText}>
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

export default AlertDeleteModal;
