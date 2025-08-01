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

import {styles} from '../../styles/LeaveRequestStyles';
import {ProfilePicture} from '../../API/ProfilePicture/ProfilePicture';

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
      const data = await ProfilePicture({employeeId, defaultCompany});
      // const base64Image = `data:image/png;base64,${data.StringImage}`;
      // setProfilePictureUrl(base64Image);
      if (data?.[0]?.StringImage) {
        setProfilePictureUrl(`data:image/png;base64,${data[0].StringImage}`);
      } else {
        setProfilePictureUrl(null);
      }
    } catch (error) {
      console.error('Failed to fetch image data:', error);
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
                  source={{
                    uri: profilePictureUrl || 'https://via.placeholder.com/150',
                  }}
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

export default AssignedWorkerCard;
