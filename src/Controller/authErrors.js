/**
 * Central error classifier for the sign-in flow.
 *
 * Previously every failure during login — the OAuth handshake, the D365 token
 * endpoint, the SOAP calls, the JWT decode — collapsed into a single
 * "your email isn't registered" prompt, because fetchUserInfo() swallowed all
 * exceptions and returned []. An empty array was then read as "user not found".
 *
 * Callers now let the real error propagate and run it through
 * describeLoginError() so the user is told what actually went wrong.
 */

export const LOGIN_ERROR = {
  CANCELLED: 'CANCELLED',
  NO_CONFIG: 'NO_CONFIG',
  BAD_CONFIG: 'BAD_CONFIG',
  NETWORK: 'NETWORK',
  TIMEOUT: 'TIMEOUT',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVER: 'SERVER',
  BAD_RESPONSE: 'BAD_RESPONSE',
  NO_EMAIL_CLAIM: 'NO_EMAIL_CLAIM',
  TOKEN: 'TOKEN',
  NOT_REGISTERED: 'NOT_REGISTERED',
  INCOMPLETE_PROFILE: 'INCOMPLETE_PROFILE',
  BIOMETRIC_STALE: 'BIOMETRIC_STALE',
  UNKNOWN: 'UNKNOWN',
  NO_ACCESS: 'NO_ACCESS',
};

/**
 * An error we have already identified ourselves, so describeLoginError()
 * does not have to guess. `detail` carries extras for the message (e.g. the
 * email that was looked up, or which employee fields were missing).
 */
export class LoginError extends Error {
  constructor(kind, detail = null, cause = null) {
    super(kind);
    this.name = 'LoginError';
    this.kind = kind;
    this.detail = detail;
    this.cause = cause;
  }
}

export const loginError = (kind, detail = null, cause = null) =>
  new LoginError(kind, detail, cause);

// ── Probes ──────────────────────────────────────────────────

/**
 * axios attaches error.response.status. getToken() instead builds a plain
 * Error from fetch(): "HTTP error! Status: 401 - <body>", so parse that too.
 */
const httpStatusOf = error => {
  if (typeof error?.response?.status === 'number') {
    return error.response.status;
  }
  const match = /status:\s*(\d{3})/i.exec(String(error?.message ?? ''));
  return match ? Number(match[1]) : null;
};

/** Dynamics returns SOAP faults inside a 500 body — surface the real reason. */
const soapFaultOf = error => {
  const body = error?.response?.data;
  if (typeof body !== 'string') {
    return null;
  }
  const match = /<faultstring[^>]*>([\s\S]*?)<\/faultstring>/i.exec(body);
  return match ? match[1].trim() : null;
};

/**
 * react-native-app-auth reports a user backing out of the browser sheet as a
 * thrown error. Android says "User cancelled flow"; iOS AppAuth surfaces
 * "org.openid.appauth.general error -3" (user canceled) / -4 (program canceled).
 */
const isCancellation = (message, code) =>
  /cancell?ed/i.test(message) ||
  /cancell?ed/i.test(code) ||
  /error -3\b|error -4\b/.test(message);

const isTimeout = (message, code) =>
  code === 'ECONNABORTED' ||
  code === 'ETIMEDOUT' ||
  /timeout|timed out/i.test(message);

const isNetworkFailure = (error, message, code) =>
  code === 'ERR_NETWORK' ||
  /network error|network request failed|failed to fetch|unable to resolve host|enotfound|econnrefused|econnreset|ehostunreach/i.test(
    message,
  ) ||
  // axios fired the request but never got a response back
  (Boolean(error?.request) && !error?.response);

// ── Classification ──────────────────────────────────────────

