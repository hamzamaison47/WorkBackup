// /* eslint-disable react-hooks/exhaustive-deps */
// /* eslint-disable curly */
// /* eslint-disable react-native/no-inline-styles */
// import React, {useState, useCallback, useRef, useEffect} from 'react';
// import {
//   Text,
//   TextInput,
//   ScrollView,
//   SafeAreaView,
//   KeyboardAvoidingView,
//   Platform,
//   Switch,
//   View,
//   TouchableOpacity,
//   BackHandler,
//   ActivityIndicator,
// } from 'react-native';
// import {
//   useNavigation,
//   useRoute,
//   useFocusEffect,
// } from '@react-navigation/native';
// import {useSelector} from 'react-redux';
// import {Dropdown} from 'react-native-element-dropdown';
// import DateTimePicker from '@react-native-community/datetimepicker';
// import {translate as t} from '../../../../store/utils/translate';
// import Icon from 'react-native-vector-icons/FontAwesome';

// import ActionPaneContainer from '../../../../components/ActionPaneContainer';
// import SaveRecordButtons from '../../../../components/Buttons/SaveRecordButtons';
// import CustomIndicator from '../../../../components/CustomIndicator/CustomIndicator';
// import AlertModal from '../../../../components/Alert/AlertModal';
// import CalendarModal from '../../../../components/Leaves/CalendarModal';
// import {BUTTON_TYPES} from '../../../../components/Buttons/SaveRecordButtons';

// import {retrieveRelationshipTypeId} from '../../../../API/PersonalInformation/FamilyContacts/retrieveRelationshipTypeId';
// import {FamilyContactCreate} from '../../../../API/PersonalInformation/FamilyContacts/FamilyContactCreate';
// import {FamilyContactUpdate} from '../../../../API/PersonalInformation/FamilyContacts/FamilyContactUpdate';
// import {getpersonalContactLabels} from '../../../../API/PersonalInformation/FamilyContacts/GetPersonalContactsLabels';

// import styles from '../../../../styles/styles';

// const FamilyContact_SaveRecord = () => {
//   const route = useRoute();
//   const navigation = useNavigation();
//   const scrollViewRef = useRef(null);
//   const isRTL = useSelector(state => state.language.isRTL);
//   const userData = useSelector(state => state.user.userData);
//   const routeUserData = route.params?.userData;
//   const effectiveUserData = routeUserData || userData || {};
//   const [PersonalContactsLabelData, setPersonalContactsLabelsData] = useState(
//     {},
//   );

//   const {
//     mode = 'create',
//     familyContactDataSet = {},
//     employeeId = familyContactDataSet.employeeId ||
//       effectiveUserData?.employeeId ||
//       '',
//     employeeName = familyContactDataSet.employeeName ||
//       effectiveUserData?.employeeName ||
//       '',
//     WorkerRecId = familyContactDataSet.WorkerRecId ||
//       effectiveUserData?.WorkerRecId ||
//       '',
//     cameFrom,
//     originalCameFrom,
//   } = route.params || {};
//   const today = new Date().toISOString().split('T')[0];
//   const createInitialFormData = () => ({
//     recId:
//       !familyContactDataSet?.RecId || familyContactDataSet.RecId === '0'
//         ? ''
//         : familyContactDataSet.RecId,

//     employeeId,
//     employeeName,
//     WorkerRecId,
//     firstName: '',
//     lastName: '',
//     relationship: '',
//     EmergencyContact: false,
//     isBeneficiary: false,
//     isDependent: false,
//     Gender: '',
//     BirthDate: today,
//     IsFullTimeStudent: false,
//     IsPersonWithDisabilities: false,
//     WorkflowOperation: '',
//     beneficiaryValidFrom: today,
//     dependentValidFrom: today,
//   });

//   const fetchPersonalContactsLabels = async () => {
//     try {
//       const labels = await getpersonalContactLabels();
//       return labels || {};
//     } catch (error) {
//       console.error('Error fetching Personal Contacts labels:', error);
//       return {};
//     }
//   };
//   // useFocusEffect(
//   //   React.useCallback(() => {
//   //     if (mode === 'create') {
//   //       const freshFormData = createInitialFormData();
//   //       setFormData(freshFormData);
//   //     } else if (mode === 'edit' && familyContactDataSet?.RecId) {
//   //       const fullName = familyContactDataSet.Name || '';
//   //       const nameParts = fullName.trim().split(' ');
//   //       const firstName = nameParts[0] || '';
//   //       const lastName = nameParts.slice(1).join(' ') || ''; // Join remaining parts for last name

//   //       // Helper function to convert various boolean representations to true boolean
//   //       const toBoolean = value => {
//   //         if (typeof value === 'boolean') return value;
//   //         if (typeof value === 'number') return value === 1;
//   //         if (typeof value === 'string') {
//   //           const lower = value.toLowerCase();
//   //           return lower === 'true' || lower === '1' || lower === 'yes';
//   //         }
//   //         return false;
//   //       };
//   //       const editFormData = {
//   //         ...createInitialFormData(),

//   //         // map edit values
//   //         // map edit values
//   //         recId: familyContactDataSet.RecId,
//   //         firstName: firstName,
//   //         lastName: lastName,
//   //         relationship: familyContactDataSet.RelationShipTypeId || '',

//   //         EmergencyContact: toBoolean(familyContactDataSet.EmergencyContact),
//   //         isBeneficiary: toBoolean(familyContactDataSet.isBeneficiary),
//   //         isDependent: toBoolean(familyContactDataSet.isDependent),

//   //         Gender: familyContactDataSet.Gender || '',
//   //         BirthDate: familyContactDataSet.BirthDate || '',

//   //         beneficiaryValidFrom: familyContactDataSet.BeneficiaryFromDate || '',
//   //         beneficiaryValidTo: familyContactDataSet.BeneficiaryToDate || '',

//   //         dependentValidFrom: familyContactDataSet.DependentValidFrom || '',
//   //         dependentValidTo: familyContactDataSet.DependentValidTo || '',

//   //         IsFullTimeStudent: toBoolean(familyContactDataSet.IsFullTimeStudent),
//   //         IsPersonWithDisabilities: toBoolean(
//   //           familyContactDataSet.IsPersonWithDisabilities,
//   //         ),

//   //         // ensure employee context is preserved
//   //         employeeId: familyContactDataSet.employeeId || employeeId,
//   //         employeeName: familyContactDataSet.employeeName || employeeName,
//   //         WorkerRecId: familyContactDataSet.WorkerRecId || WorkerRecId,
//   //       };

//   //       setFormData(editFormData);
//   //     }
//   //   }, [
//   //     mode,
//   //     familyContactDataSet?.RecId,
//   //     familyContactDataSet,
//   //     employeeId,
//   //     employeeName,
//   //     WorkerRecId,
//   //   ]),
//   // );

//   useFocusEffect(
//     useCallback(() => {
//       let isActive = true;

//       const initializeForm = async () => {
//         setIsLoading(true);

//         try {
//           // 🔹 1. Fetch labels FIRST
//           const labels = await fetchPersonalContactsLabels();
//           if (!isActive) return;
//           setPersonalContactsLabelsData(labels);

//           console.log('Personal Contact Labels:', labels);

//           // 🔹 2. Fetch Relationship Types
//           const res = await retrieveRelationshipTypeId();
//           if (!isActive) return;

//           if (Array.isArray(res)) {
//             setRelationshipTypes(res);
//           }

//           // 🔹 3. CREATE MODE
//           if (mode === 'create') {
//             setFormData(createInitialFormData());
//             setAlertMessage('');
//           }

//           // 🔹 4. EDIT MODE
//           else if (mode === 'edit' && familyContactDataSet?.RecId) {
//             const fullName = familyContactDataSet.Name || '';
//             const nameParts = fullName.trim().split(' ');
//             const firstName = nameParts[0] || '';
//             const lastName = nameParts.slice(1).join(' ') || '';

//             const toBoolean = value => {
//               if (typeof value === 'boolean') return value;
//               if (typeof value === 'number') return value === 1;
//               if (typeof value === 'string') {
//                 const lower = value.toLowerCase();
//                 return lower === 'true' || lower === '1' || lower === 'yes';
//               }
//               return false;
//             };

//             setFormData({
//               ...createInitialFormData(),
//               recId: familyContactDataSet.RecId,
//               firstName,
//               lastName,
//               relationship: familyContactDataSet.RelationShipTypeId || '',

