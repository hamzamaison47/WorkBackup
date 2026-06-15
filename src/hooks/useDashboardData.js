/* eslint-disable curly */
import {useState, useCallback, useMemo, useRef, useEffect} from 'react';
import {useSelector} from 'react-redux';

import {ProfilePicture} from '../API/PersonalInformation/ProfilePicture/ProfilePicture';
import {apiCache} from '../utils/apiCache';
import {selectUserData} from '../store/selectors';

export const useDashboardData = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const isMountedRef = useRef(true);

  const userData = useSelector(selectUserData);

  const employeeId = useMemo(
    () => userData?.employeeId,
    [userData?.employeeId],
  );

  const fetchProfilePicture = useCallback(
    async (empId, forceRefresh = false) => {
      if (!empId) return;

      if (
        !forceRefresh &&
        apiCache.has('profilePicture', {employeeId: empId})
      ) {
        const cachedData = apiCache.get('profilePicture', {employeeId: empId});
        if (isMountedRef.current) {
          setProfilePictureUrl(cachedData);
          setIsLoading(false);
        }
        return;
      }

      if (isMountedRef.current) {
        setIsLoading(true);
        setRefreshing(true);
      }

      try {
        const data = await ProfilePicture({employeeId: empId});
        const img = Array.isArray(data) && data.length > 0 ? data[0] : data;

        if (img?.StringImage) {
          const clean = img.StringImage.replace(/\s/g, '');
          const imageUrl = `data:image/png;base64,${clean}`;

          // Cache the result (15 minutes)
          apiCache.set('profilePicture', imageUrl, 15 * 60 * 1000, {
            employeeId: empId,
          });

          if (isMountedRef.current) {
            setProfilePictureUrl(imageUrl);
          }
        } else {
          if (isMountedRef.current) {
            setProfilePictureUrl(null);
          }
        }
      } catch (error) {
        console.log('Failed to fetch profile pic:', error);
        if (isMountedRef.current) {
          setProfilePictureUrl(null);
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
          setRefreshing(false);
        }
      }
    },
    [],
  );

  // Memoize the refresh handler
  const handleRefresh = useCallback(() => {
    if (employeeId) {
      fetchProfilePicture(employeeId, true);
    }
  }, [employeeId, fetchProfilePicture]);

  // Memoize the modal setter
  const toggleModal = useCallback(visible => {
    setModalVisible(visible);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return useMemo(
    () => ({
      isLoading,
      refreshing,
      profilePictureUrl,
      modalVisible,
      setModalVisible: toggleModal,
      fetchProfilePicture,
      handleRefresh,
    }),
    [
      isLoading,
      refreshing,
      profilePictureUrl,
      modalVisible,
      toggleModal,
      fetchProfilePicture,
      handleRefresh,
    ],
  );
};
