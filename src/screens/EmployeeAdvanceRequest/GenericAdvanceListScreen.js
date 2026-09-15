/* eslint-disable curly */
/* eslint-disable no-shadow */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useCallback, useMemo, useRef} from 'react';
import {
  Text,
  FlatList,
  BackHandler,
  RefreshControl,
  ScrollView,
  I18nManager,
  View,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView as RNScrollView,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import {translate as t} from '../../store/utils/translate';
import {useSelector} from 'react-redux';

import {DeleteAdvanceRequest} from '../../API/EmployeeAdvanceRequest/DeleteAdvanceRequest';
import {SubmitAdvanceRequest} from '../../API/EmployeeAdvanceRequest/SubmitAdvanceRequest';
import {FindByEmployeeAdvanceRequest} from '../../API/EmployeeAdvanceRequest/FindByEmployeeAdvanceRequest';
import {UpdateAdvanceRequest} from '../../API/EmployeeAdvanceRequest/UpdateAdvanceRequest';

import AlertModal from '../../components/Alert/AlertModal';
import AlertDeleteModal from '../../components/Alert/AlertDeleteModal';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import DynamicRequestCard, {
  BUTTON_TYPES,
} from '../../components/DynamicRequestCard';
import DynamicAttachmentModal from '../../shared/DynamicAttachmentModal';
import useNotify from '../../hooks/useNotify';
import useListFilters from '../../hooks/useListFilters';

import styles from '../../styles/styles';
import usePalette from '../../hooks/usePalette';

// Speed dial menu item config — no icon field
const MENU_ITEMS = [
  {key: 'advance', label: 'Advance Salary'},
  {key: 'loan', label: 'Loan Request'},
];

const GenericAdvanceListScreen = () => {
  const P = usePalette();
  const [isLoading, setIsLoading] = useState(false);
  const [allAdvanceData, setAllAdvanceData] = useState([]);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [highlightedRecId, setHighlightedRecId] = useState(null);
  const [processingButtons, setProcessingButtons] = useState({});
  const [deleteModal, setDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  // ── Inline edit modal state ──────────────────────────────────────────────
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({
    AdvanceAmount: '',
    AdvanceDescription: '',
    RequestedPaymentDate: '',
    RecoveryStartDate: '',
    RequestedInstallmentAmount: '',
    RequestedInstallments: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const {notifySuccess, notifyError, notifyDelete} = useNotify('Loan Request');

  // Attachment modal state
  const [attachmentModalVisible, setAttachmentModalVisible] = useState(false);
  const [selectedAdvanceItem, setSelectedAdvanceItem] = useState(null);

  // Animations
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const fabRotation = useRef(new Animated.Value(0)).current;
  const itemAnims = useRef(MENU_ITEMS.map(() => new Animated.Value(0))).current;

  const navigation = useNavigation();
  const route = useRoute();
  const isRTL = I18nManager.isRTL;

  const {selectedLegalEntity} = useSelector(state => state.company);

  const {
    employeeId,
    employeeName,
    WorkerRecId,
    cameFrom = 'MainDashboard',
    highlightRecId = null,
    userData: routeUserData,
  } = route.params || {};

  const reduxUserData = useSelector(state => state.user.userData);
  const effectiveUserData = routeUserData || reduxUserData;

  const effectiveEmployeeId = employeeId || effectiveUserData?.employeeId;
  const effectiveEmployeeName = employeeName || effectiveUserData?.employeeName;
  const effectiveWorkerRecId = WorkerRecId || effectiveUserData?.WorkerRecId;

  // ─── Animation helpers ────────────────────────────────────────────────────

  const openMenu = () => {
    setShowCreateMenu(true);
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fabRotation, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      ...itemAnims.map((anim, i) =>
        Animated.spring(anim, {
          toValue: 1,
          delay: i * 60,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
      ),
    ]).start();
  };

  const closeMenu = callback => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(fabRotation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      ...itemAnims.map((anim, i) =>
        Animated.timing(anim, {
          toValue: 0,
          duration: 150,
          delay: i * 30,
          useNativeDriver: true,
        }),
      ),
    ]).start(() => {
      setShowCreateMenu(false);
      if (callback) callback();
    });
  };

  const fabRotateDeg = fabRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  // ─── Fetch ────────────────────────────────────────────────────────────────

  const fetchAllAdvanceData = useCallback(async () => {
    if (!effectiveEmployeeId) return;
    setIsLoading(true);
    try {
      const allResults = await FindByEmployeeAdvanceRequest({employeeId});
      const filteredResults = allResults.filter(item => {
        const type = item.AdvanceTypeCode?.toLowerCase() || '';
        return !type.includes('expense');
      });
      const sortedResults = filteredResults.sort((a, b) => {
        const aCreated = new Date(a.CreatedDateTime || a.RequestDate || 0);
        const bCreated = new Date(b.CreatedDateTime || b.RequestDate || 0);
        if (!isNaN(aCreated.getTime()) && !isNaN(bCreated.getTime())) {
          if (bCreated.getTime() !== aCreated.getTime())
            return bCreated - aCreated;
        }
        const aRecId = parseInt(a.RecId, 10);
        const bRecId = parseInt(b.RecId, 10);
        if (!isNaN(aRecId) && !isNaN(bRecId)) return bRecId - aRecId;
        return 0;
      });
      setAllAdvanceData(sortedResults);
    } catch (error) {
      console.error('Error fetching advance data:', error);
      setAlertMessage(
        'Unable to load data. Please check your connection and try again.',
      );
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveEmployeeId, employeeId]);

  useFocusEffect(
    useCallback(() => {
      fetchAllAdvanceData();
    }, [fetchAllAdvanceData]),
  );

  useFocusEffect(
    useCallback(() => {
      if (highlightRecId) {
        setHighlightedRecId(highlightRecId);
        fetchAllAdvanceData();
        const timer = setTimeout(() => setHighlightedRecId(null), 3000);
        return () => clearTimeout(timer);
      }
    }, [highlightRecId, fetchAllAdvanceData]),
  );

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (editModalVisible) {
          setEditModalVisible(false);
          return true;
        }
        if (showCreateMenu) {
          closeMenu();
          return true;
        }
        handleGoBack();
        return true;
      };
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [navigation, showCreateMenu, editModalVisible]),
  );

  // ─── Navigation ───────────────────────────────────────────────────────────

  const handleGoBack = () => {
    let targetRoute = 'MainDashboard';
    switch (cameFrom) {
      case 'MainDashboard':
        targetRoute = 'MainDashboard';
        break;
      case 'DisplayListPage':
        targetRoute = 'DisplayListPage';
        break;
      case 'DrawerNavigation':
      case 'DrawerNavigator':
        targetRoute = 'MainDashboard';
        break;
      case 'WorkerAssignedToMe':
        targetRoute = 'WorkerAssignedToMe';
        break;
      default:
        navigation.goBack();
        return;
    }
    navigation.reset({index: 0, routes: [{name: targetRoute}]});
  };

  const handleRefresh = () => fetchAllAdvanceData();

  // FAB toggle
  const handleCreateRequest = () => {
    if (showCreateMenu) closeMenu();
    else openMenu();
  };

  // Speed dial item press
  const handleSpeedDialPress = key => {
    if (key === 'advance') {
      closeMenu(() => {
        navigation.navigate('EmployeeAdvanceSalary_Create', {
          mode: 'create',
          employeeId: effectiveEmployeeId,
          employeeName: effectiveEmployeeName,
          WorkerRecId: effectiveWorkerRecId,
          userData: effectiveUserData,
          cameFrom: 'GenericAdvanceListScreen',
          requestType: 'Advance',
          advanceType: 1,
          screenName: 'Advance Salary',
          advanceData: {
            employeeId: effectiveEmployeeId,
            employeeName: effectiveEmployeeName,
            WorkerRecId: effectiveWorkerRecId,
            RecId: '',
            AdvanceTypeCode: '',
            AdvanceAmount: '0.00',
            RequestedPaymentDate: '',
            RecoveryStartDate: '',
            RequestedInstallmentAmount: '0.00',
            RequestedInstallments: '0',
            AdvanceDescription: '',
            Guarantor1: '',
            Guarantor2: '',
          },
        });
      });
    } else if (key === 'loan') {
      closeMenu(() => {
        navigation.navigate('GenericAdvanceSaveScreen', {
          mode: 'create',
          employeeId: effectiveEmployeeId,
          employeeName: effectiveEmployeeName,
          WorkerRecId: effectiveWorkerRecId,
          userData: effectiveUserData,
          cameFrom: 'GenericAdvanceListScreen',
          requestType: 'Loan',
          advanceType: 0,
          screenName: 'Loan Request',
          advanceData: {
            employeeId: effectiveEmployeeId,
            employeeName: effectiveEmployeeName,
            WorkerRecId: effectiveWorkerRecId,
            RecId: '',
            AdvanceTypeCode: '',
            AdvanceAmount: '0.00',
            RequestedPaymentDate: '',
            RecoveryStartDate: '',
            RequestedInstallmentAmount: '0.00',
            RequestedInstallments: '0',
            AdvanceDescription: '',
            Guarantor1: '',
            Guarantor2: '',
          },
        });
      });
    }
  };

  // ─── Inline Edit Modal helpers ────────────────────────────────────────────

  // Strip commas and return raw number string
  const stripFormatting = value =>
    String(value || '')
      .replace(/,/g, '')
      .trim();

  // Format ISO date string to MM/DD/YYYY for display inside input
  const isoToDisplay = iso => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  };

  // Convert MM/DD/YYYY (or any display format) back to ISO with time for API
  const displayToISO = display => {
    if (!display) return '';
    // Already full ISO with time
    if (display.includes('T')) return display;
    // MM/DD/YYYY
    const parts = display.split('/');
    if (parts.length === 3) {
      const [mm, dd, yyyy] = parts;
      return `${yyyy}-${mm}-${dd}T12:00:00`;
    }
    // YYYY-MM-DD date-only
    if (/^\d{4}-\d{2}-\d{2}$/.test(display)) {
      return `${display}T12:00:00`;
    }
    return display;
  };

  // ─── Open edit modal — sources raw ISO dates from allAdvanceData ─────────
  const openEditModal = itemData => {
    // Find the matching raw record so we preserve original ISO date strings
    const rawItem =
      allAdvanceData.find(r => r.RecId === itemData.RecId) || itemData;

    setEditingItem(rawItem);
    setEditForm({
      AdvanceAmount: stripFormatting(itemData.AdvanceAmount),
      AdvanceDescription: itemData.AdvanceDescription || '',
      RequestedPaymentDate: isoToDisplay(rawItem.RequestedPaymentDate),
      RecoveryStartDate: isoToDisplay(rawItem.RecoveryStartDate),
      RequestedInstallmentAmount: stripFormatting(
        itemData.RequestedInstallmentAmount,
      ),
      RequestedInstallments: String(itemData.RequestedInstallments || ''),
    });
    setEditModalVisible(true);
  };

  // ─── FIX: Spread the full rawItem first so every field is preserved ───────
  //          then override only the user-edited fields.
  //          This prevents xsi:nil="true" from blanking out untouched fields
  //          (Guarantor1, Guarantor2, AdvanceTypeCode, etc.) on the server.
  const handleSaveEdit = async () => {
    if (!editingItem) return;
    setIsSaving(true);
    try {
      const advanceData = {
        // ── 1. Start with the complete raw server record ──────────────────
        //       This ensures every field the server originally returned is
        //       included, so nothing gets silently nulled by xsi:nil="true".
        ...editingItem,

        // ── 2. Explicitly set identity / type fields ──────────────────────
        RecId: editingItem.RecId,
        EmployeeId:
          editingItem.EmployeeId ||
          editingItem.employeeId ||
          effectiveEmployeeId,
        AdvanceTypeCode: editingItem.AdvanceTypeCode || '',
        Guarantor1: editingItem.Guarantor1 || '',
        Guarantor2: editingItem.Guarantor2 || '',

        // ── 3. Override only the fields the user can edit in the form ─────
        AdvanceAmount: stripFormatting(editForm.AdvanceAmount),
        AdvanceDescription: editForm.AdvanceDescription,
        RequestedPaymentDate: displayToISO(editForm.RequestedPaymentDate),
        RecoveryStartDate: displayToISO(editForm.RecoveryStartDate),
        RequestedInstallmentAmount: stripFormatting(
          editForm.RequestedInstallmentAmount,
        ),
        RequestedInstallments: editForm.RequestedInstallments,

        // ── 4. Preserve original RequestDate (not editable in the form) ───
        //       editingItem holds the raw ISO value from the server so
        //       displayToISO handles it safely.
        RequestDate: displayToISO(editingItem.RequestDate || ''),
      };

      const result = await UpdateAdvanceRequest({advanceData});

      if (result) {
        // Optimistically update the card in local state
        const updatedItem = {
          ...editingItem,
          AdvanceAmount: stripFormatting(editForm.AdvanceAmount),
          AdvanceDescription: editForm.AdvanceDescription,
          RequestedPaymentDate: displayToISO(editForm.RequestedPaymentDate),
          RecoveryStartDate: displayToISO(editForm.RecoveryStartDate),
          RequestedInstallmentAmount: stripFormatting(
            editForm.RequestedInstallmentAmount,
          ),
          RequestedInstallments: editForm.RequestedInstallments,
        };

        setAllAdvanceData(prev =>
          prev.map(item =>
            item.RecId === editingItem.RecId ? updatedItem : item,
          ),
        );

        setEditModalVisible(false);
        setEditingItem(null);
        setAlertMessage('Record updated successfully');
        setAlertModal(true);

        // Refresh from server after a short delay
        setTimeout(() => fetchAllAdvanceData(), 800);
      } else {
        setAlertMessage('Update failed. Please try again.');
        setAlertModal(true);
      }
    } catch (error) {
      console.error('Update error:', error);
      setAlertMessage('Failed to update record. Please try again.');
      setAlertModal(true);
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const getRequestTypeFromData = itemData => {
    if (!itemData || !itemData.AdvanceTypeCode)
      return {type: 'Loan', advanceType: 0, screenName: 'Loan Request'};
    const advanceTypeCode = itemData.AdvanceTypeCode.toLowerCase();
    if (
      advanceTypeCode.includes('loan') ||
      advanceTypeCode.includes('company loan')
    )
      return {type: 'Loan', advanceType: 0, screenName: 'Loan Request'};
    if (
      advanceTypeCode.includes('advance') ||
      advanceTypeCode.includes('salary')
    )
      return {type: 'Advance', advanceType: 1, screenName: 'Advance Salary'};
    return {type: 'Loan', advanceType: 0, screenName: 'Loan Request'};
  };

  const getStatusLabel = status => {
    if (!status) return 'Draft';
    const statusMap = {
      NotSubmitted: 'Draft',
      Approved: 'Approved',
      Cancelled: 'Cancelled',
      Rejected: 'Rejected',
      Submitted: 'Submitted',
      ChangeRequest: 'Change Request',
      PendingCancellation: 'Pending Cancellation',
      Returned: 'Returned',
      PendingApproval: 'Pending Approval',
      PendingComplete: 'Pending Complete',
      WorkflowCompleted: 'Workflow Completed',
      Completed: 'Completed',
      Failed: 'Failed',
    };
    return statusMap[status] || 'Draft';
  };

  // Filter/sort/search now owned by useListFilters. Fed the expense-filtered
  // list (allAdvanceData) so the visible list and pill counts share one source.
  // Derived status pills off getStatusLabel(WFStatus); date filter + sort key off
  // CreatedDateTime, resolved case-insensitively. No documentType field → header
  // Date+Sort trigger only.
  const f = useListFilters({
    data: allAdvanceData,
    dateField: 'CreatedDateTime',
    classifyPill: item => getStatusLabel(item.WFStatus),
  });

  const handleReceiptAttachmentPress = async itemData => {
    try {
      const formatDateOnly = date => {
        if (!date) return '';
        const d = new Date(date);
        return d.toISOString().split('T')[0];
      };
      const cleanedItem = {
        ...itemData,
        RequestedPaymentDate: formatDateOnly(itemData.RequestedPaymentDate),
        RecoveryStartDate: formatDateOnly(itemData.RecoveryStartDate),
        RequestDate: formatDateOnly(itemData.RequestDate),
      };
      setSelectedAdvanceItem(cleanedItem);
      setAttachmentModalVisible(true);
    } catch (error) {
      setAlertMessage('Failed to open attachments');
      setAlertModal(true);
    }
  };

  const cardConfig = {
    headerConfig: {
      title: {key: 'AdvanceTypeCode'},
      subtitle: {key: 'employeeName'},
    },
    fields: [
      {
        key: 'AdvanceAmount',
        label: allAdvanceData[0]?.AdvanceAmountlbl || 'Amount',
        type: 'currency',
      },
      {
        key: 'RequestedPaymentDate',
        label: allAdvanceData[0]?.RequestedPaymentDatelbl || 'Payment Date',
        type: 'date',
      },
      {
        key: 'RecoveryStartDate',
        label: allAdvanceData[0]?.RecoveryStartDatelbl || 'Recovery Start Date',
        type: 'date',
      },
      {
        key: 'WFStatus',
        label: allAdvanceData[0]?.WFStatuslbl || 'Workflow status',
        type: 'status',
      },
    ],
    expandableFields: [
      {
        key: 'AdvanceRequestId',
        label: allAdvanceData[0]?.AdvanceRequestIdlbl || 'Request Id',
        type: 'text',
      },
      {
        key: 'RequestDate',
        label: allAdvanceData[0]?.RequestDatelbl || 'Request Date',
        type: 'date',
      },
      {
        key: 'RequestedInstallmentAmount',
        label:
          allAdvanceData[0]?.RequestedInstallmentAmountlbl || 'Recovery Amount',
        type: 'text',
      },
      {
        key: 'RequestedInstallments',
        label: allAdvanceData[0]?.recoverieslbl || 'Recoveries',
        type: 'text',
      },
    ],
    isRTL: isRTL,
  };

  const getButtonConfig = item => {
    const statusLabel = getStatusLabel(item.WFStatus);
    const isDraft = statusLabel === 'Draft';
    const isRejected = statusLabel === 'Rejected';
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
        disabled: false,
        customStyle: {},
      },
      approval: {
        show: true,
        position: 'bottom',
        style: 'approval_dropdown',
        text: isRejected ? 'Re-submit' : 'Approval',
        icon: 'check-square',
        textColor: P.primaryStrong,
        disabled: false,
        actions: [
          ...(isDraft || isRejected
            ? [
                {
                  key: 'submit',
                  label: isRejected ? 'Re-submit' : 'Submit',
                  icon: 'send',
                },
              ]
            : []),
          ...(!isDraft
            ? [{key: 'viewHistory', label: 'View History', icon: 'clock'}]
            : []),
        ],
      },
    };
  };

  const setButtonProcessing = (recId, buttonType, isProcessingVal) => {
    setProcessingButtons(prev => ({
      ...prev,
      [recId]: isProcessingVal
        ? [...(prev[recId] || []), buttonType]
        : (prev[recId] || []).filter(btn => btn !== buttonType),
    }));
  };

  const handleButtonPress = (buttonType, itemData) => {
    if (!itemData) {
      setAlertMessage('Invalid item data. Please refresh and try again.');
      setAlertModal(true);
      return;
    }
    switch (buttonType) {
      case BUTTON_TYPES.EDIT:
      case 'edit':
        handleEditPress(itemData);
        break;
      case BUTTON_TYPES.DELETE:
      case 'delete':
        handleDeletePress(itemData);
        break;
      case BUTTON_TYPES.SUBMIT:
      case 'submit':
        handleSubmitPress(itemData);
        break;
      case BUTTON_TYPES.ATTACHMENT:
      case 'attachment':
        handleReceiptAttachmentPress(itemData);
        break;
      case 'viewHistory':
        handleViewHistory(itemData);
        break;
      default:
    }
  };

  const handleViewHistory = itemData => {
    navigation.navigate('WorkflowHistoryScreen', {
      recId: itemData.RecId,
      tableId: itemData.TableId,
      cameFrom: 'GenericAdvanceListScreen',
    });
  };

  // Format date - parse parts directly to avoid timezone issues
  const formatDate = date => {
    if (!date) return '';
    try {
      // Extract date parts directly from string to avoid timezone conversion issues
      let datePart = date;
      if (typeof date === 'string' && date.includes('T')) {
        datePart = date.split('T')[0];
      }

      // Handle YYYY-MM-DD format
      if (
        typeof datePart === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(datePart)
      ) {
        const [year, month, day] = datePart.split('-');
        return `${month}/${day}/${year}`;
      }

      // Fallback: try parsing as Date but use UTC methods to avoid timezone shift
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      const monthStr = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dayStr = String(d.getUTCDate()).padStart(2, '0');
      const yearStr = d.getUTCFullYear();
      return `${monthStr}/${dayStr}/${yearStr}`;
    } catch (error) {
      console.error('Date formatting error:', error);
      return '';
    }
  };

  // Format date to ISO string with time - parse parts directly to avoid timezone issues
  const formatToISOWithTime = date => {
    if (!date) return '';
    try {
      // Extract date parts directly from string to avoid timezone conversion issues
      let datePart = date;
      if (typeof date === 'string' && date.includes('T')) {
        datePart = date.split('T')[0];
      }

      // Handle YYYY-MM-DD format
      if (
        typeof datePart === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(datePart)
      ) {
        return `${datePart}T12:00:00`;
      }

      // Fallback: try parsing as Date but use UTC methods to avoid timezone shift
      const baseDate = new Date(date);
      if (isNaN(baseDate.getTime())) return '';

      const year = baseDate.getUTCFullYear();
      const month = String(baseDate.getUTCMonth() + 1).padStart(2, '0');
      const day = String(baseDate.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}T12:00:00`;
    } catch (error) {
      console.error('Date ISO formatting error:', error);
      return '';
    }
  };

  const formatNumberForDisplay = value => {
    if (value === null || value === undefined) return '0';
    const num = Number(value.toString().replace(/,/g, ''));
    if (isNaN(num)) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Edit press opens inline modal
  const handleEditPress = itemData => {
    openEditModal(itemData);
  };

  const handleDeletePress = itemData => {
    setItemToDelete(itemData);
    setDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setDeleteModal(false);
    setTimeout(async () => {
      setIsProcessing(true);
      setButtonProcessing(itemToDelete.RecId, 'delete', true);
      try {
        const response = await DeleteAdvanceRequest({
          recordsRecId: [itemToDelete.RecId],
        });
        const recordResult = response.find(
          r => String(r.RecId) === String(itemToDelete.RecId),
        );
        if (recordResult && recordResult.IsSuccess === 'true') {
          notifyDelete('Record deleted successfully');
          setAlertMessage('Record deleted successfully');
          setAllAdvanceData(prev =>
            prev.filter(adv => adv.RecId !== itemToDelete.RecId),
          );
        } else {
          setAlertMessage('Unable to delete record. Please try again.');
        }
      } catch (error) {
        setAlertMessage('Failed to delete record');
      } finally {
        setIsProcessing(false);
        setButtonProcessing(itemToDelete.RecId, 'delete', false);
        setItemToDelete(null);
        setAlertModal(true);
        setTimeout(() => fetchAllAdvanceData(), 800);
      }
    }, 100);
  };

  const handleSubmitPress = async itemData => {
    setTimeout(async () => {
      setIsProcessing(true);
      setButtonProcessing(itemData.RecId, 'submit', true);
      try {
        const response = await SubmitAdvanceRequest({recId: itemData.RecId});
        const resObj = Array.isArray(response) ? response[0] : response;
        if (resObj && String(resObj.IsSuccess).toLowerCase() === 'true') {
          notifySuccess('Request submitted successfully');
          setAlertMessage('Request submitted successfully');
          setAlertModal(true);
          setHighlightedRecId(itemData.RecId);
          setTimeout(() => setHighlightedRecId(null), 3000);
          setTimeout(() => fetchAllAdvanceData(), 1000);
        } else {
          setAlertMessage(resObj?.Message || 'Failed to submit request');
          setAlertModal(true);
        }
      } catch (error) {
        console.error('Submit error:', error);
        setAlertMessage('Failed to submit request');
        setAlertModal(true);
      } finally {
        setIsProcessing(false);
        setButtonProcessing(itemData.RecId, 'submit', false);
      }
    }, 100);
  };

  // Search + sort now handled by useListFilters via f.actionPaneProps.

  const renderAdvanceCard = ({item}) => {
    if (!item) return null;
    const isHighlighted = highlightedRecId === item.RecId;
    const itemProcessingButtons = processingButtons[item.RecId] || [];
    const requestTypeInfo = getRequestTypeFromData(item);
    const processedItem = {
      ...item,
      WFStatus: getStatusLabel(item.WFStatus),
      AdvanceAmount: formatNumberForDisplay(item.AdvanceAmount || '0.00'),
      RequestedInstallmentAmount: formatNumberForDisplay(
        item.RequestedInstallmentAmount || '0.00',
      ),
      RequestedPaymentDate: formatDate(item.RequestedPaymentDate),
      RequestDate: formatDate(item.RequestDate),
      RecoveryStartDate: formatDate(item.RecoveryStartDate),
      employeeId: item.employeeId || employeeId,
      employeeName: item.employeeName || employeeName,
      WorkerRecId: item.WorkerRecId || WorkerRecId,
      AdvanceRequestId:
        item.AdvanceRequestId ||
        `${requestTypeInfo.type.toUpperCase()}-${item.RecId}`,
      RequestType: requestTypeInfo.type,
    };
    return (
      <DynamicRequestCard
        data={processedItem}
        headerConfig={cardConfig.headerConfig}
        fields={cardConfig.fields}
        expandableFields={cardConfig.expandableFields}
        buttons={getButtonConfig(item)}
        isHighlighted={isHighlighted}
        onButtonPress={handleButtonPress}
        isExpandable={true}
        highlightGradientColors={['#E8F5E8', '#F0FFF0']}
        processingButtons={itemProcessingButtons}
        isRTL={isRTL}
        searchQuery={f.searchQuery}
      />
    );
  };

  // ─── Inline Edit Modal ────────────────────────────────────────────────────

  const renderEditModal = () => {
    const inputStyle = {
      borderWidth: 1,
      borderColor: '#D0D7E2',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: '#1A1A1A',
      backgroundColor: '#F8FAFC',
      marginBottom: 14,
      textAlign: isRTL ? 'right' : 'left',
    };

    const labelStyle = {
      fontSize: 12,
      fontWeight: '600',
      color: '#5A6A85',
      marginBottom: 4,
      textAlign: isRTL ? 'right' : 'left',
    };

    return (
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{flex: 1}}>
          {/* Backdrop */}
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.45)',
            }}
            activeOpacity={1}
            onPress={() => setEditModalVisible(false)}
          />

          {/* Bottom sheet panel */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: Platform.OS === 'ios' ? 36 : 20,
              maxHeight: '80%',
              elevation: 20,
              shadowColor: '#000',
              shadowOffset: {width: 0, height: -4},
              shadowOpacity: 0.15,
              shadowRadius: 10,
            }}>
            {/* Drag handle */}
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: '#D0D7E2',
                borderRadius: 2,
                alignSelf: 'center',
                marginBottom: 16,
              }}
            />

            {/* Header row */}
            <View
              style={{
                flexDirection: isRTL ? 'row-reverse' : 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 20,
              }}>
              <Text style={{fontSize: 17, fontWeight: '700', color: '#1A1A1A'}}>
                Edit Record
              </Text>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: '#F0F2F5',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text style={{fontSize: 16, color: '#5A6A85', lineHeight: 20}}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            {/* Scrollable form fields */}
            <RNScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              {/* Advance Amount */}
              <Text style={labelStyle}>
                {allAdvanceData[0]?.AdvanceAmountlbl || 'Advance Amount'}
              </Text>
              <TextInput
                style={inputStyle}
                value={editForm.AdvanceAmount}
                onChangeText={v =>
                  setEditForm(prev => ({...prev, AdvanceAmount: v}))
                }
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#AABBCC"
              />

              {/* Description */}
              <Text style={labelStyle}>Description</Text>
              <TextInput
                style={[inputStyle, {minHeight: 70, textAlignVertical: 'top'}]}
                value={editForm.AdvanceDescription}
                onChangeText={v =>
                  setEditForm(prev => ({...prev, AdvanceDescription: v}))
                }
                multiline
                placeholder="Enter description"
                placeholderTextColor="#AABBCC"
              />

              {/* Payment Date */}
              <Text style={labelStyle}>
                {allAdvanceData[0]?.RequestedPaymentDatelbl || 'Payment Date'}{' '}
                (MM/DD/YYYY)
              </Text>
              <TextInput
                style={inputStyle}
                value={editForm.RequestedPaymentDate}
                onChangeText={v =>
                  setEditForm(prev => ({...prev, RequestedPaymentDate: v}))
                }
                placeholder="MM/DD/YYYY"
                placeholderTextColor="#AABBCC"
                keyboardType="numbers-and-punctuation"
              />

              {/* Recovery Start Date */}
              <Text style={labelStyle}>
                {allAdvanceData[0]?.RecoveryStartDatelbl ||
                  'Recovery Start Date'}{' '}
                (MM/DD/YYYY)
              </Text>
              <TextInput
                style={inputStyle}
                value={editForm.RecoveryStartDate}
                onChangeText={v =>
                  setEditForm(prev => ({...prev, RecoveryStartDate: v}))
                }
                placeholder="MM/DD/YYYY"
                placeholderTextColor="#AABBCC"
                keyboardType="numbers-and-punctuation"
              />

              {/* Recovery Amount */}
              <Text style={labelStyle}>
                {allAdvanceData[0]?.RequestedInstallmentAmountlbl ||
                  'Recovery Amount'}
              </Text>
              <TextInput
                style={inputStyle}
                value={editForm.RequestedInstallmentAmount}
                onChangeText={v =>
                  setEditForm(prev => ({
                    ...prev,
                    RequestedInstallmentAmount: v,
                  }))
                }
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#AABBCC"
              />

              {/* Recoveries (installments count) */}
              <Text style={labelStyle}>
                {allAdvanceData[0]?.recoverieslbl || 'Recoveries'}
              </Text>
              <TextInput
                style={inputStyle}
                value={editForm.RequestedInstallments}
                onChangeText={v =>
                  setEditForm(prev => ({...prev, RequestedInstallments: v}))
                }
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="#AABBCC"
              />

              {/* Action buttons */}
              <View
                style={{
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  gap: 12,
                  marginTop: 8,
                  marginBottom: 4,
                }}>
                {/* Cancel */}
                <TouchableOpacity
                  onPress={() => setEditModalVisible(false)}
                  style={{
                    flex: 1,
                    paddingVertical: 13,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: '#D0D7E2',
                    alignItems: 'center',
                    backgroundColor: '#F8FAFC',
                  }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: '600',
                      color: '#5A6A85',
                    }}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                {/* Save */}
                <TouchableOpacity
                  onPress={handleSaveEdit}
                  disabled={isSaving}
                  style={{
                    flex: 1,
                    paddingVertical: 13,
                    borderRadius: 10,
                    backgroundColor: isSaving ? '#A0B4CC' : P.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  {isSaving ? (
                    <ActivityIndicator size="small" color={P.onPrimary} />
                  ) : (
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: '600',
                        color: P.onPrimary,
                      }}>
                      Save
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </RNScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  // ─── Speed Dial overlay ───────────────────────────────────────────────────

  const renderSpeedDial = () => (
    <Modal
      visible={showCreateMenu}
      transparent
      animationType="none"
      onRequestClose={() => closeMenu()}>
      {/* Dimmed backdrop */}
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.45)',
          opacity: backdropOpacity,
        }}>
        <TouchableOpacity
          style={{flex: 1}}
          activeOpacity={1}
          onPress={() => closeMenu()}
        />
      </Animated.View>

      {/* Speed dial items + FAB */}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          bottom: 24,
          right: isRTL ? undefined : 20,
          left: isRTL ? 20 : undefined,
          alignItems: isRTL ? 'flex-start' : 'flex-end',
        }}>
        {[...MENU_ITEMS].reverse().map((menuItem, reversedIndex) => {
          const originalIndex = MENU_ITEMS.length - 1 - reversedIndex;
          const anim = itemAnims[originalIndex];
          const translateY = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0],
          });
          return (
            <Animated.View
              key={menuItem.key}
              style={{
                opacity: anim,
                transform: [{translateY}],
                marginBottom: 14,
                alignItems: isRTL ? 'flex-start' : 'flex-end',
              }}>
              <TouchableOpacity
                onPress={() => handleSpeedDialPress(menuItem.key)}
                activeOpacity={0.8}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 8,
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  elevation: 5,
                  shadowColor: '#000',
                  shadowOffset: {width: 0, height: 2},
                  shadowOpacity: 0.15,
                  shadowRadius: 4,
                }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: '#1A1A1A',
                    textAlign: isRTL ? 'right' : 'left',
                  }}>
                  {menuItem.label}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        {/* Main FAB (X to close) */}
        <TouchableOpacity
          onPress={() => closeMenu()}
          activeOpacity={0.85}
          style={{
            width: 58,
            height: 58,
            borderRadius: 29,
            backgroundColor: '#E53935',
            alignItems: 'center',
            justifyContent: 'center',
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 4},
            shadowOpacity: 0.25,
            shadowRadius: 6,
          }}>
          <Animated.Text
            style={{
              fontSize: 26,
              color: '#FFFFFF',
              fontWeight: '300',
              transform: [{rotate: fabRotateDeg}],
              lineHeight: 30,
            }}>
            ✕
          </Animated.Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <ActionPaneContainer
      pageTitle="Loan Requests"
      showFooter
      showFloatingButton
      isHeaderActive
      onBackPress={handleGoBack}
      onRefresh={handleRefresh}
      onFloatingButtonPress={handleCreateRequest}
      showPageTitleRow={true}
      showSearchBar={true}
      {...f.actionPaneProps}>
      {/* Processing overlay */}
      {isProcessing && (
        <View style={styles.DLP_ProcessingOverlay}>
          <View style={styles.DLP_ProcessingContainer}>
            <ActivityIndicator size="large" color={P.primaryStrong} />
            <Text style={styles.DLP_ProcessingText}>
              {t('common.processing')}
            </Text>
          </View>
        </View>
      )}

      {/* Main list / empty state */}
      {isLoading ? (
        <View style={styles.DLP_LoadingContainer}>
          <CustomIndicator />
        </View>
      ) : f.filteredData.length > 0 ? (
        <FlatList
          data={f.filteredData}
          renderItem={renderAdvanceCard}
          keyExtractor={(item, index) =>
            item.RecId?.toString() || index.toString()
          }
          contentContainerStyle={styles.DLP_ListContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
          }
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.DLP_NoDataContainer}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
          }>
          {f.searchQuery.trim() ? (
            <Text style={styles.DLP_NoDataSubText}>
              No records match "{f.searchQuery}"
            </Text>
          ) : allAdvanceData.length === 0 && f.activeFilter === 'All' ? (
            <>
              <Text style={styles.DLP_NoDataText}>Get started</Text>
              <Text style={styles.DLP_NoDataSubText}>
                Tap + to add a new record
              </Text>
            </>
          ) : (
            <Text style={styles.DLP_NoDataText}>
              {`${f.activeFilter} record not found.`}
            </Text>
          )}
        </ScrollView>
      )}

      {/* Inline Edit Modal */}
      {renderEditModal()}

      {/* Speed Dial Modal */}
      {renderSpeedDial()}

      {/* Attachment Modal */}
      <DynamicAttachmentModal
        visible={attachmentModalVisible}
        recordData={selectedAdvanceItem}
        recordIdKey="RecId"
        tableName="PREmployeeAdvanceRequests"
        onClose={() => {
          setAttachmentModalVisible(false);
          setSelectedAdvanceItem(null);
        }}
        onSave={() => fetchAllAdvanceData()}
        legalEntity={selectedLegalEntity}
        employeeId={effectiveEmployeeId}
        employeeName={effectiveEmployeeName}
        modalTitle="Loan Request Attachments"
        showDetails={true}
        detailFields={[
          {
            key: 'AdvanceRequestId',
            label: allAdvanceData[0]?.AdvanceRequestIdlbl || 'Request Id',
          },
        ]}
        detailData={selectedAdvanceItem || {}}
        showTakePhoto={selectedAdvanceItem?.WFStatus === 'Draft'}
        showChooseFile={selectedAdvanceItem?.WFStatus === 'Draft'}
        showDownload={true}
        showDelete={selectedAdvanceItem?.WFStatus === 'Draft'}
      />

      {/* Alert Modal */}
      <AlertModal
        visible={alertModal}
        heading="Alert"
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />

      {/* Delete Confirmation Modal */}
      <AlertDeleteModal
        visible={deleteModal}
        heading="Confirm Deletion"
        text={'Are you sure you want to delete this record?'}
        onPress={handleDeleteConfirm}
        onCancel={() => {
          setDeleteModal(false);
          setItemToDelete(null);
        }}
      />
    </ActionPaneContainer>
  );
};

export default GenericAdvanceListScreen;
