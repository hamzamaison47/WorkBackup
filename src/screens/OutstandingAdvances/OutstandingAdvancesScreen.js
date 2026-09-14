// // export default OutstandingAdvancesScreen;
// import React, {useState, useCallback} from 'react';
// import {View, Text, ScrollView, RefreshControl} from 'react-native';
// import {useSelector} from 'react-redux';
// import {useNavigation, useFocusEffect} from '@react-navigation/native';
// import Ionicons from 'react-native-vector-icons/Ionicons';

// import {GetOutstandingAdvances} from '../../API/OutstandingAdvances/GetOutstandingAdvances';
// import ActionPaneContainer from '../../components/ActionPaneContainer';
// import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
// import AlertModal from '../../components/Alert/AlertModal';

// // Design System Components
// import {
//   PageBackground,
//   AnimatedCard,
//   IconBadge,
//   EmptyState,
//   FooterNote,
// } from '../../components/AppComponentsDesign/Appcomponents';
// import useAppTokens from '../../components/AppComponentsDesign/useAppTokens';
// import {
//   conditionalScale,
//   conditionalVerticalScale,
// } from '../../store/utils/scaling';

// // ─── Helpers ──────────────────────────────────────────────────────────────────
// const formatAmount = value => {
//   if (value === null || value === undefined || value === '') {
//     return '0.00';
//   }
//   const num = parseFloat(String(value).replace(/,/g, ''));
//   if (isNaN(num)) {
//     return '0.00';
//   }
//   return num.toLocaleString('en-US', {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   });
// };

// const safeNum = value => {
//   if (!value) {
//     return 0;
//   }
//   const n = parseFloat(String(value).replace(/,/g, ''));
//   return isNaN(n) ? 0 : n;
// };

// const hasBlankPostingStatus = item =>
//   !item.PostingStatus || String(item.PostingStatus).trim() === '';

// // ─── Outstanding Row Component ───────────────────────────────────────────────────
// const OutstandingRow = ({item, index}) => {
//   const T = useAppTokens();

//   const getAdvanceType = item =>
//     item.AdvanceType ||
//     item.AdvanceTypeCode ||
//     item.AdvanceTypeName ||
//     item.TypeName ||
//     '—';

//   const getAmount = item =>
//     item.OutstandingAmount ??
//     item.AdvanceAmount ??
//     item.Amount ??
//     item.RemainingAmount ??
//     '0.00';

//   return (
//     <View
//       // eslint-disable-next-line react-native/no-inline-styles
//       style={{
//         flexDirection: 'row',
//         alignItems: 'center',
//         paddingVertical: conditionalVerticalScale(14, 15, 16, 16),
//         paddingHorizontal: conditionalScale(16, 18, 20, 20),
//         backgroundColor: '#FFFFFF',
//         borderBottomWidth: 1,
//         borderBottomColor: T.rowDivider,
//       }}>
//       {/* Advance Type Column */}
//       <View style={{flex: 1}}>
//         <View
//           // eslint-disable-next-line react-native/no-inline-styles
//           style={{
//             backgroundColor: '#FFFFFF',
//             paddingHorizontal: conditionalScale(8, 9, 10, 10),
//             paddingVertical: conditionalVerticalScale(4, 4, 5, 5),
//             borderRadius: conditionalScale(6, 7, 8, 8),
//             alignSelf: 'flex-start',
//           }}>
//           <Text
//             // eslint-disable-next-line react-native/no-inline-styles
//             style={{
//               fontSize: conditionalScale(11, 12, 12, 12),
//               fontWeight: '600',
//               color: '#000000',
//             }}>
//             {getAdvanceType(item)}
//           </Text>
//         </View>
//       </View>

//       {/* Amount Column */}
//       <View
//         // eslint-disable-next-line react-native/no-inline-styles
//         style={{
//           width: conditionalScale(110, 115, 120, 120),
//           alignItems: 'flex-end',
//         }}>
//         <Text
//           // eslint-disable-next-line react-native/no-inline-styles
//           style={{
//             fontSize: conditionalScale(15, 16, 16, 16),
//             fontWeight: '700',
//             color: T.blue,
//           }}>
//           {formatAmount(getAmount(item))}
//         </Text>
//       </View>
//     </View>
//   );
// };

