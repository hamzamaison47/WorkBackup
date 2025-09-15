// /* eslint-disable react-native/no-inline-styles */
// import React from 'react';
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
// } from 'react-native';

// import ActionPaneContainer from '../../components/ActionPaneContainer';
// import {screenMapping, iconMapping} from '../../Controller/screenMapping';

// const {width} = Dimensions.get('window');
// const CARD_MARGIN = 12;
// const NUM_COLUMNS = 3;
// const CARD_WIDTH = (width - CARD_MARGIN * (NUM_COLUMNS + 1)) / NUM_COLUMNS;
// const iconSize = Math.max(24, Math.floor(CARD_WIDTH * 0.32 * 1.2));

// const DisplayListPage = () => {
//   const navigation = useNavigation();
//   const userData = useSelector(state => state.user.userData);
//   const {menuItems} = useSelector(state => state.menuItem);

//   // Filter menuItems like drawer (Type === 0 and in screenMapping)
//   const filteredMenuItems = menuItems.filter(item => {
//     return screenMapping[item.MenuId] && [0, 2, 3].includes(Number(item.Type));
//   });

//   const renderItem = ({item}) => (
//     <TouchableOpacity
//       style={[styles.card, {width: CARD_WIDTH}]}
//       activeOpacity={0.85}
//       onPress={() =>
//         navigation.navigate(item.MenuId, {
//           userData,
//           employeeId: userData?.employeeId,
//           employeeName: userData?.employeeName,
//           WorkerRecId: userData?.WorkerRecId,
//           cameFrom: 'DisplayListPage',
//         })
//       }>
//       <View style={[styles.iconWrapper]}>
//         <Image
//           source={
//             iconMapping[item.MenuId] ||
//             require('../../assets/Maindashboard/calendar.png')
//           }
//           style={{width: iconSize, height: iconSize, resizeMode: 'contain'}}
//         />
//       </View>
//       <Text style={styles.title}>{item.Label || item.MenuId}</Text>
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
//         <FlatList
//           data={filteredMenuItems}
//           keyExtractor={item => item.MenuId}
//           renderItem={renderItem}
//           numColumns={NUM_COLUMNS}
//           key={NUM_COLUMNS}
//           contentContainerStyle={styles.listContainer}
//           showsVerticalScrollIndicator={false}
//         />
//       </SafeAreaView>
//     </ActionPaneContainer>
//   );
// };

// export default DisplayListPage;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#FAFAFA',
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

///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

// /* eslint-disable curly */
// /* eslint-disable no-unused-vars */
// /* eslint-disable react-native/no-inline-styles */
// /* eslint-disable react/no-unstable-nested-components */
// import React from 'react';
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
//   useWindowDimensions,
// } from 'react-native';

// import ActionPaneContainer from '../../components/ActionPaneContainer';
// import {screenMapping, iconMapping} from '../../Controller/screenMapping';

// // Get initial screen dimensions
// const {width: initialScreenWidth} = Dimensions.get('window');

// // Responsive utility functions
// const getResponsiveSize = (baseSize, screenWidth) => {
//   const scale = screenWidth / 375; // Base width (iPhone X)
//   const newSize = baseSize * scale;
//   return Math.max(Math.min(newSize, baseSize * 1.5), baseSize * 0.8);
// };

// const getResponsivePadding = (basePadding, screenWidth) => {
//   if (screenWidth < 360) return basePadding * 0.7; // Small phones
//   if (screenWidth > 414) return basePadding * 1.2; // Large phones
//   return basePadding;
// };

// const getResponsiveFontSize = (baseFontSize, screenWidth) => {
//   const scale = screenWidth / 375;
//   const newSize = baseFontSize * scale;
//   return Math.max(Math.min(newSize, baseFontSize * 1.3), baseFontSize * 0.85);
// };

// const getNumColumns = screenWidth => {
//   if (screenWidth < 360) return 2; // Small phones
//   if (screenWidth >= 360 && screenWidth <= 414) return 3; // Standard phones
//   return screenWidth > 500 ? 4 : 3; // Large phones/tablets
// };

// const getCardDimensions = screenWidth => {
//   const numColumns = getNumColumns(screenWidth);
//   const cardMargin = getResponsivePadding(12, screenWidth);
//   const horizontalPadding = getResponsivePadding(12, screenWidth); // 6px * 2 from paddingHorizontal

