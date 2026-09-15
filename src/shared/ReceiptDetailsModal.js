/* eslint-disable curly */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
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

import {RetrieveReceipts} from '../API/ExpenseManagment/Receipt/RetrieveReciepts';
import {DeleteReceipts} from '../API/ExpenseManagment/Receipt/DeleteReceipts';
import {RetrieveAttachment} from '../API/ExpenseManagment/Receipt/RetrieveAttachment';
import {UploadReceipt} from '../API/ExpenseManagment/Receipt/UploadReceipt';
import {AttachReceiptToExpenseLine} from '../API/ExpenseManagment/Receipt/AttachReceiptToExpenseLine';
import notificationService from '../Controller/notificationService';

import AlertDeleteModal from '../components/Alert/AlertDeleteModal';
import AlertModal from '../components/Alert/AlertModal';

import styles from '../styles/styles';
import {iconSize} from '../store/utils/scaling';
import brand from '../theme/brand';

/**
 * ReceiptDetailsModal
 *
 * A fully generic receipt modal that mirrors DynamicAttachmentModal's structure,
 * props, and behaviour exactly — the only difference is the upload API flow:
 *   UploadReceipt → AttachReceiptToExpenseLine
 * instead of SaveAttachmentByteArray used by DynamicAttachmentModal.
 *
 * Do NOT merge these two modals — the API flow is intentionally different.
 *
 * @param {boolean}  visible               - Controls modal visibility
 * @param {object}   recordData            - The record object. Must contain a numeric ID
 *                                           accessible via the `recordIdKey` prop.
 * @param {string}   recordIdKey           - Key to extract the record ID from recordData
 *                                           (default: 'RecId')
 * @param {string}   transactionNumberKey  - Key to extract the transaction number from
 *                                           recordData, passed to AttachReceiptToExpenseLine
 *                                           (default: 'ExpenseTransactionNumber')
 * @param {string}   tableName             - Table name sent to RetrieveReceipts API (required)
 * @param {function} onClose               - Called when the modal should close
 * @param {function} onSave                - Called after a successful upload
 * @param {string}   legalEntity           - Legal entity identifier
 * @param {string}   employeeId            - Employee ID
 * @param {string}   employeeName          - Employee name (optional)
 * @param {string}   modalTitle            - Modal header title (default: "Manage Receipts")
 *
 * Display Configuration Props:
 * @param {boolean}  showDetails           - Show/hide the details section (default: false)
 * @param {Array}    detailFields          - [{key, label}] fields to display in details section
 * @param {object}   detailData            - Data object for detail fields
 * @param {boolean}  showTakePhoto         - Show take-photo button (default: true)
 * @param {boolean}  showChooseFile        - Show choose-file button (default: true)
 * @param {boolean}  showDownload          - Show download button on existing receipts (default: true)
 * @param {boolean}  showDelete            - Show delete button on receipts (default: true)
 */
