/* eslint-disable curly */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
// Lines list for a NEW Expense Management header. Mirrors the Travel
// Requisition lines list: read-only cards, per-row delete, long-press bulk
// delete, floating + to add — all gated on the parent header still being
// editable.
import React, {useCallback, useState, useEffect, useRef} from 'react';
import {
  Text,
  RefreshControl,
  ScrollView,
  FlatList,
  View,
  BackHandler,
  Animated,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
} from 'react-native';
import {useSelector} from 'react-redux';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';

import {FindExpenseManagementLines} from '../../../API/ExpenseManagement/Lines/FindExpenseManagementLines';
import {DeleteExpenseManagementLines} from '../../../API/ExpenseManagement/Lines/DeleteExpenseManagementLines';
import TravelRequisitionSiteSurveyReport from './TravelRequisitionSiteSurveyReport';

import AlertModal from '../../../../../components/Alert/AlertModal';
import useAlertModal from '../../../../../hooks/useAlertModal';
import AlertDeleteModal from '../../../../../components/Alert/AlertDeleteModal';
import DynamicRequestCard from '../../../../../components/DynamicRequestCard';
import ActionPaneContainer from '../../../../../components/ActionPaneContainer';
import CustomIndicator from '../../../../../components/CustomIndicator/CustomIndicator';
import MultiSelectActionBar from '../../../../../components/MultiSelectActionBar';
import styles from '../../../../../styles/styles';
import useListFilters from '../../../../../hooks/useListFilters';
import useNotify from '../../../../../hooks/useNotify';
import usePalette from '../../../../../hooks/usePalette';
import DynamicAttachmentModal from '../../../../../shared/DynamicAttachmentModal';
import {translate as t} from '../../../../../store/utils/translate';

// ── HEADER-STATUS LOCK ────────────────────────────────────────────────────────
// Lines are only creatable/deletable while the parent header is still in its
// draft/create state. Once it goes to workflow the lines are view-only.

