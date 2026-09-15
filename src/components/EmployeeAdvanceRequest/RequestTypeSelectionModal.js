import React from 'react';
import {View, Text, Modal, TouchableOpacity, Pressable} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import styles from '../../styles/styles';
import usePalette from '../../hooks/usePalette';

const RequestTypeSelectionModal = ({visible, onClose, onSelectType}) => {
  const P = usePalette();
  const requestTypes = [
    {
      type: 'Loan',
      advanceType: 0,
      title: 'Loan Request',
      description: 'Create a new loan request',
      icon: 'cash-outline',
      color: '#2E7D32',
    },
    {
      type: 'Advance',
      advanceType: 1,
      title: 'Advance Salary',
      description: 'Create an advance salary request',
      icon: 'cash-outline',
      color: P.primaryStrong,
    },
  ];

  const handleSelectType = selectedType => {
    onSelectType(selectedType);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable style={styles.RTSModal_ModalOverlay} onPress={onClose}>
        <Pressable style={styles.RTSModal_ModalContent} onPress={() => {}}>
          {/* Header */}
          <View style={styles.RTSModal_ModalHeader}>
            <Text style={styles.RTSModal_ModalTitle}>Select Request Type</Text>
          </View>

          {/* Request Type Options */}
          <View style={styles.RTSModal_OptionsContainer}>
            {requestTypes.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.RTSModal_OptionCard,
                  {borderLeftColor: item.color},
                ]}
                onPress={() => handleSelectType(item)}
                activeOpacity={0.8}>
                <View style={styles.RTSModal_IconContainer}>
                  <Icon name={item.icon} size={28} color={item.color} />
                </View>
                <View style={styles.RTSModal_TextContainer}>
                  <Text style={styles.RTSModal_OptionTitle}>{item.title}</Text>
                  {/* <Text style={styles.RTSModal_OptionDescription}>
                    {item.description}
                  </Text> */}
                </View>
                <View style={styles.RTSModal_ArrowContainer}>
                  <Icon name="chevron-forward" size={20} color="#999" />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Cancel Button */}
          <TouchableOpacity
            style={styles.RTSModal_CancelButton}
            onPress={onClose}>
            <Text style={styles.RTSModal_CancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default RequestTypeSelectionModal;