// // ─── Main Component ───────────────────────────────────────────────────────────
// const OutstandingAdvancesScreen = () => {
//   const T = useAppTokens();
//   const [isLoading, setIsLoading] = useState(false);
//   const [data, setData] = useState([]);
//   const [alertModal, setAlertModal] = useState(false);
//   const [alertMessage, setAlertMessage] = useState('');
//   const [activeFilter, setActiveFilter] = useState('All');

//   const navigation = useNavigation();
//   const {userData} = useSelector(state => state.user);

//   // ── Fetch Data ──────────────────────────────────────────────────────────────
//   const fetchData = useCallback(async () => {
//     if (!userData?.employeeId) {
//       return;
//     }
//     setIsLoading(true);
//     try {
//       const result = await GetOutstandingAdvances({
//         employeeId: userData.employeeId,
//       });
//       console.log('here is the data', result);
//       setData(Array.isArray(result) ? result : []);
//       setActiveFilter('All');
//     } catch (err) {
//       console.error('Outstanding Advances fetch error:', err);
//       setAlertMessage(
//         'Unable to load data. Please check your connection and try again.',
//       );
//       setAlertModal(true);
//     } finally {
//       setIsLoading(false);
//     }
//   }, [userData?.employeeId]);

//   useFocusEffect(
//     useCallback(() => {
//       fetchData();
//     }, [fetchData]),
//   );

//   // ── Navigation & Refresh ────────────────────────────────────────────────────
//   const handleGoBack = () => navigation.goBack();
//   const handleRefresh = () => fetchData();

//   // ── Filter Logic ────────────────────────────────────────────────────────────
//   const getAdvanceType = item =>
//     item.AdvanceType ||
//     item.AdvanceTypeCode ||
//     item.AdvanceTypeName ||
//     item.TypeName ||
//     '—';

//   const blankStatusData = data.filter(hasBlankPostingStatus);

//   const uniqueAdvanceTypes = [
//     ...new Set(
//       blankStatusData
//         .map(item => getAdvanceType(item))
//         .filter(type => type && type !== '—'),
//     ),
//   ];

//   const filterPills = ['All', ...uniqueAdvanceTypes];

//   const getFilterCounts = () => {
//     const blankOnly = data.filter(hasBlankPostingStatus);
//     const counts = {All: blankOnly.length};
//     uniqueAdvanceTypes.forEach(type => {
//       counts[type] = blankOnly.filter(
//         item => getAdvanceType(item) === type,
//       ).length;
//     });
//     return counts;
//   };

//   const getFilteredData = () => {
//     const blankOnly = data.filter(hasBlankPostingStatus); // ← filter blank posting status
//     // eslint-disable-next-line curly
//     if (activeFilter === 'All') return blankOnly;
//     return blankOnly.filter(item => getAdvanceType(item) === activeFilter);
//   };

//   const filteredData = getFilteredData();

//   // ── Calculations ────────────────────────────────────────────────────────────
//   const total = filteredData.reduce((sum, item) => {
//     const val =
//       safeNum(item.OutstandingAmount) ||
//       safeNum(item.AdvanceAmount) ||
//       safeNum(item.Amount) ||
//       0;
//     return sum + val;
//   }, 0);

