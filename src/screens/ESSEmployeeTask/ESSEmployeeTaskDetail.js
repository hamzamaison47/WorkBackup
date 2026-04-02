/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect, useCallback} from 'react';
import {
  Text,
  View,
  ScrollView,
  StyleSheet,
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
import DateTimePicker from '@react-native-community/datetimepicker';
import {decode} from 'html-entities';
import RenderHTML from 'react-native-render-html';

import {retrieveDetailESSEmployeeTask} from '../../API/ESSEmployeeTask/retrieveDetailESSEmployeeTask';
import {UpdateDueDate} from '../../API/ESSEmployeeTask/UpdateDueDate';
import DynamicRequestCard from '../../components/DynamicRequestCard';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import AlertModal from '../../components/Alert/AlertModal';
import styles from '../../styles/styles';
import {max} from 'moment';

const ESSEmployeeTaskDetail = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const {recId} = route.params || {};
  const {width} = useWindowDimensions();

  const [isLoading, setIsLoading] = useState(false);
  const [taskDetail, setTaskDetail] = useState(null);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const [dueDateModalVisible, setDueDateModalVisible] = useState(false);
  const [newDueDate, setNewDueDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Format date function
  const formatDate = dateValue => {
    if (!dateValue) return '';
    const date = new Date(dateValue);
    if (isNaN(date)) return dateValue;
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

  // Back handler
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

  // Fetch task detail
  const fetchTaskDetail = useCallback(async () => {
    if (!recId) return;
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

  // Processed item
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

  // Date picker change
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const y = selectedDate.getFullYear();
      const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const d = String(selectedDate.getDate()).padStart(2, '0');
      setNewDueDate(`${y}-${m}-${d}`);
    }
  };

  // Update due date
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

  // Button config
  const getButtonConfig = () => {
    return {
      edit: {
        show: true,
        position: 'header',
        style: 'icon',
        icon: 'edit',
        iconSize: 20,
        iconColor: '#fff',
        backgroundColor: '#0A66C2',
        disabled: false,
      },
    };
  };

  const handleEditPress = () => {
    setNewDueDate(taskDetail?.dueDate || '');
    setDueDateModalVisible(true);
  };
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

          <Modal
            visible={dueDateModalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setDueDateModalVisible(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.label}>Select Date</Text>

                <Text
                  style={styles.dateInput}
                  onPress={() => setShowDatePicker(true)}>
                  {newDueDate ? formatDate(newDueDate) : 'Select Date'}
                </Text>

                {showDatePicker && (
                  <DateTimePicker
                    value={newDueDate ? new Date(newDueDate) : new Date()}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                  />
                )}

                <View style={styles.modalButtons}>
                  <Text onPress={() => setDueDateModalVisible(false)}>
                    Cancel
                  </Text>
                  <Text
                    style={{color: '#0A66C2'}}
                    onPress={handleUpdateDueDate}>
                    Save
                  </Text>
                </View>
              </View>
            </View>
          </Modal>

          {/* Alert */}
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

// const styles = StyleSheet.create({
//   loadingContainer: {flex: 1, justifyContent: 'center', alignItems: 'center'},
//   scrollContainer: {paddingVertical: 16, paddingHorizontal: 0},
//   instructionContainer: {
//     marginTop: 16,
//     padding: 12,
//     backgroundColor: '#fff',
//     borderRadius: 8,
//     marginHorizontal: 8,
//   },
//   instructionHeading: {fontSize: 16, fontWeight: 'bold', marginBottom: 6},
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   modalContainer: {
//     width: '85%',
//     backgroundColor: '#fff',
//     padding: 20,
//     borderRadius: 10,
//     elevation: 10,
//   },
//   dateInput: {
//     borderWidth: 1,
//     borderColor: '#ccc',
//     padding: 10,
//     borderRadius: 6,
//     marginTop: 5,
//   },
//   modalButtons: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginTop: 15,
//   },
// });

export default ESSEmployeeTaskDetail;
