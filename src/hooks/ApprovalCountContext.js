import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import {AppState} from 'react-native';
import {useSelector} from 'react-redux';
import {RetrieveByEmail} from '../API/WorkflowTrackingStatusTable/retrieveByEmail';

const ApprovalCountContext = createContext({
  count: 0,
  setCount: () => {},
  refresh: async () => {},
});

export const ApprovalCountProvider = ({children}) => {
  const userData = useSelector(state => state.user.userData);
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!userData?.email) {
      setCount(0);
      return;
    }
    try {
      const data = await RetrieveByEmail({email: userData.email});
      setCount(
        Array.isArray(data)
          ? data.filter(i => i.workflowWorkItemType === 'WorkItem').length
          : 0,
      );
    } catch (e) {
      console.log('[ApprovalCount] refresh failed', e);
    }
  }, [userData?.email]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', s => {
      if (s === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  return (
    <ApprovalCountContext.Provider value={{count, setCount, refresh}}>
      {children}
    </ApprovalCountContext.Provider>
  );
};

export const useApprovalCount = () => useContext(ApprovalCountContext);
