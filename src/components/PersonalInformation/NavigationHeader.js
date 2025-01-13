import React from 'react';
import {TouchableOpacity, View, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import {hp, wp} from '../../constants/Size';

const NavigationHeader = ({onGoBack, onRefresh}) => {
  return {
    // headerLeft: () => (
    //   <TouchableOpacity onPress={onGoBack} style={styles.headerLeftButton}>
    //     <Icon name="arrow-left" size={20} color="white" />
    //   </TouchableOpacity>
    // ),
    headerRight: () => (
      <View style={styles.headerRightButtonView}>
        <TouchableOpacity onPress={onRefresh} style={styles.headerRightButton}>
          <Icon name="refresh" size={20} color="white" />
        </TouchableOpacity>
      </View>
    ),
    headerStyle: {
      backgroundColor: '#FFA500',
      height: 70,
    },
    headerTintColor: '#fff',
    headerTitleAlign: 'center',
    headerTitleStyle: {
      fontSize: hp(2.3),
      color: 'white',
    },
  };
};

const styles = StyleSheet.create({
  // headerLeftButton: {
  //   width: wp(9),
  //   alignItems: 'center',
  //   height: hp(6),
  //   justifyContent: 'center',
  //   marginLeft: wp(3),
  // },
  headerRightButtonView: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: wp(3), // Adjusted margin
  },
  headerRightButton: {
    width: wp(9),
    alignItems: 'center',
    height: hp(6),
    justifyContent: 'center',
    marginRight: 9,
    marginHorizontal: 50,
  },
});

export default NavigationHeader;
