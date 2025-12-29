/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import {decode as atob, encode as btoa} from 'base-64';
import {authorize} from 'react-native-app-auth';
import {jwtDecode} from 'jwt-decode';
import {getActiveConfigData} from './secureConfig';
import {getAzureConfigurationV2, getGoogleConfiguration} from './configuration';
import {saveAccountAfterLogin} from '../store/utils/biometricUtils';
import firebaseService from '../store/FirebaseService';
import {store} from '../store';
import {
  setAccessToken,
  setIdToken,
  setRefreshToken,
  clearAuthTokens,
} from '../store/slices/authSlice';
import {
  setFirebaseUserData,
  clearFirebaseData,
  setFirebaseInitialized,
} from '../store/slices/firebaseSlice';
import {clearBiometric} from '../store/slices/biometricSlice';
import {setSkipLoginAfterRestart} from '../store/slices/languageSlice';

import {RetrieveUserInfoByEmail} from '../API/Auth/RetrieveUserInfoByEmail';
import {RetrieveEmployeeLegalEntities} from '../API/Auth/RetrieveEmployeeLegalEntities';
import {RetrieveEmployeeMenuItems} from '../API/Auth/RetrieveEmployeeMenuItems';

// Polyfill at the top of your authUtils file
if (typeof global.atob === 'undefined') {
  global.atob = atob;
}
if (typeof global.btoa === 'undefined') {
  global.btoa = btoa;
}

// export const handleLogoutauth = async (navigation, dispatch) => {
//   try {
//     // Clear AsyncStorage tokens
//     await AsyncStorage.multiRemove(['accessToken', 'idToken', 'refreshToken']);

//     // Clear Redux store
//     dispatch(setUserData(null)); // Clear user data
//     dispatch(setLegalEntities([])); // Clear legal entities
//     dispatch(setMenuItems([])); // Clear menu items

//     // Clear accounts list but keep biometric credentials
//     // This ensures only current logged-in account shows in BiometricSettings
//     try {
//       const AsyncStorage = (
//         await import('@react-native-async-storage/async-storage')
//       ).default;

//       // Clear only the accounts list - biometric credentials stay in Keychain
//       await AsyncStorage.removeItem('accounts_list');

//       // // Clear any biometric credentials
//       // try {
//       //   const {disableBiometric} = await import(
//       //     '../store/utils/biometricUtils'
//       //   );
//       //   await disableBiometric();
//       // } catch (error) {
//       //   console.log('Error clearing biometric credentials:', error);
//       // }

//       // console.log('Logged out - Accounts list cleared');
//     } catch (error) {
//       console.log('Error clearing accounts list:', error);
//     }

