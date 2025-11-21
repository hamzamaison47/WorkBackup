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
import {retrievePurchId} from '../../API/PurchaseRequisition/PurchaseRequisitionRetrievePurchId';

import AlertModal from '../../components/Alert/AlertModal';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import CalendarModal from '../../components/Leaves/CalendarModal';
import styles from '../../styles/styles';

const PurchaseRequisitionSaveRecord = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);

  const userData = useSelector(state => state.user.userData);
  const routeUserData = route.params?.userData;
  const effectiveUserData = routeUserData || userData || {};

  const {
    mode = 'create',
    PurchaseRequisitiondata = {},
    employeeId = effectiveUserData?.employeeId || '',
    employeeName = effectiveUserData?.employeeName || '',
    WorkerRecId = effectiveUserData?.WorkerRecId || '',
    cameFrom = 'MainDashboard',
    originalCameFrom = null,
  } = route.params || {};

  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [processingButton, setProcessingButton] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarField, setCalendarField] = useState('');

  // Only 4 Required Fields
  const createInitialFormData = () => ({
    recId: '',
    PurchReqId: '',
    PurchReqName: '',
    RequiredDate: '',
    TransDate: '',
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
      // Clear existing form data
      setFormData(createInitialFormData());

      // Fetch new PurchReqId
      const data = await retrievePurchId();
      if (Array.isArray(data) && data.length > 0) {
        const firstRecord = data[0];
        setFormData(prev => ({
          ...createInitialFormData(), // Start with fresh form
          PurchReqId: firstRecord.PurchReqId || '', // auto-populate only PurchReqId
        }));
      } else {
        console.warn('No PurchReqId returned from service');
        setFormData(createInitialFormData());
      }
    } catch (error) {
      console.error('Error refreshing form:', error);
      setFormData(createInitialFormData());
    } finally {
      setIsLoading(false);
    }
  }, [employeeId, employeeName, WorkerRecId]);

  // Refresh form every time screen comes into focus
  useFocusEffect(
    useCallback(() => {
      handleRefresh();

      const onBackPress = () => {
        goBack();
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => {
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
      };
    }, [handleRefresh, goBack]),
  );

  useEffect(() => {
    const fetchPurchReqId = async () => {
      try {
        setIsLoading(true);

        const data = await retrievePurchId(); // returns array
        if (Array.isArray(data) && data.length > 0) {
          const firstRecord = data[0];
          setFormData(prev => ({
            ...prev,
            PurchReqId: firstRecord.PurchReqId || '', // auto-populate
          }));
        } else {
          console.warn('No PurchReqId returned from service');
        }
      } catch (error) {
        console.error('Error retrieving PurchReqId:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPurchReqId();
  }, []);

  const clearFormData = () => setFormData(createInitialFormData());

  /* ---------- helpers ---------- */
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

  /* ---------- input ---------- */
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
        recId: '0',
        Worker: WorkerRecId,
      };
      console.log('Here we gooooodeodo', payload);

      const response = await createPurchaseRequisition({
        PurchaseRequisitiondata: payload,
      });

      if (response.IsSuccess) {
        setAlertMessage('Purchase Requisition Created Successfully');
        setAlertModal(true);

        setTimeout(() => {
          setAlertModal(false);

          navigation.navigate('PurchaseRequisitionListPage', {
            employeeId,
            employeeName,
            WorkerRecId,
            highlightRecId: response.RecId,
          });
        }, 1500);
      } else {
        setAlertMessage(response.Message || 'Creation failed');
        setAlertModal(true);
      }
    } catch (err) {
      setAlertMessage('Error creating requisition');
      setAlertModal(true);
    } finally {
      setProcessingButton('');
    }
  };

  return (
    <ActionPaneContainer
      pageTitle="Create Purchase Requisition"
      isBackButton={true}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
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
                  {backgroundColor: '#f5f5f5', color: '#888'}, // Direct grayed out styles
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
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                margin: 20,
              }}>
              {/* OK BUTTON (LEFT SIDE) */}
              <TouchableOpacity
                onPress={handleCreate}
                disabled={processingButton === 'create'}
                style={{
                  backgroundColor: '#0275d8',
                  paddingVertical: 12,
                  paddingHorizontal: 25,
                  borderRadius: 8,
                  opacity: processingButton === 'create' ? 0.7 : 1,
                }}>
                <Text style={{color: '#fff', fontSize: 16, fontWeight: 'bold'}}>
                  {processingButton === 'create' ? 'Please Wait...' : 'OK'}
                </Text>
              </TouchableOpacity>

              {/* CANCEL BUTTON (RIGHT SIDE) */}
              <TouchableOpacity
                onPress={goBack}
                style={{
                  backgroundColor: '#fff',
                  paddingVertical: 12,
                  paddingHorizontal: 25,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#170a09ff',
                }}>
                <Text style={{color: '#000', fontSize: 16, fontWeight: 'bold'}}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
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
