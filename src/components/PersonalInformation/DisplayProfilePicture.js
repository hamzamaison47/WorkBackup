import React, {useState} from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Image,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import CustomIndicator from '../CustomIndicator/CustomIndicator';
import styles from '../../styles/styles';

const DisplayProfilePicture = ({isLoading, profilePictureUrl, userData}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Cancel image selection and close the modal
  const handleCancel = () => {
    setIsModalVisible(false); // Close modal without saving
  };

  return (
    <View style={styles.DispPP_headerContainer}>
      <View>
        <TouchableOpacity
          onPress={() => setIsModalVisible(true)} // Open modal when image is clicked
          style={styles.DispPP_profilePictureContainer}>
          {isLoading ? (
            <CustomIndicator />
          ) : (
            <Image
              source={{
                uri: profilePictureUrl || 'https://via.placeholder.com/150',
              }}
              style={styles.DispPP_profilePicture}
            />
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.DispPP_headerTitle}>{userData.employeeName}</Text>

      {/* Modal to show larger image */}
      <Modal
        transparent={true}
        visible={isModalVisible}
        animationType="fade"
        onRequestClose={handleCancel}>
        <TouchableWithoutFeedback onPress={handleCancel}>
          <View style={styles.DispPP_modalOverlay}>
            <View style={styles.DispPP_modalContent}>
              <Image
                source={{
                  uri: profilePictureUrl || 'https://via.placeholder.com/150',
                }}
                style={styles.DispPP_modalImage}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default DisplayProfilePicture;
