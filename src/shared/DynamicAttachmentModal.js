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
  Platform,
  PermissionsAndroid,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import DocumentPicker from 'react-native-document-picker';
import {launchCamera} from 'react-native-image-picker';
import RNFS from 'react-native-fs';

import {RetrieveReceipts} from '../API/ExpenseManagment/Receipt/RetrieveReciepts';
import {DeleteReceipts} from '../API/ExpenseManagment/Receipt/DeleteReceipts';
import {RetrieveAttachment} from '../API/ExpenseManagment/Receipt/RetrieveAttachment';
import {SaveAttachmentByteArray} from '../API/ExpenseManagment/Receipt/SaveAttachmentByteArray';
import {DeleteAttachmentRecord} from '../API/ExpenseManagment/Receipt/DeleteAttachmentRecord';
import FileViewer from 'react-native-file-viewer';

import AlertModal from '../components/Alert/AlertModal';
import AlertDeleteModal from '../components/Alert/AlertDeleteModal';
import notificationService from '../Controller/notificationService';

import styles from '../styles/styles';
import {iconSize} from '../store/utils/scaling';

/**
 * DynamicAttachmentModal
 *
 * @param {boolean}  visible        - Controls modal visibility
 * @param {object}   recordData     - The record object. Must contain a numeric ID
 *                                    accessible via the `recordIdKey` prop.
 * @param {string}   recordIdKey    - Key used to extract the record ID from recordData
 *                                    (default: 'RecId')
 * @param {string}   tableName      - Table name sent to the API (required)
 * @param {function} onClose        - Called when the modal should close
 * @param {function} onSave         - Called after a successful upload
 * @param {string}   legalEntity    - Legal entity identifier
 * @param {string}   employeeId     - Employee ID
 * @param {string}   employeeName   - Employee name (optional)
 * @param {string}   modalTitle     - Modal header title (default: "Attachments")
 *
 * Display Configuration Props:
 * @param {boolean}  showDetails    - Show/hide the details section (default: false)
 * @param {Array}    detailFields   - [{key, label}] fields to display in details section
 * @param {object}   detailData     - Data object for detail fields
 * @param {boolean}  showTakePhoto  - Show take-photo button (default: true)
 * @param {boolean}  showChooseFile - Show choose-file button (default: true)
 * @param {boolean}  showDownload   - Show download button on existing attachments (default: true)
 * @param {boolean}  showDelete     - Show delete button on attachments (default: true)
 */
