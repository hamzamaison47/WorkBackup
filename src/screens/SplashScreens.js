import React, {useEffect} from 'react';
import {Text, Animated, ActivityIndicator} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {getToken} from '../API/Token/getToken';
import styles from '../styles/styles';

const SplashScreens = ({navigation}) => {
  const logoOpacity = new Animated.Value(0);

  useEffect(() => {
    const fadeInLogo = () => {
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      }).start();
    };

    const checkAuthStatus = async () => {
      try {
        const token = await getToken();
        fadeInLogo();
        setTimeout(() => {
          if (token) {
            navigation.replace('Login');
          } else {
            navigation.replace('Login');
          }
        }, 3000);
      } catch (error) {
        console.log(error);
        navigation.replace('Login');
      }
    };

    checkAuthStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation]);

  return (
    <LinearGradient
      colors={['#0A66C2', '#bddeff']}
      style={styles.splash_Container}>
      <Animated.Image
        source={require('../assets/cloud.png')}
        style={[styles.splash_Logo, {opacity: logoOpacity}]}
        resizeMode="contain"
      />
      <Text style={styles.splash_Text}>Dynaface ESS By Maison</Text>
      <Text style={styles.splash_Tagline}>Your Technology Partner</Text>
      <ActivityIndicator
        size="large"
        color="#0A66C2"
        style={styles.splash_Loader}
      />
    </LinearGradient>
  );
};

export default SplashScreens;
