/* eslint-disable no-shadow */
/* eslint-disable curly */
/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useCallback} from 'react';
import {
  Text,
  FlatList,
  BackHandler,
  RefreshControl,
  ScrollView,
  I18nManager,
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import {useSelector} from 'react-redux';

import AlertModal from '../../../../components/Alert/AlertModal';
import AlertDeleteModal from '../../../../components/Alert/AlertDeleteModal';
import CustomIndicator from '../../../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../../../components/ActionPaneContainer';
import DynamicRequestCard, {
  BUTTON_TYPES,
} from '../../../../components/DynamicRequestCard';
import styles from '../../../../styles/styles';

import {findEmployeeLeaveHistory} from '../../API/Leaves/findEmployeeLeaveHistory';
import {retrieveEmployeeAvailableLeaves} from '../../API/Leaves/retrieveEmployeeAvailableLeaves';
import DeleteDFEmployeeLeaveHistory from '../../API/Leaves/deleteDFEmploeeLeaveHistory';
import submitDFEmployeeLeaveRequest from '../../API/Leaves/submitDFEmployeeLeaveRequest';
import {findEmployeePenaltyLeaves} from '../../API/Leaves/findEmployeePenaltyLeaves';
import useNotify from '../../../../hooks/useNotify';
import useListFilters from '../../../../hooks/useListFilters';
import DynamicAttachmentModal from '../../../../shared/DynamicAttachmentModal';
import useAlertModal from '../../../../hooks/useAlertModal';
import useAppTokens from '../../../../components/AppComponentsDesign/useAppTokens';
import WorkflowCommentModal from '../../../../components/CommentModal/WorkflowCommentModal';

const createLocalStyles = T =>
  StyleSheet.create({
    summaryContainer: {
      marginHorizontal: 1,
      marginTop: 1,
      marginBottom: 6,
      backgroundColor: T.cardBg,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 8,
      shadowColor: T.shadowColor,
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.08,
      shadowRadius: 3,
      elevation: 2,
    },
    summaryTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: T.blue,
      marginBottom: 8,
      marginLeft: 4,
    },
    row: {
      flexDirection: 'row',
    },
    headerRow: {
      backgroundColor: T.blue,
      borderRadius: 6,
    },
    headerCell: {
      paddingVertical: 8,
      paddingHorizontal: 8,
      justifyContent: 'center',
    },
    headerCellText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 12,
      textAlign: 'center',
    },
    cell: {
      paddingVertical: 8,
      paddingHorizontal: 8,
      justifyContent: 'center',
      borderBottomWidth: 1,
      borderBottomColor: T.rowDivider,
    },
    cellText: {
      fontSize: 12,
      color: T.titleText,
      textAlign: 'center',
    },
    altRow: {
      backgroundColor: T.cardHeadingBg,
    },
    footer: {
      marginTop: 8,
      paddingHorizontal: 4,
    },
    footerText: {
      fontSize: 11,
      color: '#D9534F',
      marginTop: 2,
    },
    toggleContainer: {
      flexDirection: 'row',
      marginHorizontal: 1,
      marginTop: 8,
      marginBottom: 4,
      backgroundColor: T.blueBg,
      borderRadius: 10,
      padding: 4,
    },
    toggleButton: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    toggleButtonActive: {
      backgroundColor: T.blue,
    },
    toggleButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: T.blue,
    },
    toggleButtonTextActive: {
      color: '#fff',
    },
    emptyText: {
      fontSize: 13,
      color: T.emptyText,
      textAlign: 'center',
      paddingVertical: 12,
    },
    statusIcon: {
      fontSize: 14,
      fontWeight: '700',
    },
    statusIconTick: {
      color: '#2E7D32',
    },
    statusIconCross: {
      color: '#D9534F',
    },
  });

