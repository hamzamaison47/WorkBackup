/* eslint-disable react-hooks/exhaustive-deps */
// /* eslint-disable react-hooks/exhaustive-deps */
// import React, {useState, useEffect} from 'react';
// import {
//   View,
//   KeyboardAvoidingView,
//   ScrollView,
//   StyleSheet,
//   TouchableOpacity,
//   Platform,
//   Dimensions,
//   RefreshControl,
// } from 'react-native';
// import * as ImagePicker from 'react-native-image-picker';
// // import {useNavigation} from '@react-navigation/native';
// import {useSelector} from 'react-redux';

// // Components
// // import SectionHeader from '../../components/PersonalInformation/SectionHeader';
// // import ContactDetailsSection from '../../components/PersonalInformation/ContactDetailsSection';
// // import IdentificationDetailsSection from '../../components/PersonalInformation/IdentificationDetailsSection';
// import ProfilePictureEditor from '../../components/PersonalInformation/ProfilePictureEditor';
// import SaveButton from '../../components/PersonalInformation/SaveButton';
// // import ContactInfoModal from '../../components/PersonalInformation/ContactInfoModal';
// // import IdentificationInfoModal from '../../components/PersonalInformation/IdentificationInfoModal';
// import {AlertModal} from '../../components/Alert/AlertModal';
// import ActionPaneContainer from '../../components/ActionPaneContainer';
// import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';

// // API imports
// import {ProfilePicture} from '../../API/PersonalInformation/ProfilePicture/ProfilePicture';
// import {UpdateByEmployeeId} from '../../API/PersonalInformation/ProfilePicture/UpdateByEmployeeId';
// // import {ContactDetails} from '../../API/PersonalInformation/ContactDetails/ContactDetails';
// // import {IdentificationFindRequest} from '../../API/PersonalInformation/Identification/IdentificationFindRequest';
// // import {DeleteContactDetails} from '../../API/PersonalInformation/ContactDetails/DeleteContactDetails';
// // import {DeleteIdentityRequest} from '../../API/PersonalInformation/Identification/DeleteIdentityRequest';
// // import {CreateContactDetails} from '../../API/PersonalInformation/ContactDetails/CreateContactDetails';
// // import {UpdateContactDetails} from '../../API/PersonalInformation/ContactDetails/UpdateContactDetails';
// // import {CreateIdentityRequest} from '../../API/PersonalInformation/Identification/CreateIdentityRequest';
// // import {UpdateIdentityRequest} from '../../API/PersonalInformation/Identification/UpdateIdentityRequest';

// const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

// const DisplayPersonalInfo = () => {
//   // State management
//   // const [expandedSections, setExpandedSections] = useState({
//   //   nameSection: false,
//   //   identificationSection: false,
//   // });

//   // const [nameRows, setNameRows] = useState([]);
//   // const [identityRows, setIdentityRows] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);

//   const [profilePictureUrl, setProfilePictureUrl] = useState(null);
//   const [isImageChanged, setIsImageChanged] = useState(false);

//   // Contact modal states
//   // const [isModalVisible, setIsModalVisible] = useState(false);
//   // const [modalMode, setModalMode] = useState('create');
//   // const [selectedLeave, setSelectedLeave] = useState(null);

//   // // Identity modal states
//   // const [isModalOpen, setIsModalOpen] = useState(false);
//   // const [modalModeType, setModalModeType] = useState('create');
//   // const [selectedIdentity, setSelectedIdentity] = useState(null);

//   // Alert modal states
//   const [alertModal, setAlertModal] = useState(false);
//   const [alertMessage, setAlertMessage] = useState('');

//   // const navigation = useNavigation();

//   // Redux selectors
//   const {selectedLegalEntity, defaultLegalEntity} = useSelector(
//     state => state.company,
//   );
//   const {userData} = useSelector(state => state.user);
//   const companyToUse = selectedLegalEntity || defaultLegalEntity;

//   // Effects
//   useEffect(() => {
//     initializeData();
//   }, []);

//   useEffect(() => {
//     if (companyToUse) {
//       fetchData(companyToUse);
//     }
//   }, [companyToUse]);

