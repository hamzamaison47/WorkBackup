/* eslint-disable react-native/no-inline-styles */
// ─────────────────────────────────────────────
// components/StatusCard.js  — original, unchanged
// ─────────────────────────────────────────────
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {
  formatTime,
  formatDateShort,
  formatElapsed,
} from '../../screens/AttendanceManagement/helpers';

const StatusCard = ({status, elapsed, clockInTime, lastOut, locationLabel}) => {
  return (
    <View style={styles.card}>
      {/* Time row */}
      <View style={styles.row}>
        <View style={styles.clockIcon}>
          <View style={styles.clockFaceSmall} />
        </View>
        {status === 'out' && (
          <Text style={styles.text}>
            {lastOut
              ? `Last out: ${formatTime(lastOut)} ${formatDateShort(lastOut)}`
              : 'Not clocked in yet'}
          </Text>
        )}
        {status === 'in' && (
          <>
            <Text style={[styles.text, styles.elapsed]}>
              {formatElapsed(elapsed)}
            </Text>
            <Text style={styles.clockInTime}>{formatTime(clockInTime)} →</Text>
          </>
        )}
        {status === 'break' && (
          <Text style={[styles.text, styles.onBreak]}>On Break ☕</Text>
        )}
      </View>

      {/* Location row */}
      <View style={styles.row}>
        <Text style={styles.pinIcon}>📍</Text>
        <Text style={[styles.text, {marginLeft: 6}]}>
          {locationLabel ?? 'Location not detected'}
        </Text>
      </View>
    </View>
  );
};

export default StatusCard;

const styles = StyleSheet.create({
  card: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  row: {flexDirection: 'row', alignItems: 'center', paddingVertical: 6},
  clockIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#999',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockFaceSmall: {
    width: 2,
    height: 6,
    backgroundColor: '#999',
    marginBottom: -2,
  },
  text: {marginLeft: 10, fontSize: 14, color: '#666'},
  elapsed: {color: '#27ae60', fontWeight: '700', fontSize: 20, flex: 1},
  clockInTime: {color: '#27ae60', fontSize: 13},
  onBreak: {color: '#E8890C', fontWeight: '700', fontSize: 16},
  pinIcon: {fontSize: 16},
});
