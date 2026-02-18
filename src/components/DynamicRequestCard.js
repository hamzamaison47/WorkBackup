// /* eslint-disable react-native/no-inline-styles */
// /* eslint-disable curly */
// import React, {useState, useEffect, useRef} from 'react';
// import {View, Text, TouchableOpacity, Animated} from 'react-native';
// import FontAwesome from 'react-native-vector-icons/FontAwesome';
// import LinearGradient from 'react-native-linear-gradient';
// import styles from '../styles/styles';

// // Button type constants for header buttons
// const BUTTON_TYPES = {
//   EDIT: 'edit',
//   DELETE: 'delete',
//   ATTACHMENT: 'attachment',
//   SUBMIT: 'submit',
//   VIEW: 'view',
// };

// const DynamicRequestCard = ({
//   data = {},
//   fields = [],
//   headerConfig = {},
//   buttons = {}, // Now the ONLY source of button config
//   gradientColors = ['#6ee0ff', '#bddeff', '#cce6ff'],
//   highlightGradientColors = ['#E8F5E8', '#F0FFF0'],
//   isHighlighted = false,
//   expandableFields = [],
//   isExpandable = false, // Changed default to false
//   onButtonPress = () => {},
//   processingButtons = [],
//   showNavigationArrow = false,
//   isRTL = false,
// }) => {
//   const [expanded, setExpanded] = useState(false);
//   const arrowAnim = useRef(new Animated.Value(0)).current;
//   const animationIntervalRef = useRef(null);

//   useEffect(() => {
//     if (isHighlighted) {
//       console.log('Card highlighted');
//     }
//   }, [isHighlighted]);

//   // Continuous arrow animation every 3 seconds
//   useEffect(() => {
//     if (showNavigationArrow) {
//       const startAnimation = () => {
//         Animated.sequence([
//           Animated.timing(arrowAnim, {
//             toValue: 1,
//             duration: 300,
//             useNativeDriver: true,
//           }),
//           Animated.timing(arrowAnim, {
//             toValue: 0.8,
//             duration: 200,
//             useNativeDriver: true,
//           }),
//           Animated.timing(arrowAnim, {
//             toValue: 1,
//             duration: 200,
//             useNativeDriver: true,
//           }),
//           Animated.timing(arrowAnim, {
//             toValue: 0.8,
//             duration: 300,
//             useNativeDriver: true,
//           }),
//         ]).start();
//       };

//       startAnimation();
//       animationIntervalRef.current = setInterval(() => {
//         startAnimation();
//       }, 3000);

//       return () => {
//         if (animationIntervalRef.current) {
//           clearInterval(animationIntervalRef.current);
//         }
//       };
//     } else {
//       arrowAnim.setValue(0);
//       if (animationIntervalRef.current) {
//         clearInterval(animationIntervalRef.current);
//       }
//     }
//   }, [showNavigationArrow, arrowAnim]);

//   // Helper function to get gradient colors
//   const getGradientColors = () => {
//     return isHighlighted ? highlightGradientColors : gradientColors;
//   };

//   const formatValue = (value, fieldType) => {
//     switch (fieldType) {
//       case 'date': {
//         const d = new Date(value);
//         const month = String(d.getMonth() + 1).padStart(2, '0');
//         const day = String(d.getDate()).padStart(2, '0');
//         const year = d.getFullYear();
//         return `${month}/${day}/${year}`;
//       }
//       case 'currency':
//         return `${value}`;
//       case 'status':
//         return value;
//       case 'boolean':
//         return value;
//       default:
//         return value || '';
//     }
//   };

