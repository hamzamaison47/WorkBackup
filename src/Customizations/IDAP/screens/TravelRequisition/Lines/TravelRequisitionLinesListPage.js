/* eslint-disable curly */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, {useCallback, useState, useEffect} from 'react';
import {
  Text,
  RefreshControl,
  ScrollView,
  FlatList,
  View,
  BackHandler,
  Animated,
  ActivityIndicator,
} from 'react-native';
import {useSelector} from 'react-redux';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';

import {FindTravelRequisitionLines} from '../../../API/TravelRequisition/Lines/FindTravelRequisitionLines';
import {DeleteTravelRequisitionLines} from '../../../API/TravelRequisition/Lines/DeleteTravelRequisitionLines';

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

const TravelRequisitionLinesListPage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const P = usePalette();
  const {notifySuccess, notifyError} = useNotify('Travel Requisition Lines');

  const {
    headerRecId,
    requisitionNumber,
    employeeId,
    employeeName,
    WorkerRecId,
    legalEntity,
    cameFrom,
    originalCameFrom,
    travelRequisitionData,
    forceShowAddButton,
    refresh,
    userData: routeUserData,
  } = route.params || {};

  const reduxUserData = useSelector(state => state.user.userData);

  const effectiveUserData = routeUserData || reduxUserData;
  const effectiveEmployeeId = employeeId || effectiveUserData?.employeeId;
  const effectiveEmployeeName = employeeName || effectiveUserData?.employeeName;
  const effectiveWorkerRecId = WorkerRecId || effectiveUserData?.WorkerRecId;

  // showAddButton and isHeaderDraft are derived from the SAME signal (header
  // status), so they're kept as two states driven by one focus effect. Both
  // fall back to forceShowAddButton/refresh because SaveRecord navigates
  // back (Cancel or successful Create/Update) WITHOUT re-sending
  // travelRequisitionData, so `status` would be undefined on return and both
  // flags would otherwise incorrectly default to "not draft".
  const [showAddButton, setShowAddButton] = useState(false);
  const [isHeaderDraft, setIsHeaderDraft] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const status = travelRequisitionData?.ApprovalStatus;

      if (status) {
        // We have a real, current status for this header — trust it over any
        // stale forceShowAddButton/refresh flag from a previous navigation.
        const statusSaysDraft = status === 'Draft' || status === 'Create';
        setShowAddButton(statusSaysDraft);
        setIsHeaderDraft(statusSaysDraft);
        return;
      }

      // No status available this time (e.g. returning from SaveRecord, which
      // doesn't resend travelRequisitionData) — fall back to the flags.
      const nextIsDraft = !!forceShowAddButton || !!refresh;
      setShowAddButton(nextIsDraft);
      setIsHeaderDraft(nextIsDraft);
    }, [travelRequisitionData?.ApprovalStatus, forceShowAddButton, refresh]),
  );

  const [isLoading, setIsLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));
  const {showSuccess, showError, showWarning, hide, alertModalProps} =
    useAlertModal();
  const [linesData, setLinesData] = useState([]);

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

  // Read-only card: Category up top, currency/date/amount in the fields, the
  // read-only PKR-converted value behind the expander.
  const getCardConfig = category => {
    const group = getLineCategoryGroup(category);

    const headerConfig = {
      title: {key: 'Category', label: 'Category'},
    };

    const fields = [
      {key: 'EstimatedDate', label: 'Estimated date', type: 'text'},
      {key: 'EstimatedAmount', label: 'Estimated amount', type: 'text'},
      {key: 'Currency', label: 'Currency'},
    ];

    if (group === 'AIRLINE') {
      return {
        headerConfig,
        fields,
        expandableFields: [
          {key: 'AmountInPKR', label: 'Amount in PKR', type: 'text'},
          {
            key: 'AirlineServiceClass',
            label: 'Airline service class',
            type: 'text',
          },
        ],
      };
    }

    if (group === 'PERDIEM') {
      return {
        headerConfig,
        fields,
        expandableFields: [
          {key: 'AmountInPKR', label: 'Amount in PKR', type: 'text'},
          {key: 'PerDiemFromDate', label: 'Per diem from date', type: 'text'},
          {key: 'PerDiemToDate', label: 'Per diem to date', type: 'text'},
        ],
      };
    }

    if (group === 'MILEAGE') {
      return {
        headerConfig,
        fields,
        expandableFields: [
          {key: 'AmountInPKR', label: 'Amount in PKR', type: 'text'},
          {key: 'Mileage', label: 'Mileage', type: 'text'},
        ],
      };
    }

    // STANDARD — Bus, Car Fuel, Hotel INT/Loc, Other Expenses, Rail, Taxi/Rickshaw, Toll Tax, Visa Fee
    return {
      headerConfig,
      fields,
      expandableFields: [
        {key: 'AmountInPKR', label: 'Amount in PKR', type: 'text'},
      ],
    };
  };

  useEffect(() => {
    return () => {
      setLinesData([]);
      setIsMultiSelectMode(false);
      setSelectedIds(new Set());
      setItemToDelete(null);
      setSingleDeleteModal(false);
      setProcessingButtons({});
      setIsProcessing(false);
    };
  }, []);

  const setButtonProcessing = (recId, buttonType, processing) =>
    setProcessingButtons(prev => ({
      ...prev,
      [recId]: processing
        ? [...(prev[recId] || []), buttonType]
        : (prev[recId] || []).filter(btn => btn !== buttonType),
    }));

  // dd/mm/yyyy — matches the format used across the Save/Edit screen.
  const formatDate = value => {
    if (!value) return 'N/A';
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return 'N/A';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // AM/PM date+time formatter — used only for per-diem from/to display.
  const formatDateTimeAMPM = value => {
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
    hours = hours === 0 ? 12 : hours;
    const hoursStr = String(hours).padStart(2, '0');

    return `${day}/${month}/${year} ${hoursStr}:${minutes} ${ampm}`;
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

  const getLineCategoryGroup = category => {
    if (!category) return 'STANDARD';
    const normalized = String(category).trim();

    if (normalized === 'Car Mileage') return 'MILEAGE';
    if (normalized === 'Flight International' || normalized === 'Flight Local')
      return 'AIRLINE';
    if (/^Per Diem( INT)? G-\d+$/i.test(normalized)) return 'PERDIEM';

    return 'STANDARD';
  };

  // Search + sort via useListFilters (no pills). Date filter + sort key off
  // the line estimated date.
  const f = useListFilters({
    data: linesData,
    dateField: 'EstimatedDate',
  });

  const fetchLinesData = useCallback(async () => {
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
      const lines = await FindTravelRequisitionLines(headerRecId);

      const sortedLines = (lines || []).sort((a, b) => {
        const dateA = a.EstimatedDate ? new Date(a.EstimatedDate) : 0;
        const dateB = b.EstimatedDate ? new Date(b.EstimatedDate) : 0;
        return dateB - dateA;
      });

      setLinesData(sortedLines);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Failed to fetch Travel Requisition Lines data:', error);
      showError('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, [headerRecId]);

  // Refetch on focus (also covers the refresh flag SaveRecord passes back).
  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchLinesData();
    }, [fetchLinesData]),
  );

  const handleGoBack = useCallback(() => {
    navigation.navigate('TravelRequisitionListPage', {
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
      WorkerRecId: effectiveWorkerRecId,
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
    originalCameFrom,
    cameFrom,
  ]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (isMultiSelectMode) {
          exitSelectMode();
          return true;
        }
        handleGoBack();
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [navigation, isMultiSelectMode]),
  );

  // ── Add a new line ──────────────────────────────────────────
  // mode/lineData are set EXPLICITLY (not omitted) because navigation.navigate
  // merges params onto an already-mounted route rather than replacing them —
  // omitting these keys would let a previous edit session's mode:'edit' and
  // lineData leak through and make this "Add" navigation open in edit mode
  // with stale data.
  const handleAddLine = useCallback(() => {
    navigation.navigate('TravelRequisitionLinesSaveRecord', {
      mode: 'create',
      lineData: undefined,
      headerRecId,
      requisitionNumber,
      workerRecId: effectiveWorkerRecId,
      legalEntity,
      userData: {
        employeeId: effectiveEmployeeId,
        employeeName: effectiveEmployeeName,
        WorkerRecId: effectiveWorkerRecId,
      },
      cameFrom: 'TravelRequisitionLinesListPage',
      originalCameFrom: originalCameFrom || cameFrom,
    });
  }, [
    navigation,
    headerRecId,
    requisitionNumber,
    effectiveWorkerRecId,
    legalEntity,
    effectiveEmployeeId,
    effectiveEmployeeName,
    originalCameFrom,
    cameFrom,
  ]);

  // ── Edit an existing line ────────────────────────────────────
  const handleEditLine = itemData => {
    navigation.navigate('TravelRequisitionLinesSaveRecord', {
      mode: 'edit',
      lineData: {
        ...itemData,
        // Dates can arrive as JS Date instances from FindTravelRequisitionLines;
        // stringify before putting them in navigation params (React Navigation
        // warns on non-serializable param values, and SaveRecord's own
        // toDateString() handles the string form directly).
        EstimatedDate:
          itemData.EstimatedDate instanceof Date
            ? itemData.EstimatedDate.toISOString()
            : itemData.EstimatedDate,
      },
      headerRecId,
      requisitionNumber,
      workerRecId: effectiveWorkerRecId,
      legalEntity,
      userData: {
        employeeId: effectiveEmployeeId,
        employeeName: effectiveEmployeeName,
        WorkerRecId: effectiveWorkerRecId,
      },
      cameFrom: 'TravelRequisitionLinesListPage',
      originalCameFrom: originalCameFrom || cameFrom,
    });
  };

  // ── Multi-select ────────────────────────────────────────────
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
      showWarning('No records selected for deletion.');
      return;
    }
    setDeleteModal(true);
  };

  const handleBulkDeleteConfirm = async () => {
    setDeleteModal(false);
    setIsProcessing(true);
    const recIds = Array.from(selectedIds);

    try {
      const result = await DeleteTravelRequisitionLines(recIds);
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
      console.error('Bulk delete travel requisition lines error:', error);
      notifyError('Failed to delete record(s). Please try again.');
      showError('Failed to delete record(s). Please try again.');
    } finally {
      setIsProcessing(false);
      fetchLinesData();
    }
  };

  // Edit/Delete buttons ALWAYS render (show: true) — only `disabled` and
  // `customStyle` reflect draft status. Tying `show` to status caused the
  // buttons to vanish entirely (rather than just grey out) right after
  // create, when isHeaderDraft could momentarily read as false.
  const getLineButtonConfig = () => ({
    edit: {
      show: true,
      position: 'header',
      style: 'icon',
      icon: 'edit',
      iconSize: 20,
      iconColor: '#fff',
      backgroundColor: P.primary,
      disabled: !isHeaderDraft,
      customStyle: !isHeaderDraft ? {backgroundColor: '#BDBDBD'} : {},
    },
    delete: {
      show: true,
      position: 'header',
      style: 'icon',
      icon: 'trash',
      iconSize: 20,
      iconColor: '#fff',
      backgroundColor: P.primary,
      disabled: !isHeaderDraft,
      customStyle: !isHeaderDraft ? {backgroundColor: '#BDBDBD'} : {},
    },
  });

  const handleButtonPress = (buttonType, itemData) => {
    if (buttonType === 'delete') handleSingleDeletePress(itemData);
    if (buttonType === 'edit') {
      // Look up the RAW (unformatted) line by RecId — renderLineCard's
      // processedItem has already been through formatDate/formatCurrency.
      const rawItem =
        linesData.find(l => l.RecId === itemData.RecId) || itemData;
      handleEditLine(rawItem);
    }
  };

  const handleSingleDeletePress = itemData => {
    setItemToDelete(itemData);
    setSingleDeleteModal(true);
  };

  const handleSingleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    setSingleDeleteModal(false);
    const recId = itemToDelete.RecId;
    setIsProcessing(true);
    setButtonProcessing(recId, 'delete', true);

    try {
      const result = await DeleteTravelRequisitionLines([recId]);
      if (result.IsSuccess) {
        notifySuccess(result.Message);
        showSuccess(result.Message);
        setLinesData(prev => prev.filter(line => line.RecId !== recId));
      } else {
        notifyError(result.Message);
        showError(result.Message);
      }
    } catch (error) {
      console.error('Single delete travel requisition line error:', error);
      notifyError('Failed to delete record. Please try again.');
      showError('Failed to delete record. Please try again.');
    } finally {
      setIsProcessing(false);
      setButtonProcessing(recId, 'delete', false);
      setItemToDelete(null);
      fetchLinesData();
    }
  };

  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    fetchLinesData();
  }, [fetchLinesData]);

  const getTotals = () => {
    const totalPKR = linesData.reduce(
      (sum, line) => sum + (Number(line.AmountInPKR) || 0),
      0,
    );
    return {
      totalPKR: formatCurrency(totalPKR),
    };
  };

  const renderLineCard = ({item}) => {
    const cardConfig = getCardConfig(item.Category);

    const processedItem = {
      ...item,
      Category: item.Category || 'N/A',
      Currency: item.Currency || 'N/A',
      EstimatedDate: formatDate(item.EstimatedDate),
      EstimatedAmount: formatCurrency(item.EstimatedAmount),
      AmountInPKR: formatCurrency(item.AmountInPKR),
      AirlineServiceClass: item.AirlineServiceClass || 'N/A',
      PerDiemFromDate: formatDateTimeAMPM(item.PerDiemFromDate), // ← was formatDate
      PerDiemToDate: formatDateTimeAMPM(item.PerDiemToDate), // ← was formatDate
      Mileage: item.Mileage != null ? Number(item.Mileage).toFixed(2) : 'N/A',
    };

    return (
      <DynamicRequestCard
        data={processedItem}
        headerConfig={cardConfig.headerConfig}
        fields={cardConfig.fields}
        expandableFields={cardConfig.expandableFields}
        buttons={getLineButtonConfig()}
        onButtonPress={handleButtonPress}
        isExpandable={true}
        showNavigationArrow={false}
        gradientColors={[P.tint, P.tint]}
        processingButtons={processingButtons[item.RecId] || []}
        searchQuery={f.searchQuery}
        isMultiSelectMode={isMultiSelectMode}
        isSelected={selectedIds.has(item.RecId)}
        onSelectToggle={handleSelectToggle}
      />
    );
  };

  const getPageTitle = () =>
    `Travel requisition lines - ${requisitionNumber || 'Requisition'}`;

  const totals = getTotals();

  return (
    <ActionPaneContainer
      pageTitle={getPageTitle()}
      showFooter
      showFloatingButton={showAddButton}
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
            <ActivityIndicator size="large" color={P.primary} />
            <Text style={styles.DLP_ProcessingText}>Deleting</Text>
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
                Total amount (PKR): {totals.totalPKR}
              </Text>
            </View>
          </View>

          {f.filteredData.length > 0 ? (
            <FlatList
              data={f.filteredData}
              renderItem={renderLineCard}
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
              ) : (
                <>
                  <Text style={styles.DLP_NoDataText}>
                    No Travel Requisition Lines yet
                  </Text>
                  <Text style={styles.DLP_NoDataSubText}>
                    Tap the + button below to add your first expense
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

      <AlertDeleteModal
        visible={deleteModal}
        heading="Confirm Deletion"
        text={`Are you sure you want to delete ${selectedIds.size} selected line(s)?`}
        onPress={handleBulkDeleteConfirm}
        onCancel={() => setDeleteModal(false)}
        isProcessing={isProcessing}
      />

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

export default TravelRequisitionLinesListPage;
