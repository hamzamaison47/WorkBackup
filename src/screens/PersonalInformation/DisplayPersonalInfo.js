/* eslint-disable curly */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import * as ImagePicker from 'react-native-image-picker';

import {setSelectedLegalEntity} from '../../store/slices/companySlice';

import SectionHeader from '../../components/PersonalInformation/SectionHeader';
import ContactDetailsSection from '../../components/PersonalInformation/ContactDetailsSection';
import IdentificationDetailsSection from '../../components/PersonalInformation/IdentificationDetailsSection';
import ProfilePictureEditor from '../../components/PersonalInformation/ProfilePictureEditor';
import SaveButton from '../../components/PersonalInformation/SaveButton';
import ContactInfoModal from '../../components/PersonalInformation/ContactInfoModal';
import IdentificationInfoModal from '../../components/PersonalInformation/IdentificationInfoModal';
import {AlertModal} from '../../components/Alert/AlertModal';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';

import {ProfilePicture} from '../../API/PersonalInformation/ProfilePicture/ProfilePicture';
import {ContactDetails} from '../../API/PersonalInformation/ContactDetails/ContactDetails';
import {IdentificationFindRequest} from '../../API/PersonalInformation/Identification/IdentificationFindRequest';
import {UpdateByEmployeeId} from '../../API/PersonalInformation/ProfilePicture/UpdateByEmployeeId';
import {DeleteContactDetails} from '../../API/PersonalInformation/ContactDetails/DeleteContactDetails';
import {UpdateContactDetails} from '../../API/PersonalInformation/ContactDetails/UpdateContactDetails';
import {CreateContactDetails} from '../../API/PersonalInformation/ContactDetails/CreateContactDetails';
import {DeleteIdentityRequest} from '../../API/PersonalInformation/Identification/DeleteIdentityRequest';
import {CreateIdentityRequest} from '../../API/PersonalInformation/Identification/CreateIdentityRequest';
import {UpdateIdentityRequest} from '../../API/PersonalInformation/Identification/UpdateIdentityRequest';

