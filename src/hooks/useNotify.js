// src/hooks/useNotify.js
import {useDispatch} from 'react-redux';
import {addInAppNotification} from '../store/slices/firebaseSlice';

const useNotify = (screenName = '') => {
  const dispatch = useDispatch();

  const notify = (text, type = 'Info') => {
    if (!text) return;
    const fullText = screenName ? `${screenName}: ${text}` : text;
    dispatch(addInAppNotification({text: fullText, type}));
  };

  return {
    notifySuccess: text => notify(text, 'Success'),
    notifyError: text => notify(text, 'Error'),
    notifyDelete: text => notify(text, 'Delete'),
    notifyInfo: text => notify(text, 'Info'),
  };
};

export default useNotify;
