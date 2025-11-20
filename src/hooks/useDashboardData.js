/* eslint-disable curly */
import {useState} from 'react';
import {useSelector} from 'react-redux';

import {ProfilePicture} from '../API/PersonalInformation/ProfilePicture/ProfilePicture';

export const useDashboardData = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  // Redux
  const userData = useSelector(state => state.user.userData);

  const fetchProfilePicture = async employeeId => {
    setIsLoading(true);
    setRefreshing(true);

    try {
      if (!employeeId) return;

      const data = await ProfilePicture({employeeId});
      const img = Array.isArray(data) && data.length > 0 ? data[0] : data;

      if (img?.StringImage) {
        const clean = img.StringImage.replace(/\s/g, '');
        setProfilePictureUrl(`data:image/png;base64,${clean}`);
      } else {
        setProfilePictureUrl(null);
      }
    } catch (error) {
      console.log('Failed to fetch profile pic:', error);
      setProfilePictureUrl(null);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchProfilePicture(userData?.employeeId);
  };

  return {
    isLoading,
    refreshing,
    profilePictureUrl,
    modalVisible,
    setModalVisible,
    fetchProfilePicture,
    handleRefresh,
  };
};
