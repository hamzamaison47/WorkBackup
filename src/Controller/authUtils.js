import {authorize} from 'react-native-app-auth';
import {jwtDecode} from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {RetrieveByEmail} from '../API/PREmploymentInformation/RetrieveByEmail';
import {getAzureConfigurationV2, getGoogleConfiguration} from './configuration';

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
  initializeLegalEntity,
  setLegalEntities,
  provider,
) => {
  setLoading(true);
  if (provider === 'Azure') {
    try {
      const result = await authorize(getAzureConfigurationV2());
      if (result) {
        await handleSuccessfulLogin(
          result.accessToken,
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
      console.error('Login error:', error);
      // eslint-disable-next-line no-alert
      alert('Login failed. Please try again.');
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
          setDialogMessage,
          initializeLegalEntity,
          provider,
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

  let userEmailOrUPN;
  if (provider === 'Azure') {
    userEmailOrUPN = decodedAccessToken.upn;
  } else if (provider === 'Google') {
    userEmailOrUPN = decodedAccessToken.email;
  }
  //API call to get UserData from D365FO
  const employeeInfo = await fetchEmpInfo(userEmailOrUPN);
  console.log('Mapped DATA\n', employeeInfo);
  console.log(
    'Available Legal Entity\n',
    employeeInfo[0].EmployeeLegalEntities,
  );
  if (
    !employeeInfo.length ||
    !employeeInfo[0].value ||
    !employeeInfo[0].label ||
    employeeInfo[0].WorkerRecId === 0
  ) {
    setDialogMessage(
      'Incorrect Login Details.\n Please verify your Username and Password, or contact support if you are having trouble accessing your account.',
    );
    setDialogVisible(true);
    return;
  }

  // Set the available legal entities (from EmployeeLegalEntities array)
  const availableLegalEntities = employeeInfo[0].EmployeeLegalEntities || [];
  console.log('Available Legal Entity\n', availableLegalEntities);
  setLegalEntities(availableLegalEntities);

  // Initialize the legal entity (will check for previous user selection)
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
    employeeFullInfo: employeeInfo[0], // Store complete employee info
  });

  navigation.navigate('DrawerNavigator', {userName: decodedAccessToken.name});
};

export const fetchEmpInfo = async email => {
  try {
    if (!email) {
      console.error('Invalid email input:', email);
      return [];
    }

    const data = await RetrieveByEmail({email});
    console.log('Raw response from RetrieveByEmail:', data); // Debugging log

    if (!data || !Array.isArray(data)) {
      console.error('Unexpected data format:', data);
      return [];
    }

    // Process the employee info with legal entities
    return data.map(item => {
      const employeeLegalEntities =
        item.EmployeeLegalEntities?.['a:PREmployeeLegalEntitiesContract'] ?? [];

      return {
        label: item.EmployeeName?.toString() ?? '',
        value: item.EmployeeId?.toString() ?? '',
        WorkerRecId: item.WorkerRecId,
        JobId: item.JobId?.toString() ?? '',
        Department: item.Department?.toString() ?? '',
        DefaultLegalEntity: item.DefaultLegalEntity?.toString() ?? '',
        EmployeeLegalEntities: employeeLegalEntities.map(entity => ({
          LegalEntity: entity['a:LegalEntity']?.toString() ?? '', // FIX HERE
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
