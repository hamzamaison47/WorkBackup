/* eslint-disable curly */
/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect} from 'react';
import {
  Text,
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  BackHandler,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import PopupDialog from 'react-native-popup-dialog';
import AlertModal from '../../components/Alert/AlertModal';
import {RegisterNewEmployee} from '../../API/RequestForRegistration/RegisterNewEmployee';

const RequestForRegistration = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [exitModal, setExitModal] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    const backAction = () => {
      setAlertMessage('Are you sure you want to go back?');
      setExitModal(true);
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [navigation]);

  // const handleRegister = () => {
  const handleRegister = async () => {
    const missingFields = [];

    if (!email.trim()) missingFields.push('Email');
    if (!employeeId.trim()) missingFields.push('Employee ID');

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      missingFields.push('Enter a valid Email address');
    }

    if (missingFields.length > 0) {
      const message =
        'Please fill in the following required fields:\n' +
        missingFields.join('\n');
      setAlertMessage(message);
      setAlertModal(true);
      return;
    }

    try {
      const response = await RegisterNewEmployee({
        registerData: {
          Email: email,
          EmployeeID: employeeId,
        },
      });

      console.log('API Response:', response);

      if (response?.IsSuccess === 'true') {
        setAlertMessage('Registration successful!');
        setAlertModal(true);
      } else {
        setAlertMessage(
          response?.Message || 'Registration failed. Please try again.',
        );
        setAlertModal(true);
      }
    } catch (error) {
      console.error('Registration API error:', error);
      setAlertMessage('Error during registration. Please try again.');
      setAlertModal(true);
    }
  };

  return (
    <>
      <SafeAreaView style={styles.container}>
        <Image source={require('../../assets/cloud.png')} style={styles.logo} />

        <Text style={styles.title}>Request For Registration</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter Email"
          placeholderTextColor="#999"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Enter Employee ID"
          placeholderTextColor="#999"
          value={employeeId}
          onChangeText={setEmployeeId}
        />

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <PopupDialog
        visible={exitModal}
        onTouchOutside={() => setExitModal(false)}
        dialogStyle={styles.dialogContainer}
        width={0.85}
        height={0.22}
        dialogTitle={<Text style={styles.dialogTitle}>Confirm Exit</Text>}>
        <View style={styles.dialogContent}>
          <Text style={styles.dialogMessage}>{alertMessage}</Text>
          <View style={styles.dialogButtonsRow}>
            <TouchableOpacity
              style={[styles.dialogButton, {backgroundColor: '#999'}]}
              onPress={() => setExitModal(false)}>
              <Text style={styles.dialogButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dialogButton, {backgroundColor: '#0A66C2'}]}
              onPress={() => {
                setExitModal(false);
                navigation.navigate('Login');
              }}>
              <Text style={styles.dialogButtonText}>Yes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </PopupDialog>

      <AlertModal
        visible={alertModal}
        heading="Alert"
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#ffffffff',
  },
  logo: {
    width: 250,
    height: 100,
    marginBottom: 20,
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 30,
    color: '#0A66C2',
  },
  input: {
    height: 50,
    borderColor: '#0A66C2',
    borderWidth: 1.5,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#ffffffff',
    paddingVertical: 14,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#0A66C2',
    alignItems: 'center',
    marginTop: 10,
    elevation: 2, // subtle shadow on Android
  },
  buttonText: {
    color: '#0A66C2',
    fontSize: 17,
    fontWeight: 'bold',
  },
  dialogContainer: {
    borderRadius: 12,
    padding: 15,
    backgroundColor: '#fff',
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0A66C2',
    textAlign: 'center',
    marginBottom: 5,
  },
  dialogContent: {
    alignItems: 'center',
    paddingTop: 10,
  },
  dialogMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  dialogButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // width: '80%',
  },
  dialogButton: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
  },
  dialogButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default RequestForRegistration;
