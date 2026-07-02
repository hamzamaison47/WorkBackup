import React, {useState, useCallback} from 'react';
import {View, Text} from 'react-native';
import {useSelector} from 'react-redux';
import {useNavigation, useFocusEffect} from '@react-navigation/native';

import {GetEmployeeAdvances} from '../../API/EmployeeAdvances/GetEmployeeAdvances';
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

const formatDate = dateString => {
  if (!dateString) {
    return '—';
  }
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return dateString;
  }
  if (date.getFullYear() === 1900) {
    return '—';
  }
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

// ─── Parse Recoveries from advance record ────────────────────────────────────
const parseRecoveries = advance => {
  const rec = advance.Recoveries;
  if (!rec) {
    return [];
  }
  let recArray = [];
  if (Array.isArray(rec)) {
    recArray = rec;
  } else {
    const values = Object.values(rec);
    if (values.length > 0 && Array.isArray(values[0])) {
      recArray = values[0];
    } else if (values.length > 0 && typeof values[0] === 'object') {
      recArray = [values[0]];
    } else if (typeof rec === 'object') {
      recArray = [rec];
    }
  }
  return recArray
    .filter(r => r && safeNum(r.RecoveryAmount) > 0)
    .map(r => ({
      ...r,
      AdvanceTypeCode: advance.AdvanceTypeCode || '—',
    }));
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({status, variant = 'advance'}) => {
  const getAdvanceStatusStyle = () => {
    switch (String(status).toLowerCase()) {
      case 'recovered':
        return {bg: '#E8F5E9', text: '#2E7D32'};
      case 'approved':
        return {bg: '#E3F2FD', text: '#1565C0'};
      case 'pending':
        return {bg: '#FFF8E1', text: '#F57F17'};
      case 'rejected':
        return {bg: '#FFEBEE', text: '#C62828'};
      default:
        return {bg: '#F5F5F5', text: '#757575'};
    }
  };

  const getPostingStatusStyle = () => {
    switch (String(status).toLowerCase()) {
      case 'posted':
        return {bg: '#E8F5E9', text: '#2E7D32'};
      case 'unposted':
        return {bg: '#FFF8E1', text: '#F57F17'};
      case 'outsidesystem':
        return {bg: '#F3E5F5', text: '#6A1B9A'};
      case 'none':
        return {bg: '#F5F5F5', text: '#9E9E9E'};
      default:
        return {bg: '#F5F5F5', text: '#757575'};
    }
  };

  const s =
    variant === 'posting' ? getPostingStatusStyle() : getAdvanceStatusStyle();

  if (!status || String(status).trim() === '') {
    return null;
  }

  return (
    <View
      // eslint-disable-next-line react-native/no-inline-styles
      style={{
        backgroundColor: s.bg,
        borderRadius: conditionalScale(5, 5, 6, 6),
        paddingHorizontal: conditionalScale(7, 8, 8, 8),
        paddingVertical: conditionalVerticalScale(2, 2, 3, 3),
        alignSelf: 'flex-start',
      }}>
      <Text
        // eslint-disable-next-line react-native/no-inline-styles
        style={{
          fontSize: conditionalScale(10, 11, 11, 11),
          fontWeight: '600',
          color: s.text,
        }}>
        {status}
      </Text>
    </View>
  );
};

// ─── Advance Card Row ─────────────────────────────────────────────────────────
const AdvanceRow = ({item}) => {
  const T = useAppTokens();
  const advanceAmount = safeNum(item.AdvanceAmount);
  const totalRecovered = safeNum(item.TotalRecovered);
  const remainingAmount = safeNum(item.RemainingAmount);
  const hasRecovery = totalRecovered > 0;

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
      {/* Top Row: Type + Remaining */}
      <View
        // eslint-disable-next-line react-native/no-inline-styles
        style={{flexDirection: 'row', alignItems: 'flex-start'}}>
        {/* Left: Type + Status Badges */}
        <View style={{flex: 1}}>
          <Text
            // eslint-disable-next-line react-native/no-inline-styles
            style={{
              fontSize: conditionalScale(13, 14, 14, 14),
              fontWeight: '600',
              color: '#000000',
              marginBottom: conditionalVerticalScale(4, 4, 5, 5),
            }}>
            {item.AdvanceTypeCode || '—'}
          </Text>
          <View
            // eslint-disable-next-line react-native/no-inline-styles
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: conditionalScale(6, 6, 8, 8),
            }}>
            <StatusBadge status={item.AdvanceStatus} variant="advance" />
            {item.PaymentStatus &&
              String(item.PaymentStatus).trim() !== '' &&
              String(item.PaymentStatus).toLowerCase() !== 'none' && (
                <StatusBadge status={item.PaymentStatus} variant="posting" />
              )}
          </View>
        </View>

        {/* Right: Remaining Amount */}
        <View
          // eslint-disable-next-line react-native/no-inline-styles
          style={{alignItems: 'flex-end'}}>
          <Text
            // eslint-disable-next-line react-native/no-inline-styles
            style={{
              fontSize: conditionalScale(15, 16, 16, 16),
              fontWeight: '700',
              color: T.blue,
            }}>
            {formatAmount(remainingAmount)}
          </Text>
          <Text
            // eslint-disable-next-line react-native/no-inline-styles
            style={{
              fontSize: conditionalScale(10, 10, 11, 11),
              color: '#888888',
              marginTop: conditionalVerticalScale(2, 2, 2, 2),
            }}>
            Remaining
          </Text>
        </View>
      </View>

      {/* Bottom Row: Original + Recovered */}
      <View
        // eslint-disable-next-line react-native/no-inline-styles
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: conditionalVerticalScale(8, 8, 10, 10),
        }}>
        <Text
          // eslint-disable-next-line react-native/no-inline-styles
          style={{
            fontSize: conditionalScale(11, 11, 12, 12),
            color: '#888888',
          }}>
          Original: {formatAmount(advanceAmount)}
        </Text>

        {hasRecovery && (
          <View
            // eslint-disable-next-line react-native/no-inline-styles
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#E8F5E9',
              borderRadius: conditionalScale(6, 7, 8, 8),
              paddingHorizontal: conditionalScale(8, 9, 10, 10),
              paddingVertical: conditionalVerticalScale(2, 3, 3, 3),
            }}>
            <Text
              // eslint-disable-next-line react-native/no-inline-styles
              style={{
                fontSize: conditionalScale(11, 11, 12, 12),
                fontWeight: '600',
                color: '#2E7D32',
              }}>
              ✓ Recovered: {formatAmount(totalRecovered)}
            </Text>
          </View>
        )}
      </View>

      {/* Pay Period */}
      <Text
        // eslint-disable-next-line react-native/no-inline-styles
        style={{
          fontSize: conditionalScale(10, 11, 11, 11),
          color: '#AAAAAA',
          marginTop: conditionalVerticalScale(4, 4, 5, 5),
        }}>
        {item.PayPeriodCode || ''}
        {item.PaymentDate && formatDate(item.PaymentDate) !== '—'
          ? `  ·  Paid: ${formatDate(item.PaymentDate)}`
          : ''}
      </Text>
    </View>
  );
};

