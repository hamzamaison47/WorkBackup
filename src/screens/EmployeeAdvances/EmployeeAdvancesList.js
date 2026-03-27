import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  I18nManager,
} from 'react-native';
import {useSelector} from 'react-redux';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome5';

import {GetEmployeeAdvances} from '../../API/EmployeeAdvances/GetEmployeeAdvances';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import AlertModal from '../../components/Alert/AlertModal';

// ─── Theme ────────────────────────────────────────────────────────────────────
const BLUE = '#0A66C2';
const BLUE_LIGHT = '#EBF4FF';
const DIVIDER = '#E8EEF6';
const TEXT_PRIMARY = '#1A2B45';
const TEXT_SECONDARY = '#5A7296';
const WHITE = '#FFFFFF';

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

const formatDate = dateString => {
  if (!dateString) {
    return '—';
  }
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return dateString;
  }
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  // If it's a dummy date like 1900-01-01, handle smoothly
  if (year === 1900) {
    return '—';
  }
  return `${month}/${day}/${year}`;
};

// ─── Component ────────────────────────────────────────────────────────────────
const EmployeeAdvancesList = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState([]);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const navigation = useNavigation();
  const isRTL = I18nManager.isRTL;
  const {userData} = useSelector(state => state.user);

  // ── Fetch ────────────────────────────────────────────────────────────────
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

      // Flatten Recoveries from all Advances into a single array
      let allRecoveries = [];
      if (Array.isArray(result)) {
        result.forEach(advance => {
          const rec = advance.Recoveries;
          if (rec) {
            // XML parser structure might wrap arrays in a nested object key dynamically
            // e.g. Recoveries.PREmployeeAdvancesSvcContract -> Array
            // Let's traverse robustly to find arrays of recoveries
            let recArray = [];

            // Drill down just in case fast-xml-parser nested it
            const values = Object.values(rec);
            if (Array.isArray(rec)) {
              recArray = rec;
            } else if (values.length > 0 && Array.isArray(values[0])) {
              recArray = values[0];
            } else if (values.length > 0 && typeof values[0] === 'object') {
              recArray = [values[0]];
            } else if (typeof rec === 'object') {
              recArray = [rec];
            }

            // Filter to keep only valid recoveries with an amount > 0 or specific date
            recArray.forEach(r => {
              if (
                r &&
                r.RecoveryAmount !== undefined &&
                parseFloat(r.RecoveryAmount) > 0
              ) {
                allRecoveries.push({
                  ...r,
                  // Inject parent AdvanceTypeCode
                  AdvanceTypeCode: advance.AdvanceTypeCode || '—',
                });
              }
            });
          }
        });
      }

      // Optional: sort by RecoveryDate
      allRecoveries.sort(
        (a, b) => new Date(a.RecoveryDate) - new Date(b.RecoveryDate),
      );

      setData(allRecoveries);
      // Reset filter to 'All' on fresh data load
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
  }, [userData?.employeeId]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  // ── Navigation ───────────────────────────────────────────────────────────
  const handleGoBack = () => navigation.goBack();
  const handleRefresh = () => fetchData();

  // ── Filter Logic ─────────────────────────────────────────────────────────
  // Derive unique advance type codes from data (deduplicated)
  const uniqueAdvanceTypes = [
    ...new Set(
      data
        .map(item => item.AdvanceTypeCode)
        .filter(code => code && code !== '—'),
    ),
  ];

  // Build pill list: always start with 'All', then unique types
  const filterPills = ['All', ...uniqueAdvanceTypes];

  // Compute counts per pill
  const filterCounts = filterPills.reduce((acc, pill) => {
    if (pill === 'All') {
      acc[pill] = data.length;
    } else {
      acc[pill] = data.filter(item => item.AdvanceTypeCode === pill).length;
    }
    return acc;
  }, {});

  // Filtered data to render in the table
  const filteredData =
    activeFilter === 'All'
      ? data
      : data.filter(item => item.AdvanceTypeCode === activeFilter);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ActionPaneContainer
      pageTitle="Recovery Schedule"
      showFooter
      showFloatingButton={false}
      isHeaderActive
      onBackPress={handleGoBack}
      onRefresh={handleRefresh}
      showFilterPills={data.length > 0}
      filterPills={filterPills}
      activeFilter={activeFilter}
      onFilterChange={setActiveFilter}
      filterCounts={filterCounts}
      showPageTitleRow={true}>
      {isLoading ? (
        <CustomIndicator />
      ) : (
        <ScrollView
          style={s.scrollView}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
          }>
          {/* ─── Header Card ─────────────────────────────────────────────── */}
          <LinearGradient
            colors={['#0A66C2', '#1E88E5', '#42A5F5']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={s.headerCard}>
            <View style={s.headerIconWrap}>
              <Icon name="calendar-alt" size={26} color={WHITE} />
            </View>
            <Text style={s.headerTitle}>Recovery Schedule</Text>
            <Text style={s.headerSubtitle}>
              {activeFilter === 'All'
                ? 'Summary of your recovery schedule records'
                : `Showing records for: ${activeFilter}`}
            </Text>
          </LinearGradient>

          {/* ─── Table Card ──────────────────────────────────────────────── */}
          <View style={s.tableCard}>
            {/* Table Header */}
            <LinearGradient
              colors={[BLUE, '#1976D2']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={[s.tableRow, s.tableHeaderRow]}>
              <Text style={[s.colDate, s.headerCellText, isRTL && s.textRight]}>
                Recovery Date
              </Text>
              <Text
                style={[
                  s.colAdvanceType,
                  s.headerCellText,
                  isRTL && s.textRight,
                ]}>
                Advance Type
              </Text>
              <Text style={[s.colAmount, s.headerCellText, s.textRight]}>
                Recovery Amount
              </Text>
            </LinearGradient>

            {/* Data Rows */}
            {filteredData.length === 0 ? (
              <View style={s.emptyWrap}>
                <Icon name="inbox" size={40} color="#C5D4E8" />
                <Text style={s.emptyText}>No recovery schedule found</Text>
                <Text style={s.emptySubText}>
                  {activeFilter !== 'All'
                    ? `No records for "${activeFilter}"`
                    : 'Pull down to refresh'}
                </Text>
              </View>
            ) : (
              filteredData.map((item, index) => {
                const isEven = index % 2 === 0;
                return (
                  <View
                    key={index}
                    style={[
                      s.tableRow,
                      s.dataRow,
                      {backgroundColor: isEven ? WHITE : BLUE_LIGHT},
                    ]}>
                    {/* Accent bar */}
                    <View style={s.rowAccent} />

                    <Text
                      style={[s.colDate, s.cellText, isRTL && s.textRight]}
                      numberOfLines={2}>
                      {formatDate(item.RecoveryDate)}
                    </Text>
                    <Text
                      style={[
                        s.colAdvanceType,
                        s.cellText,
                        isRTL && s.textRight,
                      ]}
                      numberOfLines={2}>
                      {item.AdvanceTypeCode}
                    </Text>
                    <Text style={[s.colAmount, s.cellText, s.amountText]}>
                      {formatAmount(item.RecoveryAmount)}
                    </Text>
                  </View>
                );
              })
            )}
          </View>

          {/* ─── Footer Note ─────────────────────────────────────────────── */}
          {filteredData.length > 0 && (
            <View style={s.footerNote}>
              <Icon name="info-circle" size={12} color={TEXT_SECONDARY} />
              <Text style={s.footerNoteText}>
                {filteredData.length} record
                {filteredData.length !== 1 ? 's' : ''} shown
                {activeFilter !== 'All' ? ` for "${activeFilter}"` : ''}
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      <AlertModal
        visible={alertModal}
        heading="Error"
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />
    </ActionPaneContainer>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // Header Card
  headerCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: BLUE,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  headerIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: WHITE,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.80)',
    textAlign: 'center',
    marginBottom: 10, // Adjusted padding without Total Badge
  },

  // Table
  tableCard: {
    backgroundColor: WHITE,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 12,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  tableHeaderRow: {
    paddingVertical: 14,
  },
  dataRow: {
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
    minHeight: 52,
  },
  rowAccent: {
    width: 3,
    height: '70%',
    backgroundColor: BLUE,
    borderRadius: 2,
    marginRight: 10,
    opacity: 0.25,
  },

  // Columns
  colDate: {
    width: 110,
    paddingRight: 8,
  },
  colAdvanceType: {
    flex: 1,
    paddingRight: 8,
  },
  colAmount: {
    width: 110,
    textAlign: 'center',
  },

  // Cell text
  headerCellText: {
    color: WHITE,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.3,
  },
  cellText: {
    color: TEXT_PRIMARY,
    fontSize: 14,
    fontWeight: '500',
  },
  amountText: {
    fontWeight: '700',
    color: BLUE,
    fontVariant: ['tabular-nums'],
  },
  textRight: {
    textAlign: 'right',
  },

  // Empty
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },
  emptySubText: {
    marginTop: 6,
    fontSize: 13,
    color: TEXT_SECONDARY,
    textAlign: 'center',
  },

  // Footer note
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 4,
  },
  footerNoteText: {
    fontSize: 11,
    color: TEXT_SECONDARY,
    marginLeft: 4,
  },
});

export default EmployeeAdvancesList;
