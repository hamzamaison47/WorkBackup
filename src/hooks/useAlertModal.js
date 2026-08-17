import {useState, useCallback} from 'react';

// Moved outside the hook — this is a static lookup, not something that should
// be recreated on every render or tracked as a dependency.
const DEFAULT_HEADINGS = {
  success: 'Success',
  error: 'Error',
  warning: 'Missing Information',
  info: 'Alert',
};

const useAlertModal = () => {
  const [state, setState] = useState({
    visible: false,
    type: 'info',
    heading: '',
    message: '',
  });

  const show = useCallback((type, message, heading) => {
    setState({
      visible: true,
      type,
      heading: heading || DEFAULT_HEADINGS[type] || 'Alert',
      message,
    });
  }, []);

  const showSuccess = useCallback(
    (message, heading) => show('success', message, heading),
    [show],
  );
  const showError = useCallback(
    (message, heading) => show('error', message, heading),
    [show],
  );
  const showWarning = useCallback(
    (message, heading) => show('warning', message, heading),
    [show],
  );
  const showInfo = useCallback(
    (message, heading) => show('info', message, heading),
    [show],
  );

  const hide = useCallback(() => {
    setState(prev => ({...prev, visible: false}));
  }, []);

  const alertModalProps = {
    visible: state.visible,
    type: state.type,
    heading: state.heading,
    text: state.message,
    onPress: hide,
  };

  return {showSuccess, showError, showWarning, showInfo, hide, alertModalProps};
};

export default useAlertModal;
