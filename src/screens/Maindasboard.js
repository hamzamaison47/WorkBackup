/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect} from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Dimensions,
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

const {height, width} = Dimensions.get('window');
const cardWidth = (width - 56) / 2;

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
  ];

  const renderCard = ({item}) => (
    <TouchableOpacity
      style={styles.card}
      onPress={item.onPress}
      activeOpacity={0.85}>
      <View style={styles.iconWrapper}>
        <Ionicons name={item.icon} size={30} color="#fff" />
      </View>
      <Text style={styles.cardTitle}>{item.title}</Text>
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
        <SafeAreaView style={styles.container}>
          <FlatList
            key={'2-cols'}
            numColumns={2}
            data={cards}
            renderItem={renderCard}
            keyExtractor={item => item.id}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }
            ListHeaderComponent={
              <View style={styles.headerContainer}>
                <View style={styles.welcomeCard}>
                  <View style={styles.headerRow}>
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
                          style={styles.profilePicture}
                        />
                      </TouchableOpacity>
                    )}
                    <View style={styles.textColumn}>
                      <Text style={styles.welcomeText}>Welcome Back!</Text>
                      <Text style={styles.nameText}>
                        {userData.employeeName}
                      </Text>
                      <Text style={styles.emailText}>{userData.email}</Text>
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
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <Image
                    source={{
                      uri:
                        profilePictureUrl || 'https://via.placeholder.com/150',
                    }}
                    style={styles.modalImage}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: height * 0.1, // Extra padding for fixed button
  },
  headerContainer: {
    width: width * 0.9,
    alignSelf: 'center',
    marginTop: height * 0.03,
    // marginBottom: height * 0.001,
  },
  welcomeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {width: 0, height: 6},
    shadowRadius: 8,
    elevation: 8,
    marginBottom: height * 0.035,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  profilePicture: {
    width: height * 0.12,
    height: height * 0.12,
    borderRadius: height * 0.125,
    marginRight: width * 0.02,
    borderWidth: 4,
    borderColor: '#0A66C2',
  },
  textColumn: {
    flexDirection: 'column',
    flex: 1,
  },
  welcomeText: {
    fontSize: height * 0.025,
    fontWeight: 'bold',
    color: '#1A1A1A',
    // marginBottom: height * 0.008,
    textAlign: 'left',
  },
  nameText: {
    fontSize: height * 0.022,
    color: '#0A66C2',
    fontWeight: '600',
    textAlign: 'left',
    // marginBottom: height * 0.005,
  },
  emailText: {
    fontSize: height * 0.015,
    color: '#5A5A5A',
    textAlign: 'left',
  },
  grid: {
    paddingHorizontal: 20,
    // paddingTop: 10,
    paddingBottom: 40,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  card: {
    width: cardWidth,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: {width: 0, height: 4},
    shadowRadius: 6,
    elevation: 5,
  },
  iconWrapper: {
    backgroundColor: '#0A66C2',
    padding: 12,
    borderRadius: 50,
    marginBottom: 12,
    shadowColor: '#0A66C2',
    shadowOpacity: 0.2,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalImage: {
    width: width * 0.08,
    height: height * 0.06,
    borderRadius: 10,
  },
});

export default MainDashboard;
