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
import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Modal,
  Dimensions,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import styles from '../styles/styles';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

const BUTTON_TYPES = {
  EDIT: 'edit',
  DELETE: 'delete',
  ATTACHMENT: 'attachment',
  SUBMIT: 'submit',
  VIEW: 'view',
  APPROVAL: 'approval',
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

let globalMenuCloser = null;
const registerMenuCloser = closer => {
  if (globalMenuCloser && globalMenuCloser !== closer) {
    globalMenuCloser();
  }
  globalMenuCloser = closer;
};
const unregisterMenuCloser = closer => {
  if (globalMenuCloser === closer) {
    globalMenuCloser = null;
  }
};

const DynamicRequestCard = ({
  data = {},
  fields = [],
  headerConfig = {},
  buttons = {},
  isHighlighted = false,
  expandableFields = [],
  isExpandable = false,
  onButtonPress = () => {},
  onPress = null,
  onLongPress = null,
  processingButtons = [],
  showNavigationArrow = false,
  isRTL = false,
  // ── Multi-select props ──
  isMultiSelectMode = false,
  isSelected = false,
  onSelectToggle = null, // (data) => void — called when card tapped in multiselect mode
}) => {
  const [expanded, setExpanded] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [approvalDropdownVisible, setApprovalDropdownVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({top: 0, right: 0});
  const [approvalPosition, setApprovalPosition] = useState({top: 0, left: 0});

  const arrowAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const menuFadeAnim = useRef(new Animated.Value(0)).current;
  const approvalFadeAnim = useRef(new Animated.Value(0)).current;
  const expandRotateAnim = useRef(new Animated.Value(0)).current;
  const checkScaleAnim = useRef(new Animated.Value(0)).current;
  const selectedBorderAnim = useRef(new Animated.Value(0)).current;
  const animationIntervalRef = useRef(null);
  const menuButtonRef = useRef(null);
  const approvalButtonRef = useRef(null);

  // ── Animate check icon in/out ──
  useEffect(() => {
    Animated.spring(checkScaleAnim, {
      toValue: isSelected ? 1 : 0,
      useNativeDriver: true,
      tension: 120,
      friction: 8,
    }).start();
    Animated.timing(selectedBorderAnim, {
      toValue: isSelected ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [isSelected, checkScaleAnim, selectedBorderAnim]);

  // ── Close 3-dot menu ──
  const closeMenu = useCallback(() => {
    Animated.timing(menuFadeAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => setMenuVisible(false));
    unregisterMenuCloser(closeMenu);
  }, [menuFadeAnim]);

  // ── Open 3-dot menu ──
  const openMenu = () => {
    menuButtonRef.current?.measure((fx, fy, w, h, px, py) => {
      setMenuPosition({top: py + h + 4, right: SCREEN_WIDTH - px - w});
      registerMenuCloser(closeMenu);
      setMenuVisible(true);
      Animated.timing(menuFadeAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    });
  };

  const toggleMenu = () => (menuVisible ? closeMenu() : openMenu());

  // ── Expand toggle ──
  const toggleExpanded = () => {
    const toValue = expanded ? 0 : 1;
    Animated.spring(expandRotateAnim, {
      toValue,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
    setExpanded(prev => !prev);
  };

  // ── Approval dropdown ──
  const openApprovalDropdown = () => {
    approvalButtonRef.current?.measure((fx, fy, w, h, px, py) => {
      const approvalConfig = getMergedButtonConfig(BUTTON_TYPES.APPROVAL);
      const estimatedHeight = (approvalConfig.actions?.length || 1) * 48;
      const spaceBelow = SCREEN_HEIGHT - (py + h);
      const opensUpward = spaceBelow < estimatedHeight;

      const dropdownWidth = 160;
      const PADDING = 8;
      const clampedLeft = Math.min(px, SCREEN_WIDTH - dropdownWidth - PADDING);

      setApprovalPosition({
        top: opensUpward ? py - estimatedHeight : py + h + 4,
        left: clampedLeft,
        width: w,
      });

      setApprovalDropdownVisible(true);
      Animated.timing(approvalFadeAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    });
  };

  const closeApprovalDropdown = () => {
    Animated.timing(approvalFadeAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => setApprovalDropdownVisible(false));
  };

  const toggleApprovalDropdown = () =>
    approvalDropdownVisible ? closeApprovalDropdown() : openApprovalDropdown();

  // ── Highlight pulse ──
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
    return () => animation?.stop();
  }, [isHighlighted, scaleAnim]);

  // ── Navigation arrow pulse ──
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
      return () => clearInterval(animationIntervalRef.current);
    } else {
      arrowAnim.setValue(0);
      clearInterval(animationIntervalRef.current);
    }
  }, [showNavigationArrow, arrowAnim]);

  useEffect(() => {
    return () => {
      unregisterMenuCloser(closeMenu);
      clearInterval(animationIntervalRef.current);
    };
  }, [closeMenu]);

  // ─────────────────────── helpers ───────────────────────

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
      case 'datetime': {
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
        let hours = d.getUTCHours();
        const minutes = d.getUTCMinutes().toString().padStart(2, '0');
        const seconds = d.getUTCSeconds().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours === 0 ? 12 : hours;
        return `${
          months[d.getUTCMonth()]
        } ${d.getUTCDate()}, ${d.getUTCFullYear()} ${hours}:${minutes}:${seconds} ${ampm}`;
      }
      case 'link':
        return (
          <Text
            style={{color: '#0A66C2', textDecorationLine: 'underline'}}
            onPress={() => {}}>
            {value}
          </Text>
        );
      case 'currency': {
        const num = Number(value);
        return isNaN(num)
          ? value
          : num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      }
      case 'number': {
        const n = Number(value);
        return isNaN(n)
          ? value
          : n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      }
      case 'status':
      case 'boolean':
        return value;
      default:
        return String(value) || '—';
    }
  };

  const getStatusColor = status => {
    const s = String(status).toLowerCase();
    if (['active', 'approved', 'success', 'yes', 'true'].includes(s))
      return {
        bg: COLOR_PALETTE.successLight,
        text: '#065f46',
        dot: COLOR_PALETTE.success,
      };
    if (s === 'completed')
      return {bg: '#EDE9FE', text: '#4C1D95', dot: '#7C3AED'};
    if (
      [
        'pending',
        'pending approval',
        'in review',
        'waiting',
        'processing',
        'in progress',
      ].includes(s)
    )
      return {
        bg: COLOR_PALETTE.warningLight,
        text: '#92400e',
        dot: COLOR_PALETTE.warning,
      };
    if (['cancelled', 'rejected', 'failed', 'no', 'false'].includes(s))
      return {
        bg: COLOR_PALETTE.dangerLight,
        text: '#991b1b',
        dot: COLOR_PALETTE.danger,
      };
    return {
      bg: COLOR_PALETTE.gray[100],
      text: COLOR_PALETTE.gray[700],
      dot: COLOR_PALETTE.gray[400],
    };
  };

  // ─────────────────────── button config ───────────────────────

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
      style: 'text',
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
    [BUTTON_TYPES.APPROVAL]: {
      show: false,
      text: 'Approval',
      icon: null,
      iconSize: 14,
      iconColor: '#fff',
      position: 'bottom',
      style: 'approval_dropdown',
      backgroundColor: COLOR_PALETTE.success,
      textColor: COLOR_PALETTE.success,
      actions: [{key: 'submit', label: 'Submit', icon: 'paper-plane'}],
      customStyle: {},
    },
  };

  const getMergedButtonConfig = buttonType => {
    const defaultConfig = defaultButtonConfigs[buttonType] || {};
    const userConfig = buttons[buttonType] || {};
    return {...defaultConfig, ...userConfig, show: userConfig.show === true};
  };

  const getEnabledButtons = () =>
    Object.keys(buttons).filter(bt => getMergedButtonConfig(bt).show === true);

  const getButtonsByPosition = position =>
    getEnabledButtons().filter(
      bt => getMergedButtonConfig(bt).position === position,
    );

  // ─────────────────────── renderers ───────────────────────

  const renderField = (field, index) => {
    const value = data[field.key];
    const formattedValue = formatValue(value, field.type);
    if (field.type === 'status') return null;
    const hasLabel = field.label && String(field.label).trim().length > 0;

    if (!hasLabel) {
      return (
        <View key={index} style={styles.DRC_fieldRowNoLabel}>
          <Text
            style={[
              styles.DRC_fieldValueNoLabel,
              showNavigationArrow && styles.DRC_fieldValueNoLabelWithArrow,
            ]}>
            {formattedValue}
          </Text>
        </View>
      );
    }

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
          </View>
        </View>
      );
    }

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
        </View>
      </View>
    );
  };

  const renderMenuButton = buttonType => {
    const buttonConfig = getMergedButtonConfig(buttonType);
    if (!buttonConfig.show) return null;
    const isProcessing = processingButtons.includes(buttonType);
    const isDisabled =
      buttonConfig.disabled ||
      (buttonType !== BUTTON_TYPES.SUBMIT && processingButtons.length > 0);

    return (
      <TouchableOpacity
        key={buttonType}
        onPress={() => {
          closeMenu();
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
              style={styles.DRC_menuIcon}
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
    if (buttonConfig.style === 'approval_dropdown') return null;

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

  // ── Approval Dropdown Button ──
  const renderApprovalDropdownButton = () => {
    const buttonConfig = getMergedButtonConfig(BUTTON_TYPES.APPROVAL);
    if (!buttonConfig.show) return null;

    const isDisabled = buttonConfig.disabled || processingButtons.length > 0;
    const actions = buttonConfig.actions || [
      {key: 'submit', label: 'Submit', icon: 'paper-plane'},
    ];

    return (
      <>
        <TouchableOpacity
          ref={approvalButtonRef}
          onPress={toggleApprovalDropdown}
          disabled={isDisabled}
          activeOpacity={0.7}
          style={[
            styles.DRC_approvalButton2,
            isDisabled && styles.DRC_approvalButtonDisabled,
            buttonConfig.customStyle,
          ]}>
          <Text
            style={[
              styles.DRC_approvalButtonText2,
              isDisabled && styles.DRC_approvalButtonTextDisabled,
            ]}>
            {buttonConfig.text || 'Approval'}
          </Text>
          <Animated.View
            style={{
              marginLeft: 5,
              transform: [
                {rotate: approvalDropdownVisible ? '180deg' : '0deg'},
              ],
            }}>
            <FontAwesome
              name="chevron-down"
              size={9}
              color={isDisabled ? '#d1d5db' : '#93c5fd'}
            />
          </Animated.View>
        </TouchableOpacity>

        <Modal
          transparent
          visible={approvalDropdownVisible}
          animationType="none"
          onRequestClose={closeApprovalDropdown}>
          <TouchableWithoutFeedback onPress={closeApprovalDropdown}>
            <View style={styles.DRC_modalOverlay}>
              <TouchableWithoutFeedback>
                <Animated.View
                  style={[
                    styles.DRC_approvalDropdownMenu,
                    {
                      top: approvalPosition.top,
                      left: approvalPosition.left,
                      minWidth: approvalPosition.width || 160,
                      opacity: approvalFadeAnim,
                      transform: [
                        {
                          translateY: approvalFadeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [6, 0],
                          }),
                        },
                      ],
                    },
                  ]}>
                  {actions.map((action, idx) => {
                    const isActionProcessing = processingButtons.includes(
                      action.key,
                    );
                    const isLast = idx === actions.length - 1;
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.DRC_approvalDropdownItem,
                          !isLast && styles.DRC_approvalDropdownItemBorder,
                        ]}
                        onPress={() => {
                          closeApprovalDropdown();
                          onButtonPress(action.key, data);
                        }}
                        activeOpacity={0.7}
                        disabled={isActionProcessing}>
                        {action.icon && (
                          <View style={styles.DRC_approvalDropdownIconWrap}>
                            <FontAwesome
                              name={action.icon}
                              size={13}
                              color={
                                isActionProcessing
                                  ? COLOR_PALETTE.gray[400]
                                  : COLOR_PALETTE.info
                              }
                            />
                          </View>
                        )}
                        <Text
                          style={[
                            styles.DRC_approvalDropdownItemText,
                            isActionProcessing && {
                              color: COLOR_PALETTE.gray[400],
                            },
                          ]}>
                          {isActionProcessing ? 'Processing...' : action.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </Animated.View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </>
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
          {transform: [{translateX}], opacity},
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

  // ── Multi-select checkbox overlay ──
  const renderSelectCheckbox = () => {
    if (!isMultiSelectMode) return null;
    return (
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          zIndex: 10,
          transform: [
            {
              scale: checkScaleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.4, 1],
              }),
            },
          ],
          opacity: checkScaleAnim,
        }}>
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            borderWidth: 2,
            borderColor: isSelected
              ? COLOR_PALETTE.primary
              : COLOR_PALETTE.gray[400],
            backgroundColor: isSelected ? COLOR_PALETTE.primary : '#fff',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 1},
            shadowOpacity: 0.15,
            shadowRadius: 2,
            elevation: 2,
          }}>
          {isSelected && <FontAwesome name="check" size={11} color="#fff" />}
        </View>
      </Animated.View>
    );
  };

  // ─────────────────────── layout ───────────────────────

  const headerButtons = getButtonsByPosition('header');
  const bottomButtons = getButtonsByPosition('bottom').filter(
    bt => getMergedButtonConfig(bt).style !== 'approval_dropdown',
  );
  const hasHeaderButtons = headerButtons.length > 0;
  const hasBottomButtons = bottomButtons.length > 0;
  const shouldShowExpandToggle = isExpandable && expandableFields.length > 0;

  const approvalConfig = getMergedButtonConfig(BUTTON_TYPES.APPROVAL);
  const hasApprovalButton = approvalConfig.show;

  const statusField = fields.find(f => f.type === 'status');
  const statusValue = statusField
    ? formatValue(data[statusField.key], 'status')
    : null;
  const statusColors = statusValue ? getStatusColor(statusValue) : null;

  const expandIconRotation = expandRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const showFooter =
    shouldShowExpandToggle || hasBottomButtons || hasApprovalButton;

  // Interpolate border color for selected state
  const cardBorderColor = selectedBorderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#e5e7eb', COLOR_PALETTE.primary],
  });
  const cardBgColor = selectedBorderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#ffffff', '#eef2ff'],
  });

  return (
    <View style={styles.DRC_cardContainer}>
      <Animated.View
        style={[
          styles.DRC_card,
          isHighlighted && styles.DRC_cardHighlighted,
          {
            transform: [{scale: scaleAnim}],
            borderColor: cardBorderColor,
            borderWidth: isMultiSelectMode ? 1.5 : undefined,
            backgroundColor: cardBgColor,
          },
        ]}>
        {/* Checkbox overlay — rendered outside TouchableWithoutFeedback so it doesn't block taps */}
        {renderSelectCheckbox()}

        <TouchableWithoutFeedback
          onPress={() => {
            if (isMultiSelectMode) {
              onSelectToggle && onSelectToggle(data);
              return;
            }
            if (menuVisible) closeMenu();
            else if (onPress) onPress();
          }}
          onLongPress={() => {
            if (!isMultiSelectMode) {
              // Trigger multi-select mode via onLongPress from parent
              onLongPress && onLongPress(data);
            }
          }}>
          <View
            style={[
              styles.DRC_cardInner,
              isMultiSelectMode && {paddingLeft: 40},
            ]}>
            {renderNavigationArrow()}

            {/* ── Header ── */}
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
                      style={[
                        styles.DRC_statusText,
                        {color: statusColors.text},
                      ]}>
                      {statusValue}
                    </Text>
                  </View>
                )}

                {hasHeaderButtons && !isMultiSelectMode && (
                  <View style={styles.DRC_menuContainer}>
                    <TouchableOpacity
                      ref={menuButtonRef}
                      style={styles.DRC_menuButton}
                      onPress={toggleMenu}>
                      <FontAwesome
                        name="ellipsis-v"
                        size={18}
                        color={COLOR_PALETTE.gray[500]}
                      />
                    </TouchableOpacity>

                    <Modal
                      transparent
                      visible={menuVisible}
                      animationType="none"
                      onRequestClose={closeMenu}>
                      <TouchableWithoutFeedback onPress={closeMenu}>
                        <View style={styles.DRC_modalOverlay}>
                          <TouchableWithoutFeedback>
                            <Animated.View
                              style={[
                                styles.DRC_dropdownMenu,
                                {
                                  position: 'absolute',
                                  top: menuPosition.top,
                                  right: menuPosition.right,
                                  opacity: menuFadeAnim,
                                  transform: [
                                    {
                                      translateY: menuFadeAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [-8, 0],
                                      }),
                                    },
                                  ],
                                },
                              ]}>
                              {headerButtons.map(bt => renderMenuButton(bt))}
                            </Animated.View>
                          </TouchableWithoutFeedback>
                        </View>
                      </TouchableWithoutFeedback>
                    </Modal>
                  </View>
                )}
              </View>
            </View>

            {/* ── Fields ── */}
            <View style={styles.DRC_fieldsContainer}>
              {fields
                .filter(f => f.type !== 'status')
                .map((field, index) => renderField(field, index))}
            </View>

            {/* ── Expandable fields ── */}
            {expanded && expandableFields.length > 0 && (
              <View style={styles.DRC_expandedFieldsContainer}>
                {expandableFields.map((field, index) =>
                  renderField(field, index),
                )}
              </View>
            )}

            {/* ── Footer ── */}
            {showFooter && !isMultiSelectMode && (
              <View style={styles.DRC_footer2}>
                <View style={styles.DRC_footerRow}>
                  <View style={styles.DRC_footerLeft}>
                    {bottomButtons.map(bt => renderButton(bt))}
                  </View>
                  <View style={styles.DRC_footerCenter}>
                    {shouldShowExpandToggle && (
                      <TouchableOpacity
                        onPress={toggleExpanded}
                        activeOpacity={0.6}
                        style={styles.DRC_expandArrowButton}>
                        <Animated.View
                          style={{transform: [{rotate: expandIconRotation}]}}>
                          <FontAwesome
                            name="chevron-down"
                            size={14}
                            color={COLOR_PALETTE.gray[400]}
                          />
                        </Animated.View>
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={styles.DRC_footerRight}>
                    {hasApprovalButton && renderApprovalDropdownButton()}
                  </View>
                </View>
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </Animated.View>
    </View>
  );
};

export default DynamicRequestCard;
export {BUTTON_TYPES};