//   // Default button configurations (all hidden by default)
//   const defaultButtonConfigs = {
//     [BUTTON_TYPES.EDIT]: {
//       show: false,
//       text: 'Edit',
//       icon: 'pencil',
//       iconSize: 14,
//       iconColor: '#fff',
//       position: 'header',
//       style: 'icon',
//       backgroundColor: '#0A66C2',
//       customStyle: {},
//     },
//     [BUTTON_TYPES.DELETE]: {
//       show: false,
//       text: 'Delete',
//       icon: 'trash',
//       iconSize: 14,
//       iconColor: '#fff',
//       position: 'header',
//       style: 'icon',
//       backgroundColor: '#ff4444',
//       customStyle: {},
//     },
//     [BUTTON_TYPES.ATTACHMENT]: {
//       show: false,
//       text: 'Attachments',
//       icon: 'paperclip',
//       iconSize: 14,
//       iconColor: '#fff',
//       position: 'header',
//       style: 'icon',
//       backgroundColor: '#666',
//       customStyle: {},
//     },
//     [BUTTON_TYPES.SUBMIT]: {
//       show: false,
//       text: 'Submit',
//       icon: 'check',
//       iconSize: 14,
//       iconColor: '#fff',
//       position: 'header',
//       style: 'icon',
//       backgroundColor: '#28a745',
//       customStyle: {},
//     },
//     [BUTTON_TYPES.VIEW]: {
//       show: false,
//       text: 'View',
//       icon: 'eye',
//       iconSize: 14,
//       iconColor: '#fff',
//       position: 'header',
//       style: 'icon',
//       backgroundColor: '#17a2b8',
//       customStyle: {},
//     },
//   };

//   // Merge user-provided button configs with defaults
//   const getMergedButtonConfig = buttonType => {
//     const defaultConfig = defaultButtonConfigs[buttonType] || {};
//     const userConfig = buttons[buttonType] || {};

//     return {
//       ...defaultConfig,
//       ...userConfig,
//       show: userConfig.show === true, // Explicit true required
//     };
//   };

//   // Get all button types that are enabled
//   const getEnabledButtons = () => {
//     return Object.keys(buttons).filter(buttonType => {
//       const config = getMergedButtonConfig(buttonType);
//       return config.show === true;
//     });
//   };

//   // Separate buttons by position
//   const getButtonsByPosition = position => {
//     return getEnabledButtons().filter(buttonType => {
//       const config = getMergedButtonConfig(buttonType);
//       return config.position === position;
//     });
//   };

//   // Render field row
//   const renderField = (field, index) => {
//     const value = data[field.key];
//     const formattedValue = formatValue(value, field.type);

//     if (field.type === 'status') {
//       return (
//         <View key={index} style={styles.DRC_InfoBlock}>
//           <Text style={styles.DRC_StatusText}>{formattedValue}</Text>
//         </View>
//       );
//     }

//     if (field.type === 'boolean') {
//       return (
//         <View key={index} style={styles.DRC_InfoBlock}>
//           <Text style={styles.DRC_Label}>{field.label}:</Text>
//           <View
//             style={{flex: 1, alignItems: 'flex-end', justifyContent: 'center'}}>
//             {formattedValue === true ||
//             formattedValue === 'true' ||
//             formattedValue === 1 ||
//             formattedValue === '1' ? (
//               <FontAwesome name="check" size={16} color="#000000ff" />
//             ) : null}
//           </View>
//         </View>
//       );
//     }

//     return (
//       <View key={index} style={styles.DRC_InfoBlock}>
//         <Text style={styles.DRC_Label}>{field.label}:</Text>
//         <Text
//           style={[
//             styles.DRC_Value,
//             showNavigationArrow && styles.DRC_ValueWithArrow,
//           ]}>
//           {formattedValue}
//         </Text>
//       </View>
//     );
//   };

//   // Render button
//   const renderButton = buttonType => {
//     const buttonConfig = getMergedButtonConfig(buttonType);

//     if (!buttonConfig.show) return null;

//     const isProcessing = processingButtons.includes(buttonType);
//     const isDisabled =
//       buttonConfig.disabled || isProcessing || processingButtons.length > 0;

//     // For icon buttons
//     if (buttonConfig.style === 'icon') {
//       return (
//         <TouchableOpacity
//           key={buttonType}
//           onPress={() => onButtonPress(buttonType, data)}
//           disabled={isDisabled}
//           style={[
//             styles.DRC_IconButton,
//             {backgroundColor: buttonConfig.backgroundColor || '#0A66C2'},
//             isDisabled && styles.DRC_Disabled,
//             buttonConfig.customStyle,
//           ]}>
//           {isProcessing ? (
//             <FontAwesome
//               name="spinner"
//               size={buttonConfig.iconSize || 16}
//               color={buttonConfig.iconColor || '#fff'}
//             />
//           ) : (
//             buttonConfig.icon && (
//               <FontAwesome
//                 name={buttonConfig.icon}
//                 size={buttonConfig.iconSize || 16}
//                 color={isDisabled ? '#999' : buttonConfig.iconColor || '#fff'}
//               />
//             )
//           )}
//         </TouchableOpacity>
//       );
//     }

