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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import {useSelector, useDispatch} from 'react-redux';

import {wp, hp} from '../constants/Size';
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

  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
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
    try {
      if (!userData?.employeeId) {
        console.warn('Employee ID not available');
        return;
      }

      const data = await ProfilePicture({
        employeeId: userData.employeeId,
        defaultCompany: selectedLegalEntity,
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
        console.warn('No StringImage found in profile picture data');
        setProfilePictureUrl(null);
      }
    } catch (error) {
      console.error('Failed to fetch profile picture:', error);
      setProfilePictureUrl(null);
      // Don't show error modal for missing profile picture as it's optional
    } finally {
      setIsLoading(false);
    }
  };
  // const fetchProfilePicture = async () => {
  //   setIsLoading(true);
  //   try {
  //     const data = await ProfilePicture({
  //       employeeId: userData.employeeId,
  //       defaultCompany: selectedLegalEntity,
  //     });
  //     if (data?.[0]?.StringImage) {
  //       setProfilePictureUrl(`data:image/png;base64,${data[0].StringImage}`);
  //     } else {
  //       setProfilePictureUrl(null);
  //     }
  //   } catch (error) {
  //     console.error('Failed to fetch profile image:', error);
  //     setProfilePictureUrl(null);
  // } finally {
  //   setIsLoading(false);
  // }
  // };

  // Handle refresh
  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
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
      onRefresh={handleRefresh}>
      {/* Show loading indicator when isLoading is true */}
      {isLoading ? (
        <CustomIndicator />
      ) : (
        <SafeAreaView style={styles.container}>
          <View style={styles.headerContainer}>
            <View style={styles.welcomeCard}>
              <View style={styles.headerRow}>
                {isLoading ? (
                  <ActivityIndicator size="large" color="#FFA500" />
                ) : (
                  <TouchableOpacity
                    onPress={() => navigation.navigate('DisplayPersonalInfo')}>
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
                  <Text style={styles.nameText}>{userData.employeeName}</Text>
                  <Text style={styles.emailText}>{userData.email}</Text>
                </View>
              </View>
            </View>
          </View>

          <FlatList
            key={'2-cols'}
            numColumns={2}
            data={cards}
            renderItem={renderCard}
            keyExtractor={item => item.id}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
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
  headerContainer: {
    width: wp(90),
    alignSelf: 'center',
    marginTop: hp(3),
    marginBottom: hp(2),
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
    marginBottom: hp(3),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  profilePicture: {
    width: hp(20),
    height: hp(20),
    borderRadius: hp(12.5),
    marginRight: wp(2),
    borderWidth: 4,
    borderColor: '#FFA500',
  },
  textColumn: {
    flexDirection: 'column',
    flex: 1,
  },
  welcomeText: {
    fontSize: hp(5),
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: hp(0.8),
    textAlign: 'left',
  },
  nameText: {
    fontSize: hp(4.5),
    color: '#FFA500',
    fontWeight: '600',
    textAlign: 'left',
    marginBottom: hp(0.5),
  },
  emailText: {
    fontSize: hp(2.8),
    color: '#5A5A5A',
    textAlign: 'left',
  },
  grid: {
    paddingHorizontal: 20,
    paddingTop: 10,
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
    backgroundColor: '#FFA500',
    padding: 12,
    borderRadius: 50,
    marginBottom: 12,
    shadowColor: '#FFA500',
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
    width: width * 0.8,
    height: height * 0.6,
    borderRadius: 10,
  },
});

export default MainDashboard;
