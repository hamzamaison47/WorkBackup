/* eslint-disable react-native/no-inline-styles */
/* eslint-disable curly */
// ─────────────────────────────────────────────
// components/AttendanceManagement/RecordCard.js
// ─────────────────────────────────────────────
import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {
  formatDate,
  formatTime,
  formatDuration,
} from '../../screens/AttendanceManagement/helpers';
import {C, R, Sh} from './theme';

const RecordCard = ({item, onDelete, isDeleting = false}) => {
  const getWorkedMs = () => {
    if (!item.clockIn || !item.clockOut) return null;
    let worked = new Date(item.clockOut) - new Date(item.clockIn);
    (item.breaks || []).forEach(b => {
      if (b.breakStart && b.breakEnd)
        worked -= new Date(b.breakEnd) - new Date(b.breakStart);
    });
    return worked;
  };

  const isActive = !item.clockOut;
  const worked = getWorkedMs();
  const breakCount = (item.breaks || []).filter(b => b.breakEnd).length;

  return (
    <View style={[S.card, isDeleting && {opacity: 0.5}]}>
      {/* Header row */}
      <View style={S.header}>
        <View style={{flex: 1}}>
          <Text style={S.date}>{formatDate(item.clockIn)}</Text>
          <View style={[S.badge, isActive ? S.badgeActive : S.badgeDone]}>
            <View
              style={[
                S.badgeDot,
                {backgroundColor: isActive ? C.greenMid : C.blue},
              ]}
            />
            <Text
              style={[
                S.badgeTxt,
                {color: isActive ? C.greenDark : C.blueDark},
              ]}>
              {isActive ? 'Active' : 'Complete'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => onDelete(item.RecId ?? item.id)}
          style={S.deleteBtn}
          disabled={isDeleting}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <Text style={S.deleteTxt}>{isDeleting ? '⏳' : '🗑'}</Text>
        </TouchableOpacity>
      </View>

      {/* Stats row */}
      <View style={S.stats}>
        <View style={S.stat}>
          <Text style={S.statLabel}>Clock In</Text>
          <Text style={S.statValue}>{formatTime(item.clockIn)}</Text>
        </View>
        <View style={S.statDivider} />
        <View style={S.stat}>
          <Text style={S.statLabel}>Clock Out</Text>
          <Text style={S.statValue}>
            {item.clockOut ? formatTime(item.clockOut) : '—'}
          </Text>
        </View>
        <View style={S.statDivider} />
        <View style={S.stat}>
          <Text style={S.statLabel}>Duration</Text>
          <Text style={[S.statValue, {color: C.greenDark}]}>
            {worked ? formatDuration(worked) : '—'}
          </Text>
        </View>
      </View>

      {/* Footer tags */}
      {(breakCount > 0 || item.note) && (
        <View style={S.tags}>
          {breakCount > 0 && (
            <View style={S.tag}>
              <Text style={S.tagTxt}>
                ☕ {breakCount} break{breakCount > 1 ? 's' : ''}
              </Text>
            </View>
          )}
          {item.note && (
            <View style={[S.tag, {backgroundColor: C.blueLight}]}>
              <Text style={[S.tagTxt, {color: C.blueDark}]}>
                📝 {item.note}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default RecordCard;

const S = StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    borderRadius: R.md,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
    ...Sh.xs,
  },
  header: {flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12},
  date: {fontSize: 15, fontWeight: '700', color: C.ink, marginBottom: 5},
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: R.full,
    gap: 5,
  },
  badgeActive: {backgroundColor: C.greenLight},
  badgeDone: {backgroundColor: C.blueLight},
  badgeDot: {width: 6, height: 6, borderRadius: 3},
  badgeTxt: {fontSize: 11, fontWeight: '600'},
  deleteBtn: {},
  deleteTxt: {fontSize: 18},

  stats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 10,
  },
  stat: {flex: 1, alignItems: 'center'},
  statLabel: {
    fontSize: 10,
    color: C.inkFaint,
    marginBottom: 4,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {fontSize: 15, fontWeight: '700', color: C.ink},
  statDivider: {width: 1, backgroundColor: C.border},

  tags: {flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10},
  tag: {
    backgroundColor: C.amberLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: R.full,
  },
  tagTxt: {fontSize: 11, color: C.amberDark, fontWeight: '500'},
});