//               EmergencyContact: toBoolean(
//                 familyContactDataSet.EmergencyContact,
//               ),
//               isBeneficiary: toBoolean(familyContactDataSet.isBeneficiary),
//               isDependent: toBoolean(familyContactDataSet.isDependent),

//               Gender: familyContactDataSet.Gender || '',
//               BirthDate: familyContactDataSet.BirthDate || '',

//               beneficiaryValidFrom: normalizeD365Date(
//                 familyContactDataSet.BeneficiaryFromDate,
//               ),
//               beneficiaryValidTo: normalizeD365Date(
//                 familyContactDataSet.BeneficiaryToDate,
//               ),

//               dependentValidFrom: normalizeD365Date(
//                 familyContactDataSet.DependentValidFrom,
//               ),
//               dependentValidTo: normalizeD365Date(
//                 familyContactDataSet.DependentValidTo,
//               ),

//               IsFullTimeStudent: toBoolean(
//                 familyContactDataSet.IsFullTimeStudent,
//               ),
//               IsPersonWithDisabilities: toBoolean(
//                 familyContactDataSet.IsPersonWithDisabilities,
//               ),

//               employeeId: familyContactDataSet.employeeId || employeeId,
//               employeeName: familyContactDataSet.employeeName || employeeName,
//               WorkerRecId: familyContactDataSet.WorkerRecId || WorkerRecId,
//             });
//           }
//         } catch (error) {
//           console.error('Error initializing Family Contact form:', error);
//           setAlertMessage('Failed to load Family Contact screen');
//           setAlertModal(true);
//         } finally {
//           if (isActive) setIsLoading(false);
//         }
//       };

//       initializeForm();

//       return () => {
//         isActive = false;
//       };
//     }, [
//       mode,
//       familyContactDataSet?.RecId,
//       familyContactDataSet,
//       employeeId,
//       employeeName,
//       WorkerRecId,
//     ]),
//   );

//   const D365_MAX_DATE = '2154-12-31T23:59:59Z';
//   const D365_MIN_DATE = '1900-01-01';

//   const normalizeD365Date = dateString => {
//     if (!dateString) return '';

//     if (
//       dateString.startsWith(D365_MAX_DATE) ||
//       dateString.startsWith(D365_MIN_DATE)
//     ) {
//       return ''; // empty means "Never / Not set" in UI
//     }

//     return dateString;
//   };

//   const [relationshipTypes, setRelationshipTypes] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [alertModal, setAlertModal] = useState(false);
//   const [alertMessage, setAlertMessage] = useState('');
//   const [processingButton, setProcessingButton] = useState('');
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [showDatePicker, setShowDatePicker] = useState(false);
//   const [showValidFromPicker, setShowValidFromPicker] = useState(false);
//   const [showValidToPicker, setShowValidToPicker] = useState(false);
//   const [showDependentValidFromPicker, setShowDependentValidFromPicker] =
//     useState(false);
//   const [showDependentValidToPicker, setShowDependentValidToPicker] =
//     useState(false);

//   const [formData, setFormData] = useState({});

//   const goBack = useCallback(() => {
//     navigation.reset({
//       index: 0,
//       routes: [
//         {
//           name: 'FamilyContact_ListPage',
//           params: {
//             employeeId,
//             employeeName,
//             WorkerRecId,
//             cameFrom: originalCameFrom || 'DisplayListPage',
//           },
//         },
//       ],
//     });
//   }, [navigation, employeeId, employeeName, WorkerRecId, originalCameFrom]);

//   useFocusEffect(
//     useCallback(() => {
//       const onBackPress = () => {
//         goBack();
//         return true;
//       };
//       const sub = BackHandler.addEventListener(
//         'hardwareBackPress',
//         onBackPress,
//       );
//       return () => sub.remove();
//     }, [goBack]),
//   );

//   useFocusEffect(
//     useCallback(
//       () => scrollViewRef.current?.scrollTo({y: 0, animated: false}),
//       [],
//     ),
//   );

//   const handleRefresh = async () => {
//     setIsLoading(true);
//     try {
//       setFormData(createInitialFormData());
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleInputChange = (field, value) =>
//     setFormData(prev => ({...prev, [field]: value}));

//   const fetchRelationshipTypes = useCallback(async () => {
//     setIsLoading(true);
//     try {
//       const res = await retrieveRelationshipTypeId();
//       if (!Array.isArray(res)) throw new Error('Invalid response from API');
//       setRelationshipTypes(res);

//       // preselect if editing
//       const originalId = familyContactDataSet?.RelationShipTypeId || '';
//       setFormData(prev => ({...prev, relationship: originalId}));
//     } catch (err) {
//       setAlertMessage('Failed to fetch relationship types.');
//       setAlertModal(true);
//     } finally {
//       setIsLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchRelationshipTypes();
//   }, [fetchRelationshipTypes]);

//   const convertDateFormat = date =>
//     date ? new Date(date).toISOString().split('T')[0] : null;

//   const onDateChange = (event, selectedDate) => {
//     setShowDatePicker(Platform.OS === 'ios');
//     if (selectedDate)
//       handleInputChange('BirthDate', convertDateFormat(selectedDate));
//   };

//   const formatDisplayDate = dateString => {
//     if (!dateString) return '';
//     const d = new Date(dateString);
//     const month = String(d.getMonth() + 1).padStart(2, '0');
//     const day = String(d.getDate()).padStart(2, '0');
//     const year = d.getFullYear();
//     return `${month}/${day}/${year}`;
//   };

//   const validate = () => {
//     const missing = [];
//     if (!formData.firstName.trim()) missing.push('First Name');
//     // if (!formData.lastName.trim()) missing.push('Last Name');
//     if (!formData.relationship) missing.push('Relationship');
//     if (missing.length) {
//       setAlertMessage(
//         'Please fill in the following required fields:\n' + missing.join('\n'),
//       );
//       setAlertModal(true);
//       return false;
//     }
//     return true;
//   };

//   const handleAction = async (mode, data) => {
//     try {
//       console.log('Handle Action Data : ', data);

//       const contract = {
//         RecId: Number(data.recId || 0),

//         Name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),

//         EmployeeId: data.employeeId || '',
//         RelationShipTypeId: data.relationship || '',

//         EmergencyContact: data.EmergencyContact ? 1 : 0,
//         isDependent: data.isDependent ? 1 : 0,
//         isBeneficiary: data.isBeneficiary ? 1 : 0,

//         BeneficiaryFromDate:
//           data.beneficiaryValidFrom || '1900-01-01T00:00:00.000Z',

//         BeneficiaryToDate: data.beneficiaryValidTo
//           ? data.beneficiaryValidTo
//           : '2154-12-31T23:59:59.000Z',

//         Gender: data.Gender || '',
//         BirthDate: data.BirthDate || '1900-01-01T00:00:00.000Z',

//         DependentValidFrom:
//           data.dependentValidFrom || '1900-01-01T00:00:00.000Z',

//         DependentValidTo: data.dependentValidTo
//           ? data.dependentValidTo
//           : '2154-12-31T23:59:59.000Z',

//         IsFullTimeStudent: data.IsFullTimeStudent ? 1 : 0,
//         IsPersonWithDisabilities: data.IsPersonWithDisabilities ? 1 : 0,

//         Worker: Number(data.WorkerRecId) || 0,

//         ApprovalStatus: 'Draft',
//         WorkflowOperation: mode === 'edit' ? 'Update' : 'Create',
//       };

//       let response;

//       if (mode === 'create') {
//         response = await FamilyContactCreate({
//           familyContactDataSet: contract,
//         });
//       } else if (mode === 'edit') {
//         response = await FamilyContactUpdate({
//           familyContactDataSet: contract,
//         });
//         console.log('THIS IS HTE DAT ATHAT IS GOIGJ', contract);
//       }

//       if (!response) {
//         throw new Error('No response from server');
//       }

//       const actionText = mode === 'edit' ? 'Updated' : 'Created';

//       setAlertMessage(`${contract.Name} is ${actionText} Successfully`);
//       setAlertModal(true);

//       return {
//         success: true,
//         recId: response.RecId || contract.RecId,
//       };
//     } catch (error) {
//       console.error('Error in handleAction:', error);
//       setAlertMessage('Failed to process request.');
//       setAlertModal(true);

//       return {success: false};
//     }
//   };

