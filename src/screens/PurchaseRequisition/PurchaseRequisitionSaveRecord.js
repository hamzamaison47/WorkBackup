/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable curly */
/* eslint-disable react-native/no-inline-styles */
import React, {useState, useCallback, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  SafeAreaView,
  BackHandler,
  Platform,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/FontAwesome';

import {createPurchaseRequisition} from '../../API/PurchaseRequisition/PurchaseRequisitionSaveRecord';
import {updatePurchaseRequisition} from '../../API/PurchaseRequisition/PurchaseRequisitionUpdateRecord';
import {retrievePurchId} from '../../API/PurchaseRequisition/PurchaseRequisitionRetrievePurchId';

import AlertModal from '../../components/Alert/AlertModal';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import CalendarModal from '../../components/Leaves/CalendarModal';
import styles from '../../styles/styles';
import SaveRecordButtons, {
  BUTTON_TYPES,
} from '../../components/Buttons/SaveRecordButtons';

const PurchaseRequisitionSaveRecord = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);

  const userData = useSelector(state => state.user.userData);
  const routeUserData = route.params?.userData;
  const effectiveUserData = routeUserData || userData || {};

  const {
    mode = 'create',
    purchaseRequisitiondata = {},
    employeeId = effectiveUserData?.employeeId || '',
    employeeName = effectiveUserData?.employeeName || '',
    WorkerRecId = effectiveUserData?.WorkerRecId || '',
  } = route.params || {};

  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [processingButton, setProcessingButton] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarField, setCalendarField] = useState('');

  const formatDate = date => {
    if (!date) return '';
    const d = new Date(date);
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(
      d.getDate(),
    ).padStart(2, '0')}/${d.getFullYear()}`;
  };

  const convertDateFormat = date => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(d.getDate()).padStart(2, '0')}T12:00:00`;
  };

  const todayISO = new Date().toISOString(); // Full ISO string
  const createInitialFormData = () => ({
    RecId: '',
    PurchReqId: '',
    PurchReqName: '',
    RequiredDate: convertDateFormat(todayISO), // default to today
    TransDate: convertDateFormat(todayISO), // default to today
    employeeId,
    employeeName,
    WorkerRecId,
  });

  const [formData, setFormData] = useState(() => createInitialFormData());

  const goBack = useCallback(() => {
    navigation.navigate('PurchaseRequisitionListPage', {
      employeeId,
      employeeName,
      WorkerRecId,
    });
  }, [navigation]);

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      setFormData(createInitialFormData());
      const data = await retrievePurchId();
      if (Array.isArray(data) && data.length > 0) {
        const firstRecord = data[0];
        setFormData(prev => ({
          ...createInitialFormData(),
          PurchReqId: firstRecord.PurchReqId || '',
        }));
      }
    } catch (error) {
      console.error('Error refreshing form:', error);
      setFormData(createInitialFormData());
    } finally {
      setIsLoading(false);
    }
  }, [employeeId, employeeName, WorkerRecId]);

  useFocusEffect(
    useCallback(() => {
      if (mode === 'create') handleRefresh();

      const onBackPress = () => {
        goBack();
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [mode, handleRefresh, goBack]),
  );

  useEffect(() => {
    const fetchPurchReqId = async () => {
      try {
        setIsLoading(true);
        const data = await retrievePurchId();
        if (Array.isArray(data) && data.length > 0) {
          const firstRecord = data[0];
          setFormData(prev => ({
            ...prev,
            PurchReqId: firstRecord.PurchReqId || '',
          }));
        }
      } catch (error) {
        console.error('Error retrieving PurchReqId:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (mode === 'create') fetchPurchReqId();
    if (mode === 'edit' && purchaseRequisitiondata)
      setFormData(purchaseRequisitiondata);
  }, [mode, purchaseRequisitiondata]);

  const clearFormData = () => setFormData(createInitialFormData());

  const handleInputChange = (field, value) =>
    setFormData(prev => ({...prev, [field]: value}));

  const handleDateChange = date => {
    setFormData(prev => ({...prev, [calendarField]: convertDateFormat(date)}));
    setShowCalendar(false);
  };

  const validate = () => {
    const missing = [];
    if (!formData.PurchReqId) missing.push('Purchase Requisition');
    if (!formData.PurchReqName) missing.push('Name');

    if (missing.length) {
      setAlertMessage(
        'Please fill in the following fields:\n' + missing.join('\n'),
      );
      setAlertModal(true);
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setProcessingButton('create');

    try {
      const payload = {
        PurchReqId: formData.PurchReqId,
        PurchReqName: formData.PurchReqName,
        RequiredDate: formData.RequiredDate,
        TransDate: formData.TransDate,
        Originator: employeeId,
        RecId: formData.RecId || '0',
        Worker: WorkerRecId,
      };

      console.log('Lets check recid for create', payload);

      let response;
      if (mode === 'create') {
        response = await createPurchaseRequisition({
          PurchaseRequisitiondata: payload,
        });
      } else {
        response = await updatePurchaseRequisition({
          PurchaseRequisitiondata: payload,
        });
      }

      if (response.IsSuccess) {
        setAlertMessage(
          mode === 'create'
            ? 'Purchase Requisition Created Successfully'
            : 'Purchase Requisition Updated Successfully',
        );
        setAlertModal(true);

        setTimeout(() => {
          setAlertModal(false);
          navigation.navigate('PurchaseRequisitionListPage', {
            employeeId,
            employeeName,
            WorkerRecId,
            highlightRecId: mode === 'create' ? response.RecId : formData.RecId, // ✅ fixed RecId reference
          });
        }, 1500);
      } else {
        setAlertMessage(response.Message || 'Operation failed');
        setAlertModal(true);
      }
    } catch (err) {
      setAlertMessage('Error processing requisition');
      setAlertModal(true);
    } finally {
      setProcessingButton('');
    }
  };

  return (
    <ActionPaneContainer
      pageTitle="Create Purchase Requisition"
      isBackButton
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive
      onBackPress={goBack}
      onRefresh={clearFormData}>
      {isLoading ? (
        <CustomIndicator />
      ) : (
        <SafeAreaView style={styles.LReqSR_SafeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.LReqSR_ContentWrapper}>
            <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={styles.LReqSR_FormContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              {/* FIELD 1 */}
              <Text style={styles.LReqSR_Label}>Purchase requisition</Text>
              <TextInput
                style={[
                  styles.LReqSR_Input,
                  {backgroundColor: '#f5f5f5', color: '#888'},
                ]}
                value={formData.PurchReqId}
                onChangeText={text => handleInputChange('PurchReqId', text)}
                placeholder="Enter Requisition No"
                placeholderTextColor="#888"
                editable={false}
                selectTextOnFocus={false}
              />

              {/* FIELD 2 */}
              <Text style={styles.LReqSR_Label}>Name *</Text>
              <TextInput
                style={styles.LReqSR_Input}
                value={formData.PurchReqName}
                onChangeText={text => handleInputChange('PurchReqName', text)}
                placeholder="Enter Name"
                placeholderTextColor="#888"
              />

              {/* FIELD 3 */}
              <Text style={styles.LReqSR_Label}>Requested Date</Text>
              <TouchableOpacity
                style={styles.LReqSR_DateSelector}
                onPress={() => {
                  setCalendarField('RequiredDate');
                  setShowCalendar(true);
                }}>
                <View style={{flex: 1}}>
                  <Text style={styles.LReqSR_DateText}>
                    {formData.RequiredDate
                      ? formatDate(formData.RequiredDate)
                      : formatDate(new Date())}
                  </Text>
                </View>
                <Icon name="calendar" size={20} color="#0A66C2" />
              </TouchableOpacity>

              {/* FIELD 4 */}
              <Text style={styles.LReqSR_Label}>Accounting Date</Text>
              <TouchableOpacity
                style={styles.LReqSR_DateSelector}
                onPress={() => {
                  setCalendarField('TransDate');
                  setShowCalendar(true);
                }}>
                <View style={{flex: 1}}>
                  <Text style={styles.LReqSR_DateText}>
                    {formData.TransDate
                      ? formatDate(formData.TransDate)
                      : formatDate(new Date())}
                  </Text>
                </View>
                <Icon name="calendar" size={20} color="#0A66C2" />
              </TouchableOpacity>
            </ScrollView>

            <SaveRecordButtons
              mode={mode}
              processingButton={processingButton}
              onSave={handleCreate}
              onCancel={goBack}
              isDisabled={
                processingButton === 'save' || processingButton === 'submit'
              }
              showButtons={[BUTTON_TYPES.CREATE, BUTTON_TYPES.CANCEL]}
            />

            <AlertModal
              visible={alertModal}
              heading="Alert"
              text={alertMessage}
              onPress={() => setAlertModal(false)}
            />
          </KeyboardAvoidingView>

          <CalendarModal
            visible={showCalendar}
            current={formData[calendarField]}
            onDateSelected={handleDateChange}
            onClose={() => setShowCalendar(false)}
          />
        </SafeAreaView>
      )}
    </ActionPaneContainer>
  );
};

export default PurchaseRequisitionSaveRecord;