//     // Navigate to Login screen
//     navigation.reset({
//       index: 0,
//       routes: [{name: 'Login'}],
//     });
//   } catch (error) {
//     console.error('Logout error:', error);
//     // Fallback navigation
//     navigation.reset({
//       index: 0,
//       routes: [{name: 'Login'}],
//     });
//   }
// };
export const handleLogoutauth = async (navigation, dispatch) => {
  try {
    // Cleanup Firebase service
    await firebaseService.cleanup();

    // Clear Redux store - all state management now via Redux
    dispatch(clearAuthTokens());
    dispatch(setUserData(null));
    dispatch(setLegalEntities([]));
    dispatch(setMenuItems([]));
    dispatch(clearFirebaseData());
    dispatch(clearBiometric());
    dispatch(setSkipLoginAfterRestart(false));

    console.log('User logged out and Redux state cleared');

    // Navigate to Login screen
    navigation.reset({
      index: 0,
      routes: [{name: 'Login'}],
    });
  } catch (error) {
    console.error('Logout error:', error);
    navigation.reset({
      index: 0,
      routes: [{name: 'Login'}],
    });
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
  setMenuItems,
  provider,
) => {
  setLoading(true);

  try {
    // Use the new active config system
    const scan = await getActiveConfigData();
    if (!scan || Object.keys(scan).length === 0) {
      setAlertMessage(
        'Login failed\nPlease setup your environment configuration first',
      );
      setAlertModal(true);
      setLoading(false);
      global.onDialogOk = () => {
        setAlertModal(false); // close the alert
        navigation.navigate('ConfigSelectionScreen'); // navigate to config screen
      };
      return;
    }

    const config =
      provider === 'Azure'
        ? await getAzureConfigurationV2()
        : getGoogleConfiguration();

    const result = await authorize(config);

    if (result) {
      const tokenToUse =
        provider === 'Azure' ? result.accessToken : result.idToken;

      // Store tokens in Redux
      if (provider === 'Azure') {
        store.dispatch(setAccessToken(tokenToUse));
      } else {
        store.dispatch(setIdToken(tokenToUse));
      }
      store.dispatch(setRefreshToken(result.refreshToken));

      // Pass the complete result object to handleSuccessfulLogin
      await handleSuccessfulLogin(
        tokenToUse,
        result,
        setUserData,
        navigation,
        setDialogVisible,
        setDialogMessage,
        initializeLegalEntity,
        setLegalEntities,
        setMenuItems,
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
  authResult,
  setUserData,
  navigation,
  setDialogVisible,
  setDialogMessage,
  initializeLegalEntity,
  setLegalEntities,
  setMenuItems,
  provider,
) => {
  try {
    const decodedAccessToken = jwtDecode(accessToken);
    // Store access token in Redux
    store.dispatch(setAccessToken(accessToken));

    const userEmailOrUPN =
      provider === 'Azure' ? decodedAccessToken.upn : decodedAccessToken.email;

    // Step 1: Get user info first
    const userInfo = await fetchUserInfo(userEmailOrUPN);

    if (
      !userInfo.length ||
      !userInfo[0].EmployeeName ||
      !userInfo[0].EmployeeId ||
      userInfo[0].WorkerRecId === 0
    ) {
      setDialogMessage(
        "Incorrect Login Details.\nYour email isn't registered in our system. Would you like to create an account?",
      );

      setDialogVisible(true);

      global.onDialogOk = () => {
        setDialogVisible(false);
        navigation.navigate('RequestForRegistration');
      };

      return;
    }

    const user = userInfo[0];

    // Step 2: Initialize default legal entity in Redux first
    await initializeLegalEntity(user.DefaultLegalEntity);

    // Step 3: Fetch legal entities using the employee ID
    const legalEntities = await fetchEmployeeLegalEntities(user.EmployeeId);
    const menus = await fetchEmployeeMenuItems(user.EmployeeId);

    // Step 4: Set legal entities in Redux
    setLegalEntities(legalEntities);
    setMenuItems(menus);

    // Step 5: Prepare complete user data object
    const completeUserData = {
      userName: decodedAccessToken.name,
      employeeName: user.EmployeeName,
      employeeId: user.EmployeeId,
      WorkerRecId: user.WorkerRecId,
      email: userEmailOrUPN,
      jobId: user.JobId,
      department: user.Department,
      defaultLegalEntity: user.DefaultLegalEntity,
      PositionDescription: user.PositionDescription,
      CreatedBy: user.CreatedBy,
      CreatedDateTime: user.CreatedDateTime,
      DataAreaId: user.DataAreaId,
      IsEnrolledInPayroll: user.IsEnrolledInPayroll,
      JobDescription: user.JobDescription,
      ModifiedBy: user.ModifiedBy,
      ModifiedDateTime: user.ModifiedDateTime,
      OriginalHireDate: user.OriginalHireDate,
      Partition: user.Partition,
      Person: user.Person,
      Positionid: user.Positionid,
      RecId: user.RecId,
      isDynamicsUser: user.isDynamicsUser,
      employeeFullInfo: user,
    };

    // Set user data in Redux
    setUserData(completeUserData);

    // Step 6: CRITICAL - Clear previous user's Firebase data FIRST
    console.log('Clearing previous Firebase data before setting new user data');
    store.dispatch(clearFirebaseData());

    // Then save NEW user's Firebase data to Redux
    console.log(
      'Setting Firebase user data for:',
      userEmailOrUPN,
      user.EmployeeId,
    );
    store.dispatch(
      setFirebaseUserData({
        userEmail: userEmailOrUPN,
        employeeId: user.EmployeeId,
        company: user.DefaultLegalEntity,
      }),
    );

    // Mark Firebase as initialized
    store.dispatch(setFirebaseInitialized(true));

    // Step 7: Register device with Dynamics for push notifications (PHASE 1)
    try {
      console.log('Starting Firebase device registration...');
      // const registrationResult =
      //   await firebaseService.registerDeviceWithDynamics();
      const registrationResult = await firebaseService.syncDeviceAfterLogin();

      if (registrationResult.success) {
        console.log(
          'Firebase registration successful:',
          registrationResult.message,
        );
      } else {
        console.warn(
          'Firebase registration warning:',
          registrationResult.message,
        );
        // Don't block login, just log warning
      }
    } catch (firebaseError) {
      console.error('Firebase registration error:', firebaseError);
      // Don't block login on Firebase errors
    }

    // Step 8: Save account with complete user data
    const savedAccount = await saveAccountAfterLogin(userEmailOrUPN, provider, {
      displayName: decodedAccessToken.name || user.EmployeeName,
      employeeId: user.EmployeeId,
      employeeName: user.EmployeeName,
      userName: decodedAccessToken.name,
      defaultLegalEntity: user.DefaultLegalEntity,
      ...completeUserData,
    });

    // Step 9: Navigate to main app
    navigation.navigate('DrawerNavigator', {
      userName: decodedAccessToken.name,
    });
  } catch (error) {
    console.error('Error in handleSuccessfulLogin:', error);
    throw error;
  }
};

export const fetchUserInfo = async email => {
  try {
    if (!email) {
      console.error('Invalid email input:', email);
      return [];
    }

    const data = await RetrieveUserInfoByEmail({email});
    if (!data || !Array.isArray(data)) {
      console.error('Unexpected user data format:', data);
      return [];
    }

    return data.map(item => ({
      EmployeeName: item.EmployeeName?.toString() ?? '',
      EmployeeId: item.EmployeeId?.toString() ?? '',
      WorkerRecId: item.WorkerRecId,
      JobId: item.JobId?.toString() ?? '',
      Department: item.Department?.toString() ?? '',
      DefaultLegalEntity: item.DefaultLegalEntity?.toString() ?? '',
      CreatedBy: item.CreatedBy?.toString() ?? '',
      CreatedDateTime: item.CreatedDateTime?.toString() ?? '',
      DataAreaId: item.DataAreaId?.toString() ?? '',
      IsEnrolledInPayroll: item.IsEnrolledInPayroll?.toString() ?? '',
      JobDescription: item.JobDescription?.toString() ?? '',
      ModifiedBy: item.ModifiedBy?.toString() ?? '',
      ModifiedDateTime: item.ModifiedDateTime?.toString() ?? '',
      OriginalHireDate: item.OriginalHireDate?.toString() ?? '',
      Partition: item.Partition?.toString() ?? '',
      Person: item.Person?.toString() ?? '',
      PositionDescription: item.PositionDescription?.toString() ?? '',
      Positionid: item.Positionid?.toString() ?? '',
      RecId: item.RecId,
      isDynamicsUser: item.isDynamicsUser?.toString() ?? '',
    }));
  } catch (error) {
    console.error('Error in fetchUserInfo:', error);
    return [];
  }
};

export const fetchEmployeeLegalEntities = async employeeId => {
  try {
    if (!employeeId) {
      console.error('Invalid employeeId input:', employeeId);
      return [];
    }

    const data = await RetrieveEmployeeLegalEntities({employeeId});
    if (!data || !Array.isArray(data)) {
      console.error('Unexpected legal entities data format:', data);
      return [];
    }

    return data.map(entity => ({
      LegalEntity: entity.DataAreaId?.toString() ?? '',
      FullName: entity.FullName?.toString() ?? '',
    }));
  } catch (error) {
    console.error('Error in fetchEmployeeLegalEntities:', error);
    return [];
  }
};

export const fetchEmployeeMenuItems = async employeeId => {
  try {
    if (!employeeId) {
      console.error('Invalid employeeId input:', employeeId);
      return [];
    }

    const data = await RetrieveEmployeeMenuItems({employeeId});
    if (!data || !Array.isArray(data)) {
      console.error('Unexpected menu Item data format:', data);
      return [];
    }

    return data.map(entity => ({
      LegalEntity: entity.DataAreaId?.toString() ?? '',
      FullName: entity.FullName?.toString() ?? '',
      AccessLevel: entity.AccessLevel?.toString() ?? '',
      Image: entity.Image?.toString() ?? '',
      Label: entity.Label?.toString() ?? '',
      MenuId: entity.MenuId?.toString() ?? '',
      ModuleId: entity.ModuleId?.toString() ?? '',
      Object: entity.Object?.toString() ?? '',
      ParentId: entity.ParentId?.toString() ?? '',
      RoleId: entity.RoleId?.toString() ?? '',
      Sequence: entity.Sequence?.toString() ?? '',
      Type: entity.Type?.toString() ?? '',
      Visible: entity.Visible?.toString() ?? '',
    }));
  } catch (error) {
    console.error('Error in fetchEmployeeMenuItems:', error);
    return [];
  }
};

export const fetchEmployeeMenuItemsByCompany = async (
  employeeId,
  legalEntity,
) => {
  try {
    if (!employeeId || !legalEntity) {
      console.error(
        'Invalid employeeId or legalEntity input:',
        employeeId,
        legalEntity,
      );
      return [];
    }

    // You'll need to modify your API call to accept legalEntity parameter
    const data = await RetrieveEmployeeMenuItems({
      employeeId,
      legalEntity, // Pass the selected legal entity
    });

    if (!data || !Array.isArray(data)) {
      console.error('Unexpected menu Item data format:', data);
      return [];
    }

    return data.map(entity => ({
      LegalEntity: entity.DataAreaId?.toString() ?? '',
      FullName: entity.FullName?.toString() ?? '',
      AccessLevel: entity.AccessLevel?.toString() ?? '',
      Image: entity.Image?.toString() ?? '',
      Label: entity.Label?.toString() ?? '',
      MenuId: entity.MenuId?.toString() ?? '',
      ModuleId: entity.ModuleId?.toString() ?? '',
      Object: entity.Object?.toString() ?? '',
      ParentId: entity.ParentId?.toString() ?? '',
      RoleId: entity.RoleId?.toString() ?? '',
      Sequence: entity.Sequence?.toString() ?? '',
      Type: entity.Type?.toString() ?? '',
      Visible: entity.Visible?.toString() ?? '',
    }));
  } catch (error) {
    console.error('Error in fetchEmployeeMenuItemsByCompany:', error);
    return [];
  }
};
