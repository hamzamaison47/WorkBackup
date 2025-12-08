/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable no-unused-vars */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable curly */
import React, {memo, useCallback, useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import moment from 'moment';
import {useSelector} from 'react-redux';
import {useIsFocused, useNavigation} from '@react-navigation/native';

import ActionPaneContainer from '../../components/ActionPaneContainer';
import AlertModal from '../../components/Alert/AlertModal';
import getRosterDetailsByDate from '../../API/Attendance/TASEmployeeRosterAPI';
import {MonthFilter} from '../../components/Attendance/AttendanceDetailsComponents'; // ← Same filter as AttendanceDetailsScreen

/* ------------ utils ------------ */
const parseISO = iso =>
  iso ? moment.parseZone(iso, moment.ISO_8601, true).utc() : null;

const isBlankTime = v =>
  v === null ||
  v === undefined ||
  v === '' ||
  v === 0 ||
  v === '0' ||
  v === '00:00' ||
  v === '00:00:00';

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

/** Convert 24h h:m to 12h with AM/PM */
const to12h = (h24, m = 0) => {
  if (!Number.isFinite(h24) || !Number.isFinite(m)) return '--';
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
};

/** Accepts "HH:MM(:SS)" or seconds → 12h with AM/PM */
const formatShiftTime12h = value => {
  if (isBlankTime(value)) return '--';
  if (typeof value === 'string' && value.includes(':')) {
    const [hStr, mStr] = value.split(':');
    const h = Number(hStr);
    const m = Number(mStr);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return '--';
    return to12h(h, m);
  }
  const sec = Number(value);
  if (!Number.isFinite(sec)) return '--';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return to12h(h, m);
};

/** Format duration fields */
const formatDuration = value => {
  if (isBlankTime(value)) return '--:--';
  if (typeof value === 'string' && value.includes(':')) {
    return value.length === 5 ? `${value}:00` : value;
  }
  const n = Number(value);
  if (!Number.isFinite(n)) return '--:--';
  const h = Math.floor(n / 3600);
  const m = Math.floor((n % 3600) / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/** Build a guaranteed-unique, stable key for FlatList */
const buildKey = (d, idx) => {
  const recId = d.RecId ?? d.RecID ?? d.recId ?? d.ID ?? d.Id ?? d.id ?? '';
  const parts = [
    d.ShiftDate || 'NA',
    d.ShiftCode || 'NA',
    recId || 'noid',
    idx,
  ];
  return String(parts.join('|'));
};

/* ---------- robust normalizers ---------- */
const normalizeDateISO = v => {
  if (!v) return '';
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const m =
    typeof v === 'string' && v.length >= 10 ? moment(v) : moment(parseISO(v));
  if (!m || !m.isValid()) return '';
  return m.local().format('YYYY-MM-DD');
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
            <View style={styles.skeletonDateContainer}>
              <View style={styles.skeletonDate} />
              <View style={styles.skeletonDay} />
            </View>
            <View style={styles.skeletonShiftContainer}>
              <View style={styles.skeletonShiftCode} />
              <View style={styles.skeletonTypeChip} />
            </View>
          </View>
          <View style={styles.skeletonRowGrid}>
            <View style={styles.skeletonCell}>
              <View style={styles.skeletonValue} />
              <View style={styles.skeletonLabel} />
            </View>
            <View style={styles.skeletonCell}>
              <View style={styles.skeletonValue} />
              <View style={styles.skeletonLabel} />
            </View>
            <View style={styles.skeletonCell}>
              <View style={styles.skeletonValue} />
              <View style={styles.skeletonLabel} />
            </View>
          </View>
        </Animated.View>
      ))}
    </View>
  );
};

