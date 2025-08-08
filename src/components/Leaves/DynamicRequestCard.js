/* eslint-disable react-native/no-inline-styles */
/* eslint-disable curly */
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import LinearGradient from 'react-native-linear-gradient';

const {width, height} = Dimensions.get('window');

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
        <View key={index} style={styles.infoBlock}>
          <Text style={styles.statusText}>{formattedValue}</Text>
        </View>
      );
    }

    return (
      <View key={index} style={styles.infoBlock}>
        <Text style={styles.label}>{field.label}:</Text>
        <Text style={styles.value}>{formattedValue}</Text>
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
          buttonConfig.style === 'icon' ? styles.iconButton : styles.textButton,
          isDisabled && styles.disabled,
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
                ? styles.iconButtonText
                : styles.textButtonText,
              isDisabled && styles.disabledText,
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
        styles.cardContainer,
        isHighlighted && styles.highlightedContainer,
      ]}>
      <LinearGradient
        colors={getGradientColors()}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View>
            {headerConfig.title && (
              <Text style={styles.cardHeaderText}>
                {data[headerConfig.title.key] ||
                  headerConfig.title.defaultValue}
              </Text>
            )}
            {headerConfig.subtitle && (
              <Text style={styles.value}>
                {data[headerConfig.subtitle.key] ||
                  headerConfig.subtitle.defaultValue}
              </Text>
            )}
          </View>

          {/* Header buttons */}
          <View style={styles.buttonsContainer}>
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
            <View style={styles.sectionDivider} />
            {expandableFields.map((field, index) => renderField(field, index))}
          </>
        )}

        {/* Bottom container */}
        <View style={styles.bottomContainer}>
          {/* Expand toggle */}
          {isExpandable && expandableFields.length > 0 && (
            <TouchableOpacity
              onPress={() => setExpanded(!expanded)}
              style={styles.expandToggle}>
              <FontAwesome
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#fff"
              />
            </TouchableOpacity>
          )}

          {/* Bottom buttons */}
          <View style={styles.bottomButtonsContainer}>
            {Object.entries(buttons)
              .filter(([key, config]) => config.position === 'bottom')
              .map(([key, config]) => renderButton(key, config))}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginVertical: height * 0.01,
    marginHorizontal: width * 0.01,
  },
  highlightedContainer: {
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: width * 0.045,
    elevation: 8,
    shadowColor: '#4CAF50',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  card: {
    borderRadius: width * 0.04,
    padding: width * 0.045,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.015,
  },
  cardHeaderText: {
    fontSize: width * 0.05,
    fontWeight: 'bold',
    color: '#37474F',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: width * 0.025,
  },
  iconButton: {
    backgroundColor: '#0A66C2',
    borderRadius: 20,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#0A66C2',
    borderWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  disabled: {
    backgroundColor: '#BDBDBD',
    borderColor: '#BDBDBD',
  },
  disabledText: {
    color: '#999',
  },
  iconButtonText: {
    color: '#fff',
    fontSize: width * 0.025,
    marginLeft: 4,
  },
  textButtonText: {
    color: '#0A66C2',
    fontWeight: '600',
    fontSize: width * 0.03,
    marginLeft: 6,
  },
  infoBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: height * 0.008,
  },
  label: {
    fontWeight: '600',
    color: '#455A64',
    fontSize: width * 0.035,
  },
  value: {
    color: '#263238',
    fontSize: width * 0.035,
  },
  statusText: {
    fontWeight: '900',
    fontSize: width * 0.035,
    textTransform: 'uppercase',
    color: '#112936ff',
  },
  sectionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#555555',
    marginVertical: 8,
  },
  bottomContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    marginTop: height * 0.01,
  },
  bottomButtonsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    flexDirection: 'row',
    gap: 8,
  },
  expandToggle: {
    alignItems: 'center',
    padding: 5,
    backgroundColor: '#0A66C2',
    borderRadius: 50,
    alignSelf: 'center',
  },
});

export default DynamicRequestCard;
