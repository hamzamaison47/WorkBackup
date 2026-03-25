/**
 * AnimatedRow.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Row-level entrance animation. Fades in + slides up.
 *
 * USE FOR: modal menus, small lists where each row should stagger in.
 * DO NOT USE for FlatList — causes performance issues at scale.
 *
 * Props:
 *   children  — row content
 *   delay     — ms before animation starts
 *   style     — override
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, {useRef, useEffect} from 'react';
import {Animated} from 'react-native';
import {ROW_FADE_DUR, ROW_SLIDE_DUR} from './Tokens';

const AnimatedRow = ({children, delay = 0, style}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: ROW_FADE_DUR,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: ROW_SLIDE_DUR,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, delay]);

  return (
    <Animated.View style={[{opacity, transform: [{translateY}]}, style]}>
      {children}
    </Animated.View>
  );
};

export default AnimatedRow;
