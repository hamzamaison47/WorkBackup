/**
 * Executes each fixed logout entry point against the REAL store and the REAL
 * teardown, and asserts the store is actually empty afterwards.
 *
 * Finding 2 in STATE_LIFECYCLE_AUDIT.md existed because a broken call site
 * (handleLogoutauth(userData.Provider)) looked like it worked: teardown threw,
 * the caller navigated anyway, and the previous user's state survived. Reading
 * the code was not enough to catch it — so these run it.
 *
 * What is mocked: each screen's heavy collaborators (navigation containers,
 * screen registries, presentational children, network calls) — never the code
 * under test. The confirmLogout closures, handleLogoutauth, clearSession, the
 * root reducer and the store are all real.
 */
import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {Provider} from 'react-redux';

// ── Collaborator mocks ───────────────────────────────────────────────────────
const mockNavHolder = {current: null};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavHolder.current,
  useRoute: () => ({params: {}}),
  useFocusEffect: () => {},
  useIsFocused: () => true,
  NavigationContainer: ({children}) => children,
}));

jest.mock('@react-navigation/drawer', () => {
  const R = require('react');
  return {
    createDrawerNavigator: () => ({
      Navigator: ({children}) => children,
      Screen: () => null,
    }),
    DrawerContentScrollView: ({children}) =>
      R.createElement(R.Fragment, null, children),
  };
});

// The screen registry imports every screen in the app — collapse it.
jest.mock('../../src/Controller/screenMapping', () => ({
  screenMapping: {'MENU-ALPHA': 'PayrollScreen'},
  iconMapping: {'MENU-ALPHA': 'wallet'},
}));

jest.mock(
  '../../src/API/PersonalInformation/ProfilePicture/ProfilePicture',
  () => ({ProfilePicture: jest.fn(async () => [])}),
);

// Presentational / data children of the two dashboard screens.
const passthrough = () => {
  const R = require('react');
  return ({children}) => R.createElement(R.Fragment, null, children);
};
jest.mock('../../src/components/ActionPaneContainer', () => passthrough());
jest.mock(
  '../../src/components/CustomIndicator/CustomIndicator',
  () => () => null,
);
jest.mock(
  '../../src/components/MainDashboard/DashboardHeader',
  () => () => null,
);
jest.mock('../../src/components/MainDashboard/MenuGrid', () => () => null);
jest.mock('../../src/components/AIChatbot/AIChatbot', () => () => null);
jest.mock('../../src/components/AIChatbot/AIFloatingButton', () => () => null);
jest.mock('../../src/components/MainDashboard/QuickAccessSheet', () => ({
  __esModule: true,
  default: () => null,
  QuickAccessButton: () => null,
}));
jest.mock('../../src/services/MasterService', () => () => ({
  initialize: jest.fn(),
}));
jest.mock('../../src/hooks/useDashboardData', () => ({
  useDashboardData: () => ({
    isLoading: false,
    refreshing: false,
    profilePictureUrl: null,
    modalVisible: true,
    setModalVisible: jest.fn(),
    fetchProfilePicture: jest.fn(),
    handleRefresh: jest.fn(),
  }),
}));
jest.mock('../../src/hooks/useDashboardDimensions', () => ({
  useDashboardDimensions: () => ({}),
}));
jest.mock('../../src/hooks/useMenuBuilder', () => ({
  useMenuBuilder: () => ({dynamicMenus: [], handleCardPress: jest.fn()}),
}));

// ── Real modules under test ──────────────────────────────────────────────────
import {store} from '../../src/store';
import {setUserData} from '../../src/store/slices/userSlice';
import {
  setAccessToken,
  setIdToken,
  setRefreshToken,
  setGraphAccessToken,
} from '../../src/store/slices/authSlice';
import {setMenuItems} from '../../src/store/slices/menuItemSlice';
import {
  initializeLegalEntity,
  setLegalEntities,
} from '../../src/store/slices/companySlice';
import {
  setFirebaseUserData,
  setFirebaseToken,
  addInAppNotification,
} from '../../src/store/slices/firebaseSlice';
import {
  chatbotAddMessage,
  chatbotAddContext,
} from '../../src/store/slices/chatbotSlice';
import {
  setAccounts,
  setBiometricEnabled,
} from '../../src/store/slices/biometricSlice';
import {setLanguage} from '../../src/store/slices/languageSlice';
import {setTheme} from '../../src/store/slices/themeSlice';

