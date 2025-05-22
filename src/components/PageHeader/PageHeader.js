// import React from 'react';
// import {TouchableOpacity, View, StyleSheet, Image} from 'react-native';
// import Icon from 'react-native-vector-icons/FontAwesome';
// import FilterIcon from 'react-native-vector-icons/Entypo';
// import {hp, wp} from '../../constants/Size';
// import logo from '../../assets/cloud.png';

// const PageHeader = ({onGoBack, onRefresh, OnNewRecord}) => {
//   return {
//     headerTitle: () => {
//       '';
//     },
//     headerLeft: () => (
//       // <TouchableOpacity onPress={onGoBack} style={styles.leftSide}>
//       //   <Icon name="arrow-left" size={20} color="white" />
//       // </TouchableOpacity>
//       <View style={styles.rightSideView}>
//         <TouchableOpacity onPress={onGoBack} style={styles.leftSide}>
//           <Icon name="arrow-left" size={24} color="white" />
//         </TouchableOpacity>
//         <Image source={logo} style={styles.headerImage} />
//       </View>
//     ),
//     headerRight: () => (
//       <View style={styles.rightSideView}>
//         <TouchableOpacity onPress={onRefresh} style={styles.rightSide}>
//           <Icon name="refresh" size={24} color="white" />
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={styles.rightSideViewPlus}
//           onPress={OnNewRecord}>
//           <FilterIcon
//             name="plus"
//             size={30}
//             color="#fff"
//             style={styles.plusIcon}
//           />
//         </TouchableOpacity>
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
//     marginRight: 9 * 0.02,
//   },
//   rightSideViewPlus: {
//     marginLeft: 9 * 0.02,
//     justifyContent: 'center',
//   },
//   rightSide: {
//     width: wp(9),
//     alignItems: 'center',
//     height: hp(6),
//     justifyContent: 'center',
//     marginRight: 9,
//     marginHorizontal: 50,
//   },
//   leftSide: {
//     width: wp(9),
//     alignItems: 'center',
//     height: hp(6),
//     justifyContent: 'center',
//     marginLeft: wp(3),
//   },
//   plusIcon: {
//     marginHorizontal: 10,
//   },
//   headerImage: {
//     width: 100,
//     height: 40,
//   },
// });

// export default PageHeader;

import React from 'react';
import {TouchableOpacity, View, StyleSheet, Image} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import FilterIcon from 'react-native-vector-icons/Entypo';
import {hp, wp} from '../../constants/Size';
import logo from '../../assets/cloud.png';

const PageHeader = ({onGoBack, onRefresh, OnNewRecord}) => {
  return {
    headerTitle: () => '',
    headerLeft: () => (
      <View style={styles.leftContainer}>
        <TouchableOpacity onPress={onGoBack} style={styles.iconContainer}>
          <Icon name="arrow-left" size={hp(6)} color="white" />
        </TouchableOpacity>
        <Image source={logo} style={styles.headerImage} />
      </View>
    ),
    headerRight: () => (
      <View style={styles.rightContainer}>
        <TouchableOpacity onPress={onRefresh} style={styles.iconContainer}>
          <Icon name="refresh" size={hp(6)} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={OnNewRecord} style={styles.iconContainer}>
          <FilterIcon name="plus" size={hp(8)} color="#fff" />
        </TouchableOpacity>
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
  };
};

const styles = StyleSheet.create({
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: wp(1),
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: wp(2),
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: wp(1.5),
  },
  headerImage: {
    width: wp(25),
    height: hp(7),
    marginLeft: wp(3),
  },
});

export default PageHeader;