const ExpenseManagementLinesListPage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const P = usePalette();
  const {notifySuccess, notifyError} = useNotify('Expense Lines');
  const {refresh} = route.params || {};
  const handledRefreshRef = useRef(null);

  const {
    headerRecId,
    expenseNumber,
    approvalStatus,
    personnelNumber,
    employeeId,
    employeeName,
    WorkerRecId,
    legalEntity,
    cameFrom,
    originalCameFrom,
    userData: routeUserData,
  } = route.params || {};

  const reduxUserData = useSelector(state => state.user.userData);
  const isDraft = approvalStatus === 'Draft';
  const {forceShowAddButton} = route.params || {};

  const effectiveUserData = routeUserData || reduxUserData;
  const effectiveEmployeeId = employeeId || effectiveUserData?.employeeId;
  const effectiveEmployeeName = employeeName || effectiveUserData?.employeeName;
  const effectiveWorkerRecId = WorkerRecId || effectiveUserData?.WorkerRecId;
  const effectivePersonnelNumber = personnelNumber || effectiveEmployeeId;

  // A header we have JUST created arrives here from ExpenseManagementSaveRecord
  // with no approvalStatus param at all — it is a brand-new draft by definition,
  // so an absent status must read as editable, not as locked.

  const [isLoading, setIsLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));
  const {showSuccess, showError, showWarning, alertModalProps} =
    useAlertModal();
  const [linesData, setLinesData] = useState([]);

  // Multi-select — long-press a row to enter, tap rows to toggle.
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);

  // Single-line delete (per-card kebab → Delete).
  const [itemToDelete, setItemToDelete] = useState(null);
  const [singleDeleteModal, setSingleDeleteModal] = useState(false);
  const [processingButtons, setProcessingButtons] = useState({});
  const [attachmentModalVisible, setAttachmentModalVisible] = useState(false);
  const [selectedLineItem, setSelectedLineItem] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingLabel, setProcessingLabel] = useState('');
  // CostType up top, currency + claimed amount + transaction date in the body,
  // the backend-derived PKR value and meal reduction behind the expander.
  // const CARD_CONFIG = {
  //   headerConfig: {
  //     title: {key: 'CostType', label: 'Cost Type'},
  //     subtitle: {key: 'ExchangeCode', label: 'Currency'},
  //   },
  //   fields: [
  //     {key: 'Transaction', label: 'Transaction date', type: 'text'},
  //     {key: 'ClaimedAmount', label: 'Claimed amount', type: 'text'},
  //     {key: 'ClaimedAmount', label: 'Transaction amount', type: 'text'},
  //   ],
  //   expandableFields: [
  //     {key: 'ExchangeCode', label: 'Currency', type: 'text'},
  //     {key: 'AmountInPKR', label: 'Amount (PKR)', type: 'text'},
  //     {key: 'MealReductionAmount', label: 'Meal Reduction', type: 'text'},
  //     {key: 'DepartureLocation', label: 'Departure location', type: 'text'},
  //     {
  //       key: 'DepartureDateTime',
  //       label: 'Departure date and time',
  //       type: 'text',
  //     },
  //     {key: 'ArrivalLocation', label: 'Arrival location', type: 'text'},
  //     {
  //       key: 'ArrivalDateTime',
  //       label: 'Arrival date and time',
  //       type: 'text',
  //     },
  //     {key: 'DateFrom', label: 'Per diem from date', type: 'text'},
  //     {key: 'DateTo', label: 'Per diem to date', type: 'text'},
  //     {key: 'RatePerMile', label: 'Rate per mile', type: 'text'},
  //   ],
  // };

  // headerConfig stays the same across all categories — CostType is the card
  // title regardless, so it's not repeated inside fields/expandableFields.
  const getCardConfig = costType => {
    const category = getCostCategory(costType);

    const headerConfig = {
      title: {key: 'CostType', label: 'Cost Type'},
      subtitle: {key: 'ExchangeCode', label: 'Currency'},
    };

    if (category === 'perDiem') {
      return {
        headerConfig,
        fields: [
          {key: 'Transaction', label: 'Transaction date', type: 'text'},
          {key: 'ClaimedAmount', label: 'Claimed amount', type: 'text'},
          {key: 'ExchangeCode', label: 'Currency', type: 'text'},
        ],
        expandableFields: [
          {key: 'AmountInPKR', label: 'Amount (PKR)', type: 'text'},
          {key: 'DateFrom', label: 'Per diem from date', type: 'text'},
          {key: 'DateTo', label: 'Per diem to date', type: 'text'},
          {key: 'MealReductionAmount', label: 'Meal Reduction', type: 'text'},
        ],
      };
    }

    if (category === 'mileage') {
      return {
        headerConfig,
        fields: [
          {key: 'Transaction', label: 'Transaction date', type: 'text'},
          {key: 'ClaimedAmount', label: 'Claimed amount', type: 'text'},
        ],
        expandableFields: [
          {key: 'AmountInPKR', label: 'Amount (PKR)', type: 'text'},
          {key: 'Mileage', label: 'Mileage', type: 'text'},
          {key: 'RatePerMile', label: 'Rate per mile', type: 'text'},
          {key: 'DepartureLocation', label: 'Departure location', type: 'text'},
          {
            key: 'DepartureDateTime',
            label: 'Departure date and time',
            type: 'text',
          },
          {key: 'ArrivalLocation', label: 'Arrival location', type: 'text'},
          {
            key: 'ArrivalDateTime',
            label: 'Arrival date and time',
            type: 'text',
          },
        ],
      };
    }

    // default — Bus, Car Fuel, Flight, Hotel, Rail, Taxi, Toll Tax, Visa Fee, etc.
    return {
      headerConfig,
      fields: [
        {key: 'Transaction', label: 'Transaction date', type: 'text'},
        {key: 'ClaimedAmount', label: 'Claimed amount', type: 'text'},
        {key: 'ClaimedAmount', label: 'Transaction amount', type: 'text'},
        {key: 'ExchangeCode', label: 'Currency', type: 'text'},
      ],
      expandableFields: [
        {key: 'DepartureLocation', label: 'Departure location', type: 'text'},
        {
          key: 'DepartureDateTime',
          label: 'Departure date and time',
          type: 'text',
        },
        {key: 'ArrivalLocation', label: 'Arrival location', type: 'text'},
        {key: 'ArrivalDateTime', label: 'Arrival date and time', type: 'text'},
      ],
    };
  };

  const getCostCategory = costType => {
    const ct = String(costType || '').toLowerCase();
    if (ct.includes('per diem')) return 'perDiem';
    if (ct.includes('mileage')) return 'mileage';
    return 'default';
  };

  useEffect(() => {
    return () => {
      setLinesData([]);
      setIsMultiSelectMode(false);
      setSelectedIds(new Set());
      setItemToDelete(null);
      setSingleDeleteModal(false);
      setProcessingButtons({});
    };
  }, []);

  const setButtonProcessing = (recId, buttonType, isProcessing) =>
    setProcessingButtons(prev => ({
      ...prev,
      [recId]: isProcessing
        ? [...(prev[recId] || []), buttonType]
        : (prev[recId] || []).filter(btn => btn !== buttonType),
    }));

  // Local-safe date→string conversion — NEVER use .toISOString() here, it
  // shifts to UTC (wrong clock time, possible day-flip) and appends ms/Z that
  // SaveRecord's parseLocalDateTime chokes on (NaN seconds → Invalid Date).
  const toLocalDateTimeString = value => {
    if (!value) return '';
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return '';
    const pad = n => String(n).padStart(2, '0');
    return (
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
      `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    );
  };

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

  // Add this helper next to formatDate/formatCurrency
  const formatDateTime = value => {
    if (!value) return 'N/A';
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return 'N/A';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours === 0 ? 12 : hours; // 0 → 12
    const hoursStr = String(hours).padStart(2, '0');

    return `${day}/${month}/${year} ${hoursStr}:${minutes} ${ampm}`;
  };

  const formatNumber = value => {
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num)) return 'N/A';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const f = useListFilters({
    data: linesData,
    dateField: 'Transaction',
  });

  const fetchLinesData = useCallback(async () => {
    if (!headerRecId) {
      // ── DIAGNOSTIC ──
      console.log(
        '[ExpMgmt LINES FIND] bailing — missing headerRecId. route.params:',
        JSON.stringify(route.params || {}),
      );
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
      const lines = await FindExpenseManagementLines(headerRecId);

      // Newest transaction first.
      const sortedLines = (lines || []).sort((a, b) => {
        const dateA = a.Transaction ? new Date(a.Transaction) : 0;
        const dateB = b.Transaction ? new Date(b.Transaction) : 0;
        return dateB - dateA;
      });

      setLinesData(sortedLines);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Failed to fetch Expense Management Lines data:', error);
      showError('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, [headerRecId]);

  const handleGoBack = useCallback(() => {
    navigation.navigate('ExpenseManagementHeaderListPage', {
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
      WorkerRecId: effectiveWorkerRecId,
      personnelNumber: effectivePersonnelNumber,
      userData: {
        employeeId: effectiveEmployeeId,
        employeeName: effectiveEmployeeName,
        WorkerRecId: effectiveWorkerRecId,
      },
      cameFrom: originalCameFrom || cameFrom || 'DrawerNavigator',
    });
  }, [
    navigation,
    effectiveEmployeeId,
    effectiveEmployeeName,
    effectiveWorkerRecId,
    effectivePersonnelNumber,
    originalCameFrom,
    cameFrom,
  ]);

  useFocusEffect(
    useCallback(() => {
      if (refresh && handledRefreshRef.current !== refresh) {
        handledRefreshRef.current = refresh;
        f.resetFilters();
      }
      setIsLoading(true);
      fetchLinesData();
    }, [fetchLinesData, refresh]),
  );

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
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
    }, [isMultiSelectMode, handleGoBack, navigation]),
  );

  // ── Add a new line ──────────────────────────────────────────
  const handleAddLine = useCallback(() => {
    navigation.navigate('ExpenseManagementLineSaveRecord', {
      headerRecId,
      expenseNumber,
      approvalStatus,
      personnelNumber: effectivePersonnelNumber,
      workerRecId: effectiveWorkerRecId,
      legalEntity,
      userData: {
        employeeId: effectiveEmployeeId,
        employeeName: effectiveEmployeeName,
        WorkerRecId: effectiveWorkerRecId,
      },
      cameFrom: 'ExpenseManagementLinesListPage',
      originalCameFrom: originalCameFrom || cameFrom,
    });
  }, [
    navigation,
    headerRecId,
    expenseNumber,
    approvalStatus,
    effectivePersonnelNumber,
    effectiveWorkerRecId,
    legalEntity,
    effectiveEmployeeId,
    effectiveEmployeeName,
    originalCameFrom,
    cameFrom,
  ]);

  const handleEditLine = itemData => {
    const rawItem =
      linesData.find(l => l.LineRecId === itemData.LineRecId) || itemData;

    navigation.navigate('ExpenseManagementLineSaveRecord', {
      mode: 'edit',
      lineData: {
        ...rawItem,
        Transaction: toLocalDateTimeString(rawItem.Transaction),
        DateFrom: toLocalDateTimeString(rawItem.DateFrom),
        DateTo: toLocalDateTimeString(rawItem.DateTo),
        DepartureDateTime: toLocalDateTimeString(rawItem.DepartureDateTime),
        ArrivalDateTime: toLocalDateTimeString(rawItem.ArrivalDateTime),
      },
      headerRecId,
      expenseNumber,
      approvalStatus,
      personnelNumber: effectivePersonnelNumber,
      workerRecId: effectiveWorkerRecId,
      legalEntity,
      userData: {
        employeeId: effectiveEmployeeId,
        employeeName: effectiveEmployeeName,
        WorkerRecId: effectiveWorkerRecId,
      },
      cameFrom: 'ExpenseManagementLinesListPage',
      originalCameFrom: originalCameFrom || cameFrom,
    });
  };

  const handleSiteSurveyReport = () => {
    navigation.navigate('TravelRequisitionSiteSurveyReport', {
      expenseNumber,
      headerRecId,
      approvalStatus,
      personnelNumber: effectivePersonnelNumber,
      workerRecId: effectiveWorkerRecId,
      legalEntity,
      userData: {
        employeeId: effectiveEmployeeId,
        employeeName: effectiveEmployeeName,
        WorkerRecId: effectiveWorkerRecId,
      },
      cameFrom: 'ExpenseManagementLinesListPage',
      originalCameFrom: originalCameFrom || cameFrom,
    });
  };

  // ── Multi-select ────────────────────────────────────────────
  const enterSelectMode = data => {
    setIsMultiSelectMode(true);
    setSelectedIds(new Set([data.LineRecId]));
  };

  const handleSelectToggle = data => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(data.LineRecId)) next.delete(data.LineRecId);
      else next.add(data.LineRecId);
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
      .map(item => item.LineRecId)
      .filter(id => id !== undefined && id !== null && id !== 0);
    setSelectedIds(new Set(allIds));
  };

  const handleBulkDeletePress = () => {
    if (selectedIds.size === 0) {
      showWarning('No records selected for deletion.');
      return;
    }
    setDeleteModal(true);
  };

  const handleAttachmentPress = itemData => {
    try {
      const cleanedItem = {
        ...itemData,
        Transaction: formatDate(itemData.Transaction),
        ClaimedAmount: formatCurrency(itemData.ClaimedAmount),
      };
      setSelectedLineItem(cleanedItem);
      setAttachmentModalVisible(true);
    } catch (error) {
      showError('Failed to open attachments.');
    }
  };

  const handleBulkDeleteConfirm = async () => {
    setIsBulkDeleting(true);
    setIsProcessing(true);
    setProcessingLabel('Deleting');

    const recIds = Array.from(selectedIds);

    try {
      const result = await DeleteExpenseManagementLines(recIds);

      if (result.IsSuccess) {
        notifySuccess(result.Message);
        showSuccess(result.Message);
        exitSelectMode();
      } else {
        notifyError(result.Message);
        showError(result.Message);
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
      console.error('Bulk delete expense lines error:', error);
      notifyError('Failed to delete record(s). Please try again.');
      showError('Failed to delete record(s). Please try again.');
    } finally {
      setIsBulkDeleting(false);
      setIsProcessing(false);
      setDeleteModal(false);
      fetchLinesData();
    }
  };

  const handleButtonPress = (buttonType, itemData) => {
    if (buttonType === 'delete') handleSingleDeletePress(itemData);
    else if (buttonType === 'attachment') handleAttachmentPress(itemData);
    else if (buttonType === 'edit') handleEditLine(itemData);
  };

  const handleSingleDeletePress = itemData => {
    setItemToDelete(itemData);
    setSingleDeleteModal(true);
  };

  const handleSingleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    const recId = itemToDelete.LineRecId;
    setButtonProcessing(recId, 'delete', true);
    setIsProcessing(true);
    setProcessingLabel('Deleting');

    try {
      const result = await DeleteExpenseManagementLines([recId]);

      if (result.IsSuccess) {
        notifySuccess(result.Message);
        showSuccess(result.Message);
        setLinesData(prev => prev.filter(line => line.LineRecId !== recId));
      } else {
        notifyError(result.Message);
        showError(result.Message);
      }
    } catch (error) {
      console.error('Single delete expense line error:', error);
      notifyError('Failed to delete record. Please try again.');
      showError('Failed to delete record. Please try again.');
    } finally {
      setButtonProcessing(recId, 'delete', false);
      setIsProcessing(false);
      setSingleDeleteModal(false);
      setItemToDelete(null);
      fetchLinesData();
    }
  };

  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    fetchLinesData();
  }, [fetchLinesData]);

  const getTotals = () => {
    // Transaction-currency total from ClaimedAmount; PKR total from the
    // backend-derived AmountInPKR.
    // TODO(confirm): which total the users actually want headlined — both are
    // shown for now, and the [ExpMgmt LINES FIND] log will show whether
    // AmountInPKR is even populated on find.
    const totalClaimed = linesData.reduce(
      (sum, line) => sum + (Number(line.ClaimedAmount) || 0),
      0,
    );
    const totalPKR = linesData.reduce(
      (sum, line) => sum + (Number(line.AmountInPKR) || 0),
      0,
    );
    return {
      totalClaimed: formatCurrency(totalClaimed),
      totalPKR: formatCurrency(totalPKR),
    };
  };

  const renderLineCard = ({item}) => {
    const cardConfig = getCardConfig(item.CostType);
    const processedItem = {
      ...item,
      CostType: item.CostType || 'N/A',
      ExchangeCode: item.ExchangeCode || 'N/A',
      Transaction: formatDate(item.Transaction),
      ClaimedAmount: formatCurrency(item.ClaimedAmount),
      AmountInPKR: formatCurrency(item.AmountInPKR),
      MealReductionAmount: formatCurrency(item.MealReductionAmount),
      DepartureDateTime: formatDateTime(item.DepartureDateTime),
      ArrivalDateTime: formatDateTime(item.ArrivalDateTime),
      DateFrom: formatDateTime(item.DateFrom),
      DateTo: formatDateTime(item.DateTo),
    };

    const buttons = {
      edit: {
        show: true,
        position: 'header',
        style: 'icon',
        icon: 'edit',
        iconSize: 20,
        iconColor: '#fff',
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
        iconColor: '#fff',
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
        iconColor: '#fff',
        backgroundColor: P.primary,
        disabled: false,
        customStyle: {},
      },
    };

    return (
      <DynamicRequestCard
        data={processedItem}
        headerConfig={cardConfig.headerConfig}
        fields={cardConfig.fields}
        expandableFields={cardConfig.expandableFields}
        buttons={buttons}
        onButtonPress={handleButtonPress}
        isExpandable={true}
        showNavigationArrow={false}
        gradientColors={[P.tint, P.tint]}
        processingButtons={processingButtons[item.LineRecId] || []}
        searchQuery={f.searchQuery}
        isMultiSelectMode={isMultiSelectMode}
        isSelected={selectedIds.has(item.LineRecId)}
        onSelectToggle={handleSelectToggle}
        onLongPress={enterSelectMode}
      />
    );
  };

  const getPageTitle = () => `Expense lines - ${expenseNumber || 'Expense'}`;

  const totals = getTotals();

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
              {/* <Text style={styles.DLP_SummaryText}>
                Total Claimed: {totals.totalClaimed}
              </Text> */}
              <Text style={styles.DLP_SummaryText}>
                Total (PKR): {totals.totalPKR}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleSiteSurveyReport}
              activeOpacity={0.7}>
              <Text
                style={{
                  color: P.primary,
                  fontSize: 13,
                  fontWeight: '600',
                  textDecorationLine: 'underline',
                }}>
                Site Survey Report
              </Text>
            </TouchableOpacity>
          </View>

          {f.filteredData.length > 0 ? (
            <FlatList
              data={f.filteredData}
              renderItem={renderLineCard}
              keyExtractor={(item, index) =>
                item.LineRecId != null && item.LineRecId !== 0
                  ? item.LineRecId.toString()
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
              ) : linesData.length > 0 ? (
                <Text style={styles.DLP_NoDataText}>
                  No lines match the current filters.
                </Text>
              ) : (
                <>
                  <Text style={styles.DLP_NoDataText}>
                    No Expense Lines yet
                  </Text>
                  <Text style={styles.DLP_NoDataSubText}>
                    Tap the + button below to add your first expense lines
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
        isDeleting={isBulkDeleting}
        topOffset={8}
      />

      <AlertDeleteModal
        visible={deleteModal}
        heading="Confirm Deletion"
        text={`Are you sure you want to delete ${selectedIds.size} selected line(s)?`}
        onPress={handleBulkDeleteConfirm}
        onCancel={() => setDeleteModal(false)}
        isProcessing={isBulkDeleting}
      />

      <DynamicAttachmentModal
        visible={attachmentModalVisible}
        recordData={selectedLineItem}
        recordIdKey="LineRecId"
        tableName="TrvExpTrans"
        onClose={() => {
          setAttachmentModalVisible(false);
          setSelectedLineItem(null);
        }}
        onSave={() => {
          fetchLinesData();
        }}
        legalEntity={legalEntity}
        employeeId={effectiveEmployeeId}
        employeeName={effectiveEmployeeName}
        modalTitle="Expense Line Attachments"
        showDetails={true}
        detailFields={[
          {key: 'CostType', label: 'Cost Type'},
          {key: 'ExchangeCode', label: 'Currency'},
          {key: 'ClaimedAmount', label: 'Claimed Amount'},
          {key: 'Transaction', label: 'Transaction Date'},
        ]}
        detailData={selectedLineItem || {}}
        showTakePhoto={true}
        showChooseFile={true}
        showDownload={true}
        showDelete={true}
      />

      <Modal
        visible={isProcessing}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => {}}>
        <View style={styles.DLP_ProcessingOverlay}>
          <View style={styles.DLP_ProcessingContainer}>
            <ActivityIndicator size="large" color={P.primary} />
            <Text style={styles.DLP_ProcessingText}>
              {t('common.processing')}
            </Text>
          </View>
        </View>
      </Modal>

      {/* Single-line delete. No isProcessing prop, so the per-row spinner
          renders in the card kebab (processingButtons) rather than the modal. */}
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

export default ExpenseManagementLinesListPage;
