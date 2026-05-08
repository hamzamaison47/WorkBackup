// import React, {useState, useCallback} from 'react';
// import {
//   View,
//   Text,
//   ScrollView,
//   RefreshControl,
//   StyleSheet,
//   I18nManager,
// } from 'react-native';
// import {useSelector} from 'react-redux';
// import {useNavigation, useFocusEffect} from '@react-navigation/native';
// import LinearGradient from 'react-native-linear-gradient';
// import Icon from 'react-native-vector-icons/FontAwesome5';

// import {GetOutstandingAdvances} from '../../API/OutstandingAdvances/GetOutstandingAdvances';
// import ActionPaneContainer from '../../components/ActionPaneContainer';
// import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
// import AlertModal from '../../components/Alert/AlertModal';

// // ─── Theme ────────────────────────────────────────────────────────────────────
// const BLUE = '#0A66C2';
// const BLUE_LIGHT = '#EBF4FF';
// const DIVIDER = '#E8EEF6';
// const TEXT_PRIMARY = '#1A2B45';
// const TEXT_SECONDARY = '#5A7296';
// const WHITE = '#FFFFFF';
// const TOTAL_BG = '#F0F7FF';

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

// // ─── Component ────────────────────────────────────────────────────────────────
// const OutstandingAdvancesScreen = () => {
//   const [isLoading, setIsLoading] = useState(false);
//   const [data, setData] = useState([]);
//   const [alertModal, setAlertModal] = useState(false);
//   const [alertMessage, setAlertMessage] = useState('');

//   const navigation = useNavigation();
//   const isRTL = I18nManager.isRTL;
//   const {userData} = useSelector(state => state.user);

//   // ── Fetch ────────────────────────────────────────────────────────────────
//   const fetchData = useCallback(async () => {
//     if (!userData?.employeeId) {
//       return;
//     }
//     setIsLoading(true);
//     try {
//       const result = await GetOutstandingAdvances({
//         employeeId: userData.employeeId,
//       });
//       setData(Array.isArray(result) ? result : []);
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

//   // ── Total ─────────────────────────────────────────────────────────────────
//   const total = data.reduce((sum, item) => {
//     // Try common field names for the outstanding amount
//     const val =
//       safeNum(item.OutstandingAmount) ||
//       safeNum(item.AdvanceAmount) ||
//       safeNum(item.Amount) ||
//       0;
//     return sum + val;
//   }, 0);

//   // Try to pick the best key for Advance Type & Amount from actual data
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

//   // ── Navigation ───────────────────────────────────────────────────────────
//   const handleGoBack = () => navigation.goBack();
//   const handleRefresh = () => fetchData();

//   // ── Render ────────────────────────────────────────────────────────────────
//   return (
//     <ActionPaneContainer
//       pageTitle="Outstanding Advances"
//       showFooter
//       showFloatingButton={false}
//       isHeaderActive
//       onBackPress={handleGoBack}
//       onRefresh={handleRefresh}>
//       {isLoading ? (
//         <CustomIndicator />
//       ) : (
//         <ScrollView
//           style={s.scrollView}
//           contentContainerStyle={s.scrollContent}
//           showsVerticalScrollIndicator={false}
//           refreshControl={
//             <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
//           }>
//           {/* ─── Header Card ─────────────────────────────────────────────── */}
//           <LinearGradient
//             colors={['#0A66C2', '#1E88E5', '#42A5F5']}
//             start={{x: 0, y: 0}}
//             end={{x: 1, y: 1}}
//             style={s.headerCard}>
//             <View style={s.headerIconWrap}>
//               <Icon name="hand-holding-usd" size={26} color={WHITE} />
//             </View>
//             <Text style={s.headerTitle}>Outstanding Advances</Text>
//             <Text style={s.headerSubtitle}>
//               Summary of all outstanding loan &amp; advance amounts
//             </Text>

//             {/* Quick total badge */}
//             <View style={s.totalBadge}>
//               <Text style={s.totalBadgeLabel}>Total Outstanding</Text>
//               <Text style={s.totalBadgeAmount}>{formatAmount(total)}</Text>
//             </View>
//           </LinearGradient>

