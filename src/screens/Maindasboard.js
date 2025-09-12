// /* eslint-disable curly */
// /* eslint-disable react-native/no-inline-styles */
// /* eslint-disable react-hooks/exhaustive-deps */
// import React, {useState, useEffect} from 'react';
// import {
//   ScrollView,
//   Image,
//   Text,
//   TouchableOpacity,
//   View,
//   ActivityIndicator,
//   SafeAreaView,
//   RefreshControl,
//   useWindowDimensions,
//   FlatList,
// } from 'react-native';
// import {useNavigation} from '@react-navigation/native';
// import {useSelector, useDispatch} from 'react-redux';

// import {setSelectedLegalEntity} from '../store/slices/companySlice';
// import {ProfilePicture} from '../API/PersonalInformation/ProfilePicture/ProfilePicture';
// import CustomIndicator from '../components/CustomIndicator/CustomIndicator';
// import ActionPaneContainer from '../components/ActionPaneContainer';
// import {screenMapping, iconMapping} from '../Controller/screenMapping';

// const H_PADDING = 20;
// const GRID_GAP = 12;

// const chunkArray = (arr, size) =>
//   arr.reduce((acc, _, i) => {
//     if (i % size === 0) acc.push(arr.slice(i, i + size));
//     return acc;
//   }, []);

// const MainDashboard = () => {
//   const dispatch = useDispatch();
//   const navigation = useNavigation();
//   const {width: screenWidth} = useWindowDimensions();

//   const numColumns = 3;
//   const totalHorizontalGutters = H_PADDING * 2 + GRID_GAP * (numColumns - 1);
//   const computedCardWidth = Math.floor(
//     (screenWidth - totalHorizontalGutters) / numColumns,
//   );
//   const computedCardHeight = Math.max(120, Math.floor(computedCardWidth * 0.9));
//   const iconSize = Math.max(24, Math.floor(computedCardWidth * 0.32 * 1.2));

//   const userData = useSelector(state => state.user.userData);
//   const selectedLegalEntity = useSelector(
//     state => state.company.selectedLegalEntity,
//   );
//   const {menuItems} = useSelector(state => state.menuItem);

//   const [isLoading, setIsLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [profilePictureUrl, setProfilePictureUrl] = useState('');
//   const [currentPage, setCurrentPage] = useState(0);

//   useEffect(() => {
//     if (userData?.defaultLegalEntity && !selectedLegalEntity) {
//       dispatch(setSelectedLegalEntity(userData.defaultLegalEntity));
//     }
//   }, [userData?.defaultLegalEntity, selectedLegalEntity]);

//   useEffect(() => {
//     const unsubscribe = navigation.addListener('blur', () => {
//       navigation.closeDrawer?.();
//     });
//     return unsubscribe;
//   }, [navigation]);

//   useEffect(() => {
//     fetchProfilePicture();
//   }, []);

//   const calculateYearsSinceHire = hireDateString => {
//     if (!hireDateString) return 0;

//     const hireDate = new Date(hireDateString);
//     const today = new Date();

//     let years = today.getFullYear() - hireDate.getFullYear();
//     let months = today.getMonth() - hireDate.getMonth();
//     let days = today.getDate() - hireDate.getDate();

//     if (months < 0 || (months === 0 && days < 0)) {
//       years--;
//       months += 12;
//     }

//     const decimalYears = years + months / 12;
//     return decimalYears.toFixed(1);
//   };

//   const getInitials = name => {
//     if (!name) return 'UN';
//     return name
//       .split(' ')
//       .map(n => n[0])
//       .join('')
//       .toUpperCase()
//       .substring(0, 2);
//   };

//   const fetchProfilePicture = async () => {
//     setIsLoading(true);
//     setRefreshing(true);
//     try {
//       if (!userData?.employeeId) return;

//       const data = await ProfilePicture({employeeId: userData.employeeId});
//       let imageData = Array.isArray(data) && data.length > 0 ? data[0] : data;

//       if (imageData?.StringImage) {
//         const cleanBase64 = imageData.StringImage.replace(/\s/g, '');
//         setProfilePictureUrl(`data:image/png;base64,${cleanBase64}`);
//       } else {
//         setProfilePictureUrl(null);
//       }
//     } catch (error) {
//       console.error('Failed to fetch profile picture:', error);
//       setProfilePictureUrl(null);
//     } finally {
//       setIsLoading(false);
//       setRefreshing(false);
//     }
//   };