export const classifyLoginError = error => {
  if (error instanceof LoginError) {
    return error.kind;
  }

  const message = String(error?.message ?? '');
  const code = String(error?.code ?? '');

  if (isCancellation(message, code)) {
    return LOGIN_ERROR.CANCELLED;
  }

  // Config problems raised by getToken() / the API modules before any request
  if (/no configuration found/i.test(message)) {
    return LOGIN_ERROR.NO_CONFIG;
  }
  if (/invalid configuration/i.test(message)) {
    return LOGIN_ERROR.BAD_CONFIG;
  }

  // Token problems: none issued, or one we cannot decode
  if (/no access token received/i.test(message)) {
    return LOGIN_ERROR.TOKEN;
  }
  if (error?.name === 'InvalidTokenError' || /invalid token/i.test(message)) {
    return LOGIN_ERROR.TOKEN;
  }

  // A real HTTP status beats the generic network checks below
  const status = httpStatusOf(error);
  if (status) {
    if (status === 401) {
      return LOGIN_ERROR.UNAUTHORIZED;
    }
    if (status === 403) {
      return LOGIN_ERROR.FORBIDDEN;
    }
    if (status === 404) {
      return LOGIN_ERROR.NOT_FOUND;
    }
    if (status === 408) {
      return LOGIN_ERROR.TIMEOUT;
    }
    if (status === 429) {
      return LOGIN_ERROR.RATE_LIMITED;
    }
    if (status >= 500) {
      return LOGIN_ERROR.SERVER;
    }
    if (status >= 400) {
      return LOGIN_ERROR.BAD_RESPONSE;
    }
  }

  if (isTimeout(message, code)) {
    return LOGIN_ERROR.TIMEOUT;
  }
  if (isNetworkFailure(error, message, code)) {
    return LOGIN_ERROR.NETWORK;
  }

  return LOGIN_ERROR.UNKNOWN;
};

// ── Messages ────────────────────────────────────────────────

const CONTACT_ADMIN = 'Please contact your HR or system administrator.';

