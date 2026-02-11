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
} from 'react-native';
import {useSelector} from 'react-redux';
import {translate as t} from '../../store/utils/translate';
import styles from '../../styles/styles';

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
            styles.LogoutAlert_overlay,
            {
              opacity: overlayOpacityAnim,
            },
          ]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.LogoutAlert_modalContainer,
                {
                  transform: [{translateY: translateYAnim}],
                },
              ]}>
              {/* Icon/Visual Element */}
              <View style={styles.LogoutAlert_iconContainer}>
                <View style={styles.LogoutAlert_warningIcon}>
                  <Text style={styles.LogoutAlert_warningIconText}>!</Text>
                </View>
              </View>

              {/* Content */}
              <View style={styles.LogoutAlert_contentContainer}>
                <Text style={styles.LogoutAlert_heading}>{heading}</Text>
                {/* <Text style={styles.LogoutAlert_description}>{text}</Text> */}
              </View>

              {/* Action Buttons */}
              <View style={styles.LogoutAlert_buttonContainer}>
                <TouchableOpacity
                  style={[
                    styles.LogoutAlert_button,
                    styles.LogoutAlert_cancelButton,
                  ]}
                  onPress={onCancel}
                  activeOpacity={0.8}>
                  <Text style={styles.LogoutAlert_cancelButtonText}>
                    {t('common.cancel')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.LogoutAlert_button,
                    styles.LogoutAlert_confirmButton,
                  ]}
                  onPress={onConfirm}
                  activeOpacity={0.8}>
                  <Text style={styles.LogoutAlert_confirmButtonText}>
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

export default LogoutAlertModal;
