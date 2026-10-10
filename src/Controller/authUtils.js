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
} from '../store/slices/authSlice';
import {
  setFirebaseUserData,
  setFirebaseInitialized,
} from '../store/slices/firebaseSlice';
import {setUserData as setUserDataAction} from '../store/slices/userSlice';
import {clearSession} from './sessionUtils';

import {RetrieveUserInfoByEmail} from '../API/Auth/RetrieveUserInfoByEmail';
import {RetrieveEmployeeLegalEntities} from '../API/Auth/RetrieveEmployeeLegalEntities';
import {RetrieveEmployeeMenuItems} from '../API/Auth/RetrieveEmployeeMenuItems';
import {
  LOGIN_ERROR,
  loginError,
  describeLoginError,
  describeMissingEmployeeFields,
} from './authErrors';

// Polyfill at the top of your authUtils file
if (typeof global.atob === 'undefined') {
  global.atob = atob;
}
if (typeof global.btoa === 'undefined') {
  global.btoa = btoa;
}

/**
 * The one logout. Every entry point must route through this.
 *
 * Takes ONLY navigation. The old (navigation, dispatch) signature is what let
 * DrawerNavigator call `handleLogoutauth(userData.Provider)` and fail silently
 * — teardown threw on the undefined dispatch, the catch threw again on the
 * undefined navigation, and the caller's own navigate() made it look like a
 * clean logout. With no dispatch to get wrong, that class of bug is gone:
 * clearSession() reaches the store through the imported singleton.
 *
 * Navigation happens in `finally`, so the user always lands on Login even if
 * teardown fails — but clearSession() itself never throws, and isolates each
 * step, so a partial failure still wipes everything it can.
 */
