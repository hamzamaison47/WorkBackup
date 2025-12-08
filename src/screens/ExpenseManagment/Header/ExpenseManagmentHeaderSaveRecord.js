/* eslint-disable curly */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, {useState, useCallback, useRef, useEffect} from 'react';
import {
  Text,
  KeyboardAvoidingView,
  ScrollView,
  SafeAreaView,
  BackHandler,
  Platform,
  Animated,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {Dropdown} from 'react-native-element-dropdown';

import {ExpenseLocationLookup} from '../../../API/ExpenseManagment/Headers/ExpenseLocationLookup';
import ExpensePurposeLookup from '../../../API/ExpenseManagment/Headers/ExpensePurposeLookup';
import {CreateExpenseReport} from '../../../API/ExpenseManagment/Headers/CreateExpenseReport';
import {UpdateExpenseReport} from '../../../API/ExpenseManagment/Headers/UpdateExpenseReport';

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

  const effectiveUserData = route.params?.userData || userData || {};
  const effectiveLegalEntity =
    route.params?.legalEntity ||
    selectedLegalEntity ||
    defaultLegalEntity ||
    effectiveUserData?.defaultLegalEntity ||
    '';

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

  // State Management
  const [locationOptions, setLocationOptions] = useState([]);
  const [purposeOptions, setPurposeOptions] = useState([]);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [processingButton, setProcessingButton] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [dataFetched, setDataFetched] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const createInitialFormData = () => ({
    recId: expenseData.recId || expenseData.RecId || '',
    employeeId: employeeId,
    employeeName: employeeName,
    WorkerRecId: WorkerRecId,
    legalEntity: effectiveLegalEntity,
    location: '',
    purpose: '',
    ExpenseReportNumber: '',
  });

  const [formData, setFormData] = useState(() => createInitialFormData());

  // Clear all states when component unmounts
  useEffect(() => {
    return () => {
      clearAllStates();
    };
  }, []);

  const goBack = useCallback(() => {
    clearAllStates();

    if (cameFrom === 'MainDashboard') {
      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'TabNavigator',
            params: {screen: 'MainDashboard'},
          },
        ],
      });
    } else if (cameFrom === 'ExpenseManagmentListPage') {
      const targetCameFrom = originalCameFrom || 'DisplayListPage';
      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'ExpenseManagmentListPage',
            params: {
              employeeId,
              employeeName,
              WorkerRecId,
              userData: {
                employeeId,
                employeeName,
                WorkerRecId,
              },
              cameFrom: targetCameFrom,
            },
          },
        ],
      });
    } else {
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

  const clearAllStates = useCallback(() => {
    setLocationOptions([]);
    setPurposeOptions([]);
    setDataFetched(false);
    setFormData(createInitialFormData());
    setAlertModal(false);
    setAlertMessage('');
    setProcessingButton('');
  }, []);

  const clearFormData = useCallback(() => {
    setFormData(createInitialFormData());
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
    }, [goBack]),
  );

  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({y: 0, animated: false});
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      const initializeData = async () => {
        setIsLoading(true);
        if (mode === 'create') {
          setFormData(createInitialFormData());
        } else if (mode === 'edit' && expenseData) {
          setFormData({
            recId: expenseData.recId || expenseData.RecId || '',
            employeeId: expenseData.employeeId || employeeId,
            employeeName: expenseData.employeeName || employeeName,
            WorkerRecId: expenseData.WorkerRecId || WorkerRecId,
            legalEntity: expenseData.legalEntity || effectiveLegalEntity,
            location: expenseData.location || '',
            purpose: expenseData.purpose || '',
            ExpenseReportNumber: expenseData.ExpenseReportNumber || '',
          });
        }

        setAlertModal(false);
        setAlertMessage('');
        setProcessingButton('');

        if (!dataFetched) {
          // setIsLoading(true);
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }).start();

          try {
            Promise.all([fetchLocationOptions(), fetchPurposeOptions()])
              .then(() => {
                setDataFetched(true);
                Animated.timing(fadeAnim, {
                  toValue: 1,
                  duration: 300,
                  useNativeDriver: true,
                }).start();
              })
              .catch(error => {
                console.error('Error fetching lookup data:', error);
              })
              .finally(() => {
                setIsLoading(false);
              });
          } catch (error) {
            console.error('Error initializing data:', error);
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }
      };

      initializeData();

      return () => {
        // Cleanup only what's necessary
      };
    }, [mode, dataFetched, expenseData]),
  );

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      setLocationOptions([]);
      setPurposeOptions([]);
      setDataFetched(false);
      clearFormData();

      await fetchLocationOptions(true);
      await fetchPurposeOptions(true);
      setDataFetched(true);
    } catch (error) {
      console.error('Error in Save Record Screen', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLocationOptions = async (forceRefresh = false) => {
    try {
      if (locationOptions.length > 0 && !forceRefresh) {
        return;
      }

      const locations = await ExpenseLocationLookup({
        legalEntity: effectiveLegalEntity,
      });

      const formatted = locations.map(loc => ({
        label: loc.location || 'Unknown Location',
        value: loc.location || '',
      }));

      setLocationOptions(formatted);
    } catch (error) {
      console.error('Error fetching locations:', error);
      setAlertMessage('Failed to fetch location options.');
      setAlertModal(true);
    }
  };

  const fetchPurposeOptions = async (forceRefresh = false) => {
    try {
      if (purposeOptions.length > 0 && !forceRefresh) {
        return;
      }

      const response = await ExpensePurposeLookup({
        legalEntity: effectiveLegalEntity,
      });

      const formatted = response.data.map(purp => ({
        label: purp.purpose || 'Unknown Purpose',
        value: purp.purpose || '',
      }));

      setPurposeOptions(formatted);
    } catch (error) {
      console.error('Error fetching purposes:', error);
      setAlertMessage('Failed to fetch purpose options.');
      setAlertModal(true);
    }
  };

  const handleLocationDropdownFocus = () => {
    if (locationOptions.length === 0 && !dataFetched) {
      fetchLocationOptions();
    }
  };

  const handlePurposeDropdownFocus = () => {
    if (purposeOptions.length === 0) {
      fetchPurposeOptions();
    }
  };

  const handleLocationChange = item => {
    setFormData(prev => ({...prev, location: item.value}));
  };

  const handlePurposeChange = item => {
    setFormData(prev => ({...prev, purpose: item.value}));
  };

  const handleAction = async (actionType, modalMode, data = {}) => {
    try {
      const expenseReportFields = [
        {
          FieldName: 'Purpose',
          FieldValue: data.purpose,
          FieldType: 'String',
        },
        {
          FieldName: 'Location',
          FieldValue: data.location,
          FieldType: 'String',
        },
      ];

      let response;

      if (modalMode === 'create') {
        response = await CreateExpenseReport({
          expenseReportFields,
          employeeId: data.employeeId || employeeId,
          legalEntity: data.legalEntity || effectiveLegalEntity,
        });
      } else {
        response = await UpdateExpenseReport({
          expenseReportFields,
          employeeId: data.employeeId || employeeId,
          legalEntity: effectiveLegalEntity,
          expenseReportNumber: data.ExpenseReportNumber,
        });
      }

      const isSuccess =
        response?.IsSuccess === true ||
        response?.IsSuccess === 'true' ||
        response?.AlertType === 'Success';

      if (isSuccess) {
        const actionText = modalMode === 'create' ? 'Created' : 'Updated';
        setAlertMessage(
          response?.Message || `Expense Report ${actionText} Successfully`,
        );
        setAlertModal(true);

        const recId = response?.RecId || response?.recId || data.recId || '';
        const expenseReportNumber =
          response?.ExpenseReportNumber || data.ExpenseReportNumber || '';

        return {
          success: true,
          recId: recId,
          RecId: recId,
          expenseReportNum: expenseReportNumber,
          ExpenseReportNumber: expenseReportNumber,
        };
      } else {
        const errorMessage =
          response?.Message ||
          `Error ${modalMode === 'create' ? 'Creating' : 'Updating'} Record`;
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
    if (processingButton) return;

    setProcessingButton(actionType);

    try {
      const result = await handleAction(
        actionType,
        mode === 'edit' ? 'update' : 'create',
        formData,
      );

      if (result.success) {
        if (mode === 'create') {
          setTimeout(() => {
            setAlertModal(false);
            clearAllStates();

            const RecId = result.recId || result.RecId;
            const ExpenseReportNumber =
              result.ExpenseReportNumber || result.expenseReportNum;

            navigation.navigate('ExpenseManagmentLinesSaveRecord', {
              mode: 'create',
              employeeId: formData.employeeId,
              employeeName: formData.employeeName,
              WorkerRecId: formData.WorkerRecId,
              userData: {
                employeeId: formData.employeeId,
                employeeName: formData.employeeName,
                WorkerRecId: formData.WorkerRecId,
              },
              legalEntity: formData.legalEntity,
              cameFrom: 'ExpenseManagementHeaderSaveRecord',
              originalCameFrom: originalCameFrom || cameFrom,
              expenseData: {
                recId: RecId,
                RecId: RecId,
                ExpenseReportNumber: ExpenseReportNumber, // Use raw value
                employeeId: formData.employeeId,
                employeeName: formData.employeeName,
                WorkerRecId: formData.WorkerRecId,
                legalEntity: formData.legalEntity,
              },
            });
          }, 1500);
        } else {
          setTimeout(() => {
            setAlertModal(false);
            clearAllStates();

            const targetCameFrom = originalCameFrom || cameFrom;

            navigation.reset({
              index: 0,
              routes: [
                {
                  name: 'ExpenseManagmentListPage',
                  params: {
                    employeeId: formData.employeeId,
                    employeeName: formData.employeeName,
                    WorkerRecId: formData.WorkerRecId,
                    userData: {
                      employeeId: formData.employeeId,
                      employeeName: formData.employeeName,
                      WorkerRecId: formData.WorkerRecId,
                    },
                    cameFrom: targetCameFrom,
                  },
                },
              ],
            });
          }, 1500);
        }
      }
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
        mode === 'edit' ? 'Update Expense Report' : 'Create Expense Report'
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
        <Animated.View style={{flex: 1, opacity: fadeAnim}}>
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
                <Text style={styles.LReqSR_Label}>Location</Text>
                <Dropdown
                  style={styles.LReqSR_Input}
                  data={locationOptions}
                  labelField="label"
                  valueField="value"
                  placeholder="Select Location"
                  value={formData.location}
                  onFocus={handleLocationDropdownFocus}
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

                <Text style={styles.LReqSR_Label}>Purpose</Text>
                <Dropdown
                  style={styles.LReqSR_Input}
                  data={purposeOptions}
                  labelField="label"
                  valueField="value"
                  placeholder="Select Purpose"
                  value={formData.purpose}
                  onFocus={handlePurposeDropdownFocus}
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
        </Animated.View>
      )}
    </ActionPaneContainer>
  );
};

export default ExpenseManagementHeaderSaveRecord;