//   const handleRefresh = () => {
//     fetchProfilePicture();
//   };

//   // DYNAMIC MENU CREATION - Build navigation parameters dynamically
//   const getNavigationParams = menuItem => {
//     const baseParams = {
//       employeeId: userData.employeeId,
//       employeeName: userData.employeeName,
//       WorkerRecId: userData.WorkerRecId,
//       userData: userData,
//       cameFrom: 'MainDashboard',
//       selectedLegalEntity,
//     };

//     switch (menuItem.Type) {
//       case '0': // List/View screens
//         return baseParams;

//       case '1': // Create/Save screens
//         if (menuItem.MenuId === 'LeaveSaveRecord') {
//           return {
//             ...baseParams,
//             mode: 'create',
//             leaveData: {
//               employeeId: userData.employeeId,
//               employeeName: userData.employeeName,
//               WorkerRecId: userData.WorkerRecId,
//               recId: '',
//               leaveCode: '',
//               leaveCategory: '',
//               balance: '0.00',
//               leaveStartDate: '',
//               leaveEndDate: '',
//               leaveDays: '',
//               reason: '',
//             },
//           };
//         } else if (menuItem.MenuId === 'GenericAdvanceSaveScreen') {
//           return {
//             ...baseParams,
//             mode: 'create',
//             advanceData: {
//               employeeId: userData.employeeId,
//               employeeName: userData.employeeName,
//               WorkerRecId: userData.WorkerRecId,
//               RecId: '',
//               AdvanceTypeCode: '',
//               AdvanceAmount: '0.00',
//               RequestedPaymentDate: '',
//               RecoveryStartDate: '',
//               RequestedInstallmentAmount: '0.00',
//               RequestedInstallments: '0',
//               AdvanceDescription: '',
//             },
//           };
//         }
//         return {
//           ...baseParams,
//           mode: 'create',
//         };

//       case '2': // Report/View screens
//         return baseParams;

//       default:
//         return baseParams;
//     }
//   };

//   // DYNAMIC MENU FILTERING & MAPPING
//   const getDynamicMenus = () => {
//     const dashboardMenuItems = menuItems.filter(item => {
//       const hasScreen = screenMapping[item.MenuId];
//       const validType = [1, 2, 3].includes(Number(item.Type));
//       return hasScreen && validType;
//     });

//     let cards = dashboardMenuItems.map((menuItem, index) => ({
//       id: menuItem.MenuId || index.toString(),
//       title: menuItem.Label || menuItem.DisplayName || menuItem.MenuId,
//       description: `Access ${menuItem.Label || menuItem.MenuId}`,
//       icon:
//         iconMapping[menuItem.MenuId] ||
//         require('../assets/Maindashboard/calendar.png'),
//       menuItem: menuItem,
//       onPress: () => {
//         const navigationParams = getNavigationParams(menuItem);

//         // Special handling for different menu items
//         if (menuItem.MenuId === 'LeaveSaveRecord') {
//           navigation.navigate('LeaveSaveRecord', {
//             ...navigationParams,
//             cameFrom: 'MainDashboard',
//           });
//         } else if (menuItem.MenuId === 'GenericAdvanceSaveScreen') {
//           // This is the "Advance Salary" from dynamic menu
//           navigation.navigate('GenericAdvanceSaveScreen', {
//             ...navigationParams,
//             cameFrom: 'MainDashboard',
//             requestType: 'Advance',
//             advanceType: 1,
//             screenName: 'Advance Salary',
//           });
//         } else {
//           navigation.navigate(menuItem.MenuId, navigationParams);
//         }
//       },
//     }));

//     // Add Loan Request card manually (separate from Advance Salary)
//     const hasAdvanceSaveScreen = dashboardMenuItems.some(
//       item => item.MenuId === 'GenericAdvanceSaveScreen',
//     );

//     if (hasAdvanceSaveScreen) {
//       const loanCard = {
//         id: 'GenericLoanSaveScreen',
//         title: 'Loan Request',
//         description: 'Access Loan Request',
//         icon: require('../assets/Maindashboard/signing.png'),
//         menuItem: {MenuId: 'GenericAdvanceSaveScreen', requestType: 'Loan'},
//         onPress: () => {
//           const baseNavigationParams = getNavigationParams({
//             MenuId: 'GenericAdvanceSaveScreen',
//             Type: '1',
//           });

//           navigation.navigate('GenericAdvanceSaveScreen', {
//             ...baseNavigationParams,
//             cameFrom: 'MainDashboard',
//             requestType: 'Loan',
//             advanceType: 0,
//             screenName: 'Loan Request',
//           });
//         },
//       };