// Marker values — if any survive teardown, user B inherits them.
const A = {
  employeeId: 'EMP-AAA-001',
  employeeName: 'User Alpha',
  email: 'alpha@tenant.com',
  accessToken: 'ACCESS-TOKEN-ALPHA',
  refreshToken: 'REFRESH-TOKEN-ALPHA',
  idToken: 'ID-TOKEN-ALPHA',
  graphToken: 'GRAPH-TOKEN-ALPHA',
  legalEntity: 'LE-ALPHA',
  menuId: 'MENU-ALPHA',
  chatText: 'my salary is confidential',
  fcmToken: 'FCM-ALPHA',
  notification: 'Alpha leave approved',
  department: 'FinanceAlpha',
};

const LEAK_MARKERS = [
  A.employeeId,
  A.employeeName,
  A.accessToken,
  A.refreshToken,
  A.idToken,
  A.graphToken,
  A.legalEntity,
  A.chatText,
  A.fcmToken,
  A.notification,
  A.department,
];

const seedUserA = () => {
  store.dispatch(
    setUserData({
      employeeId: A.employeeId,
      employeeName: A.employeeName,
      email: A.email,
      isDynamicsUser: 'Yes',
      employeeFullInfo: {EmployeeId: A.employeeId, Department: A.department},
    }),
  );
  store.dispatch(setAccessToken(A.accessToken));
  store.dispatch(setRefreshToken(A.refreshToken));
  store.dispatch(setIdToken(A.idToken));
  store.dispatch(setGraphAccessToken(A.graphToken));
  store.dispatch(setMenuItems([{MenuId: A.menuId, Label: 'Payroll'}]));
  store.dispatch(initializeLegalEntity(A.legalEntity));
  store.dispatch(setLegalEntities([{LegalEntity: A.legalEntity}]));
  store.dispatch(
    setFirebaseUserData({
      userEmail: A.email,
      employeeId: A.employeeId,
      company: A.legalEntity,
    }),
  );
  store.dispatch(setFirebaseToken(A.fcmToken));
  store.dispatch(addInAppNotification({text: A.notification, type: 'Success'}));
  store.dispatch(chatbotAddMessage({id: 1, text: A.chatText}));
  store.dispatch(chatbotAddContext({q: A.chatText}));

  // Must SURVIVE: enrolment + device preferences.
  store.dispatch(setBiometricEnabled(true));
  store.dispatch(
    setAccounts([
      {
        id: 'azure_alpha',
        email: A.email,
        provider: 'Azure',
        displayName: 'alpha',
      },
    ]),
  );
  store.dispatch(setLanguage('ur'));
  store.dispatch(setTheme('dark'));
};

const makeNav = () => ({
  reset: jest.fn(),
  navigate: jest.fn(),
  goBack: jest.fn(),
  addListener: jest.fn(() => () => {}),
  getState: jest.fn(() => ({routes: [], index: 0})),
  setOptions: jest.fn(),
  closeDrawer: jest.fn(),
  toggleDrawer: jest.fn(),
  isFocused: jest.fn(() => true),
  canGoBack: jest.fn(() => false),
});

const assertWiped = () => {
  const s = store.getState();
  const blob = JSON.stringify(s);
  LEAK_MARKERS.forEach(marker => expect(blob).not.toContain(marker));
  expect(s.user.userData).toBeNull();
  expect(s.auth.accessToken).toBeNull();
  expect(s.auth.refreshToken).toBeNull();
  expect(s.auth.idToken).toBeNull();
  expect(s.auth.graphAccessToken).toBeNull();
  expect(s.company.selectedLegalEntity).toBeNull();
  expect(s.company.legalEntities).toEqual([]);
  expect(s.firebase.userEmail).toBeNull();
  expect(s.firebase.employeeId).toBeNull();
  expect(s.firebase.fcmToken).toBeNull();
  expect(s.firebase.inAppNotifications).toEqual([]);
  expect(s.chatbot.messages).toEqual([]);
  expect(s.chatbot.state.conversationContext).toEqual([]);
  expect(s.language.skipLoginAfterRestart).toBe(false);
};