const RosterDetailsScreen = () => {
  const navigation = useNavigation();
  const {userData} = useSelector(state => state.user || {});
  const [month, setMonth] = useState(moment());
  const [raw, setRaw] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true); // Start with true to show loader immediately
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true); // Track initial load separately
  const [alert, setAlert] = useState({visible: false, text: ''});
  const [detailModal, setDetailModal] = useState({
    visible: false,
    selectedItem: null,
  });

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

        const list = await getRosterDetailsByDate({
          employeeId: userData.employeeId,
          fromDate,
          toDate,
        });

        const arr = normalizeArray(list)
          .filter(Boolean)
          .map((d, idx) => {
            const dt = parseISO(d.ShiftDate);
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
          text: e?.message || 'Failed to load roster details.',
        });
        setRaw([]);
        setInitialLoad(false);
      } finally {
        setLoading(false);
      }
    },
    [userData?.employeeId, fromDate, toDate],
  );

  useEffect(() => {
    if (userData?.employeeId) {
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

  const handleRowPress = useCallback(item => {
    setDetailModal({
      visible: true,
      selectedItem: item,
    });
  }, []);

  const closeDetailModal = useCallback(() => {
    setDetailModal({
      visible: false,
      selectedItem: null,
    });
  }, []);

  // Render loading state
  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <SkeletonLoader />
    </View>
  );

  // Render empty state (only when not loading and no data)
  const renderEmptyState = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>No roster records for this month</Text>
    </View>
  );

  const renderItem = ({item}) => {
    const dateLabel = item.__parsedDate
      ? item.__parsedDate.local().format('ddd, MMM D, YYYY')
      : '--';

    const dayLabel =
      item.ShiftDay ||
      (item.__parsedDate ? item.__parsedDate.local().format('dddd') : '--');

    const isOffDay = item.OffDay === 'Yes' || item.OffDay === 'true';
    const isGazettedDay =
      item.GazettedDay === 'Yes' || item.GazettedDay === 'true';

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleRowPress(item)}
        style={[
          styles.rowCard,
          {
            borderLeftColor: isOffDay
              ? '#FF6B6B'
              : isGazettedDay
              ? '#4ECDC4'
              : '#6ce66c',
            borderLeftWidth: 5,
          },
        ]}>
        {/* header */}
        <View style={styles.cardHeader}>
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{dateLabel}</Text>
            <Text style={styles.dayText}>{dayLabel}</Text>
          </View>
          <View style={styles.shiftCodeContainer}>
            <Text style={styles.shiftCodeText}>{item.ShiftCode || '—'}</Text>
            {(isOffDay || isGazettedDay) && (
              <View
                style={[
                  styles.typeChip,
                  {backgroundColor: isOffDay ? '#FFE5E5' : '#E0F7FA'},
                ]}>
                <Text
                  style={[
                    styles.typeChipText,
                    {color: isOffDay ? '#D32F2F' : '#00796B'},
                  ]}>
                  {isOffDay ? 'Off Day' : 'Gazetted Day'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* values row */}
        <View style={styles.rowGrid}>
          <View style={styles.cell}>
            <Text style={styles.value}>
              {formatShiftTime12h(item.ShiftStartTime)}
            </Text>
            <Text style={styles.label}>Shift Start</Text>
          </View>

          <View style={styles.cell}>
            <Text style={styles.value}>
              {formatShiftTime12h(item.ShiftEndTime)}
            </Text>
            <Text style={styles.label}>Shift End</Text>
          </View>

          <View style={styles.cell}>
            <Text style={styles.value}>{formatDuration(item.ShiftHours)}</Text>
            <Text style={styles.label}>Shift Hours</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDetailModal = () => {
    const item = detailModal.selectedItem;
    if (!item) return null;

    const dateLabel = item.__parsedDate
      ? item.__parsedDate.local().format('dddd, MMMM D, YYYY')
      : '--';

    return (
      <Modal
        visible={detailModal.visible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeDetailModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Roster Details</Text>
              <Text style={styles.modalSubtitle}>{dateLabel}</Text>
            </View>

            <ScrollView style={styles.detailScrollView}>
              {/* Same detail rows as before */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Basic Information</Text>
                <DetailRow label="Shift Code" value={item.ShiftCode} />
                <DetailRow label="Shift Day" value={item.ShiftDay} />
                <DetailRow label="Employee" value={item.EmployeeName} />
                {/* <DetailRow label="Location" value={item.Location} /> */}
                <DetailRow
                  label="Generation Type"
                  value={item.GenerationType}
                />
                <DetailRow label="Type" value={item.Type} />
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Shift Timings</Text>
                <DetailRow
                  label="Start Time"
                  value={formatShiftTime12h(item.ShiftStartTime)}
                />
                <DetailRow
                  label="End Time"
                  value={formatShiftTime12h(item.ShiftEndTime)}
                />
                {/* <DetailRow
                  label="Break Time"
                  value={formatDuration(item.ShiftBreakTime)}
                />
                <DetailRow
                  label="Grace Time"
                  value={formatDuration(item.ShiftGraceTime)}
                /> */}
                <DetailRow
                  label="Shift Hours"
                  value={formatDuration(item.ShiftHours)}
                />
                <DetailRow
                  label="Required Hours"
                  value={formatDuration(item.RequiredWorkingHours)}
                />
                <DetailRow
                  label="Minimum Hours"
                  value={formatDuration(item.MinimumWorkingHour)}
                />
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Flexible Timings</Text>
                <DetailRow
                  label="Clock In Start"
                  value={formatShiftTime12h(item.FlexClockInStartTime)}
                />
                <DetailRow
                  label="Clock In End"
                  value={formatShiftTime12h(item.FlexClockInEndTime)}
                />
                <DetailRow
                  label="Clock Out Start"
                  value={formatShiftTime12h(item.FlexClockOutStartTime)}
                />
                <DetailRow
                  label="Clock Out End"
                  value={formatShiftTime12h(item.FlexClockOutEndTime)}
                />
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Additional Info</Text>
                <DetailRow label="Off Day" value={item.OffDay} />
                <DetailRow label="Gazetted Day" value={item.GazettedDay} />
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeDetailModal}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const DetailRow = ({label, value}) => (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={styles.detailValue}>{value || '--'}</Text>
    </View>
  );

  return (
    <ActionPaneContainer
      pageTitle="Roster Details"
      isBackButton={false}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}>
      <View style={styles.container}>
        <View className="headerRow" style={styles.headerRow}>
          <Text style={styles.title}>Monthly Roster</Text>

          {/* ← SAME FILTER AS ATTENDANCE DETAILS SCREEN */}
          <MonthFilter
            month={month}
            onPrev={() => setMonth(m => moment(m).subtract(1, 'month'))}
            onNext={() => setMonth(m => moment(m).add(1, 'month'))}
          />
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
                  <ActivityIndicator size="small" color="#2196F3" />
                  <Text style={styles.footerLoaderText}>Updating...</Text>
                </View>
              ) : null
            }
          />
        )}
      </View>

      {renderDetailModal()}

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
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    borderLeftWidth: 5,
    borderLeftColor: '#E0E0E0',
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 8,
    marginBottom: 10,
  },
  skeletonDateContainer: {
    flex: 1,
  },
  skeletonDate: {
    height: 16,
    width: 150,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 4,
  },
  skeletonDay: {
    height: 12,
    width: 100,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  skeletonShiftContainer: {
    alignItems: 'flex-end',
  },
  skeletonShiftCode: {
    height: 14,
    width: 80,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 4,
  },
  skeletonTypeChip: {
    height: 16,
    width: 60,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
  },
  skeletonRowGrid: {
    flexDirection: 'row',
    columnGap: 10,
  },
  skeletonCell: {
    flex: 1,
  },
  skeletonValue: {
    height: 18,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 4,
  },
  skeletonLabel: {
    height: 12,
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

  rowCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 8,
    marginBottom: 10,
  },
  dateContainer: {flex: 1},
  dateText: {fontSize: 15, fontWeight: '700', color: '#263238'},
  dayText: {fontSize: 13, color: '#607D8B', marginTop: 2},

  shiftCodeContainer: {alignItems: 'flex-end'},
  shiftCodeText: {fontSize: 14, fontWeight: '700', color: '#2196F3'},

  typeChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  typeChipText: {fontSize: 10, fontWeight: '600'},

  rowGrid: {flexDirection: 'row', columnGap: 10},
  cell: {flex: 1},
  value: {fontSize: 16, fontWeight: '800', color: '#263238'},
  label: {fontSize: 11, color: '#607D8B', marginTop: 2},

  empty: {alignItems: 'center', paddingTop: 36, paddingHorizontal: 12},
  emptyText: {color: '#78909C', fontSize: 16},

  // Detail Modal Styles
  modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.5)'},
  modalContent: {
    flex: 1,
    backgroundColor: 'white',
    marginTop: 60,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#263238',
    marginBottom: 4,
  },
  modalSubtitle: {fontSize: 16, color: '#607D8B', textAlign: 'center'},
  detailScrollView: {flex: 1},
  detailSection: {marginBottom: 24},
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#263238',
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  detailLabel: {
    fontSize: 14,
    color: '#607D8B',
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#263238',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  closeButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {color: 'white', fontSize: 16, fontWeight: '600'},
});

export default RosterDetailsScreen;
