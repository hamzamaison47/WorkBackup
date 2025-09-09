/* eslint-disable curly */
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
import styles from '../../styles/styles';

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

  const getInitials = name => {
    if (!name) return 'UN';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
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
          ) : profilePictureUrl ? (
            <Image
              source={{uri: profilePictureUrl}}
              style={styles.PPEdit_profilePicture}
            />
          ) : (
            <View
              style={[
                styles.PPEdit_profilePicture,
                styles.PPEdit_initialsContainer,
              ]}>
              <Text style={styles.PPEdit_initialsText}>
                {getInitials(userData?.employeeName)}
              </Text>
            </View>
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
              {profilePictureUrl ? (
                <Image
                  source={{uri: profilePictureUrl}}
                  style={styles.PPEdit_modalImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.PPEdit_modalImage}>
                  <Text style={styles.PPEdit_initialsTextModal}>
                    {getInitials(userData?.employeeName)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default ProfilePictureEditor;
