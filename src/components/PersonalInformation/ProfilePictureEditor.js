import React, {useState} from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Image,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import CustomIndicator from '../CustomIndicator/CustomIndicator';
import {styles} from '../../styles/styles';

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
    <View style={styles.PPEdit_headerContainer}>
      <View style={styles.PPEdit_profileImageWrapper}>
        <TouchableOpacity
          onPress={() => setIsModalVisible(true)}
          style={styles.PPEdit_profilePictureContainer}>
          {isLoading ? (
            <View style={styles.PPEdit_loadingContainer}>
              <CustomIndicator />
            </View>
          ) : (
            <Image
              source={{
                uri: profilePictureUrl || 'https://via.placeholder.com/150',
              }}
              style={styles.PPEdit_profilePicture}
            />
          )}
        </TouchableOpacity>

        {/* Edit icon that triggers ImagePicker */}
        <TouchableOpacity
          onPress={onEdit}
          style={styles.PPEdit_editIconContainer}>
          <Icon name="edit" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.PPEdit_headerTitle}>
        {userData?.employeeName || 'User'}
      </Text>

      {/* Modal to show larger image */}
      <Modal
        transparent={true}
        visible={isModalVisible}
        animationType="fade"
        onRequestClose={handleCancel}>
        <TouchableWithoutFeedback onPress={handleCancel}>
          <View style={styles.PPEdit_modalOverlay}>
            <View style={styles.PPEdit_modalContent}>
              <Image
                source={{
                  uri: profilePictureUrl || 'https://via.placeholder.com/150',
                }}
                style={styles.PPEdit_modalImage}
                resizeMode="cover"
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default ProfilePictureEditor;
