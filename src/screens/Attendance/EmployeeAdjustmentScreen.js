/* eslint-disable react-native/no-inline-styles */
/* eslint-disable curly */
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import moment from 'moment';
import {useSelector} from 'react-redux';
import {useIsFocused} from '@react-navigation/native';

import ActionPaneContainer from '../../components/ActionPaneContainer';
import AlertModal from '../../components/Alert/AlertModal';
import retrieveEmployeeAdjustments from '../../API/Attendance/retrieveEmployeeAdjustments';
import {MonthFilter} from '../../components/Attendance/AttendanceDetailsComponents';
import EmployeeAdjustmentLineDetails from '../../components/Attendance/EmployeeAdjustmentLineDetails'; // We'll create this

/* ------------ utils ------------ */
const parseISO = iso =>
  iso ? moment.parseZone(iso, moment.ISO_8601, true).utc() : null;

const normalizeArray = payload => {
  try {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (typeof payload === 'string') {
      const parsed = JSON.parse(payload);
      return Array.isArray(parsed) ? parsed : [];
    }
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.value)) return payload.value;
    return [];
  } catch {
    return [];
  }
};

/** Build a guaranteed-unique, stable key for FlatList */
const buildKey = (d, idx) => {
  const recId = d.RecId ?? d.RecID ?? d.recId ?? d.ID ?? d.Id ?? d.id ?? '';
  const parts = [
    d.AttendanceDate || 'NA',
    d.ShiftId || 'NA',
    recId || 'noid',
    idx,
  ];
  return String(parts.join('|'));
};