//   // Initialize component data
//   const initializeData = async () => {
//     try {
//       setIsLoading(true);
//       await Promise.all([
//         fetchProfilePicture(companyToUse),
//         // fetchContactDetails(),
//         // fetchIdentificationDetails(),
//       ]);
//     } catch (error) {
//       console.error('Error initializing data:', error);
//       setAlertMessage('Failed to load personal information');
//       setAlertModal(true);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Fetch all data
//   const fetchData = async (company = companyToUse) => {
//     setIsLoading(true);
//     setRefreshing(true);
//     try {
//       await Promise.all([
//         fetchProfilePicture(company),
//         // fetchContactDetails(),
//         // fetchIdentificationDetails(),
//       ]);
//     } catch (error) {
//       console.error('Error fetching data:', error);
//     } finally {
//       setIsLoading(false);
//       setRefreshing(false);
//     }
//   };

//   // Handle refresh
//   const handleRefresh = async (company = companyToUse) => {
//     // setIsLoading(true);
//     // setIsImageChanged(false);
//     await fetchData(company);
//     // setIsLoading(false);
//   };

//   // Toggle section expansion
//   // const toggleSection = section => {
//   //   setExpandedSections(prevState => ({
//   //     ...prevState,
//   //     [section]: !prevState[section],
//   //   }));
//   // };

//   // Fetch profile picture with error handling
//   const fetchProfilePicture = async (company = companyToUse) => {
//     try {
//       if (!userData?.employeeId) {
//         console.warn('Employee ID not available');
//         return;
//       }

//       const data = await ProfilePicture({
//         employeeId: userData.employeeId,
//         defaultCompany: company,
//       });

//       // Handle both array and object responses
//       let imageData = null;
//       if (Array.isArray(data) && data.length > 0) {
//         imageData = data[0]; // Get first element if it's an array
//       } else if (data && typeof data === 'object') {
//         imageData = data; // Use directly if it's an object
//       }

//       if (imageData?.StringImage) {
//         // Clean up the base64 string if it contains line breaks or extra spaces
//         const cleanBase64 = imageData.StringImage.replace(/\s/g, '');
//         const base64Image = `data:image/png;base64,${cleanBase64}`;
//         setProfilePictureUrl(base64Image);
//       } else {
//         setProfilePictureUrl(null);
//       }
//     } catch (error) {
//       console.error('Failed to fetch profile picture:', error);
//       setProfilePictureUrl(null);
//       // Don't show error modal for missing profile picture as it's optional
//     }
//   };

//   // Handle image edit
//   const handleProfileImageEdit = () => {
//     const options = {
//       mediaType: 'photo',
//       includeBase64: true,
//       quality: 0.8,
//       maxWidth: 800,
//       maxHeight: 800,
//     };

//     ImagePicker.launchImageLibrary(options, response => {
//       if (response.didCancel || response.error) {
//         return;
//       }

//       if (response.assets && response.assets.length > 0) {
//         const base64Image = response.assets[0].base64;
//         if (base64Image) {
//           setProfilePictureUrl(`data:image/jpeg;base64,${base64Image}`);
//           setIsImageChanged(true);
//         }
//       }
//     });
//   };

//   // Save profile picture changes
//   const handleSaveChanges = async () => {
//     try {
//       setIsLoading(true);

//       if (!profilePictureUrl) {
//         setAlertMessage('No image to save');
//         setAlertModal(true);
//         return;
//       }

//       // Extract base64 data
//       const base64Image = profilePictureUrl.replace(
//         /^data:image\/(png|jpg|jpeg);base64,/,
//         '',
//       );

//       await UpdateByEmployeeId({
//         employeeId: userData.employeeId,
//         stringImage: base64Image,
//         defaultCompany: companyToUse,
//       });

//       setIsImageChanged(false);
//       setAlertMessage('Profile picture updated successfully');
//       setAlertModal(true);
//     } catch (error) {
//       console.error('Failed to update profile picture:', error);
//       setAlertMessage('Failed to update profile picture');
//       setAlertModal(true);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Fetch contact details
//   // const fetchContactDetails = async () => {
//   //   try {
//   //     if (!userData?.employeeId) return;

//   //     const data = await ContactDetails({employeeId: userData.employeeId});

//   //     if (Array.isArray(data)) {
//   //       const formattedData = data.map(item => ({
//   //         RecId: item.RecId,
//   //         Type: item.Type,
//   //         Locator: item.Locator,
//   //         Location: item.Location,
//   //         IsPrimary: item.IsPrimary,
//   //         IsPrivate: item.IsPrivate,
//   //         Description: item.Description,
//   //         IsMobilePhone: item.IsMobilePhone,
//   //         LocatorExtension: item.LocatorExtension,
//   //         CountryRegionCode: item.CountryRegionCode,
//   //       }));
//   //       setNameRows(formattedData);
//   //     }
//   //   } catch (error) {
//   //     console.error('Failed to fetch contact details:', error);
//   //   }
//   // };

