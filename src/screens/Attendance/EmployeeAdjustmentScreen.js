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
  ActivityIndicator,
  Animated,
} from 'react-native';
import moment from 'moment';
import {useSelector} from 'react-redux';
import {useIsFocused, useNavigation} from '@react-navigation/native';

import ActionPaneContainer from '../../components/ActionPaneContainer';
import AlertModal from '../../components/Alert/AlertModal';
import retrieveEmployeeAdjustments from '../../API/Attendance/retrieveEmployeeAdjustments';
import {MonthFilter} from '../../components/Attendance/AttendanceDetailsComponents';
import EmployeeAdjustmentLineDetails from '../../components/Attendance/EmployeeAdjustmentLineDetails';
import brand from '../../theme/brand';

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

// Skeleton Loading Component
const SkeletonLoader = () => {
  const opacity = useState(new Animated.Value(0.3))[0];

  useEffect(() => {
    const animate = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.7,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    };
    animate();
  }, [opacity]);

  return (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3].map(item => (
        <Animated.View key={item} style={[styles.skeletonCard, {opacity}]}>
          <View style={styles.skeletonHeader}>
            <View style={styles.skeletonDate} />
            <View style={styles.skeletonChip} />
          </View>
          <View style={styles.skeletonDetailRow}>
            <View style={styles.skeletonDetailItem}>
              <View style={styles.skeletonLabel} />
              <View style={styles.skeletonValue} />
            </View>
            <View style={styles.skeletonDetailItem}>
              <View style={styles.skeletonLabel} />
              <View style={styles.skeletonValue} />
            </View>
          </View>
          <View style={styles.skeletonDetailRow}>
            <View style={styles.skeletonDetailItem}>
              <View style={styles.skeletonLabel} />
              <View style={styles.skeletonValue} />
            </View>
          </View>
        </Animated.View>
      ))}
    </View>
  );
};

const EmployeeAdjustmentScreen = () => {
  const navigation = useNavigation();
  const {userData} = useSelector(state => state.user || {});
  const [month, setMonth] = useState(moment());
  const [raw, setRaw] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true); // Start with true to show loader immediately
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true); // Track initial load separately
  const [alert, setAlert] = useState({visible: false, text: ''});
  const [expandedId, setExpandedId] = useState(null);

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

  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (!userData?.employeeId) return;
      try {
        // Only show full loading on initial load, not on refreshes
        if (!isRefresh) {
          setLoading(true);
        }

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
        setInitialLoad(false);
      } catch (e) {
        setAlert({
          visible: true,
          text: e?.message || 'Failed to load employee adjustments.',
        });
        setRaw([]);
        setInitialLoad(false);
      } finally {
        setLoading(false);
      }
    },
    [userData?.employeeId, fromDate, toDate],
  );

  // Refresh when legal entity changes
  useEffect(() => {
    if (userData?.employeeId) {
      setExpandedId(null);
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
      await fetchData(true); // Pass true to indicate this is a refresh
    } finally {
      setRefreshing(false);
    }
  }, [fetchData]);

  const handleRowPress = useCallback(
    item => {
      if (expandedId === item._key) {
        setExpandedId(null);
      } else {
        setExpandedId(item._key);
      }
    },
    [expandedId],
  );

  const getStatusDisplayName = (registerStatus, wfStatus) => {
    if (wfStatus && wfStatus.trim() !== '') {
      return wfStatus;
    }
    if (registerStatus && registerStatus.trim() !== '') {
      return registerStatus;
    }
    return 'Adjustment';
  };

  const handleCreateAdjustment = () => {
    navigation.navigate('CreateEmployeeAdjustment');
  };

  // Render loading state
  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <SkeletonLoader />
    </View>
  );

  // Render empty state (only when not loading and no data)
  const renderEmptyState = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>No adjustments for this month</Text>
    </View>
  );

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
          style={[styles.rowCard, isExpanded && styles.expandedRowCard]}>
          <View style={styles.cardHeader}>
            <Text style={styles.dateText}>{dateLabel}</Text>
            <View style={styles.headerRight}>
              <View style={styles.chip}>
                <Text style={styles.chipText} numberOfLines={1}>
                  {displayStatus}
                </Text>
              </View>
              <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
            </View>
          </View>

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

          <View style={styles.detailRow}>
            {item.RegisterStatus && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Register Status:</Text>
                <Text style={styles.detailValue}>{item.RegisterStatus}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

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
      pageTitle="Adjustments"
      isBackButton={false}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title} />
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateAdjustment}>
              <Text style={styles.createButtonText}>Create Adjustment</Text>
            </TouchableOpacity>

            <MonthFilter
              month={month}
              onPrev={() => {
                setMonth(m => moment(m).subtract(1, 'month'));
                setExpandedId(null);
              }}
              onNext={() => {
                setMonth(m => moment(m).add(1, 'month'));
                setExpandedId(null);
              }}
            />
          </View>
        </View>

        {loading && initialLoad ? (
          renderLoadingState()
        ) : (
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
            ListEmptyComponent={!loading ? renderEmptyState() : null}
            ListFooterComponent={
              loading && !initialLoad ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color={brand.primaryStrong} />
                  <Text style={styles.footerLoaderText}>Updating...</Text>
                </View>
              ) : null
            }
          />
        )}
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

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 60,
  },
  title: {fontSize: 18, fontWeight: '800', color: '#263238'},
  createButton: {
    backgroundColor: brand.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    elevation: 2,
  },
  createButtonText: {
    color: brand.onPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {paddingTop: 8, paddingBottom: 16},

  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  skeletonContainer: {
    paddingTop: 8,
  },
  skeletonCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    borderLeftWidth: 5,
    borderLeftColor: '#E0E0E0',
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 12,
  },
  skeletonDate: {
    height: 16,
    width: 150,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  skeletonChip: {
    height: 20,
    width: 80,
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
  },
  skeletonDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  skeletonDetailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  skeletonLabel: {
    height: 12,
    width: 80,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginRight: 8,
  },
  skeletonValue: {
    height: 12,
    flex: 1,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  footerLoaderText: {
    color: '#607D8B',
    fontSize: 14,
  },

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
    borderLeftColor: brand.primaryStrong,
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
  chipText: {fontSize: 11, fontWeight: '700', color: brand.secondary},

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
    color: brand.secondary,
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
  emptyText: {color: '#78909C', fontSize: 16},
});

export default EmployeeAdjustmentScreen;