const DynamicAttachmentModal = ({
  visible,
  recordData,
  recordIdKey = 'RecId',
  tableName,
  onClose,
  onSave,
  legalEntity,
  employeeId,
  employeeName,
  modalTitle = 'Attachments',
  showDetails = false,
  detailFields = [],
  detailData = {},
  showTakePhoto: _showTakePhotoProp, // ignored on purpose — see below
  showChooseFile = true,
  showDownload = true,
  showDelete = true,
  copyToLineIds = [],
  showCopyToLines = true,
  showView = true,
}) => {
  // Take Photo is disabled app-wide. Screens may still pass showTakePhoto
  // as a prop (harmless — it's captured above as _showTakePhotoProp and
  // deliberately not used), but this component always hides the button.
  const showTakePhoto = false;
  const [attachments, setAttachments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [deleteModal, setDeleteModal] = useState(false);
  const [processingAction, setProcessingAction] = useState(null);
  const [isDeleteProcessing, setIsDeleteProcessing] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dynamically resolve the record ID using the provided key
  const recordId = recordData?.[recordIdKey];
  useEffect(() => {
    if (visible && recordId) {
      loadExistingAttachments();
    } else {
      setAttachments([]);
      setIsLoading(false);
      setProcessingAction(null);
      setAttachmentToDelete(null);
    }
  }, [visible, recordId]);

  const loadExistingAttachments = async () => {
    if (!recordId) {
      console.log('DynamicAttachmentModal: No Record ID found');
      return;
    }

    // ── DEBUG ──
    console.log('[ATTACH DEBUG] loadExistingAttachments called with:', {
      recordId,
      tableName,
      recordIdKey,
    });

    setIsLoading(true);
    try {
      const result = await RetrieveReceipts({
        recordRefRecId: recordId,
        tableName: tableName,
      });

      // ── DEBUG ──
      console.log(
        '[ATTACH DEBUG] RetrieveReceipts raw result:',
        JSON.stringify(result),
      );

      console.log('RetrieveReceipts', {result});

      if (result.success && result.attachments) {
        const formattedAttachments = Array.isArray(result.attachments)
          ? result.attachments.map((att, index) => ({
              id: att['a:RecId'] || `attachment-${index}-${Date.now()}`,
              docuRefRecId: att['a:RecId'],
              name: att['a:Name'] || att['a:OriginalFileName'] || 'Attachment',
              type: att['a:FileType'] || 'application/octet-stream',
              isExisting: true,
            }))
          : [];

        // ── DEBUG ──
        console.log(
          '[ATTACH DEBUG] formatted attachments:',
          JSON.stringify(formattedAttachments),
        );
        setAttachments(formattedAttachments);
      }
    } catch (error) {
      console.error('Error loading attachments:', error);
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
    const parts = filename.split('.');
    if (parts.length <= 1) return '';
    return parts.pop().toLowerCase();
  };

  const requestCameraPermission = async () => {
    if (Platform.OS !== 'android') return true; // iOS prompts automatically via launchCamera

    try {
      const alreadyGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.CAMERA,
      );
      if (alreadyGranted) return true;

      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message:
            'This app needs access to your camera to take photos of receipts/attachments.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        },
      );

      return result === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.error('[ATTACH DEBUG] Camera permission error:', err);
      return false;
    }
  };

  const takePhoto = async () => {
    // ── DEBUG ──
    console.log('[ATTACH DEBUG] takePhoto called');

    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      setAlertMessage(
        'Camera permission is required to take photos. Please enable it from app settings.',
      );
      setAlertModal(true);
      return;
    }
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
        includeBase64: true,
      });

      // ── DEBUG ──
      console.log('[ATTACH DEBUG] launchCamera result:', {
        didCancel: result.didCancel,
        errorCode: result.errorCode,
        errorMessage: result.errorMessage,
        assetsCount: result.assets?.length,
      });

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        let base64 = asset.base64;
        if (!base64 && asset.uri) {
          base64 = await convertToBase64(asset.uri);
        }

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

  const handleCopyToLines = async attachment => {
    if (!attachment.docuRefRecId) {
      setAlertMessage('Cannot copy: missing document reference');
      setAlertModal(true);
      return;
    }

    if (!copyToLineIds || copyToLineIds.length === 0) {
      setAlertMessage('No other lines available to copy to');
      setAlertModal(true);
      return;
    }

    setProcessingAction(`copy_${attachment.id}`);

    try {
      // Fetch the source attachment's content once.
      const result = await RetrieveAttachment({
        docuRefRecId: attachment.docuRefRecId,
      });

      if (!result.success || !result.base64) {
        setAlertMessage(
          result.message || 'Unable to read attachment content to copy',
        );
        setAlertModal(true);
        return;
      }

      let cleanBase64 = result.base64
        .trim()
        .replace(/<[^>]*>/g, '')
        .replace(/\s/g, '');
      if (cleanBase64.length % 4 !== 0) {
        cleanBase64 += '='.repeat(4 - (cleanBase64.length % 4));
      }

      let fileExt = getFileExtension(attachment.name);
      if (!fileExt && (result.fileType || attachment.type)) {
        fileExt = (result.fileType || attachment.type).split('/')[1] || '';
      }
      if (fileExt && !fileExt.startsWith('.')) fileExt = '.' + fileExt;
      if (!fileExt) fileExt = '.bin';

      let successCount = 0;
      let failCount = 0;

      // Sequential, not parallel — mirrors handleSave's pacing so we don't
      // hammer the AOS with concurrent SaveAttachmentByteArray calls.
      for (const targetRecId of copyToLineIds) {
        try {
          const saveResult = await SaveAttachmentByteArray({
            recordRefRecId: targetRecId,
            tableName,
            legalEntity,
            employeeId,
            fileName: attachment.name,
            fileExt,
            fileByteArray: cleanBase64,
          });

          if (saveResult.IsSuccess) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (err) {
          console.error(
            `Error copying attachment to line ${targetRecId}:`,
            err,
          );
          failCount++;
        }

        await new Promise(resolve => setTimeout(resolve, 300));
      }

      if (successCount > 0) {
        notificationService.showReceiptUploadNotification(successCount);
      }

      setAlertMessage(
        failCount === 0
          ? `Attachment copied to ${successCount} line(s) successfully`
          : `Copied to ${successCount} line(s), failed for ${failCount}`,
      );
      setAlertModal(true);

      if (onSave) onSave();
    } catch (error) {
      console.error('Error copying attachment to lines:', error);
      setAlertMessage(`Failed to copy attachment: ${error.message}`);
      setAlertModal(true);
    } finally {
      setProcessingAction(null);
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

  /**
   * Single source of truth for closing the delete confirm modal.
   * Blocked while the API call is in-flight so the user cannot
   * accidentally dismiss it mid-deletion.
   */
  const closeDeleteModal = () => {
    if (isDeleteProcessing) return;
    setDeleteModal(false);
    setAttachmentToDelete(null);
  };

  const handleDeleteAttachment = async () => {
    if (!attachmentToDelete) return;

    const attachment = attachments.find(a => a.id === attachmentToDelete);
    if (!attachment) return;

    // Locally-added (not yet uploaded) — no API call needed, just remove
    if (attachment.isNew) {
      setAttachments(prev => prev.filter(a => a.id !== attachmentToDelete));
      setDeleteModal(false);
      setAttachmentToDelete(null);
      return;
    }

    if (!attachment.docuRefRecId) return;

    // Show spinner on the confirm button and disable cancel
    setIsDeleteProcessing(true);
    setProcessingAction(`delete_${attachmentToDelete}`);

    try {
      // const result = await DeleteReceipts({
      //   docuRefRecIds: [attachment.docuRefRecId],
      // });

      // if (result.success) {
      //   setAttachments(prev => prev.filter(a => a.id !== attachmentToDelete));
      //   setAlertMessage('Attachment deleted successfully');
      // } else {
      //   setAlertMessage('Failed to delete attachment');
      // }
      // setAlertModal(true);

      const result = await DeleteAttachmentRecord({
        recId: attachment.docuRefRecId,
      });

      if (result.success) {
        setAttachments(prev => prev.filter(a => a.id !== attachmentToDelete));
        setAlertMessage('Attachment deleted successfully');
      } else {
        setAlertMessage(result.message || 'Failed to delete attachment');
      }
      setAlertModal(true);
    } catch (error) {
      console.error('Error deleting attachment:', error);
      setAlertMessage(error.message || 'Failed to delete attachment');
      setAlertModal(true);
    } finally {
      // Always reset in correct order: flags first, then close modal
      setIsDeleteProcessing(false);
      setProcessingAction(null);
      setDeleteModal(false);
      setAttachmentToDelete(null);
    }
  };

  const removeAttachment = attachmentId => {
    const attachment = attachments.find(a => a.id === attachmentId);

    // New attachments: skip confirm modal, remove instantly
    if (attachment?.isNew) {
      setAttachments(prev => prev.filter(a => a.id !== attachmentId));
      return;
    }

    // Existing attachments: show confirm modal
    setAttachmentToDelete(attachmentId);
    setDeleteModal(true);
  };

  const downloadAttachment = async attachment => {
    if (!attachment.docuRefRecId) {
      setAlertMessage('Cannot download: missing document reference');
      setAlertModal(true);
      return;
    }

    setProcessingAction(`download_${attachment.id}`);

    try {
      const result = await RetrieveAttachment({
        docuRefRecId: attachment.docuRefRecId,
      });

      if (result.success && result.base64) {
        let cleanBase64 = result.base64
          .trim()
          .replace(/<[^>]*>/g, '')
          .replace(/\s/g, '');

        if (cleanBase64.length % 4 !== 0) {
          cleanBase64 += '='.repeat(4 - (cleanBase64.length % 4));
        }

        let fileName = result.fileName || attachment.name;
        if (!fileName.includes('.')) {
          const serverType = result.fileType || attachment.type;
          const extension =
            serverType?.split('/').pop()?.split('.').pop() || 'bin';
          fileName = `${fileName}.${extension}`;
        }

        // Use CachesDirectoryPath — always writable on all Android versions
        const filePath = `${RNFS.CachesDirectoryPath}/${fileName}`;
        await RNFS.writeFile(filePath, cleanBase64, 'base64');

        const fileExists = await RNFS.exists(filePath);
        const fileInfo = await RNFS.stat(filePath);

        if (fileExists && fileInfo.size > 0) {
          // Copy from cache to Downloads using MediaStore (Android 10+ compatible)
          if (Platform.OS === 'android') {
            await RNFS.copyFile(
              filePath,
              `${RNFS.DownloadDirectoryPath}/${fileName}`,
            ).catch(async () => {
              // If copy fails on Android 10+, just notify with cache path
              notificationService.showReceiptDownloadNotification(
                fileName,
                filePath,
              );
            });
          }
          notificationService.showReceiptDownloadNotification(
            fileName,
            filePath,
          );
          setAlertMessage(`Attachment downloaded successfully: ${fileName}`);
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

  const viewAttachment = async attachment => {
    if (!attachment.docuRefRecId) {
      setAlertMessage('Cannot view: missing document reference');
      setAlertModal(true);
      return;
    }

    setProcessingAction(`view_${attachment.id}`);

    try {
      const result = await RetrieveAttachment({
        docuRefRecId: attachment.docuRefRecId,
      });

      if (result.success && result.base64) {
        let cleanBase64 = result.base64
          .trim()
          .replace(/<[^>]*>/g, '')
          .replace(/\s/g, '');

        if (cleanBase64.length % 4 !== 0) {
          cleanBase64 += '='.repeat(4 - (cleanBase64.length % 4));
        }

        let fileName = attachment.name || result.fileName;

        // Determine extension
        let extension = null;

        if (fileName && fileName.includes('.')) {
          extension = fileName.split('.').pop().toLowerCase();
        } else {
          // Try server type first
          const serverType = result.fileType || attachment.type;
          if (serverType && serverType !== 'application/octet-stream') {
            extension = serverType.split('/').pop()?.split('.').pop();
          }
          // Fallback to magic bytes
          if (!extension || extension === 'octet-stream') {
            extension = detectExtensionFromBase64(cleanBase64);
          }

          if (!extension) {
            setAlertMessage(
              'Unable to determine file type for this attachment.',
            );
            setAlertModal(true);
            setProcessingAction(null);
            return;
          }

          fileName = `${fileName || 'attachment'}.${extension}`;
        }

        // Map extension to MIME type
        const mimeMap = {
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          png: 'image/png',
          gif: 'image/gif',
          pdf: 'application/pdf',
          doc: 'application/msword',
          docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          xls: 'application/vnd.ms-excel',
          xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          ppt: 'application/vnd.ms-powerpoint',
          pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          txt: 'text/plain',
          csv: 'text/csv',
          mp4: 'video/mp4',
          mp3: 'audio/mpeg',
        };

        const mimeType =
          mimeMap[extension.toLowerCase()] || 'application/octet-stream';

        const filePath = `${RNFS.CachesDirectoryPath}/${fileName}`;
        await RNFS.writeFile(filePath, cleanBase64, 'base64');

        const fileExists = await RNFS.exists(filePath);
        if (!fileExists) {
          setAlertMessage('Failed to write file to cache.');
          setAlertModal(true);
          setProcessingAction(null);
          return;
        }

        // On Android, FileViewer needs a content URI for Android 7+
        const openPath =
          Platform.OS === 'android' ? `file://${filePath}` : filePath;

        await FileViewer.open(filePath, {
          showOpenWithDialog: true,
          showAppsSuggestions: true,
          mimeType,
        });
      } else {
        setAlertMessage(result.message || 'No attachment content received');
        setAlertModal(true);
      }
    } catch (error) {
      console.error('Error viewing attachment:', error);
      if (
        error.message?.includes('No app associated') ||
        error.message?.includes('No Activity found')
      ) {
        setAlertMessage(
          'No app installed on this device can open this file type.',
        );
      } else {
        setAlertMessage(`Unable to open file: ${error.message}`);
      }
      setAlertModal(true);
    } finally {
      setProcessingAction(null);
    }
  };

  const detectExtensionFromBase64 = base64 => {
    if (base64.startsWith('/9j/')) return 'jpg';
    if (base64.startsWith('iVBORw0KGgo')) return 'png';
    if (base64.startsWith('JVBERi0')) return 'pdf';
    if (base64.startsWith('UEsDB')) return 'docx'; // also xlsx/pptx (zip-based)
    return null;
  };

  const handleSave = async () => {
    const newAttachments = attachments.filter(a => a.isNew);

    if (newAttachments.length === 0) {
      setAlertMessage('No new attachments to upload');
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

        // Try plain base64 first, then padded fallback
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
              recordRefRecId: recordId,
              tableName: tableName,
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

        // Mark as uploaded in local state
        setAttachments(prev =>
          prev.map(a =>
            a.id === attachment.id ? {...a, isExisting: true, isNew: false} : a,
          ),
        );

        await new Promise(resolve => setTimeout(resolve, 300));
      }

      notificationService.showReceiptUploadNotification(newAttachments.length);
      setAlertMessage(
        `${newAttachments.length} attachment(s) uploaded successfully`,
      );
      setAlertModal(true);

      if (onSave) onSave();

      setTimeout(async () => {
        await loadExistingAttachments();
      }, 1000);
    } catch (error) {
      console.error('Error saving attachments:', error);
      setAlertMessage(`Failed to save attachments: ${error.message}`);
      setAlertModal(true);
    } finally {
      setProcessingAction(null);
    }
  };

  const isAnyProcessing = processingAction !== null;
  const isSaveDisabled =
    isAnyProcessing || attachments.filter(a => a.isNew).length === 0;

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
            {/* Section header row with title + refresh button */}
            <View style={styles.DAM_attachmentsSectionHeader}>
              <Text style={styles.DAM_sectionTitle}>
                Attachments ({attachments.length})
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
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <FontAwesome name="refresh" size={iconSize.xs} color="#fff" />
                )}
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <View style={styles.DAM_loadingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
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
                        {showView && attachment.isExisting && (
                          <TouchableOpacity
                            style={[
                              styles.DAM_downloadButton, // reuse same style or make a DAM_viewButton
                              isAnyProcessing &&
                                styles.DAM_disabledActionButton,
                            ]}
                            onPress={() => viewAttachment(attachment)}
                            disabled={isAnyProcessing}>
                            {processingAction === `view_${attachment.id}` ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <FontAwesome
                                name="eye"
                                size={iconSize.xs}
                                color="#fff"
                              />
                            )}
                          </TouchableOpacity>
                        )}
                        {/* NEW: Copy to Lines — only for already-uploaded
                            attachments, and only when the parent screen
                            actually has other lines to copy into. */}
                        {showCopyToLines &&
                          attachment.isExisting &&
                          copyToLineIds.length > 0 && (
                            <TouchableOpacity
                              style={[
                                styles.DAM_downloadButton,
                                isAnyProcessing &&
                                  styles.DAM_disabledActionButton,
                              ]}
                              onPress={() => handleCopyToLines(attachment)}
                              disabled={isAnyProcessing}>
                              {processingAction === `copy_${attachment.id}` ? (
                                <ActivityIndicator size="small" color="#fff" />
                              ) : (
                                <FontAwesome
                                  name="copy"
                                  size={iconSize.xs}
                                  color="#fff"
                                />
                              )}
                            </TouchableOpacity>
                          )}
                        {showDownload && attachment.isExisting && (
                          <TouchableOpacity
                            style={[
                              styles.DAM_downloadButton,
                              isAnyProcessing &&
                                styles.DAM_disabledActionButton,
                            ]}
                            onPress={() => downloadAttachment(attachment)}
                            disabled={isAnyProcessing}>
                            {processingAction ===
                            `download_${attachment.id}` ? (
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
                  <ActivityIndicator size="small" color="#fff" />
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

export default DynamicAttachmentModal;
