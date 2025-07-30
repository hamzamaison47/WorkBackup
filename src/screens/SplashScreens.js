import React, {useEffect} from 'react';
import {Text, StyleSheet, Animated, ActivityIndicator} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {getToken} from '../API/Token/getToken';

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
    <LinearGradient colors={['#FF6F00', '#FFB300']} style={styles.container}>
      <Animated.Image
        source={require('../assets/cloud.png')}
        style={[styles.logo, {opacity: logoOpacity}]}
        resizeMode="contain"
      />
      <Text style={styles.text}>ESS Payroll Portal</Text>
      <Text style={styles.tagline}>Managing Payroll, Simplified</Text>
      <ActivityIndicator size="large" color="#FFFFFF" style={styles.loader} />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 80,
    marginBottom: 20,
  },
  text: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: {width: 2, height: 2},
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 10,
    fontStyle: 'italic',
    fontWeight: '300',
  },
  loader: {
    marginTop: 20,
  },
});

export default SplashScreens;
