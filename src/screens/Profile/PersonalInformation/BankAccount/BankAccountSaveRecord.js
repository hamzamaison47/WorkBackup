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
  ActivityIndicator,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {Dropdown} from 'react-native-element-dropdown';
import Icon from 'react-native-vector-icons/FontAwesome';
import {translate as t} from '../../../../store/utils/translate';

import {createBankAccountRecord} from '../../../../API/PersonalInformation/BankAccounts/BankAccountCreate';
import {UpdateBankAccountRecord} from '../../../../API/PersonalInformation/BankAccounts/BankAccountUpdate';
import SubmitBankAccountRecord from '../../../../API/PersonalInformation/BankAccounts/BankAccountSubmit';

import AlertModal from '../../../../components/Alert/AlertModal';
import CustomIndicator from '../../../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../../../components/ActionPaneContainer';
import SaveRecordButtons from '../../../../components/Buttons/SaveRecordButtons';
import styles from '../../../../styles/styles';
import {GetBankAccountLabels} from '../../../../API/PersonalInformation/BankAccounts/GetBankAccountLabel';


const BankAccountSaveRecord = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);

  const isRTL = useSelector(state => state.language.isRTL);
  const userData = useSelector(state => state.user.userData);
  const routeUserData = route.params?.userData;
  const effectiveUserData = routeUserData || userData || {};
  const [BankAccountLabelData, setBankAccountLabelsData] = useState({});

  // Navigation params with safe defaults
  const {
    mode = 'create',
    bankaccountdata = {},
    employeeId = bankaccountdata.employeeId ||
      effectiveUserData?.employeeId ||
      '',
    employeeName = bankaccountdata.employeeName ||
      effectiveUserData?.employeeName ||
      '',
    WorkerRecId = bankaccountdata.WorkerRecId ||
      effectiveUserData?.WorkerRecId ||
      '',
    cameFrom = 'MainDashboard',
    originalCameFrom = null,
  } = route.params || {};

  // State declarations
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [processingButton, setProcessingButton] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Create initial form data function
  const createInitialFormData = () => ({
    recId:
      !bankaccountdata.recId || bankaccountdata.recId === '0'
        ? ''
        : bankaccountdata.recId,
    employeeId: employeeId,
    employeeName: employeeName,
    WorkerRecId: WorkerRecId,
    AccountHolder: '',
    AccountId: '',
    AccountNum: '',
    BankIBAN: '',
    BranchNumber: '',
    BranchName: '',
    Name: '',
  });

  // Form state - Initialize by calling the function
  const [formData, setFormData] = useState(() => createInitialFormData());

  const goBack = useCallback(() => {
    if (cameFrom === 'MainDashboard') {
      // Reset stack so only MainDashboard remains
      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'TabNavigator',
            params: {screen: 'MainDashboard'},
          },
        ],
      });
    } else if (cameFrom === 'BankAccountListPage') {
      // Reset stack so only PersonalEducationListPage remains
      const targetCameFrom = originalCameFrom || 'DisplayListPage';
      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'BankAccountListPage',
            params: {
              employeeId,
              employeeName,
              WorkerRecId,
              cameFrom: targetCameFrom,
            },
          },
        ],
      });
    } else {
      // Default: just go back one screen in the stack
      navigation.goBack();
    }
  }, [
    navigation,
    cameFrom,
    originalCameFrom,
    employeeId,
    employeeName,
    WorkerRecId,
  ]);

  // Function to clear form data
  const clearFormData = useCallback(() => {
    const clearedForm = createInitialFormData();
    setFormData(clearedForm);
  }, []);

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

  // Reset scroll position when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Scroll to top when screen comes into focus
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({y: 0, animated: false});
      }
    }, []),
  );

  // useFocusEffect(
  //   React.useCallback(() => {
  //     if (mode === 'create') {
  //       const freshFormData = createInitialFormData();
  //       setFormData(freshFormData);
  //     } else if (mode === 'edit' && bankaccountdata?.recId) {
  //       const editFormData = {
  //         ...createInitialFormData(),
  //         ...bankaccountdata,
  //         employeeId: bankaccountdata.employeeId || employeeId,
  //         employeeName: bankaccountdata.employeeName || employeeName,
  //         WorkerRecId: bankaccountdata.WorkerRecId || WorkerRecId,
  //       };
  //       setFormData(editFormData);
  //     }
  //   }, [
  //     mode,
  //     bankaccountdata?.recId,
  //     employeeId,
  //     employeeName,
  //     WorkerRecId,
  //     bankaccountdata,
  //   ]),
  // );
   const fetchGetBankAccountLabel = async () => {
  try {
    const labels = await GetBankAccountLabels();
    console.log('Labels fetched:', labels);
    return labels; // ✅ IMPORTANT
  } catch (error) {
    console.error('Error fetching Bank Account labels:', error);
    return {};
  }
};

 useFocusEffect(
  useCallback(() => {
    let isActive = true;

    const initializeForm = async () => {
      setIsLoading(true);

      try {
        // 🔹 Fetch labels FIRST
        const labels = await fetchGetBankAccountLabel();
        if (!isActive) return;

        setBankAccountLabelsData(labels || {});

        // 🔹 CREATE MODE
        if (mode === 'create') {
          setFormData(createInitialFormData());
          setAlertMessage('');
        }

        // 🔹 EDIT MODE
        else if (mode === 'edit' && bankaccountdata?.recId) {
          setFormData({
            ...createInitialFormData(),
            ...bankaccountdata,
            employeeId: bankaccountdata.employeeId || employeeId,
            employeeName: bankaccountdata.employeeName || employeeName,
            WorkerRecId: bankaccountdata.WorkerRecId || WorkerRecId,
          });
        }
      } catch (error) {
        console.error('Error initializing Bank Account form:', error);
        setAlertMessage('Failed to load bank account screen');
        setAlertModal(true);
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    initializeForm();

    return () => {
      isActive = false;
    };
  }, [mode, bankaccountdata?.recId, employeeId, employeeName, WorkerRecId]),
);




  const handleRefresh = async () => {
    setIsLoading(true);

    try {
      clearFormData();
    } catch (error) {
      console.error('Error in Save Record Screen', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validate = () => {
    const missing = [];
    if (!formData.AccountId) missing.push('Account identification');
    if (!formData.Name) missing.push('Name');
    if (!formData.AccountNum && !formData.BankIBAN)
      missing.push('Either Bank Account Number or IBAN must be filled');
    if (missing.length) {
      setAlertMessage(
        'Please fill in the following required fields:\n' + missing.join('\n'),
      );
      setAlertModal(true);
      return false;
    }
    return true;
  };
 


  const handleAction = async (actionType, modalMode, data = {}) => {
    try {
      const bankaccountsdata = {
        AccountHolder: data.AccountHolder,
        AccountId: data.AccountId,
        AccountNum: data.AccountNum,
        BranchNumber: data.BranchNumber,
        BranchName: data.BranchName,
        BankIBAN: data.BankIBAN,
        Name: data.Name,
        EmployeeId: data.employeeId,
        recId: data.recId === '' ? '0' : data.recId,
        Worker: data.WorkerRecId === '' ? '0' : data.WorkerRecId,
      };

      // let response;
      // if (modalMode === 'create') {
      //   response = await createBankAccountRecord({
      //     bankaccountdata: bankaccountsdata,
      //   });
      // }

      let response;
      if (modalMode === 'create') {
        response = await createBankAccountRecord({
          bankaccountdata: bankaccountsdata,
        });
        if (actionType === 'submit') {
          await SubmitBankAccountRecord({
            recId: response.RecId,
          });
        }
      } else {
        response = await UpdateBankAccountRecord({
          bankaccountdata: bankaccountsdata,
        });
        if (actionType === 'submit') {
          await SubmitBankAccountRecord({
            recId: response.RecId,
          });
        }
      }

      const isSuccess =
        response.IsSuccess === true || response.IsSuccess === 'true';

      if (isSuccess) {
        const actionText = modalMode === 'create' ? 'Created' : 'Updated';
        const submitText = actionType === 'submit' ? ' and Submitted' : '';
        setAlertModal(true);
        setAlertMessage(
          `${bankaccountsdata.AccountId} is ${actionText}${submitText} Successfully`,
        );
        return {success: true, recId: response.RecId};
      } else {
        const errorMessage = response.Message || 'Operation Failed';
        setAlertMessage(errorMessage);
        setAlertModal(true);
        return {success: false, message: errorMessage};
      }
    } catch (error) {
      console.error('Error in handleAction:', error);
      setAlertMessage('An error occurred while processing the request.');
      setAlertModal(true);
      return {success: false, message: 'Network or server error'};
    }
  };

  const handleSave = async actionType => {
    if (processingButton) return; // Prevent multiple clicks
    if (!validate()) return;

    const missing = [];
    if (!formData.AccountId) missing.push('AccountId');
    // Check if either AccountNum or BankIBAN is filled
    if (!formData.AccountNum && !formData.BankIBAN) {
      missing.push('Either Bank Account Number or IBAN');
    }
    if (missing.length) {
      setAlertMessage(
        'Please fill in the following required fields:\n' + missing.join('\n'),
      );
      setAlertModal(true);
      return false;
    }

    setProcessingButton(actionType);
    setIsProcessing(true);

    try {
      const result = await handleAction(
        actionType,
        mode === 'edit' ? 'update' : 'create',
        formData,
      );

      if (result.success) {
        // Clear form data after successful operation
        setTimeout(() => {
          setAlertModal(false);

          // Clear the form data
          clearFormData();

          // Navigate to BankAccountListPage after successful create/update
          navigation.navigate('BankAccountListPage', {
            employeeId: formData.employeeId,
            employeeName: formData.employeeName,
            WorkerRecId: formData.WorkerRecId,
            userData: route.params?.userData || {
              employeeId: formData.employeeId,
              employeeName: formData.employeeName,
              WorkerRecId: formData.WorkerRecId,
            },
            highlightRecId: result.recId,
            cameFrom: originalCameFrom || 'DisplayListPage',
          });
        }, 2000);
      }
    } catch (error) {
      console.error('Error saving bank account record:', error);
      setAlertMessage('Failed to save bank account record. Please try again.');
      setAlertModal(true);
    } finally {
      setProcessingButton('');
      setIsProcessing(false);
    }
  };

  return (
    <ActionPaneContainer
      pageTitle={
        mode === 'edit' ? 'Edit Bank Account Details' : 'Create Bank Account'
      }
      isBackButton={true}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      onBackPress={goBack}
      onRefresh={handleRefresh}
      onFloatingButtonPress={{}}>
      {/* Show loading indicator when isLoading is true */}
      {isLoading ? (
        <CustomIndicator />
      ) : (
        <SafeAreaView style={styles.LReqSR_SafeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.LReqSR_ContentWrapper}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
            {isProcessing && (
              <View style={styles.LReqSR_ProcessingOverlay}>
                <View style={styles.LReqSR_ProcessingContainer}>
                  <ActivityIndicator size="large" color="#0A66C2" />
                  <Text style={styles.LReqSR_ProcessingText}>
                    {t('common.processing')}
                  </Text>
                </View>
              </View>
            )}
            <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={[
                styles.LReqSR_FormContainer,
                // {paddingBottom: 20},
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}>
              {/* <Text style={styles.LReqSR_Label}>Account identification *</Text>
              <TextInput */}
               <Text style={[styles.LReqSR_Label, isRTL && {textAlign: 'left'}]}>
                {BankAccountLabelData?.AccountIdlbl || 'Account Identification'}
                </Text>
                <Text
                style={styles.LReqSR_Input}
                value={formData.AccountId}
                onChangeText={text => handleInputChange('AccountId', text)}
                // editable={mode === 'create'}
                placeholder="Enter Account ID"
                placeholderTextColor="#888"
                maxLength={10}
              />

            
                <Text style={[styles.LReqSR_Label, isRTL && {textAlign: 'left'}]}>
                {BankAccountLabelData?.Namelbl || 'Name'}
                </Text>
              <TextInput
                style={styles.LReqSR_Input}
                value={formData.Name}
                onChangeText={text => handleInputChange('Name', text)}
                // editable={mode === 'create'}
                placeholder="Enter Name"
                placeholderTextColor="#888"
              />

             
               <Text style={[styles.LReqSR_Label, isRTL && {textAlign: 'left'}]}>
                {BankAccountLabelData?.AccountNumlbl || 'Bank account number'}
                </Text>
              <TextInput
                style={styles.LReqSR_Input}
                value={formData.AccountNum}
                onChangeText={text => handleInputChange('AccountNum', text)}
                // editable={mode === 'create'}
                placeholder="Enter Account Number"
                placeholderTextColor="#888"
                keyboardType="numeric"
              />

            
               <Text style={[styles.LReqSR_Label, isRTL && {textAlign: 'left'}]}>
                {BankAccountLabelData?.BankIBANlbl || 'IBAN*'}
                </Text>
              <TextInput
                style={styles.LReqSR_Input}
                value={formData.BankIBAN}
                onChangeText={text => handleInputChange('BankIBAN', text)}
                // editable={mode === 'create'}
                placeholder="Enter IBAN"
                placeholderTextColor="#888"
              />

             
                <Text style={[styles.LReqSR_Label, isRTL && {textAlign: 'left'}]}>
                {BankAccountLabelData?.BranchNumberlbl || 'Branch number'}
                </Text>
              <TextInput
                style={styles.LReqSR_Input}
                value={formData.BranchNumber}
                onChangeText={text => handleInputChange('BranchNumber', text)}
                // editable={mode === 'create'}
                placeholder="Enter Branch number"
                placeholderTextColor="#888"
              />

             
                <Text style={[styles.LReqSR_Label, isRTL && {textAlign: 'left'}]}>
                {BankAccountLabelData?.BranchNamelbl || 'Branch name'}
                </Text>
              <TextInput
                style={styles.LReqSR_Input}
                value={formData.BranchName}
                onChangeText={text => handleInputChange('BranchName', text)}
                // editable={mode === 'create'}
                placeholder="Enter Branch name"
                placeholderTextColor="#888"
              />

              
              <Text style={[styles.LReqSR_Label, isRTL && {textAlign: 'left'}]}>
                {BankAccountLabelData?.AccountHolderlbl || 'Account Holder'}
                </Text>
              <TextInput
                style={styles.LReqSR_Input}
                value={formData.AccountHolder}
                onChangeText={text => handleInputChange('AccountHolder', text)}
                // editable={mode === 'create'}
                placeholder="Enter Account Title"
                placeholderTextColor="#888"
              />
            </ScrollView>

            <SaveRecordButtons
              mode={mode}
              processingButton={processingButton}
              onSave={handleSave}
              onCancel={goBack}
              isDisabled={
                processingButton === 'create' || processingButton === 'submit'
              }
            />
          </KeyboardAvoidingView>

          <AlertModal
            visible={alertModal}
            heading="Alert"
            text={alertMessage}
            onPress={() => {
              setAlertModal(false);
            }}
          />
        </SafeAreaView>
      )}
    </ActionPaneContainer>
  );
};

export default BankAccountSaveRecord;
