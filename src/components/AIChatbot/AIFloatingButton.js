// components/AIChatbot/AIFloatingButton.js
//
// Pulsing floating button to open the AI chat modal.
// Place it outside any ScrollView so it stays fixed on screen.

import React, {useEffect, useRef} from 'react';
import {TouchableOpacity, Text, StyleSheet, Animated, View} from 'react-native';

const AIFloatingButton = ({onPress}) => {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.15,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulse]);

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      {/* Pulse ring */}
      <Animated.View
        style={[styles.ring, {transform: [{scale: pulse}]}]}
        pointerEvents="none"
      />
      <TouchableOpacity
        style={styles.btn}
        onPress={onPress}
        activeOpacity={0.85}>
        <Text style={styles.icon}>🤖</Text>
      </TouchableOpacity>
    </View>
  );
};

const BTN_SIZE = 56;

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 90, // above tab bar — adjust to your layout
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  ring: {
    position: 'absolute',
    width: BTN_SIZE + 16,
    height: BTN_SIZE + 16,
    borderRadius: (BTN_SIZE + 16) / 2,
    backgroundColor: 'rgba(26, 86, 219, 0.2)',
  },
  btn: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: BTN_SIZE / 2,
    backgroundColor: '#1A56DB',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#1A56DB',
    shadowOpacity: 0.45,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 4},
  },
  icon: {fontSize: 26},
});

export default AIFloatingButton;
