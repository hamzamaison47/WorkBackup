import rootReducer, {
  resetAppState,
  RESET_APP_STATE,
} from '../../src/store/rootReducer';

describe('rootReducer RESET_APP_STATE', () => {
  const dirty = () => {
    let s = rootReducer(undefined, {type: '@@INIT'});
    return {
      ...s,
      user: {userData: {employeeId: 'A-001', employeeName: 'User A'}},
      auth: {...s.auth, accessToken: 'tok-A', refreshToken: 'ref-A'},
      menuItem: {menuItems: [{MenuId: 'X'}]},
      company: {
        selectedLegalEntity: 'LE1',
        legalEntities: [{LegalEntity: 'LE1'}],
        defaultLegalEntity: 'LE1',
      },
      firebase: {
        ...s.firebase,
        userEmail: 'a@x.com',
        employeeId: 'A-001',
        inAppNotifications: [{RecId: '1'}],
      },
      chatbot: {
        ...s.chatbot,
        messages: [{id: 1}],
        state: {
          leaveHandlerState: 'mid',
          currentIntent: 'leave',
          conversationContext: [{q: 'secret'}],
        },
      },
      biometric: {
        enabled: true,
        selectedAccount: null,
        accounts: [{email: 'a@x.com', provider: 'Azure'}],
        credentials: null,
      },
      language: {
        currentLanguage: 'ur',
        languageCode: 'ur',
        isRTL: true,
        skipLoginAfterRestart: false,
        appRestarting: false,
      },
      theme: {mode: 'dark'},
      dateFormat: {...s.dateFormat, selectedTimeFormat: {label: '24 Hour'}},
    };
  };

  it('wipes every non-preserved slice back to initialState', () => {
    const fresh = rootReducer(undefined, {type: '@@INIT'});
    const out = rootReducer(dirty(), resetAppState());
    expect(out.user).toEqual(fresh.user);
    expect(out.auth).toEqual(fresh.auth);
    expect(out.menuItem).toEqual(fresh.menuItem);
    expect(out.company).toEqual(fresh.company);
    expect(out.firebase).toEqual(fresh.firebase);
    expect(out.chatbot).toEqual(fresh.chatbot);
  });

  it('leaves no trace of the previous user anywhere in the tree', () => {
    const out = rootReducer(dirty(), resetAppState());
    const blob = JSON.stringify(out);
    ['A-001', 'tok-A', 'ref-A', 'User A', 'LE1', 'secret'].forEach(needle =>
      expect(blob).not.toContain(needle),
    );
  });

  it('preserves biometric, language, theme and dateFormat verbatim', () => {
    const before = dirty();
    const out = rootReducer(before, resetAppState());
    expect(out.biometric).toEqual(before.biometric);
    expect(out.language).toEqual(before.language);
    expect(out.theme).toEqual(before.theme);
    expect(out.dateFormat).toEqual(before.dateFormat);
  });

  it('is a no-op passthrough for unrelated actions', () => {
    const before = dirty();
    const out = rootReducer(before, {type: 'something/else'});
    expect(out.user).toEqual(before.user);
    expect(out.auth).toEqual(before.auth);
  });

  it('does not emit a combineReducers unexpected-key warning', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    rootReducer(dirty(), resetAppState());
    const hits = spy.mock.calls.filter(c =>
      String(c[0]).includes('Unexpected key'),
    );
    spy.mockRestore();
    expect(hits).toEqual([]);
  });

  it('survives being called with undefined state', () => {
    expect(() => rootReducer(undefined, resetAppState())).not.toThrow();
  });
});
