import React, {useState, useEffect, useCallback} from 'react';
import {Text, View, ScrollView, I18nManager, StyleSheet} from 'react-native';
import {useRoute} from '@react-navigation/native';
import {retrieveDetailESSEmployeeTask} from '../../API/ESSEmployeeTask/retrieveDetailESSEmployeeTask';
import DynamicRequestCard from '../../components/DynamicRequestCard';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import AlertModal from '../../components/Alert/AlertModal';
import ActionPaneContainer from '../../components/ActionPaneContainer';

const ESSEmployeeTaskDetail = () => {
  const route = useRoute();
  const isRTL = I18nManager.isRTL;
  const {recId} = route.params || {};

  const [isLoading, setIsLoading] = useState(false);
  const [taskDetail, setTaskDetail] = useState(null);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  console.log('Detail screen received recId:', recId); // ✅ Verify recId received

  /** Fetch Task Detail */
  const fetchTaskDetail = useCallback(async () => {
    if (!recId) {
      setAlertMessage('Invalid task selected.');
      setAlertModal(true);
      return;
    }

    setIsLoading(true);
    try {
      const response = await retrieveDetailESSEmployeeTask({recId});
      console.log('Task Detail from API:', response);

      setTaskDetail(response?.[0] || null);
    } catch (error) {
      console.log('Task detail fetch error:', error);
      setAlertMessage('Unable to load task detail');
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  }, [recId]);

  useEffect(() => {
    fetchTaskDetail();
  }, [fetchTaskDetail]);

  /** Card configuration */
  const cardConfig = {
    headerConfig: {title: {key: 'name'}, subtitle: {key: 'displayRegarding'}},
    fields: [
      {key: 'description', label: 'Description', type: 'text'},
      {key: 'displayRegarding', label: 'Regarding', type: 'text'},
      {key: 'displayProcessType', label: 'Process Type', type: 'text'},
      {key: 'contactperson', label: 'Contact Person', type: 'text'},
      {key: 'displayActionLinkLabelValue', label: 'Task Link', type: 'text'},
      {key: 'IsOptional', label: 'Optional', type: 'text'},
      {key: 'dueDate', label: 'Due Date', type: 'date'},
      {key: 'status', label: 'Task Status', type: 'text'},
    ],
    gradientColors: ['#6ee0ff', '#bddeff', '#cce6ff'],
    isRTL: isRTL,
  };

  const processedItem = taskDetail
    ? {
        name: taskDetail['a:name'] || taskDetail.name || '',
        description:
          taskDetail['a:description'] || taskDetail.description || '',
        displayRegarding:
          taskDetail['a:displayRegarding'] || taskDetail.displayRegarding || '',
        displayProcessType:
          taskDetail['a:displayProcessType'] ||
          taskDetail.displayProcessType ||
          '',
        contactperson:
          taskDetail['a:contactperson'] || taskDetail.contactperson || '',
        displayActionLinkLabelValue:
          taskDetail['a:displayActionLinkLabelValue'] ||
          taskDetail.displayActionLinkLabelValue ||
          '',
        IsOptional: taskDetail['a:IsOptional'] || taskDetail.IsOptional || '',
        dueDate: taskDetail['a:dueDate'] || taskDetail.dueDate || '',
        status: taskDetail['a:Status'] || taskDetail.status || '',
      }
    : null;

  return (
    <ActionPaneContainer
      pageTitle="Task Detail"
      showFooter
      isHeaderActive
      showPageTitleRow
      showFloatingButton={false}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <CustomIndicator />
        </View>
      ) : processedItem ? (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <DynamicRequestCard
            data={processedItem}
            headerConfig={cardConfig.headerConfig}
            fields={cardConfig.fields}
            expandableFields={[]} // all fields shown
            isExpandable={false}
            gradientColors={cardConfig.gradientColors}
            isRTL={isRTL}
          />
        </ScrollView>
      ) : (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>Task detail not found</Text>
        </View>
      )}

      <AlertModal
        visible={alertModal}
        heading="Alert"
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />
    </ActionPaneContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  scrollContainer: {padding: 16},
  noDataContainer: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  noDataText: {fontSize: 16, color: '#555'},
});

export default ESSEmployeeTaskDetail;
