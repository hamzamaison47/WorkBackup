import * as Keychain from 'react-native-keychain';

const CONFIG_SERVICE = 'appConfig';
const CONFIGS_LIST_SERVICE = 'appConfigsList';
const ACTIVE_CONFIG_SERVICE = 'activeConfig';

// Generate unique ID for configurations
const generateConfigId = () => {
  return Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
};

// Original functions for backward compatibility
export async function saveConfig(config) {
  const json = JSON.stringify(config);
  await Keychain.setGenericPassword('config', json, {
    service: CONFIG_SERVICE,
  });
}

export async function getConfig() {
  const creds = await Keychain.getGenericPassword({service: CONFIG_SERVICE});
  if (creds) {
    return JSON.parse(creds.password);
  }
  return null;
}

export async function clearConfig() {
  await Keychain.resetGenericPassword({service: CONFIG_SERVICE});
}

// Update existing config instead of creating new one
export async function updateConfigById(configId, updatedConfig) {
  try {
    // Get current list
    const configsList = await getConfigsList();
    const index = configsList.findIndex(c => c.id === configId);

    if (index === -1) {
      throw new Error(`Config with ID ${configId} not found`);
    }

    // Update the list entry (shown in ConfigSelectionScreen)
    configsList[index].name =
      updatedConfig.name ||
      updatedConfig.customTitle ||
      configsList[index].name;

    await saveConfigsList(configsList);

    // Save full updated config object
    const finalConfig = {
      ...updatedConfig,
      id: configId,
      createdAt: configsList[index].createdAt, // preserve createdAt
    };

    await Keychain.setGenericPassword(
      `config_${configId}`,
      JSON.stringify(finalConfig),
      {
        service: `${CONFIG_SERVICE}_${configId}`,
      },
    );

    return true;
  } catch (error) {
    console.error('Error updating config:', error);
    throw error;
  }
}

// New functions for multiple configurations
export async function saveConfigWithId(config, customName = null) {
  try {
    const configId = generateConfigId();
    const configName =
      customName || `Configuration ${new Date().toLocaleDateString()}`;

    const configData = {
      id: configId,
      name: configName,
      data: config,
      createdAt: new Date().toISOString(),
    };

    // Save individual config
    await Keychain.setGenericPassword(
      `config_${configId}`,
      JSON.stringify(configData),
      {
        service: `${CONFIG_SERVICE}_${configId}`,
      },
    );

    // Update configs list
    const configsList = await getConfigsList();
    configsList.push({
      id: configId,
      name: configName,
      createdAt: configData.createdAt,
    });

    await saveConfigsList(configsList);

    // Set as active config
    await setActiveConfig(configId);

    // Also save as main config for backward compatibility
    await saveConfig(config);

    return configId;
  } catch (error) {
    console.error('Error saving config with ID:', error);
    throw error;
  }
}

export async function getAllConfigs() {
  try {
    const configsList = await getConfigsList();
    const configs = [];

    for (const configInfo of configsList) {
      try {
        const configData = await getConfigById(configInfo.id);
        if (configData) {
          configs.push(configData);
        }
      } catch (error) {
        console.error(`Error loading config ${configInfo.id}:`, error);
        // Remove invalid config from list
        await removeConfigFromList(configInfo.id);
      }
    }

    return configs;
  } catch (error) {
    console.error('Error getting all configs:', error);
    return [];
  }
}

export async function getConfigById(configId) {
  try {
    const creds = await Keychain.getGenericPassword({
      service: `${CONFIG_SERVICE}_${configId}`,
    });

    if (creds) {
      return JSON.parse(creds.password);
    }
    return null;
  } catch (error) {
    console.error('Error getting config by ID:', error);
    return null;
  }
}

export async function clearConfigById(configId) {
  try {
    // Remove from keychain
    await Keychain.resetGenericPassword({
      service: `${CONFIG_SERVICE}_${configId}`,
    });

    // Remove from configs list
    await removeConfigFromList(configId);
  } catch (error) {
    console.error('Error clearing config by ID:', error);
    throw error;
  }
}

export async function setActiveConfig(configId) {
  try {
    if (configId) {
      await Keychain.setGenericPassword('activeConfigId', configId, {
        service: ACTIVE_CONFIG_SERVICE,
      });
    } else {
      await Keychain.resetGenericPassword({service: ACTIVE_CONFIG_SERVICE});
    }
  } catch (error) {
    console.error('Error setting active config:', error);
    throw error;
  }
}

export async function getActiveConfig() {
  try {
    const creds = await Keychain.getGenericPassword({
      service: ACTIVE_CONFIG_SERVICE,
    });

    if (creds) {
      return creds.password;
    }
    return null;
  } catch (error) {
    console.error('Error getting active config:', error);
    return null;
  }
}

export async function getActiveConfigData() {
  try {
    const activeConfigId = await getActiveConfig();
    if (activeConfigId) {
      const configData = await getConfigById(activeConfigId);
      if (configData?.data) {
        return configData.data;
      }
      console.warn(
        `Active config ID ${activeConfigId} exists but data is missing`,
      );
    }

    // Fallback to main config
    const mainConfig = await getConfig();
    if (mainConfig) {
      console.log('Using fallback main config');
      return mainConfig;
    }

    console.error('No active config and no fallback config available');
    return null;
  } catch (error) {
    console.error('Error getting active config data:', error);
    return null;
  }
}
// export async function getActiveConfigData() {
//   try {
//     const activeConfigId = await getActiveConfig();
//     if (activeConfigId) {
//       const configData = await getConfigById(activeConfigId);
//       return configData ? configData.data : null;
//     }

//     // Fallback to main config if no active config is set
//     return await getConfig();
//   } catch (error) {
//     console.error('Error getting active config data:', error);
//     return null;
//   }
// }

// Helper functions for managing configs list
async function getConfigsList() {
  try {
    const creds = await Keychain.getGenericPassword({
      service: CONFIGS_LIST_SERVICE,
    });

    if (creds) {
      return JSON.parse(creds.password);
    }
    return [];
  } catch (error) {
    console.error('Error getting configs list:', error);
    return [];
  }
}

async function saveConfigsList(configsList) {
  try {
    await Keychain.setGenericPassword(
      'configsList',
      JSON.stringify(configsList),
      {
        service: CONFIGS_LIST_SERVICE,
      },
    );
  } catch (error) {
    console.error('Error saving configs list:', error);
    throw error;
  }
}

async function removeConfigFromList(configId) {
  try {
    const configsList = await getConfigsList();
    const updatedList = configsList.filter(config => config.id !== configId);
    await saveConfigsList(updatedList);
  } catch (error) {
    console.error('Error removing config from list:', error);
    throw error;
  }
}

// Utility function to migrate old config to new system (call this once on app startup)
export async function migrateOldConfig() {
  try {
    const oldConfig = await getConfig();
    const configsList = await getConfigsList();

    // If we have an old config but no new configs, migrate it
    if (oldConfig && configsList.length === 0) {
      console.log('Migrating old configuration to new system...');
      await saveConfigWithId(oldConfig, 'Migrated Configuration');
    }
  } catch (error) {
    console.error('Error migrating old config:', error);
  }
}
