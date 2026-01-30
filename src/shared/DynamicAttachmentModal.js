/* eslint-disable react-native/no-inline-styles */
/* eslint-disable quotes */
/* eslint-disable curly */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useEffect, useState} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
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

import AlertModal from '../components/Alert/AlertModal';
import AlertDeleteModal from '../components/Alert/AlertDeleteModal';
import notificationService from '../Controller/notificationService';
import {SaveAttachmentByteArray} from '../API/ExpenseManagment/Receipt/SaveAttachmentByteArray';

/**
 * Dynamic Attachment Modal Component
 *
 * @param {boolean} visible - Controls modal visibility
 * @param {string|number} recordId - The record ID to attach files to
 * @param {string} tableName - The table name in the database
 * @param {function} onClose - Callback when modal is closed
 * @param {function} onSave - Callback after successful save
 * @param {string} legalEntity - Legal entity identifier
 * @param {string} employeeId - Employee ID
 * @param {string} employeeName - Employee name (optional)
 * @param {string} modalTitle - Custom title for the modal (default: "Attachments")
 *
 * Display Configuration Props:
 * @param {boolean} showDetails - Show/hide the details section (default: false)
 * @param {Array} detailFields - Array of detail fields to display when showDetails=true
 *   Example: [{key: 'ExpenseType', label: 'Type'}, {key: 'AmountCurr', label: 'Amount'}]
 * @param {object} detailData - Data object containing values for detail fields
 *
 * @param {boolean} showTakePhoto - Show/hide take photo button (default: true)
 * @param {boolean} showChooseFile - Show/hide choose file button (default: true)
 * @param {boolean} showDownload - Show/hide download button for existing attachments (default: true)
 * @param {boolean} showDelete - Show/hide delete button for attachments (default: true)
 */
