import React from 'react';
import {View, TouchableOpacity, Text, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const SelectionHeader = ({reqId, reqType, expanded, onToggle}) => {
  return (
    <TouchableOpacity onPress={onToggle}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Request ID</Text>
        <Text style={styles.sectionTitle}>Request Type</Text>
        <Text style={styles.sectionTitle}>{}</Text>
      </View>
      <View style={styles.sectionSubHeader}>
        <Text style={styles.sectionSubTitle}>{reqId}</Text>
        <Text style={styles.sectionSubTitle}>{reqType}</Text>
        <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={16} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFA500',
    padding: 10,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionSubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 5,
  },
  sectionSubTitle: {
    color: '#333333',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

export default SelectionHeader;
