/* eslint-disable react-native/no-inline-styles */
import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Dropdown} from 'react-native-element-dropdown';
import CalendarModal from '../../components/Leaves/CalendarModal';
import Icon from 'react-native-vector-icons/FontAwesome';
import {useSelector} from 'react-redux';
import usePalette from '../../hooks/usePalette';

import ActionPaneContainer from '../../components/ActionPaneContainer';
import styles from '../../styles/styles';
import {RetrieveCertificateType} from '../../API/Certificates/RetrieveCertificateType';
import {CreateCertificate} from '../../API/Certificates/CreateCertificate';

// Format Date
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
const ESSEmployeeCertificate_Saverecord = () => {
  const navigation = useNavigation();
  const scrollRef = useRef(null);
  const today = new Date().toISOString().split('T')[0];
  const P = usePalette();

  /** ✅ Dropdown Data */
  const [certificateTypes, setCertificateTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  /** ✅ Calendar State */
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const userData = useSelector(state => state.user.userData);

  useEffect(() => {
    loadCertificateTypes();
  }, []);

  const loadCertificateTypes = async () => {
    try {
      setLoading(true);

      const result = await RetrieveCertificateType();

      const formatted = result.map(item => ({
        label: item.description,
        value: item.certificateType,
        description: item.description, // keep full object
      }));

      setCertificateTypes(formatted);
    } catch (error) {
      console.error('Error loading certificate types:', error);
      setCertificateTypes([]);
    } finally {
      setLoading(false);
    }
  };

  /** ✅ Form State */
  const [formData, setFormData] = useState({
    certificateType: '',
    description: '',
    startDate: today,
    endDate: today,
    notes: '',
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({...prev, [field]: value}));
  };

  /** ✅ Dropdown Change (Auto Fill Description) */
  const handleCertificateChange = item => {
    setFormData(prev => ({
      ...prev,
      certificateType: item.value,
      description: item.description, // auto-fill
    }));
  };

  /** ✅ Date Handlers */
  const handleStartDateChange = date => {
    const formatted = new Date(date).toISOString().split('T')[0];

    setShowStartCalendar(false);

    setFormData(prev => ({
      ...prev,
      startDate: formatted,
    }));
  };

  const handleEndDateChange = date => {
    const formatted = new Date(date).toISOString().split('T')[0];

    setShowEndCalendar(false);

    setFormData(prev => ({
      ...prev,
      endDate: formatted,
    }));
  };

  const handleSubmit = async () => {
    try {
      if (!formData.certificateType) {
        console.log('Certificate Type is required');
        return;
      }

      // ✅ Prepare payload
      const payload = {
        certificateType: formData.certificateType,
        issueDate: formData.startDate + 'T12:00:00',
        expirationDate: formData.endDate + 'T12:00:00',
        note: formData.notes,
      };

      const person = userData?.WorkerRecId; // ✅ MUST be RecId

      console.log('CREATE PAYLOAD:', payload);

      const result = await CreateCertificate({
        certificateData: payload,
        person: person,
      });

      console.log('SUCCESS:', result);

      // ✅ After success → go back
      navigation.goBack();
    } catch (error) {
      console.error('Create failed:', error);
    }
  };
  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <ActionPaneContainer pageTitle="Employee Certificate" isBackButton={true}>
      <SafeAreaView style={styles.DSR_SafeArea}>
        <KeyboardAvoidingView
          style={{flex: 1}}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.DSR_FormContainer}
            showsVerticalScrollIndicator={false}>
            {/* Certificate Type */}
            <Text style={styles.DSR_Label}>Certificate Type</Text>
            <Dropdown
              style={styles.DSR_Input}
              data={certificateTypes}
              labelField="label"
              valueField="value"
              value={formData.certificateType}
              placeholder={loading ? 'Loading...' : 'Select Certificate Type'}
              onChange={handleCertificateChange}
            />

            {/* Description (AUTO FILLED) */}
            <Text style={styles.DSR_Label}>Description</Text>
            <TextInput
              style={[styles.DSR_Input, {backgroundColor: '#f2f2f2'}]}
              value={formData.description}
              editable={false}
            />

            {/* Start Date */}
            <Text style={styles.DSR_Label}>Start Date</Text>
            <TouchableOpacity
              style={styles.DSR_DateSelector}
              onPress={() => setShowStartCalendar(true)}>
              <Text style={styles.DSR_DateText}>
                {formatDate(formData.startDate)}
              </Text>
              <Icon name="calendar" size={18} color={P.primaryStrong} />
            </TouchableOpacity>

            {/* End Date */}
            <Text style={styles.DSR_Label}>End Date</Text>
            <TouchableOpacity
              style={styles.DSR_DateSelector}
              onPress={() => setShowEndCalendar(true)}>
              <Text style={styles.DSR_DateText}>
                {formatDate(formData.endDate)}
              </Text>
              <Icon name="calendar" size={18} color={P.primaryStrong} />
            </TouchableOpacity>

            {/* Notes */}
            <Text style={styles.DSR_Label}>Notes</Text>
            <TextInput
              style={[styles.DSR_Input, styles.DSR_TextArea]}
              value={formData.notes}
              onChangeText={v => handleChange('notes', v)}
              placeholder="Enter notes"
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
              <TouchableOpacity
                style={{
                  backgroundColor: P.primary,
                  paddingVertical: 12,
                  paddingHorizontal: 30,
                  borderRadius: 50,
                  marginRight: 10,
                }}
                onPress={handleSubmit}>
                <Text style={{color: P.onPrimary}}>Submit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  borderWidth: 1,
                  borderColor: '#B0B0B0',
                  paddingVertical: 12,
                  paddingHorizontal: 30,
                  borderRadius: 50,
                }}
                onPress={handleCancel}>
                <Text>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* ✅ Calendar Modals */}
      {showStartCalendar && (
        <CalendarModal
          visible={showStartCalendar}
          initialDate={formData.startDate}
          onDateSelected={handleStartDateChange}
          onClose={() => setShowStartCalendar(false)}
        />
      )}

      {showEndCalendar && (
        <CalendarModal
          visible={showEndCalendar}
          initialDate={formData.endDate}
          onDateSelected={handleEndDateChange}
          onClose={() => setShowEndCalendar(false)}
        />
      )}
    </ActionPaneContainer>
  );
};

export default ESSEmployeeCertificate_Saverecord;
