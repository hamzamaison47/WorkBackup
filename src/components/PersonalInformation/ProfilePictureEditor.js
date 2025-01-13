import React, {useState} from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import CustomIndicator from '../CustomIndicator/CustomIndicator';

const {height, width} = Dimensions.get('window');

const ProfilePictureEditor = ({
  isLoading,
  profilePictureUrl,
  onEdit,
  userData,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Cancel image selection and close the modal
  const handleCancel = () => {
    setIsModalVisible(false); // Close modal without saving
  };

  return (
    <View style={styles.headerContainer}>
      <View>
        <TouchableOpacity
          onPress={() => setIsModalVisible(true)} // Open modal when image is clicked
          style={styles.profilePictureContainer}>
          {isLoading ? (
            <CustomIndicator />
          ) : (
            <Image
              source={{
                uri: profilePictureUrl || 'https://via.placeholder.com/150',
              }}
              style={styles.profilePicture}
            />
          )}
        </TouchableOpacity>

        {/* Edit icon that triggers ImagePicker */}
        <TouchableOpacity onPress={onEdit} style={styles.editIconContainer}>
          <Icon name="edit" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.headerTitle}>{userData.employeeName}</Text>

      {/* Modal to show larger image */}
      <Modal
        transparent={true}
        visible={isModalVisible}
        animationType="fade"
        onRequestClose={handleCancel}>
        <TouchableWithoutFeedback onPress={handleCancel}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Image
                source={{
                  uri: profilePictureUrl || 'https://via.placeholder.com/150',
                }}
                style={styles.modalImage}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePictureContainer: {
    position: 'relative',
    marginHorizontal: 18,
  },
  profilePicture: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFA500',
    borderRadius: 25,
    padding: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 10,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: 'white',
    // padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalImage: {
    width: width * 0.8,
    height: height * 0.6,
    borderRadius: 10,
    // marginBottom: 20,
  },
});

export default ProfilePictureEditor;