//     // For text buttons
//     return (
//       <TouchableOpacity
//         key={buttonType}
//         onPress={() => onButtonPress(buttonType, data)}
//         disabled={isDisabled}
//         style={[
//           styles.DRC_TextButton,
//           isDisabled && styles.DRC_Disabled,
//           buttonConfig.customStyle,
//         ]}>
//         {buttonConfig.icon && !isProcessing && (
//           <FontAwesome
//             name={buttonConfig.icon}
//             size={buttonConfig.iconSize || 16}
//             color={isDisabled ? '#999' : buttonConfig.iconColor || '#0A66C2'}
//           />
//         )}
//         {isProcessing && (
//           <FontAwesome
//             name="spinner"
//             size={buttonConfig.iconSize || 16}
//             color="#999"
//           />
//         )}
//         <Text
//           style={[
//             styles.DRC_TextButtonText,
//             isDisabled && styles.DRC_DisabledText,
//             {
//               color: isDisabled ? '#999' : buttonConfig.textColor || '#0A66C2',
//             },
//           ]}>
//           {isProcessing ? 'Processing...' : buttonConfig.text}
//         </Text>
//       </TouchableOpacity>
//     );
//   };

//   // Render navigation arrow with continuous animation
//   const renderNavigationArrow = () => {
//     if (!showNavigationArrow) return null;

//     const arrowStyle = {
//       transform: [
//         {
//           translateX: arrowAnim.interpolate({
//             inputRange: [0, 1],
//             outputRange: [0, 8],
//           }),
//         },
//         {
//           scale: arrowAnim.interpolate({
//             inputRange: [0, 1],
//             outputRange: [1, 1.2],
//           }),
//         },
//       ],
//       opacity: arrowAnim.interpolate({
//         inputRange: [0, 1],
//         outputRange: [1, 0.9],
//       }),
//     };

//     return (
//       <Animated.View style={[styles.DRC_NavigationArrow, arrowStyle]}>
//         <FontAwesome name="chevron-right" size={14} color="#0A66C2" />
//       </Animated.View>
//     );
//   };

//   const headerButtons = getButtonsByPosition('header');
//   const bottomButtons = getButtonsByPosition('bottom');
//   const hasHeaderButtons = headerButtons.length > 0;
//   const hasBottomButtons = bottomButtons.length > 0;
//   const shouldShowExpandToggle = isExpandable && expandableFields.length > 0;

//   return (
//     <View
//       style={[
//         styles.DRC_CardContainer,
//         isHighlighted && styles.DRC_HighlightedContainer,
//         showNavigationArrow && styles.DRC_ClickableContainer,
//       ]}>
//       <LinearGradient
//         colors={getGradientColors()}
//         start={{x: 0, y: 0}}
//         end={{x: 1, y: 1}}
//         style={styles.DRC_Card}>
//         {renderNavigationArrow()}

//         {/* Header */}
//         <View
//           style={[
//             styles.DRC_CardHeader,
//             isRTL && {flexDirection: 'row-reverse'},
//           ]}>
//           <View
//             style={[
//               showNavigationArrow
//                 ? styles.DRC_HeaderContentWithArrow
//                 : {flex: 1},
//               isRTL && {alignItems: 'flex-end'},
//             ]}>
//             {headerConfig.title && (
//               <Text
//                 style={[
//                   styles.DRC_CardHeaderText,
//                   isRTL && {textAlign: 'right'},
//                 ]}>
//                 {data[headerConfig.title.key] ||
//                   headerConfig.title.defaultValue}
//               </Text>
//             )}

//             {headerConfig.subtitle && (
//               <Text
//                 style={[
//                   styles.DRC_CardSubHeaderText,
//                   isRTL && {textAlign: 'right'},
//                 ]}>
//                 {data[headerConfig.subtitle.key] ||
//                   headerConfig.subtitle.defaultValue}
//               </Text>
//             )}
//           </View>

