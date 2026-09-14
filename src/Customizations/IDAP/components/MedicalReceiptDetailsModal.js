/* eslint-disable curly */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
//
// MedicalReceiptDetailsModal — serves BOTH the Medical Expense line and header.
// Caller passes recordRefRecId + tableName + retrieveApi. Defaults are the LINE
// values so existing line usage is unchanged. Retrieve reads FileBase64 inline
// (both line and header retrieve APIs return inline bytes), so download needs no
// second call. Upload/delete use the generic SaveAttachmentByteArray /
// DeleteAttachmentRecord ops, keyed on whatever table+RecId the caller passes.
// UI matches DynamicAttachmentModal.
import React, {useEffect, useState} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import DocumentPicker from 'react-native-document-picker';
import {launchCamera} from 'react-native-image-picker';
import RNFS from 'react-native-fs';

import {RetrieveMedicalLineReceipts} from '../API/ExpenseManagement/Lines/Receipt/RetrieveMedicalLineReceipts';
import {DeleteAttachmentRecord} from '../../../API/ExpenseManagment/Receipt/DeleteAttachmentRecord';
import {SaveAttachmentByteArray} from '../../../API/ExpenseManagment/Receipt/SaveAttachmentByteArray';

import AlertModal from '../../../components/Alert/AlertModal';
import AlertDeleteModal from '../../../components/Alert/AlertDeleteModal';
import notificationService from '../../../Controller/notificationService';

import styles from '../../../styles/styles';
import {iconSize} from '../../../store/utils/scaling';
import usePalette from '../../../hooks/usePalette';
import useNotify from '../../../hooks/useNotify';

/**
 * @param {boolean}  visible        - Controls modal visibility
 * @param {function} onClose        - Called when the modal should close
 * @param {number}   recordRefRecId - Header RecId or line RecId (the record to bind to)
 * @param {string}   tableName      - Physical table the attachment binds on
 * @param {function} retrieveApi    - Retrieve fn taking (recId) → attachment[]
 * @param {number}   lineRecId      - Back-compat for existing line callers
 * @param {string}   legalEntity    - Legal entity (for upload)
 * @param {string}   employeeId     - Employee id (for upload)
 * @param {boolean}  showTakePhoto  - default true
 * @param {boolean}  showChooseFile - default true
 * @param {boolean}  showDownload   - default true
 * @param {boolean}  showDelete     - default true
 */
