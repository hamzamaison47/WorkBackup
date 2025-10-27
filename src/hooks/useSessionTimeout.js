import {useState, useEffect, useRef} from 'react';
import {AppState} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';

const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes

const useSessionTimeout = () => {
  const [showModal, setShowModal] = useState(false);
  const [initialized, setInitialized] = useState(false); // ✅ Track initial run
  const appState = useRef(AppState.currentState);
  const navigation = useNavigation();

  const handleOkPress = async () => {
    setShowModal(false);
    await AsyncStorage.multiRemove(['userToken', 'lastBackgroundTime']);
    navigation.reset({
      index: 0,
      routes: [{name: 'Login'}],
    });
  };

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      async nextAppState => {
        // When app goes to background
        if (appState.current.match(/active/) && nextAppState === 'background') {
          const timeNow = new Date().getTime();
          await AsyncStorage.setItem('lastBackgroundTime', timeNow.toString());
        }

        // When app comes to foreground
        if (
          appState.current.match(/background|inactive/) &&
          nextAppState === 'active'
        ) {
          if (!initialized) {
            setInitialized(true);
            appState.current = nextAppState;
            return;
          }

          const storedTime = await AsyncStorage.getItem('lastBackgroundTime');
          if (storedTime) {
            const diff = new Date().getTime() - parseInt(storedTime, 10);
            if (diff > SESSION_TIMEOUT) {
              setShowModal(true);
            }
          }
        }

        appState.current = nextAppState;
      },
    );

    return () => subscription.remove();
  }, [initialized]);

  return {showModal, handleOkPress};
};

export default useSessionTimeout;
