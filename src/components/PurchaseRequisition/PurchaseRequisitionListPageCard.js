/* eslint-disable react-native/no-inline-styles */
/* eslint-disable curly */
import React, {useState, useEffect} from 'react';
import {View, Text, TouchableOpacity, FlatList} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import styles from '../../styles/styles';
import usePalette from '../../hooks/usePalette';

const DynamicPurchaseReqHeaderCard = ({
  dataList = [], // fixed: array for FlatList
  fields = [],
  buttons = {},
  expandableFields = [],
  isExpandable = true,
  onButtonPress = () => {},
  processingButtons = [],
}) => {
  const [expanded, setExpanded] = useState(false);
  const P = usePalette();

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
      default:
        return value || 'N/A';
    }
  };

  // Render field row
  const renderField = (field, item, index) => {
    const value = item[field.key];
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
  const renderButton = (buttonKey, buttonConfig, rowData) => {
    if (!buttonConfig.show) return null;

    const isProcessing = processingButtons.includes(buttonKey);
    const isDisabled =
      buttonConfig.disabled || isProcessing || processingButtons.length > 0;

    return (
      <TouchableOpacity
        key={buttonKey}
        onPress={() => onButtonPress(buttonKey, rowData)}
        disabled={isDisabled}
        style={[
          buttonConfig.style === 'icon'
            ? styles.List_IconButton
            : styles.List_TextButton,
          isDisabled && styles.List_Disabled,
          buttonConfig.customStyle,
        ]}>
        {buttonConfig.icon && !isProcessing && (
          <FontAwesome
            name={buttonConfig.icon}
            size={buttonConfig.iconSize || 16}
            color={
              isDisabled ? '#999' : buttonConfig.iconColor || P.primaryStrong
            }
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
                ? styles.List_IconButtonText
                : styles.List_TextButtonText,
              isDisabled && styles.List_DisabledText,
              {
                color: isDisabled
                  ? '#999'
                  : buttonConfig.textColor || P.primary,
              },
            ]}>
            {isProcessing ? 'Processing...' : buttonConfig.text}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderItem = ({item}) => (
    <View style={styles.List_ItemContainer}>
      <View style={styles.List_ItemContent}>
        {fields.map((field, index) => renderField(field, item, index))}
      </View>

      {/* Row buttons */}
      <View style={styles.List_ItemButtons}>
        {Object.entries(buttons)
          .filter(([key, config]) => config.position === 'row')
          .map(([key, config]) => renderButton(key, config, item))}
      </View>
    </View>
  );

  return (
    <FlatList
      data={dataList}
      keyExtractor={(item, index) => index.toString()}
      renderItem={renderItem}
      ItemSeparatorComponent={() => <View style={styles.List_Separator} />}
      contentContainerStyle={styles.List_Container}
    />
  );
};

export default DynamicPurchaseReqHeaderCard;
