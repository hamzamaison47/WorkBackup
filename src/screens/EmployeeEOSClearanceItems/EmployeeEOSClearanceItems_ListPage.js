import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

const EmployeeEOSClearanceItemsListPage = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello World</Text>
    </View>
  );
};

export default EmployeeEOSClearanceItemsListPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center', // Vertical center
    alignItems: 'center', // Horizontal center
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 50,
    fontWeight: 'bold',
  },
});
