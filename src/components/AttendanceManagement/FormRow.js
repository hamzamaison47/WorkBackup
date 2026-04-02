/* eslint-disable react-native/no-inline-styles */
// ─────────────────────────────────────────────
// components/AttendanceManagement/FormRow.js
// ─────────────────────────────────────────────
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import {C, R} from './theme';

export const OptionRow = ({icon, label, onPress}) => (
  <>
    <TouchableOpacity style={S.row} onPress={onPress} activeOpacity={0.7}>
      <View style={S.iconWrap}>
        <Text style={S.icon}>{icon}</Text>
      </View>
      <Text style={S.label}>{label}</Text>
      {onPress && <Text style={S.arrow}>›</Text>}
    </TouchableOpacity>
    <View style={S.divider} />
  </>
);

export const NoteRow = ({value, onChangeText}) => (
  <>
    <View style={S.row}>
      <View style={S.iconWrap}>
        <Text style={S.icon}>≡</Text>
      </View>
      <TextInput
        style={[S.label, {flex: 1, padding: 0}]}
        placeholder="Add a note…"
        placeholderTextColor={C.inkFaint}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
    <View style={S.divider} />
  </>
);

export const CheckboxRow = ({checked, onToggle, label}) => (
  <TouchableOpacity style={S.checkRow} onPress={onToggle} activeOpacity={0.7}>
    <View style={[S.checkbox, checked && S.checkboxOn]}>
      {checked && <Text style={S.checkmark}>✓</Text>}
    </View>
    <Text style={S.checkLabel}>{label}</Text>
  </TouchableOpacity>
);

const S = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    gap: 12,
  },
  iconWrap: {width: 28, alignItems: 'center'},
  icon: {fontSize: 18, color: C.inkMuted},
  label: {flex: 1, fontSize: 15, color: C.inkSub},
  arrow: {fontSize: 20, color: C.inkFaint},
  divider: {height: 1, backgroundColor: C.border},

  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: R.xs,
    borderWidth: 2,
    borderColor: C.borderMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {backgroundColor: C.amber, borderColor: C.amber},
  checkmark: {color: C.white, fontSize: 13, fontWeight: '700'},
  checkLabel: {fontSize: 15, color: C.ink, fontWeight: '500'},
});
