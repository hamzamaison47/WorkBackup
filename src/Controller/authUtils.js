/* eslint-disable no-unused-vars */

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
import {clearUserData} from '../store/slices/userSlice';

import {RetrieveUserInfoByEmail} from '../API/Auth/RetrieveUserInfoByEmail';
import {RetrieveEmployeeLegalEntities} from '../API/Auth/RetrieveEmployeeLegalEntities';
import {RetrieveEmployeeMenuItems} from '../API/Auth/RetrieveEmployeeMenuItems';
import {chatbotClearMessages} from '../store/slices/chatbotSlice';
import {apiCache} from '../utils/apiCache';
import {RetrieveFirstOnly} from '../API/ColorPalette/RetrieveFirstOnly';
import {setPalette} from '../store/slices/colorPaletteSlice';

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
// export const handleLogoutauth = async (navigation, dispatch) => {
//   try {
//     // Cleanup Firebase service
//     await firebaseService.cleanup();

//     // Clear Redux store - all state management now via Redux
//     dispatch(clearAuthTokens());
//     dispatch(clearUserData()); // ← fixed: was setUserData(null) — never imported
//     dispatch(clearFirebaseData());
//     dispatch(clearBiometric());
//     dispatch(setSkipLoginAfterRestart(false));

//     console.log('User logged out and Redux state cleared');

//     // Navigate to Login screen and reset the stack
//     navigation.reset({
//       index: 0,
//       routes: [{name: 'Login'}],
//     });
//   } catch (error) {
//     console.error('Logout error:', error);
//     navigation.reset({
//       index: 0,
//       routes: [{name: 'Login'}],
//     });
//   }
// };

export const handleLogoutauth = async (navigation, dispatch) => {
  try {
    // 1. 🧹 WIPE THE API CACHE FIRST
    // This ensures no cached attendance/profile data remains in memory
    apiCache.clear();
    console.log('API Cache cleared successfully');

    // 2. Cleanup Firebase service
    await firebaseService.cleanup();

    // 3. Clear Redux store
    dispatch(clearAuthTokens());
    dispatch(clearUserData());
    dispatch(clearFirebaseData());
    dispatch(clearBiometric());
    dispatch(setSkipLoginAfterRestart(false));

    // ✅ Add this: Clear chatbot history so the new user starts fresh
    dispatch(chatbotClearMessages());

    console.log('User logged out and Redux state cleared');

    // 4. Navigate to Login screen and reset the stack
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
  setOnAlertConfirm,
  setOnDialogConfirm,
) => {
  setLoading(true);

  try {
    const scan = await getActiveConfigData();
    if (!scan || Object.keys(scan).length === 0) {
      setAlertMessage(
        'Login failed\nPlease setup your environment configuration first',
      );

      if (setOnAlertConfirm) {
        setOnAlertConfirm(
          () => () => navigation.navigate('ConfigSelectionScreen'),
        );
      }

      setAlertModal(true);
      setLoading(false);
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

      if (provider === 'Azure') {
        store.dispatch(setAccessToken(tokenToUse));
      } else {
        store.dispatch(setIdToken(tokenToUse));
      }
      store.dispatch(setRefreshToken(result.refreshToken));

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
        setOnDialogConfirm,
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
  setOnDialogConfirm,
) => {
  try {
    const decodedAccessToken = jwtDecode(accessToken);
    store.dispatch(setAccessToken(accessToken));

    const userEmailOrUPN =
      provider === 'Azure' ? decodedAccessToken.upn : decodedAccessToken.email;

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

      if (setOnDialogConfirm) {
        setOnDialogConfirm(
          () => () => navigation.navigate('RequestForRegistration'),
        );
      }

      setDialogVisible(true);
      return;
    }

    const user = userInfo[0];

    await initializeLegalEntity(user.DefaultLegalEntity);

    const legalEntities = await fetchEmployeeLegalEntities(user.EmployeeId);
    const menus = await fetchEmployeeMenuItems(user.Person);
    setLegalEntities(legalEntities);
    setMenuItems(menus);

    try {
      const palette = await RetrieveFirstOnly();

      // TEMP [PALETTE-DEBUG] — remove after diagnosis
      console.log('[PALETTE-DEBUG] dispatch payload (SSO login):', {
        primary: palette?.primaryColor,
        onPrimary: palette?.onPrimaryColor,
        selection: palette?.selectionColor,
      });

      store.dispatch(
        setPalette({
          primary: palette.primaryColor,
          onPrimary: palette.onPrimaryColor,
          selection: palette.selectionColor,
        }),
      );

      // TEMP [PALETTE-DEBUG] — remove after diagnosis
      console.log(
        '[PALETTE-DEBUG] store after dispatch:',
        store.getState().colorPalette,
      );
    } catch (e) {
      console.warn('Palette hydration failed:', e);
    }

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

    setUserData(completeUserData);

    console.log('Clearing previous Firebase data before setting new user data');
    store.dispatch(clearFirebaseData());
    store.dispatch(chatbotClearMessages());

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

    store.dispatch(setFirebaseInitialized(true));

    try {
      console.log('Starting Firebase device registration...');
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
      }
    } catch (firebaseError) {
      console.error('Firebase registration error:', firebaseError);
    }

    const savedAccount = await saveAccountAfterLogin(userEmailOrUPN, provider, {
      displayName: decodedAccessToken.name || user.EmployeeName,
      employeeId: user.EmployeeId,
      employeeName: user.EmployeeName,
      userName: decodedAccessToken.name,
      defaultLegalEntity: user.DefaultLegalEntity,
      ...completeUserData,
    });

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

export const fetchEmployeeMenuItems = async person => {
  try {
    if (!person) {
      console.error('Invalid person input:', person);
      return [];
    }

    const data = await RetrieveEmployeeMenuItems({person});
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
      DisplayOnFooter: entity.DisplayOnFooter?.toString() ?? '',
      DisplayOnHeader: entity.DisplayOnHeader?.toString() ?? '',
      DisplayOnMainScreen: entity.DisplayOnMainScreen?.toString() ?? '',
      DisplayOnSideNavigation: entity.DisplayOnSideNavigation?.toString() ?? '',
    }));
  } catch (error) {
    console.error('Error in fetchEmployeeMenuItems:', error);
    return [];
  }
};

export const fetchEmployeeMenuItemsByCompany = async (person, legalEntity) => {
  try {
    if (!person || !legalEntity) {
      console.error(
        'Invalid person or legalEntity input:',
        person,
        legalEntity,
      );
      return [];
    }

    const data = await RetrieveEmployeeMenuItems({person});
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
      DisplayOnFooter: entity.DisplayOnFooter?.toString() ?? '',
      DisplayOnHeader: entity.DisplayOnHeader?.toString() ?? '',
      DisplayOnMainScreen: entity.DisplayOnMainScreen?.toString() ?? '',
      DisplayOnSideNavigation: entity.DisplayOnSideNavigation?.toString() ?? '',
    }));
  } catch (error) {
    console.error('Error in fetchEmployeeMenuItemsByCompany:', error);
    return [];
  }
};
