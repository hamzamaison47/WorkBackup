// /* eslint-disable no-unused-vars */
// /* eslint-disable react-native/no-inline-styles */
// import React, {useEffect, useRef, useState} from 'react';
// import {useNavigation} from '@react-navigation/native';
// import {useSelector} from 'react-redux';
// import {
//   View,
//   Text,
//   FlatList,
//   TouchableOpacity,
//   Dimensions,
//   SafeAreaView,
//   StyleSheet,
//   Image,
//   ScrollView,
//   RefreshControl,
// } from 'react-native';

// import ActionPaneContainer from '../../components/ActionPaneContainer';

// const {width} = Dimensions.get('window');
// const CARD_MARGIN = 12;
// const NUM_COLUMNS = 3;
// const CARD_WIDTH = (width - CARD_MARGIN * (NUM_COLUMNS + 1)) / NUM_COLUMNS;
// const iconSize = Math.max(24, Math.floor(CARD_WIDTH * 0.32 * 1.2));

// const DisplayListPage = () => {
//   const navigation = useNavigation();
//   const userData = useSelector(state => state.user.userData);

//   // const [refreshing, setRefreshing] = useState(false);

//   const pages = [
//     {
//       id: '1',
//       title: 'Leave Request',
//       icon: require('../../assets/Maindashboard/calendar.png'),
//       color: '#0A66C2',
//       onPress: () =>
//         navigation.navigate('LeavesListPage', {
//           employeeId: userData.employeeId,
//           employeeName: userData.employeeName,
//           WorkerRecId: userData.WorkerRecId,
//           cameFrom: 'DisplayListPage',
//         }),
//     },
//     {
//       id: '2',
//       title: 'Salary Slip',
//       icon: require('../../assets/Maindashboard/payment.png'),
//       color: '#0A66C2',
//       onPress: () =>
//         navigation.navigate('PRSalarySlip', {
//           employeeId: userData.employeeId,
//         }),
//     },
//     {
//       id: '3',
//       title: 'Tax Certificate',
//       icon: require('../../assets/Maindashboard/certificate.png'),
//       color: '#0A66C2',
//       onPress: () =>
//         navigation.navigate('PRTaxCertificate', {
//           employeeId: userData.employeeId,
//         }),
//     },
//     {
//       id: '4',
//       title: 'Entitlement Balance',
//       icon: require('../../assets/Maindashboard/justice.png'),
//       color: '#0A66C2',
//       onPress: () =>
//         navigation.navigate('EntitlementBalance', {
//           employeeId: userData.employeeId,
//           employeeName: userData.employeeName,
//           WorkerRecId: userData.WorkerRecId,
//           cameFrom: 'DisplayListPage',
//         }),
//     },
//     {
//       id: '5',
//       title: 'Loan & Advance',
//       icon: require('../../assets/Maindashboard/signing.png'),
//       color: '#0A66C2',
//       onPress: () =>
//         navigation.navigate('GenericAdvanceListScreen', {
//           employeeId: userData.employeeId,
//           employeeName: userData.employeeName,
//           WorkerRecId: userData.WorkerRecId,
//           cameFrom: 'DisplayListPage',
//         }),
//     },
//   ];

//   // const handleRefresh = () => {
//   //   renderItem();
//   // };

//   const renderItem = ({item}) => (
//     <TouchableOpacity
//       style={[styles.card, {width: CARD_WIDTH}]}
//       activeOpacity={0.85}
//       onPress={item.onPress}>
//       <View style={[styles.iconWrapper]}>
//         {/* <Ionicons name={item.icon} size={28} color={item.color} /> */}

//         <Image
//           source={typeof item.icon === 'string' ? {uri: item.icon} : item.icon}
//           style={{width: iconSize, height: iconSize, resizeMode: 'contain'}}
//         />
//       </View>
//       <Text style={styles.title}>{item.title}</Text>
//     </TouchableOpacity>
//   );

