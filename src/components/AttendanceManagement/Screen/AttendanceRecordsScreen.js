/* eslint-disable curly */
/* eslint-disable react-native/no-inline-styles */
// ─────────────────────────────────────────────
// components/AttendanceManagement/screens/AttendanceRecordsScreen.js
// ─────────────────────────────────────────────
import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {useSelector} from 'react-redux';
import {
  loadRecords,
  formatDuration,
} from '../../../screens/AttendanceManagement/helpers';
import DeleteAttendanceRecord from '../../../API/AttendanceManagement/DeleteAttendanceRecord';
import RecordCard from '../RecordCard';
import NavigationFAB from '../NavigationFAB';
import {C, R, Sh} from '../theme';

const AttendanceRecordsScreen = ({onNavigate}) => {
  const {userData} = useSelector(s => s.user);
  const person = userData?.Person;

  const [records, setRecords] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(null); // RecId currently being deleted

  const load = useCallback(async () => {
    const r = await loadRecords({person});
    setRecords([...r].reverse());
  }, [person]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleDelete = useCallback(
    recId => {
      // recId may be a string ("offline_…") for unsynced offline records
      const isOffline =
        typeof recId === 'string' && recId.startsWith('offline_');

      Alert.alert(
        'Delete Record',
        isOffline
          ? 'This punch is still pending sync. Deleting it will remove it from the offline queue.'
          : 'Delete this attendance record from the server?',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              if (isOffline) {
                // For offline records we just reload (the enqueue id is not a server RecId)
                await load();
                return;
              }
              try {
                setDeleting(recId);
                await DeleteAttendanceRecord({recId: [recId]});
                // Reload from server so the list is authoritative
                await load();
              } catch (err) {
                Alert.alert(
                  'Delete Failed',
                  err.message || 'Could not delete record. Please try again.',
                );
              } finally {
                setDeleting(null);
              }
            },
          },
        ],
      );
    },
    [load],
  );

  const weeklyTotal = () => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    let total = 0;
    records.forEach(r => {
      if (new Date(r.clockIn) >= weekStart && r.clockOut) {
        let worked = new Date(r.clockOut) - new Date(r.clockIn);
        (r.breaks || []).forEach(b => {
          if (b.breakStart && b.breakEnd)
            worked -= new Date(b.breakEnd) - new Date(b.breakStart);
        });
        total += worked;
      }
    });
    return formatDuration(total);
  };

  const completedCount = records.filter(r => r.clockOut).length;
  const isAnyone = records.some(r => !r.clockOut);

  return (
    <SafeAreaView style={S.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* Header */}
      <View style={S.header}>
        <Text style={S.headerTitle}>Timesheets</Text>
        <TouchableOpacity onPress={onRefresh} disabled={refreshing}>
          <Text style={S.refreshBtn}>{refreshing ? '…' : '↻ Refresh'}</Text>
        </TouchableOpacity>
      </View>

      {/* Summary strip */}
      <View style={S.summary}>
        <View style={S.summaryItem}>
          <Text style={S.summaryVal}>{completedCount}</Text>
          <Text style={S.summaryLbl}>Sessions</Text>
        </View>
        <View style={S.summaryDivider} />
        <View style={S.summaryItem}>
          <Text style={S.summaryVal}>{weeklyTotal()}</Text>
          <Text style={S.summaryLbl}>This Week</Text>
        </View>
        <View style={S.summaryDivider} />
        <View style={S.summaryItem}>
          <Text style={[S.summaryVal, {fontSize: 22}]}>
            {isAnyone ? '🟢' : '⚪'}
          </Text>
          <Text style={S.summaryLbl}>Status</Text>
        </View>
      </View>

      {/* Deleting indicator */}
      {deleting !== null && (
        <View style={S.deletingBanner}>
          <ActivityIndicator size="small" color={C.redMid} />
          <Text style={S.deletingTxt}>Deleting record…</Text>
        </View>
      )}

      {/* List or empty state */}
      {records.length === 0 ? (
        <View style={S.empty}>
          <Text style={S.emptyEmoji}>📋</Text>
          <Text style={S.emptyTitle}>No records yet</Text>
          <Text style={S.emptySub}>
            Clock in to start tracking your attendance
          </Text>
          <TouchableOpacity
            style={S.emptyBtn}
            onPress={() => onNavigate('TimeClock')}>
            <Text style={S.emptyBtnTxt}>Go to Time Clock</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={item => String(item.id ?? item.RecId)}
          renderItem={({item}) => (
            <RecordCard
              item={item}
              onDelete={handleDelete}
              isDeleting={deleting === item.RecId}
            />
          )}
          contentContainerStyle={S.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={C.blue}
              colors={[C.blue]}
            />
          }
        />
      )}

      <NavigationFAB activeScreen="Records" onNavigate={onNavigate} />
    </SafeAreaView>
  );
};

export default AttendanceRecordsScreen;

const S = StyleSheet.create({
  screen: {flex: 1, backgroundColor: C.bg},

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerTitle: {fontSize: 20, fontWeight: '800', color: C.ink},
  refreshBtn: {fontSize: 13, color: C.blue, fontWeight: '600'},

  summary: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: R.md,
    ...Sh.xs,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  summaryItem: {flex: 1, alignItems: 'center', paddingVertical: 14},
  summaryVal: {fontSize: 22, fontWeight: '700', color: C.amber},
  summaryLbl: {
    fontSize: 11,
    color: C.inkMuted,
    marginTop: 3,
    fontWeight: '500',
  },
  summaryDivider: {width: 1, backgroundColor: C.border},

  deletingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 10,
    padding: 10,
    backgroundColor: '#FEE2E2',
    borderRadius: R.sm,
    borderWidth: 1,
    borderColor: C.redMid,
  },
  deletingTxt: {fontSize: 13, color: C.redDark, fontWeight: '500'},

  list: {padding: 16, paddingBottom: 100},
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
    paddingHorizontal: 32,
  },
  emptyEmoji: {fontSize: 52, marginBottom: 16},
  emptyTitle: {fontSize: 18, fontWeight: '700', color: C.ink, marginBottom: 6},
  emptySub: {
    fontSize: 14,
    color: C.inkMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyBtn: {
    backgroundColor: C.blue,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: R.full,
    ...Sh.sm,
  },
  emptyBtnTxt: {color: C.white, fontWeight: '700', fontSize: 14},
});
