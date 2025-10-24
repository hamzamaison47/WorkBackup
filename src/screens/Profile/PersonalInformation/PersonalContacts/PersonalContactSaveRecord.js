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
  Switch, // <-- add this line
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {Dropdown} from 'react-native-element-dropdown';
import Icon from 'react-native-vector-icons/FontAwesome';

import ActionPaneContainer from '../../../../components/ActionPaneContainer';
import CustomIndicator from '../../../../components/CustomIndicator/CustomIndicator';
import AlertModal from '../../../../components/Alert/AlertModal';
import SaveRecordButtons from '../../../../components/Buttons/SaveRecordButtons';

import {CreateContactDetails} from '../../../../API/PersonalInformation/ContactDetails/CreateContactDetails';
import {UpdateContactDetails} from '../../../../API/PersonalInformation/ContactDetails/UpdateContactDetails';

/* --------------  STYLE SHEET  -------------- */
import {StyleSheet} from 'react-native';
const styles = StyleSheet.create({
  container: {flex: 1},
  contentWrapper: {flex: 1},
  formContainer: {padding: 16},
  label: {fontSize: 16, marginBottom: 6, color: '#333'},
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  textArea: {height: 100, textAlignVertical: 'top'},
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  switchLabel: {fontSize: 16, color: '#333'},
});

/* --------------  MAIN COMPONENT  -------------- */
const PersonalContactSaveRecord = () => {
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

  /* -------  NAVIGATION  ------- */
  const goBack = useCallback(() => {
    if (cameFrom === 'MainDashboard') {
      navigation.reset({
        index: 0,
        routes: [{name: 'TabNavigator', params: {screen: 'MainDashboard'}}],
      });
    } else if (cameFrom === 'PersonalContacts') {
      const targetCameFrom = originalCameFrom || 'DisplayListPage';
      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'PersonalContacts',
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
    setIsLoading(true);

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
          navigation.navigate('PersonalContacts', {
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
      setIsLoading(false);
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
      onBackPress={goBack}
      onRefresh={handleRefresh}
      onFloatingButtonPress={{}}>
      {isLoading ? (
        <CustomIndicator />
      ) : (
        <SafeAreaView style={styles.container}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.contentWrapper}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
            <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={styles.formContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              {/* Type */}
              <Text style={styles.label}>Type *</Text>
              <Dropdown
                style={[
                  styles.input,
                  mode === 'edit' && {
                    backgroundColor: '#f0f0f0',
                    color: '#888',
                  }, // gray-out style
                ]}
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
                disable={mode === 'edit'} // <--- this disables the dropdown interaction
              />

              {/* Locator */}
              <Text style={styles.label}>Locator (Email or Phone No.) *</Text>
              <TextInput
                style={styles.input}
                value={formData.Locator}
                onChangeText={text => handleInputChange('Locator', text)}
                placeholder="e.g., john.doe@email.com"
                autoCapitalize="none"
              />

              {/* Extension */}
              <Text style={styles.label}>Extension</Text>
              <TextInput
                style={styles.input}
                value={formData.LocatorExtension}
                onChangeText={text =>
                  handleInputChange('LocatorExtension', text)
                }
                placeholder="e.g., +92"
              />

              {/* Description */}
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.Description}
                onChangeText={text => handleInputChange('Description', text)}
                placeholder="Enter description"
                multiline
                numberOfLines={4}
              />

              {/* Switches */}
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Is Primary</Text>
                <Switch
                  value={!!formData.IsPrimary}
                  onValueChange={val => handleInputChange('IsPrimary', val)}
                />
              </View>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Is Private</Text>
                <Switch
                  value={!!formData.IsPrivate}
                  onValueChange={val => handleInputChange('IsPrivate', val)}
                />
              </View>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Is Mobile Phone</Text>
                <Switch
                  value={!!formData.IsMobilePhone}
                  onValueChange={val => handleInputChange('IsMobilePhone', val)}
                />
              </View>
            </ScrollView>

            {/* Buttons */}
            <SaveRecordButtons
              mode={mode}
              processingButton={processingButton}
              onSave={() => handleAction('save')}
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
            onPress={() => setAlertModal(false)}
          />
        </SafeAreaView>
      )}
    </ActionPaneContainer>
  );
};

export default PersonalContactSaveRecord;
