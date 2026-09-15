/* eslint-disable react-native/no-inline-styles */
/* eslint-disable curly */
import React from 'react';
import {View, Text, TouchableOpacity, Image} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from '../styles/styles';
import usePalette from '../hooks/usePalette';
import brand from '../theme/brand';

const IdentificationRequestCard = ({
  data = {},
  fields = [],
  buttons = {},
  processingButtons = [],
  gradientColors = [brand.tint, brand.surface],
  highlightGradientColors = ['#DFFFE0', '#EEFFF2'],
  isHighlighted = false,
  onButtonPress = () => {},
}) => {
  const P = usePalette();
  const getGradientColors = () =>
    isHighlighted ? highlightGradientColors : gradientColors;

  const formatValue = (value, fieldType) => {
    switch (fieldType) {
      case 'date':
        const d = new Date(value);
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
          .toString()
          .padStart(2, '0')}/${d.getFullYear()}`;
      default:
        if (value === '') return;
        return value || '';
    }
  };

  const renderField = (field, index) => {
    const value = data[field.key];
    const formattedValue = formatValue(value, field.type);
    return (
      <View key={index} style={{flexDirection: 'row', marginBottom: 4}}>
        <Text style={[styles.ID_FieldLabel, {width: '45%'}]}>
          {field.label}
        </Text>
        <Text style={[styles.ID_FieldValue, {width: '55%'}]}>
          {formattedValue}
        </Text>
      </View>
    );
  };

  const renderButton = (key, config) => {
    if (!config.show) return null;

    const isProcessing = processingButtons.includes(key);
    const isDisabled =
      config.disabled || isProcessing || processingButtons.length > 0;

    return (
      <TouchableOpacity
        key={key}
        onPress={() => onButtonPress(key, data)}
        disabled={isDisabled}
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 8,
            paddingHorizontal: 12,
            backgroundColor: P.primary,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: P.primary,
            marginLeft: 10,
          },
          isDisabled && {opacity: 0.5},
        ]}>
        {isProcessing ? (
          <FontAwesome name="spinner" size={16} color={P.onPrimary} />
        ) : (
          config.icon && (
            <FontAwesome
              name={config.icon}
              size={16}
              color={config.iconColor || P.onPrimary}
              style={{marginRight: config.text ? 6 : 0}}
            />
          )
        )}
        {config.text && (
          <Text
            style={{
              fontSize: 13,
              color: config.textColor || P.onPrimary,
              fontWeight: '600',
            }}>
            {isProcessing ? 'Processing...' : config.text}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={{
        borderRadius: 16,
        overflow: 'hidden',
        marginVertical: 8,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
      }}>
      <LinearGradient
        colors={getGradientColors()}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={{padding: 14, flexDirection: 'row'}}>
        {/* Left Accent Strip */}
        <View
          style={{
            width: 6,
            backgroundColor: isHighlighted ? '#3CB371' : P.primary,
            borderRadius: 4,
            marginRight: 10,
          }}
        />

        {/* Content Section */}
        <View style={{flex: 1}}>
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 8,
              justifyContent: 'space-between',
            }}>
            <View style={{flex: 1}}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <MaterialCommunityIcons
                  name={'card'}
                  size={22}
                  color={P.primaryStrong}
                  style={{marginRight: 8}}
                />
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '700',
                    color: P.primaryStrong,
                  }}>
                  {data.IdentificationTypeId || 'Identification'}
                </Text>
              </View>

              {data.IdentificationNumber ? (
                <Text
                  style={{
                    marginTop: 2,
                    marginLeft: 30,
                    fontSize: 13,
                    color: '#444',
                  }}>
                  {data.IdentificationNumber}
                </Text>
              ) : null}
            </View>

            {/* Header Buttons */}
            <View style={{flexDirection: 'row'}}>
              {Object.entries(buttons)
                .filter(([k, c]) => c.position === 'header' && c.show)
                .map(([k, c]) => renderButton(k, c))}
            </View>

            {data.imageUrl && (
              <Image
                source={{uri: data.imageUrl}}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: '#ddd',
                  marginLeft: 10,
                }}
              />
            )}
          </View>

          {/* Fields */}
          <View style={{marginTop: 4}}>
            {fields.map((f, i) => renderField(f, i))}
          </View>

          {/* Footer Buttons */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
              marginTop: 10,
            }}>
            {Object.entries(buttons)
              .filter(([k, c]) => c.position === 'bottom' && c.show)
              .map(([k, c]) => renderButton(k, c))}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

export default IdentificationRequestCard;
