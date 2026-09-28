import {useState, useEffect, useRef} from 'react';
import {AppState} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {setLastBackgroundTime} from '../store/slices/authSlice';
import {handleLogoutauth} from '../Controller/authUtils';

const SESSION_TIMEOUT = 4 * 60 * 60 * 1000; // 4 hours

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
    // Session expiry IS a logout. This used to clear 2 of 11 slices, leaving
    // menus, company, firebase identity, chatbot and the API cache behind.
    handleLogoutauth(navigation);
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
