// authUtils.js
import {authorize} from 'react-native-app-auth';
import {jwtDecode} from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {RetrieveByEmail} from '../API/PREmploymentInformation/RetrieveByEmail';

const config = {
  // issuer: 'https://mcs-payroll-016b0b233774105bf1aos.ax cloud.dynamics.com',
  issuer: 'https://maison-uat.sandbox.operations.dynamics.com',
  clientId: '44c7cff3-bed3-4644-bed9-36c7c0a13dbe',
  redirectUrl: 'authentication://callback',
  scopes: ['openid', 'profile', 'email'],
  serviceConfiguration: {
    authorizationEndpoint:
      'https://login.microsoftonline.com/5df08255-a152-4fbc-a174-0d8a182aa594/oauth2/v2.0/authorize',
    tokenEndpoint:
      'https://login.microsoftonline.com/5df08255-a152-4fbc-a174-0d8a182aa594/oauth2/v2.0/token',
  },
};

// const config = {
//   //???? why issuer is Dynamics
//   // issuer: process.env.resource,
//   issuer: 'https://mcs-payroll-016b0b233774105bf1aos.axcloud.dynamics.com',
//   // issuer: 'https://maison-uat.sandbox.operations.dynamics.com',
//   //????

//   clientId: '44c7cff3-bed3-4644-bed9-36c7c0a13dbe',
//   // clientId: process.env.client_id,
//   redirectUrl: 'authentication://callback',
//   scopes: ['openid', 'profile', 'email'],
//   serviceConfiguration: {
//     authorizationEndpoint:
//       'https://login.microsoftonline.com/5df08255-a152-4fbc-a174-0d8a182aa594/oauth2/v2.0/authorize',
//     tokenEndpoint:
//       'https://login.microsoftonline.com/5df08255-a152-4fbc-a174-0d8a182aa594/oauth2/v2.0/token',
//   },
// };

// const config = {
//   // Azure AD issuer (identity provider)
//   issuer:
//     'https://login.microsoftonline.com/5df08255-a152-4fbc-a174-0d8a182aa594/v2.0',

//   // Client ID from Azure App Registration
//   clientId: '33d55aaf-fb09-4f76-bede-4346965e74b6',

//   // Redirect URL defined in Azure AD
//   redirectUrl: 'authentication://callback',

//   // Required scopes
//   scopes: ['openid', 'profile', 'email'],

//   // Azure endpoints for authorization and token
//   serviceConfiguration: {
//     authorizationEndpoint:
//       'https://login.microsoftonline.com/5df08255-a152-4fbc-a174-0d8a182aa594/oauth2/v2.0/authorize',
//     tokenEndpoint:
//       'https://login.microsoftonline.com/5df08255-a152-4fbc-a174-0d8a182aa594/oauth2/v2.0/token',
//   },
// };

export const handleLogin = async (
  setLoading,
  setUserData,
  navigation,
  setDialogVisible,
  setDialogMessage,
) => {
  setLoading(true);
  try {
    const result = await authorize(config);
    if (result) {
      await handleSuccessfulLogin(
        result.accessToken,
        setUserData,
        navigation,
        setDialogVisible,
        setDialogMessage,
      );
    }
  } catch (error) {
    console.error('Login error:', error);
    // eslint-disable-next-line no-alert
    alert('Login failed. Please try again.');
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
) => {
  const decodedAccessToken = jwtDecode(accessToken);
  console.log('Decoded Access Token:', decodedAccessToken);

  // Store access token in AsyncStorage
  await AsyncStorage.setItem('accessToken', accessToken);

  // Fetch employee info
  const employeeInfo = await fetchEmpInfo(decodedAccessToken.upn);
  if (employeeInfo.length > 0) {
    const {
      label: employeeName,
      value: employeeId,
      WorkerRecId,
    } = employeeInfo[0];

    // Update user context
    setUserData({
      userName: decodedAccessToken.name,
      employeeName,
      employeeId,
      WorkerRecId,
      email: decodedAccessToken.upn,
    });

    // Navigate to the main dashboard
    navigation.navigate('DrawerNavigator', {userName: decodedAccessToken.name});
  } else {
    setDialogMessage(
      'No employee information found. Please check your account.',
    );
    setDialogVisible(true);
    return;
  }
};

export const fetchEmpInfo = async email => {
  try {
    if (!email) {
      console.error('Invalid email input:', email);
      return [];
    }

    console.log('Fetching employee info for:', email);

    const data = await RetrieveByEmail({dataAreaId: 'dat', email});

    if (!Array.isArray(data)) {
      console.error('Unexpected data format:', data);
      return [];
    }

    return data.map(item => ({
      label: item.EmployeeName?.toString() ?? '',
      value: item.EmployeeId?.toString() ?? '',
      WorkerRecId: item.WorkerRecId,
    }));
  } catch (error) {
    console.error('Error in fetchEmpInfo:', error);
    return [];
  }
};

// export const fetchEmpInfo = async email => {
//   try {
//     console.log('Fetching employee info for:', email);
//     const data = await RetrieveByEmail({dataAreaId: 'dat', email});
//     console.log('Employee data:', data);

//     return data.map(item => ({
//       label: item.EmployeeName.toString(),
//       value: item.EmployeeId.toString(),
//       WorkerRecId: item.WorkerRecId,
//     }));
//   } catch (error) {
//     return [];
//   }
// };
