/* eslint-disable curly */
/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useCallback, useEffect, useMemo} from 'react';
import {
  Text,
  FlatList,
  BackHandler,
  RefreshControl,
  View,
  ActivityIndicator,
  Animated,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';

import AlertModal from '../../components/Alert/AlertModal';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import DynamicRequestCard from '../../components/DynamicRequestCard';
import styles from '../../styles/styles';

import {retrieveAllPurchaseOrders} from '../../API/PurchaseOrder/retrieveAllPurchaseOrder';

import {useSelector} from 'react-redux';
import {ScrollView} from 'react-native-gesture-handler';
import DynamicAttachmentModal from '../../shared/DynamicAttachmentModal';
import usePallete from '../../hooks/usePalette';

const PurchaseOrderListPage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const P = usePallete();

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
  const [fadeAnim] = useState(new Animated.Value(0));
  const [purchaseOrderData, setPurchaseOrderData] = useState([]);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [highlightedRecId, setHighlightedRecId] = useState(null);
  const [processingButtons, setProcessingButtons] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [rawData, setRawData] = useState([]);
  const [displayData, setDisplayData] = useState([]);
  const [sortOrder, setSortOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Attachment modal state
  const [attachmentModal, setAttachmentModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const CARD_CONFIG = {
    headerConfig: {
      title: {key: 'PurchID'},
    },
    fields: [
      {key: 'VendorAccount', label: 'Vendor', type: 'text'},
      {key: 'PurchaseStatus', label: '', type: 'status'},
      {key: 'DeliveryDate', label: 'Delivery Date', type: 'text'},
      {key: 'TotalAmount', label: 'Total Amount', type: 'currency'},
    ],
  };

  const STATUS_MAP = {
    Draft: 'Draft',
    OpenOrder: 'Open Order',
    Received: 'Received',
    Invoiced: 'Invoiced',
    Closed: 'Closed',
    Cancelled: 'Cancelled',
  };

  const getStatusLabel = status => STATUS_MAP[status] || status || 'Draft';

  const formatDate = dateString => {
    if (!dateString || dateString === '1900-01-01T00:00:00') return 'N/A';
    const date = new Date(dateString);
    return isNaN(date) ? dateString : date.toLocaleDateString();
  };

  const setButtonProcessing = (recId, action, isProc) => {
    setProcessingButtons(prev => {
      const updated = {...prev};
      if (isProc) {
        updated[recId] = [...(updated[recId] || []), action];
      } else {
        updated[recId] = (updated[recId] || []).filter(a => a !== action);
        if (updated[recId].length === 0) delete updated[recId];
      }
      return updated;
    });
  };

  const getButtonConfig = item => {
    return {
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
      approval: {
        show: true,
        position: 'bottom',
        style: 'approval_dropdown',
        text: 'View Details',
        icon: 'eye',
        textColor: P.primary,
        disabled: false,
        actions: [
          {
            key: 'viewDetails',
            label: 'View Details',
            icon: 'eye',
          },
          {
            key: 'viewHistory',
            label: 'View History',
            icon: 'clock',
          },
        ],
      },
    };
  };

  const handleButtonPress = (buttonType, item) => {
    if (buttonType === 'attachment') handleAttachmentPress(item);
    else if (buttonType === 'viewDetails') handleViewDetails(item);
    else if (buttonType === 'viewHistory') handleViewHistory(item);
  };

  const handleAttachmentPress = item => {
    setSelectedItem(item);
    setAttachmentModal(true);
  };

  const handleViewDetails = item => {
    // Navigate to purchase order details if needed
    console.log('View details for:', item.PurchId);
  };

  const handleViewHistory = item => {
    navigation.navigate('WorkflowHistoryScreen', {
      recId: item.RecId,
      tableId: item.TableId,
      cameFrom: 'PurchaseOrderListPage',
    });
  };

  const handleCardPress = item => {
    // Navigate to purchase order lines or details if needed
    console.log('Card pressed:', item.PurchId);
  };

  const fetchPurchaseOrderData = useCallback(async () => {
    if (!effectiveEmployeeId) return;

    setIsLoading(true);

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();

    try {
      const data = await retrieveAllPurchaseOrders({
        employeeId: effectiveEmployeeId,
      });
      setPurchaseOrderData(data);
      setRawData(data);
      setDisplayData(data);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      setAlertMessage('Failed to fetch purchase orders.');
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveEmployeeId, fadeAnim]);

  useFocusEffect(
    useCallback(() => {
      fetchPurchaseOrderData();
    }, [fetchPurchaseOrderData]),
  );

  useFocusEffect(
    useCallback(() => {
      if (highlightRecId) {
        setHighlightedRecId(highlightRecId);
        fetchPurchaseOrderData();

        const timer = setTimeout(() => {
          setHighlightedRecId(null);
        }, 3000);

        return () => clearTimeout(timer);
      }
    }, [highlightRecId, fetchPurchaseOrderData]),
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

  const getFilteredData = () => {
    const base = searchQuery.trim() ? displayData : purchaseOrderData;
    if (activeFilter === 'All') return base;
    return base.filter(
      item => getStatusLabel(item.PurchaseStatus) === activeFilter,
    );
  };

  const getFilterCounts = () => {
    const counts = {All: purchaseOrderData.length};
    [
      ...new Set(
        purchaseOrderData.map(item => getStatusLabel(item.PurchaseStatus)),
      ),
    ].forEach(status => {
      counts[status] = purchaseOrderData.filter(
        item => getStatusLabel(item.PurchaseStatus) === status,
      ).length;
    });
    return counts;
  };

  const visiblePills = useMemo(() => {
    if (!purchaseOrderData.length) return ['All'];
    const unique = [
      ...new Set(
        purchaseOrderData.map(item => getStatusLabel(item.PurchaseStatus)),
      ),
    ];
    return ['All', ...unique];
  }, [purchaseOrderData]);

  const handleGoBack = () => {
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
        navigation.goBack();
        return;
    }

    navigation.reset({
      index: 0,
      routes: [{name: targetRoute}],
    });
  };

  const handleRefresh = () => {
    fetchPurchaseOrderData();
  };

  const applySearchAndSort = useCallback((data, query, sort) => {
    let result = [...data];

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(item =>
        Object.values(item).some(val =>
          String(val ?? '')
            .toLowerCase()
            .includes(q),
        ),
      );
    }

    if (sort) {
      result.sort((a, b) => {
        const getDate = obj => {
          for (const val of Object.values(obj)) {
            const d = new Date(val);
            if (!isNaN(d.getTime())) return d;
          }
          return new Date(0);
        };
        const diff = getDate(a) - getDate(b);
        return sort === 'asc' ? diff : -diff;
      });
    }

    setDisplayData(result);
  }, []);

  const handleSearch = query => {
    setSearchQuery(query);
    applySearchAndSort(rawData, query, sortOrder);
  };

  const handleSort = sort => {
    setSortOrder(sort);
    applySearchAndSort(rawData, searchQuery, sort);
  };

  const renderPurchaseOrderCard = ({item}) => {
    const processedItem = {
      ...item,
      RecId: item.RecId,
      DeliveryDate: formatDate(item.DeliveryDate),
      CreatedDateTime: formatDate(item.CreatedDateTime),
      PurchaseStatus: getStatusLabel(item.PurchaseStatus),
      TotalAmount: item.TotalAmount || 0,
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
    };

    return (
      <DynamicRequestCard
        data={processedItem}
        headerConfig={CARD_CONFIG.headerConfig}
        fields={CARD_CONFIG.fields}
        buttons={getButtonConfig(item)}
        onButtonPress={handleButtonPress}
        onPress={() => handleCardPress(processedItem)}
        isExpandable={true}
        gradientColors={['#b8f5d4', '#d4f0e8', '#dff4ff']}
        processingButtons={processingButtons[item.RecId] || []}
        showNavigationArrow={true}
        searchQuery={searchQuery}
      />
    );
  };

  return (
    <ActionPaneContainer
      pageTitle="Purchase Orders"
      isBackButton={false}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      onBackPress={handleGoBack}
      onRefresh={handleRefresh}
      showFilterPills={true}
      filterPills={visiblePills}
      activeFilter={activeFilter}
      onFilterChange={setActiveFilter}
      filterCounts={getFilterCounts()}
      showPageTitleRow={true}
      showSearchBar={true}
      onSearchChange={handleSearch}
      onSortChange={handleSort}
      activeSortOrder={sortOrder}>
      {isProcessing && (
        <View style={styles.DLP_ProcessingOverlay}>
          <View style={styles.DLP_ProcessingContainer}>
            <ActivityIndicator size="large" color={P.primary} />
            <Text style={styles.DLP_ProcessingText}>Processing...</Text>
          </View>
        </View>
      )}

      {isLoading ? (
        <View style={styles.DLP_LoadingContainer}>
          <CustomIndicator />
        </View>
      ) : (
        <Animated.View
          style={[styles.DLP_AnimatedContainer, {opacity: fadeAnim}]}>
          {getFilteredData().length > 0 ? (
            <FlatList
              data={getFilteredData()}
              keyExtractor={item => item.RecId?.toString()}
              renderItem={renderPurchaseOrderCard}
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
              {searchQuery.trim() ? (
                <>
                  <Text style={styles.DLP_NoDataSubText}>
                    No records match "{searchQuery}"
                  </Text>
                </>
              ) : rawData.length === 0 && activeFilter === 'All' ? (
                <>
                  <Text style={styles.DLP_NoDataText}>No Purchase Orders</Text>
                  <Text style={styles.DLP_NoDataSubText}>
                    There are no purchase orders to display
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.DLP_NoDataText}>
                    {`${activeFilter} purchase order not found.`}
                  </Text>
                </>
              )}
            </ScrollView>
          )}
        </Animated.View>
      )}

      <DynamicAttachmentModal
        visible={attachmentModal}
        recordData={selectedItem}
        recordIdKey="RecId"
        tableName="PurchTable"
        onClose={() => {
          setAttachmentModal(false);
          setSelectedItem(null);
        }}
        onSave={() => {
          fetchPurchaseOrderData();
        }}
        legalEntity={selectedLegalEntity}
        employeeId={effectiveEmployeeId}
        employeeName={effectiveEmployeeName}
        modalTitle={'Purchase Order Attachments'}
        showDetails={true}
        detailFields={[
          {key: 'PurchId', label: 'Purchase Order ID'},
          {key: 'PurchaseName', label: 'Title'},
          {key: 'VendorAccount', label: 'Vendor'},
        ]}
        detailData={selectedItem || {}}
        showTakePhoto={false}
        showChooseFile={false}
        showDownload={true}
        showDelete={false}
      />

      <AlertModal
        visible={alertModal}
        heading="Alert"
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />
    </ActionPaneContainer>
  );
};

export default PurchaseOrderListPage;
