import React, {useEffect} from 'react';
import {View, Animated, StyleSheet} from 'react-native';

const CustomIndicator = () => {
  const scale = new Animated.Value(1);

  useEffect(() => {
    // Popping animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const popStyle = {
    transform: [
      {
        scale,
      },
    ],
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.spinner]} />
      <Animated.Image
        source={require('../../assets/cloud-mini.png')}
        style={[styles.image, popStyle]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#c75e29',
    borderTopColor: 'transparent',
  },
  image: {
    width: 50,
    height: 50,
  },
});

export default CustomIndicator;
