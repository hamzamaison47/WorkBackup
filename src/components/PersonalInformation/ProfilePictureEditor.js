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
import CustomIndicator from '../CustomIndicator/CustomIndicator';
import styles from '../../styles/styles';

const ProfilePictureEditor = ({isLoading, profilePictureUrl, userData}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

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

  const handleOpenModal = () => {
    if (profilePictureUrl) {
      setIsModalVisible(true);
    }
  };

  return (
    <View style={styles.PPEdit_headerContainer}>
      <View style={styles.PPEdit_profileImageWrapper}>
        <TouchableOpacity
          onPress={handleOpenModal}
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
      </View>

      <Text style={styles.PPEdit_headerTitle}>
        {userData?.employeeName || 'Username'}
      </Text>

      <Modal
        transparent={true}
        visible={isModalVisible}
        animationType="fade"
        onRequestClose={handleCancel}>
        <TouchableWithoutFeedback onPress={handleCancel}>
          <View style={styles.PPEdit_modalOverlay}>
            <View style={styles.PPEdit_modalContent}>
              <Image
                source={{uri: profilePictureUrl}}
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
