/* eslint-disable react-native/no-inline-styles */
// ─────────────────────────────────────────────
// components/ActionButtons.js
// Clock in / break / clock out buttons
//
// CHANGED: "Add Hours" button removed from all statuses.
// ─────────────────────────────────────────────
import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';

const ActionButtons = ({
  status,
  onClockIn,
  onBreakStart,
  onBreakEnd,
  onClockOut,
}) => {
  return (
    <View style={styles.container}>
      {status === 'out' && (
        <TouchableOpacity style={styles.clockInBtn} onPress={onClockIn}>
          <Text style={styles.clockInBtnText}>▶ Clock In</Text>
        </TouchableOpacity>
      )}

      {status === 'in' && (
        <>
          {/* <TouchableOpacity style={styles.switchBtn}>
            <Text style={styles.switchBtnText}>⇄ Switch activity</Text>
          </TouchableOpacity> */}
          <TouchableOpacity style={styles.breakBtn} onPress={onBreakStart}>
            <Text style={styles.breakBtnText}>☕ Start break</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.clockOutBtn} onPress={onClockOut}>
            <Text style={styles.clockOutBtnText}>■ Clock out</Text>
          </TouchableOpacity>
        </>
      )}

      {status === 'break' && (
        <>
          <TouchableOpacity
            style={[styles.clockInBtn, {backgroundColor: '#E8890C'}]}
            onPress={onBreakEnd}>
            <Text style={styles.clockInBtnText}>▶ End Break</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.clockOutBtn} onPress={onClockOut}>
            <Text style={styles.clockOutBtnText}>■ Clock out</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

export default ActionButtons;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 10,
  },
  clockInBtn: {
    backgroundColor: '#27ae60',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
  },
  clockInBtnText: {color: '#fff', fontSize: 16, fontWeight: '700'},

  switchBtn: {
    backgroundColor: '#27ae60',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
  },
  switchBtnText: {color: '#fff', fontSize: 16, fontWeight: '700'},

  breakBtn: {
    backgroundColor: '#E8890C',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
  },
  breakBtnText: {color: '#fff', fontSize: 16, fontWeight: '700'},

  clockOutBtn: {
    backgroundColor: '#e74c3c',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
  },
  clockOutBtnText: {color: '#fff', fontSize: 16, fontWeight: '700'},
});
