/* eslint-disable react/react-in-jsx-scope */
import {TouchableOpacity, View, Text} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

import NotificationButton from './NotificationButton';
import styles from '../../styles/styles';
import {
  conditionalFontScale,
  conditionalScale,
  iconSize,
} from '../../store/utils/scaling';

const MainPageHeader = ({
  onToggleDrawer,
  onTitle,
  onShowNotify,
  onCount,
  onHeaderMenuPress,
  isBack = false,
  // onDatPress,
  selectedDat,
  defaultDat,
}) => ({
  headerTitle: () => null,
  headerLeft: () => (
    <View style={styles.MPH_leftContainer}>
      <TouchableOpacity onPress={onToggleDrawer} style={styles.MPH_leftSide}>
        <Icon
          name={isBack ? 'arrow-left' : 'bars'}
          size={iconSize.sm}
          color="white"
        />
      </TouchableOpacity>
      <Text style={styles.MPH_title} numberOfLines={1}>
        Dynaface
      </Text>
    </View>
  ),
  headerRight: () => (
    <View style={styles.MPH_rightSideView}>
      {/* <TouchableOpacity
        style={styles.MPH_dropdownContainer}
        onPress={onDatPress}>
        <Text style={styles.MPH_dropdownText} numberOfLines={1}>
          {selectedDat ? selectedDat.toUpperCase() : ''}
        </Text>
        <Icon
          name="chevron-down"
          size={conditionalFontScale(8, 9, 10, 11)}
          color="#ffffff"
          style={styles.MPH_dropdownIcon}
        />
      </TouchableOpacity> */}
      <NotificationButton onPress={onShowNotify} notificationCount={onCount} />
      <TouchableOpacity
        onPress={onHeaderMenuPress}
        style={[
          styles.MPH_leftSide,
          {width: conditionalScale(30, 34, 38, 42)},
        ]}>
        <Icon
          name="user"
          size={conditionalFontScale(16, 17, 18, 20)}
          color="#fff"
        />
      </TouchableOpacity>
    </View>
  ),
  headerStyle: {
    backgroundColor: '#0A66C2',
    height: conditionalScale(52, 56, 60, 64),
  },
  headerTintColor: '#fff',
  headerTitleAlign: 'center',
});

export default MainPageHeader;
