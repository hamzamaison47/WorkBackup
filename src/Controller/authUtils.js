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
import {RetrieveUserInfoByEmail} from '../API/Auth/RetrieveUserInfoByEmail';
import {RetrieveEmployeeLegalEntities} from '../API/Auth/RetrieveEmployeeLegalEntities';
import {RetrieveEmployeeMenuItems} from '../API/Auth/RetrieveEmployeeMenuItems';
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
  setMenuItems,
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
    await AsyncStorage.setItem('accessToken', accessToken);

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

    const user = userInfo[0];

    // Step 2: Initialize default legal entity in Redux first
    await initializeLegalEntity(user.DefaultLegalEntity);

    // Step 3: Fetch legal entities using the employee ID
    const legalEntities = await fetchEmployeeLegalEntities(user.EmployeeId);
    const menus = await fetchEmployeeMenuItems(user.EmployeeId);

    // Step 4: Set legal entities in Redux
    setLegalEntities(legalEntities);
    setMenuItems(menus);

    // Step 5: Set user data in Redux
    setUserData({
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
    });

    // Step 6: Navigate to main app
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
