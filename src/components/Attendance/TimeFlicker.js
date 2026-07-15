/* eslint-disable curly */
/* eslint-disable react-native/no-inline-styles */
import React, {useMemo, useState} from 'react';
import {Platform, View, Text, TouchableOpacity} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/FontAwesome';
import usePalette from '../../hooks/usePalette';

/* ---------- helpers ---------- */
const p2 = n => String(n).padStart(2, '0');

// "YYYY-MM-DD" <-> Date
const parseDate = ymd => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(ymd || ''))) return new Date();
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date();
  dt.setFullYear(y, m - 1, d);
  dt.setHours(12, 0, 0, 0);
  return dt;
};
const toYYYYMMDD = d =>
  `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;

// 24h "HH:mm" <-> Date
const parseTime24 = hhmm => {
  const d = new Date();
  if (!/^\d{2}:\d{2}$/.test(String(hhmm || ''))) {
    d.setHours(9, 0, 0, 0);
    return d;
  }
  const [h, m] = hhmm.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d;
};
const toTime24 = d => `${p2(d.getHours())}:${p2(d.getMinutes())}`;

// Display 12h label
const toTime12Label = hhmm24 => {
  if (!/^\d{2}:\d{2}$/.test(String(hhmm24 || ''))) return 'Select time';
  let [hh, mm] = hhmm24.split(':').map(Number);
  const ampm = hh >= 12 ? 'PM' : 'AM';
  let h12 = hh % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${p2(mm)} ${ampm}`;
};

/**
 * Props:
 *  - mode: 'date' | 'time'
 *  - label: string
 *  - value: string  (date -> 'YYYY-MM-DD', time -> 'HH:mm' 24h)
 *  - onChange: (newStr) => void   (returns date as 'YYYY-MM-DD' or time as 'HH:mm' 24h)
 *  - presets?: string[]           (time presets in 24h 'HH:mm'; for date, presets are ignored)
 */
// const TimeFlicker = ({mode = 'date', label, value, onChange, presets = []}) => {
const TimeFlicker = ({
  mode = 'date',
  label,
  value,
  onChange,
  presets = [],
  disabled = false,
}) => {
  const [visible, setVisible] = useState(false);
  const P = usePalette();

  const seed = useMemo(() => {
    return mode === 'date' ? parseDate(value) : parseTime24(value);
  }, [mode, value]);

  const display = useMemo(() => {
    if (mode === 'date') return value || 'Select date';
    return toTime12Label(value);
  }, [mode, value]);

  const onPicked = (event, selectedDate) => {
    if (Platform.OS === 'android') setVisible(false);
    if (event?.type === 'dismissed') return;

    const dt = selectedDate || seed;
    const newVal = mode === 'date' ? toYYYYMMDD(dt) : toTime24(dt);
    onChange?.(newVal);
  };

  return (
    <View style={{marginTop: 10}}>
      {label ? (
        <Text
          style={{
            fontSize: 13,
            marginBottom: 6,
            color: '#37474F',
            fontWeight: '600',
          }}>
          {label}
        </Text>
      ) : null}

      {/* <TouchableOpacity
        onPress={() => setVisible(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderWidth: 1,
          borderColor: '#D0D7DE',
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 13,
          backgroundColor: '#FFFFFF',
        }}> */}
      <TouchableOpacity
        disabled={disabled}
        onPress={() => !disabled && setVisible(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderWidth: 1,
          borderColor: '#D0D7DE',
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 13,
          backgroundColor: disabled ? '#F0F0F0' : '#FFFFFF',
          opacity: disabled ? 0.6 : 1,
        }}>
        <Text style={{fontSize: 15, color: '#0E1521', fontWeight: '600'}}>
          {display}
        </Text>
        <Icon
          name={mode === 'date' ? 'calendar' : 'clock-o'}
          size={18}
          color={P.primary}
        />
      </TouchableOpacity>

      {/* time presets as 12h chips */}
      {mode === 'time' && presets?.length ? (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
            marginTop: 8,
          }}>
          {presets.map(val => (
            <TouchableOpacity
              key={`t-${val}`}
              onPress={() => onChange?.(val)} // keep internal 24h; label shows 12h
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: '#D0D7DE',
                backgroundColor: '#FFF',
                marginRight: 8,
                marginBottom: 8,
              }}>
              <Text style={{fontSize: 12, color: '#0E1521'}}>
                {toTime12Label(val)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {visible && (
        <DateTimePicker
          value={seed}
          mode={mode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          is24Hour={mode === 'time' ? false : undefined} // <- force 12h UI for time
          onChange={onPicked}
        />
      )}
    </View>
  );
};

export default TimeFlicker;