//           {hasHeaderButtons && (
//             <View
//               style={[
//                 styles.DRC_ButtonsContainer,
//                 showNavigationArrow && styles.DRC_ButtonsContainerWithArrow,
//                 isRTL && {flexDirection: 'row-reverse'},
//               ]}>
//               {headerButtons.map(buttonType => renderButton(buttonType))}
//             </View>
//           )}
//         </View>

//         {/* Main fields */}
//         {fields.map((field, index) => renderField(field, index))}

//         {/* Expandable fields */}
//         {expanded && expandableFields.length > 0 && (
//           <>
//             <View style={styles.DRC_SectionDivider} />
//             {expandableFields.map((field, index) => renderField(field, index))}
//           </>
//         )}

//         {/* Bottom section */}
//         {(shouldShowExpandToggle || hasBottomButtons) && (
//           <View
//             style={[
//               styles.DRC_BottomContainer,
//               !shouldShowExpandToggle &&
//                 hasBottomButtons &&
//                 styles.DRC_BottomContainerCollapsed,
//             ]}>
//             {shouldShowExpandToggle && (
//               <TouchableOpacity
//                 onPress={() => setExpanded(!expanded)}
//                 style={styles.DRC_ExpandToggle}>
//                 <FontAwesome
//                   name={expanded ? 'chevron-up' : 'chevron-down'}
//                   size={14}
//                   color="#fff"
//                 />
//               </TouchableOpacity>
//             )}

//             {hasBottomButtons && (
//               <View
//                 style={[
//                   styles.DRC_BottomButtonsContainer,
//                   !shouldShowExpandToggle &&
//                     styles.DRC_BottomButtonsContainerCollapsed,
//                 ]}>
//                 {bottomButtons.map(buttonType => renderButton(buttonType))}
//               </View>
//             )}
//           </View>
//         )}
//       </LinearGradient>
//     </View>
//   );
// };

// export default DynamicRequestCard;
// export {BUTTON_TYPES};

/* eslint-disable react-native/no-inline-styles */
/* eslint-disable curly */
import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import styles from '../styles/styles';

const {width} = Dimensions.get('window');

// Button type constants for header buttons
const BUTTON_TYPES = {
  EDIT: 'edit',
  DELETE: 'delete',
  ATTACHMENT: 'attachment',
  SUBMIT: 'submit',
  VIEW: 'view',
};

const COLOR_PALETTE = {
  primary: '#6366f1',
  primaryLight: '#818cf8',
  primarySoft: '#e0e7ff',
  success: '#10b981',
  successLight: '#d1fae5',
  danger: '#ef4444',
  dangerLight: '#fee2e2',
  warning: '#f59e0b',
  warningLight: '#fed7aa',
  info: '#3b82f6',
  infoLight: '#dbeafe',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
};

