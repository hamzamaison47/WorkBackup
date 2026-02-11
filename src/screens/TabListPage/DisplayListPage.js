/* eslint-disable react/no-unstable-nested-components */
import React, {useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import {useSelector, useDispatch} from 'react-redux';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Image,
  useWindowDimensions,
  RefreshControl,
} from 'react-native';

import ActionPaneContainer from '../../components/ActionPaneContainer';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';

import {screenMapping, iconMapping} from '../../Controller/screenMapping';
import {fetchEmployeeMenuItemsByCompany} from '../../Controller/authUtils';
import {setMenuItems} from '../../store/slices/menuItemSlice';

import styles from '../../styles/styles';

// // Helper function to calculate grid dimensions - FIXED 3 COLUMNS
// const getGridLayout = screenWidth => {
//   const numColumns = 3; // Fixed 3 columns always

//   const cardMargin = screenWidth < 360 ? 6 : screenWidth > 414 ? 10 : 8;
//   const horizontalPadding = screenWidth < 360 ? 8 : screenWidth > 414 ? 16 : 12;

//   const totalMargins = horizontalPadding * 2 + cardMargin * (numColumns * 2);
//   const cardWidth = (screenWidth - totalMargins) / numColumns;
//   const cardHeight = screenWidth < 360 ? 130 : screenWidth > 414 ? 160 : 145;

//   return {
//     cardWidth: Math.max(cardWidth, 90),
//     cardHeight: Math.max(cardHeight, 120),
//     cardMargin,
//     numColumns,
//   };
// };

// Helper function to calculate grid dimensions - FIXED 3 COLUMNS
const getGridLayout = screenWidth => {
  const numColumns = 3;

  // ↓ REDUCED margins
  const cardMargin = screenWidth < 360 ? 4 : screenWidth > 414 ? 4 : 3;
  const horizontalPadding = screenWidth < 360 ? 6 : screenWidth > 414 ? 10 : 8;

  const totalMargins = horizontalPadding * 2 + cardMargin * (numColumns * 2);

  const cardWidth = (screenWidth - totalMargins) / numColumns;

  // ✅ REDUCED HEIGHT (KEY FIX)
  const cardHeight = screenWidth < 360 ? 110 : screenWidth > 414 ? 130 : 135;

  return {
    cardWidth: Math.max(cardWidth, 88),
    cardHeight,
    cardMargin,
    numColumns,
  };
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

  const [refreshing, setRefreshing] = useState(false);

  // Get grid layout
  const {cardWidth, cardHeight, cardMargin, numColumns} =
    getGridLayout(screenWidth);

  // Filter menuItems
  const filteredMenuItems = menuItems.filter(item => {
    return (
      screenMapping[item.MenuId] &&
      [0, 2, 3].includes(Number(item.Type)) &&
      item.Visible === '1'
    );
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const newMenuItems = await fetchEmployeeMenuItemsByCompany(
        userData?.employeeId,
        selectedLegalEntity,
      );
      dispatch(setMenuItems(newMenuItems));
    } catch (error) {
      console.error('Error refreshing menu items:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const renderItem = ({item}) => (
    <TouchableOpacity
      style={[
        styles.DisplayList_Card,
        {
          margin: cardMargin,
          height: cardHeight,
          width: cardWidth,
        },
      ]}
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
      <View style={styles.DisplayList_IconWrapper}>
        <Image
          source={
            iconMapping[item.MenuId] ||
            require('../../assets/Maindashboard/calendar.png')
          }
          style={styles.DisplayList_Icon}
        />
      </View>
      <Text style={styles.DisplayList_Title} numberOfLines={2}>
        {item.Label || item.MenuId}
      </Text>
    </TouchableOpacity>
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
        <SafeAreaView style={styles.DisplayList_Container}>
          <FlatList
            data={filteredMenuItems}
            keyExtractor={item => item.MenuId}
            renderItem={renderItem}
            numColumns={numColumns}
            key={`${numColumns}-${screenWidth}`}
            contentContainerStyle={styles.DisplayList_ListContainer}
            showsVerticalScrollIndicator={false}
            columnWrapperStyle={
              numColumns > 1 ? styles.DisplayList_ColumnWrapper : null
            }
            ItemSeparatorComponent={() => (
              <View style={styles.DisplayList_ItemSeparator} />
            )}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }
          />
        </SafeAreaView>
      )}
    </ActionPaneContainer>
  );
};

export default DisplayListPage;
