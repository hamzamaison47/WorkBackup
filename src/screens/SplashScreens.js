import React, {useEffect, useRef} from 'react';
import {Animated, Easing} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from '../styles/styles';

const SplashScreens = ({navigation}) => {
  // Animations
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const circlePulse1 = useRef(new Animated.Value(0)).current;
  const circlePulse2 = useRef(new Animated.Value(0)).current;
  const circlePulse3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fadeInContent = () => {
      // Staggered fade in for logo and text
      Animated.stagger(300, [
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 1000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    };

    // Staggered circle animations
    Animated.stagger(400, [
      Animated.timing(circlePulse1, {
        toValue: 1,
        duration: 2000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(circlePulse2, {
        toValue: 1,
        duration: 2000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(circlePulse3, {
        toValue: 1,
        duration: 2000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const checkAuthStatus = async () => {
      try {
        fadeInContent();

        // Check if we're returning from a language restart
        const skipLogin = await AsyncStorage.getItem(
          '@skip_login_after_restart',
        );

        if (skipLogin === 'true') {
          // Clear the flag immediately
          await AsyncStorage.removeItem('@skip_login_after_restart');

          // Go directly to DrawerNavigator (skip Login)
          setTimeout(() => {
            navigation.replace('DrawerNavigator');
          }, 2000);
          return;
        }

        // Normal flow - go to Login
        setTimeout(() => {
          navigation.replace('Login');
        }, 3000);
      } catch (error) {
        console.log('Splash screen error:', error);
        navigation.replace('Login');
      }
    };

    checkAuthStatus();
  }, [
    navigation,
    logoOpacity,
    textOpacity,
    taglineOpacity,
    circlePulse1,
    circlePulse2,
    circlePulse3,
  ]);

  // Circle scale interpolations
  const circle1Scale = circlePulse1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const circle2Scale = circlePulse2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const circle3Scale = circlePulse3.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const circle1Opacity = circlePulse1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.15],
  });

  const circle2Opacity = circlePulse2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.1],
  });

  const circle3Opacity = circlePulse3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.08],
  });

  return (
    <LinearGradient
      colors={['#0A66C2', '#bddeff']}
      style={styles.splash_Container}>
      {/* Background Circles */}
      <Animated.View
        style={[
          styles.splash_Circle1,
          {
            opacity: circle1Opacity,
            transform: [{scale: circle1Scale}],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.splash_Circle2,
          {
            opacity: circle2Opacity,
            transform: [{scale: circle2Scale}],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.splash_Circle3,
          {
            opacity: circle3Opacity,
            transform: [{scale: circle3Scale}],
          },
        ]}
      />

      {/* Logo with fade animation */}
      <Animated.Image
        source={require('../assets/cloud.png')}
        style={[styles.splash_Logo, {opacity: logoOpacity}]}
        resizeMode="contain"
      />

      {/* Text with fade animations */}
      <Animated.Text style={[styles.splash_Text, {opacity: textOpacity}]}>
        Dynaface ESS By Maison
      </Animated.Text>

      <Animated.Text style={[styles.splash_Tagline, {opacity: taglineOpacity}]}>
        Your Technology Partner
      </Animated.Text>
    </LinearGradient>
  );
};

export default SplashScreens;
