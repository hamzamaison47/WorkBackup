import {useState, useEffect, useRef} from 'react';
import {AppState} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {
  setLastBackgroundTime,
  clearAuthTokens,
} from '../store/slices/authSlice';
import {clearUserData} from '../store/slices/userSlice';

const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes

const useSessionTimeout = () => {
  const [showModal, setShowModal] = useState(false);
  const [initialized, setInitialized] = useState(false); // ✅ Track initial run
  const appState = useRef(AppState.currentState);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const lastBackgroundTime = useSelector(
    state => state.auth.lastBackgroundTime,
  );

  const handleOkPress = () => {
    setShowModal(false);
    // Clear auth tokens and user data from Redux
    dispatch(clearAuthTokens());
    dispatch(clearUserData());
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
          dispatch(setLastBackgroundTime(timeNow));
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

          if (lastBackgroundTime) {
            const diff = new Date().getTime() - lastBackgroundTime;
            if (diff > SESSION_TIMEOUT) {
              setShowModal(true);
            }
          }
        }

        appState.current = nextAppState;
      },
    );

    return () => subscription.remove();
  }, [initialized, lastBackgroundTime, dispatch]);

  return {showModal, handleOkPress};
};

export default useSessionTimeout;