//           {/* ─── Table Card ──────────────────────────────────────────────── */}
//           <View style={s.tableCard}>
//             {/* Table Header */}
//             <LinearGradient
//               colors={[BLUE, '#1976D2']}
//               start={{x: 0, y: 0}}
//               end={{x: 1, y: 0}}
//               style={[s.tableRow, s.tableHeaderRow]}>
//               <Text
//                 style={[
//                   s.colAdvanceType,
//                   s.headerCellText,
//                   isRTL && s.textRight,
//                 ]}>
//                 Advance Type
//               </Text>
//               <Text style={[s.colAmount, s.headerCellText, s.textRight]}>
//                 Outstanding Amount
//               </Text>
//             </LinearGradient>

//             {/* Data Rows */}
//             {data.length === 0 ? (
//               <View style={s.emptyWrap}>
//                 <Icon name="inbox" size={40} color="#C5D4E8" />
//                 <Text style={s.emptyText}>No outstanding advances found</Text>
//                 <Text style={s.emptySubText}>Pull down to refresh</Text>
//               </View>
//             ) : (
//               data.map((item, index) => {
//                 const isEven = index % 2 === 0;
//                 return (
//                   <View
//                     key={index}
//                     style={[
//                       s.tableRow,
//                       s.dataRow,
//                       {backgroundColor: isEven ? WHITE : BLUE_LIGHT},
//                     ]}>
//                     {/* Accent bar */}
//                     <View style={s.rowAccent} />

//                     <Text
//                       style={[
//                         s.colAdvanceType,
//                         s.cellText,
//                         isRTL && s.textRight,
//                       ]}
//                       numberOfLines={2}>
//                       {getAdvanceType(item)}
//                     </Text>
//                     <Text style={[s.colAmount, s.cellText, s.amountText]}>
//                       {formatAmount(getAmount(item))}
//                     </Text>
//                   </View>
//                 );
//               })
//             )}

//             {/* ─── Total Row ──────────────────────────────────────────────── */}
//             {data.length > 0 && (
//               <>
//                 <View style={s.totalDivider} />
//                 <View style={[s.tableRow, s.totalRow]}>
//                   <Icon
//                     name="calculator"
//                     size={14}
//                     color={BLUE}
//                     style={s.totalIcon}
//                   />
//                   <Text style={[s.colAdvanceType, s.totalLabelText]}>
//                     Total
//                   </Text>
//                   <Text style={[s.colAmount, s.totalAmountText]}>
//                     {formatAmount(total)}
//                   </Text>
//                 </View>
//               </>
//             )}
//           </View>

//           {/* ─── Footer Note ─────────────────────────────────────────────── */}
//           {data.length > 0 && (
//             <View style={s.footerNote}>
//               <Icon name="info-circle" size={12} color={TEXT_SECONDARY} />
//               <Text style={s.footerNoteText}>
//                 {data.length} advance type{data.length !== 1 ? 's' : ''} shown
//               </Text>
//             </View>
//           )}
//         </ScrollView>
//       )}

//       <AlertModal
//         visible={alertModal}
//         heading="Error"
//         text={alertMessage}
//         onPress={() => setAlertModal(false)}
//       />
//     </ActionPaneContainer>
//   );
// };

// // ─── Styles ──────────────────────────────────────────────────────────────────
// const s = StyleSheet.create({
//   scrollView: {
//     flex: 1,
//     backgroundColor: '#F4F7FB',
//   },
//   scrollContent: {
//     padding: 16,
//     paddingBottom: 40,
//   },

//   // Header Card
//   headerCard: {
//     borderRadius: 20,
//     padding: 24,
//     marginBottom: 20,
//     alignItems: 'center',
//     shadowColor: BLUE,
//     shadowOffset: {width: 0, height: 8},
//     shadowOpacity: 0.3,
//     shadowRadius: 16,
//     elevation: 8,
//   },
//   headerIconWrap: {
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     backgroundColor: 'rgba(255,255,255,0.2)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   headerTitle: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: WHITE,
//     marginBottom: 4,
//     letterSpacing: 0.3,
//   },
//   headerSubtitle: {
//     fontSize: 12,
//     color: 'rgba(255,255,255,0.80)',
//     textAlign: 'center',
//     marginBottom: 20,
//   },
//   totalBadge: {
//     backgroundColor: 'rgba(255,255,255,0.18)',
//     borderRadius: 14,
//     paddingVertical: 10,
//     paddingHorizontal: 28,
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: 'rgba(255,255,255,0.3)',
//   },
//   totalBadgeLabel: {
//     fontSize: 10,
//     color: 'rgba(255,255,255,0.85)',
//     fontWeight: '600',
//     letterSpacing: 1,
//     textTransform: 'uppercase',
//     marginBottom: 2,
//   },
//   totalBadgeAmount: {
//     fontSize: 22,
//     fontWeight: '800',
//     color: WHITE,
//     letterSpacing: 0.5,
//   },

