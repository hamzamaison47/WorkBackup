/* eslint-disable quotes */
/* eslint-disable curly */
/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useEffect, useState} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import DocumentPicker from 'react-native-document-picker';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import {Buffer} from 'buffer';

import {RetrieveReceipts} from '../../API/ExpenseManagment/Receipt/RetrieveReciepts';
import {DeleteReceipts} from '../../API/ExpenseManagment/Receipt/DeleteReceipts';
import {RetrieveAttachment} from '../../API/ExpenseManagment/Receipt/RetrieveAttachment';
import {UploadReceipt} from '../../API/ExpenseManagment/Receipt/UploadReceipt';
import {AttachReceiptToExpenseLine} from '../../API/ExpenseManagment/Receipt/AttachReceiptToExpenseLine';
import AlertDeleteModal from '../Alert/AlertDeleteModal';
import AlertModal from '../Alert/AlertModal';
import notificationService from '../../Controller/notificationService';

const ReceiptDetailsModal = ({
  visible,
  expenseLine,
  onCancel,
  onSave,
  legalEntity,
  employeeId,
}) => {
  const [receipts, setReceipts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [deleteModal, setDeleteModal] = useState(false);
  const [processingAction, setProcessingAction] = useState(null);
  const [isDeleteProcessing, setIsDeleteProcessing] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState(null);

  // Load existing receipts when modal opens
  useEffect(() => {
    if (visible && expenseLine) {
      loadExistingReceipts();
    } else {
      // Reset state when modal closes
      setReceipts([]);
      setIsLoading(false);
      setProcessingAction(null);
      setReceiptToDelete(null);
    }
  }, [visible, expenseLine]);

  const loadExistingReceipts = async () => {
    if (!expenseLine?.recId && !expenseLine?.RecId) {
      console.log('No RecId found for expense line');
      return;
    }

    setIsLoading(true);
    try {
      const result = await RetrieveReceipts({
        recordRefRecId: expenseLine.recId || expenseLine.RecId,
        tableName: 'TrvExpTrans',
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

  const convertToBase64 = async uri => {
    try {
      const base64 = await RNFS.readFile(uri, 'base64');
      return base64;
    } catch (error) {
      console.error('Error converting to base64:', error);
      throw new Error('Failed to convert file to base64');
    }
  };

  // const getFileExtension = filename => {
  //   return filename.split('.').pop().toLowerCase();
  // };
  const getFileExtension = filename => {
    const parts = filename.split('.');

    if (parts.length <= 1) return '';

    const extension = parts.pop().toLowerCase();

    if (!extension && parts.length > 0) {
      return parts.pop().toLowerCase();
    }

    return extension;
  };

  // const takePhoto = async () => {
  //   try {
  //     const options = {
  //       mediaType: 'photo',
  //       quality: 0.8,
  //       maxWidth: 1024,
  //       maxHeight: 1024,
  //     };

  //     const result = await launchCamera(options);

  //     if (result.assets && result.assets.length > 0) {
  //       const asset = result.assets[0];
  //       const base64 = await convertToBase64(asset.uri);

  //       const newReceipt = {
  //         id: `temp_${Date.now()}`,
  //         uri: asset.uri,
  //         name: `receipt_${Date.now()}.jpg`,
  //         base64: base64,
  //         type: 'image/jpeg',
  //         extension: 'jpg',
  //         isNew: true,
  //       };
  //       setReceipts(prev => [...prev, newReceipt]);
  //     }
  //   } catch (error) {
  //     console.error('Error taking photo:', error);
  //     setAlertMessage('Failed to take photo');
  //     setAlertModal(true);
  //   }
  // };
  const takePhoto = async () => {
    try {
      const options = {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
      };

      const result = await launchCamera(options);

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const base64 = await convertToBase64(asset.uri);

        // FIX: Ensure clean filename with single extension
        const timestamp = Date.now();
        const fileName = `receipt_${timestamp}.jpg`;

        const newReceipt = {
          id: `temp_${timestamp}`,
          uri: asset.uri,
          name: fileName,
          base64: base64,
          type: 'image/jpeg',
          extension: 'jpg', // Without dot
          isNew: true,
        };
        setReceipts(prev => [...prev, newReceipt]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      setAlertMessage('Failed to take photo');
      setAlertModal(true);
    }
  };

  // FIX #2: Handle delete for new receipts without modal/API call
  const handleDeleteReceipt = async () => {
    if (!receiptToDelete) return;

    const receipt = receipts.find(r => r.id === receiptToDelete);

    if (!receipt) return;

    setIsDeleteProcessing(true);

    // If it's an existing receipt, delete it from the server
    if (receipt.isExisting && receipt.docuRefRecId) {
      setProcessingAction(`delete_${receiptToDelete}`);
      try {
        const result = await DeleteReceipts({
          docuRefRecIds: [receipt.docuRefRecId],
        });

        if (result.success) {
          setReceipts(prev => prev.filter(r => r.id !== receiptToDelete));
          setAlertMessage('Receipt deleted successfully');
          setAlertModal(true);
        } else {
          setAlertMessage('Failed to delete receipt');
          setAlertModal(true);
        }
      } catch (error) {
        console.error('Error deleting receipt:', error);
        setAlertMessage(error.message || 'Failed to delete receipt');
        setAlertModal(true);
      } finally {
        setIsDeleteProcessing(false);
        setDeleteModal(false);
        setProcessingAction(null);
        setReceiptToDelete(null);
      }
    } else {
      // Just remove from local state for new receipts
      setReceipts(prev => prev.filter(r => r.id !== receiptToDelete));
      setIsDeleteProcessing(false);
      setDeleteModal(false);
      setReceiptToDelete(null);
    }
  };

  // FIX #2: Modified removeReceipt to handle new vs existing receipts differently
  const removeReceipt = receiptId => {
    const receipt = receipts.find(r => r.id === receiptId);

    // If it's a new receipt, just remove it immediately without confirmation
    if (receipt && receipt.isNew) {
      setReceipts(prev => prev.filter(r => r.id !== receiptId));
      return;
    }

    // For existing receipts, show confirmation modal
    setReceiptToDelete(receiptId);
    setDeleteModal(true);
  };

  const getContentType = filename => {
    const extension = filename.split('.').pop().toLowerCase();

    const contentTypeMap = {
      // Documents
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
      // Images
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

  // const pickDocument = async () => {
  //   try {
  //     const result = await DocumentPicker.pick({
  //       type: [
  //         DocumentPicker.types.images,
  //         DocumentPicker.types.pdf,
  //         DocumentPicker.types.doc,
  //         DocumentPicker.types.docx,
  //         DocumentPicker.types.xls,
  //         DocumentPicker.types.xlsx,
  //         DocumentPicker.types.ppt,
  //         DocumentPicker.types.pptx,
  //         DocumentPicker.types.plainText,
  //         DocumentPicker.types.allFiles,
  //       ],
  //     });

  //     const file = result[0];
  //     const base64 = await convertToBase64(file.uri);
  //     const extension = getFileExtension(file.name);

  //     const newReceipt = {
  //       id: `temp_${Date.now()}`,
  //       uri: file.uri,
  //       name: file.name,
  //       base64: base64,
  //       type: file.type,
  //       extension: extension,
  //       isNew: true,
  //     };
  //     setReceipts(prev => [...prev, newReceipt]);
  //   } catch (error) {
  //     if (!DocumentPicker.isCancel(error)) {
  //       console.error('Error picking document:', error);
  //       setAlertMessage('Failed to pick document');
  //       setAlertModal(true);
  //     }
  //   }
  // };

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

      // FIX: Get extension properly and ensure no duplication
      const originalExtension = getFileExtension(file.name);
      let finalExtension = originalExtension;

      // If the file.name already ends with the extension, use that
      // Otherwise, use the type to determine extension
      if (!originalExtension && file.type) {
        finalExtension = file.type.split('/').pop();
      }

      // Clean the filename - remove any duplicate extensions
      let cleanFileName = file.name;
      if (originalExtension && file.name.endsWith(`.${originalExtension}`)) {
        // File already has proper extension, use as is
        cleanFileName = file.name;
      } else if (finalExtension && !file.name.includes('.')) {
        // File has no extension, add it
        cleanFileName = `${file.name}.${finalExtension}`;
      }

      const newReceipt = {
        id: `temp_${Date.now()}`,
        uri: file.uri,
        name: cleanFileName, // Use cleaned filename
        base64: base64,
        type: file.type,
        extension: finalExtension, // Use final extension without dot
        isNew: true,
      };
      setReceipts(prev => [...prev, newReceipt]);
    } catch (error) {
      if (!DocumentPicker.isCancel(error)) {
        console.error('Error picking document:', error);
        setAlertMessage('Failed to pick document');
        setAlertModal(true);
      }
    }
  };

  // FIX #3: Modified downloadReceipt to set processing action properly
  const downloadReceipt = async receipt => {
    if (!receipt.docuRefRecId) {
      setAlertMessage('Cannot download: missing document reference');
      setAlertModal(true);
      return;
    }

    // Set processing action to disable all buttons
    setProcessingAction(`download_${receipt.id}`);

    try {
      console.log('=== Starting Download ===');
      console.log('Receipt info:', {
        name: receipt.name,
        type: receipt.type,
        docuRefRecId: receipt.docuRefRecId,
      });

      const result = await RetrieveAttachment({
        docuRefRecId: receipt.docuRefRecId,
      });

      console.log('RetrieveAttachment result:', {
        success: result.success,
        base64Length: result.base64?.length,
        fileType: result.fileType,
        fileName: result.fileName,
        message: result.message,
        debugInfo: result.debugInfo,
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

        let fileName = result.fileName || receipt.name;

        if (!fileName.includes('.')) {
          const serverType = result.fileType || receipt.type;
          const extension =
            serverType?.split('/').pop()?.split('.').pop() || 'bin';
          fileName = `${fileName}.${extension}`;
        }

        console.log('Final download details:', {
          fileName,
          base64Length: cleanBase64.length,
          hasProperPadding: cleanBase64.length % 4 === 0,
        });

        const filePath = `${RNFS.DownloadDirectoryPath}/${fileName}`;

        console.log('Writing file to:', filePath);

        await RNFS.writeFile(filePath, cleanBase64, 'base64');

        const fileExists = await RNFS.exists(filePath);
        const fileInfo = await RNFS.stat(filePath);

        console.log('File write results:', {
          fileExists,
          fileSize: fileInfo.size,
          filePath: fileInfo.path,
        });

        if (fileExists && fileInfo.size > 0) {
          notificationService.showReceiptDownloadNotification(
            fileName,
            filePath,
          );

          setAlertMessage(`Receipt downloaded successfully: ${fileName}`);
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

          console.log('Full debug info:', result.debugInfo);
        }

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
      // Clear processing action to re-enable all buttons
      setProcessingAction(null);
    }
  };

  // const handleSave = async () => {
  //   const newReceipts = receipts.filter(r => r.isNew);

  //   if (newReceipts.length === 0) {
  //     setAlertMessage('No new receipts to upload');
  //     setAlertModal(true);
  //     return;
  //   }

  //   setProcessingAction('save');

  //   try {
  //     for (const receipt of newReceipts) {
  //       const uploadResult = await UploadReceipt({
  //         legalEntity: legalEntity,
  //         fileName: receipt.name,
  //         capturedReceipt: receipt.base64,
  //         contentType: getContentType(receipt.name),
  //         fileExtension: receipt.extension,
  //         employeeId: employeeId,
  //       });

  //       if (!uploadResult.IsSuccess || !uploadResult.Receipts?.length) {
  //         throw new Error(uploadResult.Message || 'Failed to upload receipt');
  //       }

  //       const uploadedReceipt = uploadResult.Receipts[0];
  //       const attachResult = await AttachReceiptToExpenseLine({
  //         docuRefRecId: uploadedReceipt.RecId || uploadedReceipt.recId,
  //         expenseTransactionNumber: expenseLine.ExpenseTransactionNumber,
  //         legalEntity: legalEntity,
  //         employeeId: employeeId,
  //         isAttach: true,
  //       });

  //       if (!attachResult.IsSuccess) {
  //         throw new Error(
  //           attachResult.Message || 'Failed to attach receipt to expense line',
  //         );
  //       }
  //     }

  //     notificationService.showReceiptUploadNotification(newReceipts.length);

  //     setAlertMessage(`${newReceipts.length} receipt(s) uploaded successfully`);
  //     setAlertModal(true);

  //     if (onSave) {
  //       onSave();
  //     }

  //     await loadExistingReceipts();
  //   } catch (error) {
  //     console.error('Error saving receipts:', error);
  //     setAlertMessage(error.message || 'Failed to save receipts');
  //     setAlertModal(true);
  //   } finally {
  //     setProcessingAction(null);
  //   }
  // };
  const handleSave = async () => {
    console.log('🔵 [handleSave] START - Saving receipts...');
    const newReceipts = receipts.filter(r => r.isNew);
    console.log('🔵 [handleSave] New receipts to upload:', newReceipts.length);
    console.log(
      '🔵 [handleSave] Receipts details:',
      newReceipts.map(r => ({
        name: r.name,
        extension: r.extension,
        base64Length: r.base64?.length,
      })),
    );

    if (newReceipts.length === 0) {
      console.log('❌ [handleSave] No new receipts to upload');
      setAlertMessage('No new receipts to upload');
      setAlertModal(true);
      return;
    }

    setProcessingAction('save');
    console.log('🔵 [handleSave] Processing action set to "save"');

    try {
      for (const [index, receipt] of newReceipts.entries()) {
        console.log(
          `🔵 [handleSave] Processing receipt ${index + 1}/${
            newReceipts.length
          }:`,
          receipt.name,
        );

        console.log('🔵 [handleSave] Calling UploadReceipt with:', {
          legalEntity,
          fileName: receipt.name,
          contentType: getContentType(receipt.name),
          fileExtension: receipt.extension,
          employeeId,
          base64Length: receipt.base64?.length,
        });

        const uploadResult = await UploadReceipt({
          legalEntity: legalEntity,
          fileName: receipt.name,
          capturedReceipt: receipt.base64,
          contentType: getContentType(receipt.name),
          fileExtension: receipt.extension,
          employeeId: employeeId,
        });

        console.log('🔵 [handleSave] UploadReceipt result:', uploadResult);

        if (!uploadResult.IsSuccess || !uploadResult.Receipts?.length) {
          console.log(
            '❌ [handleSave] UploadReceipt failed:',
            uploadResult.Message,
          );
          throw new Error(uploadResult.Message || 'Failed to upload receipt');
        }

        const uploadedReceipt = uploadResult.Receipts[0];
        console.log(
          '🔵 [handleSave] Uploaded receipt details:',
          uploadedReceipt,
        );
        console.log(
          '🔵 [handleSave] Using docuRefRecId:',
          uploadedReceipt.RecId || uploadedReceipt.recId,
        );

        console.log(
          '🔵 [handleSave] Calling AttachReceiptToExpenseLine with:',
          {
            docuRefRecId: uploadedReceipt.RecId || uploadedReceipt.recId,
            expenseTransactionNumber: expenseLine.ExpenseTransactionNumber,
            legalEntity,
            employeeId,
            isAttach: true,
          },
        );

        const attachResult = await AttachReceiptToExpenseLine({
          docuRefRecId: uploadedReceipt.docuRefRecId,
          expenseTransactionNumber: expenseLine.ExpenseTransactionNumber,
          legalEntity: legalEntity,
          employeeId: employeeId,
          isAttach: true,
        });

        console.log(
          '🔵 [handleSave] AttachReceiptToExpenseLine result:',
          attachResult,
        );

        if (!attachResult.IsSuccess) {
          console.log(
            '❌ [handleSave] AttachReceiptToExpenseLine failed:',
            attachResult.Message,
          );
          throw new Error(
            attachResult.Message || 'Failed to attach receipt to expense line',
          );
        }

        console.log(
          `✅ [handleSave] Successfully processed receipt ${index + 1}:`,
          receipt.name,
        );
      }

      console.log('✅ [handleSave] ALL receipts processed successfully');
      notificationService.showReceiptUploadNotification(newReceipts.length);

      setAlertMessage(`${newReceipts.length} receipt(s) uploaded successfully`);
      setAlertModal(true);

      if (onSave) {
        console.log('🔵 [handleSave] Calling onSave callback');
        onSave();
      }

      console.log('🔵 [handleSave] Reloading existing receipts...');
      await loadExistingReceipts();
    } catch (error) {
      console.error('❌ [handleSave] CATCH ERROR:', error);
      console.error('❌ [handleSave] Error stack:', error.stack);
      setAlertMessage(error.message || 'Failed to save receipts');
      setAlertModal(true);
    } finally {
      console.log('🔵 [handleSave] Clearing processing action');
      setProcessingAction(null);
    }
  };

  // FIX #3: Check if any processing is happening (including downloads)
  const isAnyProcessing = processingAction !== null;
  const isSaveDisabled =
    isAnyProcessing || receipts.filter(r => r.isNew).length === 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Manage Receipts</Text>
            <TouchableOpacity
              onPress={onCancel}
              style={styles.closeButton}
              disabled={isAnyProcessing}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Expense Line Details */}
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Expense Details</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Type:</Text>
              <Text style={styles.detailValue}>
                {expenseLine?.ExpenseType || 'N/A'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount:</Text>
              <Text style={styles.detailValue}>
                {expenseLine?.AmountCurr || '0.00'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date:</Text>
              <Text style={styles.detailValue}>
                {expenseLine?.TransDate || 'N/A'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Description:</Text>
              <Text style={styles.detailValue}>
                {expenseLine?.Description || 'N/A'}
              </Text>
            </View>
          </View>

          {/* Add Receipt Buttons */}
          <View style={styles.buttonSection}>
            <Text style={styles.sectionTitle}>Add Receipt</Text>

            <View style={styles.addButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.addButton,
                  isAnyProcessing && styles.disabledButton,
                ]}
                onPress={takePhoto}
                disabled={isAnyProcessing}>
                <Text style={styles.addButtonText}>📸 Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.addButton,
                  isAnyProcessing && styles.disabledButton,
                ]}
                onPress={pickDocument}
                disabled={isAnyProcessing}>
                <Text style={styles.addButtonText}>📁 Choose File</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Receipts List */}
          <View style={styles.receiptsSection}>
            <Text style={styles.sectionTitle}>
              Receipts ({receipts.length})
            </Text>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loadingText}>Loading receipts...</Text>
              </View>
            ) : (
              <ScrollView
                style={styles.receiptsScrollView}
                showsVerticalScrollIndicator={false}>
                {receipts.length === 0 ? (
                  <Text style={styles.noReceiptsText}>
                    No receipts attached. Add receipts using the buttons above.
                  </Text>
                ) : (
                  receipts.map((receipt, index) => (
                    <View
                      key={receipt.id || `receipt-${index}-${Date.now()}`}
                      style={styles.receiptItem}>
                      <View style={styles.receiptInfo}>
                        {/* <Text style={styles.receiptName} numberOfLines={2}>
                          {receipt.name && receipt.type
                            ? `${receipt.name}.${
                                receipt.extension ||
                                receipt.type.split('/').pop()
                              }`
                            : `Receipt ${index + 1}`}
                        </Text> */}
                        <Text style={styles.receiptName} numberOfLines={2}>
                          {receipt.name || `Receipt ${index + 1}`}
                        </Text>
                        {receipt.isNew && (
                          <Text style={styles.newBadge}>New</Text>
                        )}
                        {receipt.isExisting && (
                          <Text style={styles.existingBadge}>Uploaded</Text>
                        )}
                      </View>
                      <View style={styles.receiptActions}>
                        {receipt.isExisting && (
                          <TouchableOpacity
                            style={[
                              styles.downloadButton,
                              isAnyProcessing && styles.disabledActionButton,
                            ]}
                            onPress={() => downloadReceipt(receipt)}
                            disabled={isAnyProcessing}>
                            {processingAction === `download_${receipt.id}` ? (
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
                        <TouchableOpacity
                          style={[
                            styles.removeButton,
                            isAnyProcessing && styles.disabledActionButton,
                          ]}
                          onPress={() => removeReceipt(receipt.id)}
                          disabled={isAnyProcessing}>
                          {processingAction === `delete_${receipt.id}` ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <FontAwesome
                              name="trash"
                              size={16}
                              color="#ffffffff"
                            />
                          )}
                        </TouchableOpacity>
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
              onPress={onCancel}
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
                  Save Receipts ({receipts.filter(r => r.isNew).length})
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Custom Alert Modals */}
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
        onCancel={() => {
          if (!isDeleteProcessing) {
            setDeleteModal(false);
            setReceiptToDelete(null);
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
  receiptsSection: {
    flex: 1,
    marginBottom: 20,
  },
  receiptsScrollView: {
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
  noReceiptsText: {
    textAlign: 'center',
    color: '#64748b',
    fontStyle: 'italic',
    padding: 20,
  },
  receiptItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  receiptInfo: {
    flex: 1,
    flexDirection: 'column',
    marginRight: 12,
  },
  receiptName: {
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
  receiptActions: {
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

export default ReceiptDetailsModal;