//       cards.push(loanCard);
//     }

//     return cards;
//   };

//   // GET DYNAMIC MENUS
//   const dynamicMenus = getDynamicMenus();
//   const pages = chunkArray(dynamicMenus, 6);
//   const yearsWorked = calculateYearsSinceHire(userData?.OriginalHireDate);

//   const renderCard = card => (
//     <TouchableOpacity
//       key={card.id}
//       style={[
//         styles.card,
//         {width: computedCardWidth, height: computedCardHeight},
//       ]}
//       onPress={card.onPress}
//       activeOpacity={0.85}>
//       <Image
//         source={typeof card.icon === 'string' ? {uri: card.icon} : card.icon}
//         style={{width: iconSize, height: iconSize, resizeMode: 'contain'}}
//       />
//       <Text style={styles.cardTitle} numberOfLines={2}>
//         {card.title}
//       </Text>
//     </TouchableOpacity>
//   );

//   const renderPage = ({item: pageCards}) => (
//     <View
//       style={{
//         width: screenWidth,
//         paddingHorizontal: 16,
//         flexDirection: 'row',
//         flexWrap: 'wrap',
//         justifyContent: 'flex-start',
//       }}>
//       {pageCards.map(card => (
//         <View
//           key={card.id}
//           style={{
//             width: computedCardWidth,
//             marginHorizontal: screenWidth / 70,
//           }}>
//           {renderCard(card)}
//         </View>
//       ))}
//     </View>
//   );

//   return (
//     <ActionPaneContainer
//       pageTitle="Dynaface"
//       isBackButton={false}
//       showFooter={false}
//       showFloatingButton={false}
//       isHeaderActive={true}
//       onRefresh={handleRefresh}>
//       {isLoading ? (
//         <CustomIndicator />
//       ) : (
//         <SafeAreaView style={styles.container}>
//           <ScrollView
//             style={styles.scrollView}
//             showsVerticalScrollIndicator={false}
//             refreshControl={
//               <RefreshControl
//                 refreshing={refreshing}
//                 onRefresh={handleRefresh}
//               />
//             }>
//             {/* Header */}
//             <View style={styles.headerContainer}>
//               <View style={styles.headerContent}>
//                 {isLoading ? (
//                   <ActivityIndicator size="large" color="#fff" />
//                 ) : (
//                   <TouchableOpacity
//                     onPress={() => navigation.navigate('DisplayPersonalInfo')}
//                     activeOpacity={0.8}
//                     style={styles.avatarContainer}>
//                     {profilePictureUrl ? (
//                       <Image
//                         source={{uri: profilePictureUrl}}
//                         style={styles.profilePicture}
//                         resizeMode="cover"
//                       />
//                     ) : (
//                       <Text style={styles.avatarText}>
//                         {getInitials(userData?.employeeName)}
//                       </Text>
//                     )}
//                   </TouchableOpacity>
//                 )}
//                 <View style={styles.textColumn}>
//                   <Text style={styles.nameText}>{userData.employeeName}</Text>
//                   <Text style={styles.emailText}>
//                     <Text style={styles.boldText}>Department: </Text>
//                     {userData.department || 'N/A'}
//                   </Text>
//                   <Text style={styles.emailText}>
//                     <Text style={styles.boldText}>Position: </Text>
//                     {userData.PositionDescription || 'N/A'}
//                   </Text>
//                   <Text style={styles.emailText}>
//                     <Text style={styles.boldText}>Years of Service: </Text>
//                     {yearsWorked} years
//                   </Text>
//                 </View>
//               </View>
//             </View>

//             {/* Main Section */}
//             <View style={styles.mainContent}>
//               <Text style={styles.sectionTitle}>
//                 What would you like to do?
//               </Text>

//               {dynamicMenus.length === 0 ? (
//                 <View style={styles.noMenuContainer}>
//                   <Text style={styles.noMenuText}>No menu items available</Text>
//                 </View>
//               ) : (
//                 <>
//                   <FlatList
//                     data={pages}
//                     renderItem={renderPage}
//                     keyExtractor={(_, index) => index.toString()}
//                     horizontal
//                     pagingEnabled
//                     showsHorizontalScrollIndicator={false}
//                     onScroll={e => {
//                       const page = Math.round(
//                         e.nativeEvent.contentOffset.x / screenWidth,
//                       );
//                       setCurrentPage(page);
//                     }}
//                     scrollEventThrottle={16}
//                   />