//   const handleSave = async actionType => {
//     if (processingButton) return;
//     if (!validate()) return;

//     setProcessingButton(actionType);
//     setIsProcessing(true);

//     console.log('Form Data : ', formData);
//     try {
//       const result = await handleAction(
//         mode === 'edit' ? 'edit' : 'create',
//         formData,
//       );
//       console.log('Resut', result);
//       if (result.success) {
//         setTimeout(() => {
//           setAlertModal(false);
//           setFormData(createInitialFormData());
//           navigation.navigate('FamilyContact_ListPage', {
//             employeeId: formData.employeeId,
//             employeeName: formData.employeeName,
//             WorkerRecId: formData.WorkerRecId,
//             userData: route.params?.userData || {
//               employeeId: formData.employeeId,
//               employeeName: formData.employeeName,
//               WorkerRecId: formData.WorkerRecId,
//             },
//             highlightRecId: result.recId,
//             cameFrom: originalCameFrom || 'DisplayListPage',
//           });
//         }, 1500);
//       }
//     } finally {
//       setProcessingButton('');
//       setIsProcessing(false);
//     }
//   };

//   const toggleSwitch = field => {
//     setFormData(prev => ({
//       ...prev,
//       [field]: !prev[field],
//     }));
//   };

//   const onValidFromDateChange = (event, selectedDate) => {
//     setShowValidFromPicker(Platform.OS === 'ios');
//     if (selectedDate) {
//       handleInputChange('beneficiaryValidFrom', selectedDate.toISOString());
//     }
//   };

//   const onValidToDateChange = (event, selectedDate) => {
//     setShowValidToPicker(Platform.OS === 'ios');
//     if (selectedDate) {
//       handleInputChange('beneficiaryValidTo', selectedDate.toISOString());
//     }
//   };
//   const onDependentValidFromChange = (event, selectedDate) => {
//     setShowDependentValidFromPicker(Platform.OS === 'ios');
//     if (selectedDate) {
//       handleInputChange('dependentValidFrom', selectedDate.toISOString());
//     }
//   };

//   const onDependentValidToChange = (event, selectedDate) => {
//     setShowDependentValidToPicker(Platform.OS === 'ios');
//     if (selectedDate) {
//       handleInputChange('dependentValidTo', selectedDate.toISOString());
//     }
//   };

//   return (
//     <ActionPaneContainer
//       pageTitle={
//         mode === 'edit' ? 'Edit Personal Contact' : 'Create Personal Contact'
//       }
//       isBackButton={true}
//       showFooter={false}
//       isHeaderActive={true}
//       onBackPress={goBack}
//       onRefresh={handleRefresh}>
//       {/* 1️⃣ Show loader ONLY */}
//       {isLoading && <CustomIndicator />}

//       {/* 2️⃣ Show screen ONLY when NOT loading */}
//       {!isLoading && (
//         <SafeAreaView style={styles.LReqSR_SafeArea}>
//           <KeyboardAvoidingView
//             behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//             style={styles.LReqSR_ContentWrapper}
//             keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
//             {isProcessing && (
//               <View style={styles.LReqSR_ProcessingOverlay}>
//                 <View style={styles.LReqSR_ProcessingContainer}>
//                   <ActivityIndicator size="large" color="#0A66C2" />
//                   <Text style={styles.LReqSR_ProcessingText}>
//                     {t('common.processing')}
//                   </Text>
//                 </View>
//               </View>
//             )}
//             <ScrollView
//               ref={scrollViewRef}
//               contentContainerStyle={styles.LReqSR_FormContainer}
//               showsVerticalScrollIndicator={false}
//               keyboardShouldPersistTaps="handled">
//               <Text style={[styles.LReqSR_Label, isRTL && {textAlign: 'left'}]}>
//                 {PersonalContactsLabelData?.firstNamelbl || 'First Name'}
//               </Text>
//               <TextInput
//                 style={styles.LReqSR_Input}
//                 value={formData.firstName}
//                 onChangeText={t => handleInputChange('firstName', t)}
//                 placeholder="Enter First Name"
//                 placeholderTextColor="#888"
//               />

//               <Text style={[styles.LReqSR_Label, isRTL && {textAlign: 'left'}]}>
//                 {PersonalContactsLabelData?.lastNamelbl || 'Last Name '}
//               </Text>
//               <TextInput
//                 style={styles.LReqSR_Input}
//                 value={formData.lastName}
//                 onChangeText={t => handleInputChange('lastName', t)}
//                 placeholder="Enter Last Name"
//                 placeholderTextColor="#888"
//               />

//               <Text style={[styles.LReqSR_Label, isRTL && {textAlign: 'left'}]}>
//                 {PersonalContactsLabelData?.RelationShipTypeIdlbl ||
//                   'Relationship '}
//               </Text>
//               <Dropdown
//                 style={styles.LReqSR_Input}
//                 data={relationshipTypes}
//                 labelField="label"
//                 valueField="value"
//                 placeholder="Select Relationship"
//                 value={formData.relationship}
//                 onChange={item => handleInputChange('relationship', item.value)}
//                 search
//                 searchPlaceholder="Search Relationship"
//                 placeholderStyle={styles.LReqSR_DropdownPlaceholder}
//                 selectedTextStyle={styles.LReqSR_DropdownSelectedText}
//                 itemTextStyle={styles.LReqSR_DropdownItemText}
//                 activeColor="#E6F0FF"
//                 containerStyle={[
//                   styles.LReqSR_DropdownContainer,
//                   {marginTop: Platform.OS === 'ios' ? 5 : 2, zIndex: 1000},
//                 ]}
//                 itemContainerStyle={styles.LReqSR_DropdownItemContainer}
//                 maxHeight={280}
//                 dropdownPosition="auto"
//               />
//               <View style={{marginTop: 24, paddingHorizontal: 8}}>
//                 {/* Emergency Contact */}
//                 <View
//                   style={{
//                     flexDirection: 'row',
//                     alignItems: 'center',
//                     justifyContent: 'space-between',
//                     backgroundColor: '#f9f9f9',
//                     paddingVertical: 14,
//                     paddingHorizontal: 16,
//                     borderRadius: 12,
//                     marginBottom: 12,
//                   }}>
//                   <Text
//                     style={[styles.LReqSR_Label, isRTL && {textAlign: 'left'}]}>
//                     {PersonalContactsLabelData?.EmergencyContactlbl ||
//                       'Emergency Contact'}
//                   </Text>

//                   <Switch
//                     value={formData.EmergencyContact}
//                     onValueChange={() => toggleSwitch('EmergencyContact')}
//                     trackColor={{false: '#767577', true: '#81b0ff'}}
//                     thumbColor={
//                       formData.EmergencyContact ? '#2196F3' : '#f4f3f4'
//                     }
//                   />
//                 </View>

//                 {/* Beneficiary */}
//                 {/* <View
//                   style={{
//                     flexDirection: 'row',
//                     alignItems: 'center',
//                     justifyContent: 'space-between',
//                     backgroundColor: '#f9f9f9',
//                     paddingVertical: 14,
//                     paddingHorizontal: 16,
//                     borderRadius: 12,
//                     marginBottom: 12,
//                   }}>
//                   <Text
//                     style={{
//                       fontSize: 16,
//                       color: '#000',
//                       fontWeight: '500',
//                     }}>
//                     Beneficiary
//                   </Text>

//                   <Switch
//                     value={formData.isBeneficiary}
//                     onValueChange={() => toggleSwitch('isBeneficiary')}
//                     trackColor={{false: '#767577', true: '#81b0ff'}}
//                     thumbColor={formData.isBeneficiary ? '#2196F3' : '#f4f3f4'}
//                   />
//                 </View> */}
//                 <View
//                   style={{
//                     flexDirection: 'row',
//                     alignItems: 'center',
//                     justifyContent: 'space-between',
//                     backgroundColor: '#f9f9f9',
//                     paddingVertical: 14,
//                     paddingHorizontal: 16,
//                     borderTopLeftRadius: 12,
//                     borderTopRightRadius: 12,
//                     borderBottomLeftRadius: formData.isBeneficiary ? 0 : 12,
//                     borderBottomRightRadius: formData.isBeneficiary ? 0 : 12,
//                     marginBottom: formData.isBeneficiary ? 0 : 12,
//                   }}>
//                   <Text
//                     style={[styles.LReqSR_Label, isRTL && {textAlign: 'left'}]}>
//                     {PersonalContactsLabelData?.isBeneficiarylbl ||
//                       'Beneficiary'}
//                   </Text>

