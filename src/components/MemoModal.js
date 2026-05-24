/* eslint-disable react-native/no-inline-styles */
import React, {useState} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';

import styles from '../styles/styles';

const MemoModal = ({
  visible,
  title = 'Enter Comment',
  placeholder = 'Write instructions or comments...',
  onClose,
  onSubmit,
  isProcessing = false,
}) => {
  const [memoText, setMemoText] = useState('');

  const handleSubmit = () => {
    onSubmit(memoText);
    setMemoText('');
  };

  const handleClose = () => {
    if (isProcessing) {
      return;
    }
    setMemoText('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}>
      <View style={styles.DAM_modalOverlay}>
        <View style={styles.DAM_modalContainer}>
          {/* Header */}
          <View style={styles.DAM_modalHeader}>
            <Text style={styles.DAM_modalTitle}>{title}</Text>

            <TouchableOpacity
              onPress={handleClose}
              style={styles.DAM_closeButton}
              disabled={isProcessing}>
              <Text style={styles.DAM_closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View style={{padding: 15}}>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#f7e8e8',
                borderRadius: 8,
                minHeight: 120,
                padding: 10,
                fontSize: 14,
                textAlignVertical: 'top',
                color: '#000',
                backgroundColor: '#fff',
              }}
              editable={!isProcessing}
              multiline
              placeholder={placeholder}
              value={memoText}
              onChangeText={setMemoText}
            />
          </View>

          {/* Footer Buttons */}
          <View style={styles.DAM_buttonContainer}>
            <TouchableOpacity
              style={styles.DAM_cancelButton}
              onPress={handleClose}
              disabled={isProcessing}>
              <Text style={styles.DAM_cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.DAM_saveButton]}
              disabled={isProcessing}
              onPress={handleSubmit}>
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.DAM_saveButtonText}>OK</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default MemoModal;
