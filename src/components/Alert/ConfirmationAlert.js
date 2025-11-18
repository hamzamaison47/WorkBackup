// /* eslint-disable no-unused-vars */
// /* eslint-disable react-hooks/exhaustive-deps */
// import React, {useEffect, useRef} from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   Modal,
//   TouchableWithoutFeedback,
//   Dimensions,
//   Animated,
// } from 'react-native';
// import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// const {width, height} = Dimensions.get('window');

// /**
//  * ConfirmationAlert - A modern, animated confirmation modal with customizable options
//  * @param {Object} props
//  * @param {boolean} props.visible - Whether the modal is visible
//  * @param {string} props.heading - Modal heading/title
//  * @param {string} props.text - Modal description text
//  * @param {string} props.primaryButtonText - Text for primary button (default: "Confirm")
//  * @param {string} props.secondaryButtonText - Text for secondary button (default: "Cancel")
//  * @param {function} props.onPrimaryPress - Primary button press handler
//  * @param {function} props.onSecondaryPress - Secondary button press handler
//  * @param {string} props.iconName - MaterialCommunityIcons name for the icon
//  * @param {string} props.iconColor - Color for the icon
//  * @param {string} props.primaryButtonColor - Custom color for primary button
//  * @param {string} props.type - Type of alert: 'info', 'warning', 'success', 'error'
//  */
// const ConfirmationAlert = ({
//   visible,
//   heading,
//   text,
//   primaryButtonText = 'Confirm',
//   secondaryButtonText = 'Cancel',
//   onPrimaryPress,
//   onSecondaryPress,
//   iconName,
//   iconColor,
//   primaryButtonColor,
//   type = 'info',
// }) => {
//   const translateYAnim = useRef(new Animated.Value(300)).current;
//   const overlayOpacityAnim = useRef(new Animated.Value(0)).current;
//   const scaleAnim = useRef(new Animated.Value(0.8)).current;

//   // Get configuration based on alert type
//   const getAlertConfig = () => {
//     const configs = {
//       info: {
//         icon: 'information-outline',
//         iconColor: '#0A66C2',
//         primaryColor: '#0A66C2',
//         iconBg: '#E3F2FD',
//       },
//       warning: {
//         icon: 'alert-outline',
//         iconColor: '#F59E0B',
//         primaryColor: '#F59E0B',
//         iconBg: '#FEF3E7',
//       },
//       success: {
//         icon: 'check-circle-outline',
//         iconColor: '#10B981',
//         primaryColor: '#10B981',
//         iconBg: '#ECFDF5',
//       },
//       error: {
//         icon: 'close-circle-outline',
//         iconColor: '#DC2626',
//         primaryColor: '#DC2626',
//         iconBg: '#FEF2F2',
//       },
//     };
//     return configs[type] || configs.info;
//   };

//   const alertConfig = getAlertConfig();
//   const finalIconName = iconName || alertConfig.icon;
//   const finalIconColor = iconColor || alertConfig.iconColor;
//   const finalPrimaryColor = primaryButtonColor || alertConfig.primaryColor;

//   useEffect(() => {
//     if (visible) {
//       // Open animation
//       Animated.parallel([
//         Animated.timing(overlayOpacityAnim, {
//           toValue: 1,
//           duration: 250,
//           useNativeDriver: true,
//         }),
//         Animated.spring(translateYAnim, {
//           toValue: 0,
//           tension: 80,
//           friction: 8,
//           useNativeDriver: true,
//         }),
//         Animated.spring(scaleAnim, {
//           toValue: 1,
//           tension: 80,
//           friction: 8,
//           useNativeDriver: true,
//         }),
//       ]).start();
//     } else {
//       // Close animation
//       Animated.parallel([
//         Animated.timing(overlayOpacityAnim, {
//           toValue: 0,
//           duration: 200,
//           useNativeDriver: true,
//         }),
//         Animated.timing(translateYAnim, {
//           toValue: 300,
//           duration: 250,
//           useNativeDriver: true,
//         }),
//         Animated.timing(scaleAnim, {
//           toValue: 0.8,
//           duration: 200,
//           useNativeDriver: true,
//         }),
//       ]).start();
//     }
//   }, [visible]);

//   const handlePrimaryPress = () => {
//     onPrimaryPress && onPrimaryPress();
//   };

//   const handleSecondaryPress = () => {
//     onSecondaryPress && onSecondaryPress();
//   };

