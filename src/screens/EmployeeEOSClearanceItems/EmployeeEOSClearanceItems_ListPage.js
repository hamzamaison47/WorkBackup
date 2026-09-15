/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable curly */
import React, {useState, useCallback} from 'react';
import {
  Text,
  FlatList,
  BackHandler,
  RefreshControl,
  I18nManager,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';

import AlertModal from '../../components/Alert/AlertModal';
import AlertDeleteModal from '../../components/Alert/AlertDeleteModal';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import DynamicRequestCard from '../../components/DynamicRequestCard';
import styles from '../../styles/styles';
import {useSelector} from 'react-redux';
import {translate as t} from '../../store/utils/translate';

import {retrieveEOSItemWise} from '../../API/EmployeeEOSClearanceItems/RetrieveEOSItemWise';

import {ScrollView} from 'react-native';
const EmployeeEOSClearanceItemsListPage = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const {
    employeeId,
    employeeName,
    WorkerRecId,
    cameFrom,
    highlightRecId,
    recId,
    userData: routeUserData,
  } = route.params || {};

  const {menuItems} = useSelector(state => state.menuItem);
  const reduxUserData = useSelector(state => state.user.userData);
  const effectiveUserData = routeUserData || reduxUserData;
  const effectiveEmployeeId = employeeId || effectiveUserData?.employeeId;
  const effectiveEmployeeName = employeeName || effectiveUserData?.employeeName;
  const effectiveWorkerRecId = WorkerRecId || effectiveUserData?.WorkerRecId;

  const isRTL = I18nManager.isRTL;

  const [isLoading, setIsLoading] = useState(false);
  const [clearanceItemsData, setClearanceItemsData] = useState([]);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [highlightedRecId, setHighlightedRecId] = useState(null);
  const [processingButtons, setProcessingButtons] = useState({});

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetchClearanceItems = useCallback(async () => {
    if (!effectiveEmployeeId) return;
    if (!recId) return;

    setIsLoading(true);
    try {
      const clearanceData = await retrieveEOSItemWise({
        employeeId: effectiveEmployeeId,
        recId: recId,
      });

      console.log('clearanceData', {clearanceData});

      setClearanceItemsData(clearanceData);
    } catch (error) {
      setAlertMessage(t('EmployeeEOSClearanceItems.fetchFailed'));
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveEmployeeId, recId]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchClearanceItems();
    }, [fetchClearanceItems]),
  );
  //is ma koi n
  // Handle highlighting of records
  useFocusEffect(
    useCallback(() => {
      if (highlightRecId) {
        setHighlightedRecId(highlightRecId);
        fetchClearanceItems();

        const timer = setTimeout(() => {
          setHighlightedRecId(null);
        }, 3000);

        return () => clearTimeout(timer);
      }
    }, [highlightRecId, fetchClearanceItems]),
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
    }, [handleGoBack, navigation]),
  );

  const cardConfig = {
    headerConfig: {
      title: {key: 'EOSRequestId'},
    },

    fields: [
      {
        key: 'ClearanceItemCode',
        label: 'Clearance Item Code',
        type: 'text',
      },
      {
        key: 'ClearanceItemName',
        label: 'Clearance Item',
        type: 'text',
      },
      {
        key: 'DepartmentId',
        label: 'Department',
        type: 'text',
      },
      {
        key: 'ClearanceStatus',
        label: 'Status',
        type: 'text',
      },
    ],

    expandableFields: [
      {
        key: 'ResponsiblePersonId',
        label: 'Responsible Person',
        type: 'text',
      },
      {
        key: 'EmployeeId',
        label: 'Employee ID',
        type: 'text',
      },
      {
        key: 'Comments',
        label: 'Comments',
        type: 'text',
      },
    ],
    isRTL: isRTL,
  };

  // Handle back navigation
  const handleGoBack = () => {
    let targetRoute = 'MainDashboard'; // default

    switch (cameFrom) {
      case 'EmployeeEOSRequestListPage':
        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'EmployeeEOSRequestListPage',
              params: {
                employeeId: effectiveEmployeeId,
                employeeName: effectiveEmployeeName,
                WorkerRecId: effectiveWorkerRecId,
                userData: effectiveUserData,
                cameFrom: 'MainDashboard',
              },
            },
          ],
        });
        return;
      case 'MainDashboard':
        targetRoute = 'MainDashboard';
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
  };

  const getPageLabel = () => {
    const currentMenuItem = menuItems.find(
      item => item.MenuId === 'EmployeeEOSClearanceItemsListPage',
    );
    return (
      currentMenuItem?.Label || t('EmployeeEOSClearanceItemsListPage.pageTitle')
    );
  };

  const handleButtonPress = (buttonType, itemData) => {
    switch (
      buttonType
      // case BUTTON_TYPES.EDIT:
      //   handleEditPress(itemData);
      //   break;
    ) {
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchClearanceItems();
  };

  const getButtonConfig = () => {
    return {
      // Buttons to be configured once field names are confirmed from API response
    };
  };

  const getClearanceStatusLabel = status => {
    const statusMap = {
      Open: 'Open',
      Cleared: 'Cleared',
      NotCleared: 'Not Cleared',
      Pending: 'Pending',
      Approved: 'Approved',
      Rejected: 'Rejected',
    };
    return statusMap[status] || status || 'Open';
  };

  const renderClearanceItemCard = ({item}) => {
    const isHighlighted = highlightedRecId === item.RecId;
    const itemProcessingButtons = processingButtons[item.RecId] || [];

    const processedItem = {
      ...item,
      ClearanceStatus: getClearanceStatusLabel(item.ClearanceStatus),
    };

    const buttonConfig = getButtonConfig(item);

    return (
      <DynamicRequestCard
        data={processedItem}
        headerConfig={cardConfig.headerConfig}
        fields={cardConfig.fields}
        expandableFields={cardConfig.expandableFields}
        buttons={buttonConfig}
        isHighlighted={isHighlighted}
        onButtonPress={handleButtonPress}
        isExpandable={true}
        highlightGradientColors={['#E8F5E8', '#F0FFF0']}
        processingButtons={itemProcessingButtons}
        isRTL={isRTL}
      />
    );
  };

  return (
    <ActionPaneContainer
      pageTitle={getPageLabel()}
      isBackButton={true}
      showFooter={true}
      showFloatingButton={false}
      isHeaderActive={true}
      onBackPress={handleGoBack}
      onRefresh={handleRefresh}
      onFloatingButtonPress={0}>
      {/* Main content */}
      {isLoading ? (
        <CustomIndicator />
      ) : clearanceItemsData.length > 0 ? (
        <FlatList
          data={clearanceItemsData}
          renderItem={renderClearanceItemCard}
          keyExtractor={(item, index) =>
            item.RecId?.toString() || index.toString()
          }
          contentContainerStyle={styles.LReqLP_ListContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
          }
        />
      ) : (
        <ScrollView
          contentContainerStyle={{flexGrow: 1}}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
          }>
          <Text style={styles.LReqLP_NoDataText}>
            {t('Employee EOS Clearance Items Not Found')}
          </Text>
        </ScrollView>
      )}

      {/* Alert Modal */}
      <AlertModal
        visible={alertModal}
        heading={t('common.alert')}
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />

      {/* Delete Confirmation Modal */}
      <AlertDeleteModal
        visible={deleteModal}
        heading={t('Employee EOS Clearance Items.deleteConfirmTitle')}
        text={t('Employee EOS Clearance Items.deleteConfirmMessage')}
        onPress={0}
        onCancel={() => {
          setDeleteModal(false);
          setItemToDelete(null);
        }}
      />
    </ActionPaneContainer>
  );
};

export default EmployeeEOSClearanceItemsListPage;
