/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/FontAwesome';
import {Dropdown} from 'react-native-element-dropdown';
import {useNavigation} from '@react-navigation/native';

import ActionPaneContainer from '../../components/ActionPaneContainer';
import styles from '../../styles/styles';

import {eosRetrieveReasonCode} from '../../API/EmployeeEOSRequest/RetrieveReasonCode';
import {eosRetrieveNoticePeriodCode} from '../../API/EmployeeEOSRequest/RetrieveNoticePeriodCode';
import {retrieveEmployeeReporteesEOS} from '../../API/EmployeeEOSRequest/RetrieveEmployeeReportees';
import {RetrieveEmployeeReporteesEmpInfo} from '../../API/EmploymentInformation/RetrieveEmployeeReporteesEmpInfo';
import {CreateEOSRequest} from '../../API/EmployeeEOSRequest/CreateEOSRequest';
import SubmitEOSRequest from '../../API/EmployeeEOSRequest/SubmitEOSRequest';

// Helper to format date as MM-DD-YYYY
const formatDate = raw => {
  if (!raw) return '';
  try {
    const d = new Date(raw);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}-${day}-${year}`;
  } catch {
    return raw;
  }
};

// Calculate last working date based on notification
const calculateLastWorkingDate = notificationDate => {
  if (!notificationDate) return '';
  const baseDate = new Date(notificationDate);
  baseDate.setDate(baseDate.getDate() + 30);
  return baseDate.toISOString().split('T')[0];
};

const EOSRequestScreen = () => {
  const userData = useSelector(state => state.user.userData);
  const today = new Date().toISOString().split('T')[0];
  const scrollRef = useRef(null);
  const navigation = useNavigation();

  const [formData, setFormData] = useState({
    employee: userData?.employeeName || '',
    employeeId: userData?.employeeId || 0,
    EmployeeId: userData?.WorkerRecId || 0,
    RecId: userData?.WorkerRecId || 0,
    activePayPeriod: '',
    EOSType: '',
    lastWorkingDatePlanned: '',
    NoticePeriodCode: '',
    EOSNotificationDate: today,
    LastWorkingDate_Actual: today,
    reasonCode: '',
    hiringDate: userData?.OriginalHireDate || '',
    serviceDuration: '',
    remarks: '',
  });

  const [noticePeriods, setNoticePeriods] = useState([]);
  const [reasonCodes, setReasonCodes] = useState([]);

  const eosTypes = [
    {label: 'Resignation', value: 'Resignation'},
    {label: 'Termination', value: 'Termination'},
  ];

  const handleChange = (field, value) => {
    setFormData(prev => ({...prev, [field]: value}));
  };

  // Load dropdowns and employee defaults
  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const noticeData = await eosRetrieveNoticePeriodCode();
        setNoticePeriods(
          noticeData.map(item => ({
            label: item.NoticePeriodCode,
            value: item.NoticePeriodCode,
          })),
        );

        const reasonData = await eosRetrieveReasonCode();
        setReasonCodes(
          reasonData.map(item => ({
            label: item.ReasonCodeId,
            value: item.ReasonCodeId,
          })),
        );
      } catch (error) {
        console.log('Dropdown Load Error:', error);
      }
    };

    const loadEmployeeDefaults = async () => {
      try {
        const reporteeData = await retrieveEmployeeReporteesEOS(
          userData.employeeId,
        );
        if (reporteeData?.length > 0) {
          const defaultData = reporteeData[0];
          const calculatedDate = calculateLastWorkingDate(today);

          handleChange('EOSType', defaultData.EOS_Type || '-1');
          handleChange('LastWorkingDate_Actual', calculatedDate);
          handleChange('lastWorkingDatePlanned', calculatedDate);
        }

        const empInfoData = await RetrieveEmployeeReporteesEmpInfo(
          userData.employeeId,
        );
        if (empInfoData?.length > 0) {
          const empData = empInfoData[0];
          handleChange('activePayPeriod', empData.ActivePayPeriodCode || '');
          handleChange(
            'hiringDate',
            empData.hiringdate || userData?.OriginalHireDate || '',
          );
          handleChange('serviceDuration', empData.ServiceDuration || '');
        } else {
          handleChange('hiringDate', userData?.OriginalHireDate || '');
        }
      } catch (error) {
        console.log('Employee Info Load Error:', error);
      }
    };

    loadDropdowns();
    loadEmployeeDefaults();
  }, [userData.employeeId, today, userData?.OriginalHireDate]);

  // API Handlers
  const handleCreate = async () => {
    try {
      const result = await CreateEOSRequest({contract: formData});
      if (result?.RecId) {
        Alert.alert('Success', 'EOS Request Draft Created Successfully!');
        handleChange('RecId', result.RecId);
      } else {
        Alert.alert('Error', 'Failed to create EOS Request.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Error while creating EOS Request.');
    }
  };

  const handleCreateAndSubmit = async () => {
    try {
      let recId = formData.RecId;

      // If not created yet, create first
      if (!recId) {
        const result = await CreateEOSRequest({contract: formData});
        if (!result?.RecId)
          return Alert.alert('Error', 'Failed to create EOS Request.');
        handleChange('RecId', result.RecId);
        recId = result.RecId;
      }

      // Submit
      await SubmitEOSRequest(recId);
      Alert.alert('Success', 'EOS Request Created & Submitted Successfully!');
      navigation.navigate('EmployeeEOSRequestListPage');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Error while creating or submitting EOS Request.');
    }
  };

  const handleCancel = () => {
    navigation.navigate('EmployeeEOSRequestListPage');
  };

  return (
    <ActionPaneContainer pageTitle="EOS Request" isBackButton={true}>
      <SafeAreaView style={styles.DSR_SafeArea}>
        <KeyboardAvoidingView
          style={{flex: 1}}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.DSR_FormContainer}
            showsVerticalScrollIndicator={false}>
            {/* Employee */}
            <Text style={styles.DSR_Label}>Employee</Text>
            <Text style={[styles.DSR_Input, styles.DSR_Disabled]}>
              {formData.employee}
            </Text>

            {/* Active Pay Period */}
            <Text style={styles.DSR_Label}>Active Pay Period</Text>
            <TextInput
              style={[styles.DSR_Input, styles.DSR_Disabled]}
              value={formData.activePayPeriod}
              editable={false}
            />

            {/* EOS Type */}
            <Text style={styles.DSR_Label}>EOS Type</Text>
            <Dropdown
              style={styles.DSR_Input}
              data={eosTypes}
              labelField="label"
              valueField="value"
              value={formData.EOSType}
              onChange={item => handleChange('EOSType', item.value)}
            />

            {/* Last Working Date Planned */}
            <Text style={styles.DSR_Label}>Last Working Date (Planned)</Text>
            <TouchableOpacity style={styles.DSR_DateSelector}>
              <Text style={styles.DSR_DateText}>
                {formatDate(formData.lastWorkingDatePlanned)}
              </Text>
            </TouchableOpacity>

            {/* Notice Period */}
            <Text style={styles.DSR_Label}>Notice Period Code</Text>
            <Dropdown
              style={styles.DSR_Input}
              data={noticePeriods}
              labelField="label"
              valueField="value"
              value={formData.NoticePeriodCode}
              onChange={item => {
                handleChange('NoticePeriodCode', item.value);
                const calculatedDate = calculateLastWorkingDate(
                  formData.EOSNotificationDate,
                );
                handleChange('LastWorkingDate_Actual', calculatedDate);
                handleChange('lastWorkingDatePlanned', calculatedDate);
              }}
            />

            {/* Notification Date */}
            <Text style={styles.DSR_Label}>Notification Date</Text>
            <Text style={[styles.DSR_Input, styles.DSR_Disabled]}>
              {formatDate(formData.EOSNotificationDate)}
            </Text>

            {/* Last Working Date Requested */}
            <Text style={styles.DSR_Label}>Last Working Date (Requested)</Text>
            <TouchableOpacity style={styles.DSR_DateSelector}>
              <Text style={styles.DSR_DateText}>
                {formatDate(formData.LastWorkingDate_Actual)}
              </Text>
            </TouchableOpacity>

            {/* Reason Code */}
            <Text style={styles.DSR_Label}>Reason Code</Text>
            <Dropdown
              style={styles.DSR_Input}
              data={reasonCodes}
              labelField="label"
              valueField="value"
              value={formData.reasonCode}
              onChange={item => handleChange('reasonCode', item.value)}
            />

            {/* Hiring Date */}
            <Text style={styles.DSR_Label}>Hiring Date</Text>
            <TextInput
              style={[styles.DSR_Input, styles.DSR_Disabled]}
              value={formatDate(formData.hiringDate)}
              editable={false}
            />

            {/* Service Duration */}
            <Text style={styles.DSR_Label}>Service Duration</Text>
            <TextInput
              style={[styles.DSR_Input, styles.DSR_Disabled]}
              value={formData.serviceDuration}
              editable={false}
            />

            {/* Remarks */}
            <Text style={styles.DSR_Label}>Remarks</Text>
            <TextInput
              style={[styles.DSR_Input, styles.DSR_TextArea]}
              value={formData.remarks}
              onChangeText={v => handleChange('remarks', v)}
              multiline
              numberOfLines={5}
            />

            {/* Buttons */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                marginTop: 20,
              }}>
              {/* Create Button */}
              <TouchableOpacity
                style={{
                  borderWidth: 1,
                  borderColor: '#0A66C2',
                  backgroundColor: '#fff',
                  paddingVertical: 12,
                  paddingHorizontal: 25,
                  borderRadius: 50,
                  alignItems: 'center',
                  marginRight: 10,
                }}
                onPress={handleCreate}>
                <Text
                  style={{color: '#0A66C2', fontWeight: '600', fontSize: 16}}>
                  Create
                </Text>
              </TouchableOpacity>

              {/* Create & Submit Button */}
              <TouchableOpacity
                style={{
                  backgroundColor: '#0A66C2',
                  paddingVertical: 12,
                  paddingHorizontal: 25,
                  borderRadius: 50,
                  alignItems: 'center',
                  marginRight: 10,
                }}
                onPress={handleCreateAndSubmit}>
                <Text style={{color: '#fff', fontWeight: '600', fontSize: 16}}>
                  Create & Submit
                </Text>
              </TouchableOpacity>

              {/* Cancel Button */}
              <TouchableOpacity
                style={{
                  borderWidth: 1,
                  borderColor: '#B0B0B0',
                  backgroundColor: '#fff',
                  paddingVertical: 12,
                  paddingHorizontal: 25,
                  borderRadius: 50,
                  alignItems: 'center',
                }}
                onPress={handleCancel}>
                <Text style={{color: '#555', fontWeight: '600', fontSize: 16}}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ActionPaneContainer>
  );
};

export default EOSRequestScreen;