//                   <Switch
//                     value={formData.isBeneficiary}
//                     onValueChange={() => toggleSwitch('isBeneficiary')}
//                     trackColor={{false: '#767577', true: '#81b0ff'}}
//                     thumbColor={formData.isBeneficiary ? '#2196F3' : '#f4f3f4'}
//                   />
//                 </View>

//                 {/* Beneficiary Date Fields */}
//                 {formData.isBeneficiary && (
//                   <View
//                     style={{
//                       backgroundColor: '#f9f9f9',
//                       paddingHorizontal: 16,
//                       paddingTop: 8,
//                       paddingBottom: 14,
//                       borderBottomLeftRadius: 12,
//                       borderBottomRightRadius: 12,
//                       marginBottom: 12,
//                       borderTopWidth: 1,
//                       borderTopColor: '#e0e0e0',
//                     }}>
//                     {/* Valid From */}

//                     <Text
//                       style={[
//                         styles.LReqSR_Label,
//                         isRTL && {textAlign: 'left'},
//                       ]}>
//                       {PersonalContactsLabelData?.BeneficiaryFromDatelbl ||
//                         ' Valid From'}
//                     </Text>
//                     <TouchableOpacity
//                       style={[
//                         styles.LReqSR_Input,
//                         {
//                           flexDirection: 'row', // Makes children align horizontally
//                           alignItems: 'center', // Centers items vertically
//                           justifyContent: 'space-between', // Pushes items to edges
//                           paddingHorizontal: 12,
//                         },
//                       ]}
//                       onPress={() => setShowValidFromPicker(true)}>
//                       <Text
//                         style={{
//                           color: formData.beneficiaryValidFrom
//                             ? '#000'
//                             : '#888',
//                           fontSize: 16,
//                         }}>
//                         {formData.beneficiaryValidFrom
//                           ? formatDisplayDate(formData.beneficiaryValidFrom)
//                           : formatDisplayDate(new Date().toISOString())}
//                       </Text>
//                       <Icon name="calendar" size={20} color="#04739cff" />
//                     </TouchableOpacity>

//                     {showValidFromPicker && (
//                       <DateTimePicker
//                         value={
//                           formData.beneficiaryValidFrom
//                             ? new Date(formData.beneficiaryValidFrom)
//                             : new Date()
//                         }
//                         mode="date"
//                         display={Platform.OS === 'ios' ? 'spinner' : 'default'}
//                         onChange={onValidFromDateChange}
//                       />
//                     )}

//                     {/* Valid To */}

//                     <Text
//                       style={[
//                         styles.LReqSR_Label,
//                         isRTL && {textAlign: 'left'},
//                       ]}>
//                       {PersonalContactsLabelData?.BeneficiaryToDatelbl ||
//                         'Valid To'}
//                     </Text>
//                     <TouchableOpacity
//                       style={[
//                         styles.LReqSR_Input,
//                         {
//                           flexDirection: 'row', // Makes children align horizontally
//                           alignItems: 'center', // Centers items vertically
//                           justifyContent: 'space-between', // Pushes items to edges
//                           paddingHorizontal: 12,
//                         },
//                       ]}
//                       onPress={() => setShowValidToPicker(true)}>
//                       <Text
//                         style={{
//                           color: formData.beneficiaryValidTo ? '#000' : '#888',
//                           fontSize: 16,
//                         }}>
//                         {formData.beneficiaryValidTo
//                           ? formatDisplayDate(formData.beneficiaryValidTo)
//                           : 'Never'}
//                       </Text>
//                       <Icon name="calendar" size={20} color="#04739cff" />
//                     </TouchableOpacity>

//                     {showValidToPicker && (
//                       <DateTimePicker
//                         value={
//                           formData.beneficiaryValidTo
//                             ? new Date(formData.beneficiaryValidTo)
//                             : new Date()
//                         }
//                         mode="date"
//                         display={Platform.OS === 'ios' ? 'spinner' : 'default'}
//                         onChange={onValidToDateChange}
//                         minimumDate={
//                           formData.beneficiaryValidFrom
//                             ? new Date(formData.beneficiaryValidFrom)
//                             : new Date()
//                         }
//                       />
//                     )}
//                   </View>
//                 )}

//                 {/* Dependent */}
//                 {formData.relationship !== 'FamilyContact' &&
//                   formData.relationship !== 'OtherContact' && (
//                     <View>
//                       <View
//                         style={{
//                           flexDirection: 'row',
//                           alignItems: 'center',
//                           justifyContent: 'space-between',
//                           backgroundColor: '#f9f9f9',
//                           paddingVertical: 14,
//                           paddingHorizontal: 16,
//                           borderTopLeftRadius: 12,
//                           borderTopRightRadius: 12,
//                           borderBottomLeftRadius: formData.isDependent ? 0 : 12,
//                           borderBottomRightRadius: formData.isDependent
//                             ? 0
//                             : 12,
//                           marginBottom: formData.isDependent ? 0 : 12,
//                         }}>
//                         <Text
//                           style={[
//                             styles.LReqSR_Label,
//                             isRTL && {textAlign: 'left'},
//                           ]}>
//                           {PersonalContactsLabelData?.isDependentlbl ||
//                             'Dependent'}
//                         </Text>

//                         <Switch
//                           value={formData.isDependent}
//                           onValueChange={() => toggleSwitch('isDependent')}
//                           trackColor={{false: '#767577', true: '#81b0ff'}}
//                           thumbColor={
//                             formData.isDependent ? '#2196F3' : '#f4f3f4'
//                           }
//                         />
//                       </View>

//                       {/* Conditional Fields - Extended Menu */}
//                       {formData.isDependent && (
//                         <View
//                           style={{
//                             backgroundColor: '#f9f9f9',
//                             paddingHorizontal: 16,
//                             paddingTop: 8,
//                             paddingBottom: 14,
//                             borderBottomLeftRadius: 12,
//                             borderBottomRightRadius: 12,
//                             marginBottom: 12,
//                             borderTopWidth: 1,
//                             borderTopColor: '#e0e0e0',
//                           }}>
//                           {/* Valid From */}

//                           <Text
//                             style={[
//                               styles.LReqSR_Label,
//                               isRTL && {textAlign: 'left'},
//                             ]}>
//                             {PersonalContactsLabelData?.dependentValidFromlbl ||
//                               'Valid From'}
//                           </Text>

//                           <TouchableOpacity
//                             style={[
//                               styles.LReqSR_Input,
//                               {
//                                 flexDirection: 'row', // Makes children align horizontally
//                                 alignItems: 'center', // Centers items vertically
//                                 justifyContent: 'space-between', // Pushes items to edges
//                                 paddingHorizontal: 12,
//                               },
//                             ]}
//                             onPress={() =>
//                               setShowDependentValidFromPicker(true)
//                             }>
//                             <View>
//                               <Text
//                                 style={{
//                                   color: formData.dependentValidFrom
//                                     ? '#000'
//                                     : '#888',
//                                   fontSize: 16,
//                                 }}>
//                                 {formData.dependentValidFrom
//                                   ? formatDisplayDate(
//                                       formData.dependentValidFrom,
//                                     )
//                                   : formatDisplayDate(new Date().toISOString())}
//                               </Text>
//                             </View>
//                             <Icon name="calendar" size={20} color="#04739cff" />
//                           </TouchableOpacity>
//                           {showDependentValidFromPicker && (
//                             <DateTimePicker
//                               value={
//                                 formData.dependentValidFrom
//                                   ? new Date(formData.dependentValidFrom)
//                                   : new Date()
//                               }
//                               mode="date"
//                               display={
//                                 Platform.OS === 'ios' ? 'spinner' : 'default'
//                               }
//                               onChange={onDependentValidFromChange}
//                             />
//                           )}

//                           {/* Valid To */}

