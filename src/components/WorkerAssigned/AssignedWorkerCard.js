/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import {ProfilePicture} from '../../API/PersonalInformation/ProfilePicture/ProfilePicture';
import {styles} from '../../styles/styles';

const AssignedWorkerCard = ({
  employeeId,
  employeeName,
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
    }
  };

  const toggleExpand = () => {
    setExpanded(prev => !prev);
  };

  return (
    <View style={styles.AWC_cardContainer}>
      <LinearGradient
        colors={['#6ee0ff', '#bddeff', '#cce6ff']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.AWC_card}>
        {/* Header */}
        <View style={styles.AWC_cardHeader}>
          <Text style={styles.AWC_cardHeaderText}>{employeeName}</Text>
          <View style={styles.AWC_headerRow}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#0A66C2" />
            ) : (
              <TouchableOpacity>
                <Image
                  source={
                    profilePictureUrl
                      ? {uri: profilePictureUrl}
                      : require('../../assets/userLogo.jpg')
                  }
                  style={styles.AWC_profilePicture}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Card Content */}
        <View style={styles.AWC_cardContent}>
          <View style={styles.AWC_textContainer}>
            <Text style={styles.AWC_cardTextHeading}>
              Position Description:
            </Text>
            <Text style={styles.AWC_cardText}>{positionDescription}</Text>
          </View>

          <View style={styles.AWC_textContainer}>
            <Text style={styles.AWC_cardTextHeading}>Department:</Text>
            <Text style={styles.AWC_cardText}>{departmentName}</Text>
          </View>

          <View style={styles.AWC_textContainer}>
            <Text style={styles.AWC_cardTextHeading}>Email:</Text>
            <Text style={styles.AWC_cardText}>{email}</Text>
          </View>

          {expanded && (
            <>
              <View style={styles.AWC_sectionDivider} />

              <View style={styles.AWC_textContainer}>
                <Text style={styles.AWC_cardTextHeading}>Employee ID:</Text>
                <Text style={styles.AWC_cardText}>{employeeId}</Text>
              </View>

              <View style={styles.AWC_textContainer}>
                <Text style={styles.AWC_cardTextHeading}>Position ID:</Text>
                <Text style={styles.AWC_cardText}>{positionId}</Text>
              </View>

              <View style={styles.AWC_sectionDivider} />
              <TouchableOpacity
                style={styles.AWC_navigateButton}
                onPress={() =>
                  navigation.navigate('LeavesListPage', {
                    employeeId: employeeId,
                    employeeName: employeeName,
                    WorkerRecId: workerRecId,
                    cameFrom: 'WorkerAssignedToMe',
                  })
                }>
                <Text style={styles.AWC_navigateButtonText}>Leave Details</Text>
              </TouchableOpacity>
              {/* <TouchableOpacity style={styles.AWC_navigateButton}>
                <Text style={styles.AWC_navigateButtonText}>Advance Details</Text>
              </TouchableOpacity> */}
              {/* <TouchableOpacity style={styles.AWC_navigateButton}>
                <Text style={styles.AWC_navigateButtonText}>Salary Slip</Text>
              </TouchableOpacity> */}
            </>
          )}
        </View>

        {/* Expand Button */}
        <TouchableOpacity
          onPress={toggleExpand}
          style={styles.AWC_expandButton}>
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

export default AssignedWorkerCard;
