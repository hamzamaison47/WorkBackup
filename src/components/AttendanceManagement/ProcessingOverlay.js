import React, {useMemo} from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import useAttendanceTheme from './useAttendanceTheme';

const ProcessingOverlay = ({label = 'Processing...'}) => {
  const {C, R, Sh, isDark} = useAttendanceTheme();
  const S = useMemo(() => makeStyles(C, R, Sh, isDark), [C, R, Sh, isDark]);
  return (
    <View style={S.overlay} pointerEvents="auto">
      <View style={S.container}>
        <ActivityIndicator size="large" color={C.blueDark} />
        <Text style={S.text}>{label}</Text>
      </View>
    </View>
  );
};

export default ProcessingOverlay;

const makeStyles = (C, R, Sh, isDark) =>
  StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      // scrim follows theme so we don't flash a light veil over dark content
      backgroundColor: isDark ? 'rgba(11,18,32,0.9)' : 'rgba(240,244,248,0.9)',
      zIndex: 999,
    },
    container: {
      alignItems: 'center',
      backgroundColor: C.surface,
      paddingHorizontal: 36,
      paddingVertical: 28,
      borderRadius: R.lg,
      gap: 14,
      ...Sh.lg,
    },
    text: {
      fontSize: 15,
      color: C.inkSub,
      fontWeight: '600',
    },
  });