//                           <Text
//                             style={[
//                               styles.LReqSR_Label,
//                               isRTL && {textAlign: 'left'},
//                             ]}>
//                             {PersonalContactsLabelData?.depndentValidTolbl ||
//                               'Valid To'}
//                           </Text>
//                           <TouchableOpacity
//                             style={[
//                               styles.LReqSR_Input,
//                               {
//                                 flexDirection: 'row', // Makes children align horizontally
//                                 alignItems: 'center', // Centers items vertically
//                                 justifyContent: 'space-between', // Pushes items to edges
//                                 paddingHorizontal: 12,
//                               },
//                             ]}
//                             onPress={() => setShowDependentValidToPicker(true)}>
//                             <Text
//                               style={{
//                                 color: formData.dependentValidTo
//                                   ? '#000'
//                                   : '#888',
//                                 fontSize: 16,
//                               }}>
//                               {formData.dependentValidTo
//                                 ? formatDisplayDate(formData.dependentValidTo)
//                                 : 'Never'}
//                             </Text>
//                             <Icon name="calendar" size={20} color="#04739cff" />
//                           </TouchableOpacity>
//                           {showDependentValidToPicker && (
//                             <DateTimePicker
//                               value={
//                                 formData.dependentValidTo
//                                   ? new Date(formData.dependentValidTo)
//                                   : new Date()
//                               }
//                               mode="date"
//                               display={
//                                 Platform.OS === 'ios' ? 'spinner' : 'default'
//                               }
//                               onChange={onDependentValidToChange}
//                               minimumDate={
//                                 formData.dependentValidFrom
//                                   ? new Date(formData.dependentValidFrom)
//                                   : new Date()
//                               }
//                             />
//                           )}
//                           {/* Gender Dropdown */}

//                           <Text
//                             style={[
//                               styles.LReqSR_Label,
//                               isRTL && {textAlign: 'left'},
//                             ]}>
//                             {PersonalContactsLabelData?.genderlbl || 'Gender'}
//                           </Text>
//                           <Dropdown
//                             style={styles.LReqSR_Input}
//                             data={[
//                               {label: 'Male', value: 'Male'},
//                               {label: 'Female', value: 'Female'},
//                               {label: 'Non-specific', value: 'Non-specific'},
//                             ]}
//                             labelField="label"
//                             valueField="value"
//                             placeholder="Select Gender"
//                             value={formData.Gender}
//                             onChange={item =>
//                               handleInputChange('Gender', item.value)
//                             }
//                             search
//                             searchPlaceholder="Search Gender"
//                             placeholderStyle={styles.LReqSR_DropdownPlaceholder}
//                             selectedTextStyle={
//                               styles.LReqSR_DropdownSelectedText
//                             }
//                             itemTextStyle={styles.LReqSR_DropdownItemText}
//                             activeColor="#E6F0FF"
//                             containerStyle={[
//                               styles.LReqSR_DropdownContainer,
//                               {marginTop: 4, zIndex: 1000},
//                             ]}
//                             itemContainerStyle={
//                               styles.LReqSR_DropdownItemContainer
//                             }
//                             maxHeight={180}
//                             dropdownPosition="auto"
//                           />

//                           {/* Birth Date */}

//                           <Text
//                             style={[
//                               styles.LReqSR_Label,
//                               isRTL && {textAlign: 'left'},
//                             ]}>
//                             {PersonalContactsLabelData?.birthDatelbl ||
//                               'Birth Date'}
//                           </Text>
//                           <TouchableOpacity
//                             style={[
//                               styles.LReqSR_Input,
//                               {
//                                 flexDirection: 'row', // Makes children align horizontally
//                                 alignItems: 'center', // Centers items vertically
//                                 justifyContent: 'space-between', // Pushes items to edges
//                                 paddingHorizontal: 12,
//                               },
//                             ]}
//                             onPress={() => setShowDatePicker(true)}>
//                             <Text
//                               style={{
//                                 color: formData.BirthDate ? '#000' : '#888',
//                                 fontSize: 16,
//                               }}>
//                               {formData.BirthDate
//                                 ? formatDisplayDate(formData.BirthDate)
//                                 : formatDisplayDate(new Date().toISOString())}
//                             </Text>
//                             <Icon name="calendar" size={20} color="#04739cff" />
//                           </TouchableOpacity>

//                           {showDatePicker && (
//                             <DateTimePicker
//                               value={
//                                 formData.BirthDate
//                                   ? new Date(formData.BirthDate)
//                                   : new Date()
//                               }
//                               mode="date"
//                               display={
//                                 Platform.OS === 'ios' ? 'spinner' : 'default'
//                               }
//                               onChange={onDateChange}
//                               maximumDate={new Date()}
//                             />
//                           )}

//                           {/* Full-time Student */}
//                           <View style={{marginTop: 12}}>
//                             <Text
//                               style={[
//                                 styles.LReqSR_Label,
//                                 isRTL && {textAlign: 'left'},
//                               ]}>
//                               {PersonalContactsLabelData?.isFullTimeStudentlbl ||
//                                 'Full-time Student'}
//                             </Text>
//                             <View style={{alignSelf: 'flex-start'}}>
//                               <Switch
//                                 value={formData.IsFullTimeStudent}
//                                 onValueChange={() =>
//                                   toggleSwitch('IsFullTimeStudent')
//                                 }
//                                 trackColor={{false: '#767577', true: '#81b0ff'}}
//                                 thumbColor={
//                                   formData.IsFullTimeStudent
//                                     ? '#2196F3'
//                                     : '#f4f3f4'
//                                 }
//                               />
//                             </View>
//                           </View>

//                           {/* Person with Disabilities */}
//                           <View style={{marginTop: 12}}>
//                             <Text
//                               style={[
//                                 styles.LReqSR_Label,
//                                 isRTL && {textAlign: 'left'},
//                               ]}>
//                               {PersonalContactsLabelData?.isPersonWithDisabilitieslbl ||
//                                 'Person with Disabilities'}
//                             </Text>
//                             <View style={{alignSelf: 'flex-start'}}>
//                               <Switch
//                                 value={formData.IsPersonWithDisabilities}
//                                 onValueChange={() =>
//                                   toggleSwitch('IsPersonWithDisabilities')
//                                 }
//                                 trackColor={{false: '#767577', true: '#81b0ff'}}
//                                 thumbColor={
//                                   formData.IsPersonWithDisabilities
//                                     ? '#2196F3'
//                                     : '#f4f3f4'
//                                 }
//                               />
//                             </View>
//                           </View>
//                         </View>
//                       )}
//                     </View>
//                   )}
//               </View>
//             </ScrollView>

//             <SaveRecordButtons
//               mode={mode}
//               processingButton={processingButton}
//               onSave={handleSave}
//               onCancel={goBack}
//               isDisabled={
//                 processingButton === 'create' || processingButton === 'submit'
//               }
//               showButtons={[BUTTON_TYPES.CREATE, BUTTON_TYPES.CANCEL]}
//             />
//           </KeyboardAvoidingView>

//           <AlertModal
//             visible={alertModal}
//             heading="Alert"
//             text={alertMessage}
//             onPress={() => setAlertModal(false)}
//           />
//         </SafeAreaView>
//       )}
//     </ActionPaneContainer>
//   );
// };

// export default FamilyContact_SaveRecord;

/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable curly */
/* eslint-disable react-native/no-inline-styles */

