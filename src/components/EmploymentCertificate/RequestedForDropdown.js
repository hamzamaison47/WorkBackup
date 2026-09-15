/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {Platform, StyleSheet, Dimensions, View, Text} from 'react-native';
import {Dropdown} from 'react-native-element-dropdown';
import brand from '../../theme/brand';

const {width, height} = Dimensions.get('window');

const RequestedForDropdown = ({selectedValue, data, onSelect}) => {
  const dropdownData = data.map(item => ({
    label: item.RequestedForDescription || item.RequestedForId,
    value: item.RequestedForId,
    originalItem: item,
  }));

  // Handle selection
  const handleSelection = item => {
    onSelect(item);
  };

  return (
    <Dropdown
      style={styles.input}
      data={dropdownData}
      labelField="label"
      valueField="value"
      placeholder="Select Requested For"
      value={selectedValue?.value ? selectedValue : null}
      onChange={handleSelection}
      placeholderStyle={styles.placeholder}
      selectedTextStyle={styles.selectedText}
      itemTextStyle={styles.itemText}
      activeColor={brand.tint}
      containerStyle={[
        styles.container,
        {marginTop: Platform.OS === 'ios' ? 5 : 2, zIndex: 999},
      ]}
      itemContainerStyle={styles.itemContainer}
      maxHeight={280}
      dropdownPosition="auto"
      search
      searchPlaceholder="Search Requested For"
      inputSearchStyle={styles.searchInput}
      iconStyle={styles.icon}
      keyboardAvoiding
      renderItem={(item, selected) => (
        <View style={[styles.item, selected && styles.selectedItem]}>
          <Text style={styles.itemText}>{item.label}</Text>
        </View>
      )}
    />
  );
};

export default RequestedForDropdown;

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: width * 0.02,
    padding: width * 0.025,
    marginTop: height * 0.007,
    fontSize: width * 0.04,
    color: '#333',
    backgroundColor: '#fff',
  },
  placeholder: {
    color: '#909090ff',
    fontSize: width * 0.038,
  },
  selectedText: {
    color: '#444',
    fontWeight: '400',
    fontSize: width * 0.038,
  },
  itemText: {
    color: '#444',
    fontSize: width * 0.038,
  },
  container: {
    borderWidth: 1.5,
    borderColor: brand.primaryStrong,
    borderRadius: width * 0.025,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  itemContainer: {
    paddingHorizontal: width * 0.03,
  },
  searchInput: {
    color: '#444',
    backgroundColor: '#fff',
    fontSize: width * 0.038,
  },
  icon: {
    width: width * 0.055,
    height: width * 0.055,
  },
  item: {
    padding: width * 0.03,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedItem: {
    backgroundColor: brand.tint,
  },
});