const EmployeeAdjustmentScreen = () => {
  const {userData} = useSelector(state => state.user || {});
  const [month, setMonth] = useState(moment());
  const [raw, setRaw] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [alert, setAlert] = useState({visible: false, text: ''});
  const [expandedId, setExpandedId] = useState(null); // Track which row is expanded

  const isFocused = useIsFocused();
  const selectedLegalEntity = useSelector(
    state => state.company.selectedLegalEntity,
  );
  const fromDate = useMemo(
    () => moment(month).startOf('month').format('YYYY-MM-DD'),
    [month],
  );
  const toDate = useMemo(
    () => moment(month).endOf('month').format('YYYY-MM-DD'),
    [month],
  );

  const fetchData = useCallback(async () => {
    if (!userData?.employeeId) return;
    try {
      setLoading(true);

      const list = await retrieveEmployeeAdjustments({
        employeeId: userData.employeeId,
        fromDate,
        toDate,
      });

      const arr = normalizeArray(list)
        .filter(Boolean)
        .map((d, idx) => {
          const dt = parseISO(d.AttendanceDate);
          return {
            ...d,
            __parsedDate: dt,
            _key: buildKey(d, idx),
          };
        });

      setRaw(arr);
    } catch (e) {
      setAlert({
        visible: true,
        text: e?.message || 'Failed to load employee adjustments.',
      });
      setRaw([]);
    } finally {
      setLoading(false);
    }
  }, [userData?.employeeId, fromDate, toDate]);

  // Refresh when legal entity changes
  useEffect(() => {
    if (userData?.employeeId) {
      setRaw([]);
      setData([]);
      setExpandedId(null); // Reset expanded state
      fetchData();
    }
  }, [fetchData, selectedLegalEntity, userData?.employeeId]);

  useEffect(() => {
    if (isFocused) fetchData();
  }, [isFocused, fetchData]);

  useEffect(() => {
    if (isFocused) fetchData();
  }, [month, isFocused, fetchData]);

  useEffect(() => {
    const filtered = raw
      .filter(it => it.__parsedDate && it.__parsedDate.isSame(month, 'month'))
      .sort((a, b) => a.__parsedDate.valueOf() - b.__parsedDate.valueOf());
    setData(filtered);
  }, [raw, month]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } finally {
      setRefreshing(false);
    }
  }, [fetchData]);

  // Toggle expand/collapse
  const handleRowPress = useCallback(
    item => {
      // If clicking the same row that's already expanded, collapse it
      if (expandedId === item._key) {
        setExpandedId(null);
      } else {
        // Expand the clicked row
        setExpandedId(item._key);
      }
    },
    [expandedId],
  );

  const getStatusDisplayName = (registerStatus, wfStatus) => {
    // Prefer WFStatus if available and meaningful
    if (wfStatus && wfStatus.trim() !== '') {
      return wfStatus;
    }
    if (registerStatus && registerStatus.trim() !== '') {
      return registerStatus;
    }
    return 'Adjustment';
  };

  const renderItem = ({item}) => {
    const dateLabel = item.__parsedDate
      ? item.__parsedDate.local().format('ddd, MMM D, YYYY')
      : '--';

    const displayStatus = getStatusDisplayName(
      item.RegisterStatus,
      item.WFStatus,
    );

    const isExpanded = expandedId === item._key;

    return (
      <View style={styles.rowContainer}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleRowPress(item)}
          style={[
            styles.rowCard,
            isExpanded && styles.expandedRowCard, // Different style when expanded
          ]}>
          {/* Header with date and status */}
          <View style={styles.cardHeader}>
            <Text style={styles.dateText}>{dateLabel}</Text>
            <View style={styles.headerRight}>
              <View style={styles.chip}>
                <Text style={styles.chipText} numberOfLines={1}>
                  {displayStatus}
                </Text>
              </View>
              {/* Expand/collapse indicator */}
              <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
            </View>
          </View>

          {/* Type and Shift Information */}
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Type:</Text>
              <Text style={styles.detailValue}>{item.GenerationType}</Text>
            </View>
            {item.ShiftId && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Shift ID:</Text>
                <Text style={styles.detailValue}>{item.ShiftId}</Text>
              </View>
            )}
          </View>

          {/* Status Information */}
          <View style={styles.detailRow}>
            {item.RegisterStatus && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Register Status:</Text>
                <Text style={styles.detailValue}>{item.RegisterStatus}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Expanded Details */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            <EmployeeAdjustmentLineDetails
              adjustmentData={item}
              employeeId={userData?.employeeId}
              employeeName={userData?.employeeName}
              attendanceDate={item.AttendanceDate}
            />
          </View>
        )}
      </View>
    );
  };

  return (
    <ActionPaneContainer
      pageTitle="Employee Adjustments"
      isBackButton={false}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}>
      <View style={styles.container}>
        <View className="headerRow" style={styles.headerRow}>
          <Text style={styles.title} />
          <MonthFilter
            month={month}
            onPrev={() => {
              setMonth(m => moment(m).subtract(1, 'month'));
              setExpandedId(null); // Collapse when changing month
            }}
            onNext={() => {
              setMonth(m => moment(m).add(1, 'month'));
              setExpandedId(null); // Collapse when changing month
            }}
          />
        </View>

        <FlatList
          style={{flex: 1}}
          contentContainerStyle={styles.listContent}
          data={data}
          keyExtractor={(it, idx) => it._key || String(idx)}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          nestedScrollEnabled
          ListEmptyComponent={
            !loading ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>
                  No adjustments for this month
                </Text>
              </View>
            ) : null
          }
        />
      </View>

      <AlertModal
        visible={alert.visible}
        heading="Alert"
        text={alert.text}
        onPress={() => setAlert(s => ({...s, visible: false}))}
      />
    </ActionPaneContainer>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F5F5F5', padding: 16},
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  title: {fontSize: 18, fontWeight: '800', color: '#263238'},
  listContent: {paddingTop: 8, paddingBottom: 16},

  rowContainer: {
    marginBottom: 12,
  },

  rowCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    elevation: 2,
    borderLeftWidth: 5,
    borderLeftColor: '#E0E0E0',
  },

  expandedRowCard: {
    borderLeftColor: '#2196F3', // Blue border when expanded
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {fontSize: 15, fontWeight: '700', color: '#263238'},

  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#B0BEC5',
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  chipText: {fontSize: 11, fontWeight: '700', color: '#455A64'},

  expandIcon: {
    fontSize: 12,
    color: '#607D8B',
    fontWeight: 'bold',
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#455A64',
    marginRight: 4,
    minWidth: 80,
  },
  detailValue: {
    fontSize: 12,
    color: '#263238',
    fontWeight: '500',
    flex: 1,
  },

  expandedContent: {
    backgroundColor: '#F8F9FA',
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    padding: 0,
    elevation: 1,
  },

  empty: {alignItems: 'center', paddingTop: 36, paddingHorizontal: 12},
  emptyText: {color: '#78909C'},
});

export default EmployeeAdjustmentScreen;