export const handleLogoutauth = async navigation => {
  try {
    await clearSession();
    console.log('User logged out — session cleared');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    navigation?.reset?.({
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
        describeLoginError(loginError(LOGIN_ERROR.NO_CONFIG)).message,
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
      // Wipe the outgoing user BEFORE the new tokens land. Ordering is load
      // bearing: clearSession() after these dispatches would delete the
      // credentials we just obtained. Doing it here also means a login that
      // fails later (unregistered email, incomplete profile, network) cannot
      // leave the previous user's record sitting alongside the new tokens.
      await clearSession();

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
    console.error('Error stack:', error.stack);

    const {kind, message} = describeLoginError(error);

    // Backing out of the Microsoft/Google sheet is a deliberate user action,
    // not a failure — returning to the login screen is feedback enough.
    if (kind === LOGIN_ERROR.CANCELLED) {
      return;
    }

    // The login got far enough to write an identity into the store before it
    // failed. Leaving that behind is how a half-session survives to the next
    // attempt — and how the app's own state stops matching who is signed in.
    await clearSession();

    setAlertMessage(message);
    setAlertModal(true);
  } finally {
    setLoading(false);
  }
};

/**
 * Acquires the signed-in account's email WITHOUT running a full login.
 * Used by registration: the user has no Dynamics record yet, so a full
 * handleLogin would fail with NOT_REGISTERED.
 *
 * Does NOT dispatch tokens or call clearSession(), so an already
 * logged-in user is not signed out.
 */
export const acquireProviderEmail = async provider => {
  const scan = await getActiveConfigData();
  if (!scan || Object.keys(scan).length === 0) {
    throw loginError(LOGIN_ERROR.NO_CONFIG);
  }

  const config =
    provider === 'Azure'
      ? await getAzureConfigurationV2()
      : getGoogleConfiguration();

  const result = await authorize(config);

  if (!result) {
    return null;
  }

  // Azure carries the address in `upn` on the access token,
  // Google in `email` on the id token.
  const tokenToRead =
    provider === 'Azure' ? result.accessToken : result.idToken;

  const decoded = jwtDecode(tokenToRead);
  const email = provider === 'Azure' ? decoded.upn : decoded.email;

  if (!email) {
    throw loginError(LOGIN_ERROR.NO_EMAIL_CLAIM);
  }

  return email;
};

/**
 * NOTE: setDialogVisible / setDialogMessage / setOnDialogConfirm are no longer
 * used. They drove the "Would you like to create an account?" confirm dialog,
 * which navigated to the now-retired RequestForRegistration screen. Failures
 * are thrown instead and surfaced as alerts by handleLogin's catch block.
 * The parameters are kept so the positional call sites stay valid.
 */
export const handleSuccessfulLogin = async (
  accessToken,
  authResult,
  setUserData,
  navigation,
  setDialogVisible, // retired — see note above
  setDialogMessage, // retired — see note above
  initializeLegalEntity,
  setLegalEntities,
  setMenuItems,
  provider,
  setOnDialogConfirm, // retired — see note above
) => {
  try {
    const decodedAccessToken = jwtDecode(accessToken);
    store.dispatch(setAccessToken(accessToken));

    const userEmailOrUPN =
      provider === 'Azure' ? decodedAccessToken.upn : decodedAccessToken.email;

    // fetchUserInfo() throws on any transport/config/server failure, so an
    // empty result here really does mean "no employee record for this email".
    const userInfo = await fetchUserInfo(userEmailOrUPN);

    if (!userInfo.length) {
      throw loginError(LOGIN_ERROR.NOT_REGISTERED, userEmailOrUPN);
    }

    const user = userInfo[0];

    // The record exists but Dynamics left required fields empty. Distinct from
    // "not registered" — self-registration would not fix this, HR must.
    if (!user.EmployeeName || !user.EmployeeId || user.WorkerRecId === 0) {
      throw loginError(
        LOGIN_ERROR.INCOMPLETE_PROFILE,
        describeMissingEmployeeFields(user),
      );
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

    // Identity must be IN THE STORE before any further service call.
    // getToken() reads store.getState().user.userData.isDynamicsUser to decide
    // between a delegated user token and a client-credentials app token. While
    // that is null every call silently runs as the app's service principal —
    // which is how an employee with no D365 user record still got menus back.
    //
    // The setUserData prop is the screen's local React state and does NOT
    // reach the store, so it cannot be relied on here. Dispatch explicitly,
    // then call the prop so the screen stays in sync.
    store.dispatch(setUserDataAction(completeUserData));
    setUserData(completeUserData);

    await initializeLegalEntity(user.DefaultLegalEntity);

    // const legalEntities = await fetchEmployeeLegalEntities(user.EmployeeId);
    // const menus = await fetchEmployeeMenuItems(user.Person);
    // setLegalEntities(legalEntities);
    // setMenuItems(menus);

    const legalEntities = await fetchEmployeeLegalEntities(user.EmployeeId);
    const menus = await fetchEmployeeMenuItems(user.Person);

    // No menus means either D365 rejected the delegated token (the user has
    // no D365 user record) or the account genuinely has nothing assigned.
    // Either way there is no usable app behind this login — stop here rather
    // than dropping the user into an empty shell. fetchEmployeeMenuItems
    // swallows its errors and returns [], so this is the only signal we get.
    if (!menus.length) {
      throw loginError(LOGIN_ERROR.NO_ACCESS, userEmailOrUPN);
    }

    setLegalEntities(legalEntities);
    setMenuItems(menus);

    // Brand colour is a compile-time constant (src/theme/brand.js). The D365
    // colour-palette fetch (src/API/ColorPalette/RetrieveFirstOnly.js) used to
    // run here; it is intentionally no longer called. Re-wire it here if
    // tenant-driven theming is ever re-enabled.

    // The previous user's Firebase and chatbot state is already gone —
    // handleLogin ran clearSession() before this point. Clearing again here
    // would be a no-op that implies teardown is this function's job.

    store.dispatch(
      setFirebaseUserData({
        userEmail: userEmailOrUPN,
        employeeId: user.EmployeeId,
        company: user.DefaultLegalEntity,
      }),
    );

    store.dispatch(setFirebaseInitialized(true));

    try {
      const registrationResult = await firebaseService.syncDeviceAfterLogin();

      if (!registrationResult.success) {
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

/**
 * Looks up the Dynamics employee record for an email.
 *
 * Errors are deliberately NOT swallowed here. Returning [] on failure is what
 * made every network/server/config problem surface as "your email isn't
 * registered" — an empty array must mean exactly one thing: Dynamics has no
 * employee record for this address.
 */
export const fetchUserInfo = async email => {
  try {
    // No email claim on the token — a sign-in/scope problem, not a missing user
    if (!email) {
      console.error('Invalid email input:', email);
      throw loginError(LOGIN_ERROR.NO_EMAIL_CLAIM);
    }

    const data = await RetrieveUserInfoByEmail({email});
    if (!data || !Array.isArray(data)) {
      console.error('Unexpected user data format:', data);
      throw loginError(LOGIN_ERROR.BAD_RESPONSE);
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
