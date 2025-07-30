/* eslint-disable react/react-in-jsx-scope */
import {TouchableOpacity, View, StyleSheet, Text} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

import {hp, wp} from '../../constants/Size';

import NotificationButton from '../NotificationButton';
import LogoutButton from '../LogoutButton';

const MainPageHeader = ({
  onToggleDrawer,
  onTitle,
  onShowNotify,
  onCount,
  onLogout,
  isBack = false,
  onDatPress,
  selectedDat,
  defaultDat,
}) => ({
  headerTitle: () => null,
  headerLeft: () => (
    <View style={styles.leftContainer}>
      <TouchableOpacity onPress={onToggleDrawer} style={styles.leftSide}>
        <Icon
          name={isBack ? 'arrow-left' : 'bars'}
          size={hp(6)}
          color="white"
        />
      </TouchableOpacity>
      <Text style={styles.title}>{onTitle}</Text>
    </View>
  ),
  headerRight: () => (
    <View style={styles.rightSideView}>
      <TouchableOpacity style={styles.dropdownContainer} onPress={onDatPress}>
        <Text style={styles.dropdownText}>{selectedDat}</Text>
        <Icon
          name="chevron-down"
          size={hp(2.5)}
          color="#ffffff"
          style={styles.dropdownIcon}
        />
      </TouchableOpacity>
      <NotificationButton onPress={onShowNotify} notificationCount={onCount} />
      <LogoutButton onPress={onLogout} />
    </View>
  ),
  headerStyle: {
    backgroundColor: '#FFA500',
    height: hp(14),
  },
  headerTintColor: '#fff',
  headerTitleAlign: 'center',
});

const styles = StyleSheet.create({
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: wp(2),
  },
  leftSide: {
    width: wp(9),
    alignItems: 'center',
    height: hp(6),
    justifyContent: 'center',
    marginRight: wp(2),
  },
  title: {
    color: '#ffffff',
    fontSize: hp(4),
    fontWeight: 'bold',
  },
  rightSideView: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: wp(3),
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(2.2),
    borderRadius: wp(1.8),
    marginRight: wp(2),
  },
  dropdownText: {
    color: '#ffffff',
    fontSize: hp(3),
    fontWeight: '600',
  },
  dropdownIcon: {
    marginLeft: wp(1),
  },
});

export default MainPageHeader;