const assertPreserved = () => {
  const s = store.getState();
  expect(s.biometric.enabled).toBe(true);
  expect(s.biometric.accounts).toHaveLength(1);
  expect(s.biometric.accounts[0].email).toBe(A.email);
  expect(s.language.currentLanguage).toBe('ur');
  expect(s.language.isRTL).toBe(true);
  expect(s.theme.mode).toBe('dark');
};

/** Finds the LogoutAlertModal's onConfirm in a rendered tree. */
const findConfirm = tree => {
  const hits = tree.root.findAll(
    n => typeof n.props?.onConfirm === 'function',
    {
      deep: true,
    },
  );
  if (!hits.length) {
    throw new Error('no onConfirm handler found in rendered tree');
  }
  return hits[0].props.onConfirm;
};

const renderAndConfirm = async element => {
  let tree;
  await act(async () => {
    tree = renderer.create(<Provider store={store}>{element}</Provider>);
  });
  await act(async () => {
    await findConfirm(tree)();
  });
  return tree;
};

describe('logout entry points — real teardown, real store', () => {
  beforeEach(() => {
    mockNavHolder.current = makeNav();
    seedUserA();
  });

  it('fixture sanity: user A is genuinely in the store before each case', () => {
    const blob = JSON.stringify(store.getState());
    LEAK_MARKERS.forEach(m => expect(blob).toContain(m));
  });

  it('DrawerNavigator (the call site that shipped broken)', async () => {
    const {
      CustomDrawerContent,
    } = require('../../src/Navigation/DrawerNavigator');
    const nav = mockNavHolder.current;

    await renderAndConfirm(
      <CustomDrawerContent navigation={nav} state={{routes: [], index: 0}} />,
    );

    assertWiped();
    assertPreserved();
    expect(nav.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{name: 'Login'}],
    });
  });

  it('Profile screen', async () => {
    const Profile = require('../../src/screens/Profile/Profile').default;
    const nav = mockNavHolder.current;

    await renderAndConfirm(<Profile navigation={nav} />);

    assertWiped();
    assertPreserved();
    expect(nav.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{name: 'Login'}],
    });
  });

  it('MainDashboard (hardware back)', async () => {
    const MainDashboard = require('../../src/screens/Maindasboard').default;
    const nav = mockNavHolder.current;

    await renderAndConfirm(<MainDashboard />);

    assertWiped();
    assertPreserved();
    expect(nav.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{name: 'Login'}],
    });
  });

  it('useSessionTimeout (session expiry is a logout)', async () => {
    const useSessionTimeout =
      require('../../src/hooks/useSessionTimeout').default;
    const nav = mockNavHolder.current;

    let captured;
    const Probe = () => {
      captured = useSessionTimeout();
      return null;
    };

    await act(async () => {
      renderer.create(
        <Provider store={store}>
          <Probe />
        </Provider>,
      );
    });
    await act(async () => {
      await captured.handleOkPress();
    });

    assertWiped();
    assertPreserved();
    expect(nav.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{name: 'Login'}],
    });
  });

  it('teardown still completes when navigation is garbage (the old bug)', async () => {
    const {handleLogoutauth} = require('../../src/Controller/authUtils');
    // Exactly what DrawerNavigator used to pass: undefined.
    await expect(handleLogoutauth(undefined)).resolves.toBeUndefined();
    assertWiped();
    assertPreserved();
  });

  it('clearSession reports every step succeeding', async () => {
    const {clearSession} = require('../../src/Controller/sessionUtils');
    const results = await clearSession();
    Object.entries(results).forEach(([, ok]) => expect(ok).toBe(true));
    assertWiped();
  });
});