//   const totalMargins = horizontalPadding + cardMargin * numColumns;
//   const cardWidth = (screenWidth - totalMargins) / numColumns;

//   // Responsive card height
//   const baseHeight = 130;
//   const cardHeight = getResponsiveSize(baseHeight, screenWidth);

//   return {
//     cardWidth: Math.max(cardWidth, 80), // Minimum card width
//     cardHeight: Math.max(cardHeight, 100), // Minimum card height
//     cardMargin,
//     numColumns,
//   };
// };

// const getIconSize = (cardWidth, screenWidth) => {
//   const baseIconSize = Math.floor(cardWidth * 0.4);
//   const responsiveIconSize = getResponsiveSize(32, screenWidth);
//   return Math.max(Math.min(baseIconSize, 60), Math.max(responsiveIconSize, 28));
// };

// const DisplayListPage = () => {
//   const navigation = useNavigation();
//   const userData = useSelector(state => state.user.userData);
//   const {menuItems} = useSelector(state => state.menuItem);
//   const {width: screenWidth} = useWindowDimensions();

//   // Get responsive dimensions
//   const {cardWidth, cardHeight, cardMargin, numColumns} =
//     getCardDimensions(screenWidth);
//   const iconSize = getIconSize(cardWidth, screenWidth);

//   // Screen size detection
//   const isSmallScreen = screenWidth < 360;
//   const isMediumScreen = screenWidth >= 360 && screenWidth <= 414;

//   // Filter menuItems like drawer (Type === 0 and in screenMapping)
//   const filteredMenuItems = menuItems.filter(item => {
//     return screenMapping[item.MenuId] && [0, 2, 3].includes(Number(item.Type));
//   });

//   const getResponsiveStyles = () =>
//     StyleSheet.create({
//       container: {
//         flex: 1,
//         backgroundColor: '#FAFAFA',
//       },
//       listContainer: {
//         paddingHorizontal: getResponsivePadding(1, screenWidth),
//         marginVertical: getResponsivePadding(20, screenWidth),
//         paddingBottom: getResponsivePadding(20, screenWidth),
//       },
//       card: {
//         margin: cardMargin / 2,
//         height: cardHeight,
//         width: cardWidth,
//         backgroundColor: '#fff',
//         borderRadius: getResponsiveSize(16, screenWidth),
//         alignItems: 'center',
//         justifyContent: 'center',
//         shadowColor: '#000',
//         shadowOffset: {width: 0, height: 2},
//         shadowOpacity: 0.08,
//         shadowRadius: getResponsiveSize(6, screenWidth),
//         elevation: 4,
//         paddingHorizontal: getResponsivePadding(8, screenWidth),
//         paddingVertical: getResponsivePadding(12, screenWidth),
//       },
//       iconWrapper: {
//         width: getResponsiveSize(56, screenWidth),
//         height: getResponsiveSize(56, screenWidth),
//         borderRadius: getResponsiveSize(28, screenWidth),
//         alignItems: 'center',
//         justifyContent: 'center',
//         marginBottom: getResponsivePadding(12, screenWidth),
//       },
//       title: {
//         fontSize: getResponsiveFontSize(13, screenWidth),
//         fontWeight: '600',
//         color: '#111827',
//         textAlign: 'center',
//         lineHeight: getResponsiveFontSize(16, screenWidth),
//         numberOfLines: isSmallScreen ? 3 : 2,
//         flexShrink: 1,
//       },
//     });

//   const styles = getResponsiveStyles();

//   const renderItem = ({item}) => (
//     <TouchableOpacity
//       style={styles.card}
//       activeOpacity={0.85}
//       onPress={() =>
//         navigation.navigate(item.MenuId, {
//           userData,
//           employeeId: userData?.employeeId,
//           employeeName: userData?.employeeName,
//           WorkerRecId: userData?.WorkerRecId,
//           cameFrom: 'DisplayListPage',
//         })
//       }>
//       <View style={styles.iconWrapper}>
//         <Image
//           source={
//             iconMapping[item.MenuId] ||
//             require('../../assets/Maindashboard/calendar.png')
//           }
//           style={{
//             width: iconSize,
//             height: iconSize,
//             resizeMode: 'contain',
//           }}
//         />
//       </View>
//       <Text style={styles.title} numberOfLines={isSmallScreen ? 3 : 2}>
//         {item.Label || item.MenuId}
//       </Text>
//     </TouchableOpacity>
//   );