//   // ─── Render ──────────────────────────────────────────────────────────────────
//   return (
//     <ActionPaneContainer
//       pageTitle="Outstanding Advances"
//       showFooter={false}
//       showFloatingButton={false}
//       isHeaderActive
//       onBackPress={handleGoBack}
//       onRefresh={handleRefresh}
//       showFilterPills={filterPills.length > 1}
//       filterPills={filterPills}
//       activeFilter={activeFilter}
//       onFilterChange={setActiveFilter}
//       filterCounts={getFilterCounts()}
//       showPageTitleRow={true}>
//       <PageBackground>
//         <ScrollView
//           showsVerticalScrollIndicator={false}
//           refreshControl={
//             <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
//           }>
//           {isLoading ? (
//             <CustomIndicator />
//           ) : (
//             <>
//               {/* Header Summary Card - Blue Background */}
//               <View
//                 // eslint-disable-next-line react-native/no-inline-styles
//                 style={{
//                   backgroundColor: T.blue,
//                   borderRadius: conditionalScale(16, 18, 20, 20),
//                   marginHorizontal: conditionalScale(16, 18, 20, 20),
//                   marginBottom: conditionalVerticalScale(16, 18, 20, 20),
//                   marginTop: conditionalVerticalScale(4, 4, 6, 6),
//                   shadowColor: T.blue,
//                   shadowOffset: {width: 0, height: 4},
//                   shadowOpacity: 0.2,
//                   shadowRadius: 12,
//                   elevation: 6,
//                 }}>
//                 <View
//                   // eslint-disable-next-line react-native/no-inline-styles
//                   style={{
//                     alignItems: 'center',
//                     paddingVertical: conditionalVerticalScale(16, 18, 20, 20),
//                     paddingHorizontal: conditionalScale(20, 22, 24, 24),
//                   }}>
//                   <Text
//                     // eslint-disable-next-line react-native/no-inline-styles
//                     style={{
//                       fontSize: conditionalScale(13, 14, 14, 14),
//                       fontWeight: '500',
//                       color: 'rgba(255,255,255,0.8)',
//                       marginBottom: conditionalVerticalScale(4, 4, 5, 5),
//                     }}>
//                     Total Outstanding Amount
//                   </Text>
//                   <Text
//                     // eslint-disable-next-line react-native/no-inline-styles
//                     style={{
//                       fontSize: conditionalScale(28, 30, 32, 32),
//                       fontWeight: '700',
//                       color: '#FFFFFF',
//                     }}>
//                     {formatAmount(total)}
//                   </Text>
//                 </View>
//               </View>

//               {/* Outstanding Advances Table */}
//               <AnimatedCard delay={0}>
//                 {/* Table Header */}
//                 <View
//                   // eslint-disable-next-line react-native/no-inline-styles
//                   style={{
//                     flexDirection: 'row',
//                     alignItems: 'center',
//                     paddingVertical: conditionalVerticalScale(12, 13, 14, 14),
//                     paddingHorizontal: conditionalScale(16, 18, 20, 20),
//                     backgroundColor: T.blue,
//                     borderTopLeftRadius: conditionalScale(12, 13, 14, 14),
//                     borderTopRightRadius: conditionalScale(12, 13, 14, 14),
//                   }}>
//                   <Text
//                     // eslint-disable-next-line react-native/no-inline-styles
//                     style={{
//                       flex: 1,
//                       fontSize: conditionalScale(12, 13, 13, 13),
//                       fontWeight: '600',
//                       color: '#FFFFFF',
//                       letterSpacing: 0.5,
//                     }}>
//                     Advance Type
//                   </Text>
//                   <Text
//                     // eslint-disable-next-line react-native/no-inline-styles
//                     style={{
//                       width: conditionalScale(110, 115, 120, 120),
//                       fontSize: conditionalScale(12, 13, 13, 13),
//                       fontWeight: '600',
//                       color: '#FFFFFF',
//                       letterSpacing: 0.5,
//                       textAlign: 'right',
//                     }}>
//                     Amount
//                   </Text>
//                 </View>

//                 {/* Table Body */}
//                 {filteredData.length === 0 ? (
//                   <EmptyState
//                     icon="document-text-outline"
//                     title="No Outstanding Advances"
//                     message={
//                       activeFilter !== 'All'
//                         ? `No records found for "${activeFilter}"`
//                         : 'Pull down to refresh'
//                     }
//                   />
//                 ) : (
//                   filteredData.map((item, index) => (
//                     <OutstandingRow key={index} item={item} index={index} />
//                   ))
//                 )}
//               </AnimatedCard>

