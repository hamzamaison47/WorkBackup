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
import {Dropdown} from 'react-native-element-dropdown';
import Icon from 'react-native-vector-icons/FontAwesome';
import {translate as t} from '../../../../store/utils/translate';

import ActionPaneContainer from '../../../../components/ActionPaneContainer';
import CustomIndicator from '../../../../components/CustomIndicator/CustomIndicator';
import AlertModal from '../../../../components/Alert/AlertModal';
import SaveRecordButtons from '../../../../components/Buttons/SaveRecordButtons';

import {CreateContactDetails} from '../../../../API/PersonalInformation/ContactDetails/CreateContactDetails';
import {UpdateContactDetails} from '../../../../API/PersonalInformation/ContactDetails/UpdateContactDetails';
import {getContactDetailsLabels} from '../../../../API/PersonalInformation/ContactDetails/GetContactDetailsLabel';

import styles from '../../../../styles/styles';

/* --------------  MAIN COMPONENT  -------------- */
const ContactDetailsSaveRecord = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const scrollViewRef = useRef(null);

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
  const createInitialFormData = () => ({
    RecId: contactData?.RecId || '',
    EmployeeId: employeeId,
    WorkerRecId: WorkerRecId,
    Type: contactData?.Type || '',
    Locator: contactData?.Locator || '',
    LocatorExtension: contactData?.LocatorExtension || '',
    Description: contactData?.Description || '',
    IsPrimary:
      contactData?.IsPrimary === 'true' ||
      contactData?.IsPrimary === true ||
      false,
    IsPrivate:
      contactData?.IsPrivate === 'true' ||
      contactData?.IsPrivate === true ||
      false,
    IsMobilePhone:
      contactData?.IsMobilePhone === 'true' ||
      contactData?.IsMobilePhone === true ||
      false,
  });

  /* -------  STATE  ------- */
  const [formData, setFormData] = useState(() => createInitialFormData());
  const [isLoading, setIsLoading] = useState(false);
  const [processingButton, setProcessingButton] = useState('');
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [contactDetailsLabels, setContactDetailsLabels] = useState({});
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

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
    {label: 'Home number', value: 'Home number'},
    {label: 'Work number', value: 'Work number'},
    {label: 'Mobile number', value: 'Mobile number'},
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
        routes: [{name: 'TabNavigator', params: {screen: 'MainDashboard'}}],
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
        setFormData(createInitialFormData());
      } else if (mode === 'edit' && contactData?.RecId) {
        setFormData(createInitialFormData());
      }
    }, [mode, contactData?.RecId]),
  );

  /* -------  HELPERS  ------- */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({...prev, [field]: value}));
  };

  const clearFormData = useCallback(() => {
    setFormData(createInitialFormData());
  }, []);

  const validateForm = () => {
    const missing = [];
    if (!formData.Type) missing.push('Type');
    if (!formData.Locator) missing.push('Locator');
    return missing;
  };

  /* -------  REFRESH (same pattern as leave)  ------- */
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      clearFormData();
      /* no remote data to refetch for contacts – keep same shape */
    } catch (error) {
      console.error('Refresh error', error);
    } finally {
      setIsLoading(false);
    }
  };

  /* -------  CORE ACTION  ------- */
  const handleAction = async actionType => {
    if (processingButton) return;
    const missing = validateForm();
    if (missing.length) {
      setAlertMessage(
        'Please fill in the following required fields:\n' + missing.join('\n'),
      );
      setAlertModal(true);
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
        LocatorExtension: formData.LocatorExtension || '0',
        Description: formData.Description || '',
        IsPrimary: formData.IsPrimary ? 'Yes' : 'No',
        IsPrivate: formData.IsPrivate ? 'Yes' : 'No',
        IsMobilePhone: formData.IsMobilePhone ? 'Yes' : 'No',
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
        const actionText = mode === 'edit' ? 'Updated' : 'Created';
        setAlertMessage(`Contact ${actionText} Successfully`);
        setAlertModal(true);

        setTimeout(() => {
          setAlertModal(false);
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
        setAlertMessage(response?.Message || 'Operation Failed');
        setAlertModal(true);
      }
      return response;
    } catch (error) {
      console.error('Error in contact save:', error);
      setAlertMessage('An error occurred while processing the request.');
      setAlertModal(true);
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
      onFloatingButtonPress={{}}>
      {isLoading ? (
        <CustomIndicator />
      ) : (
        <SafeAreaView style={styles.DSR_SafeArea}>
          {/* <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.DSR_ContentWrapper}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}> */}
          {isProcessing && (
            <View style={styles.DSR_ProcessingOverlay}>
              <View style={styles.DSR_ProcessingContainer}>
                <ActivityIndicator size="large" color="#0A66C2" />
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
            <Text style={styles.DSR_Label}>Type *</Text>
            <Dropdown
              style={[styles.DSR_Input, mode === 'edit' && styles.DSR_Disabled]}
              data={contactTypeOptions}
              labelField="label"
              valueField="value"
              placeholder="Select Type"
              value={formData.Type}
              onChange={item => {
                if (mode !== 'edit') handleInputChange('Type', item.value);
              }}
              maxHeight={280}
              search
              searchPlaceholder="Search Type"
              placeholderStyle={styles.DSR_DropdownPlaceholder}
              selectedTextStyle={styles.DSR_DropdownSelectedText}
              itemTextStyle={styles.DSR_DropdownItemText}
              activeColor="#E6F0FF"
              containerStyle={[
                styles.DSR_DropdownContainer,
                {marginTop: Platform.OS === 'ios' ? 5 : 2, zIndex: 1000},
              ]}
              itemContainerStyle={styles.DSR_DropdownItemContainer}
              disable={mode === 'edit'}
            />

            <Text style={styles.DSR_Label}>Locator (Email or Phone No.) *</Text>
            <TextInput
              style={styles.DSR_Input}
              value={formData.Locator}
              onChangeText={text => handleInputChange('Locator', text)}
              placeholder="e.g., john.doe@email.com"
              placeholderTextColor="#888"
              autoCapitalize="none"
            />

            <Text style={styles.DSR_Label}>Extension</Text>
            <TextInput
              style={styles.DSR_Input}
              value={formData.LocatorExtension}
              onChangeText={text => handleInputChange('LocatorExtension', text)}
              placeholder="e.g., +92"
              placeholderTextColor="#888"
            />

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

            <View style={styles.DSR_SwitchRow}>
              <Text style={styles.DSR_SwitchLabel}>Is Primary</Text>
              <Switch
                value={!!formData.IsPrimary}
                onValueChange={val => handleInputChange('IsPrimary', val)}
                trackColor={{false: '#767577', true: '#81b0ff'}}
                thumbColor={formData.IsPrimary ? '#2196F3' : '#f4f3f4'}
              />
            </View>

            <View style={styles.DSR_SwitchRow}>
              <Text style={styles.DSR_SwitchLabel}>Is Private</Text>
              <Switch
                value={!!formData.IsPrivate}
                onValueChange={val => handleInputChange('IsPrivate', val)}
                trackColor={{false: '#767577', true: '#81b0ff'}}
                thumbColor={formData.IsPrivate ? '#2196F3' : '#f4f3f4'}
              />
            </View>

            <View style={styles.DSR_SwitchRow}>
              <Text style={styles.DSR_SwitchLabel}>Is Mobile Phone</Text>
              <Switch
                value={!!formData.IsMobilePhone}
                onValueChange={val => handleInputChange('IsMobilePhone', val)}
                trackColor={{false: '#767577', true: '#81b0ff'}}
                thumbColor={formData.IsMobilePhone ? '#2196F3' : '#f4f3f4'}
              />
            </View>
          </ScrollView>

          <SaveRecordButtons
            mode={mode}
            processingButton={processingButton}
            onSave={() => handleAction('save')}
            onCancel={goBack}
            isDisabled={
              processingButton === 'create' || processingButton === 'submit'
            }
          />
          {/* </KeyboardAvoidingView> */}

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

export default ContactDetailsSaveRecord;
