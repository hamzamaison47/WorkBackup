/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, ScrollView, RefreshControl} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';

import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import SelectionHeader from '../../components/WorkItemAssigned/SelectionHeader';
import WorkItemDetailSection from '../../components/WorkItemAssigned/WorkItemDetailSection';
import AlertModal from '../../components/Alert/AlertModal';
import {RetrieveByEmail} from '../../API/WorkflowTrackingStatusTable/retrieveByEmail';

const WorkItemAssigned = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [workItemData, setWorkItemData] = useState([]);
  const [leaveDetailData, setLeaveDetailData] = useState({});
  const [eosDetailData, setEosDetailData] = useState({});
  const [advanceDetailData, setAdvanceDetailData] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const {userData} = useSelector(state => state.user);
  const navigation = useNavigation();

  useEffect(() => {
    handleRefresh();
  }, []);

  const toggleSection = (id, documentId, requestType) => {
    const isExpanded = expandedItemId === id;
    setExpandedItemId(isExpanded ? null : id);
  };

  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      const data = await RetrieveByEmail({email: userData.email});

      const formattedData = data.map((item, index) => ({
        id: index,
        document: item.Document,
        documentType: item.DocumentType,
        correlationId: item.CorrelationId,
      }));

      setWorkItemData(formattedData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setAlertMessage('Failed to fetch data.');
      setAlertModal(true);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
      setExpandedItemId(null);
    }
  };

  const onPullToRefresh = async () => {
    setRefreshing(true);
    await handleRefresh();
  };

  return (
    <View style={styles.mainContainer}>
      {isLoading ? (
        <CustomIndicator />
      ) : (
        <>
          {/* ===== HEADER SECTION (Copied from LeaveRequestListPage) ===== */}
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Assigned Work Items</Text>
            <Text style={styles.headerCount}>
              {workItemData.length}{' '}
              {workItemData.length === 1 ? 'Item' : 'Items'}
            </Text>
          </View>

          {/* ===== SCROLLABLE LIST ===== */}
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onPullToRefresh}
                colors={['#2e6dd8']}
                tintColor="#2e6dd8"
              />
            }>
            {workItemData.length > 0 ? (
              workItemData.map(item => (
                <View key={item.id} style={styles.card}>
                  <SelectionHeader
                    reqId={item.document.split(': ')[1].split(',')[0]}
                    reqType={item.documentType.split('Employee ')[1]}
                    expanded={expandedItemId === item.id}
                    onToggle={() =>
                      toggleSection(
                        item.id,
                        item.document.split(': ')[1].split(',')[0],
                        item.documentType.split('Employee ')[1],
                      )
                    }
                  />

                  {expandedItemId === item.id && (
                    <View style={styles.detailsContainer}>
                      {item.documentType.includes('Leave Request') ? (
                        <WorkItemDetailSection
                          detailData={leaveDetailData[item.id]}
                          correlationId={item.correlationId}
                          dataType="leave"
                          refreshPage={handleRefresh}
                        />
                      ) : item.documentType.includes('EOS Request') ? (
                        <WorkItemDetailSection
                          detailData={eosDetailData[item.id]}
                          correlationId={item.correlationId}
                          dataType="eos"
                          refreshPage={handleRefresh}
                        />
                      ) : item.documentType.includes('Advance Request') ? (
                        <WorkItemDetailSection
                          detailData={advanceDetailData[item.id]}
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
              <View style={styles.emptyView}>
                <Text style={styles.emptyText}>No Records Found</Text>
              </View>
            )}
          </ScrollView>
        </>
      )}

      <AlertModal
        visible={alertModal}
        heading="Alert"
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f4f6f8', // consistent with LeaveRequestListPage
  },
  headerContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 14,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2e6dd8',
  },
  headerCount: {
    fontSize: 14,
    color: '#444',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 14,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
  },
  detailsContainer: {
    marginTop: 6,
    backgroundColor: '#f8faff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  emptyView: {
    flex: 1,
    alignItems: 'center',
    marginTop: 120,
  },
  emptyText: {
    fontSize: 15,
    color: '#a1a1a1',
    fontStyle: 'italic',
  },
});

export default WorkItemAssigned;
