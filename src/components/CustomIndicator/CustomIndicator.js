/* eslint-disable react-hooks/exhaustive-deps */
import React, {useEffect} from 'react';
import {View, StyleSheet, Animated, Dimensions} from 'react-native';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

const CustomIndicator = ({
  dotCount = 3,
  animationDuration = 1000,
  dotColor = '#0A66C2',
  dotSize = screenWidth * 0.025,
  spacing = screenWidth * 0.02,
  containerHeight = screenHeight * 0.05,
}) => {
  const animations = Array.from({length: dotCount}).map(() => ({
    scale: new Animated.Value(1),
    opacity: new Animated.Value(0.4),
  }));

  useEffect(() => {
    const animationsArray = animations.map(anim => {
      return Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(anim.scale, {
              toValue: 1.6,
              duration: animationDuration / 2,
              useNativeDriver: true,
            }),
            Animated.timing(anim.opacity, {
              toValue: 1,
              duration: animationDuration / 2,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(anim.scale, {
              toValue: 1,
              duration: animationDuration / 2,
              useNativeDriver: true,
            }),
            Animated.timing(anim.opacity, {
              toValue: 0.4,
              duration: animationDuration / 2,
              useNativeDriver: true,
            }),
          ]),
        ]),
      );
    });

    animationsArray.forEach((anim, index) => {
      setTimeout(() => anim.start(), index * (animationDuration / dotCount));
    });

    return () => {
      animationsArray.forEach(anim => anim.stop());
    };
  }, []);

  return (
    <View style={[styles.container, {height: containerHeight}]}>
      {animations.map((anim, index) => (
        <Animated.View
          key={index}
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            marginHorizontal: spacing / 2,
            backgroundColor: dotColor,
            transform: [{scale: anim.scale}],
            opacity: anim.opacity,
          }}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CustomIndicator;