const DFEmployeeLeaveRequestListPage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const T = useAppTokens();
  const localStyles = createLocalStyles(T);

  const {
    employeeId,
    employeeName,
    WorkerRecId,
    cameFrom,
    userData: routeUserData,
  } = route.params || {};

  const {menuItems} = useSelector(state => state.menuItem);
  const reduxUserData = useSelector(state => state.user.userData);
  const effectiveUserData = routeUserData || reduxUserData;
  const isRTL = I18nManager.isRTL;

  const effectiveEmployeeId = employeeId || effectiveUserData?.employeeId;
  const effectiveEmployeeName = employeeName || effectiveUserData?.employeeName;
  const effectiveWorkerRecId = WorkerRecId || effectiveUserData?.WorkerRecId;

  const [isLoading, setIsLoading] = useState(false);
  const [assignedLeaves, setAssignedLeaves] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const {showSuccess, showError, showWarning, hide, alertModalProps} =
    useAlertModal();
  const [highlightedRecId, setHighlightedRecId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingButtons, setProcessingButtons] = useState({});
  const {selectedLegalEntity} = useSelector(state => state.company);
  const [attachmentModalVisible, setAttachmentModalVisible] = useState(false);
  const [selectedLeaveItem, setSelectedLeaveItem] = useState(null);
  const [penaltyLeaves, setPenaltyLeaves] = useState([]);
  const [summaryTab, setSummaryTab] = useState('summary'); // 'summary' | 'penalty'

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [submitTargetItem, setSubmitTargetItem] = useState(null);
  const {notifySuccess, notifyError, notifyDelete} = useNotify('Leave Request');

  // ---------------- Page label ----------------
  const getPageLabel = () => {
    const currentMenuItem = menuItems.find(
      item => item.MenuId === 'DFEmployeeLeaveRequestListPage',
    );
    return currentMenuItem?.Label || 'Leave Balance';
  };

  // ---------------- Status label mapping ----------------
  // Defined before fetch/hook usage since useListFilters' classifyPill needs it.
  const getStatusLabel = status => {
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
    return statusMap[status] || status || '—';
  };

  const handleViewHistory = item => {
    navigation.navigate('WorkflowHistoryScreen', {
      recId: item.LeaveRequestRecId,
      tableId: item.TableId,
      cameFrom: 'DFEmployeeLeaveRequestListPage',
    });
  };

  const f = useListFilters({
    data: historyData,
    dateField: 'CreatedDateTime',
    classifyPill: item => getStatusLabel(item.WfStatusHistory),
  });

  // ---------------- Fetch data ----------------
  const fetchAssignedLeaves = useCallback(async () => {
    if (!effectiveEmployeeId) return;
    try {
      const data = await retrieveEmployeeAvailableLeaves({
        employeeId: effectiveEmployeeId,
      });
      setAssignedLeaves(data || []);
    } catch (error) {
      showError('Failed to fetch leave balance');
    }
  }, [effectiveEmployeeId]);

  const fetchHistory = useCallback(async () => {
    if (!effectiveEmployeeId) return;
    try {
      const data = await findEmployeeLeaveHistory({
        employeeId: effectiveEmployeeId,
      });
      // console.log('Here is leave data', data);
      setHistoryData(data || []);
    } catch (error) {
      showError('Failed to fetch leave history');
    }
  }, [effectiveEmployeeId]);

  const fetchPenaltyLeaves = useCallback(async () => {
    if (!effectiveEmployeeId) return;
    try {
      const data = await findEmployeePenaltyLeaves({
        employeeId: effectiveEmployeeId,
      });
      console.log('Here is the penalty data', data);
      setPenaltyLeaves(data || []);
    } catch (error) {
      showError('Failed to fetch penalty leave data');
    }
  }, [effectiveEmployeeId]);

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchAssignedLeaves(),
        fetchHistory(),
        fetchPenaltyLeaves(),
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [fetchAssignedLeaves, fetchHistory, fetchPenaltyLeaves]);

  useFocusEffect(
    useCallback(() => {
      fetchAllData();
    }, [fetchAllData]),
  );

  // ---------------- Back navigation ----------------
  const handleGoBack = useCallback(() => {
    let targetRoute = 'MainDashboard';

    switch (cameFrom) {
      case 'MainDashboard':
        targetRoute = 'MainDashboard';
        break;
      case 'DisplayListPage':
        targetRoute = 'DisplayListPage';
        break;
      case 'DrawerNavigator':
        targetRoute = 'MainDashboard';
        break;
      case 'WorkerAssignedToMe':
        targetRoute = 'WorkerAssignedToMe';
        break;
      default:
        if (navigation.canGoBack()) {
          navigation.goBack();
          return;
        } else {
          targetRoute = 'MainDashboard';
        }
        return;
    }

    navigation.reset({
      index: 0,
      routes: [{name: targetRoute}],
    });
  }, [cameFrom, navigation]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleGoBack();
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [handleGoBack]),
  );

  // ---------------- Refresh ----------------
  const handleRefresh = () => {
    fetchAllData();
  };

  // ---------------- Card configuration for HISTORY ----------------
  const cardConfig = {
    headerConfig: {
      title: {key: 'LeaveNameHistory'},
      subtitle: {key: 'LeaveNatureHistory'},
    },
    fields: [
      {
        key: 'LeaveCalendarHistory',
        label: 'Leave calendar',
        type: 'text',
      },
      {
        key: 'FromDateHistory',
        label: 'Start date',
        type: 'date',
      },
      {
        key: 'ToDateHistory',
        label: 'End date',
        type: 'date',
      },
      {key: 'WfStatusHistory', label: '', type: 'status'},
    ],
    expandableFields: [
      {
        key: 'LeaveDaysHistory',
        label: 'Leave days',
        type: 'text',
      },
      {
        key: 'LeaveNatureHistory',
        label: 'Nature',
        type: 'text',
      },
      {
        key: 'Note',
        label: 'Notes',
        type: 'text',
      },
    ],
    isRTL: isRTL,
  };

  // ---------------- Format helper ----------------
  const formatDate = value => {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };

  const handleReceiptAttachmentPress = async itemData => {
    try {
      const formatDateOnly = date => {
        if (!date) return '';
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        const pad = n => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
          d.getDate(),
        )}`;
      };

      const cleanedItem = {
        ...itemData,
        FromDateHistory: formatDateOnly(itemData.FromDateHistory),
        ToDateHistory: formatDateOnly(itemData.ToDateHistory),
      };

      setSelectedLeaveItem(cleanedItem);
      setAttachmentModalVisible(true);

      console.log(
        'itemData.LeaveRequestTableName:',
        itemData.LeaveRequestTableName,
      );
      console.log(
        'cleanedItem.LeaveRequestTableName:',
        cleanedItem.LeaveRequestTableName,
      );
    } catch (error) {
      showError('Failed to open attachments');
    }
  };

  const formatNumber = value => {
    const num = Number(value);
    if (isNaN(num)) return value ?? '—';
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // ---------------- Assigned Leaves Summary Table ----------------
  const renderAssignedLeavesTable = () => {
    if (!assignedLeaves.length) return null;

    const columns = [
      {key: 'LeaveName', label: 'Leave Type', width: 130, align: 'left'},
      {key: 'TotalLeaves', label: 'Total', width: 70, align: 'right'},
      // {key: 'Assigned', label: 'Assigned', width: 75, align: 'right'},
      {key: 'Requested', label: 'Requested', width: 80, align: 'right'},
      {key: 'Approved', label: 'Approved', width: 80, align: 'right'},
      {key: 'Available', label: 'Available', width: 80, align: 'right'},
      {
        key: 'PenaltyLeaves',
        label: 'Penalty Leaves',
        width: 95,
        align: 'right',
      },
    ];

    return (
      <View style={localStyles.summaryContainer}>
        <Text style={localStyles.summaryTitle}>Leave Balance Summary</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* Header Row */}
            <View
              style={[
                localStyles.row,
                localStyles.headerRow,
                // eslint-disable-next-line react-native/no-inline-styles
                isRTL && {flexDirection: 'row-reverse'},
              ]}>
              {columns.map(col => (
                <View
                  key={col.key}
                  style={[
                    localStyles.headerCell,
                    {width: col.width, alignItems: 'center'},
                  ]}>
                  <Text
                    style={[
                      localStyles.headerCellText,
                      {width: col.width, textAlign: 'center'},
                    ]}
                    numberOfLines={1}>
                    {col.label}
                  </Text>
                </View>
              ))}
            </View>

            {/* Data Rows */}
            {assignedLeaves.map((item, index) => (
              <View
                key={
                  item.LeaveRequestRecId
                    ? `${item.LeaveRequestRecId}-${index}`
                    : index
                }
                style={[
                  localStyles.row,
                  // eslint-disable-next-line react-native/no-inline-styles
                  isRTL && {flexDirection: 'row-reverse'},
                  index % 2 === 1 && localStyles.altRow,
                ]}>
                {columns.map(col => (
                  <View
                    key={col.key}
                    style={[
                      localStyles.cell,
                      {width: col.width, alignItems: 'center'},
                    ]}>
                    <Text
                      style={[
                        localStyles.cellText,
                        {width: col.width, textAlign: 'center'},
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail">
                      {col.key === 'LeaveName'
                        ? item[col.key] ?? '—'
                        : formatNumber(item[col.key])}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Expiry info row, if applicable */}
        {assignedLeaves.some(
          item => String(item.IsExpired).toLowerCase() === 'true',
        ) && (
          <View style={localStyles.footer}>
            {assignedLeaves
              .filter(item => String(item.IsExpired).toLowerCase() === 'true')
              .map((item, idx) => (
                <Text key={idx} style={localStyles.footerText}>
                  {`${item.LeaveName}: Expires on ${formatDate(item.EndDate)}`}
                </Text>
              ))}
          </View>
        )}
      </View>
    );
  };

  const renderPenaltyLeavesTable = () => {
    const columns = [
      {key: 'PenaltyLeaveType', label: 'Leave Type', width: 110, align: 'left'},
      {key: 'PenaltyYear', label: 'Year', width: 60, align: 'left'},
      {key: 'PenaltyMonth', label: 'Month', width: 70, align: 'left'},
      {
        key: 'PenaltyLeaveDays',
        label: 'Penalty Days',
        width: 90,
        align: 'right',
      },
      {
        key: 'PenaltyCasualDays',
        label: 'Casual Days',
        width: 85,
        align: 'right',
      },
      {
        key: 'PenaltyAnnualDays',
        label: 'Annual Days',
        width: 85,
        align: 'right',
      },
      {
        key: 'PenaltyUnpaidDays',
        label: 'Unpaid Days',
        width: 85,
        align: 'right',
      },
      {key: 'PenaltyWorkflowStatus', label: 'Status', width: 90, align: 'left'},
      {
        key: 'IsPenaltyLeaveExpired',
        label: 'Expired',
        width: 70,
        align: 'center',
      },
    ];

    const textFields = [
      'PenaltyLeaveType',
      'PenaltyMonth',
      'PenaltyYear',
      'PenaltyWorkflowStatus',
    ];

    const alignItemsFor = align =>
      align === 'left'
        ? 'flex-start'
        : align === 'right'
        ? 'flex-end'
        : 'center';

    return (
      <View style={localStyles.summaryContainer}>
        <Text style={localStyles.summaryTitle}>Penalty Leaves</Text>

        {!penaltyLeaves.length ? (
          <Text style={localStyles.emptyText}>
            No penalty leave records found
          </Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              <View
                style={[
                  localStyles.row,
                  localStyles.headerRow,
                  // eslint-disable-next-line react-native/no-inline-styles
                  isRTL && {flexDirection: 'row-reverse'},
                ]}>
                {columns.map(col => (
                  <View
                    key={col.key}
                    style={[
                      localStyles.headerCell,
                      {width: col.width, alignItems: 'center'},
                    ]}>
                    <Text
                      style={[
                        localStyles.headerCellText,
                        {width: col.width, textAlign: 'center'},
                      ]}
                      numberOfLines={1}>
                      {col.label}
                    </Text>
                  </View>
                ))}
              </View>

              {penaltyLeaves.map((item, index) => (
                <View
                  key={
                    item.PenaltyLeaveWorker
                      ? `${item.PenaltyLeaveWorker}-${item.PenaltyMonth}-${item.PenaltyYear}-${index}`
                      : index
                  }
                  style={[
                    localStyles.row,
                    // eslint-disable-next-line react-native/no-inline-styles
                    isRTL && {flexDirection: 'row-reverse'},
                    index % 2 === 1 && localStyles.altRow,
                  ]}>
                  {columns.map(col => (
                    <View
                      key={col.key}
                      style={[
                        localStyles.cell,
                        {width: col.width, alignItems: 'center'},
                      ]}>
                      {col.key === 'IsPenaltyLeaveExpired' ? (
                        <Text
                          style={[
                            localStyles.statusIcon,
                            {width: col.width, textAlign: 'center'},
                            String(item.IsPenaltyLeaveExpired).toLowerCase() ===
                            'true'
                              ? localStyles.statusIconTick
                              : localStyles.statusIconCross,
                          ]}>
                          {String(item.IsPenaltyLeaveExpired).toLowerCase() ===
                          'true'
                            ? '✓'
                            : '✕'}
                        </Text>
                      ) : (
                        <Text
                          style={[
                            localStyles.cellText,
                            {width: col.width, textAlign: 'center'},
                          ]}
                          numberOfLines={1}
                          ellipsizeMode="tail">
                          {textFields.includes(col.key)
                            ? item[col.key] ?? '—'
                            : formatNumber(item[col.key])}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    );
  };

  const renderSummarySection = () => {
    return (
      <View>
        <View style={localStyles.toggleContainer}>
          <TouchableOpacity
            style={[
              localStyles.toggleButton,
              summaryTab === 'summary' && localStyles.toggleButtonActive,
            ]}
            onPress={() => setSummaryTab('summary')}>
            <Text
              style={[
                localStyles.toggleButtonText,
                summaryTab === 'summary' && localStyles.toggleButtonTextActive,
              ]}>
              Summary
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              localStyles.toggleButton,
              summaryTab === 'penalty' && localStyles.toggleButtonActive,
            ]}
            onPress={() => setSummaryTab('penalty')}>
            <Text
              style={[
                localStyles.toggleButtonText,
                summaryTab === 'penalty' && localStyles.toggleButtonTextActive,
              ]}>
              Penalty Leaves
            </Text>
          </TouchableOpacity>
        </View>

        {summaryTab === 'summary'
          ? renderAssignedLeavesTable()
          : renderPenaltyLeavesTable()}
      </View>
    );
  };

  // ---------------- Helper to set per-row button processing state ----------------
  const setButtonProcessing = (recId, buttonType, processing) => {
    setProcessingButtons(prev => ({
      ...prev,
      [recId]: processing
        ? [...(prev[recId] || []), buttonType]
        : (prev[recId] || []).filter(btn => btn !== buttonType),
    }));
  };

  // ---------------- Delete handlers ----------------
  const handleDeletePress = itemData => {
    setItemToDelete(itemData);
    setDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    const recId = itemToDelete.LeaveRequestRecId;

    // Close the confirmation modal first
    setDeleteModal(false);

    setTimeout(async () => {
      setIsProcessing(true);
      setButtonProcessing(recId, 'delete', true);

      try {
        const response = await DeleteDFEmployeeLeaveHistory({
          recordsRecId: [recId],
        });

        if (response?.[0]?.IsSuccess) {
          notifyDelete('Leave request deleted successfully');
          showSuccess('Leave request deleted successfully');
          setHistoryData(prev =>
            prev.filter(item => item.LeaveRequestRecId !== recId),
          );
        } else {
          showError(response?.[0]?.Message || 'Failed to delete leave request');
        }
      } catch (error) {
        showError('Failed to delete leave request');
        console.log('Delete DF Employee Leave Request error', error);
      } finally {
        setIsProcessing(false);
        setButtonProcessing(recId, 'delete', false);
        setItemToDelete(null);
        setTimeout(() => {
          fetchHistory();
        }, 1000);
      }
    }, 100);
  };

  const handleSubmitPress = async (itemData, comment = '') => {
    const recId = itemData.LeaveRequestRecId;

    setIsProcessing(true);
    setButtonProcessing(recId, 'submit', true);

    try {
      const response = await submitDFEmployeeLeaveRequest({
        recId: Number(recId),
        comment,
      });

      if (response && String(response.IsSuccess).toLowerCase() === 'true') {
        notifySuccess('Leave request submitted successfully');
        showSuccess('Leave request submitted successfully');

        setHighlightedRecId(recId);
        setTimeout(() => setHighlightedRecId(null), 3000);

        setTimeout(() => {
          fetchHistory();
        }, 1000);
      } else {
        showError(
          response?.InfologMessage ||
            response?.Message ||
            'Failed to submit leave request',
        );
      }
    } catch (error) {
      console.error('Submit error:', error);
      showError('Failed to submit leave request');
    } finally {
      setIsProcessing(false);
      setButtonProcessing(recId, 'submit', false);
    }
  };

  const openSubmitCommentModal = itemData => {
    setSubmitTargetItem(itemData);
    setCommentModalVisible(true);
  };

  const closeSubmitCommentModal = () => {
    if (isProcessing) return;
    setCommentModalVisible(false);
    setSubmitTargetItem(null);
  };

  const handleCommentModalCancel = () => {
    setCommentModalVisible(false);
    setSubmitTargetItem(null);
  };

  const handleCommentModalSubmit = comment => {
    const item = submitTargetItem;
    setCommentModalVisible(false);
    setSubmitTargetItem(null);
    if (item) handleSubmitPress(item, comment);
  };

  // ---------------- History Card render ----------------
  const handleButtonPress = (buttonType, itemData) => {
    switch (buttonType) {
      case BUTTON_TYPES.DELETE:
      case 'delete':
        handleDeletePress(itemData);
        break;
      case BUTTON_TYPES.SUBMIT:
      case 'submit':
        openSubmitCommentModal(itemData);
        break;
      case BUTTON_TYPES.ATTACHMENT:
      case 'attachment':
        handleReceiptAttachmentPress(itemData);
        break;
      case 'viewHistory':
        handleViewHistory(itemData);
        break;
      default:
        console.log('Unknown button pressed:', buttonType);
    }
  };

  const handleCreateLeave = () => {
    navigation.navigate('DFEmployeeLeaveRequestSaveRecord', {
      mode: 'create',
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
      WorkerRecId: effectiveWorkerRecId,
      userData: effectiveUserData,
      cameFrom: 'DFEmployeeLeaveRequestListPage',
      originalCameFrom: cameFrom,
    });
  };

  const getButtonConfig = item => {
    const statusLabel = getStatusLabel(item.WfStatusHistory);
    const isDraft = statusLabel === 'Draft';

    return {
      delete: {
        show: true,
        position: 'header',
        style: 'icon',
        icon: 'trash',
        iconSize: 20,
        iconColor: '#fff',
        backgroundColor: '#0A66C2',
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
        backgroundColor: '#0A66C2',
        disabled: false,
        customStyle: {},
      },
      approval: {
        show: true, // was: isDraft — always show now so non-draft rows get View History
        position: 'bottom',
        style: 'approval_dropdown',
        text: isDraft ? 'Approval' : 'Approval',
        icon: 'check-square',
        textColor: '#0A66C2',
        disabled: false,
        actions: [
          ...(isDraft
            ? [
                {
                  key: 'submit',
                  label: 'Submit',
                  icon: 'send',
                },
              ]
            : [
                {
                  key: 'viewHistory',
                  label: 'View History',
                  icon: 'clock',
                },
              ]),
        ],
      },
    };
  };
  const renderHistoryCard = ({item}) => {
    const recIdKey =
      item.LeaveRequestRecId ??
      `${item.LeaveNameHistory}-${item.FromDateHistory}-${item.ToDateHistory}`;

    const isHighlighted = highlightedRecId === recIdKey;
    const itemProcessingButtons = processingButtons[recIdKey] || [];

    const processedItem = {
      ...item,
      RecId: recIdKey,
      WfStatusHistory: getStatusLabel(item.WfStatusHistory),
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
        gradientColors={['#6ee0ff', '#bddeff', '#cce6ff']}
        highlightGradientColors={['#E8F5E8', '#F0FFF0']}
        processingButtons={itemProcessingButtons}
        isRTL={isRTL}
        searchQuery={f.searchQuery}
      />
    );
  };

  // ---------------- Main render ----------------
  return (
    <ActionPaneContainer
      pageTitle={getPageLabel()}
      isBackButton={false}
      showFooter={true}
      showFloatingButton={true}
      onFloatingButtonPress={handleCreateLeave}
      isHeaderActive={true}
      onBackPress={handleGoBack}
      onRefresh={handleRefresh}
      showPageTitleRow={true}
      showSearchBar={true}
      {...f.actionPaneProps}>
      {isProcessing && (
        <View style={styles.DLP_ProcessingOverlay}>
          <View style={styles.DLP_ProcessingContainer}>
            <ActivityIndicator size="large" color="#0A66C2" />
            <Text style={styles.DLP_ProcessingText}>Processing...</Text>
          </View>
        </View>
      )}

      {isLoading ? (
        <View style={styles.DLP_LoadingContainer}>
          <CustomIndicator />
        </View>
      ) : (
        <FlatList
          data={f.filteredData}
          renderItem={renderHistoryCard}
          keyExtractor={(item, index) =>
            item.LeaveRequestRecId
              ? item.LeaveRequestRecId.toString()
              : `${item.LeaveNameHistory}-${index}`
          }
          contentContainerStyle={styles.DLP_ListContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
          }
          ListHeaderComponent={renderSummarySection}
          ListEmptyComponent={
            <View style={styles.DLP_NoDataContainer}>
              {f.searchQuery.trim() ? (
                <Text style={styles.DLP_NoDataSubText}>
                  No records match "{f.searchQuery}"
                </Text>
              ) : historyData.length === 0 && f.activeFilter === 'All' ? (
                <Text style={styles.DLP_NoDataText}>
                  No leave history found
                </Text>
              ) : (
                <Text style={styles.DLP_NoDataText}>
                  {`${f.activeFilter} record not found.`}
                </Text>
              )}
            </View>
          }
        />
      )}

      {/* Attachment Modal */}
      <DynamicAttachmentModal
        visible={attachmentModalVisible}
        recordData={selectedLeaveItem}
        recordIdKey="LeaveRequestRecId"
        tableName={selectedLeaveItem?.LeaveRequestTableName}
        onClose={() => {
          setAttachmentModalVisible(false);
          setSelectedLeaveItem(null);
        }}
        onSave={() => {
          fetchHistory();
        }}
        legalEntity={selectedLegalEntity}
        employeeId={effectiveEmployeeId}
        employeeName={effectiveEmployeeName}
        modalTitle="Leave Request Attachments"
        showDetails={true}
        detailFields={[
          {key: 'LeaveNameHistory', label: 'Leave Type'},
          {key: 'FromDateHistory', label: 'Start Date'},
          {key: 'ToDateHistory', label: 'End Date'},
        ]}
        detailData={selectedLeaveItem || {}}
        showTakePhoto={selectedLeaveItem?.WfStatusHistory === 'Draft'}
        showChooseFile={selectedLeaveItem?.WfStatusHistory === 'Draft'}
        showDownload={true}
        showDelete={selectedLeaveItem?.WfStatusHistory === 'Draft'}
      />

      <AlertModal {...alertModalProps} />

      {/* Delete Confirmation Modal */}
      <AlertDeleteModal
        visible={deleteModal}
        heading="Confirm Delete"
        text="Are you sure you want to delete this leave request?"
        onPress={handleDeleteConfirm}
        onCancel={() => {
          setDeleteModal(false);
          setItemToDelete(null);
        }}
      />
      <WorkflowCommentModal
        visible={commentModalVisible}
        title="Submit Leave Request"
        message="Add a comment for the approver, or cancel to close the dialog."
        onCancel={handleCommentModalCancel}
        onSubmit={handleCommentModalSubmit}
        onRequestClose={closeSubmitCommentModal}
        isProcessing={isProcessing}
      />
    </ActionPaneContainer>
  );
};

export default DFEmployeeLeaveRequestListPage;
