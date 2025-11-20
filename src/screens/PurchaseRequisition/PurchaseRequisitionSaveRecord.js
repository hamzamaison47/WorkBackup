/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable curly */
/* eslint-disable react-native/no-inline-styles */
import React, {useState, useCallback, useRef} from 'react';
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

import {createPurchaseRequisition} from '../../API/PurchaseRequisition/PurchaseRequisitionSaveRecord';

import AlertModal from '../../components/Alert/AlertModal';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../components/ActionPaneContainer';
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

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        goBack();
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [navigation]),
  );

  const clearFormData = () => setFormData(createInitialFormData());

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validate = () => {
    const missing = [];
    if (!formData.PurchReqId) missing.push('Purchase Requisition');
    if (!formData.PurchReqName) missing.push('Name');
    if (!formData.RequiredDate) missing.push('Requested Date');
    if (!formData.TransDate) missing.push('Accounting Date');

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
        EmployeeId: employeeId,
        recId: '0',
        Worker: WorkerRecId,
      };

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
              <Text style={styles.LReqSR_Label}>Purchase Requisition *</Text>
              <TextInput
                style={styles.LReqSR_Input}
                value={formData.PurchReqId}
                onChangeText={text => handleInputChange('PurchReqId', text)}
                placeholder="Enter Requisition No"
                placeholderTextColor="#888"
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
              <TextInput
                style={styles.LReqSR_Input}
                value={formData.RequiredDate}
                onChangeText={text => handleInputChange('RequiredDate', text)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#888"
              />

              {/* FIELD 4 */}
              <Text style={styles.LReqSR_Label}>Accounting Date</Text>
              <TextInput
                style={styles.LReqSR_Input}
                value={formData.TransDate}
                onChangeText={text => handleInputChange('TransDate', text)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#888"
              />
            </ScrollView>

            {/* ONLY TWO BUTTONS */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                margin: 20,
              }}>
              <TouchableOpacity onPress={goBack} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCreate}
                disabled={processingButton === 'create'}
                style={styles.saveButton}>
                <Text style={styles.saveButtonText}>
                  {processingButton === 'create' ? 'Creating...' : 'Create'}
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
        </SafeAreaView>
      )}
    </ActionPaneContainer>
  );
};

export default PurchaseRequisitionSaveRecord;
