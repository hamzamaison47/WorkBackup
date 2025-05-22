/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect} from 'react';
import {styles} from '../../styles/LeaveRequestStyles';
import LinearGradient from 'react-native-linear-gradient';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  // Modal,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import {ProfilePicture} from '../../API/ProfilePicture/ProfilePicture';
// import {TouchableWithoutFeedback} from 'react-native-gesture-handler';
// import {FindByEmployeeId} from '../../API/PREmploymentInformation/FindByEmployeeId';

const AssignedWorkerCard = ({
  employeeId,
  employeeName,
  departmentName,
  email,
  positionId,
  positionDescription,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // const [imageModalVisible, setImageModalVisible] = useState(false);

  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  // const [empInfoData, setEmpInfoData] = useState('');

  useEffect(() => {
    fetchProfilePicture();
    // fetchEmployeeInfo();
  }, []);

  const fetchProfilePicture = async () => {
    setIsLoading(true);
    try {
      const data = await ProfilePicture({employeeId: employeeId});
      const base64Image = `data:image/png;base64,${data.StringImage}`;

      // console.log('Image data====================', data);
      // console.log('base64Image====================', base64Image);
      setProfilePictureUrl(base64Image);
    } catch (error) {
      console.error('Failed to fetch Image data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // const fetchEmployeeInfo = async () => {
  //   try {
  //     const data = await FindByEmployeeId({employeeId: employeeId});
  //     setEmpInfoData(data);
  //   } catch (error) {
  //     console.error('Failed to fetch Image data:', error);
  //   }
  // };

  // Function to toggle the expanded state
  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  return (
    <View style={styles.cardContainer}>
      <LinearGradient
        colors={['#FFF3E0', '#FFF3E0', '#FFF3E0']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.card}>
        {/* Header Text and Edit Button */}
        <View style={styles.cardHeader}>
          <Text style={styles.cardHeaderText}>{employeeName}</Text>

          <View style={styles.headerRow}>
            {isLoading ? (
              <ActivityIndicator size="large" color="orange" />
            ) : (
              // <TouchableOpacity onPress={() => setImageModalVisible(true)}>
              <TouchableOpacity>
                <Image
                  source={
                    profilePictureUrl &&
                    profilePictureUrl !== 'data:image/png;base64,'
                      ? {uri: profilePictureUrl}
                      : require('../../assets/userLogo.jpg')
                  }
                  style={styles.profilePicture}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.cardContent}>
          {/* Summary Information (Visible in collapsed state) */}
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

          {/* Expandable Content (Visible only when expanded) */}
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
            </>
          )}
        </View>

        {/* Expand/Collapse Button */}
        <TouchableOpacity onPress={toggleExpand} style={styles.expandButton}>
          <FontAwesome
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#fff"
          />
        </TouchableOpacity>
      </LinearGradient>

      {/* <Modal
        transparent={true}
        visible={imageModalVisible}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setImageModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContentImage}>
              <Image
                source={{
                  uri: profilePictureUrl || 'https://via.placeholder.com/150',
                }}
                style={styles.modalImage}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal> */}
    </View>
  );
};

export default AssignedWorkerCard;
