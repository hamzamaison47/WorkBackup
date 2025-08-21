/* eslint-disable react/react-in-jsx-scope */
import {TouchableOpacity, View, Text, Dimensions} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

import NotificationButton from './NotificationButton';
import LogoutButton from './LogoutButton';
import styles from '../../styles/styles';

const {height} = Dimensions.get('window');

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
    <View style={styles.MPH_leftContainer}>
      <TouchableOpacity onPress={onToggleDrawer} style={styles.MPH_leftSide}>
        <Icon
          name={isBack ? 'arrow-left' : 'bars'}
          size={height * 0.025} // was hp(6)
          color="white"
        />
      </TouchableOpacity>
      <Text style={styles.MPH_title}>{onTitle}</Text>
    </View>
  ),
  headerRight: () => (
    <View style={styles.MPH_rightSideView}>
      <TouchableOpacity
        style={styles.MPH_dropdownContainer}
        onPress={onDatPress}>
        <Text style={styles.MPH_dropdownText}>{selectedDat.toUpperCase()}</Text>
        <Icon
          name="chevron-down"
          size={12}
          color="#ffffff"
          style={styles.MPH_dropdownIcon}
        />
      </TouchableOpacity>
      <NotificationButton onPress={onShowNotify} notificationCount={onCount} />
      <LogoutButton onPress={onLogout} />
    </View>
  ),
  headerStyle: {
    backgroundColor: '#0A66C2',
    height: height * 0.08, // was hp(14)
  },
  headerTintColor: '#fff',
  headerTitleAlign: 'center',
});

export default MainPageHeader;
