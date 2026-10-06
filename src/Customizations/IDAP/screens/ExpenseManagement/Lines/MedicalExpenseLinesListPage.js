/* eslint-disable curly */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, {useCallback, useState, useEffect, useRef} from 'react';
import {
  Text,
  RefreshControl,
  ScrollView,
  FlatList,
  View,
  BackHandler,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import {useSelector} from 'react-redux';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import RNFS from 'react-native-fs';

import {GetAllMedicalExpenseLines} from '../../../API/ExpenseManagement/Lines/GetAllMedicalExpenseLines';
import {DeleteMedicalExpenseLines} from '../../../API/ExpenseManagement/Lines/DeleteMedicalExpenseLines';
import {ViewMedicalOPDClaimReport} from '../../../API/ExpenseManagement/Lines/ViewMedicalOPDClaimReport';

import AlertModal from '../../../../../components/Alert/AlertModal';
import useAlertModal from '../../../../../hooks/useAlertModal';
import AlertDeleteModal from '../../../../../components/Alert/AlertDeleteModal';
import DynamicRequestCard from '../../../../../components/DynamicRequestCard';
import ActionPaneContainer from '../../../../../components/ActionPaneContainer';
import CustomIndicator from '../../../../../components/CustomIndicator/CustomIndicator';
import MultiSelectActionBar from '../../../../../components/MultiSelectActionBar';
import DynamicAttachmentModal from '../../../../../shared/DynamicAttachmentModal';
import notificationService from '../../../../../Controller/notificationService';
import styles from '../../../../../styles/styles';
import useListFilters from '../../../../../hooks/useListFilters';
import useNotify from '../../../../../hooks/useNotify';
import usePalette from '../../../../../hooks/usePalette';

const MedicalExpenseLinesListPage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const P = usePalette();
  const {notifySuccess, notifyError} = useNotify('Medical Expense Lines');

  const {
    headerRecId,
    expenseReportNumber,
    employeeId,
    employeeName,
    WorkerRecId,
    cameFrom,
    originalCameFrom,
    expenseReportData,
    userData: routeUserData,
  } = route.params || {};

  const reduxUserData = useSelector(state => state.user.userData);

  const {forceShowAddButton} = route.params || {};
  const isDraft =
    expenseReportData?.ApprovalStatus === 'Draft' || !!forceShowAddButton;

  const effectiveUserData = routeUserData || reduxUserData;
  const effectiveEmployeeId = employeeId || effectiveUserData?.employeeId;
  const effectiveEmployeeName = employeeName || effectiveUserData?.employeeName;
  const effectiveWorkerRecId = WorkerRecId || effectiveUserData?.WorkerRecId;

  const [isLoading, setIsLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));
  const {showSuccess, showError, showWarning, alertModalProps} =
    useAlertModal();
  const [expenseLinesData, setExpenseLinesData] = useState([]);
  const [receiptModal, setReceiptModal] = useState(false);
  const [selectedExpenseLine, setSelectedExpenseLine] = useState(null);

  // Multi-select state — long-press a row to enter, tap rows to toggle.
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [deleteModal, setDeleteModal] = useState(false);

  // Single-line delete (per-card kebab → Delete). Coexists with the bulk path
  // above; uses its own modal + per-row processing state.
  const [itemToDelete, setItemToDelete] = useState(null);
  const [singleDeleteModal, setSingleDeleteModal] = useState(false);
  const [processingButtons, setProcessingButtons] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingLabel, setProcessingLabel] = useState('');

  // Read-only card: SubCategory / patient Name up top, financials + receipt
  // state in the fields, remaining detail behind the expander.
  const CARD_CONFIG = {
    headerConfig: {
      title: {key: 'SubCategory', label: 'Sub Category'},
      subtitle: {key: 'Name', label: 'Patient'},
    },
    fields: [
      {key: 'IsReceiptAttached', label: 'Receipts attached', type: 'boolean'},
      {key: 'Relation', label: 'Relation with Employee', type: 'text'},
      {key: 'TransDate', label: 'Transaction date', type: 'text'},
      {key: 'ReceiptNum', label: 'Receipt number', type: 'text'},
      {key: 'ClaimedAmount', label: 'Claimed Amount', type: 'text'},
    ],
    expandableFields: [
      {key: 'TransAmount', label: 'Transaction amount', type: 'text'},
    ],
  };

  useEffect(() => {
    return () => {
      setExpenseLinesData([]);
      setReceiptModal(false);
      setSelectedExpenseLine(null);
      setIsMultiSelectMode(false);
      setSelectedIds(new Set());
      setItemToDelete(null);
      setSingleDeleteModal(false);
      setProcessingButtons({});
      setIsProcessing(false);
    };
  }, []);

  const setButtonProcessing = (recId, buttonType, isProcessing) =>
    setProcessingButtons(prev => ({
      ...prev,
      [recId]: isProcessing
        ? [...(prev[recId] || []), buttonType]
        : (prev[recId] || []).filter(btn => btn !== buttonType),
    }));

  const formatDate = value => {
    if (!value) return 'N/A';
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return 'N/A';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatCurrency = amount => {
    const num = typeof amount === 'number' ? amount : parseFloat(amount);
    if (isNaN(num)) return '0.00';
    const fixed = num.toFixed(2);
    const [intPart, decPart] = fixed.split('.');
    const sign = intPart.startsWith('-') ? '-' : '';
    const digitsOnly = intPart.replace('-', '');
    const formattedInt = digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${sign}${formattedInt}.${decPart}`;
  };

  const classifyReceiptPill = item =>
    item.IsReceiptAttached ? 'Attached' : 'Not Attached';

  const f = useListFilters({
    data: expenseLinesData,
    dateField: 'TransDate',
    classifyPill: classifyReceiptPill,
    pills: ['All', 'Attached', 'Not Attached'], // static so the row never shrinks
  });

  const fetchExpenseLinesData = useCallback(async () => {
    console.log('[MedExpLines] fetch fired, headerRecId:', headerRecId);
    if (!headerRecId) {
      showWarning('Missing required parameters');
      setIsLoading(false);
      return;
    }

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();

    try {
      const lines = await GetAllMedicalExpenseLines(headerRecId);
      console.log('here are hte lines', lines);

      const sortedLines = (lines || []).sort((a, b) => {
        const dateA = a.TransDate ? new Date(a.TransDate) : 0;
        const dateB = b.TransDate ? new Date(b.TransDate) : 0;
        return dateB - dateA;
      });

      setExpenseLinesData(sortedLines);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Failed to fetch Medical expense line data:', error);
      showError('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, [headerRecId]);

  const {refresh} = route.params || {};
  const handledRefreshRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      if (refresh && handledRefreshRef.current !== refresh) {
        handledRefreshRef.current = refresh;
        f.resetFilters();
      }
      setIsLoading(true);
      fetchExpenseLinesData();
    }, [fetchExpenseLinesData, refresh]),
  );

  const handleGoBack = useCallback(() => {
    navigation.navigate('MedicalExpenseManagmentListPage', {
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
      WorkerRecId: effectiveWorkerRecId,
      userData: {
        employeeId: effectiveEmployeeId,
        employeeName: effectiveEmployeeName,
        WorkerRecId: effectiveWorkerRecId,
      },
      cameFrom: originalCameFrom || 'DrawerNavigator',
    });
  }, [
    navigation,
    effectiveEmployeeId,
    effectiveEmployeeName,
    effectiveWorkerRecId,
    originalCameFrom,
  ]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        console.log(
          '[BACK] LINES handler, isFocused:',
          navigation.isFocused(),
          'canGoBack:',
          navigation.canGoBack(),
        );
        if (!navigation.isFocused()) return false;
        if (isMultiSelectMode) {
          exitSelectMode();
          return true;
        }
        handleGoBack();
        return true;
      };
      const sub = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );
      return () => sub.remove();
    }, [isMultiSelectMode, handleGoBack]),
  );

  const handleAddLine = useCallback(() => {
    navigation.navigate('MedicalExpenseLinesSaveRecord', {
      headerRecId,
      expenseReportNumber,
      workerRecId: effectiveWorkerRecId,
      userData: {
        employeeId: effectiveEmployeeId,
        employeeName: effectiveEmployeeName,
        WorkerRecId: effectiveWorkerRecId,
      },
      cameFrom: 'MedicalExpenseLinesListPage',
      originalCameFrom: originalCameFrom || cameFrom,
    });
  }, [
    navigation,
    headerRecId,
    expenseReportNumber,
    effectiveWorkerRecId,
    effectiveEmployeeId,
    effectiveEmployeeName,
    originalCameFrom,
    cameFrom,
  ]);

  // ── Edit an existing line ────────────────────────────────────
  const handleEditLine = itemData => {
    navigation.navigate('MedicalExpenseLinesSaveRecord', {
      mode: 'edit',
      lineData: itemData, // raw item — unformatted amounts/dates
      headerRecId,
      expenseReportNumber,
      workerRecId: effectiveWorkerRecId,
      userData: {
        employeeId: effectiveEmployeeId,
        employeeName: effectiveEmployeeName,
        WorkerRecId: effectiveWorkerRecId,
      },
      cameFrom: 'MedicalExpenseLinesListPage',
      originalCameFrom: originalCameFrom || cameFrom,
    });
  };

  // ── Multi-select ────────────────────────────────────────────
  const enterSelectMode = data => {
    setIsMultiSelectMode(true);
    setSelectedIds(new Set([data.RecId]));
  };

  const handleSelectToggle = data => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(data.RecId)) next.delete(data.RecId);
      else next.add(data.RecId);
      if (next.size === 0) setIsMultiSelectMode(false);
      return next;
    });
  };

  const exitSelectMode = () => {
    setSelectedIds(new Set());
    setIsMultiSelectMode(false);
  };

  const handleSelectAll = () => {
    const allIds = f.filteredData
      .map(item => item.RecId)
      .filter(id => id !== undefined && id !== null && id !== 0);
    setSelectedIds(new Set(allIds));
  };

  const handleBulkDeletePress = () => {
    if (selectedIds.size === 0) {
      showWarning('No records selected for deletion.'); // was: setAlertMessage + setAlertModal(true)
      return;
    }
    setDeleteModal(true);
  };

  const handleBulkDeleteConfirm = async () => {
    setDeleteModal(false);
    setIsProcessing(true);
    setProcessingLabel('Deleting');

    const recIds = Array.from(selectedIds);

    try {
      const result = await DeleteMedicalExpenseLines(recIds);

      if (result.IsSuccess) {
        notifySuccess(result.Message);
        showSuccess(result.Message); // was: setAlertMessage(...)
        exitSelectMode();
      } else {
        notifyError(result.Message);
        showError(result.Message); // was: setAlertMessage(...)
        if (result.failures && result.failures.length > 0) {
          const failedIds = new Set(
            result.failures
              .map(item => Number(item.RecId))
              .filter(id => !isNaN(id) && id !== 0),
          );
          setSelectedIds(failedIds);
        } else {
          exitSelectMode();
        }
      }
    } catch (error) {
      console.error('Bulk delete medical expense lines error:', error);
      notifyError('Failed to delete record(s). Please try again.');
      showError('Failed to delete record(s). Please try again.'); // was: setAlertMessage(...)
    } finally {
      setIsProcessing(false);
      fetchExpenseLinesData();
    }
  };

  const handleClaimReport = async () => {
    if (isProcessing) return;
    if (!expenseReportNumber) {
      notifyError('Missing expense report number for claim report.');
      showError('Missing expense report number for claim report.');
      return;
    }

    setIsProcessing(true);
    setProcessingLabel('Generating Report'); // ← moved up, set immediately

    try {
      const b64 = await ViewMedicalOPDClaimReport(expenseReportNumber);

      if (!b64) {
        notifyError('No claim report content received from server.');
        showError('No claim report content received from server.');
        return;
      }

      let cleanBase64 = b64
        .trim()
        .replace(/<[^>]*>/g, '')
        .replace(/\s/g, '');

      if (cleanBase64.length % 4 !== 0)
        cleanBase64 += '='.repeat(4 - (cleanBase64.length % 4));

      const fileName = `SLD_MediClaimReport_${expenseReportNumber}.pdf`;
      const filePath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
      await RNFS.writeFile(filePath, cleanBase64, 'base64');

      const fileExists = await RNFS.exists(filePath);
      const fileInfo = await RNFS.stat(filePath);

      if (fileExists && fileInfo.size > 0) {
        notificationService.showReceiptDownloadNotification(fileName, filePath);
        showSuccess(`Claim report downloaded successfully: ${fileName}`);
      } else {
        showWarning('File was created but appears to be empty');
      }
    } catch (error) {
      console.error('Error generating claim report:', error);
      notificationService.showErrorNotification(
        `Claim report failed: ${error.message}`,
      );
      notifyError(`Claim report failed: ${error.message}`);
      showError(`Claim report failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const getButtonConfig = item => {
    if (isMultiSelectMode) return {};
    return {
      edit: {
        show: true,
        position: 'header',
        style: 'icon',
        icon: 'edit',
        iconSize: 20,
        iconColor: P.onPrimary,
        backgroundColor: P.primary,
        disabled: !isDraft,
        customStyle: !isDraft ? {backgroundColor: '#BDBDBD'} : {},
      },

      delete: {
        show: true,
        position: 'header',
        style: 'icon',
        icon: 'trash',
        iconSize: 20,
        iconColor: P.onPrimary,
        backgroundColor: P.primary,
        disabled: !isDraft,
        customStyle: !isDraft ? {backgroundColor: '#BDBDBD'} : {},
      },
      attachment: {
        show: true,
        position: 'header',
        style: 'icon',
        icon: 'paperclip',
        iconSize: 20,
        iconColor: P.onPrimary,
        backgroundColor: P.primary,
        disabled: !isDraft,
        customStyle: !isDraft ? {backgroundColor: '#BDBDBD'} : {},
      },
    };
  };

  const handleButtonPress = (buttonType, itemData) => {
    if (buttonType === 'edit') {
      // Look up the RAW (unformatted) line by RecId — renderExpenseLineCard's
      // processedItem has already been through formatDate/formatCurrency.
      const rawItem =
        expenseLinesData.find(l => l.RecId === itemData.RecId) || itemData;
      handleEditLine(rawItem);
    } else if (buttonType === 'attachment') {
      handleReceiptPress(itemData);
    } else if (buttonType === 'delete') {
      handleSingleDeletePress(itemData);
    }
  };

  const handleReceiptPress = itemData => {
    // ── DEBUG ──
    console.log('[ATTACH DEBUG] handleReceiptPress itemData:', {
      RecId: itemData.RecId,
      SubCategory: itemData.SubCategory,
      IsReceiptAttached: itemData.IsReceiptAttached,
    });
    setSelectedExpenseLine(itemData);
    setReceiptModal(true);
  };

  // ── Single-line delete (per-card kebab → Delete) ────────────
  const handleSingleDeletePress = itemData => {
    setItemToDelete(itemData);
    setSingleDeleteModal(true);
  };

  const handleSingleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    const recId = itemToDelete.RecId;
    setSingleDeleteModal(false);
    setIsProcessing(true);
    setProcessingLabel('Deleting');
    setButtonProcessing(recId, 'delete', true);

    try {
      const result = await DeleteMedicalExpenseLines([recId]);

      if (result.IsSuccess) {
        notifySuccess(result.Message);
        showSuccess(result.Message); // was: setAlertMessage(...)
        setExpenseLinesData(prev => prev.filter(line => line.RecId !== recId));
      } else {
        notifyError(result.Message);
        showError(result.Message); // was: setAlertMessage(...)
      }
    } catch (error) {
      console.error('Single delete medical expense line error:', error);
      notifyError('Failed to delete record. Please try again.');
      showError('Failed to delete record. Please try again.'); // was: setAlertMessage(...)
    } finally {
      setIsProcessing(false);
      setButtonProcessing(recId, 'delete', false);
      setItemToDelete(null);
      fetchExpenseLinesData();
    }
  };

  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    fetchExpenseLinesData();
  }, [fetchExpenseLinesData]);

  const getTotals = () => {
    const totalClaimed = expenseLinesData.reduce(
      (sum, line) => sum + (Number(line.ClaimedAmount) || 0),
      0,
    );
    const totalAuth = expenseLinesData.reduce(
      (sum, line) => sum + (Number(line.AuthAmount) || 0),
      0,
    );
    return {
      totalClaimed: formatCurrency(totalClaimed),
      totalAuth: formatCurrency(totalAuth),
    };
  };

  const renderExpenseLineCard = ({item}) => {
    const processedItem = {
      ...item,
      SubCategory: item.SubCategory || 'N/A',
      Name: item.Name || 'N/A',
      Relation: item.Relation || 'N/A',
      ReceiptNum: item.ReceiptNum || 'N/A',
      TransDate: formatDate(item.TransDate),
      ClaimedAmount: formatCurrency(item.ClaimedAmount),
      TransAmount: formatCurrency(item.TransAmount),
      AuthAmount: formatCurrency(item.AuthAmount),
      ReceiptStatus: item.IsReceiptAttached ? 'Attached' : 'Not Attached',
    };

    return (
      <DynamicRequestCard
        data={processedItem}
        headerConfig={CARD_CONFIG.headerConfig}
        fields={CARD_CONFIG.fields}
        expandableFields={CARD_CONFIG.expandableFields}
        buttons={getButtonConfig(item)}
        onButtonPress={handleButtonPress}
        isExpandable={true}
        showNavigationArrow={false}
        processingButtons={processingButtons[item.RecId] || []}
        searchQuery={f.searchQuery}
        isMultiSelectMode={isMultiSelectMode}
        isSelected={selectedIds.has(item.RecId)}
        onSelectToggle={handleSelectToggle}
      />
    );
  };

  const getPageTitle = () => {
    return `Medical Expense Lines - ${expenseReportNumber || 'Report'}`;
  };

  const totals = getTotals();

  // ── DEBUG ──
  console.log('[ATTACH DEBUG] isDraft:', isDraft, {
    expenseReportDataStatus: expenseReportData?.ApprovalStatus,
    forceShowAddButton,
  });

  return (
    <ActionPaneContainer
      pageTitle={getPageTitle()}
      showFooter
      showFloatingButton={!isMultiSelectMode && (isDraft || forceShowAddButton)}
      isHeaderActive
      onBackPress={handleGoBack}
      onRefresh={handleRefresh}
      onFloatingButtonPress={handleAddLine}
      showPageTitleRow={true}
      showSearchBar={true}
      {...f.actionPaneProps}>
      {isProcessing && (
        <View style={styles.DLP_ProcessingOverlay}>
          <View style={styles.DLP_ProcessingContainer}>
            <ActivityIndicator size="large" color={P.primaryStrong} />
            <Text style={styles.DLP_ProcessingText}>{processingLabel}</Text>
          </View>
        </View>
      )}

      {isLoading ? (
        <View style={styles.DLP_LoadingContainer}>
          <CustomIndicator />
        </View>
      ) : (
        <Animated.View style={{flex: 1, opacity: fadeAnim}}>
          <View
            style={[
              styles.DLP_SummaryContainer,
              {
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              },
            ]}>
            <View>
              <Text style={styles.DLP_SummaryText}>
                Total amount: {totals.totalClaimed}
              </Text>
              {/* <Text style={styles.DLP_SummaryText}>
                Total Authorized: {totals.totalAuth}
              </Text> */}
            </View>

            {/* Claim Report — always visible, not tied to selection. */}
            <TouchableOpacity
              onPress={handleClaimReport}
              disabled={isProcessing}
              activeOpacity={0.8}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: P.primary,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                opacity: isProcessing ? 0.6 : 1,
              }}>
              <Icon name="file-pdf-o" size={16} color={P.onPrimary} />
              <Text
                style={{
                  color: P.onPrimary,
                  fontWeight: '600',
                  fontSize: 12,
                }}>
                OPD Medical Claim
              </Text>
            </TouchableOpacity>
          </View>

          {f.filteredData.length > 0 ? (
            <FlatList
              data={f.filteredData}
              renderItem={renderExpenseLineCard}
              keyExtractor={(item, index) =>
                item.RecId != null && item.RecId !== 0
                  ? item.RecId.toString()
                  : `line-${index}`
              }
              contentContainerStyle={styles.DLP_ListContainer}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={isLoading}
                  onRefresh={handleRefresh}
                />
              }
            />
          ) : (
            <ScrollView
              contentContainerStyle={styles.DLP_NoDataContainer}
              refreshControl={
                <RefreshControl
                  refreshing={isLoading}
                  onRefresh={handleRefresh}
                />
              }>
              {f.searchQuery.trim() ? (
                <Text style={styles.DLP_NoDataSubText}>
                  No records match "{f.searchQuery}"
                </Text>
              ) : expenseLinesData.length > 0 ? (
                <Text style={styles.DLP_NoDataText}>
                  {`${f.activeFilter} record not found.`}
                </Text>
              ) : (
                <>
                  <Text style={styles.DLP_NoDataText}>
                    No Medical expense lines yet
                  </Text>
                  <Text style={styles.DLP_NoDataSubText}>
                    Tap the + button below to add your first Medical expense
                  </Text>
                </>
              )}
            </ScrollView>
          )}
        </Animated.View>
      )}

      {/* Multi-select floating bar. The "submit" slot is repurposed as Select
          All; the "delete" slot triggers the bulk-delete confirmation. */}
      <MultiSelectActionBar
        visible={isMultiSelectMode}
        selectedCount={selectedIds.size}
        onSubmitAll={handleSelectAll}
        onDeleteAll={handleBulkDeletePress}
        onCancel={exitSelectMode}
        submitLabel="Select All"
        deleteLabel="Delete"
        isDeleting={isProcessing}
        topOffset={8}
      />

      <DynamicAttachmentModal
        visible={receiptModal}
        recordData={selectedExpenseLine}
        recordIdKey="RecId"
        tableName="SLD_MediExpLineDetails"
        onClose={() => {
          setReceiptModal(false);
          setSelectedExpenseLine(null);
        }}
        onSave={() => {
          fetchExpenseLinesData();
        }}
        legalEntity={'IDAP'}
        employeeId={effectiveEmployeeId}
        employeeName={effectiveEmployeeName}
        modalTitle="Medical Expense Receipt"
        showDetails={true}
        detailFields={[
          {key: 'SubCategory', label: 'Sub Category'},
          {key: 'ClaimedAmount', label: 'Claimed Amount'},
          {key: 'ReceiptNum', label: 'Receipt Number'},
        ]}
        detailData={selectedExpenseLine || {}}
        showTakePhoto={true}
        showChooseFile={true}
        showDownload={true}
        showDelete={true}
        // NEW: every other line's RecId currently visible on this screen —
        // "Copy to Lines" pushes the attachment to all of these at once.
        copyToLineIds={expenseLinesData
          .map(line => line.RecId)
          .filter(
            recId =>
              recId != null &&
              recId !== 0 &&
              recId !== selectedExpenseLine?.RecId,
          )}
        showCopyToLines={true}
      />

      <AlertDeleteModal
        visible={deleteModal}
        heading="Confirm Deletion"
        text={`Are you sure you want to delete ${selectedIds.size} selected line(s)?`}
        onPress={handleBulkDeleteConfirm}
        onCancel={() => setDeleteModal(false)}
        isProcessing={isProcessing}
      />

      {/* Single-line delete. Mirrors the reference Expense Lines modal exactly:
          literal heading/text and NO isProcessing prop, so the per-row spinner
          renders in the card kebab (processingButtons) and the modal never hits
          the modals.deleting key. */}
      <AlertDeleteModal
        visible={singleDeleteModal}
        heading="Confirm Deletion"
        text="Are you sure you want to delete this line?"
        onPress={handleSingleDeleteConfirm}
        onCancel={() => {
          setSingleDeleteModal(false);
          setItemToDelete(null);
        }}
      />

      <AlertModal {...alertModalProps} />
    </ActionPaneContainer>
  );
};

export default MedicalExpenseLinesListPage;
