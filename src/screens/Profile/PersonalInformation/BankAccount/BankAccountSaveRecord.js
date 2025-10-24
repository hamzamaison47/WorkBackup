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
import {Dropdown} from 'react-native-element-dropdown';
import Icon from 'react-native-vector-icons/FontAwesome';

import {createBankAccountRecord} from '../../../../API/PersonalInformation/BankAccounts/BankAccountCreate';
import {UpdateBankAccountRecord} from '../../../../API/PersonalInformation/BankAccounts/BankAccountUpdate';

import AlertModal from '../../../../components/Alert/AlertModal';
import CustomIndicator from '../../../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../../../components/ActionPaneContainer';
import SaveRecordButtons from '../../../../components/Buttons/SaveRecordButtons';
import styles from '../../../../styles/styles';

const BankAccountSaveRecord = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);

  const userData = useSelector(state => state.user.userData);
  const routeUserData = route.params?.userData;
  const effectiveUserData = routeUserData || userData || {};

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

  useFocusEffect(
    React.useCallback(() => {
      if (mode === 'create') {
        const freshFormData = createInitialFormData();
        setFormData(freshFormData);
      } else if (mode === 'edit' && bankaccountdata?.recId) {
        const editFormData = {
          ...createInitialFormData(),
          ...bankaccountdata,
          employeeId: bankaccountdata.employeeId || employeeId,
          employeeName: bankaccountdata.employeeName || employeeName,
          WorkerRecId: bankaccountdata.WorkerRecId || WorkerRecId,
        };
        setFormData(editFormData);
      }
    }, [
      mode,
      bankaccountdata?.recId,
      employeeId,
      employeeName,
      WorkerRecId,
      bankaccountdata,
    ]),
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
        RecId: data.recId === '' ? '0' : data.recId,
        Worker: data.WorkerRecId === '' ? '0' : data.WorkerRecId,
      };

      let response;
      if (modalMode === 'create') {
        response = await createBankAccountRecord({
          bankaccountdata: bankaccountsdata,
        });
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

    const missing = [];
    if (!formData.AccountId) missing.push('AccountId');
    if (missing.length) {
      setAlertMessage(
        'Please fill in the following required fields:\n' + missing.join('\n'),
      );
      setAlertModal(true);
      return false;
    }

    setProcessingButton(actionType);

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

          console.log('result-0-00-0-0-0-0-0-0-0-0-', result);

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
            highlightRecId: formData.recId,
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
            <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={[
                styles.LReqSR_FormContainer,
                // {paddingBottom: 20},
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}>
              <Text style={styles.LReqSR_Label}>Account identification</Text>
              <TextInput
                style={styles.LReqSR_Input}
                value={formData.AccountId}
                onChangeText={text => handleInputChange('AccountId', text)}
                editable={mode === 'create'}
                placeholder="Enter Account ID"
              />

              <Text style={styles.LReqSR_Label}>Name</Text>
              <TextInput
                style={styles.LReqSR_Input}
                value={formData.Name}
                onChangeText={text => handleInputChange('Name', text)}
                editable={mode === 'create'}
                placeholder="Enter Name"
              />

              <Text style={styles.LReqSR_Label}>Bank account number</Text>
              <TextInput
                style={styles.LReqSR_Input}
                value={formData.AccountNum}
                onChangeText={text => handleInputChange('AccountNum', text)}
                editable={mode === 'create'}
                placeholder="Enter Account Number"
              />

              <Text style={styles.LReqSR_Label}>IBAN</Text>
              <TextInput
                style={styles.LReqSR_Input}
                value={formData.BankIBAN}
                onChangeText={text => handleInputChange('BankIBAN', text)}
                editable={mode === 'create'}
                placeholder="Enter IBAN"
              />

              <Text style={styles.LReqSR_Label}>Branch number</Text>
              <TextInput
                style={styles.LReqSR_Input}
                value={formData.BranchNumber}
                onChangeText={text => handleInputChange('BranchNumber', text)}
                editable={mode === 'create'}
                placeholder="Enter Branch number"
              />

              <Text style={styles.LReqSR_Label}>Branch name</Text>
              <TextInput
                style={styles.LReqSR_Input}
                value={formData.BranchName}
                onChangeText={text => handleInputChange('BranchName', text)}
                editable={mode === 'create'}
                placeholder="Enter Branch name"
              />

              <Text style={styles.LReqSR_Label}>Account Title</Text>
              <TextInput
                style={styles.LReqSR_Input}
                value={formData.AccountHolder}
                onChangeText={text => handleInputChange('AccountHolder', text)}
                editable={mode === 'create'}
                placeholder="Enter Account Title"
              />
            </ScrollView>

            <SaveRecordButtons
              mode={mode}
              processingButton={processingButton}
              onSave={handleSave}
              onCancel={goBack}
              isDisabled={
                processingButton === 'save' || processingButton === 'submit'
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
