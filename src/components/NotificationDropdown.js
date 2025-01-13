import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Modal,
  ScrollView,
} from 'react-native';
import {approve} from '../API/WorkflowTrackingStatusTable/approve';
import {reject} from '../API/WorkflowTrackingStatusTable/reject';
import Icon from 'react-native-vector-icons/FontAwesome';

const NotificationDropdown = ({visible, notifications, onClose}) => {
  console.log('not', notifications); // For debugging
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  if (!visible) return null;

  // Format notifications to display document and document type
  const formattedNotifications = notifications.map(
    notification => `You have a ${notification.document} to approve`,
  );

  const openModal = notification => {
    setSelectedNotification(notification);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedNotification(null);
  };

  // Handler for Approve button
  const handleApprove = async () => {
    if (selectedNotification) {
      const data = await approve({
        correlationId: selectedNotification.correlationId,
      }); // Pass correlationId to the onApprove function
      closeModal();
    }
  };

  // Handler for Reject button
  const handleReject = async () => {
    if (selectedNotification) {
      const data = await reject({
        correlationId: selectedNotification.correlationId,
      }); // Pass correlationId to the onReject function
      closeModal();
    }
  };

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback>
          <View style={styles.dropdownContainer}>
            <View style={styles.dropdownContent}>
              <Text style={styles.dropdownTitle}>Notifications</Text>

              {/* ScrollView to allow scrolling through notifications */}
              <ScrollView style={styles.scrollView}>
                {formattedNotifications.map((message, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => openModal(notifications[index])}>
                    <Text style={styles.dropdownText}>{message}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Icon name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>

        {/* Modal for displaying selected notification details */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={closeModal} // Handle back button press
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Notification Detail</Text>
              <Text style={styles.modalText}>
                {selectedNotification ? selectedNotification.document : ''}
              </Text>
              <Text style={styles.modalText}>
                {selectedNotification ? selectedNotification.documentType : ''}
              </Text>
              <Text style={styles.modalText}>
                Correlation ID:{' '}
                {selectedNotification ? selectedNotification.correlationId : ''}
              </Text>

              {/* Buttons for Approve, Reject, and Close */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.approveButton}
                  onPress={handleApprove}>
                  <Text style={styles.buttonText}>Approve</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={handleReject}>
                  <Text style={styles.buttonText}>Reject</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={closeModal}>
                  <Text style={styles.modalCloseButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Semi-transparent overlay
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  dropdownContainer: {
    marginTop: 60, // Adjust based on your header height
    marginRight: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    width: 250, // Ensure consistency in width
  },
  dropdownContent: {
    padding: 15,
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFA500',
    marginBottom: 10,
    textAlign: 'center',
  },
  dropdownText: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE', // Add subtle separators
    paddingBottom: 5,
  },
  closeButton: {
    alignItems: 'center',
    marginTop: 10,
  },
  scrollView: {
    maxHeight: 200, // Set a reasonable height for scrolling
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#000',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 5,
  },
  rejectButton: {
    backgroundColor: '#F44336',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 5,
  },
  modalCloseButton: {
    backgroundColor: '#FFA500',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalCloseButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default NotificationDropdown;
