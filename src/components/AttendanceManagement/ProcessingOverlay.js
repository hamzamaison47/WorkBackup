import React from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import {C, R, Sh} from './theme';

const ProcessingOverlay = ({label = 'Processing...'}) => {
  return (
    <View style={S.overlay} pointerEvents="auto">
      <View style={S.container}>
        <ActivityIndicator size="large" color={C.blue} />
        <Text style={S.text}>{label}</Text>
      </View>
    </View>
  );
};

export default ProcessingOverlay;

const S = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(240,244,248,0.9)',
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