//   // Table
//   tableCard: {
//     backgroundColor: WHITE,
//     borderRadius: 16,
//     overflow: 'hidden',
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: 4},
//     shadowOpacity: 0.08,
//     shadowRadius: 12,
//     elevation: 4,
//     marginBottom: 12,
//   },
//   tableRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 14,
//   },
//   tableHeaderRow: {
//     paddingVertical: 14,
//   },
//   dataRow: {
//     borderBottomWidth: 1,
//     borderBottomColor: DIVIDER,
//     minHeight: 52,
//   },
//   rowAccent: {
//     width: 3,
//     height: '70%',
//     backgroundColor: BLUE,
//     borderRadius: 2,
//     marginRight: 10,
//     opacity: 0.25,
//   },

//   // Columns
//   colAdvanceType: {
//     flex: 1,
//     paddingRight: 8,
//   },
//   colAmount: {
//     width: 130,
//     textAlign: 'right',
//   },

//   // Cell text
//   headerCellText: {
//     color: WHITE,
//     fontWeight: '700',
//     fontSize: 13,
//     letterSpacing: 0.3,
//   },
//   cellText: {
//     color: TEXT_PRIMARY,
//     fontSize: 14,
//     fontWeight: '500',
//   },
//   amountText: {
//     fontWeight: '700',
//     color: BLUE,
//     fontVariant: ['tabular-nums'],
//   },
//   textRight: {
//     textAlign: 'right',
//   },

//   // Total Row
//   totalDivider: {
//     height: 2,
//     backgroundColor: BLUE,
//     opacity: 0.12,
//   },
//   totalRow: {
//     backgroundColor: TOTAL_BG,
//     paddingVertical: 16,
//   },
//   totalIcon: {
//     marginRight: 6,
//   },
//   totalLabelText: {
//     color: BLUE,
//     fontWeight: '800',
//     fontSize: 14,
//     letterSpacing: 0.4,
//     flex: 1,
//   },
//   totalAmountText: {
//     width: 130,
//     textAlign: 'right',
//     color: BLUE,
//     fontWeight: '800',
//     fontSize: 15,
//     letterSpacing: 0.3,
//     fontVariant: ['tabular-nums'],
//   },

//   // Empty
//   emptyWrap: {
//     alignItems: 'center',
//     paddingVertical: 48,
//     paddingHorizontal: 24,
//   },
//   emptyText: {
//     marginTop: 16,
//     fontSize: 16,
//     color: TEXT_PRIMARY,
//     fontWeight: '600',
//   },
//   emptySubText: {
//     marginTop: 6,
//     fontSize: 13,
//     color: TEXT_SECONDARY,
//   },

//   // Footer note
//   footerNote: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: 5,
//     marginTop: 4,
//   },
//   footerNoteText: {
//     fontSize: 11,
//     color: TEXT_SECONDARY,
//     marginLeft: 4,
//   },
// });

// export default OutstandingAdvancesScreen;
import React, {useState, useCallback} from 'react';
import {View, Text, ScrollView, RefreshControl} from 'react-native';
import {useSelector} from 'react-redux';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import {GetOutstandingAdvances} from '../../API/OutstandingAdvances/GetOutstandingAdvances';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import AlertModal from '../../components/Alert/AlertModal';