import React, {useState, useCallback, useRef, useEffect, useMemo} from 'react';
import {
  Text,
  TextInput,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Switch,
  View,
  TouchableOpacity,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {Dropdown} from 'react-native-element-dropdown';
import DateTimePicker from '@react-native-community/datetimepicker';
import {translate as t} from '../../../../store/utils/translate';
import Icon from 'react-native-vector-icons/FontAwesome';

import ActionPaneContainer from '../../../../components/ActionPaneContainer';
import SaveRecordButtons from '../../../../components/Buttons/SaveRecordButtons';
import CustomIndicator from '../../../../components/CustomIndicator/CustomIndicator';
import AlertModal from '../../../../components/Alert/AlertModal';
import CalendarModal from '../../../../components/Leaves/CalendarModal';
import {BUTTON_TYPES} from '../../../../components/Buttons/SaveRecordButtons';

import {retrieveRelationshipTypeId} from '../../../../API/PersonalInformation/FamilyContacts/retrieveRelationshipTypeId';
import {FamilyContactCreate} from '../../../../API/PersonalInformation/FamilyContacts/FamilyContactCreate';
import {FamilyContactUpdate} from '../../../../API/PersonalInformation/FamilyContacts/FamilyContactUpdate';
import {getpersonalContactLabels} from '../../../../API/PersonalInformation/FamilyContacts/GetPersonalContactsLabels';

import styles from '../../../../styles/styles';
import {borderRadius, spacing} from '../../../../store/utils/scaling';

const FamilyContact_SaveRecord = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);
  const isRTL = useSelector(state => state.language.isRTL);
  const userData = useSelector(state => state.user.userData);
  const routeUserData = route.params?.userData;
  const effectiveUserData = routeUserData || userData || {};
  const [PersonalContactsLabelData, setPersonalContactsLabelsData] = useState(
    {},
  );

  const routeParams = useMemo(() => route.params || {}, [route.params]);

  const {
    mode = 'create',
    familyContactDataSet = {},
    employeeId = familyContactDataSet.employeeId ||
      effectiveUserData?.employeeId ||
      '',
    employeeName = familyContactDataSet.employeeName ||
      effectiveUserData?.employeeName ||
      '',
    WorkerRecId = familyContactDataSet.WorkerRecId ||
      effectiveUserData?.WorkerRecId ||
      '',
    cameFrom,
    originalCameFrom,
  } = routeParams;

  const today = new Date().toISOString().split('T')[0];
  const D365_MAX_DATE = '2154-12-31T23:59:59Z';
  const D365_MIN_DATE = '1900-01-01';

  const createInitialFormData = useCallback(
    () => ({
      recId:
        !familyContactDataSet?.RecId || familyContactDataSet.RecId === '0'
          ? ''
          : familyContactDataSet.RecId,
      employeeId,
      employeeName,
      WorkerRecId,
      firstName: '',
      lastName: '',
      relationship: '',
      EmergencyContact: false,
      isBeneficiary: false,
      isDependent: false,
      Gender: '',
      BirthDate: today,
      IsFullTimeStudent: false,
      IsPersonWithDisabilities: false,
      WorkflowOperation: '',
      beneficiaryValidFrom: today,
      dependentValidFrom: today,
      beneficiaryValidTo: '',
      dependentValidTo: '',
    }),
    [employeeId, employeeName, WorkerRecId, familyContactDataSet?.RecId, today],
  );

  const [relationshipTypes, setRelationshipTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [processingButton, setProcessingButton] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [datePickerConfig, setDatePickerConfig] = useState({
    visible: false,
    field: '',
    value: new Date(),
    minDate: null,
    maxDate: null,
  });
  const [formData, setFormData] = useState(createInitialFormData());

  const fetchPersonalContactsLabels = useCallback(async () => {
    try {
      const labels = await getpersonalContactLabels();
      return labels || {};
    } catch (error) {
      console.error('Error fetching Personal Contacts labels:', error);
      return {};
    }
  }, []);

  const normalizeD365Date = useCallback(
    dateString => {
      if (!dateString) return '';
      if (
        dateString.startsWith(D365_MAX_DATE) ||
        dateString.startsWith(D365_MIN_DATE)
      ) {
        return '';
      }
      return dateString;
    },
    [D365_MAX_DATE, D365_MIN_DATE],
  );

  const goBack = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'FamilyContact_ListPage',
          params: {
            employeeId,
            employeeName,
            WorkerRecId,
            cameFrom: originalCameFrom || 'DisplayListPage',
          },
        },
      ],
    });
  }, [navigation, employeeId, employeeName, WorkerRecId, originalCameFrom]);

  const toBoolean = useCallback(value => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      return lower === 'true' || lower === '1' || lower === 'yes';
    }
    return false;
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const initializeForm = async () => {
        setIsLoading(true);

        try {
          const [labels, relationshipRes] = await Promise.all([
            fetchPersonalContactsLabels(),
            retrieveRelationshipTypeId(),
          ]);

          if (!isActive) return;

          setPersonalContactsLabelsData(labels);

          if (Array.isArray(relationshipRes)) {
            setRelationshipTypes(relationshipRes);
          }

          if (mode === 'create') {
            setFormData(createInitialFormData());
            setAlertMessage('');
          } else if (mode === 'edit' && familyContactDataSet?.RecId) {
            console.log('Edit Data :', familyContactDataSet);
            const fullName = familyContactDataSet.Name || '';

            setFormData(prev => ({
              ...prev,
              recId: familyContactDataSet.RecId,
              firstName: familyContactDataSet.FirstName,
              middleName: familyContactDataSet.MiddleName,
              lastName: familyContactDataSet.LastName,
              relationship: familyContactDataSet.RelationShipTypeId || '',
              EmergencyContact: toBoolean(
                familyContactDataSet.EmergencyContact,
              ),
              isBeneficiary: toBoolean(familyContactDataSet.isBeneficiary),
              isDependent: toBoolean(familyContactDataSet.isDependent),
              Gender: familyContactDataSet.Gender || '',
              BirthDate: familyContactDataSet.BirthDate || today,
              beneficiaryValidFrom:
                normalizeD365Date(familyContactDataSet.BeneficiaryFromDate) ||
                today,
              beneficiaryValidTo: normalizeD365Date(
                familyContactDataSet.BeneficiaryToDate,
              ),
              dependentValidFrom:
                normalizeD365Date(familyContactDataSet.DependentValidFrom) ||
                today,
              dependentValidTo: normalizeD365Date(
                familyContactDataSet.DependentValidTo,
              ),
              IsFullTimeStudent: toBoolean(
                familyContactDataSet.IsFullTimeStudent,
              ),
              IsPersonWithDisabilities: toBoolean(
                familyContactDataSet.IsPersonWithDisabilities,
              ),
              employeeId: familyContactDataSet.employeeId || employeeId,
              employeeName: familyContactDataSet.employeeName || employeeName,
              WorkerRecId: familyContactDataSet.WorkerRecId || WorkerRecId,
            }));
          }
        } catch (error) {
          console.error('Error initializing Family Contact form:', error);
          setAlertMessage('Failed to load Family Contact screen');
          setAlertModal(true);
        } finally {
          if (isActive) setIsLoading(false);
        }
      };

      initializeForm();

      return () => {
        isActive = false;
      };
    }, [
      mode,
      familyContactDataSet,
      employeeId,
      employeeName,
      WorkerRecId,
      fetchPersonalContactsLabels,
      createInitialFormData,
      toBoolean,
      normalizeD365Date,
      today,
    ]),
  );

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        goBack();
        return true;
      };
      const sub = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );
      return () => sub.remove();
    }, [goBack]),
  );

  useFocusEffect(
    useCallback(
      () => scrollViewRef.current?.scrollTo({y: 0, animated: false}),
      [],
    ),
  );

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      setFormData(createInitialFormData());
    } finally {
      setIsLoading(false);
    }
  }, [createInitialFormData]);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({...prev, [field]: value}));
  }, []);

  const convertDateFormat = useCallback(
    date => (date ? new Date(date).toISOString().split('T')[0] : null),
    [],
  );

  const formatDisplayDate = useCallback(dateString => {
    if (!dateString) return '';
    const d = new Date(dateString);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  }, []);

  const showDatePicker = useCallback(
    (field, currentValue, minDate = null, maxDate = null) => {
      setDatePickerConfig({
        visible: true,
        field,
        value: currentValue ? new Date(currentValue) : new Date(),
        minDate: minDate ? new Date(minDate) : null,
        maxDate: maxDate ? new Date(maxDate) : null,
      });
    },
    [],
  );

  const handleDateChange = useCallback(
    (event, selectedDate) => {
      setDatePickerConfig(prev => ({...prev, visible: Platform.OS === 'ios'}));

      if (selectedDate && datePickerConfig.field) {
        handleInputChange(
          datePickerConfig.field,
          convertDateFormat(selectedDate),
        );
      }
    },
    [datePickerConfig.field, handleInputChange, convertDateFormat],
  );

  const validate = useCallback(() => {
    const missing = [];
    if (!formData.firstName.trim()) missing.push('First Name');
    if (!formData.relationship) missing.push('Relationship');
    if (missing.length) {
      setAlertMessage(
        'Please fill in the following required fields:\n' + missing.join('\n'),
      );
      setAlertModal(true);
      return false;
    }
    return true;
  }, [formData.firstName, formData.relationship]);

  const handleAction = useCallback(async (mode, data) => {
    try {
      const contract = {
        RecId: Number(data.recId || 0),
        FirstName: data.firstName,
        MiddleName: data.middleName,
        LastName: data.lastName,
        Name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
        EmployeeId: data.employeeId || '',
        RelationShipTypeId: data.relationship || '',
        EmergencyContact: data.EmergencyContact ? 1 : 0,
        isDependent: data.isDependent ? 1 : 0,
        isBeneficiary: data.isBeneficiary ? 1 : 0,
        BeneficiaryFromDate:
          data.beneficiaryValidFrom || '1900-01-01T00:00:00.000Z',
        BeneficiaryToDate: data.beneficiaryValidTo
          ? data.beneficiaryValidTo
          : '2154-12-31T23:59:59.000Z',
        Gender: data.Gender || '',
        BirthDate: data.BirthDate || '1900-01-01T00:00:00.000Z',
        DependentValidFrom:
          data.dependentValidFrom || '1900-01-01T00:00:00.000Z',
        DependentValidTo: data.dependentValidTo
          ? data.dependentValidTo
          : '2154-12-31T23:59:59.000Z',
        IsFullTimeStudent: data.IsFullTimeStudent ? 1 : 0,
        IsPersonWithDisabilities: data.IsPersonWithDisabilities ? 1 : 0,
        Worker: Number(data.WorkerRecId) || 0,
        ApprovalStatus: 'Draft',
        WorkflowOperation: mode === 'edit' ? 'Update' : 'Create',
      };

      let response;
      if (mode === 'create') {
        response = await FamilyContactCreate({
          familyContactDataSet: contract,
        });
      } else if (mode === 'edit') {
        response = await FamilyContactUpdate({
          familyContactDataSet: contract,
        });
      }

      if (!response) {
        throw new Error('No response from server');
      }

      const actionText = mode === 'edit' ? 'Updated' : 'Created';
      setAlertMessage(`Personal Contact is ${actionText} Successfully`);
      setAlertModal(true);

      return {
        success: true,
        recId: response.RecId || contract.RecId,
      };
    } catch (error) {
      console.error('Error in handleAction:', error);
      setAlertMessage('Failed to process request.');
      setAlertModal(true);
      return {success: false};
    }
  }, []);

  const handleSave = useCallback(
    async actionType => {
      if (processingButton) return;
      if (!validate()) return;

      setProcessingButton(actionType);
      setIsProcessing(true);

      try {
        const result = await handleAction(
          mode === 'edit' ? 'edit' : 'create',
          formData,
        );
        if (result.success) {
          setTimeout(() => {
            setAlertModal(false);
            setFormData(createInitialFormData());
            navigation.navigate('FamilyContact_ListPage', {
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
          }, 1500);
        }
      } finally {
        setProcessingButton('');
        setIsProcessing(false);
      }
    },
    [
      processingButton,
      validate,
      handleAction,
      mode,
      formData,
      createInitialFormData,
      navigation,
      route.params?.userData,
      originalCameFrom,
    ],
  );

  const toggleSwitch = useCallback(field => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  }, []);

  return (
    <ActionPaneContainer
      pageTitle={
        mode === 'edit' ? 'Edit Personal Contact' : 'Create Personal Contact'
      }
      isBackButton={true}
      showFooter={false}
      isHeaderActive={true}
      onBackPress={goBack}
      onRefresh={handleRefresh}>
      {isLoading && <CustomIndicator />}

      {!isLoading && (
        <SafeAreaView style={styles.DSR_SafeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.DSR_ContentWrapper}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
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
              <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
                {PersonalContactsLabelData?.firstNamelbl || 'First Name *'}
              </Text>
              <TextInput
                style={styles.DSR_Input}
                value={formData.firstName}
                onChangeText={t => handleInputChange('firstName', t)}
                placeholder="Enter First Name"
                placeholderTextColor="#888"
              />
              <Text style={[styles.LReqSR_Label, isRTL && {textAlign: 'left'}]}>
                {PersonalContactsLabelData?.middleNamelbl || 'Middle Name'}
              </Text>
              <TextInput
                style={styles.LReqSR_Input}
                value={formData.middleName}
                onChangeText={t => handleInputChange('middleName', t)}
                placeholder="Enter Middle Name"
                placeholderTextColor="#888"
              />
              <Text style={[styles.LReqSR_Label, isRTL && {textAlign: 'left'}]}>
                {PersonalContactsLabelData?.lastNamelbl || 'Last Name '}
              </Text>
              <TextInput
                style={styles.DSR_Input}
                value={formData.lastName}
                onChangeText={t => handleInputChange('lastName', t)}
                placeholder="Enter Last Name"
                placeholderTextColor="#888"
              />

              <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
                {PersonalContactsLabelData?.RelationShipTypeIdlbl ||
                  'Relationship *'}
              </Text>
              <Dropdown
                style={styles.DSR_Input}
                data={relationshipTypes}
                labelField="label"
                valueField="value"
                placeholder="Select Relationship"
                value={formData.relationship}
                onChange={item => handleInputChange('relationship', item.value)}
                search
                searchPlaceholder="Search Relationship"
                placeholderStyle={styles.DSR_DropdownPlaceholder}
                selectedTextStyle={styles.DSR_DropdownSelectedText}
                itemTextStyle={styles.DSR_DropdownItemText}
                activeColor="#E6F0FF"
                containerStyle={[
                  styles.DSR_DropdownContainer,
                  {marginTop: Platform.OS === 'ios' ? 5 : 2, zIndex: 1000},
                ]}
                itemContainerStyle={styles.DSR_DropdownItemContainer}
                maxHeight={280}
                dropdownPosition="auto"
              />

              <View style={{marginTop: 24, paddingHorizontal: 8}}>
                {/* Emergency Contact */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#f9f9f9',
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    borderRadius: 12,
                    marginBottom: 12,
                  }}>
                  <Text
                    style={[styles.LReqSR_Label, isRTL && {textAlign: 'left'}]}>
                    {PersonalContactsLabelData?.EmergencyContactlbl ||
                      'Emergency Contact'}
                  </Text>
                  <Switch
                    value={formData.EmergencyContact}
                    onValueChange={() => toggleSwitch('EmergencyContact')}
                    trackColor={{false: '#767577', true: '#81b0ff'}}
                    thumbColor={
                      formData.EmergencyContact ? '#2196F3' : '#f4f3f4'
                    }
                  />
                </View>

                {/* Beneficiary */}
                <View
                  style={[
                    styles.DSR_SwitchRow,
                    !formData.isBeneficiary && {
                      borderBottomLeftRadius: borderRadius.md,
                      borderBottomRightRadius: borderRadius.md,
                    },
                  ]}>
                  <Text style={styles.DSR_SwitchLabel}>
                    {PersonalContactsLabelData?.isBeneficiarylbl ||
                      'Beneficiary'}
                  </Text>
                  <Switch
                    value={formData.isBeneficiary}
                    onValueChange={() => toggleSwitch('isBeneficiary')}
                    trackColor={{false: '#767577', true: '#81b0ff'}}
                    thumbColor={formData.isBeneficiary ? '#2196F3' : '#f4f3f4'}
                  />
                </View>

                {formData.isBeneficiary && (
                  <View
                    style={{
                      backgroundColor: '#f9f9f9',
                      paddingHorizontal: 16,
                      paddingTop: 8,
                      paddingBottom: 14,
                      borderBottomLeftRadius: 12,
                      borderBottomRightRadius: 12,
                      marginBottom: 12,
                      borderTopWidth: 1,
                      borderTopColor: '#e0e0e0',
                    }}>
                    {/* Valid From */}
                    <Text
                      style={[
                        styles.LReqSR_Label,
                        isRTL && {textAlign: 'left'},
                      ]}>
                      {PersonalContactsLabelData?.BeneficiaryFromDatelbl ||
                        'Valid From'}
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.LReqSR_Input,
                        {
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingHorizontal: 12,
                        },
                      ]}
                      onPress={() =>
                        showDatePicker(
                          'beneficiaryValidFrom',
                          formData.beneficiaryValidFrom,
                        )
                      }>
                      <Text
                        style={{
                          color: formData.beneficiaryValidFrom
                            ? '#000'
                            : '#888',
                          fontSize: 16,
                        }}>
                        {formData.beneficiaryValidFrom
                          ? formatDisplayDate(formData.beneficiaryValidFrom)
                          : formatDisplayDate(new Date().toISOString())}
                      </Text>
                      <Icon name="calendar" size={20} color="#04739cff" />
                    </TouchableOpacity>

                    {/* Valid To */}
                    <Text
                      style={[
                        styles.LReqSR_Label,
                        isRTL && {textAlign: 'left'},
                      ]}>
                      {PersonalContactsLabelData?.BeneficiaryToDatelbl ||
                        'Valid To'}
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.LReqSR_Input,
                        {
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingHorizontal: 12,
                        },
                      ]}
                      onPress={() =>
                        showDatePicker(
                          'beneficiaryValidTo',
                          formData.beneficiaryValidTo,
                          formData.beneficiaryValidFrom,
                        )
                      }>
                      <Text
                        style={{
                          color: formData.beneficiaryValidTo ? '#000' : '#888',
                          fontSize: 16,
                        }}>
                        {formData.beneficiaryValidTo
                          ? formatDisplayDate(formData.beneficiaryValidTo)
                          : 'Never'}
                      </Text>
                      <Icon name="calendar" size={20} color="#04739cff" />
                    </TouchableOpacity>
                  </View>
                )}

                {formData.relationship !== 'FamilyContact' &&
                  formData.relationship !== 'OtherContact' && (
                    <View>
                      <View
                        style={[
                          styles.DSR_SwitchRow,
                          !formData.isDependent && {
                            borderBottomLeftRadius: borderRadius.md,
                            borderBottomRightRadius: borderRadius.md,
                          },
                        ]}>
                        <Text style={styles.DSR_SwitchLabel}>
                          {PersonalContactsLabelData?.isDependentlbl ||
                            'Dependent'}
                        </Text>
                        <Switch
                          value={formData.isDependent}
                          onValueChange={() => toggleSwitch('isDependent')}
                          trackColor={{false: '#767577', true: '#81b0ff'}}
                          thumbColor={
                            formData.isDependent ? '#2196F3' : '#f4f3f4'
                          }
                        />
                      </View>

                      {formData.isDependent && (
                        <View
                          style={{
                            backgroundColor: '#f9f9f9',
                            paddingHorizontal: 16,
                            paddingTop: 8,
                            paddingBottom: 14,
                            borderBottomLeftRadius: 12,
                            borderBottomRightRadius: 12,
                            marginBottom: 12,
                            borderTopWidth: 1,
                            borderTopColor: '#e0e0e0',
                          }}>
                          {/* Valid From */}
                          <Text
                            style={[
                              styles.LReqSR_Label,
                              isRTL && {textAlign: 'left'},
                            ]}>
                            {PersonalContactsLabelData?.dependentValidFromlbl ||
                              'Valid From'}
                          </Text>
                          <TouchableOpacity
                            style={[
                              styles.LReqSR_Input,
                              {
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                paddingHorizontal: 12,
                              },
                            ]}
                            onPress={() =>
                              showDatePicker(
                                'dependentValidFrom',
                                formData.dependentValidFrom,
                              )
                            }>
                            <Text
                              style={{
                                color: formData.dependentValidFrom
                                  ? '#000'
                                  : '#888',
                                fontSize: 16,
                              }}>
                              {formData.dependentValidFrom
                                ? formatDisplayDate(formData.dependentValidFrom)
                                : formatDisplayDate(new Date().toISOString())}
                            </Text>
                            <Icon name="calendar" size={20} color="#04739cff" />
                          </TouchableOpacity>

                          {/* Valid To */}
                          <Text
                            style={[
                              styles.LReqSR_Label,
                              isRTL && {textAlign: 'left'},
                            ]}>
                            {PersonalContactsLabelData?.depndentValidTolbl ||
                              'Valid To'}
                          </Text>
                          <TouchableOpacity
                            style={[
                              styles.LReqSR_Input,
                              {
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                paddingHorizontal: 12,
                              },
                            ]}
                            onPress={() =>
                              showDatePicker(
                                'dependentValidTo',
                                formData.dependentValidTo,
                                formData.dependentValidFrom,
                              )
                            }>
                            <Text
                              style={{
                                color: formData.dependentValidTo
                                  ? '#000'
                                  : '#888',
                                fontSize: 16,
                              }}>
                              {formData.dependentValidTo
                                ? formatDisplayDate(formData.dependentValidTo)
                                : 'Never'}
                            </Text>
                            <Icon name="calendar" size={20} color="#04739cff" />
                          </TouchableOpacity>

                          {/* Gender Dropdown */}
                          <Text
                            style={[
                              styles.LReqSR_Label,
                              isRTL && {textAlign: 'left'},
                            ]}>
                            {PersonalContactsLabelData?.genderlbl || 'Gender'}
                          </Text>
                          <Dropdown
                            style={styles.DSR_Input}
                            data={[
                              {label: 'Male', value: 'Male'},
                              {label: 'Female', value: 'Female'},
                              {label: 'Non-specific', value: 'Non-specific'},
                            ]}
                            labelField="label"
                            valueField="value"
                            placeholder="Select Gender"
                            value={formData.Gender}
                            onChange={item =>
                              handleInputChange('Gender', item.value)
                            }
                            search
                            searchPlaceholder="Search Gender"
                            placeholderStyle={styles.DSR_DropdownPlaceholder}
                            selectedTextStyle={styles.DSR_DropdownSelectedText}
                            itemTextStyle={styles.DSR_DropdownItemText}
                            activeColor="#E6F0FF"
                            containerStyle={[
                              styles.DSR_DropdownContainer,
                              {marginTop: 4, zIndex: 1000},
                            ]}
                            itemContainerStyle={
                              styles.DSR_DropdownItemContainer
                            }
                            maxHeight={180}
                            dropdownPosition="auto"
                          />

                          {/* Birth Date */}
                          <Text
                            style={[
                              styles.LReqSR_Label,
                              isRTL && {textAlign: 'left'},
                            ]}>
                            {PersonalContactsLabelData?.birthDatelbl ||
                              'Birth Date'}
                          </Text>
                          <TouchableOpacity
                            style={[
                              styles.LReqSR_Input,
                              {
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                paddingHorizontal: 12,
                              },
                            ]}
                            onPress={() =>
                              showDatePicker(
                                'BirthDate',
                                formData.BirthDate,
                                null,
                                new Date(),
                              )
                            }>
                            <Text
                              style={{
                                color: formData.BirthDate ? '#000' : '#888',
                                fontSize: 16,
                              }}>
                              {formData.BirthDate
                                ? formatDisplayDate(formData.BirthDate)
                                : formatDisplayDate(new Date().toISOString())}
                            </Text>
                            <Icon name="calendar" size={20} color="#04739cff" />
                          </TouchableOpacity>

                          <View style={{marginTop: spacing.md}}>
                            <Text style={styles.DSR_Label}>
                              {PersonalContactsLabelData?.isFullTimeStudentlbl ||
                                'Full-time Student'}
                            </Text>
                            <View style={{alignSelf: 'flex-start'}}>
                              <Switch
                                value={formData.IsFullTimeStudent}
                                onValueChange={() =>
                                  toggleSwitch('IsFullTimeStudent')
                                }
                                trackColor={{false: '#767577', true: '#81b0ff'}}
                                thumbColor={
                                  formData.IsFullTimeStudent
                                    ? '#2196F3'
                                    : '#f4f3f4'
                                }
                              />
                            </View>
                          </View>

                          <View style={{marginTop: spacing.md}}>
                            <Text style={styles.DSR_Label}>
                              {PersonalContactsLabelData?.isPersonWithDisabilitieslbl ||
                                'Person with Disabilities'}
                            </Text>
                            <View style={{alignSelf: 'flex-start'}}>
                              <Switch
                                value={formData.IsPersonWithDisabilities}
                                onValueChange={() =>
                                  toggleSwitch('IsPersonWithDisabilities')
                                }
                                trackColor={{false: '#767577', true: '#81b0ff'}}
                                thumbColor={
                                  formData.IsPersonWithDisabilities
                                    ? '#2196F3'
                                    : '#f4f3f4'
                                }
                              />
                            </View>
                          </View>
                        </View>
                      )}
                    </View>
                  )}
              </View>
            </ScrollView>

            <SaveRecordButtons
              mode={mode}
              processingButton={processingButton}
              onSave={handleSave}
              onCancel={goBack}
              isDisabled={
                processingButton === 'create' || processingButton === 'submit'
              }
              showButtons={[BUTTON_TYPES.CREATE, BUTTON_TYPES.CANCEL]}
            />
          </KeyboardAvoidingView>

          {/* Unified Date Picker */}
          {datePickerConfig.visible && (
            <DateTimePicker
              value={datePickerConfig.value}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              minimumDate={datePickerConfig.minDate}
              maximumDate={datePickerConfig.maxDate}
            />
          )}

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

export default FamilyContact_SaveRecord;
