/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect, useContext} from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {UserContext} from '../../context/UserContext';

import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import SelectionHeader from '../../components/WorkItemAssigned/SelectionHeader';
import WorkItemDetailSection from '../../components/WorkItemAssigned/WorkItemDetailSection';
import SimpleHeader from '../../components/PageHeader/SimpleHeader';
import NotificationDropdown from '../../components/NotificationDropdown';
import {AlertModal} from '../../components/Leaves/AlertModal';
import {retrieveByEmail} from '../../API/WorkflowTrackingStatusTable/retrieveByEmail';
import {FindRequest} from '../../API/Leaves/FindRequest';
import {FindEOSRequest} from '../../API/EOS/FindEOSRequest';
import {FindAdvanceRequest} from '../../API/Advance/FindAdvanceRequest';

const WorkItemAssigned = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [workItemData, setWorkItemData] = useState([]);
  const [leaveDetailData, setLeaveDetailData] = useState({});
  const [eosDetailData, setEosDetailData] = useState({});
  const [advanceDetailData, setAdvanceDetailData] = useState({});

  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notificationVisible, setNotificationVisible] = useState(false);

  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const {userData} = useContext(UserContext);
  const navigation = useNavigation();

  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000);
    fetchNotifications(); // Initial fetch
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData.email]);

  useEffect(() => {
    handleRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const headerOptions = SimpleHeader({
      onToggleDrawer: toggleDrawer,
      onRefresh: handleRefresh,
      onShowNotify: toggleNotification,
      onCount: notificationCount,
    });
    navigation.setOptions(headerOptions);
  }, [
    navigation,
    notificationCount,
    notificationVisible,
    notifications,
    handleRefresh,
    toggleDrawer,
  ]);

  const toggleNotification = () => setNotificationVisible(!notificationVisible);
  const closeNotification = () => setNotificationVisible(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const toggleDrawer = () => navigation.toggleDrawer();

  const toggleSection = (id, documentId, requestType) => {
    const isExpanded = expandedItemId === id;
    setExpandedItemId(isExpanded ? null : id);

    if (!isExpanded) {
      if (requestType === 'Leave Requests' && !leaveDetailData[id]) {
        fetchLeaveDetailData(documentId, id);
      } else if (requestType === 'EOS Request' && !eosDetailData[id]) {
        fetchEOSDetailData(documentId, id);
      } else if (requestType === 'Advance Request' && !advanceDetailData[id]) {
        fetchAdvanceDetailData(documentId, id);
      }
    }
  };

  const fetchNotifications = async () => {
    try {
      const data = await retrieveByEmail({email: userData.email});
      if (Array.isArray(data)) {
        const formattedNotifications = data.map(notification => ({
          document: notification.Document,
          documentType: notification.DocumentType,
          correlationId: notification.CorrelationId,
        }));
        setNotifications(formattedNotifications);
        setNotificationCount(formattedNotifications.length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      const data = await retrieveByEmail({email: userData.email});
      const formattedData = data.map((item, index) => ({
        id: index,
        document: item.Document,
        documentType: item.DocumentType,
        correlationId: item.CorrelationId,
        additionalDetails: `Additional details for ${item.Document}`,
      }));

      // console.log('Work Item Data============', formattedData);

      setWorkItemData(formattedData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setAlertMessage('Failed to fetch data.');
      setAlertModal(true);
    } finally {
      setIsLoading(false);
      setExpandedItemId(null);
    }
  };

  const fetchLeaveDetailData = async (documentId, id) => {
    try {
      const detailLeaveResponse = await FindRequest({
        requestId: documentId,
      });
      setLeaveDetailData(prevState => ({
        ...prevState,
        [id]: detailLeaveResponse,
      }));
    } catch (error) {
      console.error('Failed to Fetch Leave Detail Data:', error);
      setAlertMessage('Failed to Fetch Leave Detail Data.');
      setAlertModal(true);
    }
  };

  const fetchEOSDetailData = async (documentId, id) => {
    try {
      const detailEOSResponse = await FindEOSRequest({requestId: documentId});
      setEosDetailData(prevState => ({...prevState, [id]: detailEOSResponse}));
    } catch (error) {
      console.error('Failed to Fetch EOS Detail Data:', error);
      setAlertMessage('Failed to Fetch EOS Detail Data.');
      setAlertModal(true);
    }
  };

  const fetchAdvanceDetailData = async (documentId, id) => {
    try {
      const detailAdvanceResponse = await FindAdvanceRequest({
        requestId: documentId,
      });
      setAdvanceDetailData(prevState => ({
        ...prevState,
        [id]: detailAdvanceResponse,
      }));
    } catch (error) {
      console.error('Failed to Fetch Advance Detail Data:', error);
      setAlertMessage('Failed to Fetch Advance Detail Data.');
      setAlertModal(true);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.containerView}>
        {isLoading ? (
          <CustomIndicator />
        ) : workItemData.length > 0 ? (
          workItemData.map(item => (
            <View key={item.id} style={styles.itemContainer}>
              <SelectionHeader
                reqId={item.document.split(': ')[1].split(',')[0]}
                reqType={item.documentType.split('Employee ')[1]} // Extract request type
                expanded={expandedItemId === item.id}
                onToggle={() =>
                  toggleSection(
                    item.id,
                    item.document.split(': ')[1].split(',')[0],
                    item.documentType.split('Employee ')[1], // Pass request type
                  )
                }
              />

              {expandedItemId === item.id && (
                <View style={styles.containerBasic}>
                  {item.documentType.includes('Leave Request') ? (
                    <WorkItemDetailSection
                      detailData={leaveDetailData[item.id]} // Pass Leave Request data
                      correlationId={item.correlationId}
                      dataType="leave"
                      refreshPage={handleRefresh}
                    />
                  ) : item.documentType.includes('EOS Request') ? (
                    <WorkItemDetailSection
                      detailData={eosDetailData[item.id]} // Pass EOS Request data
                      correlationId={item.correlationId}
                      dataType="eos"
                      refreshPage={handleRefresh}
                    />
                  ) : item.documentType.includes('Advance Request') ? (
                    <WorkItemDetailSection
                      detailData={advanceDetailData[item.id]} // Pass Advance Request data
                      correlationId={item.correlationId}
                      dataType="advance"
                      refreshPage={handleRefresh}
                    />
                  ) : null}
                </View>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No Data Available</Text>
        )}
      </View>

      {notificationVisible && (
        <NotificationDropdown
          visible={notificationVisible}
          notifications={notifications}
          onClose={closeNotification}
        />
      )}

      <AlertModal
        visible={alertModal}
        heading="Alert"
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#f9f9f9', // Light background color for the screen
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  containerView: {
    flex: 1,
    marginBottom: 20,
  },
  itemContainer: {
    backgroundColor: '#ffffff', // White background for each item
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: '#000', // Shadow for a card-like effect
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // For Android shadow
  },
  containerBasic: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f0f4f8', // Light gray background for details
    borderRadius: 8,
  },
  detailsContainer: {
    marginTop: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  emptyText: {
    flex: 1,
    fontSize: 16,
    color: '#888', // Gray color for empty message
    textAlign: 'center',
    textAlignVertical: 'center',
  },
});

export default WorkItemAssigned;
