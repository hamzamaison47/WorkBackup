/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect, useContext} from 'react';
import {
  View,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import * as ImagePicker from 'react-native-image-picker';
import {useNavigation} from '@react-navigation/native';
import {UserContext} from '../../context/UserContext';

import NotificationDropdown from '../../components/NotificationDropdown';
import SectionHeader from '../../components/PersonalInformation/SectionHeader';
import ContactDetailsSection from '../../components/PersonalInformation/ContactDetailsSection';
import IdentificationDetailsSection from '../../components/PersonalInformation/IdentificationDetailsSection';
import SimpleHeader from '../../components/PageHeader/SimpleHeader';
import ProfilePictureEditor from '../../components/PersonalInformation/ProfilePictureEditor';
import SaveButton from '../../components/PersonalInformation/SaveButton';
import ContactInfoModal from '../../components/PersonalInformation/ContactInfoModal';
import IdentificationInfoModal from '../../components/PersonalInformation/IdentificationInfoModal';
import {AlertModal} from '../../components/Leaves/AlertModal';

import {ProfilePicture} from '../../API/ProfilePicture/ProfilePicture';
import {ContactDetails} from '../../API/ProfilePicture/ContactDetails';
import {retrieveByEmail} from '../../API/WorkflowTrackingStatusTable/retrieveByEmail';
import {IdentificationFindRequest} from '../../API/ProfilePicture/IdentificationFindRequest';
import {UpdateByEmployeeId} from '../../API/ProfilePicture/UpdateByEmployeeId';
import {DeleteContactDetails} from '../../API/ProfilePicture/DeleteContactDetails';
import {UpdateContactDetails} from '../../API/ProfilePicture/UpdateContactDetails';
import {CreateContactDetails} from '../../API/ProfilePicture/CreateContactDetails';
import {DeleteIdentityRequest} from '../../API/ProfilePicture/IdentificationRequests/DeleteIdentityRequest';
import {CreateIdentityRequest} from '../../API/ProfilePicture/IdentificationRequests/CreateIdentityRequest';
import {UpdateIdentityRequest} from '../../API/ProfilePicture/IdentificationRequests/UpdateIdentityRequest';
import {SubmitIdentificationRequest} from '../../API/ProfilePicture/IdentificationRequests/SubmitIdentificationRequest';

const DisplayPersonalInfo = () => {
  const [expandedSections, setExpandedSections] = useState({
    nameSection: false,
    identificationSection: false,
  });

  const [nameRows, setNameRows] = useState([]);
  const [identityRows, setIdentityRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [profilePictureUrl, setProfilePictureUrl] = useState(null);
  const [isImageChanged, setIsImageChanged] = useState(false);

  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notificationVisible, setNotificationVisible] = useState(false);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedLeave, setSelectedLeave] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalModeType, setModalModeType] = useState('create');
  const [selectedIdentity, setSelectedIdentity] = useState(null);

  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const {userData} = useContext(UserContext);
  const navigation = useNavigation();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchProfilePicture(); // Fetch image on component mount
  }, []);

  useEffect(() => {
    handleRefresh();
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000);
    fetchNotifications();
    return () => clearInterval(interval);
  }, [userData.email]);

  useEffect(() => {
    const headerOptions = SimpleHeader({
      onToggleDrawer: toggleDrawer,
      onRefresh: handleRefresh,
      onShowNotify: showNotification,
      onCount: notificationCount,
    });
    navigation.setOptions(headerOptions);
  }, [
    navigation,
    notificationCount,
    notificationVisible,
    notifications,
    handleRefresh,
    toggleDrawer,
  ]);

  const showNotification = () => setNotificationVisible(true);
  const closeNotification = () => setNotificationVisible(false);
  const toggleDrawer = () => navigation.toggleDrawer();

  const fetchData = async () => {
    await fetchProfilePicture();
    await fetchContactDetails();
    await fetchIndentificationtDetails();
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    setIsImageChanged(false);
    await fetchData();
  };

  const toggleSection = section => {
    setExpandedSections(prevState => ({
      ...prevState,
      [section]: !prevState[section],
    }));
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  const handleCloseOpenedModal = () => {
    setIsModalOpen(false);
  };

  // Get All Notifications Method
  const fetchNotifications = async () => {
    try {
      const data = await retrieveByEmail({email: userData.email});
      if (Array.isArray(data)) {
        const formattedNotifications = data.map(notification => ({
          document: notification.Document,
          documentType: notification.DocumentType,
          correlationId: notification.CorrelationId,
        }));
        setNotifications(formattedNotifications);
        setNotificationCount(formattedNotifications.length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Fetch profile picture
  const fetchProfilePicture = async () => {
    try {
      const data = await ProfilePicture({employeeId: userData.employeeId});
      const base64Image = `data:image/png;base64,${data.StringImage}`;
      setProfilePictureUrl(base64Image);
    } catch (error) {
      console.error('Failed to fetch Image data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle image edit
  const handleProfileImageEdit = () => {
    ImagePicker.launchImageLibrary(
      {mediaType: 'photo', includeBase64: true},
      response => {
        if (response.assets && response.assets.length > 0) {
          const base64Image = response.assets[0].base64;
          setProfilePictureUrl(`data:image/jpeg;base64,${base64Image}`);
          setIsImageChanged(true); // Set image changed state to true
        }
      },
    );
  };

  // Save changes in Profile Picture
  const handleSaveChanges = async () => {
    try {
      setIsLoading(true);

      // Extract the Base64 image data by removing metadata
      const base64Image = profilePictureUrl.replace(
        /^data:image\/(png|jpg|jpeg);base64,/,
        '',
      );

      // Update the profile picture using the employee ID
      await UpdateByEmployeeId({
        employeeId: userData.employeeId,
        stringImage: base64Image,
      });
      // Reset state flags after successful save
      setIsImageChanged(false); // Hide the save button
    } catch (error) {
      console.error('Failed to update profile picture:', error);
    } finally {
      // Ensure loading state is reset regardless of success or error
      setIsLoading(false);
    }
  };

  // Contact Details Methods
  const fetchContactDetails = async () => {
    try {
      const data = await ContactDetails({employeeId: userData.employeeId});
      const formattedData = data.map(item => ({
        RecId: item.RecId,
        Type: item.Type,
        Locator: item.Locator,
        Location: item.Location,
        IsPrimary: item.IsPrimary,
        IsPrivate: item.IsPrivate,
        Description: item.Description,
        IsMobilePhone: item.IsMobilePhone,
        LocatorExtension: item.LocatorExtension,
        CountryRegionCode: item.CountryRegionCode,
      }));
      setNameRows(formattedData);
    } catch (error) {
      console.error('Failed to fetch contact details:', error);
    }
  };

  // Contact Identification Methods
  const fetchIndentificationtDetails = async () => {
    try {
      const data = await IdentificationFindRequest({
        employeeId: userData.employeeId,
      });

      const formattedData = data.map(item => {
        // Enforcing the condition that IdentificationTypeId should be 'CNIC'
        // const identificationType =
        //   item.IdentificationTypeId === 'CNIC' ? 'CNIC' : 'Invalid Type';

        return {
          RecId: item.RecId,
          IdentificationType: item.IdentificationType || 'N/A',
          Description: item.Description || 'N/A',
          IdentificationNumber: item.IdentificationNumber || 'N/A',
          IssuedDate: item.IssuedDate || 'N/A',
          ExpirationDate: item.ExpirationDate || 'N/A',
          IssuingAgency: item.IssuingAgency || 'N/A',
          IssuingAgencyId: item.IssuingAgencyId || 'N/A',
          IsPrimary: item.IsPrimary,
          CreatedBy: item.CreatedBy || 'N/A',
          ModifiedBy: item.ModifiedBy || 'N/A',
          Classification: item.Classification || 'N/A',
          IdentificationTypeId: item.IdentificationTypeId || 'N/A',
          WorkflowOperation: item.WorkflowOperation || 'N/A',
          ApprovalStatus: item.ApprovalStatus || 'N/A',
          PersonIdentificationNumberRecVersion:
            item.PersonIdentificationNumberRecVersion || 'N/A',
        };
      });

      setIdentityRows(formattedData);
    } catch (error) {
      console.error('Failed to fetch Identification details:', error);
    }
  };

  // Contact Delete Request Method
  const handleDeleteLeave = async RecId => {
    try {
      const response = await DeleteContactDetails({recordsRecId: [RecId]});
      // eslint-disable-next-line eqeqeq
      if (response[0].IsSuccess == true) {
        setAlertMessage('Contact Detail Request Deleted Successfully.');
        setAlertModal(true);
        const updatedLeavesData = nameRows.filter(
          service => service.RecId !== RecId,
        );
        setNameRows(updatedLeavesData);
      } else {
        setAlertMessage('Unable to Delete Contact Detail Request.');
        setAlertModal(true);
      }
    } catch (error) {
      console.log('Error', error);
      setAlertMessage('Failed to Delete Contact Detail Request');
      setAlertModal(true);
    } finally {
      handleRefresh();
    }
  };

  // Identification Delete Request Method
  const handleDeleteIdentity = async RecId => {
    try {
      const response = await DeleteIdentityRequest({recordsRecId: [RecId]});
      // eslint-disable-next-line eqeqeq
      if (response[0].IsSuccess == true) {
        setAlertMessage('Identification Detail Request Deleted Successfully.');
        setAlertModal(true);
        const updatedIdentityData = identityRows.filter(
          id => id.RecId !== RecId,
        );
        setIdentityRows(updatedIdentityData);
      } else {
        setAlertMessage('Unable to Delete Identification Detail Request.');
        setAlertModal(true);
      }
    } catch (error) {
      console.log('Error', error);
      setAlertMessage('Failed to Delete Identification Detail Request');
      setAlertModal(true);
    } finally {
      handleRefresh();
    }
  };

  // Open Contact Modal Dynamically
  const handleContactOpenModal = (mode, serviceData = {}) => {
    const defaultData = {
      recId: userData.WorkerRecId,
      employeeId: userData.employeeId,
      employeeName: userData.employeeName,
    };

    if (mode === 'create') {
      serviceData = defaultData;
    } else if (mode === 'edit') {
      serviceData = {...defaultData, ...serviceData};
    }

    setModalMode(mode);
    setSelectedLeave(serviceData);
    setIsModalVisible(true);
  };

  // Open Identification Modal Dynamically
  const handleOpenIdentityModal = (mode, serviceData = {}) => {
    const defaultData = {
      recId: userData.WorkerRecId,
      employeeId: userData.employeeId,
      employeeName: userData.employeeName,
    };

    if (mode === 'create') {
      serviceData = defaultData;
    } else if (mode === 'edit') {
      serviceData = {...defaultData, ...serviceData};
    }

    setModalModeType(mode);
    setSelectedIdentity(serviceData);
    setIsModalOpen(true);
  };

  // eslint-disable-next-line no-shadow
  const handleContactAction = async (actionType, modalMode, data = {}) => {
    try {
      const contactData = {
        RecId: data.RecId,
        EmployeeId: userData.WorkerRecId,
        Type: data.Type,
        Locator: data.Locator,
        IsPrimary:
          data.IsPrimary?.value !== undefined
            ? data.IsPrimary.value
            : data.IsPrimary,
        IsPrivate:
          data.IsPrivate?.value !== undefined
            ? data.IsPrivate.value
            : data.IsPrivate,
        Description: data.Description,
        IsMobilePhone:
          data.IsMobilePhone?.value !== undefined
            ? data.IsMobilePhone.value
            : data.IsMobilePhone,
      };

      let response;

      if (modalMode.toLowerCase() === 'create') {
        response = await CreateContactDetails(contactData);
      } else if (modalMode.toLowerCase() === 'update') {
        response = await UpdateContactDetails(contactData);
      }

      if (response?.IsSuccess) {
        const successMessage =
          modalMode.toLowerCase() === 'create'
            ? actionType.toLowerCase() === 'save'
              ? 'Contact Information Request Created Successfully.'
              : 'Contact Information Request Created and Submitted Successfully.'
            : actionType.toLowerCase() === 'save'
            ? 'Contact Information Request Updated Successfully.'
            : 'Contact Information Request Updated and Submitted Successfully.';
        setAlertMessage(successMessage);
      } else {
        setAlertMessage(response?.Message || 'Operation failed.');
      }
    } catch (error) {
      setAlertMessage('An error occurred while processing the request.');
      console.error('Error in handleAction:', error);
    } finally {
      setAlertModal(true);
      setIsModalVisible(false);
      handleRefresh();
    }
  };

  // eslint-disable-next-line no-shadow
  const handleIdentityAction = async (actionType, modalMode, data = {}) => {
    try {
      const identityData = {
        RecId: data.RecId ? data.RecId : 0,
        EmployeeId: userData.WorkerRecId,
        IdentificationType: data.IdentificationType
          ? data.IdentificationType
          : 0,
        IdentificationTypeId: data.IdentificationTypeId,
        Description: data.Description,
        IdentificationNumber: data.IdentificationNumber,
        IssuedDate: data.IssuedDate,
        ExpirationDate: data.ExpirationDate,
        IsPrimary: data.IsPrimary?.value ?? data.IsPrimary,
        Classification: data.Classification,
        IssuingAgency: 16928090028,
        IssuingAgencyId: 'Government',
        PersonIdentificationNumberRecVersion: 1,
      };

      let response;

      // API Call Logic
      if (modalMode.toLowerCase() === 'create') {
        response = await CreateIdentityRequest(identityData);
      } else if (modalMode.toLowerCase() === 'update') {
        response = await UpdateIdentityRequest(identityData);
      }

      // Success or Error Messages
      if (response.IsSuccess) {
        const successMessage =
          modalMode.toLowerCase() === 'create'.toLowerCase()
            ? actionType.toLowerCase() === 'save'.toLowerCase()
              ? 'Registeration Request Created Successfully.'
              : 'Registeration Request Created and Submitted Successfully.'
            : actionType.toLowerCase() === 'save'.toLowerCase()
            ? 'Registeration Request Updated Successfully.'
            : 'Registeration Request Updated and Submitted Successfully.';
        setAlertMessage(successMessage);
      } else {
        setAlertMessage(response.Message || 'Operation Failed.');
      }
    } catch (error) {
      setAlertMessage('An error occurred while processing the request.');
      console.error('Error in handleAction:', error);
    } finally {
      setAlertModal(true);
      setIsModalVisible(false);
      handleRefresh();
    }
  };

  return (
    <KeyboardAvoidingView style={styles.TopContainer}>
      <View style={styles.imageContainer}>
        <ProfilePictureEditor
          isLoading={isLoading}
          profilePictureUrl={profilePictureUrl}
          onEdit={handleProfileImageEdit}
          userData={userData}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Contact Details Section */}
        <View style={styles.sectionHeader}>
          <SectionHeader
            title="Contact Details"
            expanded={expandedSections.nameSection}
            onToggle={() => toggleSection('nameSection')}
          />
          {expandedSections.nameSection && (
            <ContactDetailsSection
              ContactRows={nameRows}
              onCreate={() => handleContactOpenModal('create')}
              onEdit={selectedRow =>
                handleContactOpenModal('edit', selectedRow)
              }
              onDelete={handleDeleteLeave}
            />
          )}
        </View>

        <View style={styles.sectionHeader}>
          <SectionHeader
            title="My Identification Details"
            expanded={expandedSections.identificationSection}
            onToggle={() => toggleSection('identificationSection')}
          />
          {expandedSections.identificationSection && (
            <IdentificationDetailsSection
              IdentityrRows={identityRows}
              onCreate={() => handleOpenIdentityModal('create')}
              // onEdit={selectedRow =>
              //   handleOpenIdentityModal('edit', selectedRow)
              // }
              onDelete={handleDeleteIdentity}
            />
          )}
        </View>
      </ScrollView>

      {notificationVisible && (
        <NotificationDropdown
          visible={notificationVisible}
          notifications={notifications}
          onClose={closeNotification}
        />
      )}

      <ContactInfoModal
        visible={isModalVisible}
        onClose={handleCloseModal}
        mode={modalMode.toLowerCase()}
        onAction={handleContactAction}
        serviceData={selectedLeave}
      />

      <IdentificationInfoModal
        visible={isModalOpen}
        onClose={handleCloseOpenedModal}
        mode={modalModeType.toLowerCase()}
        onAction={handleIdentityAction}
        serviceData={selectedIdentity}
      />

      <AlertModal
        visible={alertModal}
        heading="Alert"
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />

      {/* Conditionally render Save Changes button */}
      {/* Fixed Button at the Bottom */}
      <TouchableOpacity style={styles.fixedButtonContainer}>
        {isImageChanged && (
          <SaveButton isLoading={isLoading} onSave={handleSaveChanges} />
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  TopContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  imageContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 5,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionHeader: {
    marginBottom: 15,
  },
  fixedButtonContainer: {
    backgroundColor: 'white',
    padding: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default DisplayPersonalInfo;
