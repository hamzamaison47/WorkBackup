/* eslint-disable react-native/no-inline-styles */
/* eslint-disable curly */
import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

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
  }, [menuVisible, menuFadeAnim]); // Added menuFadeAnim to dependencies

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
      // Subtle pulse animation when highlighted
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
  }, [isHighlighted, scaleAnim]); // Added scaleAnim to dependencies

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
  }, [showNavigationArrow, arrowAnim]); // Added arrowAnim to dependencies

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
      ['pending', 'waiting', 'processing', 'in progress'].includes(statusStr)
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
      position: 'header',
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

    if (field.type === 'status') return null;

    if (field.type === 'boolean') {
      const isTrue =
        formattedValue === true ||
        formattedValue === 'true' ||
        formattedValue === 1 ||
        formattedValue === '1';
      return (
        <View key={index} style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>{field.label}</Text>
          <View
            style={[
              styles.booleanBadge,
              isTrue ? styles.booleanTrue : styles.booleanFalse,
            ]}>
            <FontAwesome
              name={isTrue ? 'check' : 'times'}
              size={12}
              color={isTrue ? '#065f46' : COLOR_PALETTE.gray[400]}
            />
            <Text
              style={[
                styles.booleanText,
                isTrue ? styles.booleanTextTrue : styles.booleanTextFalse,
              ]}>
              {isTrue ? 'Yes' : 'No'}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View key={index} style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>{field.label}</Text>
        <View style={styles.fieldValueWrapper}>
          <Text
            style={[
              styles.fieldValue,
              showNavigationArrow && styles.fieldValueWithArrow,
            ]}
            numberOfLines={1}>
            {formattedValue}
          </Text>
          {field.trend && (
            <View style={styles.trendIndicator}>
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
        style={[styles.menuItem, isDisabled && styles.menuItemDisabled]}>
        <View style={styles.menuItemContent}>
          {isProcessing ? (
            <FontAwesome
              name="spinner"
              size={16}
              color={COLOR_PALETTE.gray[400]}
              style={[styles.menuIcon, styles.spinning]}
            />
          ) : (
            buttonConfig.icon && (
              <FontAwesome
                name={buttonConfig.icon}
                size={16}
                color={
                  isDisabled ? COLOR_PALETTE.gray[300] : COLOR_PALETTE.gray[600]
                }
                style={styles.menuIcon}
              />
            )
          )}
          <Text
            style={[
              styles.menuItemText,
              isDisabled && styles.menuItemTextDisabled,
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
            styles.iconButton,
            {
              backgroundColor:
                buttonConfig.backgroundColor || COLOR_PALETTE.primary,
            },
            isDisabled && styles.disabledButton,
            buttonConfig.customStyle,
          ]}>
          {isProcessing ? (
            <FontAwesome
              name="spinner"
              size={buttonConfig.iconSize || 14}
              color={buttonConfig.iconColor || '#fff'}
              style={styles.spinning}
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
          styles.textButton,
          isDisabled && styles.disabledButton,
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
            style={styles.spinning}
          />
        )}
        <Text
          style={[
            styles.textButtonText,
            isDisabled && styles.disabledText,
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
          styles.navigationArrow,
          {
            transform: [{translateX}],
            opacity,
          },
        ]}>
        <View style={styles.navigationArrowInner}>
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
    <View style={styles.cardContainer}>
      <Animated.View
        style={[
          styles.card,
          isHighlighted && styles.cardHighlighted,
          {
            transform: [{scale: scaleAnim}],
          },
        ]}>
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.cardInner}>
          {renderNavigationArrow()}

          {/* Header */}
          <View style={[styles.header, isRTL && styles.headerRTL]}>
            <View
              style={[
                styles.headerContent,
                showNavigationArrow && styles.headerContentWithArrow,
              ]}>
              {headerConfig.title && (
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {data[headerConfig.title.key] ||
                    headerConfig.title.defaultValue}
                </Text>
              )}
              {headerConfig.subtitle && (
                <Text style={styles.headerSubtitle} numberOfLines={1}>
                  {data[headerConfig.subtitle.key] ||
                    headerConfig.subtitle.defaultValue}
                </Text>
              )}
            </View>

            <View style={styles.headerRightSection}>
              {/* Status Badge */}
              {statusValue && statusColors && (
                <View
                  style={[
                    styles.statusBadge,
                    {backgroundColor: statusColors.bg},
                  ]}>
                  <View
                    style={[
                      styles.statusDot,
                      {backgroundColor: statusColors.dot},
                    ]}
                  />
                  <Text style={[styles.statusText, {color: statusColors.text}]}>
                    {statusValue}
                  </Text>
                </View>
              )}

              {/* 3-Dot Menu */}
              {hasHeaderButtons && (
                <View style={styles.menuContainer}>
                  <TouchableOpacity
                    style={styles.menuButton}
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
                          styles.dropdownMenu,
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
                        <View style={styles.dropdownArrow} />
                        {headerButtons.map(buttonType =>
                          renderMenuButton(buttonType),
                        )}
                      </Animated.View>
                      <TouchableOpacity
                        style={styles.dropdownOverlay}
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
          <View style={styles.fieldsContainer}>
            {fields
              .filter(f => f.type !== 'status')
              .map((field, index) => renderField(field, index))}
          </View>

          {/* Expandable fields */}
          {expanded && expandableFields.length > 0 && (
            <Animated.View style={styles.expandedFieldsContainer}>
              {expandableFields.map((field, index) =>
                renderField(field, index),
              )}
            </Animated.View>
          )}

          {/* Footer */}
          {(shouldShowExpandToggle || hasBottomButtons) && (
            <View style={styles.footer}>
              {shouldShowExpandToggle && (
                <TouchableOpacity
                  onPress={() => setExpanded(!expanded)}
                  style={styles.expandButton}>
                  <Text style={styles.expandButtonText}>
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
                <View style={styles.bottomButtons}>
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

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 12,
    marginVertical: 6,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: COLOR_PALETTE.gray[900],
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
    borderWidth: 1,
    borderColor: COLOR_PALETTE.gray[100],
    overflow: 'hidden',
  },
  cardInner: {
    padding: 16,
  },
  cardHighlighted: {
    borderColor: COLOR_PALETTE.primary,
    borderWidth: 1.5,
    ...Platform.select({
      ios: {
        shadowColor: COLOR_PALETTE.primary,
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 5,
      },
    }),
  },

  // Navigation Arrow
  navigationArrow: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -7,
    zIndex: 1,
  },
  navigationArrowInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLOR_PALETTE.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  headerContent: {
    flex: 1,
    paddingRight: 12,
  },
  headerContentWithArrow: {
    paddingRight: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLOR_PALETTE.gray[900],
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLOR_PALETTE.gray[500],
    fontWeight: '500',
    letterSpacing: -0.2,
  },

  // Header Right Section
  headerRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Status Badge
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  // Menu
  menuContainer: {
    position: 'relative',
  },
  menuButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLOR_PALETTE.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Dropdown Menu
  dropdownOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 999,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    minWidth: 180,
    ...Platform.select({
      ios: {
        shadowColor: COLOR_PALETTE.gray[900],
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
    borderWidth: 1,
    borderColor: COLOR_PALETTE.gray[100],
    zIndex: 1000,
  },
  dropdownArrow: {
    position: 'absolute',
    top: -6,
    right: 12,
    width: 12,
    height: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: COLOR_PALETTE.gray[100],
    transform: [{rotate: '45deg'}],
  },
  menuItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: 12,
    width: 18,
    textAlign: 'center',
  },
  menuItemText: {
    fontSize: 14,
    color: COLOR_PALETTE.gray[700],
    fontWeight: '500',
  },
  menuItemTextDisabled: {
    color: COLOR_PALETTE.gray[300],
  },

  // Fields
  fieldsContainer: {
    gap: 12,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 13,
    color: COLOR_PALETTE.gray[500],
    fontWeight: '500',
    flex: 1,
    letterSpacing: -0.2,
  },
  fieldValueWrapper: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 4,
  },
  fieldValue: {
    fontSize: 13,
    color: COLOR_PALETTE.gray[800],
    fontWeight: '600',
    textAlign: 'right',
    letterSpacing: -0.2,
  },
  fieldValueWithArrow: {
    marginRight: 30,
  },
  trendIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLOR_PALETTE.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Boolean Badge
  booleanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  booleanTrue: {
    backgroundColor: COLOR_PALETTE.successLight,
  },
  booleanFalse: {
    backgroundColor: COLOR_PALETTE.gray[100],
  },
  booleanText: {
    fontSize: 11,
    fontWeight: '600',
  },
  booleanTextTrue: {
    color: '#065f46',
  },
  booleanTextFalse: {
    color: COLOR_PALETTE.gray[500],
  },

  // Expanded Fields
  expandedFieldsContainer: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLOR_PALETTE.gray[100],
    gap: 12,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLOR_PALETTE.gray[100],
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: COLOR_PALETTE.gray[50],
  },
  expandButtonText: {
    fontSize: 12,
    color: COLOR_PALETTE.gray[600],
    fontWeight: '600',
  },
  bottomButtons: {
    flexDirection: 'row',
    gap: 8,
  },

  // Buttons
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLOR_PALETTE.gray[900],
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  textButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLOR_PALETTE.gray[50],
    gap: 8,
    borderWidth: 1,
    borderColor: COLOR_PALETTE.gray[200],
  },
  textButtonText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: COLOR_PALETTE.gray[400],
  },

  // Animations
  spinning: {
    transform: [{rotate: '45deg'}],
  },
});

export default DynamicRequestCard;
export {BUTTON_TYPES};