// ─── Recovery Detail Row ──────────────────────────────────────────────────────
const RecoveryRow = ({item, index}) => {
  const T = useAppTokens();
  return (
    <View
      // eslint-disable-next-line react-native/no-inline-styles
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: conditionalVerticalScale(12, 13, 14, 14),
        paddingHorizontal: conditionalScale(16, 18, 20, 20),
        backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
        borderBottomWidth: 1,
        borderBottomColor: T.rowDivider,
      }}>
      <View
        // eslint-disable-next-line react-native/no-inline-styles
        style={{width: conditionalScale(95, 100, 105, 105)}}>
        <Text
          // eslint-disable-next-line react-native/no-inline-styles
          style={{
            fontSize: conditionalScale(12, 13, 13, 13),
            fontWeight: '500',
            color: '#444444',
          }}>
          {formatDate(item.RecoveryDate)}
        </Text>
      </View>

      <View style={{flex: 1}}>
        <Text
          // eslint-disable-next-line react-native/no-inline-styles
          style={{
            fontSize: conditionalScale(11, 12, 12, 12),
            fontWeight: '600',
            color: '#000000',
          }}>
          {item.AdvanceTypeCode || '—'}
        </Text>
      </View>

      <View
        // eslint-disable-next-line react-native/no-inline-styles
        style={{
          width: conditionalScale(100, 105, 110, 110),
          alignItems: 'flex-end',
        }}>
        <Text
          // eslint-disable-next-line react-native/no-inline-styles
          style={{
            fontSize: conditionalScale(14, 15, 15, 15),
            fontWeight: '700',
            color: '#2E7D32',
          }}>
          {formatAmount(item.RecoveryAmount)}
        </Text>
      </View>
    </View>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const EmployeeAdvancesList = () => {
  const T = useAppTokens();
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [advances, setAdvances] = useState([]);
  const [recoveries, setRecoveries] = useState([]);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const navigation = useNavigation();
  const {userData} = useSelector(state => state.user);

  // ── Core data processor ─────────────────────────────────────────────────────
  const processResult = useCallback(result => {
    if (!Array.isArray(result)) {
      setAdvances([]);
      setRecoveries([]);
      return;
    }
    setAdvances(result);
    const allRecoveries = [];
    result.forEach(advance => {
      const parsed = parseRecoveries(advance);
      allRecoveries.push(...parsed);
    });
    allRecoveries.sort(
      (a, b) => new Date(a.RecoveryDate) - new Date(b.RecoveryDate),
    );
    setRecoveries(allRecoveries);
  }, []);

  // ── Initial / focus fetch ───────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!userData?.employeeId) {
      return;
    }
    setIsLoading(true);
    try {
      const result = await GetEmployeeAdvances({
        employeeId: userData.employeeId,
        payGroupCode: '',
        payPeriodCode: '',
      });
      console.log('Employee Advances data:', result);
      processResult(result);
      setActiveFilter('All');
    } catch (err) {
      console.error('Employee Advances fetch error:', err);
      setAlertMessage(
        'Unable to load data. Please check your connection and try again.',
      );
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  }, [userData?.employeeId, processResult]);

  // ── Pull-to-refresh ─────────────────────────────────────────────────────────
  const onRefresh = useCallback(async () => {
    console.log('🔄 onRefresh triggered');
    if (!userData?.employeeId) {
      return;
    }
    setRefreshing(true);
    try {
      const result = await GetEmployeeAdvances({
        employeeId: userData.employeeId,
        payGroupCode: '',
        payPeriodCode: '',
      });
      processResult(result);
      setActiveFilter('All');
    } catch (err) {
      console.error('Refresh error:', err);
      setAlertMessage('Unable to refresh. Please check your connection.');
      setAlertModal(true);
    } finally {
      setRefreshing(false);
    }
  }, [userData?.employeeId, processResult]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const handleGoBack = () => navigation.goBack();

  // ── Filter Logic ────────────────────────────────────────────────────────────
  const uniqueAdvanceTypes = [
    ...new Set(
      advances
        .map(item => item.AdvanceTypeCode)
        .filter(code => code && code !== '—'),
    ),
  ];

  const filterPills = ['All', ...uniqueAdvanceTypes];

  const getFilterCounts = () => {
    const counts = {All: advances.length};
    uniqueAdvanceTypes.forEach(type => {
      counts[type] = advances.filter(
        item => item.AdvanceTypeCode === type,
      ).length;
    });
    return counts;
  };

  const filteredAdvances =
    activeFilter === 'All'
      ? advances
      : advances.filter(item => item.AdvanceTypeCode === activeFilter);

  const filteredRecoveries =
    activeFilter === 'All'
      ? recoveries
      : recoveries.filter(item => item.AdvanceTypeCode === activeFilter);

  // ─── Render ──────────────────────────────────────────────────────────────────
  // ↓ No ScrollView or RefreshControl here — ActionPaneContainer owns the scroll.
  // ↓ Pass refreshing + onRefresh to it so it can attach them to its internal ScrollView.
  return (
    <ActionPaneContainer
      pageTitle="Recovery Schedule"
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive
      onBackPress={handleGoBack}
      refreshing={refreshing}
      onRefresh={onRefresh}
      showFilterPills={filterPills.length > 1}
      filterPills={filterPills}
      activeFilter={activeFilter}
      onFilterChange={setActiveFilter}
      filterCounts={getFilterCounts()}
      showPageTitleRow={true}>
      <PageBackground>
        {isLoading ? (
          <CustomIndicator />
        ) : (
          <>
            {/* ── Advances Table ───────────────────────────── */}
            <AnimatedCard delay={0}>
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
                    color: '#FFFFFF',
                    letterSpacing: 0.5,
                  }}>
                  Advance Type
                </Text>
                <Text
                  // eslint-disable-next-line react-native/no-inline-styles
                  style={{
                    fontSize: conditionalScale(12, 13, 13, 13),
                    fontWeight: '600',
                    color: '#FFFFFF',
                    letterSpacing: 0.5,
                    textAlign: 'right',
                  }}>
                  Remaining
                </Text>
              </View>

              {filteredAdvances.length === 0 ? (
                <EmptyState
                  icon="document-text-outline"
                  title="No Advances Found"
                  message={
                    activeFilter !== 'All'
                      ? `No records found for "${activeFilter}"`
                      : 'Pull down to refresh'
                  }
                />
              ) : (
                filteredAdvances.map((item, index) => (
                  <AdvanceRow key={item.AdvanceId ?? index} item={item} />
                ))
              )}
            </AnimatedCard>

            {/* ── Recovery Schedule Table ── */}
            {filteredRecoveries.length > 0 && (
              <AnimatedCard delay={100}>
                <View
                  // eslint-disable-next-line react-native/no-inline-styles
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: conditionalVerticalScale(12, 13, 14, 14),
                    paddingHorizontal: conditionalScale(16, 18, 20, 20),
                    backgroundColor: '#2E7D32',
                    borderTopLeftRadius: conditionalScale(12, 13, 14, 14),
                    borderTopRightRadius: conditionalScale(12, 13, 14, 14),
                  }}>
                  <Text
                    // eslint-disable-next-line react-native/no-inline-styles
                    style={{
                      width: conditionalScale(95, 100, 105, 105),
                      fontSize: conditionalScale(12, 13, 13, 13),
                      fontWeight: '600',
                      color: '#FFFFFF',
                      letterSpacing: 0.5,
                    }}>
                    Date
                  </Text>
                  <Text
                    // eslint-disable-next-line react-native/no-inline-styles
                    style={{
                      flex: 1,
                      fontSize: conditionalScale(12, 13, 13, 13),
                      fontWeight: '600',
                      color: '#FFFFFF',
                      letterSpacing: 0.5,
                    }}>
                    Recovery Detail
                  </Text>
                  <Text
                    // eslint-disable-next-line react-native/no-inline-styles
                    style={{
                      width: conditionalScale(100, 105, 110, 110),
                      fontSize: conditionalScale(12, 13, 13, 13),
                      fontWeight: '600',
                      color: '#FFFFFF',
                      letterSpacing: 0.5,
                      textAlign: 'right',
                    }}>
                    Amount
                  </Text>
                </View>

                {filteredRecoveries.map((item, index) => (
                  <RecoveryRow key={index} item={item} index={index} />
                ))}
              </AnimatedCard>
            )}

            {filteredAdvances.length > 0 && (
              <FooterNote
                text={`${filteredAdvances.length} advance${
                  filteredAdvances.length !== 1 ? 's' : ''
                }${
                  filteredRecoveries.length > 0
                    ? ` · ${filteredRecoveries.length} recovery record${
                        filteredRecoveries.length !== 1 ? 's' : ''
                      }`
                    : ''
                }${activeFilter !== 'All' ? ` for ${activeFilter}` : ''}`}
                style={{
                  marginTop: conditionalVerticalScale(16, 18, 20, 20),
                }}
              />
            )}
          </>
        )}
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

export default EmployeeAdvancesList;
