/* eslint-disable no-unused-vars */
/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import {
  saveConfig,
  getConfig,
  clearConfig,
  getAllConfigs,
  saveConfigWithId,
  setActiveConfig,
  getActiveConfig,
  clearConfigById,
} from '../../Controller/secureConfig';
import AlertModal from '../../components/Alert/AlertModal';

const ConfigSelectionScreen = () => {
  const navigation = useNavigation();
  const [configs, setConfigs] = useState([]);
  const [activeConfigId, setActiveConfigId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Load configurations when screen focuses
  useFocusEffect(
    useCallback(() => {
      loadConfigurations();
    }, []),
  );

  const loadConfigurations = async () => {
    try {
      setLoading(true);
      const allConfigs = await getAllConfigs();
      const activeId = await getActiveConfig();

      setConfigs(allConfigs);
      setActiveConfigId(activeId);
    } catch (error) {
      console.error('Error loading configurations:', error);
      setAlertMessage('Failed to load configurations. Please try again.');
      setAlertModal(true);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConfigurations();
    setRefreshing(false);
  };

  const handleAddConfiguration = () => {
    navigation.navigate('QRSetupScreen', {
      returnScreen: 'ConfigSelectionScreen',
      isFromConfigSelection: true,
    });
  };

  const handleSelectConfiguration = async configId => {
    try {
      await setActiveConfig(configId);
      setActiveConfigId(configId);

      // Also save the selected config as the main config for backward compatibility
      const selectedConfig = configs.find(config => config.id === configId);
      if (selectedConfig) {
        await saveConfig(selectedConfig.data);
      }

      setAlertMessage('Configuration selected successfully!');
      setAlertModal(true);
    } catch (error) {
      console.error('Error selecting configuration:', error);
      setAlertMessage('Failed to select configuration. Please try again.');
      setAlertModal(true);
    }
  };

  const handleDeleteConfiguration = (configId, configName) => {
    Alert.alert(
      'Delete Configuration',
      `Are you sure you want to delete "${configName}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteConfiguration(configId),
        },
      ],
    );
  };

  const deleteConfiguration = async configId => {
    try {
      // If deleting the active config, clear the active config
      if (configId === activeConfigId) {
        await setActiveConfig(null);
        await clearConfig(); // Clear main config too
        setActiveConfigId(null);
      }

      // Remove from keychain (you'll need to implement this in secureConfig.js)
      await clearConfigById(configId);

      // Reload configurations
      await loadConfigurations();

      setAlertMessage('Configuration deleted successfully!');
      setAlertModal(true);
    } catch (error) {
      console.error('Error deleting configuration:', error);
      setAlertMessage('Failed to delete configuration. Please try again.');
      setAlertModal(true);
    }
  };

  const renderConfigItem = ({item}) => {
    const isActive = item.id === activeConfigId;

    return (
      <View style={[styles.configItem, isActive && styles.activeConfigItem]}>
        <TouchableOpacity
          style={styles.configContent}
          onPress={() => handleSelectConfiguration(item.id)}>
          <View style={styles.configInfo}>
            <Text
              style={[styles.configName, isActive && styles.activeConfigText]}>
              {item.name}
            </Text>
            <Text
              style={[
                styles.configDate,
                isActive && styles.activeConfigSubText,
              ]}>
              Added: {new Date(item.createdAt).toLocaleDateString()}
            </Text>
            {item.data.serverUrl && (
              <Text
                style={[
                  styles.configUrl,
                  isActive && styles.activeConfigSubText,
                ]}
                numberOfLines={1}>
                {item.data.serverUrl}
              </Text>
            )}
          </View>

          {isActive && (
            <View style={styles.activeIndicator}>
              <Icon name="check-circle" size={20} color="#0A66C2" />
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteConfiguration(item.id, item.name)}>
          <Icon name="trash" size={16} color="#dc3545" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="qrcode" size={60} color="#ccc" />
      <Text style={styles.emptyStateTitle}>No Configurations Found</Text>
      <Text style={styles.emptyStateSubtitle}>
        Add your first configuration by scanning a QR code
      </Text>
      <TouchableOpacity
        style={styles.emptyStateButton}
        onPress={handleAddConfiguration}>
        <Icon name="plus" size={16} color="#fff" style={{marginRight: 8}} />
        <Text style={styles.emptyStateButtonText}>Add Configuration</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={20} color="#0A66C2" />
        </TouchableOpacity>

        <Text style={styles.title}>Select Configuration</Text>

        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddConfiguration}>
          <Icon name="plus" size={20} color="#0A66C2" />
        </TouchableOpacity>
      </View>

      {/* Configuration List */}
      <View style={styles.content}>
        {configs.length > 0 ? (
          <FlatList
            data={configs}
            keyExtractor={item => item.id}
            renderItem={renderConfigItem}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        ) : (
          !loading && renderEmptyState()
        )}

        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading configurations...</Text>
          </View>
        )}
      </View>

      {/* Footer Info */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Select a configuration to use for login, or add a new one by scanning
          a QR code.
        </Text>
      </View>

      <AlertModal
        visible={alertModal}
        heading="Configuration"
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 20,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e6e6e6',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  addButton: {
    padding: 8,
    backgroundColor: '#f8f9fa',
    // borderRadius: 20,
    // borderWidth: 1,
    // borderColor: '#0A66C2',
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  configItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e6e6e6',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activeConfigItem: {
    borderColor: '#0A66C2',
    backgroundColor: '#f0f8ff',
  },
  configContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  configInfo: {
    flex: 1,
  },
  configName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  configDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  configUrl: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  activeConfigText: {
    color: '#0A66C2',
  },
  activeConfigSubText: {
    color: '#0A66C2',
    opacity: 0.7,
  },
  activeIndicator: {
    marginLeft: 12,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  separator: {
    height: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#0A66C2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  footer: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e6e6e6',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default ConfigSelectionScreen;
