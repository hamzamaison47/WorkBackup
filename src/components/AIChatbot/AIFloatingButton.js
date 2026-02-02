/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useRef} from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Text,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

const AIFloatingButton = ({onPress, scrollY}) => {
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const offset = 280;
    const expansionDistance = 80;

    const listener = scrollY.addListener(({value}) => {
      if (value <= offset) {
        animation.setValue(0);
      } else {
        const progress = (value - offset) / expansionDistance;
        const animatedValue = Math.min(Math.max(progress, 0), 1);
        animation.setValue(animatedValue);
      }
    });

    return () => {
      scrollY.removeListener(listener);
    };
  }, [scrollY]);

  const compactWidth = 56;
  const wideWidth = SCREEN_WIDTH - 32;

  // Use interpolation but don't apply to style directly
  const animatedWidth = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [compactWidth, wideWidth],
    extrapolate: 'clamp',
  });

  const animatedHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [56, 64],
    extrapolate: 'clamp',
  });

  const animatedRight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [16, (SCREEN_WIDTH - wideWidth) / 2],
    extrapolate: 'clamp',
  });

  const animatedBorderRadius = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [28, 16],
    extrapolate: 'clamp',
  });

  const textOpacity = animation.interpolate({
    inputRange: [0, 0.5],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const textWidth = animation.interpolate({
    inputRange: [0, 0.5],
    outputRange: [0, 130],
    extrapolate: 'clamp',
  });

  const textMarginLeft = animation.interpolate({
    inputRange: [0, 0.5],
    outputRange: [0, 8],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          position: 'absolute',
          bottom: 24,
          right: animatedRight,
          width: animatedWidth,
          height: animatedHeight,
          borderRadius: animatedBorderRadius,
        },
      ]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={styles.button}>
        <Icon name="robot-excited" size={24} color="#fff" />

        <Animated.View
          style={{
            width: textWidth,
            opacity: textOpacity,
            marginLeft: textMarginLeft,
            overflow: 'hidden',
          }}>
          <Text style={styles.text} numberOfLines={1}>
            Ask AI Assistant
          </Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0066ff',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default AIFloatingButton;
