/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import {ProfilePicture} from '../../API/PersonalInformation/ProfilePicture/ProfilePicture';

const {width, height} = Dimensions.get('window');

const AssignedWorkerCard = ({
  employeeId,
  employeeName,
  defaultCompany,
  departmentName,
  email,
  positionId,
  positionDescription,
  workerRecId,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profilePictureUrl, setProfilePictureUrl] = useState('');

  const navigation = useNavigation();

  useEffect(() => {
    fetchProfilePicture();
  }, []);

  const fetchProfilePicture = async () => {
    setIsLoading(true);

    try {
      const data = await ProfilePicture({
        employeeId: employeeId,
        defaultCompany: defaultCompany,
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

  const toggleExpand = () => {
    setExpanded(prev => !prev);
  };

  return (
    <View style={styles.cardContainer}>
      <LinearGradient
        colors={['#FFF3E0', '#FFF3E0', '#FFF3E0']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <Text style={styles.cardHeaderText}>{employeeName}</Text>
          <View style={styles.headerRow}>
            {isLoading ? (
              <ActivityIndicator size="large" color="orange" />
            ) : (
              <TouchableOpacity>
                <Image
                  source={
                    profilePictureUrl
                      ? {uri: profilePictureUrl}
                      : require('../../assets/userLogo.jpg')
                  }
                  style={styles.profilePicture}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Card Content */}
        <View style={styles.cardContent}>
          <View style={styles.textContainer}>
            <Text style={styles.cardTextHeading}>Position Description:</Text>
            <Text style={styles.cardText}>{positionDescription}</Text>
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.cardTextHeading}>Department:</Text>
            <Text style={styles.cardText}>{departmentName}</Text>
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.cardTextHeading}>Email:</Text>
            <Text style={styles.cardText}>{email}</Text>
          </View>

          {expanded && (
            <>
              <View style={styles.sectionDivider} />

              <View style={styles.textContainer}>
                <Text style={styles.cardTextHeading}>Employee ID:</Text>
                <Text style={styles.cardText}>{employeeId}</Text>
              </View>

              <View style={styles.textContainer}>
                <Text style={styles.cardTextHeading}>Position ID:</Text>
                <Text style={styles.cardText}>{positionId}</Text>
              </View>

              <View style={styles.sectionDivider} />
              <TouchableOpacity
                style={styles.navigateButton}
                onPress={() =>
                  navigation.navigate('LeavesListPage', {
                    employeeId: employeeId,
                    employeeName: employeeName,
                    WorkerRecId: workerRecId,
                    cameFrom: 'WorkerAssignedToMe',
                  })
                }>
                <Text style={styles.navigateButtonText}>Leave Details</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navigateButton}>
                <Text style={styles.navigateButtonText}>Advance Details</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navigateButton}>
                <Text style={styles.navigateButtonText}>Salary Slip</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Expand Button */}
        <TouchableOpacity onPress={toggleExpand} style={styles.expandButton}>
          <FontAwesome
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#fff"
          />
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginVertical: height * 0.01,
    marginHorizontal: width * 0.03,
  },

  card: {
    borderRadius: width * 0.04,
    padding: width * 0.045,
    elevation: 3,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.015,
  },

  cardHeaderText: {
    fontSize: width * 0.05,
    fontWeight: 'bold',
    color: '#37474F',
    flex: 1,
  },

  profilePicture: {
    width: width * 0.14,
    height: width * 0.14,
    borderRadius: width * 0.07,
    resizeMode: 'cover',
    borderWidth: 2,
    borderColor: '#FFA726',
  },

  cardContent: {
    marginTop: height * 0.01,
  },

  textContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: height * 0.008,
    flexWrap: 'wrap',
  },

  cardTextHeading: {
    fontWeight: '600',
    color: '#455A64',
    fontSize: width * 0.035,
    flex: 1,
  },

  cardText: {
    color: '#263238',
    fontSize: width * 0.035,
    flex: 1,
    textAlign: 'right',
  },

  sectionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#BDBDBD',
    marginVertical: height * 0.012,
  },

  navigateButton: {
    borderColor: '#FFA726',
    borderWidth: 1.5,
    borderRadius: 20,
    paddingVertical: height * 0.012,
    paddingHorizontal: width * 0.04,
    marginVertical: height * 0.008,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },

  navigateButtonText: {
    color: '#000000ff',
    fontWeight: 'bold',
    fontSize: width * 0.038,
  },

  expandButton: {
    alignItems: 'center',
    marginTop: height * 0.015,
    padding: 6,
    backgroundColor: 'orange',
    borderRadius: 50,
    alignSelf: 'center',
  },
});

export default AssignedWorkerCard;
