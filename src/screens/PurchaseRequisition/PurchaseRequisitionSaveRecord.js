/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable curly */
/* eslint-disable react-native/no-inline-styles */
import React, {useState, useCallback, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  BackHandler,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/FontAwesome';
import {translate as t} from '../../store/utils/translate';

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
import usePalette from '../../hooks/usePalette';

const PurchaseRequisitionSaveRecord = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);
  const P = usePalette();

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [showRequiredDateCalendar, setShowRequiredDateCalendar] =
    useState(false);
  const [showTransDateCalendar, setShowTransDateCalendar] = useState(false);

  // Replace the existing formatDate function with this safer version
  const formatDate = date => {
    if (!date) return '';

    // If date is already a string in MM/DD/YYYY format, return it as-is
    if (typeof date === 'string' && date.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      return date;
    }

    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(
      d.getDate(),
    ).padStart(2, '0')}/${d.getFullYear()}`;
  };

  // PurchaseRequisitionSaveRecord.js - replace convertDateFormat
  const convertDateFormat = date => {
    const d = new Date(date);
    // Return only YYYY-MM-DD format without time
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Add a helper function to parse various date formats to YYYY-MM-DD
  const parseToISODate = dateValue => {
    if (!dateValue) return todayISO;

    // If it's already in YYYY-MM-DD format
    if (
      typeof dateValue === 'string' &&
      dateValue.match(/^\d{4}-\d{2}-\d{2}/)
    ) {
      return dateValue.split('T')[0];
    }

    // If it's in MM/DD/YYYY format (from display)
    if (
      typeof dateValue === 'string' &&
      dateValue.match(/^\d{2}\/\d{2}\/\d{4}$/)
    ) {
      const [month, day, year] = dateValue.split('/');
      return `${year}-${month}-${day}`;
    }

    // Try to parse as Date object or ISO string
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return todayISO;

    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Also update todayISO to just the date string
  const todayDate = new Date();
  const todayISO = `${todayDate.getFullYear()}-${String(
    todayDate.getMonth() + 1,
  ).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;

  const createInitialFormData = () => ({
    RecId: '',
    PurchReqId: '',
    PurchReqName: '',
    RequiredDate: todayISO, // now just YYYY-MM-DD
    TransDate: todayISO, // now just YYYY-MM-DD
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
    if (mode === 'edit' && purchaseRequisitiondata) {
      const requiredDateValue =
        purchaseRequisitiondata.RequiredDate || todayISO;
      const transDateValue = purchaseRequisitiondata.TransDate || todayISO;
      setFormData({
        ...purchaseRequisitiondata,
        RequiredDate: parseToISODate(requiredDateValue),
        TransDate: parseToISODate(transDateValue),
      });
    }
  }, [mode, purchaseRequisitiondata]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      },
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const clearFormData = () => setFormData(createInitialFormData());

  const handleInputChange = (field, value) =>
    setFormData(prev => ({...prev, [field]: value}));

  const handleRequiredDateChange = date => {
    setFormData(prev => ({...prev, RequiredDate: convertDateFormat(date)}));
    setShowRequiredDateCalendar(false);
  };

  const handleTransDateChange = date => {
    setFormData(prev => ({...prev, TransDate: convertDateFormat(date)}));
    setShowTransDateCalendar(false);
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

  const handleCreate = async actionType => {
    if (!validate()) return;
    setProcessingButton(actionType);
    setIsProcessing(true);

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
            ? 'Record saved successfully.'
            : 'Record updated successfully.',
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
        setAlertMessage(response.Message || 'Failed to save record.');
        setAlertModal(true);
      }
    } catch (err) {
      setAlertMessage('An error occurred while processing the request.');
      setAlertModal(true);
    } finally {
      setProcessingButton('');
      setIsProcessing(false);
    }
  };

  return (
    <ActionPaneContainer
      pageTitle="Create Purchase Requisition"
      isBackButton
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive
      showTabNavigator={!isKeyboardVisible}
      onBackPress={goBack}
      onRefresh={clearFormData}
      showPageTitleRow={true}>
      {isLoading ? (
        <CustomIndicator />
      ) : (
        <SafeAreaView style={styles.DSR_SafeArea}>
          {isProcessing && (
            <View style={styles.DSR_ProcessingOverlay}>
              <View style={styles.DSR_ProcessingContainer}>
                <ActivityIndicator size="large" color={P.primary} />
                <Text style={styles.DSR_ProcessingText}>
                  {t('common.processing')}
                </Text>
              </View>
            </View>
          )}
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.DSR_FormContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {/* FIELD 1 */}
            <Text style={styles.DSR_Label}>Purchase requisition</Text>
            <TextInput
              style={[
                styles.DSR_Input,
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
            <Text style={styles.DSR_Label}>Name *</Text>
            <TextInput
              style={styles.DSR_Input}
              value={formData.PurchReqName}
              onChangeText={text => handleInputChange('PurchReqName', text)}
              placeholder="Enter Name"
              placeholderTextColor="#888"
            />

            {/* FIELD 3 */}
            <Text style={styles.DSR_Label}>Requested Date</Text>
            <TouchableOpacity
              style={styles.DSR_DateSelector}
              onPress={() => setShowRequiredDateCalendar(true)}>
              <View style={{flex: 1}}>
                <Text style={styles.DSR_DateText}>
                  {formData.RequiredDate
                    ? formatDate(formData.RequiredDate)
                    : formatDate(new Date())}
                </Text>
              </View>
              <Icon name="calendar" size={20} color={P.primary} />
            </TouchableOpacity>

            {/* FIELD 4 */}
            <Text style={styles.DSR_Label}>Accounting Date</Text>
            <TouchableOpacity
              style={styles.DSR_DateSelector}
              onPress={() => setShowTransDateCalendar(true)}>
              <View style={{flex: 1}}>
                <Text style={styles.DSR_DateText}>
                  {formData.TransDate
                    ? formatDate(formData.TransDate)
                    : formatDate(new Date())}
                </Text>
              </View>
              <Icon name="calendar" size={20} color={P.primary} />
            </TouchableOpacity>
          </ScrollView>

          <SaveRecordButtons
            mode={mode}
            processingButton={processingButton}
            onSave={handleCreate}
            onCancel={goBack}
            isDisabled={
              processingButton === 'create' || processingButton === 'submit'
            }
            showButtons={[BUTTON_TYPES.CREATE, BUTTON_TYPES.CANCEL]}
          />
        </SafeAreaView>
      )}

      {/* Calendar Modals */}
      <CalendarModal
        visible={showRequiredDateCalendar}
        initialDate={formData.RequiredDate}
        onDateSelected={handleRequiredDateChange}
        onClose={() => setShowRequiredDateCalendar(false)}
      />

      <CalendarModal
        visible={showTransDateCalendar}
        initialDate={formData.TransDate}
        onDateSelected={handleTransDateChange}
        onClose={() => setShowTransDateCalendar(false)}
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

export default PurchaseRequisitionSaveRecord;
