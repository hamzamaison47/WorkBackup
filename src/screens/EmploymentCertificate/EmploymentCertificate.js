/* eslint-disable react-native/no-inline-styles */
import React, {useCallback, useState} from 'react';
import {ScrollView, RefreshControl} from 'react-native';
import {useSelector} from 'react-redux';
import {useFocusEffect, useNavigation} from '@react-navigation/native';

import ActionPaneContainer from '../../components/ActionPaneContainer';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import AlertModal from '../../components/Alert/AlertModal';

import CertificateList from '../../components/EmploymentCertificate/CertificateList';
import CertificateDetailsModal from '../../components/EmploymentCertificate/CertificateDetailsModal';

import {RetrieveCertificateTypeCode} from '../../API/EmploymentCertificate/RetrieveCertificateTypeCode';
import {RetrieveRequestedFor} from '../../API/EmploymentCertificate/RetrieveRequestedFor';
import {SubmitEmploymentCertificate} from '../../API/EmploymentCertificate/SubmitEmploymentCertificate';
import {CreateEmploymentCertificate} from '../../API/EmploymentCertificate/CreateEmploymentCertificate';

const EmploymentCertificate = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [allCertificateTypeCode, setAllCertificateTypeCode] = useState([]);
  const [allRequestedFor, setAllRequestedFor] = useState([]);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [detailsModal, setDetailsModal] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [selectedRequestedFor, setSelectedRequestedFor] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [showRequestedForDropdown, setShowRequestedForDropdown] =
    useState(false);
  const [processingButton, setProcessingButton] = useState(''); // Add this state

  const navigation = useNavigation();
  const {userData} = useSelector(state => state.user);

  const fetchCertificateTypeCode = useCallback(async () => {
    try {
      const result = await RetrieveCertificateTypeCode();
      setAllCertificateTypeCode(result || []);
    } catch (error) {
      console.error('Failed to fetch Certificate Type Code data:', error);
      setAlertMessage('Failed to fetch data.');
      setAlertModal(true);
    }
  }, []);

  const fetchRequestedFor = useCallback(async () => {
    try {
      const result = await RetrieveRequestedFor();
      setAllRequestedFor(result || []);
    } catch (error) {
      console.error('Failed to fetch Requested For data:', error);
      setAlertMessage('Failed to fetch Requested For data.');
      setAlertModal(true);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchCertificateTypeCode(), fetchRequestedFor()]);
    setIsLoading(false);
  }, [fetchCertificateTypeCode, fetchRequestedFor]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const onSend = async () => {
    // Prevent multiple clicks if already processing
    if (processingButton === 'send') {
      return;
    }

    try {
      setProcessingButton('send'); // Set processing state

      // Format current date for RequestedDate
      const formattedRequestedDate = `${
        new Date().toISOString().split('T')[0]
      }T12:00:00`;

      const certificateData = {
        CertificateTypeCode: selectedCertificate.CertificateTypeCode,
        EmpId: userData?.WorkerRecId || '',
        EmployeeID: userData?.employeeId || '',
        EmployeeName: userData?.name || '',
        RecId: '0',
        Remarks: remarks,
        RequestedDate: formattedRequestedDate,
        ReqestedFor: selectedRequestedFor?.value || selectedRequestedFor || '', // Handle null case
      };

      // Create the certificate request
      const createResponse = await CreateEmploymentCertificate({
        certificateData: certificateData,
      });

      if (!createResponse) {
        setAlertMessage('Failed to create certificate request.');
        setAlertModal(true);
        setProcessingButton(''); // Reset processing state
        return;
      }

      // Get the RecId from the create response
      const recId = createResponse.RecId;

      // Submit the certificate request
      const submitResponse = await SubmitEmploymentCertificate({
        recId: recId,
      });

      const isSuccess =
        submitResponse?.IsSuccess === true ||
        submitResponse?.IsSuccess === 'true' ||
        submitResponse === true;

      if (isSuccess) {
        setDetailsModal(false);
        setAlertMessage('Please check your email to view the certificate.');
        setAlertModal(true);

        // Reset form state
        setSelectedCertificate(null);
        setSelectedRequestedFor(null);
        setRemarks('');
        setShowRequestedForDropdown(false);

        // Refresh data
        fetchData();

        setProcessingButton(''); // Reset processing state
        return {success: true, recId: recId};
      } else {
        const errorMessage = submitResponse?.Message || 'Submission failed';
        setAlertMessage(errorMessage);
        setAlertModal(true);
        setProcessingButton(''); // Reset processing state
        return {success: false, message: errorMessage};
      }
    } catch (error) {
      console.error('Error in onSend:', error);
      setAlertMessage('An error occurred while processing your request.');
      setAlertModal(true);
      setProcessingButton(''); // Reset processing state
      return {success: false, message: 'Network or server error'};
    }
  };

  const handleCertificatePress = cert => {
    setSelectedCertificate(cert);
    setSelectedRequestedFor(null); // Reset to null
    setRemarks('');
    setShowRequestedForDropdown(false);
    setDetailsModal(true);
  };

  return (
    <ActionPaneContainer
      pageTitle="Request For Letters"
      showFooter
      showFloatingButton={false}
      isHeaderActive
      onBackPress={() => navigation.goBack()}>
      <ScrollView
        contentContainerStyle={{flexGrow: 1}}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {isLoading ? (
          <CustomIndicator />
        ) : (
          <CertificateList
            data={allCertificateTypeCode}
            onCardPress={handleCertificatePress}
          />
        )}
      </ScrollView>

      <CertificateDetailsModal
        visible={detailsModal}
        certificate={selectedCertificate}
        requestedForList={allRequestedFor}
        selectedRequestedFor={selectedRequestedFor}
        showDropdown={showRequestedForDropdown}
        onToggleDropdown={() => setShowRequestedForDropdown(prev => !prev)}
        onSelectRequestedFor={item => {
          setSelectedRequestedFor(item);
          setShowRequestedForDropdown(false);
        }}
        remarks={remarks}
        setRemarks={setRemarks}
        onCancel={() => setDetailsModal(false)}
        onSend={onSend}
        processingButton={processingButton} // Pass processing state
      />

      <AlertModal
        visible={alertModal}
        heading="Alert"
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />
    </ActionPaneContainer>
  );
};

export default EmploymentCertificate;