//   // // Fetch identification details
//   // const fetchIdentificationDetails = async () => {
//   //   try {
//   //     if (!userData?.employeeId) return;

//   //     const data = await IdentificationFindRequest({
//   //       employeeId: userData.employeeId,
//   //       defaultCompany: companyToUse,
//   //     });

//   //     if (Array.isArray(data)) {
//   //       const formattedData = data.map(item => ({
//   //         RecId: item.RecId,
//   //         IdentificationType: item.IdentificationType || 'N/A',
//   //         Description: item.Description || 'N/A',
//   //         IdentificationNumber: item.IdentificationNumber || 'N/A',
//   //         IssuedDate: item.IssuedDate || 'N/A',
//   //         ExpirationDate: item.ExpirationDate || 'N/A',
//   //         IssuingAgency: item.IssuingAgency || 'N/A',
//   //         IssuingAgencyId: item.IssuingAgencyId || 'N/A',
//   //         IsPrimary: item.IsPrimary,
//   //         CreatedBy: item.CreatedBy || 'N/A',
//   //         ModifiedBy: item.ModifiedBy || 'N/A',
//   //         Classification: item.Classification || 'N/A',
//   //         IdentificationTypeId: item.IdentificationTypeId || 'N/A',
//   //         WorkflowOperation: item.WorkflowOperation || 'N/A',
//   //         ApprovalStatus: item.ApprovalStatus || 'N/A',
//   //         PersonIdentificationNumberRecVersion:
//   //           item.PersonIdentificationNumberRecVersion || 'N/A',
//   //       }));
//   //       setIdentityRows(formattedData);
//   //     }
//   //   } catch (error) {
//   //     console.error('Failed to fetch identification details:', error);
//   //   }
//   // };

//   // // Delete contact details
//   // const handleDeleteContact = async RecId => {
//   //   try {
//   //     const response = await DeleteContactDetails({recordsRecId: [RecId]});

//   //     if (response?.[0]?.IsSuccess) {
//   //       setAlertMessage('Contact detail deleted successfully');
//   //       setNameRows(prev => prev.filter(item => item.RecId !== RecId));
//   //     } else {
//   //       setAlertMessage('Unable to delete contact detail');
//   //     }
//   //     setAlertModal(true);
//   //   } catch (error) {
//   //     console.error('Error deleting contact:', error);
//   //     setAlertMessage('Failed to delete contact detail');
//   //     setAlertModal(true);
//   //   } finally {
//   //     await fetchContactDetails();
//   //   }
//   // };

//   // // Delete identification
//   // const handleDeleteIdentity = async RecId => {
//   //   try {
//   //     const response = await DeleteIdentityRequest({recordsRecId: [RecId]});

//   //     if (response?.[0]?.IsSuccess) {
//   //       setAlertMessage('Identification deleted successfully');
//   //       setIdentityRows(prev => prev.filter(item => item.RecId !== RecId));
//   //     } else {
//   //       setAlertMessage('Unable to delete identification');
//   //     }
//   //     setAlertModal(true);
//   //   } catch (error) {
//   //     console.error('Error deleting identity:', error);
//   //     setAlertMessage('Failed to delete identification');
//   //     setAlertModal(true);
//   //   } finally {
//   //     await fetchIdentificationDetails();
//   //   }
//   // };

//   // // Modal handlers
//   // const handleContactOpenModal = (mode, serviceData = {}) => {
//   //   const defaultData = {
//   //     recId: userData?.WorkerRecId,
//   //     employeeId: userData?.employeeId,
//   //     employeeName: userData?.employeeName,
//   //   };

//   //   const modalData =
//   //     mode === 'create' ? defaultData : {...defaultData, ...serviceData};

//   //   setModalMode(mode);
//   //   setSelectedLeave(modalData);
//   //   setIsModalVisible(true);
//   // };

//   // const handleOpenIdentityModal = (mode, serviceData = {}) => {
//   //   const defaultData = {
//   //     recId: userData?.WorkerRecId,
//   //     employeeId: userData?.employeeId,
//   //     employeeName: userData?.employeeName,
//   //   };

//   //   const modalData =
//   //     mode === 'create' ? defaultData : {...defaultData, ...serviceData};

