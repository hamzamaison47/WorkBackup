const Microsoftconfig = {
  // issuer: 'https://maison-uat.sandbox.operations.dynamics.com',
  clientId: '44c7cff3-bed3-4644-bed9-36c7c0a13dbe',
  redirectUrl: 'authentication://callback/',
  scopes: ['openid', 'profile', 'email'],
  serviceConfiguration: {
    authorizationEndpoint:
      'https://login.microsoftonline.com/5df08255-a152-4fbc-a174-0d8a182aa594/oauth2/v2.0/authorize',
    tokenEndpoint:
      'https://login.microsoftonline.com/5df08255-a152-4fbc-a174-0d8a182aa594/oauth2/v2.0/token',
    endSessionEndpoint:
      'https://login.microsoftonline.com/5df08255-a152-4fbc-a174-0d8a182aa594/oauth2/v2.0/logout',
  },
};
const MicrosoftconfigV2 = {
  issuer:
    'https://login.microsoftonline.com/5df08255-a152-4fbc-a174-0d8a182aa594/v2.0',
  clientId: '44c7cff3-bed3-4644-bed9-36c7c0a13dbe',
  redirectUrl: 'authentication://callback/',
  scopes: ['openid', 'profile', 'email'],
  additionalParameters: {prompt: 'select_account'},
};

const GOOGLE_OAUTH_APP_GUID = '127486062920-9v2chjic07bslm1uoqrdodrmskgh9gpl'; // it looks something like 12345678912-k50abcdefghijkabcdefghijkabcdefv
const Googleconfig = {
  issuer: 'https://accounts.google.com',
  clientId: `${GOOGLE_OAUTH_APP_GUID}.apps.googleusercontent.com`,
  redirectUrl: `com.googleusercontent.apps.${GOOGLE_OAUTH_APP_GUID}:/oauth2redirect/google`,
  scopes: ['openid', 'profile', 'email'],
  additionalParameters: {prompt: 'consent'},
};

export const getAzureConfiguration = () => {
  return Microsoftconfig;
};

export const getAzureConfigurationV2 = () => {
  return MicrosoftconfigV2;
};

export const getGoogleConfiguration = () => {
  return Googleconfig;
};
