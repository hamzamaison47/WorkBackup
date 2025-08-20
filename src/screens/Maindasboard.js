/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect} from 'react';
import {
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
  Modal,
  ActivityIndicator,
  TouchableWithoutFeedback,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import {useSelector, useDispatch} from 'react-redux';

import {setSelectedLegalEntity} from '../store/slices/companySlice';
import {ProfilePicture} from '../API/PersonalInformation/ProfilePicture/ProfilePicture';

import CustomIndicator from '../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../components/ActionPaneContainer';
import {styles} from '../styles/styles';

const MainDashboard = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const userData = useSelector(state => state.user.userData);
  const selectedLegalEntity = useSelector(
    state => state.company.selectedLegalEntity,
  );

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [imageModalVisible, setImageModalVisible] = useState(false);

  useEffect(() => {
    if (userData?.defaultLegalEntity && !selectedLegalEntity) {
      dispatch(setSelectedLegalEntity(userData.defaultLegalEntity));
    }
  }, [userData?.defaultLegalEntity, selectedLegalEntity]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      closeAllOverlays();
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    fetchProfilePicture();
  }, []);

  const closeAllOverlays = () => {
    setImageModalVisible(false);
    navigation.closeDrawer?.();
  };

  // Fetch profile picture with error handling
  const fetchProfilePicture = async () => {
    setIsLoading(true);
    setRefreshing(true);
    try {
      if (!userData?.employeeId) {
        console.warn('Employee ID not available');
        return;
      }

      const data = await ProfilePicture({
        employeeId: userData.employeeId,
      });

      // Handle both array and object responses
      let imageData = null;
      if (Array.isArray(data) && data.length > 0) {
        imageData = data[0]; // Get first element if it's an array
      } else if (data && typeof data === 'object') {
        imageData = data; // Use directly if it's an object
      }

      if (imageData?.StringImage) {
        // Clean up the base64 string if it contains line breaks or extra spaces
        const cleanBase64 = imageData.StringImage.replace(/\s/g, '');
        const base64Image = `data:image/png;base64,${cleanBase64}`;
        setProfilePictureUrl(base64Image);
      } else {
        setProfilePictureUrl(null);
      }
    } catch (error) {
      console.error('Failed to fetch profile picture:', error);
      setProfilePictureUrl(null);
      // Don't show error modal for missing profile picture as it's optional
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchProfilePicture();
  };

  const cards = [
    {
      id: '1',
      title: 'Leave Request',
      description: 'Apply for time off',
      icon: 'calendar-outline',
      onPress: () =>
        navigation.navigate('LeaveSaveRecord', {
          mode: 'create',
          employeeId: userData.employeeId,
          employeeName: userData.employeeName,
          WorkerRecId: userData.WorkerRecId,
          cameFrom: 'MainDashboard',
          selectedLegalEntity,
        }),
    },
    {
      id: '2',
      title: 'Salary Slip',
      description: 'View monthly payslip',
      icon: 'card-outline',
      onPress: () =>
        navigation.navigate('PRSalarySlip', {
          employeeId: userData.employeeId,
          selectedLegalEntity,
        }),
    },
    {
      id: '3',
      title: 'Tax Certificate',
      description: 'View Tax Certificate',
      icon: 'document-text-outline',
      onPress: () =>
        navigation.navigate('PRTaxCertificate', {
          employeeId: userData.employeeId,
          selectedLegalEntity,
        }),
    },
    {
      id: '4',
      title: 'Loan & Advance',
      description: 'View Loan Request',
      icon: 'wallet-outline',
      onPress: () =>
        navigation.navigate('LoanRequestListPage', {
          employeeId: userData.employeeId,
          employeeName: userData.employeeName,
          WorkerRecId: userData.WorkerRecId,
          cameFrom: 'MainDashboard',
        }),
    },
    {
      id: '5',
      title: 'Entitlement Balance',
      description: 'Entitlement Balance Request',
      icon: 'time-outline',
      onPress: () =>
        navigation.navigate('EntitlementBalance', {
          employeeId: userData.employeeId,
          employeeName: userData.employeeName,
          WorkerRecId: userData.WorkerRecId,
          cameFrom: 'MainDashboard',
        }),
    },
    // {
    //   id: '6',
    //   title: 'Advance Request',
    //   description: 'View Advance Request',
    //   icon: 'wallet-outline',
    //   onPress: () =>
    //     navigation.navigate('AdvanceRequestListPage', {
    //       employeeId: userData.employeeId,
    //       employeeName: userData.employeeName,
    //       WorkerRecId: userData.WorkerRecId,
    //       cameFrom: 'MainDashboard',
    //     }),
    // },
  ];

  const renderCard = ({item}) => (
    <TouchableOpacity
      style={styles.Main_Card}
      onPress={item.onPress}
      activeOpacity={0.85}>
      <View style={styles.Main_IconWrapper}>
        <Ionicons name={item.icon} size={30} color="#fff" />
      </View>
      <Text style={styles.Main_CardTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <ActionPaneContainer
      pageTitle="Employee Self Service"
      isBackButton={false}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      onRefresh={handleRefresh}>
      {isLoading ? (
        <CustomIndicator />
      ) : (
        <SafeAreaView style={styles.Main_Container}>
          <FlatList
            key={'2-cols'}
            numColumns={2}
            data={cards}
            renderItem={renderCard}
            keyExtractor={item => item.id}
            columnWrapperStyle={styles.Main_Row}
            contentContainerStyle={styles.Main_Grid}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }
            ListHeaderComponent={
              <View style={styles.Main_HeaderContainer}>
                <View style={styles.Main_WelcomeCard}>
                  <View style={styles.Main_HeaderRow}>
                    {isLoading ? (
                      <ActivityIndicator size="large" color="#0A66C2" />
                    ) : (
                      <TouchableOpacity
                        onPress={() =>
                          navigation.navigate('DisplayPersonalInfo')
                        }>
                        <Image
                          source={{
                            uri:
                              profilePictureUrl ||
                              'https://via.placeholder.com/150',
                          }}
                          style={styles.Main_ProfilePicture}
                        />
                      </TouchableOpacity>
                    )}
                    <View style={styles.Main_TextColumn}>
                      <Text style={styles.Main_WelcomeText}>Welcome Back!</Text>
                      <Text style={styles.Main_NameText}>
                        {userData.employeeName}
                      </Text>
                      <Text style={styles.Main_EmailText}>
                        {userData.email}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            }
          />

          <Modal
            transparent={true}
            visible={imageModalVisible}
            animationType="fade"
            onRequestClose={() => setImageModalVisible(false)}>
            <TouchableWithoutFeedback
              onPress={() => setImageModalVisible(false)}>
              <View style={styles.Main_ModalOverlay}>
                <View style={styles.Main_ModalContent}>
                  <Image
                    source={{
                      uri:
                        profilePictureUrl || 'https://via.placeholder.com/150',
                    }}
                    style={styles.Main_ModalImage}
                  />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        </SafeAreaView>
      )}
    </ActionPaneContainer>
  );
};

export default MainDashboard;