//   //   setModalModeType(mode);
//   //   setSelectedIdentity(modalData);
//   //   setIsModalOpen(true);
//   // };

//   // // Contact action handler
//   // const handleContactAction = async (actionType, modalMode, data = {}) => {
//   //   try {
//   //     const contactData = {
//   //       RecId: data.RecId,
//   //       EmployeeId: userData?.WorkerRecId,
//   //       Type: data.Type,
//   //       Locator: data.Locator,
//   //       IsPrimary: data.IsPrimary?.value ?? data.IsPrimary,
//   //       IsPrivate: data.IsPrivate?.value ?? data.IsPrivate,
//   //       Description: data.Description,
//   //       IsMobilePhone: data.IsMobilePhone?.value ?? data.IsMobilePhone,
//   //     };

//   //     let response;
//   //     if (modalMode.toLowerCase() === 'create') {
//   //       response = await CreateContactDetails(contactData);
//   //     } else if (modalMode.toLowerCase() === 'update') {
//   //       response = await UpdateContactDetails(contactData);
//   //     }

//   //     const action =
//   //       modalMode.toLowerCase() === 'create' ? 'created' : 'updated';
//   //     const actionText =
//   //       actionType.toLowerCase() === 'save'
//   //         ? action
//   //         : `${action} and submitted`;

//   //     if (response?.IsSuccess) {
//   //       setAlertMessage(`Contact information ${actionText} successfully`);
//   //     } else {
//   //       setAlertMessage(response?.Message || 'Operation failed');
//   //     }
//   //   } catch (error) {
//   //     console.error('Error in contact action:', error);
//   //     setAlertMessage('An error occurred while processing the request');
//   //   } finally {
//   //     setAlertModal(true);
//   //     setIsModalVisible(false);
//   //     await fetchContactDetails();
//   //   }
//   // };

//   // // Identity action handler
//   // const handleIdentityAction = async (actionType, modalMode, data = {}) => {
//   //   try {
//   //     const identityData = {
//   //       RecId: data.RecId || 0,
//   //       EmployeeId: userData?.WorkerRecId,
//   //       IdentificationType: data.IdentificationType || 0,
//   //       IdentificationTypeId: data.IdentificationTypeId,
//   //       Description: data.Description,
//   //       IdentificationNumber: data.IdentificationNumber,
//   //       IssuedDate: data.IssuedDate,
//   //       ExpirationDate: data.ExpirationDate,
//   //       IsPrimary: data.IsPrimary?.value ?? data.IsPrimary,
//   //       Classification: data.Classification,
//   //       IssuingAgency: 16928090028,
//   //       IssuingAgencyId: 'Government',
//   //       PersonIdentificationNumberRecVersion: 1,
//   //     };

//   //     let response;
//   //     if (modalMode.toLowerCase() === 'create') {
//   //       response = await CreateIdentityRequest(identityData, companyToUse);
//   //     } else if (modalMode.toLowerCase() === 'update') {
//   //       response = await UpdateIdentityRequest(identityData, companyToUse);
//   //     }

//   //     const action =
//   //       modalMode.toLowerCase() === 'create' ? 'created' : 'updated';
//   //     const actionText =
//   //       actionType.toLowerCase() === 'save'
//   //         ? action
//   //         : `${action} and submitted`;

//   //     if (response?.IsSuccess) {
//   //       setAlertMessage(`Registration request ${actionText} successfully`);
//   //     } else {
//   //       setAlertMessage(response?.Message || 'Operation failed');
//   //     }
//   //   } catch (error) {
//   //     console.error('Error in identity action:', error);
//   //     setAlertMessage('An error occurred while processing the request');
//   //   } finally {
//   //     setAlertModal(true);
//   //     setIsModalOpen(false);
//   //     await fetchIdentificationDetails();
//   //   }
//   // };

//   return (
//     <ActionPaneContainer
//       pageTitle="Profile"
//       isBackButton={false}
//       showFooter={false}
//       showFloatingButton={false}
//       isHeaderActive={true}
//       onRefresh={() => handleRefresh(companyToUse)}>
//       {isLoading ? (
//         <CustomIndicator />
//       ) : (
//         <ScrollView
//           refreshControl={
//             <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
//           }>
//           <KeyboardAvoidingView
//             style={styles.topContainer}
//             behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//             keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
//             <View style={styles.imageContainer}>
//               <ProfilePictureEditor
//                 isLoading={isLoading}
//                 profilePictureUrl={profilePictureUrl}
//                 onEdit={handleProfileImageEdit}
//                 userData={userData}
//               />
//             </View>