//   return (
//     <Modal
//       animationType="none"
//       transparent={true}
//       visible={visible}
//       onRequestClose={handleSecondaryPress}
//       statusBarTranslucent={true}>
//       <TouchableWithoutFeedback onPress={handleSecondaryPress}>
//         <Animated.View
//           style={[
//             styles.overlay,
//             {
//               opacity: overlayOpacityAnim,
//             },
//           ]}>
//           <TouchableWithoutFeedback>
//             <Animated.View
//               style={[
//                 styles.modalContainer,
//                 {
//                   transform: [{translateY: translateYAnim}, {scale: scaleAnim}],
//                 },
//               ]}>
//               {/* Icon Section */}
//               <View style={styles.iconContainer}>
//                 <View
//                   style={[
//                     styles.iconBackground,
//                     {backgroundColor: alertConfig.iconBg},
//                   ]}>
//                   <MaterialCommunityIcons
//                     name={finalIconName}
//                     size={32}
//                     color={finalIconColor}
//                   />
//                 </View>
//               </View>

//               {/* Content Section */}
//               <View style={styles.contentContainer}>
//                 <Text style={styles.heading}>{heading}</Text>
//                 <Text style={styles.description}>{text}</Text>
//               </View>

//               {/* Action Buttons */}
//               <View style={styles.buttonContainer}>
//                 <TouchableOpacity
//                   style={[styles.button, styles.secondaryButton]}
//                   onPress={handleSecondaryPress}
//                   activeOpacity={0.8}>
//                   <Text style={styles.secondaryButtonText}>
//                     {secondaryButtonText}
//                   </Text>
//                 </TouchableOpacity>

//                 <TouchableOpacity
//                   style={[
//                     styles.button,
//                     styles.primaryButton,
//                     {backgroundColor: finalPrimaryColor},
//                   ]}
//                   onPress={handlePrimaryPress}
//                   activeOpacity={0.8}>
//                   <Text style={styles.primaryButtonText}>
//                     {primaryButtonText}
//                   </Text>
//                 </TouchableOpacity>
//               </View>
//             </Animated.View>
//           </TouchableWithoutFeedback>
//         </Animated.View>
//       </TouchableWithoutFeedback>
//     </Modal>
//   );
// };