//   // Custom FlatList component with responsive key
//   const ResponsiveFlatList = () => (
//     <FlatList
//       data={filteredMenuItems}
//       keyExtractor={item => item.MenuId}
//       renderItem={renderItem}
//       numColumns={numColumns}
//       key={`${numColumns}-${screenWidth}`} // Force re-render on orientation/size change
//       contentContainerStyle={styles.listContainer}
//       showsVerticalScrollIndicator={false}
//       columnWrapperStyle={
//         numColumns > 1
//           ? {
//               justifyContent: 'flex-start',
//               paddingHorizontal: getResponsivePadding(6, screenWidth),
//             }
//           : null
//       }
//       ItemSeparatorComponent={() => (
//         <View style={{height: getResponsivePadding(8, screenWidth)}} />
//       )}
//     />
//   );

//   return (
//     <ActionPaneContainer
//       pageTitle="Employee History"
//       isBackButton={false}
//       showFooter={false}
//       showFloatingButton={false}
//       isHeaderActive={true}
//       showTabNavigator={false}>
//       <SafeAreaView style={styles.container}>
//         <ResponsiveFlatList />
//       </SafeAreaView>
//     </ActionPaneContainer>
//   );
// };

// export default DisplayListPage;

////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////

/* eslint-disable curly */
/* eslint-disable no-unused-vars */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/no-unstable-nested-components */
import React, {useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import {useSelector, useDispatch} from 'react-redux';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Image,
  useWindowDimensions,
  RefreshControl,
} from 'react-native';

import ActionPaneContainer from '../../components/ActionPaneContainer';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';

import {screenMapping, iconMapping} from '../../Controller/screenMapping';
import {fetchEmployeeMenuItemsByCompany} from '../../Controller/authUtils';
import {setMenuItems} from '../../store/slices/menuItemSlice';

// Get initial screen dimensions
const {width: initialScreenWidth} = Dimensions.get('window');

// Responsive utility functions
const getResponsiveSize = (baseSize, screenWidth) => {
  const scale = screenWidth / 375; // Base width (iPhone X)
  const newSize = baseSize * scale;
  return Math.max(Math.min(newSize, baseSize * 1.5), baseSize * 0.8);
};

const getResponsivePadding = (basePadding, screenWidth) => {
  if (screenWidth < 360) return basePadding * 0.7; // Small phones
  if (screenWidth > 414) return basePadding * 1.2; // Large phones
  return basePadding;
};

const getResponsiveFontSize = (baseFontSize, screenWidth) => {
  const scale = screenWidth / 375;
  const newSize = baseFontSize * scale;
  return Math.max(Math.min(newSize, baseFontSize * 1.3), baseFontSize * 0.85);
};

const getNumColumns = screenWidth => {
  if (screenWidth < 360) return 2; // Small phones
  if (screenWidth >= 360 && screenWidth <= 414) return 3; // Standard phones
  return screenWidth > 500 ? 4 : 3; // Large phones/tablets
};

const getCardDimensions = screenWidth => {
  const numColumns = getNumColumns(screenWidth);
  const cardMargin = getResponsivePadding(12, screenWidth);
  const horizontalPadding = getResponsivePadding(12, screenWidth); // 6px * 2 from paddingHorizontal

  const totalMargins = horizontalPadding + cardMargin * numColumns;
  const cardWidth = (screenWidth - totalMargins) / numColumns;

  // Responsive card height
  const baseHeight = 130;
  const cardHeight = getResponsiveSize(baseHeight, screenWidth);

  return {
    cardWidth: Math.max(cardWidth, 80), // Minimum card width
    cardHeight: Math.max(cardHeight, 100), // Minimum card height
    cardMargin,
    numColumns,
  };
};

const getIconSize = (cardWidth, screenWidth) => {
  const baseIconSize = Math.floor(cardWidth * 0.4);
  const responsiveIconSize = getResponsiveSize(32, screenWidth);
  return Math.max(Math.min(baseIconSize, 60), Math.max(responsiveIconSize, 28));
};

