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
const PROFILE_IMAGE_SIZE = width * 0.35; // responsive image size
const BORDER_WIDTH = 5;

const ProfilePictureEditor = ({
  isLoading,
  profilePictureUrl,
  onEdit,
  userData,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Cancel image selection and close the modal
  const handleCancel = () => {
    setIsModalVisible(false);
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.profileImageWrapper}>
        <TouchableOpacity
          onPress={() => setIsModalVisible(true)}
          style={styles.profilePictureContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <CustomIndicator />
            </View>
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

      <Text style={styles.headerTitle}>{userData?.employeeName || 'User'}</Text>

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
                resizeMode="cover"
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
  profileImageWrapper: {
    position: 'relative',
    marginHorizontal: 18,
  },
  profilePictureContainer: {
    width: PROFILE_IMAGE_SIZE + BORDER_WIDTH * 2,
    height: PROFILE_IMAGE_SIZE + BORDER_WIDTH * 2,
    borderRadius: (PROFILE_IMAGE_SIZE + BORDER_WIDTH * 2) / 2,
    borderWidth: BORDER_WIDTH,
    borderColor: '#0A66C2',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  profilePicture: {
    width: PROFILE_IMAGE_SIZE,
    height: PROFILE_IMAGE_SIZE,
    borderRadius: PROFILE_IMAGE_SIZE / 2,
  },
  loadingContainer: {
    width: PROFILE_IMAGE_SIZE,
    height: PROFILE_IMAGE_SIZE,
    borderRadius: PROFILE_IMAGE_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#0A66C2',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 15,
    textAlign: 'center',
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
    borderRadius: 10,
    alignItems: 'center',
  },
  modalImage: {
    width: width * 0.8,
    height: height * 0.8,
    borderRadius: 10,
  },
});

export default ProfilePictureEditor;
