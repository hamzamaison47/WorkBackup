/* eslint-disable no-unused-vars */
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
  Switch,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import usePalette from '../../../../hooks/usePalette';
import {Dropdown} from 'react-native-element-dropdown';
import Icon from 'react-native-vector-icons/FontAwesome';
import {translate as t} from '../../../../store/utils/translate';

import ActionPaneContainer from '../../../../components/ActionPaneContainer';
import CustomIndicator from '../../../../components/CustomIndicator/CustomIndicator';
import AlertModal from '../../../../components/Alert/AlertModal';
import useAlertModal from '../../../../hooks/useAlertModal';
import SaveRecordButtons, {
  BUTTON_TYPES,
} from '../../../../components/Buttons/SaveRecordButtons';
import useNotify from '../../../../hooks/useNotify';

import {CreateContactDetails} from '../../../../API/PersonalInformation/ContactDetails/CreateContactDetails';
import {UpdateContactDetails} from '../../../../API/PersonalInformation/ContactDetails/UpdateContactDetails';
import {getContactDetailsLabels} from '../../../../API/PersonalInformation/ContactDetails/GetContactDetailsLabel';
import useAppStyles from '../../../../hooks/useAppStyles';

import styles from '../../../../styles/styles';

/* -------  PHONE TYPES (show Extension field for these)  ------- */
const PHONE_TYPES = ['Phone', 'Fax', 'Telex'];

/* -------  Per-type locator label + placeholder  ------- */
const LOCATOR_CONFIG = {
  Phone: {label: 'Phone Number *', placeholder: 'e.g., +921234567890'},
  Email: {label: 'Email Address *', placeholder: 'e.g., john.doe@email.com'},
  URL: {label: 'URL *', placeholder: 'e.g., https://example.com'},
  Telex: {label: 'Telex Number *', placeholder: 'e.g., 12345'},
  Fax: {label: 'Fax Number *', placeholder: 'e.g., +921234567890'},
  Facebook: {
    label: 'Facebook Profile URL *',
    placeholder: 'e.g., https://facebook.com/username',
  },
  Twitter: {label: 'Twitter Handle *', placeholder: 'e.g., @username'},
  LinkedIn: {
    label: 'LinkedIn Profile URL *',
    placeholder: 'e.g., https://linkedin.com/in/username',
  },
};

const DEFAULT_LOCATOR = {
  label: 'Locator (Email or Phone No.) *',
  placeholder: 'Select a type first',
};

