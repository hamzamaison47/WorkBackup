import {decode as atob, encode as btoa} from 'base-64';

// Polyfill at the top of your authUtils file
if (typeof global.atob === 'undefined') {
  global.atob = atob;
}
if (typeof global.btoa === 'undefined') {
  global.btoa = btoa;
}

/* eslint-disable no-alert */
import {authorize} from 'react-native-app-auth';
import {jwtDecode} from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {RetrieveByEmail} from '../API/Authentication/RetrieveByEmail';
import {getAzureConfigurationV2, getGoogleConfiguration} from './configuration';

export const handleLogoutauth = async () => {
  try {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('idToken');
  } catch (error) {
    console.error('Logout error:', error);
    alert('Logout failed. Please try again.');
  }
};

export const handleLogin = async (
  setLoading,
  setUserData,
  navigation,
  setDialogVisible,
  setDialogMessage,
  setAlertModal,
  setAlertMessage,
  initializeLegalEntity,
  setLegalEntities,
  provider,
) => {
  setLoading(true);

  try {
    const config =
      provider === 'Azure'
        ? getAzureConfigurationV2()
        : getGoogleConfiguration();

    const result = await authorize(config);

    if (result) {
      const tokenToUse =
        provider === 'Azure' ? result.accessToken : result.idToken;

      await AsyncStorage.setItem(
        provider === 'Azure' ? 'accessToken' : 'idToken',
        tokenToUse,
      );

      await handleSuccessfulLogin(
        tokenToUse,
        setUserData,
        navigation,
        setDialogVisible,
        setDialogMessage,
        initializeLegalEntity,
        setLegalEntities,
        provider,
      );
    }
  } catch (error) {
    console.error('Login error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    setAlertMessage(`Login failed: ${error.message}. Please try again.`);
    setAlertModal(true);
  } finally {
    setLoading(false);
  }
};

export const handleSuccessfulLogin = async (
  accessToken,
  setUserData,
  navigation,
  setDialogVisible,
  setDialogMessage,
  initializeLegalEntity,
  setLegalEntities,
  provider,
) => {
  const decodedAccessToken = jwtDecode(accessToken);
  await AsyncStorage.setItem('accessToken', accessToken);

  const userEmailOrUPN =
    provider === 'Azure' ? decodedAccessToken.upn : decodedAccessToken.email;

  const employeeInfo = await fetchEmpInfo(userEmailOrUPN);

  if (
    !employeeInfo.length ||
    !employeeInfo[0].value ||
    !employeeInfo[0].label ||
    employeeInfo[0].WorkerRecId === 0
  ) {
    setDialogMessage(
      "Incorrect Login Details.\nYour email isn't registered in our system. Would you like to create an account?",
    );

    // Show popup
    setDialogVisible(true);

    // Save callback for OK button
    global.onDialogOk = () => {
      setDialogVisible(false);
      navigation.navigate('DrawerNavigator', {
        screen: 'RequestForRegistration',
      });
    };

    return;
  }

  const availableLegalEntities = employeeInfo[0].EmployeeLegalEntities || [];

  setLegalEntities(availableLegalEntities);
  await initializeLegalEntity(employeeInfo[0]?.DefaultLegalEntity);

  const {
    label: employeeName,
    value: employeeId,
    WorkerRecId,
    JobId,
    Department,
    DefaultLegalEntity,
  } = employeeInfo[0];

  setUserData({
    userName: decodedAccessToken.name,
    employeeName,
    employeeId,
    WorkerRecId,
    email: userEmailOrUPN,
    jobId: JobId,
    department: Department,
    defaultLegalEntity: DefaultLegalEntity,
    employeeFullInfo: employeeInfo[0],
  });

  navigation.navigate('DrawerNavigator', {
    userName: decodedAccessToken.name,
  });
};

export const fetchEmpInfo = async email => {
  try {
    if (!email) {
      console.error('Invalid email input:', email);
      return [];
    }

    const data = await RetrieveByEmail({email});
    if (!data || !Array.isArray(data)) {
      console.error('Unexpected data format:', data);
      return [];
    }

    return data.map(item => {
      const employeeLegalEntitiesRaw =
        item.EmployeeLegalEntities?.['a:PREmployeeLegalEntitiesContract'];

      const employeeLegalEntities = Array.isArray(employeeLegalEntitiesRaw)
        ? employeeLegalEntitiesRaw
        : employeeLegalEntitiesRaw
        ? [employeeLegalEntitiesRaw]
        : [];

      return {
        label: item.EmployeeName?.toString() ?? '',
        value: item.EmployeeId?.toString() ?? '',
        WorkerRecId: item.WorkerRecId,
        JobId: item.JobId?.toString() ?? '',
        Department: item.Department?.toString() ?? '',
        DefaultLegalEntity: item.DefaultLegalEntity?.toString() ?? '',
        EmployeeLegalEntities: employeeLegalEntities.map(entity => ({
          LegalEntity: entity['a:LegalEntity']?.toString() ?? '',
        })),
        BasicSalary: item.BasicSalary,
        Currency: item.Currency,
        PayGroupCode: item.PayGroupCode,
      };
    });
  } catch (error) {
    console.error('Error in fetchEmpInfo:', error);
    return [];
  }
};
