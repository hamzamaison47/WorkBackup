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
  StyleSheet,
} from 'react-native';
import {useSelector} from 'react-redux';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

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
  // Optional SECOND button, for an alert that offers a way forward as well as
  // a way out (e.g. "Register" on an unregistered-account failure). Set both
  // to render it. `onPress` keeps its existing meaning — dismiss — and stays
  // the only thing the overlay tap and the Android back button trigger, so a
  // navigating action can never fire by accident.
  actionText,
  onAction,
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
      // onPrimaryColor: text on the action button. Only the brand-coloured
      // button follows the palette token; the status colours stay white-on.
      info: {
        icon: 'information',
        iconColor: P.primaryStrong,
        primaryColor: P.primary,
        onPrimaryColor: P.onPrimary,
        iconBg: P.tint,
      },
      success: {
        icon: 'check-circle',
        iconColor: '#10B981',
        primaryColor: '#10B981',
        onPrimaryColor: '#FFFFFF',
        iconBg: '#ECFDF5',
      },
      warning: {
        icon: 'alert-circle',
        iconColor: '#F59E0B',
        primaryColor: '#F59E0B',
        onPrimaryColor: '#FFFFFF',
        iconBg: '#FEF3E7',
      },
      error: {
        icon: 'close-circle',
        iconColor: '#DC2626',
        primaryColor: '#DC2626',
        onPrimaryColor: '#FFFFFF',
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

  const handleActionPress = () => {
    onAction && onAction();
  };

  const hasAction = Boolean(actionText && onAction);

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
              {/* Icon Section */}
              <View style={styles.Alert_iconContainer}>
                <Animated.View
                  style={[
                    styles.Alert_iconBackground,
                    {
                      backgroundColor: alertConfig.iconBg,
                      transform: [{scale: pulseAnim}],
                    },
                  ]}>
                  <MaterialCommunityIcons
                    name={finalIconName}
                    size={styles.Alert_iconSize}
                    color={alertConfig.iconColor}
                  />
                </Animated.View>
              </View>

              {/* Content Section */}
              <View style={styles.Alert_contentContainer}>
                <Text style={styles.Alert_heading}>{heading}</Text>
                <Text style={styles.Alert_description}>{text}</Text>
              </View>

              {/* Action Buttons. One button unless a secondary action was
                  supplied, in which case dismiss sits on the left (outlined,
                  quiet) and the action on the right (brand-coloured). */}
              <View style={hasAction ? local.row : local.single}>
                <TouchableOpacity
                  style={[
                    styles.Alert_button,
                    hasAction
                      ? [local.rowButton, local.dismissButton]
                      : {backgroundColor: alertConfig.primaryColor},
                  ]}
                  onPress={handlePress}
                  activeOpacity={0.8}>
                  <Text
                    style={[
                      styles.Alert_buttonText,
                      hasAction
                        ? local.dismissButtonText
                        : {color: alertConfig.onPrimaryColor},
                    ]}>
                    {buttonText}
                  </Text>
                </TouchableOpacity>

                {hasAction && (
                  <TouchableOpacity
                    style={[
                      styles.Alert_button,
                      local.rowButton,
                      {backgroundColor: alertConfig.primaryColor},
                    ]}
                    onPress={handleActionPress}
                    activeOpacity={0.8}>
                    <Text
                      style={[
                        styles.Alert_buttonText,
                        {color: alertConfig.onPrimaryColor},
                      ]}>
                      {actionText}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// Two-button layout only. The single-button path keeps using the shared
// Alert_button style untouched, so the other screens render exactly as before.
const local = StyleSheet.create({
  single: {width: '100%'},
  row: {width: '100%', flexDirection: 'row'},
  rowButton: {
    flex: 1,
    width: 'auto',
    marginHorizontal: 4,
    shadowOpacity: 0,
    elevation: 0,
  },
  dismissButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  dismissButtonText: {color: '#374151'},
});

export default AlertModal;