const DisplayPersonalInfo = () => {
  // State management
  const [expandedSections, setExpandedSections] = useState({
    nameSection: false,
    identificationSection: false,
  });
  const [nameRows, setNameRows] = useState([]);
  const [identityRows, setIdentityRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);
  const [isImageChanged, setIsImageChanged] = useState(false);
  const [modalState, setModalState] = useState({
    contact: {visible: false, mode: 'create', selected: null},
    identity: {visible: false, mode: 'create', selected: null},
    alert: {visible: false, message: ''},
  });

  const dispatch = useDispatch();
  const {selectedLegalEntity, defaultLegalEntity} = useSelector(
    state => state.company,
  );
  const {userData} = useSelector(state => state.user);
  const abortControllers = useRef([]);

  // Get current company to use
  const companyToUse = selectedLegalEntity || defaultLegalEntity;

  // Initialize selected legal entity
  useEffect(() => {
    if (defaultLegalEntity && !selectedLegalEntity) {
      dispatch(setSelectedLegalEntity(defaultLegalEntity));
    }
  }, [defaultLegalEntity, selectedLegalEntity]);

  // Cleanup abort controllers on unmount
  useEffect(() => {
    return () => {
      abortControllers.current.forEach(controller => controller.abort());
    };
  }, []);

  // Main data fetching effect
  useEffect(() => {
    if (!companyToUse) return;

    const fetchAllData = async () => {
      setIsLoading(true);
      abortControllers.current.forEach(controller => controller.abort());
      abortControllers.current = [];

      try {
        const controller = new AbortController();
        abortControllers.current.push(controller);

        await Promise.all([
          fetchProfilePicture(companyToUse, controller.signal),
          fetchContactDetails(controller.signal),
          fetchIdentificationDetails(companyToUse, controller.signal),
        ]);
      } catch (error) {
        if (error.name !== 'AbortError') {
          setModalState(prev => ({
            ...prev,
            alert: {
              visible: true,
              message: 'Failed to load data. Please try again.',
            },
          }));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [companyToUse, userData.employeeId]);

  // Data fetching functions
  const fetchProfilePicture = useCallback(
    async (company, signal) => {
      try {
        const data = await ProfilePicture(
          {
            employeeId: userData.employeeId,
            defaultCompany: company,
          },
          {signal},
        );

        if (data?.[0]?.StringImage) {
          setProfilePictureUrl(`data:image/png;base64,${data[0].StringImage}`);
        } else {
          setProfilePictureUrl(null);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Profile picture fetch error:', error);
          setProfilePictureUrl(null);
        }
      }
    },
    [userData.employeeId],
  );

  const fetchContactDetails = useCallback(
    async signal => {
      try {
        const data = await ContactDetails(
          {employeeId: userData.employeeId},
          {signal},
        );

        setNameRows(
          data.map(item => ({
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
          })),
        );
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Contact details fetch error:', error);
        }
      }
    },
    [userData.employeeId],
  );

  const fetchIdentificationDetails = useCallback(
    async (company, signal) => {
      try {
        const data = await IdentificationFindRequest(
          {
            employeeId: userData.employeeId,
            defaultCompany: company,
          },
          {signal},
        );

        setIdentityRows(
          data.map(item => ({
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
          })),
        );
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Identification details fetch error:', error);
        }
      }
    },
    [userData.employeeId],
  );

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    if (!companyToUse) return;
    setIsLoading(true);
    setIsImageChanged(false);

    try {
      await Promise.all([
        fetchProfilePicture(companyToUse),
        fetchContactDetails(),
        fetchIdentificationDetails(companyToUse),
      ]);
    } catch (error) {
      setModalState(prev => ({
        ...prev,
        alert: {
          visible: true,
          message: 'Refresh failed. Please try again.',
        },
      }));
    } finally {
      setIsLoading(false);
    }
  }, [
    companyToUse,
    fetchProfilePicture,
    fetchContactDetails,
    fetchIdentificationDetails,
  ]);

  // Image handling
  const handleProfileImageEdit = useCallback(() => {
    ImagePicker.launchImageLibrary(
      {mediaType: 'photo', includeBase64: true},
      response => {
        if (response.assets?.[0]?.base64) {
          setProfilePictureUrl(
            `data:image/jpeg;base64,${response.assets[0].base64}`,
          );
          setIsImageChanged(true);
        }
      },
    );
  }, []);

  const handleSaveChanges = useCallback(async () => {
    if (!profilePictureUrl || !companyToUse) return;

    try {
      setIsLoading(true);
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
      setModalState(prev => ({
        ...prev,
        alert: {
          visible: true,
          message: 'Profile picture updated successfully.',
        },
      }));
    } catch (error) {
      setModalState(prev => ({
        ...prev,
        alert: {
          visible: true,
          message: 'Failed to update profile picture.',
        },
      }));
    } finally {
      setIsLoading(false);
    }
  }, [profilePictureUrl, companyToUse, userData.employeeId]);

  // Modal handlers
  const toggleModal = useCallback(
    (type, visible, mode = 'create', selected = null) => {
      setModalState(prev => ({
        ...prev,
        [type]: {
          ...prev[type],
          visible,
          mode,
          selected: selected
            ? {
                ...selected,
                recId: userData.WorkerRecId,
                employeeId: userData.employeeId,
                employeeName: userData.employeeName,
              }
            : null,
        },
      }));
    },
    [userData],
  );

  // Delete handlers
  const handleDelete = useCallback(
    async (type, RecId) => {
      try {
        let response;
        if (type === 'contact') {
          response = await DeleteContactDetails({recordsRecId: [RecId]});
        } else {
          response = await DeleteIdentityRequest({recordsRecId: [RecId]});
        }

        if (response?.[0]?.IsSuccess) {
          if (type === 'contact') {
            setNameRows(prev => prev.filter(item => item.RecId !== RecId));
          } else {
            setIdentityRows(prev => prev.filter(item => item.RecId !== RecId));
          }

          setModalState(prev => ({
            ...prev,
            alert: {
              visible: true,
              message: `${
                type === 'contact' ? 'Contact' : 'Identification'
              } detail deleted successfully.`,
            },
          }));
        } else {
          throw new Error(response?.Message || 'Deletion failed');
        }
      } catch (error) {
        setModalState(prev => ({
          ...prev,
          alert: {
            visible: true,
            message: error.message || `Failed to delete ${type} detail.`,
          },
        }));
      } finally {
        handleRefresh();
      }
    },
    [handleRefresh],
  );

  // Action handlers
  const handleAction = useCallback(
    async (type, actionType, data) => {
      try {
        let response;
        const isCreate = modalState[type].mode === 'create';

        if (type === 'contact') {
          const contactData = {
            RecId: data.RecId,
            EmployeeId: userData.WorkerRecId,
            Type: data.Type,
            Locator: data.Locator,
            IsPrimary: data.IsPrimary?.value ?? data.IsPrimary,
            IsPrivate: data.IsPrivate?.value ?? data.IsPrivate,
            Description: data.Description,
            IsMobilePhone: data.IsMobilePhone?.value ?? data.IsMobilePhone,
          };

          response = isCreate
            ? await CreateContactDetails(contactData)
            : await UpdateContactDetails(contactData);
        } else {
          const identityData = {
            RecId: data.RecId || 0,
            EmployeeId: userData.WorkerRecId,
            IdentificationType: data.IdentificationType || 0,
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

          response = isCreate
            ? await CreateIdentityRequest(identityData, companyToUse)
            : await UpdateIdentityRequest(identityData, companyToUse);
        }

        if (response?.IsSuccess) {
          const action = actionType.toLowerCase();
          const operation = isCreate ? 'Created' : 'Updated';
          const submitted = action === 'submit' ? ' and Submitted' : '';

          setModalState(prev => ({
            ...prev,
            [type]: {...prev[type], visible: false},
            alert: {
              visible: true,
              message: `${
                type === 'contact' ? 'Contact' : 'Identification'
              } ${operation}${submitted} Successfully.`,
            },
          }));
          handleRefresh();
        } else {
          throw new Error(response?.Message || 'Operation failed');
        }
      } catch (error) {
        setModalState(prev => ({
          ...prev,
          alert: {
            visible: true,
            message:
              error.message ||
              'An error occurred while processing the request.',
          },
        }));
      }
    },
    [
      modalState.contact.mode,
      modalState.identity.mode,
      companyToUse,
      userData,
      handleRefresh,
    ],
  );

  // Section toggle
  const toggleSection = useCallback(section => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  return (
    <ActionPaneContainer
      pageTitle="Profile"
      isBackButton={false}
      showFooter={false}
      showFloatingButton={false}
      onRefresh={handleRefresh}>
      {isLoading ? (
        <CustomIndicator />
      ) : (
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
            <View style={styles.sectionHeader}>
              <SectionHeader
                title="Contact Details"
                expanded={expandedSections.nameSection}
                onToggle={() => toggleSection('nameSection')}
              />
              {expandedSections.nameSection && (
                <ContactDetailsSection
                  ContactRows={nameRows}
                  onCreate={() => toggleModal('contact', true, 'create')}
                  onEdit={selected =>
                    toggleModal('contact', true, 'edit', selected)
                  }
                  onDelete={RecId => handleDelete('contact', RecId)}
                />
              )}
            </View>

            <View style={styles.sectionHeader}>
              <SectionHeader
                title="Identification Numbers"
                expanded={expandedSections.identificationSection}
                onToggle={() => toggleSection('identificationSection')}
              />
              {expandedSections.identificationSection && (
                <IdentificationDetailsSection
                  IdentityrRows={identityRows}
                  onCreate={() => toggleModal('identity', true, 'create')}
                  onEdit={selected =>
                    toggleModal('identity', true, 'edit', selected)
                  }
                  onDelete={RecId => handleDelete('identity', RecId)}
                />
              )}
            </View>
          </ScrollView>

          <ContactInfoModal
            visible={modalState.contact.visible}
            onClose={() => toggleModal('contact', false)}
            mode={modalState.contact.mode}
            onAction={(actionType, data) =>
              handleAction('contact', actionType, data)
            }
            serviceData={modalState.contact.selected}
          />

          <IdentificationInfoModal
            visible={modalState.identity.visible}
            onClose={() => toggleModal('identity', false)}
            mode={modalState.identity.mode}
            onAction={(actionType, data) =>
              handleAction('identity', actionType, data)
            }
            serviceData={modalState.identity.selected}
          />

          <AlertModal
            visible={modalState.alert.visible}
            heading="Alert"
            text={modalState.alert.message}
            onPress={() =>
              setModalState(prev => ({
                ...prev,
                alert: {...prev.alert, visible: false},
              }))
            }
          />

          {isImageChanged && (
            <TouchableOpacity style={styles.fixedButtonContainer}>
              <SaveButton isLoading={isLoading} onSave={handleSaveChanges} />
            </TouchableOpacity>
          )}
        </KeyboardAvoidingView>
      )}
    </ActionPaneContainer>
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 9999,
  },
});

export default DisplayPersonalInfo;
