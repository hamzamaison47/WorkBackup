import React from 'react';
import {TouchableOpacity, View, StyleSheet, Image} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import {hp, wp} from '../../constants/Size';
import NotificationButton from '../NotificationButton';
import logo from '../../assets/cloud.png';
import LogoutButton from '../LogoutButton';

const MainPageHeader = ({onToggleDrawer, onShowNotify, onCount, onLogout}) => ({
  headerTitle: () => {
    '';
  },
  headerLeft: () => (
    <View style={styles.rightSideView}>
      <TouchableOpacity onPress={onToggleDrawer} style={styles.leftSide}>
        <Icon name="bars" size={24} color="white" />
      </TouchableOpacity>
      <Image source={logo} style={styles.headerImage} />
    </View>
  ),
  headerRight: () => (
    <View style={styles.rightSideView}>
      <NotificationButton onPress={onShowNotify} notificationCount={onCount} />
      <LogoutButton onPress={onLogout} />
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
});

const styles = StyleSheet.create({
  rightSideView: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: wp(3), // Adjusted margin
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
    width: 100,
    height: 40,
  },
});

export default MainPageHeader;

// import React, {useEffect} from 'react';
// import {TouchableOpacity, View, StyleSheet, Image} from 'react-native';
// import Icon from 'react-native-vector-icons/FontAwesome';
// import {hp, wp} from '../../constants/Size';
// import NotificationButton from '../NotificationButton';
// import logo from '../../assets/cloud.png';

// const MainPageHeader = ({onToggleDrawer, onShowNotify, onCount}) => {
//   return {
//     headerTitle: () => null, // You can customize the title here if needed
//     headerLeft: () => (
//       <View style={styles.rightSideView}>
//         <TouchableOpacity onPress={onToggleDrawer} style={styles.leftSide}>
//           <Icon name="bars" size={24} color="white" />
//         </TouchableOpacity>
//         <Image source={logo} style={styles.headerImage} />
//       </View>
//     ),
//     headerRight: () => (
//       <View style={styles.rightSideView}>
//         <NotificationButton
//           onPress={onShowNotify}
//           notificationCount={onCount}
//         />
//       </View>
//     ),
//     headerStyle: {
//       backgroundColor: '#FFA500',
//       height: 70,
//     },
//     headerTintColor: '#fff',
//     headerTitleAlign: 'center',
//     headerTitleStyle: {
//       fontSize: hp(2.3),
//       color: 'white',
//     },
//   };
// };

// const styles = StyleSheet.create({
//   rightSideView: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginRight: wp(3),
//   },
//   leftSide: {
//     width: wp(9),
//     alignItems: 'center',
//     height: hp(6),
//     justifyContent: 'center',
//     marginRight: 9,
//     marginLeft: 5,
//   },
//   headerRightContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginHorizontal: 8,
//   },
//   headerImage: {
//     width: 100,
//     height: 40,
//   },
// });

// export default MainPageHeader;
