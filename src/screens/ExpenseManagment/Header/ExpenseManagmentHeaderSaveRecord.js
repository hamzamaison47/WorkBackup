/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable curly */
/* eslint-disable react-native/no-inline-styles */
import React, {useState, useCallback, useRef} from 'react';
import {
  Text,
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

import {ExpenseLocationLookup} from '../../../API/ExpenseManagment/Headers/ExpenseLocationLookup';
import {ExpensePurposeLookup} from '../../../API/ExpenseManagment/Headers/ExpensePurposeLookup';

import AlertModal from '../../../components/Alert/AlertModal';
import CustomIndicator from '../../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../../components/ActionPaneContainer';
import SaveRecordButtons, {
  BUTTON_TYPES,
} from '../../../components/Buttons/SaveRecordButtons';
import styles from '../../../styles/styles';

const ExpenseManagementHeaderSaveRecord = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);

  const userData = useSelector(state => state.user.userData);
  const {selectedLegalEntity, defaultLegalEntity} = useSelector(
    state => state.company,
  );

  // Get effective user data and legal entity
  const effectiveUserData = route.params?.userData || userData || {};
  const effectiveLegalEntity =
    selectedLegalEntity ||
    defaultLegalEntity ||
    effectiveUserData?.defaultLegalEntity ||
    '';

  // Navigation params with safe defaults
  const {
    mode = 'create',
    expenseData = {},
    employeeId = expenseData.employeeId || effectiveUserData?.employeeId || '',
    employeeName = expenseData.employeeName ||
      effectiveUserData?.employeeName ||
      '',
    WorkerRecId = expenseData.WorkerRecId ||
      effectiveUserData?.WorkerRecId ||
      '',
    cameFrom = 'MainDashboard',
    originalCameFrom = null,
  } = route.params || {};

  // State declarations
  const [locationOptions, setLocationOptions] = useState([]);
  const [purposeOptions, setPurposeOptions] = useState([]);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [processingButton, setProcessingButton] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Create initial form data
  const createInitialFormData = () => ({
    recId:
      !expenseData.recId || expenseData.recId === '0' ? '' : expenseData.recId,
    employeeId: employeeId,
    employeeName: employeeName,
    WorkerRecId: WorkerRecId,
    legalEntity: effectiveLegalEntity,
    location: '',
    purpose: '',
    expenseDate: '',
    description: '',
  });

  const [formData, setFormData] = useState(() => createInitialFormData());

  const goBack = () => navigation.navigate('ExpenseManagmentListPage');

  const clearFormData = useCallback(() => {
    setFormData(createInitialFormData());
  }, []);

  // Back handler and scroll reset
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        goBack();
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [goBack]),
  );

  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({y: 0, animated: false});
    }, []),
  );

  // Initialize form data based on mode
  useFocusEffect(
    useCallback(() => {
      if (mode === 'create') {
        setFormData(createInitialFormData());
        fetchLocationOptions();
        fetchPurposeOptions();
      } else if (mode === 'edit' && expenseData?.recId) {
        setFormData({
          ...createInitialFormData(),
          ...expenseData,
          employeeId: expenseData.employeeId || employeeId,
          employeeName: expenseData.employeeName || employeeName,
          WorkerRecId: expenseData.WorkerRecId || WorkerRecId,
        });
        fetchLocationOptions();
        fetchPurposeOptions();
      }
    }, [mode, expenseData?.recId, employeeId, employeeName, WorkerRecId]),
  );

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      clearFormData();
      await fetchLocationOptions();
      await fetchPurposeOptions();
    } catch (error) {
      console.error('Error in Save Record Screen', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({...prev, [field]: value}));
  };

  const fetchLocationOptions = async () => {
    try {
      const locations = await ExpenseLocationLookup({
        legalEntity: effectiveLegalEntity,
      });

      const formatted = locations.map(loc => ({
        label: loc.Location || loc.location || 'Unknown Location',
        value: loc.Location || loc.location || '',
      }));

      setLocationOptions(formatted);
    } catch (error) {
      console.error('Error fetching locations:', error);
      setAlertMessage('Failed to fetch location options.');
      setAlertModal(true);
    }
  };

  const fetchPurposeOptions = async () => {
    try {
      const purposes = await ExpensePurposeLookup({
        legalEntity: effectiveLegalEntity,
      });

      const formatted = purposes.map(purp => ({
        label: purp.Purpose || purp.purpose || 'Unknown Purpose',
        value: purp.Purpose || purp.purpose || '',
      }));

      setPurposeOptions(formatted);
    } catch (error) {
      console.error('Error fetching purposes:', error);
      setAlertMessage('Failed to fetch purpose options.');
      setAlertModal(true);
    }
  };

  const handleLocationChange = item => {
    setFormData(prev => ({...prev, location: item.value}));
  };

  const handlePurposeChange = item => {
    setFormData(prev => ({...prev, purpose: item.value}));
  };

  const handleSave = async actionType => {
    if (processingButton) return;

    const missingFields = [];
    if (!formData.location) missingFields.push('Location');
    if (!formData.purpose) missingFields.push('Purpose');
    if (!formData.expenseDate) missingFields.push('Expense Date');

    if (missingFields.length > 0) {
      setAlertMessage(
        'Please fill in the following required fields:\n' +
          missingFields.join('\n'),
      );
      setAlertModal(true);
      return;
    }

    setProcessingButton(actionType);

    try {
      // Simulated API call
      setTimeout(() => {
        setAlertMessage('Expense saved successfully');
        setAlertModal(true);

        setTimeout(() => {
          setAlertModal(false);
          clearFormData();
          navigation.navigate('ExpenseManagementListPage', {
            employeeId: formData.employeeId,
            employeeName: formData.employeeName,
            WorkerRecId: formData.WorkerRecId,
            userData: route.params?.userData || {
              employeeId: formData.employeeId,
              employeeName: formData.employeeName,
              WorkerRecId: formData.WorkerRecId,
            },
            cameFrom: originalCameFrom || 'DisplayListPage',
          });
        }, 2000);
      }, 1000);
    } catch (error) {
      console.error('Error saving expense:', error);
      setAlertMessage('Failed to save expense. Please try again.');
      setAlertModal(true);
    } finally {
      setProcessingButton('');
    }
  };

  return (
    <ActionPaneContainer
      pageTitle={
        mode === 'edit' ? 'Edit Expense Report' : 'Create Expense Report'
      }
      isBackButton={true}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      onBackPress={goBack}
      onRefresh={handleRefresh}>
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
              contentContainerStyle={styles.LReqSR_FormContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}>
              <Text style={styles.LReqSR_Label}>Location *</Text>
              <Dropdown
                style={styles.LReqSR_Input}
                data={locationOptions}
                labelField="label"
                valueField="value"
                placeholder="Select Location"
                value={formData.location}
                onFocus={fetchLocationOptions}
                onChange={handleLocationChange}
                placeholderStyle={styles.LReqSR_DropdownPlaceholder}
                selectedTextStyle={styles.LReqSR_DropdownSelectedText}
                itemTextStyle={styles.LReqSR_DropdownItemText}
                activeColor="#E6F0FF"
                containerStyle={[
                  styles.LReqSR_DropdownContainer,
                  {
                    marginTop: Platform.OS === 'ios' ? 5 : 2,
                    zIndex: 1000,
                  },
                ]}
                itemContainerStyle={styles.LReqSR_DropdownItemContainer}
                maxHeight={280}
                dropdownPosition="auto"
                search
                searchPlaceholder="Search Location"
                inputSearchStyle={styles.LReqSR_DropdownSearchInput}
                iconStyle={styles.LReqSR_DropdownIcon}
                keyboardAvoiding={true}
              />

              <Text style={styles.LReqSR_Label}>Purpose *</Text>
              <Dropdown
                style={styles.LReqSR_Input}
                data={purposeOptions}
                labelField="label"
                valueField="value"
                placeholder="Select Purpose"
                value={formData.purpose}
                onFocus={fetchPurposeOptions}
                onChange={handlePurposeChange}
                placeholderStyle={styles.LReqSR_DropdownPlaceholder}
                selectedTextStyle={styles.LReqSR_DropdownSelectedText}
                itemTextStyle={styles.LReqSR_DropdownItemText}
                activeColor="#E6F0FF"
                containerStyle={[
                  styles.LReqSR_DropdownContainer,
                  {
                    marginTop: Platform.OS === 'ios' ? 5 : 2,
                    zIndex: 999,
                  },
                ]}
                itemContainerStyle={styles.LReqSR_DropdownItemContainer}
                maxHeight={280}
                dropdownPosition="auto"
                search
                searchPlaceholder="Search Purpose"
                inputSearchStyle={styles.LReqSR_DropdownSearchInput}
                iconStyle={styles.LReqSR_DropdownIcon}
                keyboardAvoiding={true}
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
              showButtons={[BUTTON_TYPES.CREATE, BUTTON_TYPES.CANCEL]}
            />
          </KeyboardAvoidingView>

          <AlertModal
            visible={alertModal}
            heading="Alert"
            text={alertMessage}
            onPress={() => setAlertModal(false)}
          />
        </SafeAreaView>
      )}
    </ActionPaneContainer>
  );
};

export default ExpenseManagementHeaderSaveRecord;