//                   {/* Page Indicator */}
//                   {dynamicMenus.length > 6 && (
//                     <View style={styles.indicatorContainer}>
//                       {pages.map((_, index) => (
//                         <View
//                           key={index}
//                           style={[
//                             styles.indicatorDot,
//                             {opacity: currentPage === index ? 1 : 0.3},
//                           ]}
//                         />
//                       ))}
//                     </View>
//                   )}
//                 </>
//               )}
//             </View>
//           </ScrollView>
//         </SafeAreaView>
//       )}
//     </ActionPaneContainer>
//   );
// };

// const styles = {
//   container: {flex: 1, backgroundColor: '#FAFAFA'},
//   scrollView: {flex: 1},
//   headerContainer: {
//     paddingHorizontal: 24,
//     paddingTop: 10,
//     paddingBottom: 20,
//     borderBottomLeftRadius: 32,
//     borderBottomRightRadius: 32,
//     backgroundColor: '#0A66C2',
//     shadowColor: '#000',
//     shadowOpacity: 0.1,
//     shadowOffset: {width: 0, height: 3},
//     shadowRadius: 6,
//     elevation: 4,
//     // marginTop: 1,
//   },
//   headerContent: {flexDirection: 'row', alignItems: 'center'},
//   profilePicture: {
//     width: 90,
//     height: 90,
//     borderRadius: 45,
//     borderWidth: 3,
//     borderColor: '#fff',
//     backgroundColor: '#EAF2FB',
//   },
//   avatarContainer: {
//     width: 90,
//     height: 90,
//     borderRadius: 45,
//     borderWidth: 3,
//     borderColor: '#fff',
//     backgroundColor: '#bed8f6ff',
//     marginRight: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   avatarText: {fontSize: 28, fontWeight: '700', color: '#0A66C2'},
//   textColumn: {flex: 1},
//   nameText: {fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 2},
//   emailText: {fontSize: 13, color: '#DCE6F5'},
//   boldText: {fontSize: 13, color: '#DCE6F5', fontWeight: 'bold'},
//   mainContent: {flex: 1, paddingTop: 22},
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#2C3E50',
//     marginBottom: 18,
//     paddingHorizontal: 20,
//   },
//   card: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 16,
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 10,
//     shadowColor: '#000',
//     shadowOpacity: 0.06,
//     shadowOffset: {width: 0, height: 3},
//     shadowRadius: 6,
//     elevation: 2,
//     marginBottom: GRID_GAP,
//   },
//   cardTitle: {
//     fontSize: 12,
//     fontWeight: '700',
//     color: '#2C3E50',
//     textAlign: 'center',
//     lineHeight: 14,
//     marginTop: 10,
//   },
//   indicatorContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     marginTop: 12,
//   },
//   indicatorDot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: '#0A66C2',
//     marginHorizontal: 4,
//   },
//   noMenuContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 40,
//   },
//   noMenuText: {
//     fontSize: 16,
//     color: '#6B7280',
//     fontWeight: '500',
//   },
// };

// export default MainDashboard;

/* eslint-disable curly */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect} from 'react';
import {
  ScrollView,
  Image,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  useWindowDimensions,
  FlatList,
  Dimensions,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useSelector, useDispatch} from 'react-redux';

import {setSelectedLegalEntity} from '../store/slices/companySlice';
import {ProfilePicture} from '../API/PersonalInformation/ProfilePicture/ProfilePicture';
import CustomIndicator from '../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../components/ActionPaneContainer';
import {screenMapping, iconMapping} from '../Controller/screenMapping';

// Get initial screen dimensions
const {width: initialScreenWidth, height: initialScreenHeight} =
  Dimensions.get('window');

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

const chunkArray = (arr, size) =>
  arr.reduce((acc, _, i) => {
    if (i % size === 0) acc.push(arr.slice(i, i + size));
    return acc;
  }, []);

