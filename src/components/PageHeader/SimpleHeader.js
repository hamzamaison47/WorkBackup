import React from 'react';
import {TouchableOpacity, View, StyleSheet, Image} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import {hp, wp} from '../../constants/Size';
import NotificationButton from '../NotificationButton';
import logo from '../../assets/cloud.png';

const SimpleHeader = ({onToggleDrawer, onRefresh, onShowNotify, onCount}) => ({
  headerTitle: () => {
    '';
  },
  headerLeft: () => (
    <View style={styles.rightSideView}>
      <TouchableOpacity onPress={onToggleDrawer} style={styles.leftSide}>
        <Icon name="bars" size={hp(6)} color="white" />
      </TouchableOpacity>
      <Image source={logo} style={styles.headerImage} />
    </View>
  ),
  headerRight: () => (
    <View style={styles.rightSideView}>
      <TouchableOpacity onPress={onRefresh} style={styles.rightSide}>
        <Icon name="refresh" size={hp(6)} color="white" />
      </TouchableOpacity>

      <NotificationButton onPress={onShowNotify} notificationCount={onCount} />
    </View>
  ),
  headerStyle: {
    backgroundColor: '#FFA500',
    height: hp(18),
  },
  headerTintColor: '#fff',
  headerTitleAlign: 'center',
  headerTitleStyle: {
    fontSize: hp(4.6),
    color: 'white',
  },
});

const styles = StyleSheet.create({
  rightSideView: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: wp(3), // Adjusted margin
  },
  rightSide: {
    width: wp(9),
    alignItems: 'center',
    height: hp(6),
    justifyContent: 'center',
    marginRight: 9,
  },
  leftSide: {
    width: wp(9),
    alignItems: 'center',
    height: hp(6),
    justifyContent: 'center',
    marginRight: 9,
    marginLeft: 5,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  headerImage: {
    width: wp(25),
    height: hp(7),
  },
});

export default SimpleHeader;