// Design System Components
import {
  PageBackground,
  AnimatedCard,
  IconBadge,
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

// ─── Outstanding Row Component ───────────────────────────────────────────────────
const OutstandingRow = ({item, index}) => {
  const T = useAppTokens();

  const getAdvanceType = item =>
    item.AdvanceType ||
    item.AdvanceTypeCode ||
    item.AdvanceTypeName ||
    item.TypeName ||
    '—';

  const getAmount = item =>
    item.OutstandingAmount ??
    item.AdvanceAmount ??
    item.Amount ??
    item.RemainingAmount ??
    '0.00';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: conditionalVerticalScale(14, 15, 16, 16),
        paddingHorizontal: conditionalScale(16, 18, 20, 20),
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: T.rowDivider,
      }}>
      {/* Advance Type Column */}
      <View style={{flex: 1}}>
        <View
          style={{
            backgroundColor: '#FFFFFF',
            paddingHorizontal: conditionalScale(8, 9, 10, 10),
            paddingVertical: conditionalVerticalScale(4, 4, 5, 5),
            borderRadius: conditionalScale(6, 7, 8, 8),
            alignSelf: 'flex-start',
          }}>
          <Text
            style={{
              fontSize: conditionalScale(11, 12, 12, 12),
              fontWeight: '600',
              color: '#000000',
            }}>
            {getAdvanceType(item)}
          </Text>
        </View>
      </View>

      {/* Amount Column */}
      <View
        style={{
          width: conditionalScale(110, 115, 120, 120),
          alignItems: 'flex-end',
        }}>
        <Text
          style={{
            fontSize: conditionalScale(15, 16, 16, 16),
            fontWeight: '700',
            color: T.blue,
          }}>
          {formatAmount(getAmount(item))}
        </Text>
      </View>
    </View>
  );
};

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

  const uniqueAdvanceTypes = [
    ...new Set(
      data
        .map(item => getAdvanceType(item))
        .filter(type => type && type !== '—'),
    ),
  ];

  const filterPills = ['All', ...uniqueAdvanceTypes];

  const getFilterCounts = () => {
    const counts = {All: data.length};
    uniqueAdvanceTypes.forEach(type => {
      counts[type] = data.filter(item => getAdvanceType(item) === type).length;
    });
    return counts;
  };

  const getFilteredData = () => {
    if (activeFilter === 'All') {
      return data;
    }
    return data.filter(item => getAdvanceType(item) === activeFilter);
  };

  const filteredData = getFilteredData();

  // ── Calculations ────────────────────────────────────────────────────────────
  const total = filteredData.reduce((sum, item) => {
    const val =
      safeNum(item.OutstandingAmount) ||
      safeNum(item.AdvanceAmount) ||
      safeNum(item.Amount) ||
      0;
    return sum + val;
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
            <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
          }>
          {isLoading ? (
            <CustomIndicator />
          ) : (
            <>
              {/* Header Summary Card - Blue Background */}
              <View
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
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: conditionalScale(20, 22, 24, 24),
                  }}>
                  <IconBadge
                    icon="hand-holding-usd"
                    iconColor={T.blue}
                    iconBg="#FFFFFF"
                    size={conditionalScale(44, 48, 52, 52)}
                  />
                  <View
                    style={{
                      flex: 1,
                      marginLeft: conditionalScale(14, 15, 16, 16),
                    }}>
                    <Text
                      style={{
                        fontSize: conditionalScale(13, 14, 14, 14),
                        fontWeight: '500',
                        color: 'rgba(255,255,255,0.8)',
                        marginBottom: conditionalVerticalScale(4, 4, 5, 5),
                      }}>
                      Total Outstanding Amount
                    </Text>
                    <Text
                      style={{
                        fontSize: conditionalScale(28, 30, 32, 32),
                        fontWeight: '700',
                        color: '#FFFFFF',
                        marginLeft: conditionalScale(10, 12, 14, 14), // ← adjust this value to taste
                      }}>
                      {formatAmount(total)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Outstanding Advances Table */}
              <AnimatedCard delay={0}>
                {/* Table Header */}
                <View
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
                    style={{
                      flex: 1,
                      fontSize: conditionalScale(12, 13, 13, 13),
                      fontWeight: '600',
                      color: '#FFFFFF',
                      letterSpacing: 0.5,
                    }}>
                    Advance Type
                  </Text>
                  <Text
                    style={{
                      width: conditionalScale(110, 115, 120, 120),
                      fontSize: conditionalScale(12, 13, 13, 13),
                      fontWeight: '600',
                      color: '#FFFFFF',
                      letterSpacing: 0.5,
                      textAlign: 'right',
                    }}>
                    Amount
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