const DynamicAttachmentModal = ({
  visible,
  recordData,
  tableName,
  onClose,
  onSave,
  legalEntity,
  employeeId,
  employeeName,
  modalTitle = 'Attachments',
  // Display configuration
  showDetails = false,
  detailFields = [],
  detailData = {},
  showTakePhoto = true,
  showChooseFile = true,
  showDownload = true,
  showDelete = true,
}) => {
  const [attachments, setAttachments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [deleteModal, setDeleteModal] = useState(false);
  const [processingAction, setProcessingAction] = useState(null);
  const [isDeleteProcessing, setIsDeleteProcessing] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState(null);

  const recordId =
    recordData?.recId ||
    recordData?.RecId ||
    recordData?.ExpenseTransactionNumber ||
    recordData?.leaveReqId || // Add this for leaves
    recordData?.LeaveReqId; // Add this for leaves

  //   useEffect(() => {
  //     if (visible && recordId) {
  //       loadExistingAttachments();
  //     } else {
  //       setAttachments([]);
  //       setIsLoading(false);
  //       setProcessingAction(null);
  //       setAttachmentToDelete(null);
  //     }
  //   }, [visible, recordId]);
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

  //   const loadExistingAttachments = async () => {
  //     if (!recordId) {
  //       console.log('No Record ID found');
  //       return;
  //     }

  //     setIsLoading(true);
  //     try {
  //       const result = await RetrieveReceipts({
  //         recordRefRecId: recordId,
  //         tableName: tableName,
  //       });

  //       if (result.success && result.attachments) {
  //         const formattedAttachments = Array.isArray(result.attachments)
  //           ? result.attachments.map((att, index) => ({
  //               id: att['a:RecId'] || `attachment-${index}-${Date.now()}`,
  //               docuRefRecId: att['a:RecId'],
  //               name: att['a:Name'] || att['a:OriginalFileName'] || 'Attachment',
  //               type: att['a:FileType'] || 'application/octet-stream',
  //               isExisting: true,
  //             }))
  //           : [];
  //         setAttachments(formattedAttachments);
  //       }
  //     } catch (error) {
  //       console.error('Error loading attachments:', error);
  //       setAlertMessage('Failed to load existing attachments');
  //       setAlertModal(true);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };
  const loadExistingAttachments = async () => {
    if (!recordId) {
      console.log('No Record ID found');
      return;
    }

    // console.log('DEBUG: Loading attachments with:', {
    //   recordId,
    //   tableName,
    //   hasRecId: !!recordData?.recId,
    //   hasRecIdAlt: !!recordData?.RecId,
    //   hasExpenseTransactionNumber: !!recordData?.ExpenseTransactionNumber,
    // });

    setIsLoading(true);
    try {
      const result = await RetrieveReceipts({
        recordRefRecId: recordId,
        tableName: tableName || 'TrvExpTrans',
      });

      // console.log('DEBUG: RetrieveReceipts result:', result);

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
        // console.log('DEBUG: Formatted attachments:', formattedAttachments);
        setAttachments(formattedAttachments);
      } else {
        console.log('DEBUG: No attachments or result not successful');
      }
    } catch (error) {
      console.error('Error loading attachments:', error);
      console.log('DEBUG: Error details:', {
        message: error.message,
        response: error.response?.data,
      });
      setAlertMessage('Failed to load existing attachments');
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const convertToBase64 = async uri => {
    try {
      const base64 = await RNFS.readFile(uri, 'base64');
      return base64;
    } catch (error) {
      console.error('Error converting to base64:', error);
      throw new Error('Failed to convert file to base64');
    }
  };

  const getFileExtension = filename => {
    const parts = filename.split('.');
    if (parts.length <= 1) return '';
    const extension = parts.pop().toLowerCase();
    if (!extension && parts.length > 0) {
      return parts.pop().toLowerCase();
    }
    return extension;
  };

  //   const takePhoto = async () => {
  //     try {
  //       const options = {
  //         mediaType: 'photo',
  //         quality: 0.8,
  //         maxWidth: 1024,
  //         maxHeight: 1024,
  //       };

  //       const result = await launchCamera(options);

  //       if (result.assets && result.assets.length > 0) {
  //         const asset = result.assets[0];
  //         const base64 = await convertToBase64(asset.uri);
  //         const timestamp = Date.now();
  //         const fileName = `attachment_${timestamp}.jpg`;

  //         const newAttachment = {
  //           id: `temp_${timestamp}`,
  //           uri: asset.uri,
  //           name: fileName,
  //           base64: base64,
  //           type: 'image/jpeg',
  //           extension: 'jpg',
  //           isNew: true,
  //         };
  //         setAttachments(prev => [...prev, newAttachment]);
  //       }
  //     } catch (error) {
  //       console.error('Error taking photo:', error);
  //       setAlertMessage('Failed to take photo');
  //       setAlertModal(true);
  //     }
  //   };
  const takePhoto = async () => {
    try {
      const options = {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
        includeBase64: true, // Add this line to get base64 directly
      };

      const result = await launchCamera(options);

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        // Try to get base64 from asset first, if not available, convert from URI
        let base64 = asset.base64;
        if (!base64 && asset.uri) {
          base64 = await convertToBase64(asset.uri);
        }

        const timestamp = Date.now();
        const fileName = `attachment_${timestamp}.jpg`;

        const newAttachment = {
          id: `temp_${timestamp}`,
          uri: asset.uri,
          name: fileName,
          base64: base64,
          type: 'image/jpeg',
          extension: 'jpg',
          isNew: true,
        };

        // console.log('DEBUG: New camera photo added:', {
        //   fileName,
        //   hasBase64: !!base64,
        //   base64Length: base64?.length,
        // });

        setAttachments(prev => [...prev, newAttachment]);
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
      let finalExtension = originalExtension;

      if (!originalExtension && file.type) {
        finalExtension = file.type.split('/').pop();
      }

      let cleanFileName = file.name;
      if (originalExtension && file.name.endsWith(`.${originalExtension}`)) {
        cleanFileName = file.name;
      } else if (finalExtension && !file.name.includes('.')) {
        cleanFileName = `${file.name}.${finalExtension}`;
      }

      const newAttachment = {
        id: `temp_${Date.now()}`,
        uri: file.uri,
        name: cleanFileName,
        base64: base64,
        type: file.type,
        extension: finalExtension,
        isNew: true,
      };
      setAttachments(prev => [...prev, newAttachment]);
    } catch (error) {
      if (!DocumentPicker.isCancel(error)) {
        console.error('Error picking document:', error);
        setAlertMessage('Failed to pick document');
        setAlertModal(true);
      }
    }
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
      odt: 'application/vnd.oasis.opendocument.text',
      ods: 'application/vnd.oasis.opendocument.spreadsheet',
      odp: 'application/vnd.oasis.opendocument.presentation',
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

  const handleDeleteAttachment = async () => {
    if (!attachmentToDelete) return;

    const attachment = attachments.find(a => a.id === attachmentToDelete);

    if (!attachment) return;

    setIsDeleteProcessing(true);

    if (attachment.isExisting && attachment.docuRefRecId) {
      setProcessingAction(`delete_${attachmentToDelete}`);
      try {
        const result = await DeleteReceipts({
          docuRefRecIds: [attachment.docuRefRecId],
        });

        if (result.success) {
          setAttachments(prev => prev.filter(a => a.id !== attachmentToDelete));
          setAlertMessage('Attachment deleted successfully');
          setAlertModal(true);
        } else {
          setAlertMessage('Failed to delete attachment');
          setAlertModal(true);
        }
      } catch (error) {
        console.error('Error deleting attachment:', error);
        setAlertMessage(error.message || 'Failed to delete attachment');
        setAlertModal(true);
      } finally {
        setIsDeleteProcessing(false);
        setDeleteModal(false);
        setProcessingAction(null);
        setAttachmentToDelete(null);
      }
    } else {
      setAttachments(prev => prev.filter(a => a.id !== attachmentToDelete));
      setIsDeleteProcessing(false);
      setDeleteModal(false);
      setAttachmentToDelete(null);
    }
  };

  const removeAttachment = attachmentId => {
    const attachment = attachments.find(a => a.id === attachmentId);

    if (attachment && attachment.isNew) {
      setAttachments(prev => prev.filter(a => a.id !== attachmentId));
      return;
    }

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
        let cleanBase64 = result.base64.trim();

        if (cleanBase64.includes('<')) {
          cleanBase64 = cleanBase64.replace(/<[^>]*>/g, '');
        }

        cleanBase64 = cleanBase64.replace(/\s/g, '');

        if (cleanBase64.length % 4 !== 0) {
          cleanBase64 = cleanBase64 + '='.repeat(4 - (cleanBase64.length % 4));
        }

        let fileName = result.fileName || attachment.name;

        if (!fileName.includes('.')) {
          const serverType = result.fileType || attachment.type;
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
          setAlertMessage(`Attachment downloaded successfully: ${fileName}`);
          setAlertModal(true);
        } else {
          setAlertMessage('File was created but appears to be empty');
          setAlertModal(true);
        }
      } else {
        let errorMsg =
          result.message || 'No attachment content received from server';
        if (result.debugInfo) {
          errorMsg += `\n\nDebug Info:\n`;
          errorMsg += `Response Length: ${result.debugInfo.responseLength}\n`;
          errorMsg += `Has Buffer Tag: ${result.debugInfo.hasBuffer}\n`;
          errorMsg += `Has Base64 Pattern: ${result.debugInfo.hasBase64Pattern}`;
        }
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
        // console.log('Uploading attachment:', attachment.name);

        // Get file extension
        let fileExt = getFileExtension(attachment.name);
        if (!fileExt) {
          // Try to get from MIME type
          if (attachment.type) {
            const mimeParts = attachment.type.split('/');
            if (mimeParts.length > 1) {
              fileExt = '.' + mimeParts[1];
            }
          }
        }

        // Ensure fileExt starts with dot
        if (fileExt && !fileExt.startsWith('.')) {
          fileExt = '.' + fileExt;
        }

        if (!fileExt) {
          fileExt = '.bin'; // Default
        }

        // Try two simple approaches
        const approaches = [
          // Approach 1: Send base64 as-is
          {
            name: 'base64',
            fileByteArray: attachment.base64,
          },
          // Approach 2: Fix base64 padding if needed
          {
            name: 'base64_with_padding',
            fileByteArray: (() => {
              let base64 = attachment.base64;
              // Add padding if missing
              while (base64.length % 4 !== 0) {
                base64 += '=';
              }
              return base64;
            })(),
          },
        ];

        let lastError = null;
        let success = false;

        for (const approach of approaches) {
          // console.log(`Trying approach: ${approach.name}`);

          try {
            const saveResult = await SaveAttachmentByteArray({
              recordRefRecId: recordId,
              tableName: tableName || 'PREmployeeLeaveRequest',
              legalEntity: legalEntity,
              employeeId: employeeId,
              fileName: attachment.name,
              fileExt: fileExt,
              fileByteArray: approach.fileByteArray,
            });

            // console.log(`Result for ${approach.name}:`, saveResult);

            if (saveResult.IsSuccess) {
              success = true;
              // console.log(`✅ Success with ${approach.name}`);
              break;
            } else {
              lastError = saveResult.Message;
              // console.log(`❌ ${approach.name} failed: ${saveResult.Message}`);
            }
          } catch (error) {
            lastError = error.message;
            console.log(`❌ ${approach.name} error: ${error.message}`);
          }
        }

        if (!success) {
          throw new Error(lastError || 'Failed to save attachment');
        }

        // Mark attachment as uploaded
        const attachmentIndex = attachments.findIndex(
          a => a.id === attachment.id,
        );
        if (attachmentIndex !== -1) {
          const updatedAttachments = [...attachments];
          updatedAttachments[attachmentIndex] = {
            ...updatedAttachments[attachmentIndex],
            isExisting: true,
            isNew: false,
          };
          setAttachments(updatedAttachments);
        }

        // Small delay between uploads
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      notificationService.showReceiptUploadNotification(newAttachments.length);
      setAlertMessage(
        `${newAttachments.length} attachment(s) uploaded successfully`,
      );
      setAlertModal(true);

      if (onSave) {
        onSave();
      }

      // Refresh attachments
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
      <View key={`${field.key}-${index}`} style={styles.detailRow}>
        <Text style={styles.detailLabel}>{field.label}:</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              disabled={isAnyProcessing}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Employee Info (Optional) */}
          {/* {employeeName && (
            <View style={styles.employeeSection}>
              <Text style={styles.employeeText}>{employeeName}</Text>
            </View>
          )} */}

          {/* Details Section (Conditional) */}
          {showDetails && detailFields.length > 0 && (
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Details</Text>
              {detailFields.map((field, index) =>
                renderDetailRow(field, index),
              )}
            </View>
          )}

          {/* Add Attachment Buttons */}
          {(showTakePhoto || showChooseFile) && (
            <View style={styles.buttonSection}>
              <Text style={styles.sectionTitle}>Add Attachment</Text>
              <View style={styles.addButtonContainer}>
                {showTakePhoto && (
                  <TouchableOpacity
                    style={[
                      styles.addButton,
                      isAnyProcessing && styles.disabledButton,
                      !showChooseFile && {flex: 1},
                    ]}
                    onPress={takePhoto}
                    disabled={isAnyProcessing}>
                    <Text style={styles.addButtonText}>📸 Take Photo</Text>
                  </TouchableOpacity>
                )}

                {showChooseFile && (
                  <TouchableOpacity
                    style={[
                      styles.addButton,
                      isAnyProcessing && styles.disabledButton,
                      !showTakePhoto && {flex: 1},
                    ]}
                    onPress={pickDocument}
                    disabled={isAnyProcessing}>
                    <Text style={styles.addButtonText}>📁 Choose File</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Attachments List */}
          <View style={styles.attachmentsSection}>
            <Text style={styles.sectionTitle}>
              Attachments ({attachments.length})
            </Text>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loadingText}>Loading attachments...</Text>
              </View>
            ) : (
              <ScrollView
                style={styles.attachmentsScrollView}
                showsVerticalScrollIndicator={false}>
                {attachments.length === 0 ? (
                  <Text style={styles.noAttachmentsText}>
                    No attachments added. Add files using the buttons above.
                  </Text>
                ) : (
                  attachments.map((attachment, index) => (
                    <View
                      key={attachment.id || `attachment-${index}-${Date.now()}`}
                      style={styles.attachmentItem}>
                      <View style={styles.attachmentInfo}>
                        <Text style={styles.attachmentName} numberOfLines={2}>
                          {attachment.name || `Attachment ${index + 1}`}
                        </Text>
                        {attachment.isNew && (
                          <Text style={styles.newBadge}>New</Text>
                        )}
                        {attachment.isExisting && (
                          <Text style={styles.existingBadge}>Uploaded</Text>
                        )}
                      </View>
                      <View style={styles.attachmentActions}>
                        {showDownload && attachment.isExisting && (
                          <TouchableOpacity
                            style={[
                              styles.downloadButton,
                              isAnyProcessing && styles.disabledActionButton,
                            ]}
                            onPress={() => downloadAttachment(attachment)}
                            disabled={isAnyProcessing}>
                            {processingAction ===
                            `download_${attachment.id}` ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <FontAwesome
                                name="download"
                                size={16}
                                color="#ffffffff"
                              />
                            )}
                          </TouchableOpacity>
                        )}
                        {showDelete && (
                          <TouchableOpacity
                            style={[
                              styles.removeButton,
                              isAnyProcessing && styles.disabledActionButton,
                            ]}
                            onPress={() => removeAttachment(attachment.id)}
                            disabled={isAnyProcessing}>
                            {processingAction === `delete_${attachment.id}` ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <FontAwesome
                                name="trash"
                                size={16}
                                color="#ffffffff"
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
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.cancelButton,
                isAnyProcessing && styles.disabledButton,
              ]}
              onPress={onClose}
              disabled={isAnyProcessing}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveButton,
                isSaveDisabled && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={isSaveDisabled}>
              {processingAction === 'save' ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>
                  Save ({attachments.filter(a => a.isNew).length})
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Custom Alert Modals */}
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
        onClose={() => {
          if (!isDeleteProcessing) {
            setDeleteModal(false);
            setAttachmentToDelete(null);
          }
        }}
        isProcessing={isDeleteProcessing}
      />
    </Modal>
  );
};

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
    height: '85%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
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
  },
  closeButtonText: {
    fontSize: 18,
    color: '#475569',
    fontWeight: '600',
  },
  employeeSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  employeeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  detailsSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
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
    width: 100,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1e293b',
    flex: 1,
    fontWeight: '600',
  },
  buttonSection: {
    marginBottom: 20,
  },
  addButtonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  addButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  attachmentsSection: {
    flex: 1,
    marginBottom: 20,
  },
  attachmentsScrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#64748b',
    fontSize: 14,
  },
  noAttachmentsText: {
    textAlign: 'center',
    color: '#64748b',
    fontStyle: 'italic',
    padding: 20,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  attachmentInfo: {
    flex: 1,
    flexDirection: 'column',
    marginRight: 12,
  },
  attachmentName: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
    marginBottom: 4,
  },
  newBadge: {
    backgroundColor: '#10b981',
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  existingBadge: {
    backgroundColor: '#3b82f6',
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  attachmentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  downloadButton: {
    backgroundColor: '#0eaa11ff',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 30,
    alignItems: 'center',
  },
  removeButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 30,
    alignItems: 'center',
  },
  disabledActionButton: {
    backgroundColor: '#cbd5e1',
    opacity: 0.6,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#0A66C2',
  },
  saveButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  disabledButton: {
    backgroundColor: '#e2e8f0',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});

export default DynamicAttachmentModal;
