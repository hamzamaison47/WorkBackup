import {authorize} from 'react-native-app-auth';
import {jwtDecode} from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {RetrieveByEmail} from '../API/PREmploymentInformation/RetrieveByEmail';
import {
  getAzureConfigurationV2,
  getGoogleConfiguration,
} from './config/configuration';

export const handleLogoutauth = async Provider => {
  if (Provider === 'Azure') {
    try {
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('idToken');
    } catch (error) {
      console.error('Logout error:', error);
      // eslint-disable-next-line no-alert
      alert('Logout failed. Please try again.');
    }
  } else if (Provider === 'Google') {
    try {
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('idToken');
    } catch (error) {
      console.error('Logout error:', error);
      // eslint-disable-next-line no-alert
      alert('Logout failed. Please try again.');
    }
  }
};

export const handleLogin = async (
  setLoading,
  setUserData,
  navigation,
  setDialogVisible,
  setDialogMessage,
  provider,
) => {
  setLoading(true);

  //Hnadling User Authentication for App(Interface not for D365)
  //Conditions based on the Providers
  if (provider === 'Azure') {
    try {
      const result = await authorize(getAzureConfigurationV2());
      console.log('Result (Azure) <===========>', result);
      if (result) {
        await handleSuccessfulLogin(
          result.accessToken,
          setUserData,
          navigation,
          setDialogVisible,
          setDialogMessage,
          'Azure',
        );
      }
    } catch (error) {
      if (error.code === 'access_denied') {
        // eslint-disable-next-line no-alert
        alert('Login Process Cancelled');
      } else if (error.error === 'User cancelled flow') {
        //do Nothing As User Himself has Cancelled the Process
      }
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  } else if (provider === 'Google') {
    try {
      const result = await authorize(getGoogleConfiguration());
      console.log('Result (Google) <===========>', result);

      if (result) {
        await AsyncStorage.setItem('idToken', result.idToken);
        await handleSuccessfulLogin(
          result.idToken,
          setUserData,
          navigation,
          setDialogVisible,
          setDialogMessage,
          'Google',
        );
      }
    } catch (error) {
      console.error('Login error:', error);
      // eslint-disable-next-line no-alert
      alert('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }
};

//Checking If user Exists in D365FO
export const handleSuccessfulLogin = async (
  accessToken,
  setUserData,
  navigation,
  setDialogVisible,
  setDialogMessage,
  provider,
) => {
  const decodedAccessToken = jwtDecode(accessToken);

  await AsyncStorage.setItem('accessToken', accessToken);

  let userEmailOrUPN;

  if (provider === 'Azure') {
    userEmailOrUPN = decodedAccessToken.upn;
  } else if (provider === 'Google') {
    userEmailOrUPN = decodedAccessToken.email;
  }
  //API call to get UserData from D365FO
  const employeeInfo = await fetchEmpInfo(userEmailOrUPN);
  if (
    !employeeInfo.length ||
    !employeeInfo[0].value ||
    !employeeInfo[0].label ||
    employeeInfo[0].WorkerRecId === 0
  ) {
    //If User Data is not Found in Dynamics then to do here
  }

  //Assigning Data needed in cache to an Object
  const {
    label: employeeName,
    value: employeeId,
    WorkerRecId,
    JobId,
    Department,
  } = employeeInfo[0];

  //setting User Data in Cache
  setUserData({
    userName: decodedAccessToken.name,
    employeeName,
    employeeId,
    WorkerRecId,
    email: userEmailOrUPN,
    jobId: JobId, // Add JobId to user data
    department: Department, // Add Department to user data
    Provider: provider,
  });

  navigation.navigate('DrawerNavigator', {userName: decodedAccessToken.name});
};

export const fetchEmpInfo = async email => {
  try {
    if (!email) {
      console.error('Invalid email input:', email);
      return [];
    }

    const data = await RetrieveByEmail({dataAreaId: 'DAT', email});

    if (!data || !Array.isArray(data)) {
      console.error('Unexpected data format:', data);
      return []; // Always return an empty array if data is invalid
    }

    return data.map(item => ({
      label: item.EmployeeName?.toString() ?? '',
      value: item.EmployeeId?.toString() ?? '',
      WorkerRecId: item.WorkerRecId,
      JobId: item.JobId?.toString() ?? '', // Extract JobId
      Department: item.Department?.toString() ?? '', // Extract Department
    }));
  } catch (error) {
    console.error('Error in fetchEmpInfo:', error);
    return []; // Always return an empty array in case of error
  }
};
