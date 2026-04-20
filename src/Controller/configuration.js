import {getActiveConfigData} from '../Controller/secureConfig';
const GOOGLE_OAUTH_APP_GUID = '127486062920-9v2chjic07bslm1uoqrdodrmskgh9gpl';
const Googleconfig = {
  issuer: 'https://accounts.google.com',
  clientId: `${GOOGLE_OAUTH_APP_GUID}.apps.googleusercontent.com`,
  redirectUrl: `com.googleusercontent.apps.${GOOGLE_OAUTH_APP_GUID}:/oauth2redirect/google`,
  scopes: ['openid', 'profile', 'email'],
  additionalParameters: {prompt: 'consent'},
};

export const getAzureConfigurationV2 = async () => {
  try {
    const config = await getActiveConfigData();

    if (!config) {
      throw new Error(
        'Configuration Not Found\n\nNo configuration found. Please scan a QR code first to set up your environment.',
      );
    }

    const {tokenUrl, client_id, client_secret, grant_type, resource} = config;

    // Validate required configuration fields
    if (!tokenUrl || !client_id || !client_secret || !grant_type || !resource) {
      throw new Error(
        `Invalid Configuration\n\nMissing required fields:\n${
          !tokenUrl ? '• Token URL\n' : ''
        }${!client_id ? '• Client ID\n' : ''}${
          !client_secret ? '• Client Secret\n' : ''
        }${!grant_type ? '• Grant Type\n' : ''}${
          !resource ? '• Resource\n' : ''
        }\nPlease scan a valid QR code with all required configuration parameters.`,
      );
    }

    const tenantIdMatch = tokenUrl.match(/\/([0-9a-fA-F-]{36})\//);
    const tenantId = tenantIdMatch ? tenantIdMatch[1] : null;
    if (!tenantId) {
      throw new Error(
        `Configuration Error\n\nFailed to extract tenant ID from token URL.\n\nToken URL: ${tokenUrl}\n\nPlease ensure your QR code contains a valid Microsoft tenant configuration.`,
      );
    }

    const MicrosoftconfigV2 = {
      issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,
      clientId: client_id,
      redirectUrl: 'authentication://callback/',
      scopes: [
        'openid',
        'profile',
        'email',
        'offline_access',
        `${resource}.default`,
      ],
      additionalParameters: {prompt: 'select_account'},
    };

    return MicrosoftconfigV2;
  } catch (error) {
    console.error('Failed to get Azure configuration:', error);
    throw error;
  }
};

export const getAzureConfiguration = async () => {
  try {
    const config = await getActiveConfigData();

    if (!config) {
      throw new Error(
        'Configuration Not Found\n\nNo configuration found. Please scan a QR code first to set up your environment.',
      );
    }

    const {tokenUrl, client_id, client_secret, grant_type, resource} = config;

    // Validate required configuration fields
    if (!tokenUrl || !client_id || !client_secret || !grant_type || !resource) {
      throw new Error(
        `Invalid Configuration\n\nMissing required fields:\n${
          !tokenUrl ? '• Token URL\n' : ''
        }${!client_id ? '• Client ID\n' : ''}${
          !client_secret ? '• Client Secret\n' : ''
        }${!grant_type ? '• Grant Type\n' : ''}${
          !resource ? '• Resource\n' : ''
        }\nPlease scan a valid QR code with all required configuration parameters.`,
      );
    }

    // Extract tenant ID from token URL
    // Example: https://login.windows.net/5df08255-a152-4fbc-a174-0d8a182aa594/oauth2/token
    const tenantIdMatch = tokenUrl.match(/\/([0-9a-fA-F-]{36})\//);
    const tenantId = tenantIdMatch ? tenantIdMatch[1] : null;

    if (!tenantId) {
      throw new Error(
        `Configuration Error\n\nFailed to extract tenant ID from token URL.\n\nToken URL: ${tokenUrl}\n\nPlease ensure your QR code contains a valid Microsoft tenant configuration.`,
      );
    }

    // Build Microsoft authentication configuration dynamically
    const Microsoftconfig = {
      clientId: client_id,
      redirectUrl: 'authentication://callback/',
      scopes: [
        'openid',
        'profile',
        'email',
        'offline_access',
        `${resource}.default`,
      ],
      serviceConfiguration: {
        authorizationEndpoint: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`,
        tokenEndpoint: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
        endSessionEndpoint: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/logout`,
      },
      additionalParameters: {prompt: 'select_account'},
    };

    return Microsoftconfig;
  } catch (error) {
    console.error('Failed to get Azure configuration:', error);
    throw error;
  }
};

export const getGoogleConfiguration = () => {
  return Googleconfig;
};

// Controller/configuration.js

export const getGraphConsentConfiguration = async (loginHint = null) => {
  const config = await getActiveConfigData();
  const tenantIdMatch = config.tokenUrl.match(/\/([0-9a-fA-F-]{36})\//);
  const tenantId = tenantIdMatch?.[1];

  if (!tenantId) throw new Error('Could not extract tenant ID from config.');

  const additionalParameters = {
    prompt: 'none',
    ...(loginHint && {login_hint: loginHint}), // ← pins the account
  };

  return {
    issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,
    clientId: config.client_id,
    redirectUrl: 'authentication://callback/',
    scopes: [
      'openid',
      'offline_access',
      'https://graph.microsoft.com/Calendars.ReadWrite',
      'https://graph.microsoft.com/User.Read',
    ],
    additionalParameters,
  };
};