/* --------------  MAIN COMPONENT  -------------- */
const ContactDetailsSaveRecord = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const scrollViewRef = useRef(null);
  const P = usePalette();
  const styles = useAppStyles();

  const userData = useSelector(state => state.user.userData);
  const routeUserData = route.params?.userData;
  const effectiveUserData = routeUserData || userData || {};

  /* -------  NAVIGATION PARAMS (safe defaults)  ------- */
  const {
    mode = 'create',
    contactData = {},
    employeeId = contactData.EmployeeId || effectiveUserData?.employeeId || '',
    employeeName = contactData.EmployeeName ||
      effectiveUserData?.employeeName ||
      '',
    WorkerRecId = contactData.WorkerRecId ||
      effectiveUserData?.WorkerRecId ||
      '',
    cameFrom = 'MainDashboard',
    originalCameFrom = null,
  } = route.params || {};
  console.log('Contract Data', contactData);

  /* -------  FORM INITIALISER  ------- */
  const createInitialFormData = data => ({
    RecId: data?.RecId || '',
    EmployeeId: employeeId,
    WorkerRecId: WorkerRecId,
    Type: data?.Type || 'Phone',
    Locator: data?.Locator || '',
    LocatorExtension: data?.LocatorExtension || '',
    Description: data?.Description || '',
    IsPrimary: data?.IsPrimary === true || data?.IsPrimary === 'true' || false,
    IsPrivate: data?.IsPrivate === true || data?.IsPrivate === 'true' || false,
    IsMobilePhone:
      data?.IsMobilePhone === true || data?.IsMobilePhone === 'true' || false,
  });

  /* -------  STATE  ------- */
  const [formData, setFormData] = useState(() => createInitialFormData());
  const [isLoading, setIsLoading] = useState(false);
  const [processingButton, setProcessingButton] = useState('');
  const {showSuccess, showError, showWarning, alertModalProps} =
    useAlertModal();

  const [isProcessing, setIsProcessing] = useState(false);
  const [contactDetailsLabels, setContactDetailsLabels] = useState({});
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const {notifySuccess, notifyError} = useNotify('Contact Details');

  /* -------  DERIVED  ------- */
  const isPhoneType = PHONE_TYPES.includes(formData.Type);
  const currentLocator = formData.Type
    ? LOCATOR_CONFIG[formData.Type] || DEFAULT_LOCATOR
    : DEFAULT_LOCATOR;

  /* -------  STATIC DROPDOWN DATA  ------- */
  const contactTypeOptions = [
    {label: 'Phone', value: 'Phone'},
    {label: 'Email address', value: 'Email'},
    {label: 'URL', value: 'URL'},
    {label: 'Telex', value: 'Telex'},
    {label: 'Fax', value: 'Fax'},
    {label: 'Facebook', value: 'Facebook'},
    {label: 'Twitter', value: 'Twitter'},
    {label: 'LinkedIn', value: 'LinkedIn'},
  ];

  const fetchgetContactDetailsLabels = async () => {
    try {
      const labels = await getContactDetailsLabels();
      return labels || {};
    } catch (error) {
      console.error('Error fetching Contact Details labels:', error);
      return {};
    }
  };

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const initializeLabels = async () => {
        try {
          setIsLoading(true);

          // 🔹 Fetch Contact Details Labels
          const labels = await fetchgetContactDetailsLabels();
          if (!isActive) return;

          setContactDetailsLabels(labels);
          console.log('Contact Details Labels:', labels);
        } catch (error) {
          console.error('Error loading Contact Details labels:', error);
        } finally {
          if (isActive) setIsLoading(false);
        }
      };

      initializeLabels();

      return () => {
        isActive = false;
      };
    }, []),
  );

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

  /* -------  NAVIGATION  ------- */
  const goBack = useCallback(() => {
    if (cameFrom === 'MainDashboard') {
      navigation.reset({
        index: 0,
        routes: [{name: 'MainDashboard'}],
      });
    } else if (cameFrom === 'ContactDetailsListPage') {
      const targetCameFrom = originalCameFrom || 'DisplayListPage';
      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'ContactDetailsListPage',
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

  /* -------  HARDWARE BACK  ------- */
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

  /* -------  SCROLL TO TOP  ------- */
  useFocusEffect(
    useCallback(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({y: 0, animated: false});
      }
    }, []),
  );

  /* -------  FORM RESET / POPULATE  ------- */
  useFocusEffect(
    useCallback(() => {
      if (mode === 'create') {
        setFormData(createInitialFormData({}));
      } else if (mode === 'edit') {
        setFormData(createInitialFormData(contactData));
      }
    }, [mode, contactData]),
  );

  /* -------  HELPERS  ------- */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({...prev, [field]: value}));
  };

  const handleTypeChange = item => {
    if (mode === 'edit') return;
    // Clear extension when switching away from a phone type
    const newIsPhone = PHONE_TYPES.includes(item.value);
    setFormData(prev => ({
      ...prev,
      Type: item.value,
      Locator: '',
      LocatorExtension: newIsPhone ? prev.LocatorExtension : '',
    }));
  };

  const clearFormData = useCallback(() => {
    setFormData(createInitialFormData());
  }, []);

  const validateForm = () => {
    const missing = [];
    if (!formData.Type) missing.push('Type');
    if (!formData.Locator) missing.push(currentLocator.label.replace(' *', ''));
    return missing;
  };

  /* -------  REFRESH  ------- */
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      clearFormData();
    } catch (error) {
      console.error('Refresh error', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async actionType => {
    if (processingButton) return;
    const missing = validateForm();
    if (missing.length) {
      showWarning(
        'Please fill in the following required fields:\n' + missing.join('\n'),
      );
      return;
    }

    setProcessingButton(actionType);
    setIsProcessing(true);

    try {
      /*  AX contact endpoint expects EmployeeId = WorkerRecId  */
      const payload = {
        EmployeeId: formData.WorkerRecId,
        Type: formData.Type,
        Locator: formData.Locator,
        Location: formData.Location || '0',
        LocatorExtension: formData.LocatorExtension || '',
        Description: formData.Description || '',
        IsPrimary: formData.IsPrimary ? 'true' : 'false',
        IsPrivate: formData.IsPrivate ? 'true' : 'false',
        IsMobilePhone: formData.IsMobilePhone ? 'true' : 'false',
        RecId: formData.RecId === '' ? '0' : formData.RecId,
      };
      console.log('mode', mode);
      console.log('PAYLOAD: ', payload);

      let response;
      if (mode === 'edit') {
        response = await UpdateContactDetails({contactData: payload});
      } else {
        response = await CreateContactDetails(payload);
      }

      const isSuccess =
        response?.IsSuccess === true || response?.IsSuccess === 'true';
      if (isSuccess) {
        const actionText = mode === 'edit' ? 'updated' : 'created';
        const successMsg = `Contact detail ${actionText} successfully`;
        notifySuccess(successMsg);
        showSuccess(successMsg); // also cleaned up the duplicate string

        setTimeout(() => {
          clearFormData();
          navigation.navigate('ContactDetailsListPage', {
            employeeId: formData.EmployeeId,
            employeeName,
            WorkerRecId,
            userData: route.params?.userData || {
              employeeId: formData.EmployeeId,
              employeeName,
              WorkerRecId,
            },
            highlightRecId: response?.RecId,
            cameFrom: originalCameFrom || 'DisplayListPage',
          });
        }, 1200);
      } else {
        showError(response?.Message || 'Operation Failed');
      }
      return response;
    } catch (error) {
      console.error('Error in contact save:', error);
      showError('An error occurred while processing the request.');
      return {IsSuccess: false};
    } finally {
      setProcessingButton('');
      setIsProcessing(false);
    }
  };

  /* -------  RENDER  ------- */
  return (
    <ActionPaneContainer
      pageTitle={mode === 'edit' ? 'Edit Contact' : 'Create Contact'}
      isBackButton={true}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      showTabNavigator={!isKeyboardVisible}
      onBackPress={goBack}
      onRefresh={handleRefresh}
      onFloatingButtonPress={{}}
      showPageTitleRow={true}>
      {isLoading ? (
        <CustomIndicator />
      ) : (
        <SafeAreaView style={styles.DSR_SafeArea}>
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
            keyboardShouldPersistTaps="handled">
            {/* ── Type ── */}
            <Text style={styles.DSR_Label}>Type *</Text>
            <Dropdown
              style={[styles.DSR_Input, mode === 'edit' && styles.DSR_Disabled]}
              data={contactTypeOptions}
              labelField="label"
              valueField="value"
              placeholder="Select Type"
              value={formData.Type}
              onChange={handleTypeChange}
              maxHeight={280}
              search
              searchPlaceholder="Search Type"
              placeholderStyle={styles.DSR_DropdownPlaceholder}
              selectedTextStyle={styles.DSR_DropdownSelectedText}
              itemTextStyle={styles.DSR_DropdownItemText}
              activeColor={P.tint}
              containerStyle={[
                styles.DSR_DropdownContainer,
                {marginTop: Platform.OS === 'ios' ? 5 : 2, zIndex: 1000},
              ]}
              itemContainerStyle={styles.DSR_DropdownItemContainer}
              disable={mode === 'edit'}
            />

            {/* ── Locator – label changes based on selected Type ── */}
            <Text style={styles.DSR_Label}>{currentLocator.label}</Text>
            <TextInput
              style={styles.DSR_Input}
              value={formData.Locator}
              onChangeText={text => handleInputChange('Locator', text)}
              placeholder={currentLocator.placeholder}
              placeholderTextColor="#888"
              autoCapitalize="none"
              keyboardType={
                isPhoneType
                  ? 'phone-pad'
                  : formData.Type === 'Email'
                  ? 'email-address'
                  : 'default'
              }
            />

            {/* ── Extension – only for phone-type contacts ── */}
            {/* {isPhoneType && (
              <>
                <Text style={styles.DSR_Label}>Extension</Text>
                <TextInput
                  style={styles.DSR_Input}
                  value={formData.LocatorExtension}
                  onChangeText={text =>
                    handleInputChange('LocatorExtension', text)
                  }
                  placeholder="e.g., +92"
                  placeholderTextColor="#888"
                  keyboardType="phone-pad"
                />
              </>
            )} */}

            {/* ── Description ── */}
            <Text style={styles.DSR_Label}>Description</Text>
            <TextInput
              style={[styles.DSR_Input, styles.DSR_TextArea]}
              value={formData.Description}
              onChangeText={text => handleInputChange('Description', text)}
              placeholder="Enter description"
              placeholderTextColor="#888"
              multiline
              numberOfLines={4}
            />

            {/* ── Toggles ── */}
            <View style={styles.DSR_SwitchRow}>
              <Text style={styles.DSR_SwitchLabel}>Is Primary</Text>
              <Switch
                value={!!formData.IsPrimary}
                onValueChange={val => handleInputChange('IsPrimary', val)}
                trackColor={{false: '#767577', true: P.primaryStrong}}
                thumbColor={formData.IsPrimary ? P.primary : '#f4f3f4'}
              />
            </View>

            <View style={styles.DSR_SwitchRow}>
              <Text style={styles.DSR_SwitchLabel}>Is Private</Text>
              <Switch
                value={!!formData.IsPrivate}
                onValueChange={val => handleInputChange('IsPrivate', val)}
                trackColor={{false: '#767577', true: P.primaryStrong}}
                thumbColor={formData.IsPrivate ? P.primary : '#f4f3f4'}
              />
            </View>
          </ScrollView>

          <SaveRecordButtons
            mode={mode}
            processingButton={processingButton}
            onSave={() => handleAction(mode === 'edit' ? 'update' : 'create')}
            onCancel={goBack}
            isDisabled={
              processingButton === 'create' || processingButton === 'submit'
            }
            showButtons={[BUTTON_TYPES.CREATE, BUTTON_TYPES.CANCEL]}
            // showButtons={
            //   mode === 'edit'
            //     ? [BUTTON_TYPES.UPDATE, BUTTON_TYPES.CANCEL]
            //     : [BUTTON_TYPES.CREATE, BUTTON_TYPES.CANCEL]
            // }
          />
        </SafeAreaView>
      )}

      <AlertModal {...alertModalProps} />
    </ActionPaneContainer>
  );
};

export default ContactDetailsSaveRecord;
