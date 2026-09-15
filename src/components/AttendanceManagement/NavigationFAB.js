// ─────────────────────────────────────────────
// components/AttendanceManagement/NavigationFAB.js
// ─────────────────────────────────────────────
import React, {useState, useRef, useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  StyleSheet,
  Platform,
} from 'react-native';
import useAttendanceTheme from './useAttendanceTheme';

const NAV_ITEMS = [
  // Home and Timesheets (Records) disabled — Time Clock is the only screen.
  // {key: 'Home', label: 'Home', icon: '🏢'},
  {key: 'TimeClock', label: 'Time Clock', icon: '🕛'},
  // {key: 'Records', label: 'Timesheets', icon: '📃'},
];

const NavigationFAB = ({activeScreen, onNavigate}) => {
  const {C, R, Sh} = useAttendanceTheme();
  const S = useMemo(() => makeStyles(C, R, Sh), [C, R, Sh]);
  const [open, setOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    Animated.spring(anim, {
      toValue: open ? 0 : 1,
      useNativeDriver: true,
      friction: 6,
      tension: 80,
    }).start();
    setOpen(v => !v);
  };

  const handleNav = key => {
    Animated.timing(anim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
    setOpen(false);
    onNavigate(key);
  };

  const fabRot = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  return (
    <>
      {open && (
        <TouchableWithoutFeedback onPress={toggle}>
          <View style={S.backdrop} />
        </TouchableWithoutFeedback>
      )}
      <View style={S.container} pointerEvents="box-none">
        {open && (
          <View style={S.menu}>
            {[...NAV_ITEMS].reverse().map(item => {
              const translateY = anim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              });
              const opacity = anim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 0, 1],
              });
              const isActive = activeScreen === item.key;
              return (
                <Animated.View
                  key={item.key}
                  style={[S.menuRow, {opacity, transform: [{translateY}]}]}>
                  <View style={[S.label, isActive && S.labelActive]}>
                    <Text style={[S.labelTxt, isActive && S.labelTxtActive]}>
                      {item.label}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[S.menuBtn, isActive && S.menuBtnActive]}
                    onPress={() => handleNav(item.key)}
                    activeOpacity={0.8}>
                    <Text style={S.menuBtnIcon}>{item.icon}</Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        )}
        <TouchableOpacity
          style={[S.fab, open && S.fabOpen]}
          onPress={toggle}
          activeOpacity={0.85}>
          <Animated.Text style={[S.fabIcon, {transform: [{rotate: fabRot}]}]}>
            {open ? '✕' : '☰'}
          </Animated.Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

export default NavigationFAB;

const makeStyles = (C, R, Sh) =>
  StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(15,23,42,0.3)',
      zIndex: 90,
    },
    container: {
      position: 'absolute',
      bottom: Platform.OS === 'ios' ? 36 : 24,
      right: 20,
      alignItems: 'flex-end',
      zIndex: 100,
    },
    fab: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: C.blue,
      alignItems: 'center',
      justifyContent: 'center',
      ...Sh.lg,
    },
    fabOpen: {backgroundColor: C.redMid},
    fabIcon: {fontSize: 20, color: C.onBlue, fontWeight: '700'}, // icon on the brand fab
    menu: {alignItems: 'flex-end', marginBottom: 12, gap: 10},
    menuRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
    label: {
      backgroundColor: C.surface, // pill surface → theme-aware
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: R.full,
      ...Sh.sm,
    },
    labelActive: {backgroundColor: C.blue},
    labelTxt: {fontSize: 13, fontWeight: '600', color: C.inkSub},
    labelTxtActive: {color: C.onBlue}, // text on the active brand label
    menuBtn: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: C.surface, // button surface → theme-aware
      alignItems: 'center',
      justifyContent: 'center',
      ...Sh.sm,
    },
    menuBtnActive: {backgroundColor: C.blue},
    menuBtnIcon: {fontSize: 20},
  });