const MainDashboard = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const {width: screenWidth, height: screenHeight} = useWindowDimensions();

  // Responsive calculations
  const isSmallScreen = screenWidth < 360;
  const isMediumScreen = screenWidth >= 360 && screenWidth <= 414;
  const isLargeScreen = screenWidth > 414;

  // Dynamic grid configuration based on screen size
  const getNumColumns = () => {
    if (isSmallScreen) return 2;
    if (isMediumScreen) return 3;
    return screenWidth > 500 ? 4 : 3; // For tablets or very wide screens
  };

  const numColumns = getNumColumns();
  const cardsPerPage = numColumns * 2; // 2 rows per page

  // Responsive padding and gaps
  const H_PADDING = getResponsivePadding(20, screenWidth);
  const GRID_GAP = getResponsivePadding(12, screenWidth);

  // Calculate card dimensions
  const totalHorizontalGutters = H_PADDING * 2 + GRID_GAP * (numColumns - 1);
  const computedCardWidth = Math.floor(
    (screenWidth - totalHorizontalGutters) / numColumns,
  );

  // Responsive card height based on screen size and orientation
  const getCardHeight = () => {
    const baseRatio = isSmallScreen ? 1.1 : 0.9;
    const calculatedHeight = Math.floor(computedCardWidth * baseRatio);
    const minHeight = isSmallScreen ? 100 : 120;
    const maxHeight = isSmallScreen ? 140 : 160;
    return Math.max(minHeight, Math.min(calculatedHeight, maxHeight));
  };

  const computedCardHeight = getCardHeight();

  // Responsive icon size
  const getIconSize = () => {
    const baseSize = computedCardWidth * 0.4;
    const minSize = isSmallScreen ? 28 : 32;
    const maxSize = isSmallScreen ? 48 : 60;
    return Math.max(minSize, Math.min(baseSize, maxSize));
  };

  const iconSize = getIconSize();

  const userData = useSelector(state => state.user.userData);
  const selectedLegalEntity = useSelector(
    state => state.company.selectedLegalEntity,
  );
  const {menuItems} = useSelector(state => state.menuItem);

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    if (userData?.defaultLegalEntity && !selectedLegalEntity) {
      dispatch(setSelectedLegalEntity(userData.defaultLegalEntity));
    }
  }, [userData?.defaultLegalEntity, selectedLegalEntity]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      navigation.closeDrawer?.();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    fetchProfilePicture();
  }, []);

  const calculateYearsSinceHire = hireDateString => {
    if (!hireDateString) return 0;

    const hireDate = new Date(hireDateString);
    const today = new Date();

    let years = today.getFullYear() - hireDate.getFullYear();
    let months = today.getMonth() - hireDate.getMonth();
    let days = today.getDate() - hireDate.getDate();

    if (months < 0 || (months === 0 && days < 0)) {
      years--;
      months += 12;
    }

    const decimalYears = years + months / 12;
    return decimalYears.toFixed(1);
  };

  const getInitials = name => {
    if (!name) return 'UN';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const fetchProfilePicture = async () => {
    setIsLoading(true);
    setRefreshing(true);
    try {
      if (!userData?.employeeId) return;

      const data = await ProfilePicture({employeeId: userData.employeeId});
      let imageData = Array.isArray(data) && data.length > 0 ? data[0] : data;

      if (imageData?.StringImage) {
        const cleanBase64 = imageData.StringImage.replace(/\s/g, '');
        setProfilePictureUrl(`data:image/png;base64,${cleanBase64}`);
      } else {
        setProfilePictureUrl(null);
      }
    } catch (error) {
      console.error('Failed to fetch profile picture:', error);
      setProfilePictureUrl(null);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchProfilePicture();
  };

  // DYNAMIC MENU CREATION - Build navigation parameters dynamically
  const getNavigationParams = menuItem => {
    const baseParams = {
      employeeId: userData.employeeId,
      employeeName: userData.employeeName,
      WorkerRecId: userData.WorkerRecId,
      userData: userData,
      cameFrom: 'MainDashboard',
      selectedLegalEntity,
    };

    switch (menuItem.Type) {
      case '0': // List/View screens
        return baseParams;

      case '1': // Create/Save screens
        if (menuItem.MenuId === 'LeaveSaveRecord') {
          return {
            ...baseParams,
            mode: 'create',
            leaveData: {
              employeeId: userData.employeeId,
              employeeName: userData.employeeName,
              WorkerRecId: userData.WorkerRecId,
              recId: '',
              leaveCode: '',
              leaveCategory: '',
              balance: '0.00',
              leaveStartDate: '',
              leaveEndDate: '',
              leaveDays: '',
              reason: '',
            },
          };
        } else if (menuItem.MenuId === 'GenericAdvanceSaveScreen') {
          return {
            ...baseParams,
            mode: 'create',
            advanceData: {
              employeeId: userData.employeeId,
              employeeName: userData.employeeName,
              WorkerRecId: userData.WorkerRecId,
              RecId: '',
              AdvanceTypeCode: '',
              AdvanceAmount: '0.00',
              RequestedPaymentDate: '',
              RecoveryStartDate: '',
              RequestedInstallmentAmount: '0.00',
              RequestedInstallments: '0',
              AdvanceDescription: '',
            },
          };
        }
        return {
          ...baseParams,
          mode: 'create',
        };

      case '2': // Report/View screens
        return baseParams;

      default:
        return baseParams;
    }
  };

  // DYNAMIC MENU FILTERING & MAPPING
  const getDynamicMenus = () => {
    // Filter only valid menu items
    const dashboardMenuItems = menuItems.filter(item => {
      const hasScreen = screenMapping[item.MenuId];
      const validType = [1, 2, 3].includes(Number(item.Type));
      return hasScreen && validType;
    });

    // Map to card objects (excluding Advance Salary)
    let cards = dashboardMenuItems
      .filter(item => item.MenuId !== 'GenericAdvanceSaveScreen')
      .map((menuItem, index) => ({
        id: menuItem.MenuId || index.toString(),
        title: menuItem.Label || menuItem.DisplayName || menuItem.MenuId,
        description: `Access ${menuItem.Label || menuItem.MenuId}`,
        icon:
          iconMapping[menuItem.MenuId] ||
          require('../assets/Maindashboard/calendar.png'),
        menuItem: menuItem,
        onPress: () => {
          const navigationParams = getNavigationParams(menuItem);
          navigation.navigate(menuItem.MenuId, navigationParams);
        },
      }));

    // ✅ Add Loan Request card manually
    const loanCard = {
      id: 'GenericLoanSaveScreen',
      title: 'Loan Request',
      description: 'Access Loan Request',
      icon: require('../assets/Maindashboard/signing.png'),
      menuItem: {MenuId: 'GenericAdvanceSaveScreen', requestType: 'Loan'},
      onPress: () => {
        const baseNavigationParams = getNavigationParams({
          MenuId: 'GenericAdvanceSaveScreen',
          Type: '1',
        });

        navigation.navigate('GenericAdvanceSaveScreen', {
          ...baseNavigationParams,
          cameFrom: 'MainDashboard',
          requestType: 'Loan',
          advanceType: 0,
          screenName: 'Loan Request',
        });
      },
    };

    cards.push(loanCard);

    return cards;
  };

  // const getDynamicMenus = () => {
  //   const dashboardMenuItems = menuItems.filter(item => {
  //     const hasScreen = screenMapping[item.MenuId];
  //     const validType = [1, 2, 3].includes(Number(item.Type));
  //     return hasScreen && validType;
  //   });

  //   let cards = dashboardMenuItems.map((menuItem, index) => ({
  //     id: menuItem.MenuId || index.toString(),
  //     title: menuItem.Label || menuItem.DisplayName || menuItem.MenuId,
  //     description: `Access ${menuItem.Label || menuItem.MenuId}`,
  //     icon:
  //       iconMapping[menuItem.MenuId] ||
  //       require('../assets/Maindashboard/calendar.png'),
  //     menuItem: menuItem,
  //     onPress: () => {
  //       const navigationParams = getNavigationParams(menuItem);

  //       // Special handling for different menu items
  //       if (menuItem.MenuId === 'LeaveSaveRecord') {
  //         navigation.navigate('LeaveSaveRecord', {
  //           ...navigationParams,
  //           cameFrom: 'MainDashboard',
  //         });
  //       } else if (menuItem.MenuId === 'GenericAdvanceSaveScreen') {
  //         // This is the "Advance Salary" from dynamic menu
  //         navigation.navigate('GenericAdvanceSaveScreen', {
  //           ...navigationParams,
  //           cameFrom: 'MainDashboard',
  //           requestType: 'Advance',
  //           advanceType: 1,
  //           screenName: 'Advance Salary',
  //         });
  //       } else {
  //         navigation.navigate(menuItem.MenuId, navigationParams);
  //       }
  //     },
  //   }));

  //   // Add Loan Request card manually (separate from Advance Salary)
  //   const hasAdvanceSaveScreen = dashboardMenuItems.some(
  //     item => item.MenuId === 'GenericAdvanceSaveScreen',
  //   );

  //   if (hasAdvanceSaveScreen) {
  //     const loanCard = {
  //       id: 'GenericLoanSaveScreen',
  //       title: 'Loan Request',
  //       description: 'Access Loan Request',
  //       icon: require('../assets/Maindashboard/signing.png'),
  //       menuItem: {MenuId: 'GenericAdvanceSaveScreen', requestType: 'Loan'},
  //       onPress: () => {
  //         const baseNavigationParams = getNavigationParams({
  //           MenuId: 'GenericAdvanceSaveScreen',
  //           Type: '1',
  //         });

  //         navigation.navigate('GenericAdvanceSaveScreen', {
  //           ...baseNavigationParams,
  //           cameFrom: 'MainDashboard',
  //           requestType: 'Loan',
  //           advanceType: 0,
  //           screenName: 'Loan Request',
  //         });
  //       },
  //     };

  //     cards.push(loanCard);
  //   }

  //   return cards;
  // };

  // GET DYNAMIC MENUS
  const dynamicMenus = getDynamicMenus();
  const pages = chunkArray(dynamicMenus, cardsPerPage);
  const yearsWorked = calculateYearsSinceHire(userData?.OriginalHireDate);

  // Get responsive styles
  const getResponsiveStyles = () => ({
    container: {flex: 1, backgroundColor: '#FAFAFA'},
    scrollView: {flex: 1},
    headerContainer: {
      paddingHorizontal: H_PADDING,
      paddingTop: getResponsivePadding(10, screenWidth),
      paddingBottom: getResponsivePadding(20, screenWidth),
      borderBottomLeftRadius: getResponsiveSize(32, screenWidth),
      borderBottomRightRadius: getResponsiveSize(32, screenWidth),
      backgroundColor: '#0A66C2',
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowOffset: {width: 0, height: 3},
      shadowRadius: 6,
      elevation: 4,
    },
    headerContent: {
      flexDirection: isSmallScreen ? 'column' : 'row',
      alignItems: 'center',
      justifyContent: isSmallScreen ? 'center' : 'flex-start',
    },
    profilePicture: {
      width: getResponsiveSize(90, screenWidth),
      height: getResponsiveSize(90, screenWidth),
      borderRadius: getResponsiveSize(45, screenWidth),
      borderWidth: getResponsiveSize(3, screenWidth),
      borderColor: '#fff',
      backgroundColor: '#EAF2FB',
    },
    avatarContainer: {
      width: getResponsiveSize(90, screenWidth),
      height: getResponsiveSize(90, screenWidth),
      borderRadius: getResponsiveSize(45, screenWidth),
      borderWidth: getResponsiveSize(3, screenWidth),
      borderColor: '#fff',
      backgroundColor: '#bed8f6ff',
      marginRight: isSmallScreen ? 0 : getResponsivePadding(12, screenWidth),
      marginBottom: isSmallScreen ? getResponsivePadding(12, screenWidth) : 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      fontSize: getResponsiveFontSize(28, screenWidth),
      fontWeight: '700',
      color: '#0A66C2',
    },
    textColumn: {
      flex: 1,
      alignItems: isSmallScreen ? 'center' : 'flex-start',
    },
    nameText: {
      fontSize: getResponsiveFontSize(20, screenWidth),
      fontWeight: '700',
      color: '#fff',
      marginBottom: 2,
      textAlign: isSmallScreen ? 'center' : 'left',
    },
    emailText: {
      fontSize: getResponsiveFontSize(13, screenWidth),
      color: '#DCE6F5',
      textAlign: isSmallScreen ? 'center' : 'left',
      lineHeight: getResponsiveFontSize(16, screenWidth),
    },
    boldText: {
      fontSize: getResponsiveFontSize(13, screenWidth),
      color: '#DCE6F5',
      fontWeight: 'bold',
    },
    mainContent: {
      flex: 1,
      paddingTop: getResponsivePadding(22, screenWidth),
    },
    sectionTitle: {
      fontSize: getResponsiveFontSize(18, screenWidth),
      fontWeight: '700',
      color: '#2C3E50',
      marginBottom: getResponsivePadding(18, screenWidth),
      paddingHorizontal: H_PADDING,
    },
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: getResponsiveSize(16, screenWidth),
      alignItems: 'center',
      justifyContent: 'center',
      padding: getResponsivePadding(10, screenWidth),
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowOffset: {width: 0, height: 3},
      shadowRadius: 6,
      elevation: 2,
      marginBottom: GRID_GAP,
      width: computedCardWidth,
      height: computedCardHeight,
    },
    cardTitle: {
      fontSize: getResponsiveFontSize(12, screenWidth),
      fontWeight: '700',
      color: '#2C3E50',
      textAlign: 'center',
      lineHeight: getResponsiveFontSize(14, screenWidth),
      marginTop: getResponsivePadding(8, screenWidth),
    },
    indicatorContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: getResponsivePadding(12, screenWidth),
      paddingHorizontal: H_PADDING,
    },
    indicatorDot: {
      width: getResponsiveSize(8, screenWidth),
      height: getResponsiveSize(8, screenWidth),
      borderRadius: getResponsiveSize(4, screenWidth),
      backgroundColor: '#0A66C2',
      marginHorizontal: getResponsiveSize(4, screenWidth),
    },
    noMenuContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: getResponsivePadding(40, screenWidth),
      paddingHorizontal: H_PADDING,
    },
    noMenuText: {
      fontSize: getResponsiveFontSize(16, screenWidth),
      color: '#6B7280',
      fontWeight: '500',
      textAlign: 'center',
    },
  });

  const styles = getResponsiveStyles();

  const renderCard = card => (
    <TouchableOpacity
      key={card.id}
      style={styles.card}
      onPress={card.onPress}
      activeOpacity={0.85}>
      <Image
        source={typeof card.icon === 'string' ? {uri: card.icon} : card.icon}
        style={{
          width: iconSize,
          height: iconSize,
          resizeMode: 'contain',
        }}
      />
      <Text style={styles.cardTitle} numberOfLines={2}>
        {card.title}
      </Text>
    </TouchableOpacity>
  );

  const renderPage = ({item: pageCards}) => (
    <View
      style={{
        width: screenWidth,
        paddingHorizontal: H_PADDING,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
      }}>
      {pageCards.map((card, index) => (
        <View
          key={card.id}
          style={{
            width: computedCardWidth,
            marginRight: (index + 1) % numColumns === 0 ? 0 : GRID_GAP,
          }}>
          {renderCard(card)}
        </View>
      ))}
    </View>
  );

  return (
    <ActionPaneContainer
      pageTitle="Dynaface"
      isBackButton={false}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      showTabNavigator={false}
      onRefresh={handleRefresh}>
      {isLoading ? (
        <CustomIndicator />
      ) : (
        <SafeAreaView style={styles.container}>
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }>
            {/* Header */}
            <View style={styles.headerContainer}>
              <View style={styles.headerContent}>
                {isLoading ? (
                  <ActivityIndicator size="large" color="#fff" />
                ) : (
                  <TouchableOpacity
                    onPress={() => navigation.navigate('DisplayPersonalInfo')}
                    activeOpacity={0.8}
                    style={styles.avatarContainer}>
                    {profilePictureUrl ? (
                      <Image
                        source={{uri: profilePictureUrl}}
                        style={styles.profilePicture}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.avatarText}>
                        {getInitials(userData?.employeeName)}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
                <View style={styles.textColumn}>
                  <Text style={styles.nameText}>{userData.employeeName}</Text>
                  <Text style={styles.emailText}>
                    <Text style={styles.boldText}>Department: </Text>
                    {userData.department || 'N/A'}
                  </Text>
                  <Text style={styles.emailText}>
                    <Text style={styles.boldText}>Position: </Text>
                    {userData.PositionDescription || 'N/A'}
                  </Text>
                  <Text style={styles.emailText}>
                    <Text style={styles.boldText}>Years of Service: </Text>
                    {yearsWorked} years
                  </Text>
                </View>
              </View>
            </View>

            {/* Main Section */}
            <View style={styles.mainContent}>
              <Text style={styles.sectionTitle}>
                What would you like to do?
              </Text>

              {dynamicMenus.length === 0 ? (
                <View style={styles.noMenuContainer}>
                  <Text style={styles.noMenuText}>No menu items available</Text>
                </View>
              ) : (
                <>
                  <FlatList
                    data={pages}
                    renderItem={renderPage}
                    keyExtractor={(_, index) => index.toString()}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={e => {
                      const page = Math.round(
                        e.nativeEvent.contentOffset.x / screenWidth,
                      );
                      setCurrentPage(page);
                    }}
                    scrollEventThrottle={16}
                  />

                  {/* Page Indicator */}
                  {dynamicMenus.length > cardsPerPage && (
                    <View style={styles.indicatorContainer}>
                      {pages.map((_, index) => (
                        <View
                          key={index}
                          style={[
                            styles.indicatorDot,
                            {opacity: currentPage === index ? 1 : 0.3},
                          ]}
                        />
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      )}
    </ActionPaneContainer>
  );
};

export default MainDashboard;