//   return (
//     <ActionPaneContainer
//       pageTitle="Employee History"
//       isBackButton={false}
//       showFooter={false}
//       showFloatingButton={false}
//       isHeaderActive={true}>
//       <SafeAreaView style={styles.container}>
//         {/* <ScrollView
//           style={styles.scrollView}
//           showsVerticalScrollIndicator={false}
//           refreshControl={
//             <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
//           }> */}
//         <FlatList
//           data={pages}
//           keyExtractor={item => item.id}
//           renderItem={renderItem}
//           numColumns={NUM_COLUMNS}
//           key={NUM_COLUMNS}
//           contentContainerStyle={styles.listContainer}
//           showsVerticalScrollIndicator={false}
//         />
//         {/* </ScrollView> */}
//       </SafeAreaView>
//     </ActionPaneContainer>
//   );
// };

// export default DisplayListPage;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#FAFAFA', // subtle gray
//   },
//   listContainer: {
//     paddingHorizontal: 6,
//     marginVertical: 20,
//   },
//   card: {
//     margin: CARD_MARGIN / 2,
//     height: 130,
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     alignItems: 'center',
//     justifyContent: 'center',
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: 2},
//     shadowOpacity: 0.08,
//     shadowRadius: 6,
//     elevation: 4,
//   },
//   iconWrapper: {
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 12,
//   },
//   title: {
//     fontSize: 13,
//     fontWeight: '600',
//     color: '#111827',
//     textAlign: 'center',
//   },
// });

/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Image,
} from 'react-native';

import ActionPaneContainer from '../../components/ActionPaneContainer';
import {screenMapping, iconMapping} from '../../Controller/screenMapping';

const {width} = Dimensions.get('window');
const CARD_MARGIN = 12;
const NUM_COLUMNS = 3;
const CARD_WIDTH = (width - CARD_MARGIN * (NUM_COLUMNS + 1)) / NUM_COLUMNS;
const iconSize = Math.max(24, Math.floor(CARD_WIDTH * 0.32 * 1.2));

const DisplayListPage = () => {
  const navigation = useNavigation();
  const userData = useSelector(state => state.user.userData);
  const {menuItems} = useSelector(state => state.menuItem);

  // ✅ Filter menuItems like drawer (Type === 0 and in screenMapping)
  const filteredMenuItems = menuItems.filter(item => {
    return screenMapping[item.MenuId] && [0, 2, 3].includes(Number(item.Type));
  });

  const renderItem = ({item}) => (
    <TouchableOpacity
      style={[styles.card, {width: CARD_WIDTH}]}
      activeOpacity={0.85}
      onPress={() =>
        navigation.navigate(item.MenuId, {
          userData,
          employeeId: userData?.employeeId,
          employeeName: userData?.employeeName,
          WorkerRecId: userData?.WorkerRecId,
          cameFrom: 'DisplayListPage',
        })
      }>
      <View style={[styles.iconWrapper]}>
        <Image
          source={
            iconMapping[item.MenuId] ||
            require('../../assets/Maindashboard/calendar.png')
          }
          style={{width: iconSize, height: iconSize, resizeMode: 'contain'}}
        />
      </View>
      <Text style={styles.title}>{item.Label || item.MenuId}</Text>
    </TouchableOpacity>
  );

  return (
    <ActionPaneContainer
      pageTitle="Employee History"
      isBackButton={false}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}>
      <SafeAreaView style={styles.container}>
        <FlatList
          data={filteredMenuItems}
          keyExtractor={item => item.MenuId}
          renderItem={renderItem}
          numColumns={NUM_COLUMNS}
          key={NUM_COLUMNS}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </ActionPaneContainer>
  );
};

export default DisplayListPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  listContainer: {
    paddingHorizontal: 6,
    marginVertical: 20,
  },
  card: {
    margin: CARD_MARGIN / 2,
    height: 130,
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
});
