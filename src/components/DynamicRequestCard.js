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
import FeatherIcon from 'react-native-vector-icons/Feather';
import {useSelector} from 'react-redux';
import {
  selectDateFormat,
  selectTimeFormat,
  selectTimezone,
} from '../store/selectors';
import {formatDateValue} from '../store/utils/dateUtils';
import {AppTokens} from './AppComponentsDesign/Appcomponents';
import useAppTokens from './AppComponentsDesign/useAppTokens';
import brand from '../theme/brand';
import {
  conditionalScale,
  conditionalVerticalScale,
  conditionalFontScale,
} from '../store/utils/scaling';
import {
  parseDynamicsDate,
  formatDynamicsDate,
  formatDynamicsDateTime,
} from '../utils/dynamicsDate';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

export const BUTTON_TYPES = {
  EDIT: 'edit',
  DELETE: 'delete',
  ATTACHMENT: 'attachment',
  SUBMIT: 'submit',
  VIEW: 'view',
  APPROVAL: 'approval',
};

// ✅ AppTokens used here only for brand colors (never change between themes)
const getStatusColors = status => {
  const s = String(status ?? '').toLowerCase();
  if (['active', 'approved', 'success', 'yes', 'true'].includes(s)) {
    return {bg: AppTokens.greenBg, text: '#065F46', dot: AppTokens.green};
  }
  if (s === 'completed') {
    return {bg: AppTokens.purpleBg, text: '#4C1D95', dot: AppTokens.purple};
  }
  if (
    [
      'pending',
      'pending approval',
      'in review',
      'waiting',
      'processing',
      'in progress',
    ].includes(s)
  ) {
    // "Waiting" family — slate, not amber (see statusWaiting* in Tokens.js).
    return {
      bg: AppTokens.statusWaitingBg,
      text: AppTokens.statusWaitingText,
      dot: AppTokens.statusWaiting,
    };
  }
  if (['cancelled', 'rejected', 'failed', 'no', 'false'].includes(s)) {
    return {bg: AppTokens.redBg, text: '#991B1B', dot: AppTokens.red};
  }
  if (['draft', 'notsubmitted'].includes(s)) {
    return {bg: AppTokens.slateBg, text: AppTokens.slate, dot: '#94A3B8'};
  }
  return {bg: AppTokens.slateBg, text: AppTokens.slate, dot: '#94A3B8'};
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

const HighlightText = ({text, query, style}) => {
  if (!query?.trim()) {
    return <Text style={style}>{text}</Text>;
  }
  const parts = String(text).split(new RegExp(`(${query})`, 'gi'));
  return (
    <Text style={style}>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <Text key={i} style={{backgroundColor: '#FFF9C4', fontWeight: '700'}}>
            {part}
          </Text>
        ) : (
          part
        ),
      )}
    </Text>
  );
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
  isMultiSelectMode = false,
  isSelected = false,
  onSelectToggle = null,
  searchQuery = '',
}) => {
  // ✅ useAppTokens at top — reactive to theme changes
  const T = useAppTokens();

  const [expanded, setExpanded] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [approvalDropdownVisible, setApprovalDropdownVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({top: 0, right: 0});
  const [approvalPosition, setApprovalPosition] = useState({top: 0, left: 0});

  const selectedFormat = useSelector(selectDateFormat);
  const selectedTimeFormat = useSelector(selectTimeFormat);
  const selectedTimezone = useSelector(selectTimezone);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const menuFadeAnim = useRef(new Animated.Value(0)).current;
  const approvalFadeAnim = useRef(new Animated.Value(0)).current;
  const expandRotateAnim = useRef(new Animated.Value(0)).current;
  const checkScaleAnim = useRef(new Animated.Value(0)).current;
  const selectedBorderAnim = useRef(new Animated.Value(0)).current;
  const menuButtonRef = useRef(null);
  const approvalButtonRef = useRef(null);

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

  useEffect(() => {
    let animation;
    if (isHighlighted) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.015,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 700,
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

  const closeMenu = useCallback(() => {
    Animated.timing(menuFadeAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => setMenuVisible(false));
    unregisterMenuCloser(closeMenu);
  }, [menuFadeAnim]);

  // const openMenu = () => {
  //   menuButtonRef.current?.measure((fx, fy, w, h, px, py) => {
  //     setMenuPosition({top: py + h + 6, right: SCREEN_WIDTH - px - w});
  //     registerMenuCloser(closeMenu);
  //     setMenuVisible(true);
  //     Animated.timing(menuFadeAnim, {
  //       toValue: 1,
  //       duration: 160,
  //       useNativeDriver: true,
  //     }).start();
  //   });
  // };
  const openMenu = () => {
    menuButtonRef.current?.measure((fx, fy, w, h, px, py) => {
      const menuHeight = 10; // Approximate height of your menu
      const topPosition = py - menuHeight; // Position above the button
      setMenuPosition({top: topPosition, right: SCREEN_WIDTH - px - w});
      registerMenuCloser(closeMenu);
      setMenuVisible(true);
      Animated.timing(menuFadeAnim, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }).start();
    });
  };

  const toggleMenu = () => (menuVisible ? closeMenu() : openMenu());

  const toggleExpanded = () => {
    Animated.spring(expandRotateAnim, {
      toValue: expanded ? 0 : 1,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
    setExpanded(prev => !prev);
  };

  const closeApprovalDropdown = () => {
    Animated.timing(approvalFadeAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => setApprovalDropdownVisible(false));
  };

  // const openApprovalDropdown = () => {
  //   approvalButtonRef.current?.measure((fx, fy, w, h, px, py) => {
  //     const approvalConfig = getMergedButtonConfig(BUTTON_TYPES.APPROVAL);
  //     const estimatedHeight = (approvalConfig.actions?.length || 1) * 48 + 16;
  //     const spaceBelow = SCREEN_HEIGHT - (py + h) - 20;
  //     const opensUpward = spaceBelow < estimatedHeight;
  //     const dropdownWidth = 180;
  //     const PADDING = 12;
  //     const clampedLeft = Math.min(
  //       Math.max(px, PADDING),
  //       SCREEN_WIDTH - dropdownWidth - PADDING,
  //     );
  //     const topPosition = opensUpward
  //       ? Math.max(py - estimatedHeight - 4, PADDING)
  //       : Math.min(py + h + 4, SCREEN_HEIGHT - estimatedHeight - PADDING);
  //     setApprovalPosition({
  //       top: topPosition,
  //       left: clampedLeft,
  //       width: Math.max(w, dropdownWidth),
  //     });
  //     setApprovalDropdownVisible(true);
  //     Animated.timing(approvalFadeAnim, {
  //       toValue: 1,
  //       duration: 160,
  //       useNativeDriver: true,
  //     }).start();
  //   });
  // };
  const openApprovalDropdown = () => {
    approvalButtonRef.current?.measure((fx, fy, w, h, px, py) => {
      const approvalConfig = getMergedButtonConfig(BUTTON_TYPES.APPROVAL);
      const estimatedHeight = (approvalConfig.actions?.length || 1) * 48 + 16;
      const dropdownWidth = 180;
      const PADDING = 12;
      const clampedLeft = Math.min(
        Math.max(px, PADDING),
        SCREEN_WIDTH - dropdownWidth - PADDING,
      );
      // Force it to open upward
      const topPosition = Math.max(py - estimatedHeight + 60, PADDING);
      setApprovalPosition({
        top: topPosition,
        left: clampedLeft,
        width: Math.max(w, dropdownWidth),
      });
      setApprovalDropdownVisible(true);
      Animated.timing(approvalFadeAnim, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }).start();
    });
  };

  const toggleApprovalDropdown = () =>
    approvalDropdownVisible ? closeApprovalDropdown() : openApprovalDropdown();

  useEffect(() => {
    return () => unregisterMenuCloser(closeMenu);
  }, [closeMenu]);

  const formatValue = (value, fieldType) => {
    if (value === null || value === undefined) return '—';
    if (value === '') return '—';

    switch (fieldType) {
      case 'date':
        return formatDynamicsDate(parseDynamicsDate(value));
      case 'datetime':
        return formatDynamicsDateTime(parseDynamicsDate(value));
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
      default:
        return String(value) || '—';
    }
  };

  // ✅ defaultButtonConfigs uses T (reactive) instead of AppTokens (static)
  const defaultButtonConfigs = {
    [BUTTON_TYPES.EDIT]: {
      show: false,
      text: 'Edit',
      icon: 'edit-2',
      position: 'header',
      style: 'icon',
      color: T.blue,
    },
    [BUTTON_TYPES.DELETE]: {
      show: false,
      text: 'Delete',
      icon: 'trash-2',
      position: 'header',
      style: 'icon',
      color: T.red,
    },
    [BUTTON_TYPES.ATTACHMENT]: {
      show: false,
      text: 'Attachments',
      icon: 'paperclip',
      position: 'header',
      style: 'icon',
      color: T.slate,
    },
    [BUTTON_TYPES.SUBMIT]: {
      show: false,
      text: 'Submit',
      icon: 'send',
      position: 'bottom',
      style: 'text',
      color: T.green,
    },
    [BUTTON_TYPES.VIEW]: {
      show: false,
      text: 'View',
      icon: 'eye',
      position: 'header',
      style: 'icon',
      color: T.blue,
    },
    [BUTTON_TYPES.APPROVAL]: {
      show: false,
      text: 'Approval',
      icon: null,
      position: 'bottom',
      style: 'approval_dropdown',
      color: T.blue,
      actions: [{key: 'submit', label: 'Submit', icon: 'send'}],
    },
  };

  const getMergedButtonConfig = buttonType => {
    const def = defaultButtonConfigs[buttonType] || {};
    const user = buttons[buttonType] || {};
    const color = user.color || user.backgroundColor || def.color;
    const disabled = user.disabled ?? def.disabled ?? false;
    return {...def, ...user, color, disabled, show: user.show === true};
  };

  const getEnabledButtons = () =>
    Object.keys(buttons).filter(bt => getMergedButtonConfig(bt).show === true);
  const getButtonsByPosition = pos =>
    getEnabledButtons().filter(
      bt => getMergedButtonConfig(bt).position === pos,
    );

  const renderField = (field, index) => {
    const value = data[field.key];
    if (field.type === 'status') {
      return null;
    }
    const formattedValue = formatValue(value, field.type);

    if (field.type === 'status') {
      const statusColors = getStatusColors(value);
      return (
        <View key={index} style={S.fieldRow}>
          <Text style={[S.fieldLabel, {color: T.subtitleText}]}>
            {field.label}
          </Text>
          <View
            style={[
              S.heroBadge,
              {
                backgroundColor: statusColors.bg,
                borderColor: statusColors.dot + '55',
              },
            ]}>
            <View
              style={[S.heroBadgeDot, {backgroundColor: statusColors.dot}]}
            />
            <Text style={[S.heroBadgeText, {color: statusColors.text}]}>
              {formattedValue}
            </Text>
          </View>
        </View>
      );
    }
    const hasLabel = field.label && String(field.label).trim().length > 0;

    if (field.type === 'boolean') {
      const isTrue =
        value === true ||
        value === 'true' ||
        value === 1 ||
        value === '1' ||
        value === 'Yes';
      return (
        <View key={`${field.key}-${index}`} style={S.fieldRow}>
          {hasLabel && (
            <Text style={{...S.fieldLabel, color: T.subtitleText}}>
              {field.label}
            </Text>
          )}
          <View
            style={[
              S.boolBadge,
              {backgroundColor: isTrue ? AppTokens.greenBg : AppTokens.slateBg},
            ]}>
            <FeatherIcon
              name={isTrue ? 'check' : 'x'}
              size={conditionalFontScale(10, 11, 11, 12)}
              color={isTrue ? AppTokens.green : '#94A3B8'}
            />
          </View>
        </View>
      );
    }

    return (
      <View key={`${field.key}-${index}`} style={S.fieldRow}>
        {hasLabel && (
          <Text style={{...S.fieldLabel, color: T.subtitleText}}>
            {field.label}
          </Text>
        )}
        <HighlightText
          text={String(formattedValue)}
          query={searchQuery}
          style={{...S.fieldValue, color: T.titleText}}
        />
      </View>
    );
  };

  // const renderMenuItem = buttonType => {
  //   const cfg = getMergedButtonConfig(buttonType);
  //   if (!cfg.show) {
  //     return null;
  //   }
  //   const isProcessing = processingButtons.includes(buttonType);
  //   const isDisabled = cfg.disabled || processingButtons.length > 0;

  //   return (
  //     <TouchableOpacity
  //       key={buttonType}
  //       onPress={() => {
  //         closeMenu();
  //         onButtonPress(buttonType, data);
  //       }}
  //       disabled={isDisabled}
  //       activeOpacity={0.72}
  //       style={[S.menuItem, isDisabled && S.menuItemDisabled]}>
  //       <View style={[S.menuItemIcon, {backgroundColor: cfg.color + '18'}]}>
  //         <FeatherIcon
  //           name={isProcessing ? 'loader' : cfg.icon || 'circle'}
  //           size={conditionalFontScale(13, 13, 14, 14)}
  //           color={isDisabled ? T.border : cfg.color}
  //         />
  //       </View>
  //       <Text
  //         style={[
  //           S.menuItemText,
  //           {color: T.titleText},
  //           isDisabled && {color: T.border},
  //         ]}>
  //         {isProcessing ? 'Processing…' : cfg.text}
  //       </Text>
  //     </TouchableOpacity>
  //   );
  // };

  const renderMenuItem = buttonType => {
    const cfg = getMergedButtonConfig(buttonType);
    if (!cfg.show) return null;
    const isProcessing = processingButtons.includes(buttonType);
    const isDisabled = cfg.disabled || processingButtons.length > 0;

    return (
      <TouchableOpacity
        key={buttonType}
        onPress={() => {
          closeMenu();
          onButtonPress(buttonType, data);
        }}
        disabled={isDisabled}
        activeOpacity={0.72}
        style={[S.menuItem, isDisabled && S.menuItemDisabled]}>
        <View style={[S.menuItemIcon, {backgroundColor: cfg.color + '18'}]}>
          <FeatherIcon
            name={isProcessing ? 'loader' : cfg.icon || 'circle'}
            size={conditionalFontScale(13, 13, 14, 14)}
            color={cfg.color} // no more T.border swap
          />
        </View>
        <Text style={[S.menuItemText, {color: T.titleText}]}>
          {isProcessing ? 'Processing…' : cfg.text}
        </Text>
      </TouchableOpacity>
    );
  };

  // const renderBottomButton = buttonType => {
  //   const cfg = getMergedButtonConfig(buttonType);
  //   if (!cfg.show || cfg.style === 'approval_dropdown') {
  //     return null;
  //   }
  //   const isProcessing = processingButtons.includes(buttonType);
  //   const isDisabled = cfg.disabled || isProcessing;

  //   return (
  //     <TouchableOpacity
  //       key={buttonType}
  //       onPress={() => onButtonPress(buttonType, data)}
  //       disabled={isDisabled}
  //       activeOpacity={0.72}
  //       style={[
  //         S.bottomBtn,
  //         {borderColor: isDisabled ? T.border : cfg.color},
  //         isDisabled && S.bottomBtnDisabled,
  //       ]}>
  //       <FeatherIcon
  //         name={isProcessing ? 'loader' : cfg.icon || 'circle'}
  //         size={conditionalFontScale(11, 12, 12, 13)}
  //         color={isDisabled ? T.border : cfg.color}
  //       />
  //       <Text
  //         style={[S.bottomBtnText, {color: isDisabled ? T.border : cfg.color}]}>
  //         {isProcessing ? 'Processing…' : cfg.text}
  //       </Text>
  //     </TouchableOpacity>
  //   );
  // };

  const renderBottomButton = buttonType => {
    const cfg = getMergedButtonConfig(buttonType);
    if (!cfg.show || cfg.style === 'approval_dropdown') {
      return null;
    }
    const isProcessing = processingButtons.includes(buttonType);
    const isDisabled = cfg.disabled || isProcessing;

    return (
      <TouchableOpacity
        key={buttonType}
        onPress={() => onButtonPress(buttonType, data)}
        disabled={isDisabled}
        activeOpacity={0.72}
        style={[
          S.bottomBtn,
          {borderColor: cfg.color},
          isDisabled && S.bottomBtnDisabled,
        ]}>
        <FeatherIcon
          name={isProcessing ? 'loader' : cfg.icon || 'circle'}
          size={conditionalFontScale(11, 12, 12, 13)}
          color={cfg.color}
        />
        <Text style={[S.bottomBtnText, {color: cfg.color}]}>
          {isProcessing ? 'Processing…' : cfg.text}
        </Text>
      </TouchableOpacity>
    );
  };

  // const renderApprovalButton = () => {
  //   const cfg = getMergedButtonConfig(BUTTON_TYPES.APPROVAL);
  //   if (!cfg.show) {
  //     return null;
  //   }
  //   const isDisabled = cfg.disabled || processingButtons.length > 0;
  //   const actions = cfg.actions || [
  //     {key: 'submit', label: 'Submit', icon: 'send'},
  //   ];
  //   const fillColor = isDisabled ? T.border : cfg.color || T.blue;

  //   return (
  //     <>
  //       <TouchableOpacity
  //         ref={approvalButtonRef}
  //         onPress={toggleApprovalDropdown}
  //         disabled={isDisabled}
  //         activeOpacity={0.8}
  //         style={[
  //           S.approvalBtn,
  //           {backgroundColor: fillColor, borderColor: fillColor},
  //           isDisabled && S.approvalBtnDisabled,
  //         ]}>
  //         <Text style={S.approvalBtnText}>{cfg.text || 'Approval'}</Text>
  //         <FeatherIcon
  //           name={approvalDropdownVisible ? 'chevron-up' : 'chevron-down'}
  //           size={conditionalFontScale(11, 12, 12, 13)}
  //           color="#FFFFFF"
  //         />
  //       </TouchableOpacity>

  //       <Modal
  //         transparent
  //         visible={approvalDropdownVisible}
  //         animationType="none"
  //         onRequestClose={closeApprovalDropdown}>
  //         <TouchableWithoutFeedback onPress={closeApprovalDropdown}>
  //           <View style={S.modalOverlay}>
  //             <TouchableWithoutFeedback>
  //               <Animated.View
  //                 style={[
  //                   S.approvalMenu,
  //                   {
  //                     // ✅ dynamic colors inline
  //                     backgroundColor: T.cardBg,
  //                     borderColor: T.cardDivider,
  //                     shadowColor: T.shadowColor,
  //                     top: approvalPosition.top,
  //                     left: approvalPosition.left,
  //                     minWidth: approvalPosition.width || 160,
  //                     opacity: approvalFadeAnim,
  //                     transform: [
  //                       {
  //                         translateY: approvalFadeAnim.interpolate({
  //                           inputRange: [0, 1],
  //                           outputRange: [6, 0],
  //                         }),
  //                       },
  //                     ],
  //                   },
  //                 ]}>
  //                 {actions.map((action, idx) => {
  //                   const isLast = idx === actions.length - 1;
  //                   const isActionProcessing = processingButtons.includes(
  //                     action.key,
  //                   );
  //                   return (
  //                     <TouchableOpacity
  //                       key={idx}
  //                       activeOpacity={0.72}
  //                       style={[
  //                         S.approvalMenuItem,
  //                         !isLast && {
  //                           borderBottomWidth: 1,
  //                           borderBottomColor: T.cardDivider,
  //                         },
  //                       ]}
  //                       onPress={() => {
  //                         closeApprovalDropdown();
  //                         onButtonPress(action.key, data);
  //                       }}
  //                       disabled={isActionProcessing}>
  //                       {action.icon && (
  //                         <View
  //                           style={[
  //                             S.approvalMenuIcon,
  //                             {backgroundColor: T.blue + '18'},
  //                           ]}>
  //                           <FeatherIcon
  //                             name={action.icon}
  //                             size={conditionalFontScale(12, 13, 13, 14)}
  //                             color={isActionProcessing ? T.border : T.blue}
  //                           />
  //                         </View>
  //                       )}
  //                       <Text
  //                         style={[
  //                           S.approvalMenuItemText,
  //                           {
  //                             color: isActionProcessing
  //                               ? T.border
  //                               : T.titleText,
  //                           },
  //                         ]}>
  //                         {isActionProcessing ? 'Processing…' : action.label}
  //                       </Text>
  //                     </TouchableOpacity>
  //                   );
  //                 })}
  //               </Animated.View>
  //             </TouchableWithoutFeedback>
  //           </View>
  //         </TouchableWithoutFeedback>
  //       </Modal>
  //     </>
  //   );
  // };

  const renderApprovalButton = () => {
    const cfg = getMergedButtonConfig(BUTTON_TYPES.APPROVAL);
    if (!cfg.show) {
      return null;
    }
    const isDisabled = cfg.disabled || processingButtons.length > 0;
    const actions = cfg.actions || [
      {key: 'submit', label: 'Submit', icon: 'send'},
    ];
    const fillColor = cfg.color || T.blue; // no more T.border swap here either

    return (
      <>
        <TouchableOpacity
          ref={approvalButtonRef}
          onPress={toggleApprovalDropdown}
          disabled={isDisabled}
          activeOpacity={0.8}
          style={[
            S.approvalBtn,
            {backgroundColor: fillColor, borderColor: fillColor},
            isDisabled && S.approvalBtnDisabled,
          ]}>
          <Text style={S.approvalBtnText}>{cfg.text || 'Approval'}</Text>
          <FeatherIcon
            name={approvalDropdownVisible ? 'chevron-up' : 'chevron-down'}
            size={conditionalFontScale(11, 12, 12, 13)}
            color={T.onPrimary}
          />
        </TouchableOpacity>

        <Modal
          transparent
          visible={approvalDropdownVisible}
          animationType="none"
          onRequestClose={closeApprovalDropdown}>
          <TouchableWithoutFeedback onPress={closeApprovalDropdown}>
            <View style={S.modalOverlay}>
              <TouchableWithoutFeedback>
                <Animated.View
                  style={[
                    S.approvalMenu,
                    {
                      backgroundColor: T.cardBg,
                      borderColor: T.cardDivider,
                      shadowColor: T.shadowColor,
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
                    const isLast = idx === actions.length - 1;
                    const isActionProcessing = processingButtons.includes(
                      action.key,
                    );
                    return (
                      <TouchableOpacity
                        key={idx}
                        activeOpacity={0.72}
                        style={[
                          S.approvalMenuItem,
                          isActionProcessing && S.menuItemDisabled, // opacity-only dimming
                          !isLast && {
                            borderBottomWidth: 1,
                            borderBottomColor: T.cardDivider,
                          },
                        ]}
                        onPress={() => {
                          closeApprovalDropdown();
                          onButtonPress(action.key, data);
                        }}
                        disabled={isActionProcessing}>
                        {action.icon && (
                          <View
                            style={[
                              S.approvalMenuIcon,
                              {backgroundColor: T.blue + '18'},
                            ]}>
                            <FeatherIcon
                              name={action.icon}
                              size={conditionalFontScale(12, 13, 13, 14)}
                              color={T.blueStrong}
                            />
                          </View>
                        )}
                        <Text
                          style={[
                            S.approvalMenuItemText,
                            {color: T.titleText},
                          ]}>
                          {isActionProcessing ? 'Processing…' : action.label}
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

  const renderCheckbox = () => {
    if (!isMultiSelectMode) {
      return null;
    }
    return (
      <Animated.View
        pointerEvents="none"
        style={[
          S.checkbox,
          {
            transform: [
              {
                scale: checkScaleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.4, 1],
                }),
              },
            ],
            opacity: checkScaleAnim,
          },
        ]}>
        <View
          style={[
            S.checkboxInner,
            {
              borderColor: isSelected ? AppTokens.indigo : T.border,
              backgroundColor: isSelected ? AppTokens.indigo : T.cardBg,
            },
          ]}>
          {isSelected && (
            <FeatherIcon
              name="check"
              size={conditionalFontScale(10, 11, 11, 12)}
              color="#fff"
            />
          )}
        </View>
      </Animated.View>
    );
  };

  const headerButtons = getButtonsByPosition('header');
  const bottomButtons = getButtonsByPosition('bottom').filter(
    bt => getMergedButtonConfig(bt).style !== 'approval_dropdown',
  );
  const approvalConfig = getMergedButtonConfig(BUTTON_TYPES.APPROVAL);
  const hasApprovalButton = approvalConfig.show;
  const shouldShowExpandToggle = isExpandable && expandableFields.length > 0;
  const showFooter =
    (bottomButtons.length > 0 || hasApprovalButton) && !isMultiSelectMode;

  const statusField = fields.find(f => f.type === 'status');
  const statusValue = statusField ? String(data[statusField.key] ?? '') : null;
  const statusColors = statusValue ? getStatusColors(statusValue) : null;

  const expandRotation = expandRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const cardBorderColor = selectedBorderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [T.cardDivider, AppTokens.indigo],
  });

  return (
    <Animated.View
      style={[
        S.card,
        // ✅ All theme-sensitive colors applied inline
        {
          backgroundColor: T.cardBg,
          borderColor: cardBorderColor,
          shadowColor: T.shadowColor,
        },
      ]}>
      {renderCheckbox()}

      <TouchableWithoutFeedback
        onPress={() => {
          if (isMultiSelectMode) {
            onSelectToggle?.(data);
            return;
          }
          if (menuVisible) {
            closeMenu();
          } else {
            onPress?.();
          }
        }}
        onLongPress={() => !isMultiSelectMode && onLongPress?.(data)}>
        <View
          style={[
            S.cardInner,
            isMultiSelectMode && {
              paddingLeft: conditionalScale(40, 44, 44, 48),
            },
          ]}>
          {/* ── Hero Header ── */}
          <View style={[S.heroHeader, {backgroundColor: T.cardBg}]}>
            <View style={S.heroLeft}>
              {headerConfig.title && (
                <HighlightText
                  text={
                    data[headerConfig.title.key] ||
                    headerConfig.title.defaultValue ||
                    ''
                  }
                  query={searchQuery}
                  style={[S.heroTitle, {color: T.titleText}]}
                />
              )}
              {headerConfig.subtitle && (
                <HighlightText
                  text={
                    data[headerConfig.subtitle.key] ||
                    headerConfig.subtitle.defaultValue ||
                    ''
                  }
                  query={searchQuery}
                  style={[S.heroSubtitle, {color: T.subtitleText}]}
                />
              )}
            </View>

            <View style={S.heroRight}>
              {statusValue && statusColors && (
                <View
                  style={[
                    S.heroBadge,
                    {
                      backgroundColor: statusColors.bg,
                      borderColor: statusColors.dot + '55',
                    },
                  ]}>
                  <View
                    style={[
                      S.heroBadgeDot,
                      {backgroundColor: statusColors.dot},
                    ]}
                  />
                  <Text style={[S.heroBadgeText, {color: statusColors.text}]}>
                    {statusValue}
                  </Text>
                </View>
              )}

              {headerButtons.length > 0 && !isMultiSelectMode && (
                <>
                  <TouchableOpacity
                    ref={menuButtonRef}
                    onPress={toggleMenu}
                    activeOpacity={0.72}
                    style={[S.heroMenuTrigger, {backgroundColor: T.surface}]}
                    hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                    <FeatherIcon
                      name="more-vertical"
                      size={conditionalFontScale(16, 17, 18, 18)}
                      color={T.subtitleText}
                    />
                  </TouchableOpacity>

                  <Modal
                    transparent
                    visible={menuVisible}
                    animationType="none"
                    onRequestClose={closeMenu}>
                    <TouchableWithoutFeedback onPress={closeMenu}>
                      <View style={S.modalOverlay}>
                        <TouchableWithoutFeedback>
                          <Animated.View
                            style={[
                              S.menu,
                              {
                                // ✅ dynamic
                                backgroundColor: T.cardBg,
                                borderColor: T.cardDivider,
                                shadowColor: T.shadowColor,
                                top: menuPosition.top,
                                right: menuPosition.right,
                                opacity: menuFadeAnim,
                                transform: [
                                  {
                                    translateY: menuFadeAnim.interpolate({
                                      inputRange: [0, 1],
                                      outputRange: [-6, 0],
                                    }),
                                  },
                                ],
                              },
                            ]}>
                            {headerButtons.map(bt => renderMenuItem(bt))}
                          </Animated.View>
                        </TouchableWithoutFeedback>
                      </View>
                    </TouchableWithoutFeedback>
                  </Modal>
                </>
              )}
            </View>
          </View>

          {/* ── Divider ── */}
          <View style={[S.divider, {backgroundColor: T.rowDivider}]} />

          {/* ── Fields ── */}
          <View style={S.fields}>
            {fields
              .filter(f => f.type !== 'status')
              .map((field, i) => renderField(field, i))}
          </View>

          {/* ── Expandable fields ── */}
          {expanded && expandableFields.length > 0 && (
            <>
              <View
                style={[S.expandDivider, {backgroundColor: T.rowDivider}]}
              />
              <View style={S.fields}>
                {expandableFields.map((field, i) =>
                  renderField(field, i, true),
                )}
              </View>
            </>
          )}

          {/* ── Expand toggle ── */}
          {shouldShowExpandToggle && !isMultiSelectMode && (
            <TouchableOpacity
              onPress={toggleExpanded}
              activeOpacity={0.6}
              style={S.expandArrowBtn}>
              <View style={[S.expandArrowTrack, {backgroundColor: T.surface}]}>
                <Animated.View style={{transform: [{rotate: expandRotation}]}}>
                  <FeatherIcon
                    name="chevron-down"
                    size={conditionalFontScale(15, 16, 16, 17)}
                    color={T.subtitleText}
                  />
                </Animated.View>
              </View>
            </TouchableOpacity>
          )}

          {/* ── Footer ── */}
          {showFooter && (
            <View style={[S.footer, {borderTopColor: T.rowDivider}]}>
              <View style={S.footerLeft}>
                {bottomButtons.map(bt => renderBottomButton(bt))}
              </View>
              {hasApprovalButton && (
                <View style={S.footerRight}>{renderApprovalButton()}</View>
              )}
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
};

// ✅ StyleSheet only contains layout/spacing — zero colors
const S = {
  card: {
    borderRadius: conditionalScale(12, 13, 14, 14),
    // marginHorizontal: conditionalScale(4, 6, 8, 8),
    marginBottom: conditionalVerticalScale(8, 9, 10, 10),
    borderWidth: 1,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  cardInner: {},
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: conditionalScale(14, 15, 16, 16),
    paddingRight: conditionalScale(10, 11, 12, 12),
    paddingTop: conditionalVerticalScale(11, 12, 13, 13),
    paddingBottom: conditionalVerticalScale(11, 12, 13, 13),
    gap: conditionalScale(8, 9, 10, 10),
  },
  heroLeft: {flex: 1, gap: conditionalVerticalScale(2, 2, 3, 3)},
  heroTitle: {
    fontSize: conditionalFontScale(13, 14, 14, 15),
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  heroSubtitle: {
    fontSize: conditionalFontScale(11, 11, 12, 12),
    fontWeight: '400',
  },
  heroRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: conditionalScale(6, 7, 8, 8),
    flexShrink: 0,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: conditionalScale(7, 8, 9, 9),
    paddingVertical: conditionalVerticalScale(3, 3, 4, 4),
    borderRadius: 99,
    borderWidth: 1,
    gap: conditionalScale(4, 4, 5, 5),
  },
  heroBadgeDot: {
    width: conditionalScale(5, 5, 6, 6),
    height: conditionalScale(5, 5, 6, 6),
    borderRadius: 99,
  },
  heroBadgeText: {
    fontSize: conditionalFontScale(10, 10, 11, 11),
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  heroMenuTrigger: {
    width: conditionalScale(28, 29, 30, 30),
    height: conditionalScale(28, 29, 30, 30),
    borderRadius: conditionalScale(8, 8, 9, 9),
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {flex: 1},
  menu: {
    position: 'absolute',
    borderRadius: conditionalScale(10, 11, 12, 12),
    borderWidth: 1,
    minWidth: conditionalScale(140, 150, 160, 160),
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 12,
    paddingVertical: conditionalVerticalScale(4, 5, 6, 6),
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: conditionalScale(12, 13, 14, 14),
    paddingVertical: conditionalVerticalScale(9, 10, 10, 11),
    gap: conditionalScale(10, 11, 12, 12),
  },
  menuItemDisabled: {opacity: 0.4},
  menuItemIcon: {
    width: conditionalScale(28, 29, 30, 30),
    height: conditionalScale(28, 29, 30, 30),
    borderRadius: conditionalScale(8, 8, 9, 9),
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    fontSize: conditionalFontScale(12, 13, 13, 14),
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginHorizontal: conditionalScale(12, 13, 14, 14),
  },
  expandDivider: {
    height: 1,
    marginHorizontal: conditionalScale(12, 13, 14, 14),
    marginTop: conditionalVerticalScale(2, 2, 3, 3),
  },
  fields: {
    paddingHorizontal: conditionalScale(14, 15, 16, 16),
    paddingTop: conditionalVerticalScale(8, 9, 10, 10),
    paddingBottom: conditionalVerticalScale(4, 5, 6, 6),
    gap: conditionalVerticalScale(4, 5, 6, 6),
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: conditionalVerticalScale(20, 21, 22, 22),
    gap: conditionalScale(8, 9, 10, 10),
  },
  fieldLabel: {
    fontSize: conditionalFontScale(11, 11, 12, 12),
    fontWeight: '500',
    flex: 1,
  },
  fieldValue: {
    fontSize: conditionalFontScale(11, 12, 12, 13),
    fontWeight: '500',
    textAlign: 'right',
    flex: 2,
    flexWrap: 'wrap',
  },
  boolBadge: {
    width: conditionalScale(20, 21, 22, 22),
    height: conditionalScale(20, 21, 22, 22),
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandArrowBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: conditionalVerticalScale(4, 5, 5, 6),
  },
  expandArrowTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: conditionalScale(12, 13, 14, 14),
    paddingVertical: conditionalVerticalScale(3, 3, 4, 4),
    borderRadius: 99,
    minWidth: conditionalScale(36, 38, 40, 40),
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: conditionalScale(12, 13, 14, 14),
    paddingTop: conditionalVerticalScale(6, 7, 8, 8),
    paddingBottom: conditionalVerticalScale(8, 9, 10, 10),
    borderTopWidth: 1,
    gap: conditionalScale(6, 7, 8, 8),
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: conditionalScale(6, 7, 8, 8),
    flex: 1,
  },
  footerRight: {flexShrink: 0},
  bottomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: conditionalScale(10, 11, 12, 12),
    paddingVertical: conditionalVerticalScale(5, 5, 6, 6),
    borderRadius: conditionalScale(8, 8, 9, 9),
    borderWidth: 1,
    gap: conditionalScale(5, 5, 6, 6),
  },
  bottomBtnDisabled: {opacity: 0.4},
  bottomBtnText: {
    fontSize: conditionalFontScale(11, 12, 12, 13),
    fontWeight: '600',
  },
  approvalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: conditionalScale(12, 13, 14, 14),
    paddingVertical: conditionalVerticalScale(6, 6, 7, 7),
    borderRadius: conditionalScale(8, 8, 9, 9),
    borderWidth: 1,
    gap: conditionalScale(5, 5, 6, 6),
  },
  approvalBtnDisabled: {opacity: 0.4},
  approvalBtnText: {
    fontSize: conditionalFontScale(11, 12, 12, 13),
    fontWeight: '600',
    color: brand.onPrimary,
  },
  approvalMenu: {
    position: 'absolute',
    borderRadius: conditionalScale(10, 11, 12, 12),
    borderWidth: 1,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 12,
    overflow: 'hidden',
  },
  approvalMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: conditionalScale(14, 15, 16, 16),
    paddingVertical: conditionalVerticalScale(11, 12, 12, 13),
    gap: conditionalScale(10, 11, 12, 12),
  },
  approvalMenuIcon: {
    width: conditionalScale(26, 27, 28, 28),
    height: conditionalScale(26, 27, 28, 28),
    borderRadius: conditionalScale(8, 8, 9, 9),
    alignItems: 'center',
    justifyContent: 'center',
  },
  approvalMenuItemText: {
    fontSize: conditionalFontScale(12, 13, 13, 14),
    fontWeight: '500',
  },
  checkbox: {
    position: 'absolute',
    top: conditionalScale(10, 11, 12, 12),
    left: conditionalScale(10, 11, 12, 12),
    zIndex: 10,
  },
  checkboxInner: {
    width: conditionalScale(20, 21, 22, 22),
    height: conditionalScale(20, 21, 22, 22),
    borderRadius: conditionalScale(10, 11, 11, 12),
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
};

export default DynamicRequestCard;
