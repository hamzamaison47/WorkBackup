import React, {useState, useEffect, useContext} from 'react';
import {View, StyleSheet, Text} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {UserContext} from '../../context/UserContext';

const EditPersonalInfo = () => {
  const navigation = useNavigation();
  const {userData} = useContext(UserContext);

  return (
    <View style={styles.container}>
      <Text>Hello World!!!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFF',
  },
});

export default EditPersonalInfo;
