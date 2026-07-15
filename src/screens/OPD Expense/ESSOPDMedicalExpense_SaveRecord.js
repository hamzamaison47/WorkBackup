/* eslint-disable react-native/no-inline-styles */
import React, {useState, useRef} from 'react';
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
import usePalette from '../../hooks/usePalette';

import ActionPaneContainer from '../../components/ActionPaneContainer';
import styles from '../../styles/styles';

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

const ESSOPDMedicalExpense_SaveRecord = () => {
  const navigation = useNavigation();
  const scrollRef = useRef(null);
  const today = new Date().toISOString().split('T')[0];
  const P = usePalette();

  /** ✅ Dropdown Data */
  const relationData = [
    {label: 'Self', value: 'Self'},
    {label: 'Spouse', value: 'Spouse'},
    {label: 'Child', value: 'Child'},
    {label: 'Parent', value: 'Parent'},
  ];

  /** ✅ Form State */
  const [formData, setFormData] = useState({
    patientName: '',
    relation: '',
    hospitalName: '',
    doctorName: '',
    visitDate: today,
    diagnosis: '',
    consultationFee: '',
    medicineCost: '',
    labCharges: '',
    otherCharges: '',
    totalAmount: 0,
    attachment: '',
    remarks: '',
  });

  /** ✅ Handle Change + Auto Total */
  const handleChange = (field, value) => {
    const updated = {...formData, [field]: value};

    // Auto total calculation
    const total =
      Number(updated.consultationFee || 0) +
      Number(updated.medicineCost || 0) +
      Number(updated.labCharges || 0) +
      Number(updated.otherCharges || 0);

    updated.totalAmount = total;

    setFormData(updated);
  };

  const handleSubmit = () => {
    console.log('Submitted:', formData);
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <ActionPaneContainer pageTitle="OPD Medical Expense" isBackButton={true}>
      <SafeAreaView style={styles.DSR_SafeArea}>
        <KeyboardAvoidingView
          style={{flex: 1}}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.DSR_FormContainer}
            showsVerticalScrollIndicator={false}>
            {/* Patient Name */}
            <Text style={styles.DSR_Label}>Patient Name</Text>
            <TextInput
              style={styles.DSR_Input}
              value={formData.patientName}
              onChangeText={v => handleChange('patientName', v)}
              placeholder="Enter patient name"
            />

            {/* Relation */}
            <Text style={styles.DSR_Label}>Relation</Text>
            <Dropdown
              style={styles.DSR_Input}
              data={relationData}
              labelField="label"
              valueField="value"
              value={formData.relation}
              placeholder="Select relation"
              onChange={item => handleChange('relation', item.value)}
            />

            {/* Hospital */}
            {/* <Text style={styles.DSR_Label}>Hospital / Clinic</Text>
            <TextInput
              style={styles.DSR_Input}
              value={formData.hospitalName}
              onChangeText={v => handleChange('hospitalName', v)}
              placeholder="Enter hospital name"
            /> */}

            {/* Doctor */}
            {/* <Text style={styles.DSR_Label}>Doctor Name</Text>
            <TextInput
              style={styles.DSR_Input}
              value={formData.doctorName}
              onChangeText={v => handleChange('doctorName', v)}
              placeholder="Enter doctor name"
            /> */}

            {/* Visit Date */}
            {/* <Text style={styles.DSR_Label}>Visit Date</Text>
            <TouchableOpacity style={styles.DSR_DateSelector}>
              <Text style={styles.DSR_DateText}>
                {formatDate(formData.visitDate)}
              </Text>
            </TouchableOpacity> */}

            {/* Diagnosis */}
            <Text style={styles.DSR_Label}>Diagnosis</Text>
            <TextInput
              style={styles.DSR_Input}
              value={formData.diagnosis}
              onChangeText={v => handleChange('diagnosis', v)}
              placeholder="Enter diagnosis"
            />

            {/* 💰 Expense Fields */}
            <Text style={styles.DSR_Label}>Consultation Fee</Text>
            <TextInput
              style={styles.DSR_Input}
              keyboardType="numeric"
              value={formData.consultationFee}
              onChangeText={v => handleChange('consultationFee', v)}
            />

            <Text style={styles.DSR_Label}>Medicine Cost</Text>
            <TextInput
              style={styles.DSR_Input}
              keyboardType="numeric"
              value={formData.medicineCost}
              onChangeText={v => handleChange('medicineCost', v)}
            />

            {/* <Text style={styles.DSR_Label}>Lab Charges</Text>
            <TextInput
              style={styles.DSR_Input}
              keyboardType="numeric"
              value={formData.labCharges}
              onChangeText={v => handleChange('labCharges', v)}
            /> */}

            {/* <Text style={styles.DSR_Label}>Other Charges</Text>
            <TextInput
              style={styles.DSR_Input}
              keyboardType="numeric"
              value={formData.otherCharges}
              onChangeText={v => handleChange('otherCharges', v)}
            /> */}

            {/* Total */}
            <Text style={styles.DSR_Label}>Total Amount</Text>
            <Text style={[styles.DSR_Input, styles.DSR_Disabled]}>
              {formData.totalAmount}
            </Text>

            {/* 📎 Attachment */}
            <Text style={styles.DSR_Label}>Attachment</Text>
            <TouchableOpacity
              style={styles.DSR_DateSelector}
              onPress={() => console.log('Open file picker')}>
              <Text style={styles.DSR_DateText}>
                {formData.attachment || 'Upload Attachment'}
              </Text>
            </TouchableOpacity>

            {/* Remarks */}
            {/* <Text style={styles.DSR_Label}>Remarks</Text>
            <TextInput
              style={[styles.DSR_Input, styles.DSR_TextArea]}
              value={formData.remarks}
              onChangeText={v => handleChange('remarks', v)}
              multiline
            /> */}

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
                  padding: 12,
                  borderRadius: 50,
                  marginRight: 10,
                }}
                onPress={handleSubmit}>
                <Text style={{color: '#fff'}}>Submit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  borderWidth: 1,
                  borderColor: '#999',
                  padding: 12,
                  borderRadius: 50,
                }}
                onPress={handleCancel}>
                <Text>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ActionPaneContainer>
  );
};

export default ESSOPDMedicalExpense_SaveRecord;
