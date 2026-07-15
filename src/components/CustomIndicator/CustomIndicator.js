/* eslint-disable curly */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useEffect, useRef} from 'react';
import {View, Animated, Dimensions} from 'react-native';
import styles from '../../styles/styles';
import usePalette from '../../hooks/usePalette';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

const CustomIndicator = ({
  dotCount = 3,
  animationDuration = 1000,
  dotColor,
  dotSize = screenWidth * 0.025,
  spacing = screenWidth * 0.02,
  containerHeight = screenHeight * 0.05,
}) => {
  const P = usePalette();
  const resolvedDotColor = dotColor || P.primary;

  // Store animations in refs to persist between renders
  const animationsRef = useRef([]);
  const animationLoopsRef = useRef([]);

  // Initialize animations on first render
  if (animationsRef.current.length === 0) {
    for (let i = 0; i < dotCount; i++) {
      animationsRef.current.push({
        scale: new Animated.Value(1),
        opacity: new Animated.Value(0.4),
      });
    }
  }

  useEffect(() => {
    // Clear any existing animations
    animationLoopsRef.current.forEach(loop => {
      if (loop) loop.stop();
    });
    animationLoopsRef.current = [];

    // Create staggered animations
    const animationsArray = animationsRef.current.map((anim, index) => {
      // Create the animation sequence
      const animationSequence = Animated.loop(
        Animated.sequence([
          // Scale up and fade in
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
          // Scale down and fade out
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

      // Start with a delay for each dot
      setTimeout(() => {
        animationSequence.start();
      }, index * (animationDuration / 3)); // Better spacing: divide by 3 instead of dotCount

      return animationSequence;
    });

    // Store animation loops for cleanup
    animationLoopsRef.current = animationsArray;

    // Cleanup function
    return () => {
      animationsArray.forEach((anim, index) => {
        if (anim) {
          anim.stop();
          // Reset animation values
          animationsRef.current[index].scale.setValue(1);
          animationsRef.current[index].opacity.setValue(0.4);
        }
      });
    };
  }, [dotCount, animationDuration]);

  return (
    <View style={styles.CustomIndicator_container}>
      <View
        style={[
          styles.CustomIndicator_innerContainer,
          {height: containerHeight},
        ]}>
        {animationsRef.current.map((anim, index) => (
          <Animated.View
            key={`dot-${index}`}
            style={{
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              marginHorizontal: spacing / 2,
              backgroundColor: resolvedDotColor,
              transform: [{scale: anim.scale}],
              opacity: anim.opacity,
            }}
          />
        ))}
      </View>
    </View>
  );
};

export default CustomIndicator;