const DisplayListPage = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const userData = useSelector(state => state.user.userData);
  const {menuItems} = useSelector(state => state.menuItem);
  const selectedLegalEntity = useSelector(
    state => state.company.selectedLegalEntity,
  );
  const {width: screenWidth} = useWindowDimensions();

  // Add refresh state
  const [refreshing, setRefreshing] = useState(false);

  // Get responsive dimensions
  const {cardWidth, cardHeight, cardMargin, numColumns} =
    getCardDimensions(screenWidth);
  const iconSize = getIconSize(cardWidth, screenWidth);

  // Screen size detection
  const isSmallScreen = screenWidth < 360;
  const isMediumScreen = screenWidth >= 360 && screenWidth <= 414;

  // Filter menuItems like drawer (Type === 0 and in screenMapping)
  const filteredMenuItems = menuItems.filter(item => {
    return screenMapping[item.MenuId] && [0, 2, 3].includes(Number(item.Type));
  });

  // Add refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Refetch menu items for current company
      const newMenuItems = await fetchEmployeeMenuItemsByCompany(
        userData?.employeeId,
        selectedLegalEntity,
      );
      dispatch(setMenuItems(newMenuItems));
    } catch (error) {
      console.error('Error refreshing menu items:', error);
      // You might want to show an error message to the user
    } finally {
      setRefreshing(false);
    }
  };

  const getResponsiveStyles = () =>
    StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
      },
      listContainer: {
        paddingHorizontal: getResponsivePadding(1, screenWidth),
        marginVertical: getResponsivePadding(20, screenWidth),
        paddingBottom: getResponsivePadding(20, screenWidth),
      },
      card: {
        margin: cardMargin / 2,
        height: cardHeight,
        width: cardWidth,
        backgroundColor: '#fff',
        borderRadius: getResponsiveSize(16, screenWidth),
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.08,
        shadowRadius: getResponsiveSize(6, screenWidth),
        elevation: 4,
        paddingHorizontal: getResponsivePadding(8, screenWidth),
        paddingVertical: getResponsivePadding(12, screenWidth),
      },
      iconWrapper: {
        width: getResponsiveSize(56, screenWidth),
        height: getResponsiveSize(56, screenWidth),
        borderRadius: getResponsiveSize(28, screenWidth),
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: getResponsivePadding(12, screenWidth),
      },
      title: {
        fontSize: getResponsiveFontSize(13, screenWidth),
        fontWeight: '600',
        color: '#111827',
        textAlign: 'center',
        lineHeight: getResponsiveFontSize(16, screenWidth),
        numberOfLines: isSmallScreen ? 3 : 2,
        flexShrink: 1,
      },
    });

  const styles = getResponsiveStyles();

  const renderItem = ({item}) => (
    <TouchableOpacity
      style={styles.card}
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
      <View style={styles.iconWrapper}>
        <Image
          source={
            iconMapping[item.MenuId] ||
            require('../../assets/Maindashboard/calendar.png')
          }
          style={{
            width: iconSize,
            height: iconSize,
            resizeMode: 'contain',
          }}
        />
      </View>
      <Text style={styles.title} numberOfLines={isSmallScreen ? 3 : 2}>
        {item.Label || item.MenuId}
      </Text>
    </TouchableOpacity>
  );

  // Custom FlatList component with responsive key
  const ResponsiveFlatList = () => (
    <FlatList
      data={filteredMenuItems}
      keyExtractor={item => item.MenuId}
      renderItem={renderItem}
      numColumns={numColumns}
      key={`${numColumns}-${screenWidth}`} // Force re-render on orientation/size change
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      columnWrapperStyle={
        numColumns > 1
          ? {
              justifyContent: 'flex-start',
              paddingHorizontal: getResponsivePadding(6, screenWidth),
            }
          : null
      }
      ItemSeparatorComponent={() => (
        <View style={{height: getResponsivePadding(8, screenWidth)}} />
      )}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    />
  );

  return (
    <ActionPaneContainer
      pageTitle="Employee History"
      isBackButton={false}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      showTabNavigator={false}
      onRefresh={handleRefresh}>
      {refreshing ? (
        <CustomIndicator />
      ) : (
        <SafeAreaView style={styles.container}>
          <ResponsiveFlatList />
        </SafeAreaView>
      )}
    </ActionPaneContainer>
  );
};

export default DisplayListPage;
