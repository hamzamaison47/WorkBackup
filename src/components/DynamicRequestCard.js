/* eslint-disable react-native/no-inline-styles */
/* eslint-disable curly */
import React, {useState, useEffect} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import LinearGradient from 'react-native-linear-gradient';
import {styles} from '../styles/styles';

const DynamicRequestCard = ({
  data = {},
  fields = [],
  headerConfig = {},
  buttons = {},
  gradientColors = ['#6ee0ff', '#bddeff', '#cce6ff'],
  highlightGradientColors = ['#E8F5E8', '#F0FFF0'],
  isHighlighted = false,
  expandableFields = [],
  isExpandable = true,
  onButtonPress = () => {},
  processingButtons = [], // New prop to track which buttons are processing
}) => {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (isHighlighted) {
      console.log('Card highlighted');
    }
  }, [isHighlighted]);

  // Helper function to get gradient colors
  const getGradientColors = () => {
    return isHighlighted ? highlightGradientColors : gradientColors;
  };

  // Helper function to format values based on field type
  const formatValue = (value, fieldType) => {
    switch (fieldType) {
      case 'date':
        return new Date(value).toLocaleDateString('en-GB', {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
        });
      case 'currency':
        return `${value}`;
      case 'status':
        return value?.toUpperCase();
      default:
        return value || 'N/A';
    }
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

    return (
      <View key={index} style={styles.DRC_InfoBlock}>
        <Text style={styles.DRC_Label}>{field.label}:</Text>
        <Text style={styles.DRC_Value}>{formattedValue}</Text>
      </View>
    );
  };

  // Render button
  const renderButton = (buttonKey, buttonConfig) => {
    if (!buttonConfig.show) return null;

    const isProcessing = processingButtons.includes(buttonKey);
    const isDisabled =
      buttonConfig.disabled || isProcessing || processingButtons.length > 0;

    return (
      <TouchableOpacity
        key={buttonKey}
        onPress={() => onButtonPress(buttonKey, data)}
        disabled={isDisabled}
        style={[
          buttonConfig.style === 'icon'
            ? styles.DRC_IconButton
            : styles.DRC_TextButton,
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
        {buttonConfig.text && (
          <Text
            style={[
              buttonConfig.style === 'icon'
                ? styles.DRC_IconButtonText
                : styles.DRC_TextButtonText,
              isDisabled && styles.DRC_DisabledText,
              {
                color: isDisabled
                  ? '#999'
                  : buttonConfig.textColor || '#0A66C2',
              },
            ]}>
            {isProcessing ? 'Processing...' : buttonConfig.text}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.DRC_CardContainer,
        isHighlighted && styles.DRC_HighlightedContainer,
      ]}>
      <LinearGradient
        colors={getGradientColors()}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.DRC_Card}>
        {/* Header */}
        <View style={styles.DRC_CardHeader}>
          <View>
            {headerConfig.title && (
              <Text style={styles.DRC_CardHeaderText}>
                {data[headerConfig.title.key] ||
                  headerConfig.title.defaultValue}
              </Text>
            )}
            {headerConfig.subtitle && (
              <Text style={styles.DRC_Value}>
                {data[headerConfig.subtitle.key] ||
                  headerConfig.subtitle.defaultValue}
              </Text>
            )}
          </View>

          {/* Header buttons */}
          <View style={styles.DRC_ButtonsContainer}>
            {Object.entries(buttons)
              .filter(([key, config]) => config.position === 'header')
              .map(([key, config]) => renderButton(key, config))}
          </View>
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

        {/* Bottom container */}
        <View style={styles.DRC_BottomContainer}>
          {/* Expand toggle */}
          {isExpandable && expandableFields.length > 0 && (
            <TouchableOpacity
              onPress={() => setExpanded(!expanded)}
              style={styles.DRC_ExpandToggle}>
              <FontAwesome
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#fff"
              />
            </TouchableOpacity>
          )}

          {/* Bottom buttons */}
          <View style={styles.DRC_BottomButtonsContainer}>
            {Object.entries(buttons)
              .filter(([key, config]) => config.position === 'bottom')
              .map(([key, config]) => renderButton(key, config))}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

export default DynamicRequestCard;
