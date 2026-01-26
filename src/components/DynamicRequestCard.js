/* eslint-disable react-native/no-inline-styles */
/* eslint-disable curly */
import React, {useState, useEffect, useRef} from 'react';
import {View, Text, TouchableOpacity, Animated} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import LinearGradient from 'react-native-linear-gradient';
import styles from '../styles/styles';
import {verticalScale} from '../store/utils/scaling';

// Button type constants for header buttons
const BUTTON_TYPES = {
  EDIT: 'edit',
  DELETE: 'delete',
  ATTACHMENT: 'attachment',
  SUBMIT: 'submit',
  VIEW: 'view',
};

const DynamicRequestCard = ({
  data = {},
  fields = [],
  headerConfig = {},
  buttons = {}, // Now the ONLY source of button config
  gradientColors = ['#6ee0ff', '#bddeff', '#cce6ff'],
  highlightGradientColors = ['#E8F5E8', '#F0FFF0'],
  isHighlighted = false,
  expandableFields = [],
  isExpandable = false, // Changed default to false
  onButtonPress = () => {},
  processingButtons = [],
  showNavigationArrow = false,
  isRTL = false,
}) => {
  const [expanded, setExpanded] = useState(false);
  const arrowAnim = useRef(new Animated.Value(0)).current;
  const animationIntervalRef = useRef(null);

  useEffect(() => {
    if (isHighlighted) {
      console.log('Card highlighted');
    }
  }, [isHighlighted]);

  // Continuous arrow animation every 3 seconds
  useEffect(() => {
    if (showNavigationArrow) {
      const startAnimation = () => {
        Animated.sequence([
          Animated.timing(arrowAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(arrowAnim, {
            toValue: 0.8,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(arrowAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(arrowAnim, {
            toValue: 0.8,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      };

      startAnimation();
      animationIntervalRef.current = setInterval(() => {
        startAnimation();
      }, 3000);

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

  // Helper function to get gradient colors
  const getGradientColors = () => {
    return isHighlighted ? highlightGradientColors : gradientColors;
  };

  const formatValue = (value, fieldType) => {
    switch (fieldType) {
      case 'date': {
        const d = new Date(value);
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const year = d.getFullYear();
        return `${month}/${day}/${year}`;
      }
      case 'currency':
        return `${value}`;
      case 'status':
        return value;
      case 'boolean':
        return value;
      default:
        return value || '';
    }
  };

  // Default button configurations (all hidden by default)
  const defaultButtonConfigs = {
    [BUTTON_TYPES.EDIT]: {
      show: false,
      text: 'Edit',
      icon: 'pencil',
      iconSize: 14,
      iconColor: '#fff',
      position: 'header',
      style: 'icon',
      backgroundColor: '#0A66C2',
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
      backgroundColor: '#ff4444',
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
      backgroundColor: '#666',
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
      backgroundColor: '#28a745',
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
      backgroundColor: '#17a2b8',
      customStyle: {},
    },
  };

  // Merge user-provided button configs with defaults
  const getMergedButtonConfig = buttonType => {
    const defaultConfig = defaultButtonConfigs[buttonType] || {};
    const userConfig = buttons[buttonType] || {};

    return {
      ...defaultConfig,
      ...userConfig,
      show: userConfig.show === true, // Explicit true required
    };
  };

  // Get all button types that are enabled
  const getEnabledButtons = () => {
    return Object.keys(buttons).filter(buttonType => {
      const config = getMergedButtonConfig(buttonType);
      return config.show === true;
    });
  };

  // Separate buttons by position
  const getButtonsByPosition = position => {
    return getEnabledButtons().filter(buttonType => {
      const config = getMergedButtonConfig(buttonType);
      return config.position === position;
    });
  };

  // Render field row
  const renderField = (field, index) => {
    const value = data[field.key];
    const formattedValue = formatValue(value, field.type);

    if (field.type === 'status') {
      return (
        <View key={index} style={styles.DRC_InfoBlock}>
          <Text style={styles.DRC_StatusText}>{formattedValue}</Text>
        </View>
      );
    }

    if (field.type === 'boolean') {
      return (
        <View key={index} style={styles.DRC_InfoBlock}>
          <Text style={styles.DRC_Label}>{field.label}:</Text>
          <View
            style={{flex: 1, alignItems: 'flex-end', justifyContent: 'center'}}>
            {formattedValue === true ||
            formattedValue === 'true' ||
            formattedValue === 1 ||
            formattedValue === '1' ? (
              <FontAwesome name="check" size={16} color="#000000ff" />
            ) : null}
          </View>
        </View>
      );
    }

    return (
      <View key={index} style={styles.DRC_InfoBlock}>
        <Text style={styles.DRC_Label}>{field.label}:</Text>
        <Text
          style={[
            styles.DRC_Value,
            showNavigationArrow && styles.DRC_ValueWithArrow,
          ]}>
          {formattedValue}
        </Text>
      </View>
    );
  };

  // Render button
  const renderButton = buttonType => {
    const buttonConfig = getMergedButtonConfig(buttonType);

    if (!buttonConfig.show) return null;

    const isProcessing = processingButtons.includes(buttonType);
    const isDisabled =
      buttonConfig.disabled || isProcessing || processingButtons.length > 0;

    // For icon buttons
    if (buttonConfig.style === 'icon') {
      return (
        <TouchableOpacity
          key={buttonType}
          onPress={() => onButtonPress(buttonType, data)}
          disabled={isDisabled}
          style={[
            styles.DRC_IconButton,
            {backgroundColor: buttonConfig.backgroundColor || '#0A66C2'},
            isDisabled && styles.DRC_Disabled,
            buttonConfig.customStyle,
          ]}>
          {isProcessing ? (
            <FontAwesome
              name="spinner"
              size={buttonConfig.iconSize || 16}
              color={buttonConfig.iconColor || '#fff'}
            />
          ) : (
            buttonConfig.icon && (
              <FontAwesome
                name={buttonConfig.icon}
                size={buttonConfig.iconSize || 16}
                color={isDisabled ? '#999' : buttonConfig.iconColor || '#fff'}
              />
            )
          )}
        </TouchableOpacity>
      );
    }

    // For text buttons
    return (
      <TouchableOpacity
        key={buttonType}
        onPress={() => onButtonPress(buttonType, data)}
        disabled={isDisabled}
        style={[
          styles.DRC_TextButton,
          isDisabled && styles.DRC_Disabled,
          buttonConfig.customStyle,
        ]}>
        {buttonConfig.icon && !isProcessing && (
          <FontAwesome
            name={buttonConfig.icon}
            size={buttonConfig.iconSize || 16}
            color={isDisabled ? '#999' : buttonConfig.iconColor || '#0A66C2'}
          />
        )}
        {isProcessing && (
          <FontAwesome
            name="spinner"
            size={buttonConfig.iconSize || 16}
            color="#999"
          />
        )}
        <Text
          style={[
            styles.DRC_TextButtonText,
            isDisabled && styles.DRC_DisabledText,
            {
              color: isDisabled ? '#999' : buttonConfig.textColor || '#0A66C2',
            },
          ]}>
          {isProcessing ? 'Processing...' : buttonConfig.text}
        </Text>
      </TouchableOpacity>
    );
  };

  // Render navigation arrow with continuous animation
  const renderNavigationArrow = () => {
    if (!showNavigationArrow) return null;

    const arrowStyle = {
      transform: [
        {
          translateX: arrowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 8],
          }),
        },
        {
          scale: arrowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.2],
          }),
        },
      ],
      opacity: arrowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0.9],
      }),
    };

    return (
      <Animated.View style={[styles.DRC_NavigationArrow, arrowStyle]}>
        <FontAwesome name="chevron-right" size={14} color="#0A66C2" />
      </Animated.View>
    );
  };

  const headerButtons = getButtonsByPosition('header');
  const bottomButtons = getButtonsByPosition('bottom');
  const hasHeaderButtons = headerButtons.length > 0;
  const hasBottomButtons = bottomButtons.length > 0;
  const shouldShowExpandToggle = isExpandable && expandableFields.length > 0;

  return (
    <View
      style={[
        styles.DRC_CardContainer,
        isHighlighted && styles.DRC_HighlightedContainer,
        showNavigationArrow && styles.DRC_ClickableContainer,
      ]}>
      <LinearGradient
        colors={getGradientColors()}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.DRC_Card}>
        {renderNavigationArrow()}

        {/* Header */}
        <View
          style={[
            styles.DRC_CardHeader,
            isRTL && {flexDirection: 'row-reverse'},
            !hasHeaderButtons && {marginBottom: verticalScale(12)}, // Dynamic spacing
          ]}>
          <View
            style={[
              showNavigationArrow
                ? styles.DRC_HeaderContentWithArrow
                : {flex: 1},
              isRTL && {alignItems: 'flex-end'},
            ]}>
            {headerConfig.title && (
              <Text
                style={[
                  styles.DRC_CardHeaderText,
                  isRTL && {textAlign: 'right'},
                ]}>
                {data[headerConfig.title.key] ||
                  headerConfig.title.defaultValue}
              </Text>
            )}
            {headerConfig.subtitle && (
              <Text
                style={[
                  styles.DRC_CardSubHeaderText,
                  isRTL && {textAlign: 'right'},
                ]}>
                {data[headerConfig.subtitle.key] ||
                  headerConfig.subtitle.defaultValue}
              </Text>
            )}
          </View>

          {/* Header buttons - only render if buttons exist */}
          {hasHeaderButtons && (
            <View
              style={[
                styles.DRC_ButtonsContainer,
                showNavigationArrow && styles.DRC_ButtonsContainerWithArrow,
                isRTL && {flexDirection: 'row-reverse'},
              ]}>
              {headerButtons.map(buttonType => renderButton(buttonType))}
            </View>
          )}
        </View>

        {/* Main fields */}
        {fields.map((field, index) => renderField(field, index))}

        {/* Expandable content */}
        {expanded && expandableFields.length > 0 && (
          <>
            <View style={styles.DRC_SectionDivider} />
            {expandableFields.map((field, index) => renderField(field, index))}
          </>
        )}

        {/* Bottom container - only render if needed */}
        {(shouldShowExpandToggle || hasBottomButtons) && (
          <View
            style={[
              styles.DRC_BottomContainer,
              !shouldShowExpandToggle &&
                hasBottomButtons && {
                  alignItems: 'flex-end',
                  marginTop: verticalScale(8),
                },
            ]}>
            {/* Expand toggle */}
            {shouldShowExpandToggle && (
              <TouchableOpacity
                onPress={() => setExpanded(!expanded)}
                style={styles.DRC_ExpandToggle}>
                <FontAwesome
                  name={expanded ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color="#fff"
                />
              </TouchableOpacity>
            )}

            {/* Bottom buttons */}
            {hasBottomButtons && (
              <View
                style={[
                  shouldShowExpandToggle
                    ? styles.DRC_BottomButtonsContainer
                    : {flexDirection: 'row', gap: 8},
                  showNavigationArrow &&
                    shouldShowExpandToggle &&
                    styles.DRC_BottomButtonsContainerWithArrow,
                ]}>
                {bottomButtons.map(buttonType => renderButton(buttonType))}
              </View>
            )}
          </View>
        )}
      </LinearGradient>
    </View>
  );
};

export default DynamicRequestCard;
export {BUTTON_TYPES};