//             {/* Contact Details Section */}
//             {/* <ScrollView
//             contentContainerStyle={styles.scrollContainer}
//             showsVerticalScrollIndicator={false}>
//             <View style={styles.sectionHeader}>
//               <SectionHeader
//                 title="Contact Details"
//                 expanded={expandedSections.nameSection}
//                 onToggle={() => toggleSection('nameSection')}
//               />
//               {expandedSections.nameSection && (
//                 <ContactDetailsSection
//                   ContactRows={nameRows}
//                   onCreate={() => handleContactOpenModal('create')}
//                   onEdit={selectedRow =>
//                     handleContactOpenModal('edit', selectedRow)
//                   }
//                   onDelete={handleDeleteContact}
//                 />
//               )}
//             </View>

//             <View style={styles.sectionHeader}>
//               <SectionHeader
//                 title="Identification Numbers"
//                 expanded={expandedSections.identificationSection}
//                 onToggle={() => toggleSection('identificationSection')}
//               />
//               {expandedSections.identificationSection && (
//                 <IdentificationDetailsSection
//                   IdentityrRows={identityRows}
//                   onCreate={() => handleOpenIdentityModal('create')}
//                   onDelete={handleDeleteIdentity}
//                 />
//               )}
//             </View>
//           </ScrollView> */}
//             {/* Identification Details Section */}

//             {/* Fixed Save Button */}
//             {isImageChanged && (
//               <TouchableOpacity style={styles.fixedButtonContainer}>
//                 <SaveButton isLoading={isLoading} onSave={handleSaveChanges} />
//               </TouchableOpacity>
//             )}
//           </KeyboardAvoidingView>
//         </ScrollView>
//       )}

//       {/* Modals */}
//       {/* <ContactInfoModal
//         visible={isModalVisible}
//         onClose={() => setIsModalVisible(false)}
//         mode={modalMode.toLowerCase()}
//         onAction={handleContactAction}
//         serviceData={selectedLeave}
//       /> */}

//       {/* <IdentificationInfoModal
//         visible={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         mode={modalModeType.toLowerCase()}
//         onAction={handleIdentityAction}
//         serviceData={selectedIdentity}
//       /> */}

//       <AlertModal
//         visible={alertModal}
//         heading="Alert"
//         text={alertMessage}
//         onPress={() => setAlertModal(false)}
//       />
//     </ActionPaneContainer>
//   );
// };

// const styles = StyleSheet.create({
//   topContainer: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   imageContainer: {
//     paddingHorizontal: screenWidth * 0.05, // 5% of screen width
//     paddingTop: screenHeight * 0.025, // 2.5% of screen height
//     paddingBottom: screenHeight * 0.01, // 1% of screen height
//     alignItems: 'center',
//   },
//   scrollContainer: {
//     paddingHorizontal: screenWidth * 0.05,
//     paddingBottom: screenHeight * 0.1, // Extra padding for fixed button
//     flexGrow: 1,
//   },
//   sectionHeader: {
//     marginBottom: screenHeight * 0.02, // 2% of screen height
//   },
//   fixedButtonContainer: {
//     // position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     backgroundColor: 'white',
//     padding: screenWidth * 0.025, // 2.5% of screen width
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: -2},
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 5,
//     borderTopWidth: 1,
//     borderTopColor: '#e0e0e0',
//   },
// });

// export default DisplayPersonalInfo;

import React, {useState, useEffect} from 'react';
import {
  View,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Platform,
  Dimensions,
  RefreshControl,
} from 'react-native';
import * as ImagePicker from 'react-native-image-picker';
import {useSelector} from 'react-redux';

// Components
import ProfilePictureEditor from '../../components/PersonalInformation/ProfilePictureEditor';
import SaveButton from '../../components/PersonalInformation/SaveButton';
import {AlertModal} from '../../components/Alert/AlertModal';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';

// API imports
import {ProfilePicture} from '../../API/PersonalInformation/ProfilePicture/ProfilePicture';
import {UpdateByEmployeeId} from '../../API/PersonalInformation/ProfilePicture/UpdateByEmployeeId';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

