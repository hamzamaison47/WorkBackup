/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable curly */
import React, {useState, useCallback, useMemo} from 'react';
import {
  Text,
  FlatList,
  BackHandler,
  RefreshControl,
  ScrollView,
  I18nManager,
  View,
  ActivityIndicator,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import {useSelector} from 'react-redux';

import AlertModal from '../../../../components/Alert/AlertModal';
import useAlertModal from '../../../../hooks/useAlertModal';
import AlertDeleteModal from '../../../../components/Alert/AlertDeleteModal';
import CustomIndicator from '../../../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../../../components/ActionPaneContainer';
import DynamicRequestCard from '../../../../components/DynamicRequestCard';
import DynamicAttachmentModal from '../../../../shared/DynamicAttachmentModal';
import styles from '../../../../styles/styles';
import {translate as t} from '../../../../store/utils/translate';

import {retrieveAllBankAccounts} from '../../../../API/PersonalInformation/BankAccounts/BankAccountfindbyEmployee';
import {DeletBankAccount} from '../../../../API/PersonalInformation/BankAccounts/BankAccountDelete';
import SubmitBankAccountRecord from '../../../../API/PersonalInformation/BankAccounts/BankAccountSubmit';
import useNotify from '../../../../hooks/useNotify';
import useListFilters from '../../../../hooks/useListFilters';
import usePalette from '../../../../hooks/usePalette';

const BankAccountListPage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const isRTL = I18nManager.isRTL;
  const P = usePalette();

  const {
    employeeId,
    employeeName,
    WorkerRecId,
    cameFrom,
    highlightRecId,
    userData: routeUserData,
  } = route.params || {};

  const reduxUserData = useSelector(state => state.user.userData);
  const {selectedLegalEntity} = useSelector(state => state.company);
  const effectiveUserData = routeUserData || reduxUserData;

  const effectiveEmployeeId = employeeId || effectiveUserData?.employeeId;
  const effectiveEmployeeName = employeeName || effectiveUserData?.employeeName;
  const effectiveWorkerRecId = WorkerRecId || effectiveUserData?.WorkerRecId;

  const [isLoading, setIsLoading] = useState(false);
  const [banksaccountdata, setbankaccountdata] = useState([]);
  const {showSuccess, showError, showWarning, hide, alertModalProps} =
    useAlertModal();
  const [highlightedRecId, setHighlightedRecId] = useState(null);
  const [processingButtons, setProcessingButtons] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const {notifySuccess, notifyError, notifyDelete} = useNotify('Bank Account');

  // Attachment modal state
  const [attachmentModalVisible, setAttachmentModalVisible] = useState(false);
  const [selectedBankItem, setSelectedBankItem] = useState(null);

  // Fetch Bank Account data
  const fetchBankAccountData = useCallback(async () => {
    if (!effectiveEmployeeId) return;

    setIsLoading(true);
    try {
      const BankAccountData = await retrieveAllBankAccounts({
        employeeId: effectiveEmployeeId,
      });

      console.log('HEUEHIUEFHUIEFHUIFH', BankAccountData);
      // Fix: sort using RecId (uppercase) — recId (lowercase) may be undefined
      BankAccountData.sort((a, b) => (b.RecId || 0) - (a.RecId || 0));

      setbankaccountdata(BankAccountData);
    } catch (error) {
      showError('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, [effectiveEmployeeId]);

  useFocusEffect(
    useCallback(() => {
      fetchBankAccountData();
    }, [fetchBankAccountData]),
  );

  useFocusEffect(
    useCallback(() => {
      if (highlightRecId) {
        setHighlightedRecId(highlightRecId);
        fetchBankAccountData();

        const timer = setTimeout(() => {
          setHighlightedRecId(null);
        }, 3000);

        return () => clearTimeout(timer);
      }
    }, [highlightRecId, fetchBankAccountData]),
  );

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleGoBack();
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [navigation]),
  );

  const handleGoBack = () => {
    navigation.navigate('DisplayPersonalInfo');
  };

  const handleRefresh = () => {
    fetchBankAccountData();
  };

  const handleBankAccountRecordCreation = () => {
    navigation.navigate('BankAccountSaveRecord', {
      mode: 'create',
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
      WorkerRecId: effectiveWorkerRecId,
      userData: effectiveUserData,
      cameFrom: 'BankAccountListPage',
      originalCameFrom: cameFrom,
      bankaccountdata: {
        employeeId: effectiveEmployeeId,
        employeeName: effectiveEmployeeName,
        WorkerRecId: effectiveWorkerRecId,
        RecId: '',
        AccountId: '',
        AccountNum: '',
        BankIBAN: '',
        Name: '',
        BranchNumber: '',
        BranchName: '',
        AccountHolder: '',
      },
    });
  };

  const getStatusLabel = status => {
    if (!status || status.trim() === '') return 'HR'; // ← add this line first
    const statusMap = {
      NotSubmitted: 'Draft',
      Submitted: 'Submitted',
      Approved: 'Approved',
      Rejected: 'Rejected',
      Cancelled: 'Cancelled',
      ChangeRequest: 'Change Request',
      PendingCancellation: 'Pending Cancellation',
      Returned: 'Returned',
      PendingApproval: 'Pending Approval',
      PendingComplete: 'Pending Complete',
      WorkflowCompleted: 'Workflow Completed',
      Completed: 'Completed',
    };
    return statusMap[status] || status; // ← return raw status if unknown, not 'Draft'
  };

  // Filter/sort/search now owned by useListFilters. Derived status pills off
  // getStatusLabel(WFStatus) (empty status maps to 'HR', unknown kept raw). Date
  // filter + sort key off CreatedDateTime, resolved case-insensitively. No
  // documentType field → header Date+Sort trigger only.
  const f = useListFilters({
    data: banksaccountdata,
    dateField: 'CreatedDateTime',
    classifyPill: item => getStatusLabel(item.WFStatus),
  });
  // Card Configuration
  const cardConfig = {
    headerConfig: {
      title: {key: 'AccountId'},
    },
    fields: [
      {
        key: 'Name',
        label: banksaccountdata[0]?.Namelbl || 'Account Name',
        type: 'text',
      },
      {
        key: 'AccountNum',
        label: banksaccountdata[0]?.AccountNumlbl || 'Account Number',
        type: 'text',
      },
      {
        key: 'AccountHolder',
        label: banksaccountdata[0]?.AccountHolderlbl || 'Account Holder',
        type: 'text',
      },
      {key: 'WFStatus', label: '', type: 'status'},
    ],
    expandableFields: [
      {
        key: 'AccountId',
        label: banksaccountdata[0]?.AccountIdlbl || 'Account Id',
        type: 'text',
      },
      {
        key: 'BankIBAN',
        label: banksaccountdata[0]?.BankIBANlbl || 'IBAN',
        type: 'text',
      },
      {
        key: 'BranchNumber',
        label: banksaccountdata[0]?.BranchNumberlbl || 'Branch Number',
        type: 'text',
      },
      {
        key: 'BranchName',
        label: banksaccountdata[0]?.BranchNamelbl || 'Branch Name',
        type: 'text',
      },
    ],
    isRTL: isRTL,
  };

  const getButtonConfig = item => {
    const statusLabel = getStatusLabel(item.WFStatus);
    const isEditable = statusLabel === 'Draft';
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
        disabled: !isEditable,
        customStyle: !isEditable ? {backgroundColor: '#BDBDBD'} : {},
      },
      delete: {
        show: true,
        position: 'header',
        style: 'icon',
        icon: 'trash',
        iconSize: 20,
        iconColor: P.onPrimary,
        backgroundColor: P.primary,
        disabled: !isEditable,
        customStyle: !isEditable ? {backgroundColor: '#BDBDBD'} : {},
      },
      approval: {
        show: false,
        actions: [
          {
            key: 'submit',
            label: isRejected ? 'Re-submit' : 'Submit',
            icon: 'send',
          },
        ],
      },
    };
  };

  // Fix: rename param to avoid shadowing isProcessing state
  const setButtonProcessing = (recId, buttonType, isProcessingState) => {
    setProcessingButtons(prev => ({
      ...prev,
      [recId]: isProcessingState
        ? [...(prev[recId] || []), buttonType]
        : (prev[recId] || []).filter(btn => btn !== buttonType),
    }));
  };

  const handleButtonPress = (buttonType, itemData) => {
    switch (buttonType) {
      case 'edit':
        handleEditPress(itemData);
        break;
      case 'delete':
        handleDeletePress(itemData);
        break;
      case 'submit':
        handleSubmitPress(itemData);
        break;
      case 'attachment':
        handleReceiptAttachmentPress(itemData);
        break;
      default:
        console.log('Unknown button pressed:', buttonType);
    }
  };

  const handleEditPress = itemData => {
    navigation.navigate('BankAccountSaveRecord', {
      mode: 'edit',
      employeeId: itemData.employeeId || employeeId,
      employeeName: itemData.employeeName || employeeName,
      WorkerRecId: itemData.WorkerRecId || WorkerRecId,
      userData: route.params?.userData || {
        employeeId,
        employeeName,
        WorkerRecId,
      },
      cameFrom: 'BankAccountListPage',
      originalCameFrom: cameFrom,
      bankaccountdata: {
        // Fix: use RecId (uppercase) consistently
        RecId: itemData.recId || itemData.RecId || '', // ← lowercase recId from API
        employeeId: itemData.employeeId || employeeId,
        employeeName: itemData.employeeName || employeeName,
        WorkerRecId: itemData.WorkerRecId || WorkerRecId,
        AccountHolder: itemData.AccountHolder,
        AccountId: itemData.AccountId,
        AccountNum: itemData.AccountNum,
        BankIBAN: itemData.BankIBAN,
        BranchNumber: itemData.BranchNumber,
        BranchName: itemData.BranchName,
        Name: itemData.Name,
      },
    });
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
        const response = await DeletBankAccount({
          recordsRecId: [itemToDelete.recId], // lowercase — this is the one that's always populated
        });

        if (response[0].IsSuccess) {
          notifyDelete('Bank account record deleted successfully');
          showSuccess('Bank account record deleted successfully');
          setbankaccountdata(prev =>
            prev.filter(bank => bank.RecId !== itemToDelete.RecId),
          );
        } else {
          showError('Unable to delete record. Please try again.');
        }
      } catch (error) {
        showError('Failed to delete record');
        console.log('Delete Bank Account response', error);
      } finally {
        setIsProcessing(false);
        setButtonProcessing(itemToDelete.RecId, 'delete', false);
        setItemToDelete(null);
        setTimeout(() => {
          fetchBankAccountData();
        }, 800);
      }
    }, 100);
  };

  const handleSubmitPress = async itemData => {
    setTimeout(async () => {
      setIsProcessing(true);
      setButtonProcessing(itemData.RecId, 'submit', true);

      try {
        const response = await SubmitBankAccountRecord({
          recId: itemData.__k_parmRecId,
        });

        const resObj = Array.isArray(response) ? response[0] : response;

        if (resObj && String(resObj.IsSuccess).toLowerCase() === 'true') {
          notifySuccess('Bank account record submitted successfully');
          showSuccess('Bank account record submitted successfully');
          setHighlightedRecId(itemData.RecId);

          setTimeout(() => {
            setHighlightedRecId(null);
          }, 3000);

          setTimeout(() => {
            fetchBankAccountData();
          }, 1000);
        } else {
          const errorMessage =
            resObj && resObj.Message
              ? resObj.Message
              : 'Failed to submit request';
          showError(errorMessage);
        }
      } catch (error) {
        console.error('Submit error:', error);
        showError('Failed to submit request');
      } finally {
        setIsProcessing(false);
        setButtonProcessing(itemData.RecId, 'submit', false);
      }
    }, 100);
  };

  const handleReceiptAttachmentPress = async itemData => {
    try {
      setSelectedBankItem(itemData);
      setAttachmentModalVisible(true);
    } catch (error) {
      showError('Failed to open attachments');
    }
  };

  // Search + sort now handled by useListFilters via f.actionPaneProps.

  const renderBankAccountCard = ({item}) => {
    // Fix: use RecId (uppercase) consistently
    const isHighlighted = highlightedRecId === item.RecId;
    const itemProcessingButtons = processingButtons[item.RecId] || [];

    const processedItem = {
      ...item,
      employeeId: item.employeeId || employeeId,
      employeeName: item.employeeName || employeeName,
      WFStatus: getStatusLabel(item.WFStatus),
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

  return (
    <ActionPaneContainer
      pageTitle="Bank Accounts"
      isBackButton={false}
      showFooter={true}
      showFloatingButton={true}
      isHeaderActive={true}
      onBackPress={handleGoBack}
      onRefresh={handleRefresh}
      onFloatingButtonPress={handleBankAccountRecordCreation}
      showPageTitleRow={true}
      showSearchBar={true}
      {...f.actionPaneProps}>
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
      {isLoading ? (
        <View style={styles.DLP_LoadingContainer}>
          <CustomIndicator />
        </View>
      ) : f.filteredData.length > 0 ? (
        <FlatList
          data={f.filteredData}
          renderItem={renderBankAccountCard}
          // Fix: use RecId (uppercase) consistently
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
            <>
              {/* <Text style={styles.DLP_NoDataText}>No results found</Text> */}
              <Text style={styles.DLP_NoDataSubText}>
                No records match "{f.searchQuery}"
              </Text>
            </>
          ) : banksaccountdata.length === 0 && f.activeFilter === 'All' ? (
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

      {/* Attachment Modal */}
      <DynamicAttachmentModal
        visible={attachmentModalVisible}
        recordData={selectedBankItem}
        recordIdKey="recId"
        tableName="ESSWorkerBankAccount"
        onClose={() => {
          setAttachmentModalVisible(false);
          setSelectedBankItem(null);
        }}
        onSave={() => {
          fetchBankAccountData();
        }}
        legalEntity={selectedLegalEntity}
        employeeId={effectiveEmployeeId}
        employeeName={effectiveEmployeeName}
        modalTitle="Bank Account Attachments"
        showDetails={true}
        detailFields={[
          {key: 'AccountId', label: 'Account ID'},
          {key: 'Name', label: 'Account Name'},
          {key: 'AccountNum', label: 'Account Number'},
        ]}
        detailData={selectedBankItem || {}}
        showTakePhoto={getStatusLabel(selectedBankItem?.WFStatus) === 'Draft'}
        showChooseFile={getStatusLabel(selectedBankItem?.WFStatus) === 'Draft'}
        showDownload={true}
        showDelete={getStatusLabel(selectedBankItem?.WFStatus) === 'Draft'}
      />

      <AlertModal {...alertModalProps} />
      <AlertDeleteModal
        visible={deleteModal}
        heading="Confirm Deletion"
        text="Are you sure you want to delete this record?"
        onPress={handleDeleteConfirm}
        onCancel={() => {
          setDeleteModal(false);
          setItemToDelete(null);
        }}
      />
    </ActionPaneContainer>
  );
};

export {BankAccountListPage};
