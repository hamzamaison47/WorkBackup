import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
} from 'react-native';
import {getFormatText} from './utils';
import RequestedForDropdown from './RequestedForDropdown';

const CertificateDetailsModal = ({
  visible,
  certificate,
  requestedForList,
  selectedRequestedFor,
  onSelectRequestedFor,
  remarks,
  setRemarks,
  onCancel,
  onSend,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Certificate Request</Text>
              <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Certificate Details */}
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Certificate Details</Text>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Type:</Text>
                <Text style={styles.detailValue}>
                  {certificate?.CertificateTypeCode}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Template:</Text>
                <Text style={styles.detailValue}>
                  {certificate?.TemplateName || 'N/A'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Format:</Text>
                <Text style={styles.detailValue}>
                  {getFormatText(certificate?.LetterGenerationType)}
                </Text>
              </View>
            </View>

            {/* Requested For Dropdown */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Requested For</Text>
              <RequestedForDropdown
                data={requestedForList}
                selectedValue={selectedRequestedFor} // Pass the full object
                onSelect={onSelectRequestedFor} // Pass the function directly
              />
            </View>

            {/* Remarks */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Remarks</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Enter any additional information..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                value={remarks}
                onChangeText={setRemarks}
                textAlignVertical="top"
                maxLength={500}
              />
              <Text style={styles.charCount}>{remarks.length}/500</Text>
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.sendButton} onPress={onSend}>
                <Text style={styles.sendButtonText}>Send Request</Text>
              </TouchableOpacity>
              {/* <TouchableOpacity
                style={[
                  styles.sendButton,
                  !selectedRequestedFor && styles.sendButtonDisabled,
                ]}
                onPress={onSend}
                disabled={!selectedRequestedFor}>
                <Text style={styles.sendButtonText}>Send Request</Text>
              </TouchableOpacity> */}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default CertificateDetailsModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },

  // HEADER
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: 0.3,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#475569',
    fontWeight: '600',
  },

  // DETAILS SECTION
  detailsSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
    width: 90,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1e293b',
    flex: 1,
    fontWeight: '600',
  },

  // INPUTS
  inputSection: {
    marginBottom: 22,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  required: {color: '#dc2626'},
  textArea: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#1e293b',
    minHeight: 100,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  charCount: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'right',
    marginTop: 4,
  },

  // BUTTONS
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    paddingBottom: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  sendButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
  },
  sendButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
});
