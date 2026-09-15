/* eslint-disable curly */
/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect, useMemo} from 'react';
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
import usePalette from '../../hooks/usePalette';

const RequestForRegistration = () => {
  const navigation = useNavigation();
  const P = usePalette();
  const S = useMemo(() => makeStyles(P), [P]);
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
      <SafeAreaView style={S.container}>
        <Image source={require('../../assets/cloud.png')} style={S.logo} />

        <Text style={S.title}>Request For Registration</Text>

        <TextInput
          style={S.input}
          placeholder="Enter Email"
          placeholderTextColor="#999"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={S.input}
          placeholder="Enter Employee ID"
          placeholderTextColor="#999"
          value={employeeId}
          onChangeText={setEmployeeId}
        />

        <TouchableOpacity style={S.button} onPress={handleRegister}>
          <Text style={S.buttonText}>Register</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <PopupDialog
        visible={exitModal}
        onTouchOutside={() => setExitModal(false)}
        dialogStyle={S.dialogContainer}
        width={0.85}
        height={0.22}
        dialogTitle={<Text style={S.dialogTitle}>Confirm Exit</Text>}>
        <View style={S.dialogContent}>
          <Text style={S.dialogMessage}>{alertMessage}</Text>
          <View style={S.dialogButtonsRow}>
            <TouchableOpacity
              style={[S.dialogButton, {backgroundColor: '#999'}]}
              onPress={() => setExitModal(false)}>
              <Text style={S.dialogButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[S.dialogButton, {backgroundColor: P.primary}]}
              onPress={() => {
                setExitModal(false);
                navigation.navigate('Login');
              }}>
              <Text style={S.dialogButtonText}>Yes</Text>
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

const makeStyles = P =>
  StyleSheet.create({
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
      color: P.primaryStrong,
    },
    input: {
      height: 50,
      borderColor: P.primaryStrong,
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
      borderColor: P.primaryStrong,
      alignItems: 'center',
      marginTop: 10,
      elevation: 2, // subtle shadow on Android
    },
    buttonText: {
      color: P.primaryStrong,
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
      color: P.primaryStrong,
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
      color: P.onPrimary,
      fontSize: 15,
      fontWeight: '600',
    },
  });

export default RequestForRegistration;