const MedicalReceiptDetailsModal = ({
  visible,
  onClose,
  recordRefRecId,
  tableName = 'SLD_MediExpLineDetails',
  retrieveApi = RetrieveMedicalLineReceipts,
  lineRecId,
  legalEntity,
  employeeId,
  showTakePhoto = true,
  showChooseFile = true,
  showDownload = true,
  showDelete = true,
}) => {
  const P = usePalette();
  const {notifyError, notifySuccess} = useNotify('Medical Expense Receipts');

  const effectiveRecId = recordRefRecId || lineRecId;

  const [attachments, setAttachments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [deleteModal, setDeleteModal] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState(null);
  const [isDeleteProcessing, setIsDeleteProcessing] = useState(false);
  const [processingAction, setProcessingAction] = useState(null);

  useEffect(() => {
    if (visible && effectiveRecId) {
      loadExistingAttachments();
    } else {
      setAttachments([]);
      setIsLoading(false);
      setProcessingAction(null);
      setAttachmentToDelete(null);
    }
  }, [visible, effectiveRecId]);

  const loadExistingAttachments = async () => {
    if (!effectiveRecId) {
      console.log('MedicalReceiptDetailsModal: No record RecId found');
      return;
    }
    setIsLoading(true);
    try {
      const result = await retrieveApi(effectiveRecId);
      const formatted = Array.isArray(result)
        ? result.map((att, index) => ({
            id:
              att.RecId !== undefined && att.RecId !== '' && att.RecId !== null
                ? String(att.RecId)
                : `attachment-${index}-${Date.now()}`,
            docuRefRecId: att.RecId,
            name: att.OriginalFileName || att.Name || 'Attachment',
            type: att.FileType || 'application/octet-stream',
            fileBase64: att.FileBase64 || '',
            isExisting: true,
          }))
        : [];
      setAttachments(formatted);
    } catch (error) {
      console.error('Error loading medical receipts:', error);
      setAlertMessage('Failed to load existing attachments');
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (isRefreshing || isLoading || isAnyProcessing) return;
    setIsRefreshing(true);
    try {
      await loadExistingAttachments();
    } finally {
      setIsRefreshing(false);
    }
  };

  const convertToBase64 = async uri => {
    try {
      return await RNFS.readFile(uri, 'base64');
    } catch (error) {
      console.error('Error converting to base64:', error);
      throw new Error('Failed to convert file to base64');
    }
  };

  const getFileExtension = filename => {
    const parts = String(filename || '').split('.');
    if (parts.length <= 1) return '';
    return parts.pop().toLowerCase();
  };

  const takePhoto = async () => {
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
        includeBase64: true,
      });

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        let base64 = asset.base64;
        if (!base64 && asset.uri) base64 = await convertToBase64(asset.uri);

        const timestamp = Date.now();
        setAttachments(prev => [
          ...prev,
          {
            id: `temp_${timestamp}`,
            uri: asset.uri,
            name: `attachment_${timestamp}.jpg`,
            base64,
            type: 'image/jpeg',
            extension: 'jpg',
            isNew: true,
          },
        ]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      setAlertMessage('Failed to take photo');
      setAlertModal(true);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [
          DocumentPicker.types.images,
          DocumentPicker.types.pdf,
          DocumentPicker.types.doc,
          DocumentPicker.types.docx,
          DocumentPicker.types.xls,
          DocumentPicker.types.xlsx,
          DocumentPicker.types.ppt,
          DocumentPicker.types.pptx,
          DocumentPicker.types.plainText,
          DocumentPicker.types.allFiles,
        ],
      });

      const file = result[0];
      const base64 = await convertToBase64(file.uri);
      const originalExtension = getFileExtension(file.name);
      const finalExtension =
        originalExtension || file.type?.split('/').pop() || '';

      const cleanFileName =
        !originalExtension && finalExtension && !file.name.includes('.')
          ? `${file.name}.${finalExtension}`
          : file.name;

      setAttachments(prev => [
        ...prev,
        {
          id: `temp_${Date.now()}`,
          uri: file.uri,
          name: cleanFileName,
          base64,
          type: file.type,
          extension: finalExtension,
          isNew: true,
        },
      ]);
    } catch (error) {
      if (!DocumentPicker.isCancel(error)) {
        console.error('Error picking document:', error);
        setAlertMessage('Failed to pick document');
        setAlertModal(true);
      }
    }
  };

  const closeDeleteModal = () => {
    if (isDeleteProcessing) return;
    setDeleteModal(false);
    setAttachmentToDelete(null);
  };

  const handleDeleteAttachment = async () => {
    if (!attachmentToDelete) return;

    const attachment = attachments.find(a => a.id === attachmentToDelete);
    if (!attachment) return;

    if (attachment.isNew) {
      setAttachments(prev => prev.filter(a => a.id !== attachmentToDelete));
      setDeleteModal(false);
      setAttachmentToDelete(null);
      return;
    }

    if (!attachment.docuRefRecId) return;

    setIsDeleteProcessing(true);
    setProcessingAction(`delete_${attachmentToDelete}`);

    try {
      const result = await DeleteAttachmentRecord({
        recId: attachment.docuRefRecId,
      });

      if (result.success) {
        notifySuccess('Attachment deleted successfully');
        setAttachments(prev => prev.filter(a => a.id !== attachmentToDelete));
        setAlertMessage('Attachment deleted successfully');
      } else {
        notifyError(result.message || 'Failed to delete attachment');
        setAlertMessage(result.message || 'Failed to delete attachment');
      }
      setAlertModal(true);
    } catch (error) {
      console.error('Error deleting attachment:', error);
      notifyError(error.message || 'Failed to delete attachment');
      setAlertMessage(error.message || 'Failed to delete attachment');
      setAlertModal(true);
    } finally {
      setIsDeleteProcessing(false);
      setProcessingAction(null);
      setDeleteModal(false);
      setAttachmentToDelete(null);
      setTimeout(() => loadExistingAttachments(), 600);
    }
  };

  const removeAttachment = attachmentId => {
    const attachment = attachments.find(a => a.id === attachmentId);
    if (attachment?.isNew) {
      setAttachments(prev => prev.filter(a => a.id !== attachmentId));
      return;
    }
    setAttachmentToDelete(attachmentId);
    setDeleteModal(true);
  };

  const downloadAttachment = async attachment => {
    if (!attachment.fileBase64) {
      notifyError('Cannot download: file content is missing.');
      setAlertMessage('Cannot download: file content is missing.');
      setAlertModal(true);
      return;
    }

    setProcessingAction(`download_${attachment.id}`);
    try {
      const cleanBase64 = String(attachment.fileBase64).replace(
        /^data:.*;base64,/,
        '',
      );

      let fileName = attachment.name || 'receipt';
      if (!fileName.includes('.') && attachment.type) {
        fileName = `${fileName}.${attachment.type}`;
      }

      const filePath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
      await RNFS.writeFile(filePath, cleanBase64, 'base64');

      const fileExists = await RNFS.exists(filePath);
      const fileInfo = await RNFS.stat(filePath);

      if (fileExists && fileInfo.size > 0) {
        notificationService.showReceiptDownloadNotification(fileName, filePath);
        setAlertMessage(`Attachment downloaded successfully: ${fileName}`);
      } else {
        setAlertMessage('File was created but appears to be empty');
      }
      setAlertModal(true);
    } catch (error) {
      console.error('Error downloading attachment:', error);
      notificationService.showErrorNotification(
        `Download failed: ${error.message}`,
      );
      setAlertMessage(`Download failed: ${error.message}`);
      setAlertModal(true);
    } finally {
      setProcessingAction(null);
    }
  };

  const handleSave = async () => {
    const newAttachments = attachments.filter(a => a.isNew);

    if (newAttachments.length === 0) {
      setAlertMessage('No new attachments to upload');
      setAlertModal(true);
      return;
    }
    if (!effectiveRecId) {
      setAlertMessage('Missing record RecId for upload.');
      setAlertModal(true);
      return;
    }

    setProcessingAction('save');
    try {
      for (const attachment of newAttachments) {
        let fileExt = getFileExtension(attachment.name);
        if (!fileExt && attachment.type) {
          fileExt = attachment.type.split('/')[1] || '';
        }
        if (fileExt && !fileExt.startsWith('.')) fileExt = '.' + fileExt;
        if (!fileExt) fileExt = '.bin';

        const base64Variants = [
          attachment.base64,
          (() => {
            let b = attachment.base64;
            while (b.length % 4 !== 0) b += '=';
            return b;
          })(),
        ];

        let success = false;
        let lastError = null;

        for (const fileByteArray of base64Variants) {
          try {
            const saveResult = await SaveAttachmentByteArray({
              recordRefRecId: effectiveRecId,
              tableName,
              legalEntity,
              employeeId,
              fileName: attachment.name,
              fileExt,
              fileByteArray,
            });

            if (saveResult.IsSuccess) {
              success = true;
              break;
            } else {
              lastError = saveResult.Message;
            }
          } catch (err) {
            lastError = err.message;
          }
        }

        if (!success) throw new Error(lastError || 'Failed to save attachment');

        setAttachments(prev =>
          prev.map(a =>
            a.id === attachment.id ? {...a, isExisting: true, isNew: false} : a,
          ),
        );

        await new Promise(resolve => setTimeout(resolve, 300));
      }

      notificationService.showReceiptUploadNotification(newAttachments.length);
      notifySuccess(`${newAttachments.length} attachment(s) uploaded`);
      setAlertMessage(
        `${newAttachments.length} attachment(s) uploaded successfully`,
      );
      setAlertModal(true);

      setTimeout(() => loadExistingAttachments(), 1000);
    } catch (error) {
      console.error('Error saving attachments:', error);
      notifyError(`Failed to save attachments: ${error.message}`);
      setAlertMessage(`Failed to save attachments: ${error.message}`);
      setAlertModal(true);
    } finally {
      setProcessingAction(null);
    }
  };

  const isAnyProcessing = processingAction !== null;
  const isSaveDisabled =
    isAnyProcessing || attachments.filter(a => a.isNew).length === 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <View style={styles.DAM_modalOverlay}>
        <View style={styles.DAM_modalContainer}>
          {/* Header */}
          <View style={styles.DAM_modalHeader}>
            <Text style={styles.DAM_modalTitle}>Medical Expense Receipts</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.DAM_closeButton}
              disabled={isAnyProcessing}>
              <Text style={styles.DAM_closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Add Attachment Buttons */}
          {(showTakePhoto || showChooseFile) && (
            <View style={styles.DAM_buttonSection}>
              <Text style={styles.DAM_sectionTitle}>Add Attachment</Text>
              <View style={styles.DAM_addButtonContainer}>
                {showTakePhoto && (
                  <TouchableOpacity
                    style={[
                      styles.DAM_addButton,
                      isAnyProcessing && styles.DAM_disabledButton,
                      !showChooseFile && {flex: 1},
                    ]}
                    onPress={takePhoto}
                    disabled={isAnyProcessing}>
                    <Text style={styles.DAM_addButtonText}>📸 Take Photo</Text>
                  </TouchableOpacity>
                )}
                {showChooseFile && (
                  <TouchableOpacity
                    style={[
                      styles.DAM_addButton,
                      isAnyProcessing && styles.DAM_disabledButton,
                      !showTakePhoto && {flex: 1},
                    ]}
                    onPress={pickDocument}
                    disabled={isAnyProcessing}>
                    <Text style={styles.DAM_addButtonText}>📁 Choose File</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Attachments List */}
          <View style={styles.DAM_attachmentsSection}>
            <View style={styles.DAM_attachmentsSectionHeader}>
              <Text style={styles.DAM_sectionTitle}>
                Attachments ({attachments.length})
              </Text>
              <TouchableOpacity
                style={[
                  styles.DAM_refreshButton,
                  {backgroundColor: P.primary},
                  (isRefreshing || isLoading || isAnyProcessing) &&
                    styles.DAM_refreshButtonDisabled,
                ]}
                onPress={handleRefresh}
                disabled={isRefreshing || isLoading || isAnyProcessing}>
                {isRefreshing ? (
                  <ActivityIndicator size="small" color={P.onPrimary} />
                ) : (
                  <FontAwesome
                    name="refresh"
                    size={iconSize.xs}
                    color={P.onPrimary}
                  />
                )}
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <View style={styles.DAM_loadingContainer}>
                <ActivityIndicator size="large" color={P.primaryStrong} />
                <Text style={styles.DAM_loadingText}>
                  Loading attachments...
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.DAM_attachmentsScrollView}
                showsVerticalScrollIndicator={false}>
                {attachments.length === 0 ? (
                  <Text style={styles.DAM_noAttachmentsText}>
                    No attachments added. Add files using the buttons above.
                  </Text>
                ) : (
                  attachments.map((attachment, index) => (
                    <View
                      key={attachment.id || `attachment-${index}`}
                      style={styles.DAM_attachmentItem}>
                      <View style={styles.DAM_attachmentInfo}>
                        <Text
                          style={styles.DAM_attachmentName}
                          numberOfLines={2}>
                          {attachment.name || `Attachment ${index + 1}`}
                        </Text>
                        {attachment.isNew && (
                          <Text style={styles.DAM_newBadge}>New</Text>
                        )}
                        {attachment.isExisting && (
                          <Text style={styles.DAM_existingBadge}>Uploaded</Text>
                        )}
                      </View>
                      <View style={styles.DAM_attachmentActions}>
                        {showDownload && attachment.isExisting && (
                          <TouchableOpacity
                            style={[
                              styles.DAM_downloadButton,
                              {backgroundColor: P.primary},
                              isAnyProcessing &&
                                styles.DAM_disabledActionButton,
                            ]}
                            onPress={() => downloadAttachment(attachment)}
                            disabled={isAnyProcessing}>
                            {processingAction ===
                            `download_${attachment.id}` ? (
                              <ActivityIndicator
                                size="small"
                                color={P.onPrimary}
                              />
                            ) : (
                              <FontAwesome
                                name="download"
                                size={iconSize.xs}
                                color={P.onPrimary}
                              />
                            )}
                          </TouchableOpacity>
                        )}
                        {showDelete && (
                          <TouchableOpacity
                            style={[
                              styles.DAM_removeButton,
                              isAnyProcessing &&
                                styles.DAM_disabledActionButton,
                            ]}
                            onPress={() => removeAttachment(attachment.id)}
                            disabled={isAnyProcessing}>
                            {processingAction === `delete_${attachment.id}` ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <FontAwesome
                                name="trash"
                                size={iconSize.xs}
                                color="#fff"
                              />
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
            )}
          </View>

          {/* Action Buttons */}
          {(showChooseFile || showTakePhoto) && (
            <View style={styles.DAM_buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.DAM_cancelButton,
                  isAnyProcessing && styles.DAM_disabledButton,
                ]}
                onPress={onClose}
                disabled={isAnyProcessing}>
                <Text style={styles.DAM_cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.DAM_saveButton,
                  isSaveDisabled && styles.DAM_saveButtonDisabled,
                ]}
                onPress={handleSave}
                disabled={isSaveDisabled}>
                {processingAction === 'save' ? (
                  <ActivityIndicator size="small" color={P.onPrimary} />
                ) : (
                  <Text style={styles.DAM_saveButtonText}>
                    Save ({attachments.filter(a => a.isNew).length})
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <AlertModal
        visible={alertModal}
        heading="Attachments"
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />

      <AlertDeleteModal
        visible={deleteModal}
        heading="Confirm Deletion"
        text="Are you sure you want to delete this attachment? This action cannot be undone."
        onPress={handleDeleteAttachment}
        onCancel={closeDeleteModal}
        isProcessing={isDeleteProcessing}
      />
    </Modal>
  );
};

export default MedicalReceiptDetailsModal;
