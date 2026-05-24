import React, {useRef, useEffect} from 'react';
import {View, Animated} from 'react-native';
import useAppTokens from './useAppTokens';
import {
  CARD_TRANSLATE_START,
  CARD_FADE_DUR,
  CARD_SPRING_SPEED,
  CARD_SPRING_BOUNCE,
} from './Tokens';
import {
  conditionalScale,
  conditionalVerticalScale,
} from '../../store/utils/scaling';

export const AnimatedCard = ({children, delay = 0, style, animate = true}) => {
  const T = useAppTokens();
  const opacity = useRef(new Animated.Value(animate ? 0 : 1)).current;
  const translateY = useRef(
    new Animated.Value(animate ? CARD_TRANSLATE_START : 0),
  ).current;

  useEffect(() => {
    if (!animate) {
      return;
    }
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: CARD_FADE_DUR,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        speed: CARD_SPRING_SPEED,
        bounciness: CARD_SPRING_BOUNCE,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, delay, animate]);

  const cardStyle = {
    backgroundColor: T.cardBg,
    borderRadius: conditionalScale(12, 13, 14, 14),
    marginBottom: conditionalVerticalScale(12, 14, 16, 16),
    shadowColor: T.shadowColor,
    shadowOffset: T.shadowOffset,
    shadowOpacity: T.shadowOpacity,
    shadowRadius: T.shadowRadius,
    elevation: T.elevation,
    overflow: 'hidden',
  };

  return (
    <Animated.View
      style={[cardStyle, style, {opacity, transform: [{translateY}]}]}>
      {children}
    </Animated.View>
  );
};

export const StaticCard = ({children, style}) => {
  const T = useAppTokens();
  const cardStyle = {
    backgroundColor: T.cardBg,
    borderRadius: conditionalScale(12, 13, 14, 14),
    marginBottom: conditionalVerticalScale(12, 14, 16, 16),
    shadowColor: T.shadowColor,
    shadowOffset: T.shadowOffset,
    shadowOpacity: T.shadowOpacity,
    shadowRadius: T.shadowRadius,
    elevation: T.elevation,
    overflow: 'hidden',
  };
  return <View style={[cardStyle, style]}>{children}</View>;
};