const DisplayPersonalInfo = () => {
  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);
  const [isImageChanged, setIsImageChanged] = useState(false);

  // Alert modal states
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // Redux selectors
  const {selectedLegalEntity, defaultLegalEntity} = useSelector(
    state => state.company,
  );
  const {userData} = useSelector(state => state.user);
  const companyToUse = selectedLegalEntity || defaultLegalEntity;

  // Effects
  useEffect(() => {
    initializeData();
  }, []);

  useEffect(() => {
    if (companyToUse) {
      fetchData(companyToUse);
    }
  }, [companyToUse]);

  // Initialize component data
  const initializeData = async () => {
    try {
      setIsLoading(true);
      await fetchProfilePicture(companyToUse);
    } catch (error) {
      console.error('Error initializing data:', error);
      setAlertMessage('Failed to load personal information');
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all data
  const fetchData = async (company = companyToUse) => {
    setIsLoading(true);
    setRefreshing(true);
    try {
      await fetchProfilePicture(company);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = async (company = companyToUse) => {
    setIsImageChanged(false);
    await fetchData(company);
  };

  // Fetch profile picture with error handling
  const fetchProfilePicture = async (company = companyToUse) => {
    try {
      if (!userData?.employeeId) {
        console.warn('Employee ID not available');
        return;
      }

      const data = await ProfilePicture({
        employeeId: userData.employeeId,
        defaultCompany: company,
      });

      // Handle both array and object responses
      let imageData = null;
      if (Array.isArray(data) && data.length > 0) {
        imageData = data[0];
      } else if (data && typeof data === 'object') {
        imageData = data;
      }

      if (imageData?.StringImage) {
        const cleanBase64 = imageData.StringImage.replace(/\s/g, '');
        const base64Image = `data:image/png;base64,${cleanBase64}`;
        setProfilePictureUrl(base64Image);
      } else {
        setProfilePictureUrl(null);
      }
    } catch (error) {
      console.error('Failed to fetch profile picture:', error);
      setProfilePictureUrl(null);
    }
  };

  // Handle image edit
  const handleProfileImageEdit = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: true,
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800,
    };

    ImagePicker.launchImageLibrary(options, response => {
      if (response.didCancel || response.error) {
        return;
      }

      if (response.assets && response.assets.length > 0) {
        const base64Image = response.assets[0].base64;
        if (base64Image) {
          setProfilePictureUrl(`data:image/jpeg;base64,${base64Image}`);
          setIsImageChanged(true);
        }
      }
    });
  };

  // Save profile picture changes
  const handleSaveChanges = async () => {
    try {
      setIsLoading(true);

      if (!profilePictureUrl) {
        setAlertMessage('No image to save');
        setAlertModal(true);
        return;
      }

      // Extract base64 data
      const base64Image = profilePictureUrl.replace(
        /^data:image\/(png|jpg|jpeg);base64,/,
        '',
      );

      await UpdateByEmployeeId({
        employeeId: userData.employeeId,
        stringImage: base64Image,
        defaultCompany: companyToUse,
      });

      setIsImageChanged(false);
      setAlertMessage('Profile picture updated successfully');
      setAlertModal(true);
    } catch (error) {
      console.error('Failed to update profile picture:', error);
      setAlertMessage('Failed to update profile picture');
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ActionPaneContainer
      pageTitle="Profile"
      isBackButton={false}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      onRefresh={() => handleRefresh(companyToUse)}>
      {isLoading ? (
        <CustomIndicator />
      ) : (
        <View style={styles.container}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }>
            <KeyboardAvoidingView
              style={styles.topContainer}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
              <View style={styles.imageContainer}>
                <ProfilePictureEditor
                  isLoading={isLoading}
                  profilePictureUrl={profilePictureUrl}
                  onEdit={handleProfileImageEdit}
                  userData={userData}
                />
              </View>
            </KeyboardAvoidingView>
          </ScrollView>

          {/* Fixed Save Button at bottom */}
          {isImageChanged && (
            <View style={styles.fixedButtonContainer}>
              <SaveButton isLoading={isLoading} onSave={handleSaveChanges} />
            </View>
          )}
        </View>
      )}

      <AlertModal
        visible={alertModal}
        heading="Alert"
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />
    </ActionPaneContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: screenHeight * 0.1, // Extra padding for fixed button
  },
  topContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  imageContainer: {
    paddingHorizontal: screenWidth * 0.05,
    paddingTop: screenHeight * 0.025,
    paddingBottom: screenHeight * 0.01,
    alignItems: 'center',
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: screenWidth * 0.025,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
});

export default DisplayPersonalInfo;
