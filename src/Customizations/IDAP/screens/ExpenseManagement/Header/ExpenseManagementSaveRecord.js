// export default ExpenseManagementSaveRecord;
/* eslint-disable curly */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
// Create/Edit screen for an Expense Management header.
//
// EDIT MODE NOTE: the header list's `find` call
// (expenseManagementHeaderbuffertoContract) must populate DateFrom/DateTo/
// MapToTravelRequisition on the contract for those fields to prefill here —
// see the X++ addition discussed alongside this change. Until that ships,
// this screen will still work, but those three fields open blank in edit
// mode even if a value is already saved on the record.
//
// Edit is only reachable for Draft/Create-status records — see the
// `disabled: !isDraft` gate on the Edit icon in
// ExpenseManagementHeaderListPage.getButtonConfig(), same pattern used for
// GenericAdvanceListScreen's loan/advance edit button.
import React, {useState, useCallback, useRef, useEffect} from 'react';
import {
  Text,
  View,
  TextInput,
  ScrollView,
  SafeAreaView,
  BackHandler,
  Platform,
  Animated,
  ActivityIndicator,
  Keyboard,
  TouchableOpacity,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {Dropdown} from 'react-native-element-dropdown';
import Icon from 'react-native-vector-icons/FontAwesome';
import {translate as t} from '../../../../../store/utils/translate';

import {CreateExpenseManagementHeader} from '../../../API/ExpenseManagement/Header/CreateExpenseManagementHeader';
import {UpdateExpenseManagementHeader} from '../../../API/ExpenseManagement/Header/UpdateExpenseManagementHeader';
import {RetrieveMapTravelRequisitions} from '../../../API/ExpenseManagement/Header/RetrieveMapTravelRequisitions';

import AlertModal from '../../../../../components/Alert/AlertModal';
import useAlertModal from '../../../../../hooks/useAlertModal';
import CalendarModal from '../../../../../components/Leaves/CalendarModal';
import CustomIndicator from '../../../../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../../../../components/ActionPaneContainer';
import SaveRecordButtons, {
  BUTTON_TYPES,
} from '../../../../../components/Buttons/SaveRecordButtons';
import {AppTokens} from '../../../../../components/AppComponentsDesign/Tokens';
// import styles from '../../../../../styles/styles';
import useAppStyles from '../../../../../hooks/useAppStyles';
import useNotify from '../../../../../hooks/useNotify';
import usePalette from '../../../../../hooks/usePalette';

const ROUTE_LINES_LIST = 'ExpenseManagementLinesListPage';
const ROUTE_HEADER_LIST = 'ExpenseManagementHeaderListPage';

const ExpenseManagementSaveRecord = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);
  const P = usePalette();
  const styles = useAppStyles();

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
    headerData = {},
    employeeId = effectiveUserData?.employeeId || '',
    employeeName = effectiveUserData?.employeeName || '',
    WorkerRecId = effectiveUserData?.WorkerRecId || '',
    cameFrom = ROUTE_HEADER_LIST,
    originalCameFrom = null,
  } = route.params || {};

  const isEditMode = mode === 'edit';

  // employeeId IS the D365 HcmWorker personnel number — same assumption the
  // header find (GetAllExpenseManagementHeaders) is built on.
  const personnelNumber = route.params?.personnelNumber || employeeId;

  const [mapTrvOptions, setMapTrvOptions] = useState([]);
  const {showSuccess, showError, showWarning, hide, alertModalProps} =
    useAlertModal();
  const [processingButton, setProcessingButton] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dataFetched, setDataFetched] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  // Which date field the calendar is editing: 'DateFrom' | 'DateTo' | null
  const [calendarField, setCalendarField] = useState(null);
  const [errors, setErrors] = useState({});
  const {notifySuccess, notifyError} = useNotify('Expense Management');

  // D365 "null date" sentinel — TrvDateFrom/TrvDateTo default to the EDT's
  // minimum value (observed as 1/1/1900) when nothing has actually been saved
  // on the record. The mobile app must NOT treat this as a real selected date:
  // showing "1/1/1900" is misleading, and handing it to CalendarModal as
  // initialDate crashes the picker (its year range doesn't extend that far
  // back). Anything before this cutoff is treated as "field is empty."
  const MIN_VALID_YEAR = 1950;
  const isSentinelOrInvalidDate = value => {
    if (!value) return true;
    const d = new Date(value);
    if (isNaN(d.getTime())) return true;
    return d.getFullYear() < MIN_VALID_YEAR;
  };

  const today = new Date().toISOString().split('T')[0] + 'T12:00:00';

  // Normalizes whatever shape the header list card / find response hands us
  // (HeaderRecId vs RecId vs recId — same ambiguity normalizeRecId() on the
  // list page deals with).
  const normalizeHeaderRecId = data =>
    data?.HeaderRecId || data?.recId || data?.RecId || '';

  const createInitialFormData = useCallback(() => {
    if (isEditMode) {
      return {
        HeaderRecId: normalizeHeaderRecId(headerData),
        employeeId,
        employeeName,
        WorkerRecId,
        legalEntity: effectiveLegalEntity,
        Location: headerData.Location || '',
        DateFrom: isSentinelOrInvalidDate(headerData.DateFrom)
          ? ''
          : headerData.DateFrom,
        DateTo: isSentinelOrInvalidDate(headerData.DateTo)
          ? ''
          : headerData.DateTo,
        MapToTravelRequisition: headerData.MapToTravelRequisition || '',
        RequisitionNumber: headerData.RequisitionNumber || '',
        TravelRequisitionAmount: headerData.TravelRequisitionAmount || '',
      };
    }
    return {
      employeeId,
      employeeName,
      WorkerRecId,
      legalEntity: effectiveLegalEntity,
      Location: '',
      DateFrom: '',
      DateTo: '',
      MapToTravelRequisition: '',
      RequisitionNumber: '',
      TravelRequisitionAmount: '',
    };
  }, [
    isEditMode,
    headerData,
    employeeId,
    employeeName,
    WorkerRecId,
    effectiveLegalEntity,
  ]);

  const [formData, setFormData] = useState(() => createInitialFormData());

  const clearAllStates = useCallback(() => {
    setMapTrvOptions([]);
    setDataFetched(false);
    setFormData(createInitialFormData());
    setErrors({});
    hide();
    setProcessingButton('');
  }, [createInitialFormData]);

  useEffect(() => {
    return () => {
      clearAllStates();
    };
  }, []);

  const goBack = useCallback(() => {
    clearAllStates();

    navigation.reset({
      index: 0,
      routes: [
        {
          name: ROUTE_HEADER_LIST,
          params: {
            employeeId,
            employeeName,
            WorkerRecId,
            userData: {
              employeeId,
              employeeName,
              WorkerRecId,
            },
            cameFrom: originalCameFrom || 'DrawerNavigator',
          },
        },
      ],
    });
  }, [navigation, originalCameFrom, employeeId, employeeName, WorkerRecId]);

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

  const fetchMapTravelRequisitions = async (forceRefresh = false) => {
    try {
      if (mapTrvOptions.length > 0 && !forceRefresh) return;

      const rows = await RetrieveMapTravelRequisitions({
        employeeId,
        workerRecId: WorkerRecId,
      });

      const formatted = (rows || []).filter(
        option => option.label && option.value,
      );

      console.log(
        '[ExpMgmt MAPTRV] dropdown options:',
        JSON.stringify(formatted.map(o => o.label)),
      );

      setMapTrvOptions(formatted);
    } catch (error) {
      console.error('[ExpMgmt MAPTRV] failed to fetch:', error);
      // A failed lookup must not block the form — the field is optional.
      setMapTrvOptions([]);
    }
  };

  // Edit mode: the header `find` contract doesn't return TravelRequisitionAmount,
  // so the field opens blank. Once the lookup rows land, resolve the amount from
  // the option matching the saved RequisitionNumber.
  useEffect(() => {
    if (!isEditMode) return;
    if (mapTrvOptions.length === 0) return;
    if (!formData.RequisitionNumber) return;
    if (formData.TravelRequisitionAmount) return; // already resolved

    const match = mapTrvOptions.find(
      o =>
        String(o.requisitionNumber) === String(formData.RequisitionNumber) ||
        String(o.value) === String(formData.RequisitionNumber),
    );
    if (!match) return;

    setFormData(prev => ({
      ...prev,
      TravelRequisitionAmount: match.travelRequisitionAmount || '',
      MapToTravelRequisition:
        prev.MapToTravelRequisition || match.mapToTravelRequisition || '',
    }));
  }, [
    isEditMode,
    mapTrvOptions,
    formData.RequisitionNumber,
    formData.TravelRequisitionAmount,
  ]);

  useFocusEffect(
    useCallback(() => {
      const initializeData = async () => {
        setIsLoading(true);
        setFormData(createInitialFormData());
        setErrors({});
        hide();
        setProcessingButton('');

        if (!dataFetched) {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }).start();

          try {
            await fetchMapTravelRequisitions();
            setDataFetched(true);
          } catch (error) {
            console.error('Error fetching lookup data:', error);
          } finally {
            setIsLoading(false);
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }).start();
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
    }, [dataFetched]),
  );

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true),
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false),
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      setMapTrvOptions([]);
      setDataFetched(false);
      setFormData(createInitialFormData());
      setErrors({});
      await fetchMapTravelRequisitions(true);
      setDataFetched(true);
    } catch (error) {
      console.error('Error refreshing expense header form:', error);
    } finally {
      setIsLoading(false);
    }
  }, [employeeId, WorkerRecId]);

  const clearFieldError = field =>
    setErrors(prev => {
      if (!prev[field]) return prev;
      const next = {...prev};
      delete next[field];
      return next;
    });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({...prev, [field]: value}));
    clearFieldError(field);
  };

  const formatDate = date => {
    if (!date || isSentinelOrInvalidDate(date)) return '';
    const d = new Date(date);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  const formatToISOWithTime = dateInput => {
    let year;
    let month;
    let day;
    if (typeof dateInput === 'string') {
      const datePart = dateInput.split('T')[0];
      [year, month, day] = datePart.split('-').map(Number);
    } else {
      year = dateInput.getFullYear();
      month = dateInput.getMonth() + 1;
      day = dateInput.getDate();
    }
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(
      2,
      '0',
    )}T12:00:00`;
  };

  const handleDateChange = date => {
    const formatted = formatToISOWithTime(date);
    setFormData(prev => ({...prev, [calendarField]: formatted}));
    clearFieldError(calendarField);
    setCalendarField(null);
  };

  const handleMapTrvChange = item => {
    setFormData(prev => ({
      ...prev,
      MapToTravelRequisition: item.mapToTravelRequisition || '',
      RequisitionNumber: item.requisitionNumber || item.value || '',
      TravelRequisitionAmount: item.travelRequisitionAmount || '',
    }));
    clearFieldError('MapToTravelRequisition');
  };

  // Required set, per the backend gate `if (_personnelNumber && contract.parmLocation())`
  // on create, and unconditional field assignment on update — LOCATION IS THE
  // ONLY FIELD THE BACKEND STRICTLY REQUIRES, same as create.
  //
  // Dates required here BY THE UI ONLY, same rationale as create mode.
  const validate = () => {
    const nextErrors = {};
    const missing = [];
    const dateIssues = []; // collects order + future-date problems together

    if (!formData.Location?.trim()) {
      nextErrors.Location = 'Location is required';
      missing.push('Location');
    }
    if (!formData.DateFrom) {
      nextErrors.DateFrom = 'Date from is required';
      missing.push('Date from');
    }
    if (!formData.DateTo) {
      nextErrors.DateTo = 'Date to is required';
      missing.push('Date to');
    }

    if (formData.DateFrom && formData.DateTo) {
      const from = new Date(formData.DateFrom);
      const to = new Date(formData.DateTo);
      if (to.getTime() < from.getTime()) {
        nextErrors.DateTo = 'Date to cannot be earlier than Date from';
        dateIssues.push(nextErrors.DateTo);
      }
    }

    // Edit-mode-only: neither date may be in the future relative to today.
    // Compared at day granularity (not exact timestamp) since DateFrom/DateTo
    // are stored at T12:00:00 while "now" carries the current time-of-day —
    // without normalizing both to midnight, editing a record TO today's date
    // would incorrectly fail after noon. Both fields are checked independently
    // so the warning can list every offending field, not just the last one set.
    if (isEditMode) {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      let fromIsFuture = false;
      let toIsFuture = false;

      if (formData.DateFrom) {
        const from = new Date(formData.DateFrom);
        from.setHours(0, 0, 0, 0);
        fromIsFuture = from.getTime() > startOfToday.getTime();
      }
      if (formData.DateTo) {
        const to = new Date(formData.DateTo);
        to.setHours(0, 0, 0, 0);
        toIsFuture = to.getTime() > startOfToday.getTime();
      }

      // Single consolidated message covering either/both fields, rather than
      // one line per field.
      if (fromIsFuture || toIsFuture) {
        const futureDateMsg =
          'To date and from date cannot be greater than current date';
        if (fromIsFuture) nextErrors.DateFrom = futureDateMsg;
        if (toIsFuture) nextErrors.DateTo = futureDateMsg;
        dateIssues.push(futureDateMsg);
      }
    }

    setErrors(nextErrors);
    return {
      valid: Object.keys(nextErrors).length === 0,
      missing,
      dateIssues,
    };
  };

  const handleAction = async (actionType, data = {}) => {
    try {
      const response = isEditMode
        ? await UpdateExpenseManagementHeader({
            headerRecId: data.HeaderRecId,
            Location: data.Location,
            DateFrom: data.DateFrom,
            DateTo: data.DateTo,
            MapToTravelRequisition: data.MapToTravelRequisition,
            RequisitionNumber: data.RequisitionNumber,
          })
        : await CreateExpenseManagementHeader({
            personnelNumber,
            Location: data.Location,
            DateFrom: data.DateFrom,
            DateTo: data.DateTo,
            MapToTravelRequisition: data.MapToTravelRequisition,
            RequisitionNumber: data.RequisitionNumber,
          });

      if (response?.IsSuccess) {
        const successMsg =
          response?.Message ||
          (isEditMode
            ? 'Record updated successfully'
            : 'Record created successfully');
        notifySuccess(successMsg);
        showSuccess(successMsg);
        return {
          success: true,
          recId: response?.RecId || data.HeaderRecId || '',
        };
      }

      const errorMessage =
        response?.Message ||
        (isEditMode ? 'Error updating Record' : 'Error creating Record');
      notifyError(errorMessage);
      showError(errorMessage);
      return {success: false, message: errorMessage};
    } catch (error) {
      console.error('Error in handleAction:', error);
      showError('An error occurred while processing the request.');
      return {success: false, message: 'Network or server error'};
    }
  };

  const handleSave = async actionType => {
    if (processingButton) return;

    const {valid, missing, dateIssues} = validate();
    if (!valid) {
      const lines = [];
      if (missing.length > 0) {
        lines.push('Please fill in the following required fields:');
        lines.push(...missing);
      }
      if (dateIssues.length > 0) {
        if (lines.length > 0) lines.push('');
        lines.push(...dateIssues);
      }
      showWarning(
        lines.length > 0
          ? lines.join('\n')
          : 'Please correct the highlighted fields before saving.',
      );
      return;
    }

    setProcessingButton(actionType);
    setIsProcessing(true);

    try {
      const result = await handleAction(actionType, formData);

      if (result.success) {
        const savedForm = formData;

        // Keep the button disabled / overlay up through this delay — clearing
        // processingButton here would let a second tap fire another
        // create/update against the same data before navigation actually
        // happens.
        setTimeout(() => {
          hide();
          clearAllStates();

          navigation.reset({
            index: 0,
            routes: [
              {
                name: ROUTE_HEADER_LIST,
                params: {
                  employeeId: savedForm.employeeId,
                  employeeName: savedForm.employeeName,
                  WorkerRecId: savedForm.WorkerRecId,
                  userData: {
                    employeeId: savedForm.employeeId,
                    employeeName: savedForm.employeeName,
                    WorkerRecId: savedForm.WorkerRecId,
                  },
                  cameFrom: originalCameFrom || 'DrawerNavigator',
                },
              },
            ],
          });
        }, 1500);
        return;
      }
    } catch (error) {
      console.error('Error saving expense header:', error);
      showError('Failed to save record. Please try again.');
    } finally {
      setProcessingButton('');
      setIsProcessing(false);
    }
  };

  const renderError = field =>
    errors[field] ? (
      <Text style={{color: AppTokens.red, fontSize: 12, marginTop: 4}}>
        {errors[field]}
      </Text>
    ) : null;

  return (
    <ActionPaneContainer
      pageTitle={isEditMode ? 'Edit travel expense' : 'New travel expense'}
      isBackButton={true}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      showTabNavigator={!isKeyboardVisible}
      onBackPress={goBack}
      onRefresh={handleRefresh}
      showPageTitleRow={true}>
      {isLoading ? (
        <View
          style={
            styles.DSR_LoadingContainer /* or whatever your themed loading wrapper is */
          }>
          <CustomIndicator />
        </View>
      ) : (
        <Animated.View
          style={[styles.DSR_SafeArea, {flex: 1, opacity: fadeAnim}]}>
          <SafeAreaView style={{flex: 1}}>
            {isProcessing && (
              <View style={styles.DSR_ProcessingOverlay}>
                <View style={styles.DSR_ProcessingContainer}>
                  <ActivityIndicator size="large" color={P.primaryStrong} />
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
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}>
              {/* Location */}
              <Text style={styles.DSR_Label}>Location *</Text>
              <TextInput
                style={styles.DSR_Input}
                value={formData.Location}
                onChangeText={value => handleInputChange('Location', value)}
                placeholder="Enter location"
                placeholderTextColor={AppTokens.subtitleText}
              />
              {renderError('Location')}

              {/* Map to Travel Requisition — optional. In edit mode this will
                  open unselected unless the X++ find contract has been
                  extended to surface RequisitionNumber; see file header note. */}
              <Text style={styles.DSR_Label}>Map to travel requisition</Text>
              <Dropdown
                style={styles.DSR_Input}
                data={mapTrvOptions}
                labelField="label"
                valueField="value"
                placeholder={
                  mapTrvOptions.length === 0
                    ? 'No travel requisitions available'
                    : 'Select travel requisition'
                }
                value={formData.RequisitionNumber}
                onChange={handleMapTrvChange}
                placeholderStyle={styles.DSR_DropdownPlaceholder}
                selectedTextStyle={styles.DSR_DropdownSelectedText}
                itemTextStyle={styles.DSR_DropdownItemText}
                activeColor={P.tint}
                containerStyle={[
                  styles.DSR_DropdownContainer,
                  {marginTop: Platform.OS === 'ios' ? 5 : 2, zIndex: 1000},
                ]}
                itemContainerStyle={styles.DSR_DropdownItemContainer}
                maxHeight={280}
                dropdownPosition="auto"
                search
                searchPlaceholder="Search travel requisition"
                inputSearchStyle={styles.DSR_DropdownSearchInput}
                iconStyle={styles.DSR_DropdownIcon}
                keyboardAvoiding={true}
              />
              {renderError('MapToTravelRequisition')}

              <Text style={styles.DSR_Label}>Travel requisition amount</Text>
              <Text style={[styles.DSR_Input, styles.DSR_Disabled]}>
                {formData.TravelRequisitionAmount || '0.00'}
              </Text>

              {/* Date From */}
              <Text style={styles.DSR_Label}>Date from *</Text>
              <TouchableOpacity
                style={styles.DSR_DateSelector}
                onPress={() => setCalendarField('DateFrom')}>
                <View style={{flex: 1}}>
                  <Text style={styles.DSR_DateText}>
                    {formData.DateFrom
                      ? formatDate(formData.DateFrom)
                      : 'Select date from'}
                  </Text>
                </View>
                <Icon name="calendar" size={20} color={P.primaryStrong} />
              </TouchableOpacity>
              {renderError('DateFrom')}

              {/* Date To — enabled only after Date From is picked. */}
              <Text style={styles.DSR_Label}>Date to *</Text>
              <TouchableOpacity
                style={[
                  styles.DSR_DateSelector,
                  !formData.DateFrom && {opacity: 0.5},
                ]}
                disabled={!formData.DateFrom}
                onPress={() => setCalendarField('DateTo')}>
                <View style={{flex: 1}}>
                  <Text style={styles.DSR_DateText}>
                    {formData.DateTo
                      ? formatDate(formData.DateTo)
                      : formData.DateFrom
                      ? 'Select date to'
                      : 'Select date from first'}
                  </Text>
                </View>
                <Icon name="calendar" size={20} color={P.primaryStrong} />
              </TouchableOpacity>
              {renderError('DateTo')}
            </ScrollView>

            <SaveRecordButtons
              mode={isEditMode ? 'edit' : 'create'}
              processingButton={processingButton}
              onSave={handleSave}
              onCancel={goBack}
              isDisabled={
                processingButton === 'create' || processingButton === 'submit'
              }
              // BUTTON_TYPES only has CREATE/SUBMIT/CANCEL — the CREATE button's
              // label auto-switches to "Update" via mode="edit" internally
              // (see SaveRecordButtons.getButtonText), so the same type is
              // used for both create and edit.
              showButtons={[BUTTON_TYPES.CREATE, BUTTON_TYPES.CANCEL]}
            />

            <AlertModal {...alertModalProps} />
          </SafeAreaView>
        </Animated.View>
      )}

      {calendarField && (
        <CalendarModal
          visible={!!calendarField}
          initialDate={
            formData[calendarField] &&
            !isSentinelOrInvalidDate(formData[calendarField])
              ? formData[calendarField]
              : today
          }
          maxDate={
            calendarField === 'DateFrom'
              ? formData.DateTo || undefined
              : undefined
          }
          minDate={
            calendarField === 'DateTo'
              ? formData.DateFrom || undefined
              : undefined
          }
          onDateSelected={handleDateChange}
          onClose={() => setCalendarField(null)}
        />
      )}
    </ActionPaneContainer>
  );
};

export default ExpenseManagementSaveRecord;
