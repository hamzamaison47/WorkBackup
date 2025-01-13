/* eslint-disable no-unused-vars */
import React, {useState, useEffect, useContext} from 'react';
import {
  View,
  KeyboardAvoidingView,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import * as ImagePicker from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/FontAwesome';
import {useNavigation} from '@react-navigation/native';
import {UserContext} from '../../context/UserContext';
import NotificationDropdown from '../../components/NotificationDropdown';
import ProfilePictureEditor from '../../components/PersonalInformation/ProfilePictureEditor';
import SectionHeader from '../../components/PersonalInformation/SectionHeader';
import ContactDetailsSection from '../../components/PersonalInformation/ContactDetailsSection';
import SaveButton from '../../components/PersonalInformation/SaveButton';
import SimpleHeader from '../../components/PageHeader/SimpleHeader';
import {ProfilePicture} from '../../API/ProfilePicture/ProfilePicture';
import {ContactDetails} from '../../API/ProfilePicture/ContactDetails';
import {UpdateByEmployeeId} from '../../API/ProfilePicture/UpdateByEmployeeId';
import {SaveContactDetails} from '../../API/ProfilePicture/SaveContactDetails';
import {retrieveByEmail} from '../../API/WorkflowTrackingStatusTable/retrieveByEmail';
// const {width} = Dimensions.get('window');

const PersonalInformations = () => {
  const [expandedSections, setExpandedSections] = useState({
    nameSection: false,
    addressSection: false,
  });

  const [nameRows, setNameRows] = useState([]);
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [isChanged, setIsChanged] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notificationVisible, setNotificationVisible] = useState(false);

  const {userData} = useContext(UserContext);
  const navigation = useNavigation();

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000);
    fetchNotifications(); // Initial fetch
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData.email]);

  useEffect(() => {
    handleRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const toggleDrawer = () => navigation.toggleDrawer();

  const fetchData = async () => {
    await fetchProfilePicture();
    await fetchContactDetails();
    // await fetchAddressDetails();
  };

  const toggleSection = section => {
    setExpandedSections(prevState => ({
      ...prevState,
      [section]: !prevState[section],
    }));
  };

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleRefresh = async () => {
    setIsLoading(true);
    await fetchData();
  };

  // Profile Picture Method
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

  // Profile Image Edit Methods
  const handleProfileImageEdit = () => {
    ImagePicker.launchImageLibrary(
      {mediaType: 'photo', includeBase64: true},
      response => {
        if (response.assets && response.assets.length > 0) {
          const base64Image = response.assets[0].base64;
          setProfilePictureUrl(`data:image/jpeg;base64,${base64Image}`);
          setIsChanged(true);
        }
      },
    );
  };

  // Edit Methods
  const handleEditToggle = () => setIsEditing(!isEditing);

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

  const handleSave = async () => {
    // Exit early if no changes have been made
    // if (!isChanged) {
    //   setIsLoading(true);
    //   setTimeout(() => setIsLoading(false), 1000);
    //   console.log('thisssssssssssssssssssssss');
    //   return;
    // }

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

      // Save each contact detail row that has a description
      for (const row of nameRows) {
        // console.log('Row:', row);
        // console.log('Description:', row.Description);
        // console.log('nameRows:', nameRows);

        if (row.Description) {
          const contactData = {
            RecId: row.RecId,
            employeeId: userData.WorkerRecId,
            Type: row.Type,
            Locator: row.Locator,
            Location: row.Location,
            IsPrimary: row.IsPrimary,
            IsPrivate: row.IsPrivate,
            Description: row.Description,
            IsMobilePhone: row.IsMobilePhone,
            LocatorExtension: row.LocatorExtension,
            CountryRegionCode: row.CountryRegionCode,
          };

          console.log('contactData=-=-=-=-=-==-=-=-=-=-=-=-=-:', contactData);

          await SaveContactDetails(contactData); // Save contact details via API
        }
      }

      // Reset state flags after successful save
      setIsChanged(false);
      setIsEditing(false);
    } catch (error) {
      // Handle errors gracefully
      console.error('Failed to update profile:', error);
    } finally {
      // Ensure loading state is reset regardless of success or error
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container}>
      <View style={styles.imageContainer}>
        {/* Profile Picture Editor */}
        <ProfilePictureEditor
          isLoading={isLoading}
          profilePictureUrl={profilePictureUrl}
          onEdit={() => handleProfileImageEdit()}
          userData={userData}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Edit Toggle */}
        <TouchableOpacity onPress={handleEditToggle} style={styles.editToggle}>
          <Icon
            name={isEditing ? 'edit' : 'pencil'}
            size={20}
            color="#FFA500"
          />
        </TouchableOpacity>

        {/* Contact Details Section */}
        <View style={styles.sectionHeader}>
          <SectionHeader
            title="Contact Details"
            expanded={expandedSections.nameSection}
            onToggle={() => toggleSection('nameSection')}
          />
          {expandedSections.nameSection && (
            <ContactDetailsSection
              isEditing={isEditing}
              ContactRows={nameRows}
            />
          )}
        </View>

        {/* Wrong Section Make new one Here */}
        {/* Address Details Section */}
        {/* <View style={styles.sectionHeader}>
          <SectionHeader
            title="Address Details"
            expanded={expandedSections.addressSection}
            onToggle={() => toggleSection('addressSection')}
          />
          {expandedSections.addressSection && (
            <AddressDetailsSection
              isEditing={isEditing}
              AddressRows={addressRows}
            />
          )}
        </View> */}
      </ScrollView>
      {/* Save Button */}
      <SaveButton isLoading={isLoading} onSave={handleSave} />

      {notificationVisible && (
        <NotificationDropdown
          visible={notificationVisible}
          notifications={notifications}
          onClose={closeNotification}
        />
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
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
  editToggle: {
    alignItems: 'flex-end',
    marginBottom: 15,
    marginHorizontal: 10,
  },
  sectionHeader: {
    marginBottom: 15,
  },
});

export default PersonalInformations;
