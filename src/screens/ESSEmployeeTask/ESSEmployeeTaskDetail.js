import React, {useState, useEffect, useCallback} from 'react';
import {
  Text,
  View,
  ScrollView,
  useWindowDimensions,
  BackHandler,
  Modal,
  TouchableOpacity,
} from 'react-native';
import {
  useRoute,
  useNavigation,
  useFocusEffect,
} from '@react-navigation/native';
import DatePicker from 'react-native-date-picker';
import {decode} from 'html-entities';
import RenderHTML from 'react-native-render-html';
import usePalette from '../../hooks/usePalette';

import {retrieveDetailESSEmployeeTask} from '../../API/ESSEmployeeTask/retrieveDetailESSEmployeeTask';
import {UpdateDueDate} from '../../API/ESSEmployeeTask/UpdateDueDate';
import DynamicRequestCard from '../../components/DynamicRequestCard';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import AlertModal from '../../components/Alert/AlertModal';
import styles from '../../styles/styles';

const ESSEmployeeTaskDetail = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const {recId} = route.params || {};
  const {width} = useWindowDimensions();
  const P = usePalette();

  const [isLoading, setIsLoading] = useState(false);
  const [taskDetail, setTaskDetail] = useState(null);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const [dueDateModalVisible, setDueDateModalVisible] = useState(false);
  const [newDueDate, setNewDueDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const formatDate = dateValue => {
    if (!dateValue) {
      return '';
    }
    const date = new Date(dateValue);
    if (isNaN(date)) {
      return dateValue;
    }
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
    return `${
      months[date.getMonth()]
    } ${date.getDate()}, ${date.getFullYear()}`;
  };

  const formatLocalDate = date => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate('ESSEmployeeTask_ListPage');
        return true;
      };
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [navigation]),
  );

  const fetchTaskDetail = useCallback(async () => {
    if (!recId) {
      return;
    }
    setIsLoading(true);
    try {
      const response = await retrieveDetailESSEmployeeTask({recId});
      setTaskDetail(response?.[0] || null);
    } catch {
      setAlertMessage('Unable to load task detail');
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  }, [recId]);

  useEffect(() => {
    fetchTaskDetail();
  }, [fetchTaskDetail]);

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
        dueDate: formatDate(
          taskDetail['a:dueDate'] || taskDetail.dueDate || '',
        ),
        Status: taskDetail['a:Status'] || taskDetail.Status || '',
        Instruction:
          taskDetail['a:Instruction'] ||
          taskDetail.Instruction ||
          'No instructions available',
      }
    : null;

  const cleanedInstruction = processedItem?.Instruction
    ? decode(processedItem.Instruction)
        .replace(/<font[^>]*>/gi, '')
        .replace(/<\/font>/gi, '')
    : '';

  const handleUpdateDueDate = async () => {
    if (!newDueDate) {
      setAlertMessage('Please select due date');
      setAlertModal(true);
      return;
    }
    try {
      setIsLoading(true);
      await UpdateDueDate({recId, dueDate: newDueDate});
      setAlertMessage('Due date updated successfully');
      setAlertModal(true);
      setDueDateModalVisible(false);
      fetchTaskDetail();
    } catch {
      setAlertMessage('Failed to update due date');
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonConfig = () => ({
    edit: {
      show: true,
      position: 'header',
      style: 'icon',
      icon: 'edit',
      iconSize: 20,
      iconColor: '#fff',
      backgroundColor: P.primary,
      disabled: false,
    },
  });

  const handleEditPress = () => {
    setNewDueDate(taskDetail?.dueDate || '');
    setDueDateModalVisible(true);
  };

  // The date object to show in the picker
  const pickerDate = newDueDate ? new Date(newDueDate) : new Date();

  return (
    <ActionPaneContainer pageTitle="Task Detail" showFooter>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <CustomIndicator />
        </View>
      ) : processedItem ? (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <DynamicRequestCard
            data={processedItem}
            buttons={getButtonConfig()}
            onButtonPress={handleEditPress}
            headerConfig={{
              title: {key: 'name'},
              subtitle: {key: 'displayRegarding'},
            }}
            fields={[
              {key: 'description', label: 'Description', type: 'text'},
              {key: 'displayRegarding', label: 'Regarding', type: 'text'},
              {key: 'displayProcessType', label: 'Process Type', type: 'text'},
              {key: 'contactperson', label: 'Contact Person', type: 'text'},
              {key: 'dueDate', label: 'Due Date', type: 'text'},
              {key: 'Status', label: 'Task Status', type: 'text'},
            ]}
          />

          {/* Instructions */}
          <View style={styles.instructionContainer}>
            <Text style={styles.instructionHeading}>Instruction</Text>
            <RenderHTML
              contentWidth={width}
              source={{html: cleanedInstruction}}
            />
          </View>

          {/* Due Date Modal */}
          <Modal
            visible={dueDateModalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setDueDateModalVisible(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.label}>Select Due Date</Text>

                {/* Show selected date */}
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setShowDatePicker(true)}>
                  <Text>
                    {newDueDate ? formatDate(newDueDate) : 'Tap to select date'}
                  </Text>
                </TouchableOpacity>

                {/* react-native-date-picker modal */}
                <DatePicker
                  modal
                  open={showDatePicker}
                  date={pickerDate}
                  mode="date"
                  onConfirm={selectedDate => {
                    setShowDatePicker(false);
                    setNewDueDate(formatLocalDate(selectedDate));
                  }}
                  onCancel={() => setShowDatePicker(false)}
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    onPress={() => setDueDateModalVisible(false)}>
                    <Text>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleUpdateDueDate}>
                    <Text style={{color: P.primary}}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          <AlertModal
            visible={alertModal}
            heading="Alert"
            text={alertMessage}
            onPress={() => setAlertModal(false)}
          />
        </ScrollView>
      ) : null}
    </ActionPaneContainer>
  );
};

export default ESSEmployeeTaskDetail;