const buildMessage = (kind, error, detail) => {
  switch (kind) {
    case LOGIN_ERROR.CANCELLED:
      return 'Sign-In Cancelled\nYou closed the sign-in window before it completed.';

    case LOGIN_ERROR.NO_CONFIG:
      return (
        'Configuration Required\n' +
        'No environment configuration was found on this device.\n' +
        'Please scan your setup QR code before signing in.'
      );

    case LOGIN_ERROR.BAD_CONFIG:
      return (
        'Invalid Configuration\n' +
        'Your saved configuration is missing required fields.\n' +
        'Please re-scan your setup QR code, or pick a different configuration.'
      );

    case LOGIN_ERROR.NETWORK:
      return (
        'No Connection\n' +
        'The server could not be reached.\n' +
        'Possible causes:\n' +
        '• Your device is offline\n' +
        '• Wi-Fi or mobile data is turned off\n' +
        '• You are outside the corporate network or VPN\n' +
        'Check your connection and try again.'
      );

    case LOGIN_ERROR.TIMEOUT:
      return (
        'Connection Timed Out\n' +
        'The server took too long to respond.\n' +
        'Possible causes:\n' +
        '• Slow or unstable connection\n' +
        '• The Dynamics server is busy or starting up\n' +
        'Please try again in a moment.'
      );

    case LOGIN_ERROR.UNAUTHORIZED:
      return (
        'Authorization Failed\n' +
        'The server rejected the credentials this app is using.\n' +
        'Possible causes:\n' +
        '• The client ID or secret in your configuration is wrong or expired\n' +
        '• Your account has not been granted access to this environment\n' +
        'Please re-scan your setup QR code, or contact your administrator.'
      );

    case LOGIN_ERROR.FORBIDDEN:
      return (
        'Access Denied\n' +
        'Your account is not permitted to use this environment.\n' +
        'Please contact your administrator to request access.'
      );

    case LOGIN_ERROR.NOT_FOUND:
      return (
        'Service Not Found\n' +
        'The Dynamics service was not found at the configured address.\n' +
        'Possible causes:\n' +
        '• The resource URL in your configuration is incorrect\n' +
        '• The service is not deployed on this environment\n' +
        'Please re-scan your setup QR code, or contact your administrator.'
      );

    case LOGIN_ERROR.RATE_LIMITED:
      return (
        'Too Many Attempts\n' +
        'The server is temporarily refusing new requests.\n' +
        'Please wait a minute and try again.'
      );

    case LOGIN_ERROR.SERVER: {
      const fault = soapFaultOf(error);
      return (
        'Server Error\n' +
        'Dynamics returned an error while processing the request.\n' +
        (fault ? `Details: ${fault}\n` : '') +
        'Possible causes:\n' +
        '• The Dynamics server is down or restarting\n' +
        '• A database connection issue\n' +
        '• Scheduled maintenance in progress\n' +
        'Please try again later, or contact your administrator.'
      );
    }

    case LOGIN_ERROR.BAD_RESPONSE:
      return (
        'Unexpected Server Response\n' +
        'The server replied in a format this app could not read.\n' +
        'Possible causes:\n' +
        '• An error page was returned instead of data\n' +
        '• The service version does not match this app\n' +
        CONTACT_ADMIN
      );

    case LOGIN_ERROR.NO_EMAIL_CLAIM:
      return (
        'Sign-In Incomplete\n' +
        'Sign-in succeeded, but no email address was returned for your account.\n' +
        'Possible causes:\n' +
        '• The app registration is missing the required profile or email permission\n' +
        '• You signed in with an account that has no mailbox\n' +
        CONTACT_ADMIN
      );

    case LOGIN_ERROR.TOKEN:
      return (
        'Authentication Token Error\n' +
        'The sign-in token could not be read, or none was issued.\n' +
        'Please try signing in again. If this keeps happening, contact your administrator.'
      );

    case LOGIN_ERROR.NOT_REGISTERED:
      return (
        'Account Not Registered\n' +
        (detail
          ? `The email ${detail} is not linked to an employee record in Dynamics.\n`
          : 'Your email is not linked to an employee record in Dynamics.\n') +
        CONTACT_ADMIN
      );

    case LOGIN_ERROR.INCOMPLETE_PROFILE:
      return (
        'Incomplete Employee Record\n' +
        'Your account exists in Dynamics, but required details are missing:\n' +
        (detail ? `${detail}\n` : '') +
        'Your employee setup must be completed before you can sign in.\n' +
        CONTACT_ADMIN
      );

    case LOGIN_ERROR.BIOMETRIC_STALE:
      return (
        'Saved Account No Longer Valid\n' +
        (detail
          ? `The account saved for biometric login (${detail}) no longer has an employee record in Dynamics.\n`
          : 'The account saved for biometric login no longer has an employee record in Dynamics.\n') +
        'Please sign in with Microsoft or Google, then re-enable biometric login in settings.'
      );

    case LOGIN_ERROR.NO_ACCESS:
      return 'You do not have access to connect with this environment';

    default: {
      const raw = String(error?.message ?? '').trim();
      return (
        'Login Failed\n' +
        (raw ? `${raw}\n` : 'An unexpected error occurred during sign-in.\n') +
        'Please try again. If the problem continues, contact your administrator.'
      );
    }
  }
};

/**
 * Turn anything thrown during login into `{kind, message}`.
 * `message` is ready to hand straight to AlertModal — callers should not
 * wrap or decorate it further.
 */
export const describeLoginError = error => {
  const kind = classifyLoginError(error);
  const detail = error instanceof LoginError ? error.detail : null;

  console.error(`[login] ${kind}:`, error?.message ?? error);

  return {kind, message: buildMessage(kind, error, detail)};
};

/** Lists the employee fields Dynamics left empty, for INCOMPLETE_PROFILE. */
export const describeMissingEmployeeFields = user => {
  const missing = [];
  if (!user?.EmployeeName) {
    missing.push('• Employee name');
  }
  if (!user?.EmployeeId) {
    missing.push('• Employee ID');
  }
  if (!user?.WorkerRecId || user.WorkerRecId === 0) {
    missing.push('• Worker record');
  }
  return missing.join('\n');
};
