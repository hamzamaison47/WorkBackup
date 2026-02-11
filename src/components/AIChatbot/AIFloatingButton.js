/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useRef} from 'react';
import {TouchableOpacity, Dimensions, Animated, Text} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from '../../styles/styles';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

const AIFloatingButton = ({onPress, scrollY, hasLeaveData = true}) => {
  const animation = useRef(new Animated.Value(0)).current;

  // Dynamic offset calculation based on whether leave data is visible
  const getOffset = () => {
    // When leave data is visible, use the original offset (280)
    // When leave data is hidden, reduce the offset since there's less content
    return hasLeaveData ? 280 : 180;
  };

  const getExpansionDistance = () => {
    return hasLeaveData ? 80 : 60;
  };

  useEffect(() => {
    const offset = getOffset();
    const expansionDistance = getExpansionDistance();

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
  }, [scrollY, hasLeaveData]);

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
        styles.AIFloat_container,
        {
          position: 'absolute',
          bottom: 10,
          right: animatedRight,
          width: animatedWidth,
          height: animatedHeight,
          borderRadius: animatedBorderRadius,
        },
      ]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={styles.AIFloat_button}>
        <Icon name="robot-excited" size={24} color="#fff" />

        <Animated.View
          style={{
            width: textWidth,
            opacity: textOpacity,
            marginLeft: textMarginLeft,
            overflow: 'hidden',
          }}>
          <Text style={styles.AIFloat_text} numberOfLines={1}>
            Ask AI Assistant
          </Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default AIFloatingButton;