// const styles = {
//   overlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.6)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//   },
//   modalContainer: {
//     backgroundColor: '#ffffff',
//     borderRadius: 24,
//     paddingVertical: 28,
//     paddingHorizontal: 24,
//     width: Math.min(width * 0.85, 340),
//     maxWidth: 340,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 20,
//     },
//     shadowOpacity: 0.25,
//     shadowRadius: 25,
//     elevation: 25,
//   },
//   iconContainer: {
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   iconBackground: {
//     width: 64,
//     height: 64,
//     borderRadius: 32,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 2,
//     borderColor: 'rgba(255, 255, 255, 0.3)',
//   },
//   contentContainer: {
//     alignItems: 'center',
//     marginBottom: 24,
//   },
//   heading: {
//     fontSize: 22,
//     fontWeight: '700',
//     color: '#1F2937',
//     textAlign: 'center',
//     marginBottom: 12,
//     lineHeight: 28,
//   },
//   description: {
//     fontSize: 16,
//     color: '#6B7280',
//     textAlign: 'center',
//     lineHeight: 24,
//   },
//   buttonContainer: {
//     flexDirection: 'row',
//     gap: 12,
//   },
//   button: {
//     flex: 1,
//     paddingVertical: 14,
//     paddingHorizontal: 20,
//     borderRadius: 12,
//     alignItems: 'center',
//     justifyContent: 'center',
//     minHeight: 48,
//   },
//   secondaryButton: {
//     backgroundColor: '#F9FAFB',
//     borderWidth: 1.5,
//     borderColor: '#E5E7EB',
//   },
//   primaryButton: {
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 4,
//     },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 8,
//   },
//   secondaryButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#6B7280',
//   },
//   primaryButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#FFFFFF',
//   },
// };

// export default ConfirmationAlert;

// /*
// 1. Basic Confirmation:
// <ConfirmationAlert
//   visible={showConfirm}
//   heading="Enable Biometric Login"
//   text="Are you sure you want to enable Face ID for your account?"
//   primaryButtonText="Enable"
//   onPrimaryPress={handleEnable}
//   onSecondaryPress={handleCancel}
//   type="info"
// />

// 2. Warning/Delete Confirmation:
// <ConfirmationAlert
//   visible={showDeleteConfirm}
//   heading="Delete Account"
//   text="This action cannot be undone. All your data will be permanently removed."
//   primaryButtonText="Delete"
//   onPrimaryPress={handleDelete}
//   onSecondaryPress={handleCancel}
//   type="error"
// />

// 3. Success Confirmation:
// <ConfirmationAlert
//   visible={showSuccess}
//   heading="Success!"
//   text="Your changes have been saved successfully."
//   primaryButtonText="OK"
//   secondaryButtonText={null} // Hide secondary button
//   onPrimaryPress={handleOK}
//   type="success"
// />

// 4. Custom Icon and Colors:
// <ConfirmationAlert
//   visible={showCustom}
//   heading="Custom Alert"
//   text="This is a custom alert with specific icon and colors."
//   primaryButtonText="Proceed"
//   iconName="shield-check"
//   iconColor="#8B5CF6"
//   primaryButtonColor="#8B5CF6"
//   onPrimaryPress={handleProceed}
//   onSecondaryPress={handleCancel}
// />
// */

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from '../../styles/styles';

const {width, height} = Dimensions.get('window');

/**
 * ConfirmationAlert - A modern, animated confirmation modal with customizable options
 * @param {Object} props
 * @param {boolean} props.visible - Whether the modal is visible
 * @param {string} props.heading - Modal heading/title
 * @param {string} props.text - Modal description text
 * @param {string} props.primaryButtonText - Text for primary button (default: "Confirm")
 * @param {string} props.secondaryButtonText - Text for secondary button (default: "Cancel")
 * @param {function} props.onPrimaryPress - Primary button press handler
 * @param {function} props.onSecondaryPress - Secondary button press handler
 * @param {string} props.iconName - MaterialCommunityIcons name for the icon
 * @param {string} props.iconColor - Color for the icon
 * @param {string} props.primaryButtonColor - Custom color for primary button
 * @param {string} props.type - Type of alert: 'info', 'warning', 'success', 'error'
 */
const ConfirmationAlert = ({
  visible,
  heading,
  text,
  primaryButtonText = 'Confirm',
  secondaryButtonText = 'Cancel',
  onPrimaryPress,
  onSecondaryPress,
  iconName,
  iconColor,
  primaryButtonColor,
  type = 'info',
}) => {
  const translateYAnim = useRef(new Animated.Value(300)).current;
  const overlayOpacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // Get configuration based on alert type
  const getAlertConfig = () => {
    const configs = {
      info: {
        icon: 'information-outline',
        iconColor: '#0A66C2',
        primaryColor: '#0A66C2',
        iconBg: '#E3F2FD',
      },
      warning: {
        icon: 'alert-outline',
        iconColor: '#F59E0B',
        primaryColor: '#F59E0B',
        iconBg: '#FEF3E7',
      },
      success: {
        icon: 'check-circle-outline',
        iconColor: '#10B981',
        primaryColor: '#10B981',
        iconBg: '#ECFDF5',
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
  const finalIconColor = iconColor || alertConfig.iconColor;
  const finalPrimaryColor = primaryButtonColor || alertConfig.primaryColor;

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

  const handlePrimaryPress = () => {
    onPrimaryPress && onPrimaryPress();
  };

  const handleSecondaryPress = () => {
    onSecondaryPress && onSecondaryPress();
  };

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={handleSecondaryPress}
      statusBarTranslucent={true}>
      <TouchableWithoutFeedback onPress={handleSecondaryPress}>
        <Animated.View
          style={[
            styles.ConfAlert_overlay,
            {
              opacity: overlayOpacityAnim,
            },
          ]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.ConfAlert_modalContainer,
                {
                  transform: [{translateY: translateYAnim}, {scale: scaleAnim}],
                },
              ]}>
              {/* Icon Section */}
              <View style={styles.ConfAlert_iconContainer}>
                <View
                  style={[
                    styles.ConfAlert_iconBackground,
                    {backgroundColor: alertConfig.iconBg},
                  ]}>
                  <MaterialCommunityIcons
                    name={finalIconName}
                    size={styles.ConfAlert_iconSize}
                    color={finalIconColor}
                  />
                </View>
              </View>

              {/* Content Section */}
              <View style={styles.ConfAlert_contentContainer}>
                <Text style={styles.ConfAlert_heading}>{heading}</Text>
                <Text style={styles.ConfAlert_description}>{text}</Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.ConfAlert_buttonContainer}>
                {secondaryButtonText && (
                  <TouchableOpacity
                    style={[
                      styles.ConfAlert_button,
                      styles.ConfAlert_secondaryButton,
                    ]}
                    onPress={handleSecondaryPress}
                    activeOpacity={0.8}>
                    <Text style={styles.ConfAlert_secondaryButtonText}>
                      {secondaryButtonText}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    styles.ConfAlert_button,
                    styles.ConfAlert_primaryButton,
                    {backgroundColor: finalPrimaryColor},
                  ]}
                  onPress={handlePrimaryPress}
                  activeOpacity={0.8}>
                  <Text style={styles.ConfAlert_primaryButtonText}>
                    {primaryButtonText}
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

export default ConfirmationAlert;