//               {/* Footer Note */}
//               {filteredData.length > 0 && (
//                 <FooterNote
//                   text={`Showing ${filteredData.length} advance type${
//                     filteredData.length !== 1 ? 's' : ''
//                   }${activeFilter !== 'All' ? ` for ${activeFilter}` : ''}`}
//                   style={{
//                     marginTop: conditionalVerticalScale(16, 18, 20, 20),
//                   }}
//                 />
//               )}
//             </>
//           )}
//         </ScrollView>
//       </PageBackground>

//       <AlertModal
//         visible={alertModal}
//         heading="Error"
//         text={alertMessage}
//         onPress={() => setAlertModal(false)}
//       />
//     </ActionPaneContainer>
//   );
// };

// export default OutstandingAdvancesScreen;

// export default OutstandingAdvancesScreen;
import React, {useState, useCallback} from 'react';
import {View, Text, ScrollView, RefreshControl} from 'react-native';
import {useSelector} from 'react-redux';
import {useNavigation, useFocusEffect} from '@react-navigation/native';

import {GetOutstandingAdvances} from '../../API/OutstandingAdvances/GetOutstandingAdvances';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import AlertModal from '../../components/Alert/AlertModal';

// Design System Components
import {
  PageBackground,
  AnimatedCard,
  EmptyState,
  FooterNote,
} from '../../components/AppComponentsDesign/Appcomponents';
import useAppTokens from '../../components/AppComponentsDesign/useAppTokens';
import {
  conditionalScale,
  conditionalVerticalScale,
} from '../../store/utils/scaling';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatAmount = value => {
  if (value === null || value === undefined || value === '') {
    return '0.00';
  }
  const num = parseFloat(String(value).replace(/,/g, ''));
  if (isNaN(num)) {
    return '0.00';
  }
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const safeNum = value => {
  if (!value) {
    return 0;
  }
  const n = parseFloat(String(value).replace(/,/g, ''));
  return isNaN(n) ? 0 : n;
};

const hasBlankPostingStatus = item =>
  !item.PostingStatus || String(item.PostingStatus).trim() === '';

// ─── Outstanding Row Component ────────────────────────────────────────────────
const OutstandingRow = ({item}) => {
  const T = useAppTokens();

  const getAdvanceType = i =>
    i.AdvanceType ||
    i.AdvanceTypeCode ||
    i.AdvanceTypeName ||
    i.TypeName ||
    '—';

  const advanceAmount = safeNum(item.AdvanceAmount);
  const recoveredAmount = safeNum(item.TotalRecoveryAmount);
  const remainingAmount = safeNum(
    item.RemainingAmount ?? advanceAmount - recoveredAmount,
  );
  const hasRecovery = recoveredAmount > 0;

  return (
    <View
      // eslint-disable-next-line react-native/no-inline-styles
      style={{
        paddingVertical: conditionalVerticalScale(12, 13, 14, 14),
        paddingHorizontal: conditionalScale(16, 18, 20, 20),
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: T.rowDivider,
      }}>
      {/* Top Row: Type + Remaining Amount */}
      <View
        // eslint-disable-next-line react-native/no-inline-styles
        style={{flexDirection: 'row', alignItems: 'center'}}>
        <View style={{flex: 1}}>
          <Text
            // eslint-disable-next-line react-native/no-inline-styles
            style={{
              fontSize: conditionalScale(13, 14, 14, 14),
              fontWeight: '600',
              color: '#000000',
            }}>
            {getAdvanceType(item)}
          </Text>
          <Text
            // eslint-disable-next-line react-native/no-inline-styles
            style={{
              fontSize: conditionalScale(11, 11, 12, 12),
              color: '#888888',
              marginTop: conditionalVerticalScale(2, 2, 3, 3),
            }}>
            Original: {formatAmount(advanceAmount)}
          </Text>
        </View>

        {/* Remaining (outstanding) amount */}
        <View
          // eslint-disable-next-line react-native/no-inline-styles
          style={{alignItems: 'flex-end'}}>
          <Text
            // eslint-disable-next-line react-native/no-inline-styles
            style={{
              fontSize: conditionalScale(15, 16, 16, 16),
              fontWeight: '700',
              color: T.blueStrong,
            }}>
            {formatAmount(remainingAmount)}
          </Text>
          <Text
            // eslint-disable-next-line react-native/no-inline-styles
            style={{
              fontSize: conditionalScale(10, 10, 11, 11),
              color: '#888888',
              marginTop: conditionalVerticalScale(1, 1, 2, 2),
            }}>
            Outstanding
          </Text>
        </View>
      </View>

      {/* Recovery Badge (only shown if recovery > 0) */}
      {hasRecovery && (
        <View
          // eslint-disable-next-line react-native/no-inline-styles
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
            marginTop: conditionalVerticalScale(6, 7, 8, 8),
          }}>
          <View
            // eslint-disable-next-line react-native/no-inline-styles
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#E8F5E9',
              borderRadius: conditionalScale(6, 7, 8, 8),
              paddingHorizontal: conditionalScale(8, 9, 10, 10),
              paddingVertical: conditionalVerticalScale(3, 3, 4, 4),
            }}>
            <Text
              // eslint-disable-next-line react-native/no-inline-styles
              style={{
                fontSize: conditionalScale(11, 11, 12, 12),
                fontWeight: '600',
                color: '#2E7D32',
              }}>
              ✓ Recovered: {formatAmount(recoveredAmount)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

// ─── Summary Card ─────────────────────────────────────────────────────────────
const SummaryCard = ({totalAdvanced, totalRecovered, totalOutstanding, T}) => (
  <View
    // eslint-disable-next-line react-native/no-inline-styles
    style={{
      backgroundColor: T.blue,
      borderRadius: conditionalScale(16, 18, 20, 20),
      marginHorizontal: conditionalScale(16, 18, 20, 20),
      marginBottom: conditionalVerticalScale(16, 18, 20, 20),
      marginTop: conditionalVerticalScale(4, 4, 6, 6),
      shadowColor: T.blue,
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 6,
      paddingVertical: conditionalVerticalScale(16, 18, 20, 20),
      paddingHorizontal: conditionalScale(20, 22, 24, 24),
    }}>
    {/* Primary: Total Outstanding */}
    <View
      // eslint-disable-next-line react-native/no-inline-styles
      style={{
        alignItems: 'center',
        marginBottom: conditionalVerticalScale(14, 16, 18, 18),
      }}>
      <Text
        // eslint-disable-next-line react-native/no-inline-styles
        style={{
          fontSize: conditionalScale(13, 14, 14, 14),
          fontWeight: '500',
          color: 'rgba(255,255,255,0.8)',
          marginBottom: conditionalVerticalScale(4, 4, 5, 5),
        }}>
        Total Outstanding Amount
      </Text>
      <Text
        // eslint-disable-next-line react-native/no-inline-styles
        style={{
          fontSize: conditionalScale(28, 30, 32, 32),
          fontWeight: '700',
          color: T.onPrimary,
        }}>
        {formatAmount(totalOutstanding)}
      </Text>
    </View>

    {/* Divider */}
    <View
      // eslint-disable-next-line react-native/no-inline-styles
      style={{
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginBottom: conditionalVerticalScale(14, 16, 18, 18),
      }}
    />

    {/* Secondary: Advanced vs Recovered */}
    <View
      // eslint-disable-next-line react-native/no-inline-styles
      style={{flexDirection: 'row', justifyContent: 'space-between'}}>
      {/* Total Advanced */}
      <View
        // eslint-disable-next-line react-native/no-inline-styles
        style={{alignItems: 'center', flex: 1}}>
        <Text
          // eslint-disable-next-line react-native/no-inline-styles
          style={{
            fontSize: conditionalScale(11, 12, 12, 12),
            fontWeight: '500',
            color: 'rgba(255,255,255,0.7)',
            marginBottom: conditionalVerticalScale(4, 4, 5, 5),
          }}>
          Total Advance Amount
        </Text>
        <Text
          // eslint-disable-next-line react-native/no-inline-styles
          style={{
            fontSize: conditionalScale(16, 17, 18, 18),
            fontWeight: '700',
            color: T.onPrimary,
          }}>
          {formatAmount(totalAdvanced)}
        </Text>
      </View>

      {/* Vertical separator */}
      <View
        // eslint-disable-next-line react-native/no-inline-styles
        style={{
          width: 1,
          backgroundColor: 'rgba(255,255,255,0.2)',
          marginHorizontal: conditionalScale(8, 10, 12, 12),
        }}
      />

      {/* Total Recovered */}
      <View
        // eslint-disable-next-line react-native/no-inline-styles
        style={{alignItems: 'center', flex: 1}}>
        <Text
          // eslint-disable-next-line react-native/no-inline-styles
          style={{
            fontSize: conditionalScale(11, 12, 12, 12),
            fontWeight: '500',
            color: 'rgba(255,255,255,0.7)',
            marginBottom: conditionalVerticalScale(4, 4, 5, 5),
          }}>
          Total Recovered
        </Text>
        <Text
          // eslint-disable-next-line react-native/no-inline-styles
          style={{
            fontSize: conditionalScale(16, 17, 18, 18),
            fontWeight: '700',
            color: '#A5D6A7', // light green to signal positive recovery
          }}>
          {formatAmount(totalRecovered)}
        </Text>
      </View>
    </View>
  </View>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const OutstandingAdvancesScreen = () => {
  const T = useAppTokens();
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState([]);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const navigation = useNavigation();
  const {userData} = useSelector(state => state.user);
  const [refreshing, setRefreshing] = useState(false);

  // ── Pull-to-Refresh Handler ────────────────────────────────────────────────────
  const onRefresh = useCallback(async () => {
    if (!userData?.employeeId) return;
    setRefreshing(true);
    try {
      const result = await GetOutstandingAdvances({
        employeeId: userData.employeeId,
      });
      setData(Array.isArray(result) ? result : []);
      setActiveFilter('All');
    } catch (err) {
      console.error('Refresh error:', err);
      setAlertMessage('Unable to refresh. Please check your connection.');
      setAlertModal(true);
    } finally {
      setRefreshing(false);
    }
  }, [userData?.employeeId]);

  // ── Fetch Data ──────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!userData?.employeeId) {
      return;
    }
    setIsLoading(true);
    try {
      const result = await GetOutstandingAdvances({
        employeeId: userData.employeeId,
      });
      console.log('here is the data', result);
      setData(Array.isArray(result) ? result : []);
      setActiveFilter('All');
    } catch (err) {
      console.error('Outstanding Advances fetch error:', err);
      setAlertMessage(
        'Unable to load data. Please check your connection and try again.',
      );
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  }, [userData?.employeeId]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  // ── Navigation & Refresh ────────────────────────────────────────────────────
  const handleGoBack = () => navigation.goBack();
  const handleRefresh = () => fetchData();

  // ── Filter Logic ────────────────────────────────────────────────────────────
  const getAdvanceType = item =>
    item.AdvanceType ||
    item.AdvanceTypeCode ||
    item.AdvanceTypeName ||
    item.TypeName ||
    '—';

  const blankStatusData = data.filter(hasBlankPostingStatus);

  const uniqueAdvanceTypes = [
    ...new Set(
      blankStatusData
        .map(item => getAdvanceType(item))
        .filter(type => type && type !== '—'),
    ),
  ];

  const filterPills = ['All', ...uniqueAdvanceTypes];

  const getFilterCounts = () => {
    const blankOnly = data.filter(hasBlankPostingStatus);
    const counts = {All: blankOnly.length};
    uniqueAdvanceTypes.forEach(type => {
      counts[type] = blankOnly.filter(
        item => getAdvanceType(item) === type,
      ).length;
    });
    return counts;
  };

  const getFilteredData = () => {
    const blankOnly = data.filter(hasBlankPostingStatus);
    // eslint-disable-next-line curly
    if (activeFilter === 'All') return blankOnly;
    return blankOnly.filter(item => getAdvanceType(item) === activeFilter);
  };

  const filteredData = getFilteredData();

  // ── Calculations ────────────────────────────────────────────────────────────
  const totalAdvanced = filteredData.reduce(
    (sum, item) => sum + safeNum(item.AdvanceAmount),
    0,
  );

  const totalRecovered = filteredData.reduce(
    (sum, item) => sum + safeNum(item.TotalRecoveryAmount),
    0,
  );

  // Outstanding = RemainingAmount if available, else AdvanceAmount - TotalRecoveryAmount
  const totalOutstanding = filteredData.reduce((sum, item) => {
    if (item.RemainingAmount !== undefined && item.RemainingAmount !== null) {
      return sum + safeNum(item.RemainingAmount);
    }
    return (
      sum + (safeNum(item.AdvanceAmount) - safeNum(item.TotalRecoveryAmount))
    );
  }, 0);

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <ActionPaneContainer
      pageTitle="Outstanding Advances"
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive
      onBackPress={handleGoBack}
      onRefresh={handleRefresh}
      showFilterPills={filterPills.length > 1}
      filterPills={filterPills}
      activeFilter={activeFilter}
      onFilterChange={setActiveFilter}
      filterCounts={getFilterCounts()}
      showPageTitleRow={true}>
      <PageBackground>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing} // ← separate from isLoading
              onRefresh={onRefresh} // ← dedicated refresh handler
              colors={[T.blue]} // Android spinner color
              tintColor={T.blueStrong} // iOS spinner color
            />
          }>
          {isLoading ? (
            <CustomIndicator />
          ) : (
            <>
              {/* Summary Card */}
              <SummaryCard
                totalAdvanced={totalAdvanced}
                totalRecovered={totalRecovered}
                totalOutstanding={totalOutstanding}
                T={T}
              />

              {/* Outstanding Advances Table */}
              <AnimatedCard delay={0}>
                {/* Table Header */}
                <View
                  // eslint-disable-next-line react-native/no-inline-styles
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: conditionalVerticalScale(12, 13, 14, 14),
                    paddingHorizontal: conditionalScale(16, 18, 20, 20),
                    backgroundColor: T.blue,
                    borderTopLeftRadius: conditionalScale(12, 13, 14, 14),
                    borderTopRightRadius: conditionalScale(12, 13, 14, 14),
                  }}>
                  <Text
                    // eslint-disable-next-line react-native/no-inline-styles
                    style={{
                      flex: 1,
                      fontSize: conditionalScale(12, 13, 13, 13),
                      fontWeight: '600',
                      color: T.onPrimary,
                      letterSpacing: 0.5,
                    }}>
                    Advance Type
                  </Text>
                  <Text
                    // eslint-disable-next-line react-native/no-inline-styles
                    style={{
                      fontSize: conditionalScale(12, 13, 13, 13),
                      fontWeight: '600',
                      color: T.onPrimary,
                      letterSpacing: 0.5,
                      textAlign: 'right',
                    }}>
                    Outstanding
                  </Text>
                </View>

                {/* Table Body */}
                {filteredData.length === 0 ? (
                  <EmptyState
                    icon="document-text-outline"
                    title="No Outstanding Advances"
                    message={
                      activeFilter !== 'All'
                        ? `No records found for "${activeFilter}"`
                        : 'Pull down to refresh'
                    }
                  />
                ) : (
                  filteredData.map((item, index) => (
                    <OutstandingRow key={index} item={item} index={index} />
                  ))
                )}
              </AnimatedCard>

              {/* Footer Note */}
              {filteredData.length > 0 && (
                <FooterNote
                  text={`Showing ${filteredData.length} advance type${
                    filteredData.length !== 1 ? 's' : ''
                  }${activeFilter !== 'All' ? ` for ${activeFilter}` : ''}`}
                  style={{
                    marginTop: conditionalVerticalScale(16, 18, 20, 20),
                  }}
                />
              )}
            </>
          )}
        </ScrollView>
      </PageBackground>

      <AlertModal
        visible={alertModal}
        heading="Error"
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />
    </ActionPaneContainer>
  );
};

export default OutstandingAdvancesScreen;