const ReceiptDetailsModal = ({
  visible,
  recordData,
  recordIdKey = 'RecId',
  transactionNumberKey = 'ExpenseTransactionNumber',
  tableName,
  onClose,
  onSave,
  legalEntity,
  employeeId,
  employeeName,
  modalTitle = 'Manage Receipts',
  showDetails = false,
  detailFields = [],
  detailData = {},
  showTakePhoto = true,
  showChooseFile = true,
  showDownload = true,
  showDelete = true,
}) => {
  const [receipts, setReceipts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [deleteModal, setDeleteModal] = useState(false);
  const [processingAction, setProcessingAction] = useState(null);
  const [isDeleteProcessing, setIsDeleteProcessing] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState(null);

  // Dynamically resolve IDs using the provided keys — same pattern as DynamicAttachmentModal
  const recordId = recordData?.[recordIdKey];
  const transactionNumber = recordData?.[transactionNumberKey];

  useEffect(() => {
    if (visible && recordId) {
      loadExistingReceipts();
    } else {
      setReceipts([]);
      setIsLoading(false);
      setProcessingAction(null);
      setReceiptToDelete(null);
    }
  }, [visible, recordId]);

  // ─── Data Loading ─────────────────────────────────────────────────────────

  const loadExistingReceipts = async () => {
    if (!recordId) {
      console.log('ReceiptDetailsModal: No Record ID found');
      return;
    }

    setIsLoading(true);
    try {
      const result = await RetrieveReceipts({
        recordRefRecId: recordId,
        tableName: tableName,
      });

      if (result.success && result.attachments) {
        const formattedReceipts = Array.isArray(result.attachments)
          ? result.attachments.map((att, index) => ({
              id: att['a:RecId'] || `attachment-${index}-${Date.now()}`,
              docuRefRecId: att['a:RecId'],
              name: att['a:Name'] || att['a:OriginalFileName'] || 'Attachment',
              type: att['a:FileType'] || 'application/octet-stream',
              isExisting: true,
            }))
          : [];
        setReceipts(formattedReceipts);
      }
    } catch (error) {
      console.error('Error loading receipts:', error);
      setAlertMessage('Failed to load existing receipts');
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (isRefreshing || isLoading || isAnyProcessing) return;
    setIsRefreshing(true);
    try {
      await loadExistingReceipts();
    } finally {
      setIsRefreshing(false);
    }
  };

  // ─── File Helpers ──────────────────────────────────────────────────────────

  const convertToBase64 = async uri => {
    try {
      return await RNFS.readFile(uri, 'base64');
    } catch (error) {
      console.error('Error converting to base64:', error);
      throw new Error('Failed to convert file to base64');
    }
  };

  const getFileExtension = filename => {
    const parts = filename.split('.');
    if (parts.length <= 1) return '';
    return parts.pop().toLowerCase();
  };

  const getContentType = filename => {
    const extension = filename.split('.').pop().toLowerCase();
    const contentTypeMap = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      txt: 'text/plain',
      rtf: 'application/rtf',
      csv: 'text/csv',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      bmp: 'image/bmp',
      tiff: 'image/tiff',
      tif: 'image/tiff',
      svg: 'image/svg+xml',
      heic: 'image/heic',
      heif: 'image/heif',
    };
    return contentTypeMap[extension] || 'application/octet-stream';
  };

  // ─── Add Receipts ──────────────────────────────────────────────────────────

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
        if (!base64 && asset.uri) {
          base64 = await convertToBase64(asset.uri);
        }
        const timestamp = Date.now();
        setReceipts(prev => [
          ...prev,
          {
            id: `temp_${timestamp}`,
            uri: asset.uri,
            name: `receipt_${timestamp}.jpg`,
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

      setReceipts(prev => [
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

  // ─── Delete ────────────────────────────────────────────────────────────────

  /**
   * Single source of truth for closing the delete confirm modal.
   * Blocked while the API call is in-flight so the user cannot
   * accidentally dismiss it mid-deletion.
   */
  const closeDeleteModal = () => {
    if (isDeleteProcessing) return;
    setDeleteModal(false);
    setReceiptToDelete(null);
  };

  const handleDeleteReceipt = async () => {
    if (!receiptToDelete) return;

    const receipt = receipts.find(r => r.id === receiptToDelete);
    if (!receipt) return;

    // Locally-added (not yet uploaded) — no API call needed, just remove
    if (receipt.isNew) {
      setReceipts(prev => prev.filter(r => r.id !== receiptToDelete));
      setDeleteModal(false);
      setReceiptToDelete(null);
      return;
    }

    if (!receipt.docuRefRecId) return;

    // Show spinner on the confirm button and disable cancel
    setIsDeleteProcessing(true);
    setProcessingAction(`delete_${receiptToDelete}`);

    try {
      const result = await DeleteReceipts({
        docuRefRecIds: [receipt.docuRefRecId],
      });

      if (result.success) {
        setReceipts(prev => prev.filter(r => r.id !== receiptToDelete));
        setAlertMessage('Receipt deleted successfully');
      } else {
        setAlertMessage('Failed to delete receipt');
      }
      setAlertModal(true);
    } catch (error) {
      console.error('Error deleting receipt:', error);
      setAlertMessage(error.message || 'Failed to delete receipt');
      setAlertModal(true);
    } finally {
      // Always reset flags first, then close modal
      setIsDeleteProcessing(false);
      setProcessingAction(null);
      setDeleteModal(false);
      setReceiptToDelete(null);
    }
  };

  const removeReceipt = receiptId => {
    const receipt = receipts.find(r => r.id === receiptId);

    // New receipts: skip confirm modal, remove instantly
    if (receipt?.isNew) {
      setReceipts(prev => prev.filter(r => r.id !== receiptId));
      return;
    }

    // Existing: show confirm modal
    setReceiptToDelete(receiptId);
    setDeleteModal(true);
  };

  // ─── Download ──────────────────────────────────────────────────────────────

  const downloadReceipt = async receipt => {
    if (!receipt.docuRefRecId) {
      setAlertMessage('Cannot download: missing document reference');
      setAlertModal(true);
      return;
    }

    setProcessingAction(`download_${receipt.id}`);

    try {
      const result = await RetrieveAttachment({
        docuRefRecId: receipt.docuRefRecId,
      });

      if (result.success && result.base64) {
        let cleanBase64 = result.base64
          .trim()
          .replace(/<[^>]*>/g, '')
          .replace(/\s/g, '');

        if (cleanBase64.length % 4 !== 0)
          cleanBase64 += '='.repeat(4 - (cleanBase64.length % 4));

        let fileName = result.fileName || receipt.name;
        if (!fileName.includes('.')) {
          const serverType = result.fileType || receipt.type;
          const extension =
            serverType?.split('/').pop()?.split('.').pop() || 'bin';
          fileName = `${fileName}.${extension}`;
        }

        const filePath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
        await RNFS.writeFile(filePath, cleanBase64, 'base64');

        const fileExists = await RNFS.exists(filePath);
        const fileInfo = await RNFS.stat(filePath);

        if (fileExists && fileInfo.size > 0) {
          notificationService.showReceiptDownloadNotification(
            fileName,
            filePath,
          );
          setAlertMessage(`Receipt downloaded successfully: ${fileName}`);
        } else {
          setAlertMessage('File was created but appears to be empty');
        }
        setAlertModal(true);
      } else {
        const errorMsg =
          result.message || 'No attachment content received from server';
        notificationService.showErrorNotification(errorMsg);
        setAlertMessage(errorMsg);
        setAlertModal(true);
      }
    } catch (error) {
      console.error('Error downloading receipt:', error);
      notificationService.showErrorNotification(
        `Download failed: ${error.message}`,
      );
      setAlertMessage(`Download failed: ${error.message}`);
      setAlertModal(true);
    } finally {
      setProcessingAction(null);
    }
  };

  // ─── Save (UploadReceipt → AttachReceiptToExpenseLine) ────────────────────
  // NOTE: This API flow is intentionally different from DynamicAttachmentModal
  // which uses SaveAttachmentByteArray. Do not merge these two modals.

  const handleSave = async () => {
    const newReceipts = receipts.filter(r => r.isNew);

    if (newReceipts.length === 0) {
      setAlertMessage('No new receipts to upload');
      setAlertModal(true);
      return;
    }

    setProcessingAction('save');

    try {
      for (const receipt of newReceipts) {
        const uploadResult = await UploadReceipt({
          legalEntity,
          fileName: receipt.name,
          capturedReceipt: receipt.base64,
          contentType: getContentType(receipt.name),
          fileExtension: receipt.extension,
          employeeId,
        });

        if (!uploadResult.IsSuccess || !uploadResult.Receipts?.length)
          throw new Error(uploadResult.Message || 'Failed to upload receipt');

        const uploadedReceipt = uploadResult.Receipts[0];

        const attachResult = await AttachReceiptToExpenseLine({
          docuRefRecId: uploadedReceipt.docuRefRecId,
          expenseTransactionNumber: transactionNumber,
          legalEntity,
          employeeId,
          isAttach: true,
        });

        if (!attachResult.IsSuccess)
          throw new Error(
            attachResult.Message || 'Failed to attach receipt to record',
          );

        // Mark as uploaded in local state
        setReceipts(prev =>
          prev.map(r =>
            r.id === receipt.id ? {...r, isExisting: true, isNew: false} : r,
          ),
        );

        await new Promise(resolve => setTimeout(resolve, 300));
      }

      notificationService.showReceiptUploadNotification(newReceipts.length);
      setAlertMessage(`${newReceipts.length} receipt(s) uploaded successfully`);
      setAlertModal(true);

      if (onSave) onSave();

      setTimeout(async () => {
        await loadExistingReceipts();
      }, 1000);
    } catch (error) {
      console.error('Error saving receipts:', error);
      setAlertMessage(error.message || 'Failed to save receipts');
      setAlertModal(true);
    } finally {
      setProcessingAction(null);
    }
  };

  // ─── Derived State ─────────────────────────────────────────────────────────

  const isAnyProcessing = processingAction !== null;
  const isSaveDisabled =
    isAnyProcessing || receipts.filter(r => r.isNew).length === 0;

  // ─── Detail Row Renderer ───────────────────────────────────────────────────

  const renderDetailRow = (field, index) => {
    const value = detailData[field.key];
    if (!value || value === 'N/A') return null;

    return (
      <View key={`${field.key}-${index}`} style={styles.DAM_detailRow}>
        <Text style={styles.DAM_detailLabel}>{field.label}:</Text>
        <Text style={styles.DAM_detailValue}>{value}</Text>
      </View>
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────────

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
            <Text style={styles.DAM_modalTitle}>{modalTitle}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.DAM_closeButton}
              disabled={isAnyProcessing}>
              <Text style={styles.DAM_closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Details Section */}
          {showDetails && detailFields.length > 0 && (
            <View style={styles.DAM_detailsSection}>
              <Text style={styles.DAM_sectionTitle}>Details</Text>
              {detailFields.map((field, index) =>
                renderDetailRow(field, index),
              )}
            </View>
          )}

          {/* Add Receipt Buttons */}
          {(showTakePhoto || showChooseFile) && (
            <View style={styles.DAM_buttonSection}>
              <Text style={styles.DAM_sectionTitle}>Add Receipt</Text>
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

          {/* Receipts List */}
          <View style={styles.DAM_attachmentsSection}>
            {/* Section header with Refresh button */}
            <View style={styles.DAM_attachmentsSectionHeader}>
              <Text style={styles.DAM_sectionTitle}>
                Receipts ({receipts.length})
              </Text>
              <TouchableOpacity
                style={[
                  styles.DAM_refreshButton,
                  (isRefreshing || isLoading || isAnyProcessing) &&
                    styles.DAM_refreshButtonDisabled,
                ]}
                onPress={handleRefresh}
                disabled={isRefreshing || isLoading || isAnyProcessing}>
                {isRefreshing ? (
                  <ActivityIndicator size="small" color={brand.onPrimary} />
                ) : (
                  <FontAwesome
                    name="refresh"
                    size={iconSize.xs}
                    color={brand.onPrimary}
                  />
                )}
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <View style={styles.DAM_loadingContainer}>
                <ActivityIndicator size="large" color={brand.primaryStrong} />
                <Text style={styles.DAM_loadingText}>Loading receipts...</Text>
              </View>
            ) : (
              <ScrollView
                style={styles.DAM_attachmentsScrollView}
                showsVerticalScrollIndicator={false}>
                {receipts.length === 0 ? (
                  <Text style={styles.DAM_noAttachmentsText}>
                    No receipts attached. Add receipts using the buttons above.
                  </Text>
                ) : (
                  receipts.map((receipt, index) => (
                    <View
                      key={receipt.id || `receipt-${index}`}
                      style={styles.DAM_attachmentItem}>
                      <View style={styles.DAM_attachmentInfo}>
                        <Text
                          style={styles.DAM_attachmentName}
                          numberOfLines={2}>
                          {receipt.name || `Receipt ${index + 1}`}
                        </Text>
                        {receipt.isNew && (
                          <Text style={styles.DAM_newBadge}>New</Text>
                        )}
                        {receipt.isExisting && (
                          <Text style={styles.DAM_existingBadge}>Uploaded</Text>
                        )}
                      </View>

                      <View style={styles.DAM_attachmentActions}>
                        {showDownload && receipt.isExisting && (
                          <TouchableOpacity
                            style={[
                              styles.DAM_downloadButton,
                              isAnyProcessing &&
                                styles.DAM_disabledActionButton,
                            ]}
                            onPress={() => downloadReceipt(receipt)}
                            disabled={isAnyProcessing}>
                            {processingAction === `download_${receipt.id}` ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <FontAwesome
                                name="download"
                                size={iconSize.xs}
                                color="#fff"
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
                            onPress={() => removeReceipt(receipt.id)}
                            disabled={isAnyProcessing}>
                            {processingAction === `delete_${receipt.id}` ? (
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
                <ActivityIndicator size="small" color={brand.onPrimary} />
              ) : (
                <Text style={styles.DAM_saveButtonText}>
                  Save ({receipts.filter(r => r.isNew).length})
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <AlertModal
        visible={alertModal}
        heading="Receipts"
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />

      <AlertDeleteModal
        visible={deleteModal}
        heading="Confirm Deletion"
        text="Are you sure you want to delete this receipt? This action cannot be undone."
        onPress={handleDeleteReceipt}
        onCancel={closeDeleteModal}
        isProcessing={isDeleteProcessing}
      />
    </Modal>
  );
};

export default ReceiptDetailsModal;
