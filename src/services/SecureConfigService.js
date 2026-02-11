// services/SecureConfigService.js
import EncryptedStorage from 'react-native-encrypted-storage';
import {
  AZURE_API_KEY,
  AZURE_ENDPOINT,
  AZURE_DEPLOYMENT,
  AZURE_API_VERSION,
} from '@env';

const CONFIG_KEYS = {
  AZURE_AI: 'secure_azure_ai_config',
};

// Debug helper to check env variables
const debugEnvVariables = () => {
  console.log('🔍 Environment Variables Check:', {
    AZURE_ENDPOINT: AZURE_ENDPOINT || 'NOT FOUND',
    AZURE_API_KEY: AZURE_API_KEY
      ? `Length: ${AZURE_API_KEY.length}, First 8: ${AZURE_API_KEY.substring(
          0,
          8,
        )}...`
      : 'NOT FOUND',
    AZURE_DEPLOYMENT: AZURE_DEPLOYMENT || 'NOT FOUND',
    AZURE_API_VERSION: AZURE_API_VERSION || 'NOT FOUND',
  });
};

// Call debug on import
debugEnvVariables();

/**
 * Get Azure AI configuration from environment variables
 */
export const getAzureAIConfig = async () => {
  try {
    // Always use environment variables directly
    const config = {
      endpoint: AZURE_ENDPOINT,
      apiKey: AZURE_API_KEY,
      deployment: AZURE_DEPLOYMENT,
      apiVersion: AZURE_API_VERSION,
    };

    // Validate config
    if (!config.apiKey || config.apiKey.trim() === '') {
      throw new Error('Azure API Key is missing in environment variables');
    }

    // SECURE: Only log non-sensitive info
    console.log('✅ Azure AI Config loaded:', {
      endpoint: config.endpoint,
      deployment: config.deployment,
      apiVersion: config.apiVersion,
      apiKeyPresent: !!config.apiKey,
      apiKeyLength: config.apiKey.length,
      // NEVER log partial keys in production
    });

    return config;
  } catch (error) {
    console.error('❌ Failed to get Azure AI config:', error.message);
    throw error;
  }
};
/**
 * Get Azure AI configuration from environment variables
 */
// export const getAzureAIConfig = async () => {
//   try {
//     // Always use environment variables directly
//     const config = {
//       endpoint: AZURE_ENDPOINT,
//       apiKey: AZURE_API_KEY,
//       deployment: AZURE_DEPLOYMENT,
//       apiVersion: AZURE_API_VERSION,
//     };

//     // Validate config
//     if (!config.apiKey || config.apiKey.trim() === '') {
//       throw new Error('Azure API Key is missing in environment variables');
//     }

//     console.log('✅ Azure AI Config loaded from environment:', {
//       endpoint: config.endpoint,
//       deployment: config.deployment,
//       apiVersion: config.apiVersion,
//       apiKeyLength: config.apiKey.length,
//       apiKeyPreview: `${config.apiKey.substring(
//         0,
//         8,
//       )}...${config.apiKey.substring(config.apiKey.length - 4)}`,
//     });

//     return config;
//   } catch (error) {
//     console.error('❌ Failed to get Azure AI config:', error.message);
//     throw error;
//   }
// };

/**
 * Store configuration in encrypted storage (optional backup)
 */
export const storeSecureConfig = async (configType, config) => {
  try {
    const encrypted = JSON.stringify(config);
    await EncryptedStorage.setItem(CONFIG_KEYS[configType], encrypted);
    console.log(`✅ ${configType} stored securely`);
    return true;
  } catch (error) {
    console.error('❌ Failed to store secure config:', error);
    return false;
  }
};

/**
 * Get configuration from encrypted storage (fallback)
 */
export const getSecureConfig = async configType => {
  try {
    const encrypted = await EncryptedStorage.getItem(CONFIG_KEYS[configType]);

    if (!encrypted) {
      console.log(`⚠️ No ${configType} found in encrypted storage`);
      return null;
    }

    const config = JSON.parse(encrypted);
    console.log(`✅ ${configType} loaded from encrypted storage`);
    return config;
  } catch (error) {
    console.error(`❌ Failed to get ${configType} from storage:`, error);
    return null;
  }
};

/**
 * Initialize Azure AI Configuration
 */
export const initializeAzureConfig = async () => {
  try {
    console.log('🔐 Initializing Azure AI configuration...');

    // Get config from environment variables
    const envConfig = await getAzureAIConfig();

    // Also store in encrypted storage as backup
    await storeSecureConfig('AZURE_AI', envConfig);

    console.log('✅ Azure AI configuration initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Azure config:', error.message);

    // Try to use stored config as fallback
    try {
      const storedConfig = await getSecureConfig('AZURE_AI');
      if (storedConfig) {
        console.log('⚠️ Using stored config as fallback');
        return true;
      }
    } catch (fallbackError) {
      console.error('❌ No fallback config available');
    }

    return false;
  }
};

/**
 * Clear all secure configurations
 */
export const clearSecureConfigs = async () => {
  try {
    await EncryptedStorage.clear();
    console.log('✅ All secure configurations cleared');
    return true;
  } catch (error) {
    console.error('❌ Failed to clear configs:', error);
    return false;
  }
};

/**
 * Test Azure AI connection
 */
export const testAzureConnection = async () => {
  try {
    const config = await getAzureAIConfig();

    console.log('🧪 Testing Azure AI Connection...');
    console.log(
      '🧪 URL:',
      `${config.endpoint}/openai/deployments/${config.deployment}?api-version=${config.apiVersion}`,
    );

    const response = await fetch(
      `${config.endpoint}/openai/deployments/${config.deployment}?api-version=${config.apiVersion}`,
      {
        method: 'GET',
        headers: {
          'api-key': config.apiKey,
        },
      },
    );

    console.log('🧪 Connection Test Status:', response.status);
    return response.status === 200;
  } catch (error) {
    console.error('🧪 Connection Test Failed:', error.message);
    return false;
  }
};

export default {
  getAzureAIConfig,
  storeSecureConfig,
  getSecureConfig,
  initializeAzureConfig,
  clearSecureConfigs,
  testAzureConnection,
};