const DynamicRequestCard = ({
  data = {},
  fields = [],
  headerConfig = {},
  buttons = {},
  gradientColors = [
    COLOR_PALETTE.primaryLight,
    COLOR_PALETTE.primarySoft,
    '#f0f4ff',
  ],
  highlightGradientColors = ['#f0fdf4', '#dcfce7'],
  isHighlighted = false,
  expandableFields = [],
  isExpandable = false,
  onButtonPress = () => {},
  processingButtons = [],
  showNavigationArrow = false,
  isRTL = false,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [pressed, setPressed] = useState(false);

  const arrowAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const menuFadeAnim = useRef(new Animated.Value(0)).current;
  const animationIntervalRef = useRef(null);

  // Menu fade animation
  useEffect(() => {
    if (menuVisible) {
      Animated.timing(menuFadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(menuFadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [menuVisible, menuFadeAnim]);

  // Press animations
  const handlePressIn = () => {
    setPressed(true);
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      tension: 150,
      friction: 3,
    }).start();
  };

  const handlePressOut = () => {
    setPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 150,
      friction: 3,
    }).start();
  };

  // Highlight animation
  useEffect(() => {
    let animation;
    if (isHighlighted) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.02,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      );
      animation.start();
    } else {
      scaleAnim.setValue(1);
    }

    return () => {
      if (animation) {
        animation.stop();
      }
    };
  }, [isHighlighted, scaleAnim]);

  // Continuous arrow animation
  useEffect(() => {
    if (showNavigationArrow) {
      const startAnimation = () => {
        Animated.sequence([
          Animated.timing(arrowAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(arrowAnim, {
            toValue: 0.6,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      };

      startAnimation();
      animationIntervalRef.current = setInterval(startAnimation, 2500);

      return () => {
        if (animationIntervalRef.current) {
          clearInterval(animationIntervalRef.current);
        }
      };
    } else {
      arrowAnim.setValue(0);
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
    }
  }, [showNavigationArrow, arrowAnim]);

  const formatValue = (value, fieldType) => {
    if (value === null || value === undefined) return '—';

    switch (fieldType) {
      case 'date': {
        const d = new Date(value);
        if (isNaN(d.getTime())) return value;
        const months = [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec',
        ];
        return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
      }
      case 'currency': {
        const num = Number(value);
        if (isNaN(num)) return value;
        return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      }
      case 'number': {
        const n = Number(value);
        if (isNaN(n)) return value;
        return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      }
      case 'status':
        return value;
      case 'boolean':
        return value;
      default:
        return String(value) || '—';
    }
  };

  const getStatusColor = status => {
    const statusStr = String(status).toLowerCase();
    if (
      ['active', 'completed', 'approved', 'success', 'yes', 'true'].includes(
        statusStr,
      )
    ) {
      return {
        bg: COLOR_PALETTE.successLight,
        text: '#065f46',
        dot: COLOR_PALETTE.success,
      };
    }
    if (
      [
        'pending',
        'pending approval',
        'in review',
        'waiting',
        'processing',
        'in progress',
      ].includes(statusStr)
    ) {
      return {
        bg: COLOR_PALETTE.warningLight,
        text: '#92400e',
        dot: COLOR_PALETTE.warning,
      };
    }
    if (
      ['cancelled', 'rejected', 'failed', 'no', 'false'].includes(statusStr)
    ) {
      return {
        bg: COLOR_PALETTE.dangerLight,
        text: '#991b1b',
        dot: COLOR_PALETTE.danger,
      };
    }
    return {
      bg: COLOR_PALETTE.gray[100],
      text: COLOR_PALETTE.gray[700],
      dot: COLOR_PALETTE.gray[400],
    };
  };

  // Default button configurations
  const defaultButtonConfigs = {
    [BUTTON_TYPES.EDIT]: {
      show: false,
      text: 'Edit',
      icon: 'pencil',
      iconSize: 14,
      iconColor: '#fff',
      position: 'header',
      style: 'icon',
      backgroundColor: COLOR_PALETTE.primary,
      customStyle: {},
    },
    [BUTTON_TYPES.DELETE]: {
      show: false,
      text: 'Delete',
      icon: 'trash',
      iconSize: 14,
      iconColor: '#fff',
      position: 'header',
      style: 'icon',
      backgroundColor: COLOR_PALETTE.danger,
      customStyle: {},
    },
    [BUTTON_TYPES.ATTACHMENT]: {
      show: false,
      text: 'Attachments',
      icon: 'paperclip',
      iconSize: 14,
      iconColor: '#fff',
      position: 'header',
      style: 'icon',
      backgroundColor: COLOR_PALETTE.gray[500],
      customStyle: {},
    },
    [BUTTON_TYPES.SUBMIT]: {
      show: false,
      text: 'Submit',
      icon: 'check',
      iconSize: 14,
      iconColor: '#fff',
      position: 'bottom',
      style: 'icon',
      backgroundColor: COLOR_PALETTE.success,
      customStyle: {},
    },
    [BUTTON_TYPES.VIEW]: {
      show: false,
      text: 'View',
      icon: 'eye',
      iconSize: 14,
      iconColor: '#fff',
      position: 'header',
      style: 'icon',
      backgroundColor: COLOR_PALETTE.info,
      customStyle: {},
    },
  };

  const getMergedButtonConfig = buttonType => {
    const defaultConfig = defaultButtonConfigs[buttonType] || {};
    const userConfig = buttons[buttonType] || {};
    return {
      ...defaultConfig,
      ...userConfig,
      show: userConfig.show === true,
    };
  };

  const getEnabledButtons = () => {
    return Object.keys(buttons).filter(buttonType => {
      const config = getMergedButtonConfig(buttonType);
      return config.show === true;
    });
  };

  const getButtonsByPosition = position => {
    return getEnabledButtons().filter(buttonType => {
      const config = getMergedButtonConfig(buttonType);
      return config.position === position;
    });
  };

  const renderField = (field, index) => {
    const value = data[field.key];
    const formattedValue = formatValue(value, field.type);

    // Never show status fields here (they're shown in header)
    if (field.type === 'status') return null;

    // Check if we have a meaningful label
    const hasLabel = field.label && String(field.label).trim().length > 0;

    // ────────────────────────────────────────────────
    //  CASE 1: NO LABEL → full-width, left-aligned value
    // ────────────────────────────────────────────────
    if (!hasLabel) {
      return (
        <View key={index} style={styles.DRC_fieldRowNoLabel}>
          <View style={styles.DRC_fieldValueFull}>
            <Text
              style={[
                styles.DRC_fieldValueNoLabel,
                showNavigationArrow && styles.DRC_fieldValueNoLabelWithArrow,
                field.trend && styles.DRC_fieldValueWithTrend,
              ]}>
              {formattedValue}
            </Text>

            {field.trend && (
              <View style={styles.DRC_trendIndicator}>
                <FontAwesome
                  name={field.trend === 'up' ? 'arrow-up' : 'arrow-down'}
                  size={11}
                  color={
                    field.trend === 'up'
                      ? COLOR_PALETTE.success
                      : COLOR_PALETTE.danger
                  }
                />
              </View>
            )}
          </View>
        </View>
      );
    }

    // ────────────────────────────────────────────────
    //  CASE 2: HAS LABEL → normal label | value layout
    // ────────────────────────────────────────────────

    // Boolean field with badge
    if (field.type === 'boolean') {
      const isTrue =
        formattedValue === true ||
        formattedValue === 'true' ||
        formattedValue === 1 ||
        formattedValue === '1';

      return (
        <View key={index} style={styles.DRC_fieldRow}>
          <Text style={styles.DRC_fieldLabel}>{field.label}</Text>
          <View
            style={[
              styles.DRC_booleanBadge,
              isTrue ? styles.DRC_booleanTrue : styles.DRC_booleanFalse,
            ]}>
            <FontAwesome
              name={isTrue ? 'check' : 'times'}
              size={12}
              color={isTrue ? '#065f46' : COLOR_PALETTE.gray[400]}
            />
            {/* <Text
              style={[
                styles.DRC_booleanText,
                isTrue
                  ? styles.DRC_booleanTextTrue
                  : styles.DRC_booleanTextFalse,
              ]}>
              {isTrue ? 'Yes' : 'No'}
            </Text> */}
          </View>
        </View>
      );
    }

    // Default case: regular field with label + value on right
    return (
      <View key={index} style={styles.DRC_fieldRow}>
        <Text style={styles.DRC_fieldLabel}>{field.label}</Text>

        <View style={styles.DRC_fieldValueWrapper}>
          <Text
            style={[
              styles.DRC_fieldValue,
              showNavigationArrow && styles.DRC_fieldValueWithArrow,
            ]}>
            {formattedValue}
          </Text>

          {field.trend && (
            <View style={styles.DRC_trendIndicator}>
              <FontAwesome
                name={field.trend === 'up' ? 'arrow-up' : 'arrow-down'}
                size={10}
                color={
                  field.trend === 'up'
                    ? COLOR_PALETTE.success
                    : COLOR_PALETTE.danger
                }
              />
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderMenuButton = buttonType => {
    const buttonConfig = getMergedButtonConfig(buttonType);
    if (!buttonConfig.show) return null;

    const isProcessing = processingButtons.includes(buttonType);
    const isDisabled =
      buttonConfig.disabled || isProcessing || processingButtons.length > 0;

    return (
      <TouchableOpacity
        key={buttonType}
        onPress={() => {
          setMenuVisible(false);
          onButtonPress(buttonType, data);
        }}
        disabled={isDisabled}
        style={[
          styles.DRC_menuItem,
          isDisabled && styles.DRC_menuItemDisabled,
        ]}>
        <View style={styles.DRC_menuItemContent}>
          {isProcessing ? (
            <FontAwesome
              name="spinner"
              size={16}
              color={COLOR_PALETTE.gray[400]}
              style={[styles.DRC_menuIcon, styles.DRC_spinning]}
            />
          ) : (
            buttonConfig.icon && (
              <FontAwesome
                name={buttonConfig.icon}
                size={16}
                color={
                  isDisabled ? COLOR_PALETTE.gray[300] : COLOR_PALETTE.gray[600]
                }
                style={styles.DRC_menuIcon}
              />
            )
          )}
          <Text
            style={[
              styles.DRC_menuItemText,
              isDisabled && styles.DRC_menuItemTextDisabled,
            ]}>
            {isProcessing ? 'Processing...' : buttonConfig.text}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderButton = buttonType => {
    const buttonConfig = getMergedButtonConfig(buttonType);
    if (!buttonConfig.show) return null;

    const isProcessing = processingButtons.includes(buttonType);
    const isDisabled =
      buttonConfig.disabled || isProcessing || processingButtons.length > 0;

    if (buttonConfig.style === 'icon') {
      return (
        <TouchableOpacity
          key={buttonType}
          onPress={() => onButtonPress(buttonType, data)}
          disabled={isDisabled}
          style={[
            styles.DRC_iconButton,
            {
              backgroundColor:
                buttonConfig.backgroundColor || COLOR_PALETTE.primary,
            },
            isDisabled && styles.DRC_disabledButton,
            buttonConfig.customStyle,
          ]}>
          {isProcessing ? (
            <FontAwesome
              name="spinner"
              size={buttonConfig.iconSize || 14}
              color={buttonConfig.iconColor || '#fff'}
              style={styles.DRC_spinning}
            />
          ) : (
            buttonConfig.icon && (
              <FontAwesome
                name={buttonConfig.icon}
                size={buttonConfig.iconSize || 14}
                color={
                  isDisabled
                    ? COLOR_PALETTE.gray[300]
                    : buttonConfig.iconColor || '#fff'
                }
              />
            )
          )}
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={buttonType}
        onPress={() => onButtonPress(buttonType, data)}
        disabled={isDisabled}
        style={[
          styles.DRC_textButton,
          isDisabled && styles.DRC_disabledButton,
          buttonConfig.customStyle,
        ]}>
        {buttonConfig.icon && !isProcessing && (
          <FontAwesome
            name={buttonConfig.icon}
            size={buttonConfig.iconSize || 14}
            color={
              isDisabled
                ? COLOR_PALETTE.gray[300]
                : buttonConfig.iconColor || COLOR_PALETTE.primary
            }
          />
        )}
        {isProcessing && (
          <FontAwesome
            name="spinner"
            size={buttonConfig.iconSize || 14}
            color={COLOR_PALETTE.gray[400]}
            style={styles.DRC_spinning}
          />
        )}
        <Text
          style={[
            styles.DRC_textButtonText,
            isDisabled && styles.DRC_disabledText,
            {
              color: isDisabled
                ? COLOR_PALETTE.gray[400]
                : buttonConfig.textColor || COLOR_PALETTE.primary,
            },
          ]}>
          {isProcessing ? 'Processing...' : buttonConfig.text}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderNavigationArrow = () => {
    if (!showNavigationArrow) return null;

    const translateX = arrowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 8],
    });

    const opacity = arrowAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.3, 0.8, 1],
    });

    return (
      <Animated.View
        style={[
          styles.DRC_navigationArrow,
          {
            transform: [{translateX}],
            opacity,
          },
        ]}>
        <View style={styles.DRC_navigationArrowInner}>
          <FontAwesome
            name="chevron-right"
            size={14}
            color={COLOR_PALETTE.primary}
          />
        </View>
      </Animated.View>
    );
  };

  const headerButtons = getButtonsByPosition('header');
  const bottomButtons = getButtonsByPosition('bottom');
  const hasHeaderButtons = headerButtons.length > 0;
  const hasBottomButtons = bottomButtons.length > 0;
  const shouldShowExpandToggle = isExpandable && expandableFields.length > 0;

  const statusField = fields.find(field => field.type === 'status');
  const statusValue = statusField
    ? formatValue(data[statusField.key], 'status')
    : null;
  const statusColors = statusValue ? getStatusColor(statusValue) : null;

  return (
    <View style={styles.DRC_cardContainer}>
      <Animated.View
        style={[
          styles.DRC_card,
          isHighlighted && styles.DRC_cardHighlighted,
          {
            transform: [{scale: scaleAnim}],
          },
        ]}>
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={() => {
            // Close menu when pressing anywhere on the card
            if (menuVisible) {
              setMenuVisible(false);
            }
          }}
          style={styles.DRC_cardInner}>
          {renderNavigationArrow()}

          {/* Header */}
          <View style={[styles.DRC_header, isRTL && styles.DRC_headerRTL]}>
            <View
              style={[
                styles.DRC_headerContent,
                showNavigationArrow && styles.DRC_headerContentWithArrow,
              ]}>
              {headerConfig.title && (
                <Text style={styles.DRC_headerTitle} numberOfLines={1}>
                  {data[headerConfig.title.key] ||
                    headerConfig.title.defaultValue}
                </Text>
              )}
              {headerConfig.subtitle && (
                <Text style={styles.DRC_headerSubtitle} numberOfLines={1}>
                  {data[headerConfig.subtitle.key] ||
                    headerConfig.subtitle.defaultValue}
                </Text>
              )}
            </View>

            <View style={styles.DRC_headerRightSection}>
              {/* Status Badge */}
              {statusValue && statusColors && (
                <View
                  style={[
                    styles.DRC_statusBadge,
                    {backgroundColor: statusColors.bg},
                  ]}>
                  <View
                    style={[
                      styles.DRC_statusDot,
                      {backgroundColor: statusColors.dot},
                    ]}
                  />
                  <Text
                    style={[styles.DRC_statusText, {color: statusColors.text}]}>
                    {statusValue}
                  </Text>
                </View>
              )}

              {/* 3-Dot Menu */}
              {hasHeaderButtons && (
                <View style={styles.DRC_menuContainer}>
                  <TouchableOpacity
                    style={styles.DRC_menuButton}
                    onPress={() => setMenuVisible(!menuVisible)}>
                    <FontAwesome
                      name="ellipsis-v"
                      size={18}
                      color={COLOR_PALETTE.gray[500]}
                    />
                  </TouchableOpacity>

                  {/* Dropdown Menu with Fade Animation */}
                  {menuVisible && (
                    <>
                      <Animated.View
                        style={[
                          styles.DRC_dropdownMenu,
                          {
                            opacity: menuFadeAnim,
                            transform: [
                              {
                                translateY: menuFadeAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [-10, 0],
                                }),
                              },
                            ],
                          },
                        ]}>
                        <View style={styles.DRC_dropdownArrow} />
                        {headerButtons.map(buttonType =>
                          renderMenuButton(buttonType),
                        )}
                      </Animated.View>
                      <TouchableOpacity
                        style={styles.DRC_dropdownOverlay}
                        activeOpacity={1}
                        onPress={() => setMenuVisible(false)}
                      />
                    </>
                  )}
                </View>
              )}
            </View>
          </View>

          {/* Fields */}
          <View style={styles.DRC_fieldsContainer}>
            {fields
              .filter(f => f.type !== 'status')
              .map((field, index) => renderField(field, index))}
          </View>

          {/* Expandable fields */}
          {expanded && expandableFields.length > 0 && (
            <Animated.View style={styles.DRC_expandedFieldsContainer}>
              {expandableFields.map((field, index) =>
                renderField(field, index),
              )}
            </Animated.View>
          )}

          {/* Footer */}
          {(shouldShowExpandToggle || hasBottomButtons) && (
            <View style={styles.DRC_footer}>
              {shouldShowExpandToggle && (
                <TouchableOpacity
                  onPress={() => setExpanded(!expanded)}
                  style={styles.DRC_expandButton}>
                  <Text style={styles.DRC_expandButtonText}>
                    {expanded ? 'Show less' : 'Show more'}
                  </Text>
                  <FontAwesome
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={12}
                    color={COLOR_PALETTE.gray[500]}
                  />
                </TouchableOpacity>
              )}

              {hasBottomButtons && (
                <View style={styles.DRC_bottomButtons}>
                  {bottomButtons.map(buttonType => renderButton(buttonType))}
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export default DynamicRequestCard;
export {BUTTON_TYPES};
