/* eslint-disable curly */
/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unstable-nested-components */
import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
  Dimensions,
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
  updateConfigById,
} from '../../Controller/secureConfig';
import AlertModal from '../../components/Alert/AlertModal';
import AlertDeleteModal from '../../components/Alert/AlertDeleteModal';

const {height, width} = Dimensions.get('window');

const wp = percentage => (width * percentage) / 100;
const hp = percentage => (height * percentage) / 100;

const ConfigSelectionScreen = () => {
  const navigation = useNavigation();
  const [configs, setConfigs] = useState([]);
  const [activeConfigId, setActiveConfigId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alertModal, setAlertModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedRecId, setSelectedRecId] = useState(null);
  const [selectedRecName, setSelectedRecName] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [editedTitle, setEditedTitle] = useState('');

  // Extract title from resource URL
  const extractTitle = configOrUrl => {
    try {
      const resource =
        typeof configOrUrl === 'string'
          ? configOrUrl
          : configOrUrl?.resource || '';

      if (!resource) return 'Unknown Configuration';

      let withoutProtocol = resource.replace(/(^\w+:|^)\/\//, '');
      const hostname = withoutProtocol.split('/')[0];
      const firstPart = hostname.split('.')[0];
      const hyphenParts = firstPart.split('-');

      if (hyphenParts.length >= 2) {
        return `${hyphenParts[0]}-${hyphenParts[1]}`;
      }

      return firstPart || 'Unknown Configuration';
    } catch (err) {
      console.error('extractTitle parsing error:', err);
      return 'Unknown Configuration';
    }
  };

  // Format configuration data for display
  const formatConfigData = configData => {
    return {
      environment: extractTitle(configData),
      clientId: configData.client_id?.substring(0, 8) + '...' || 'N/A',
      grantType: configData.grant_type || 'N/A',
      resourceUrl: configData.resource || 'N/A',
    };
  };

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

      // Enhance configs with extracted titles
      const enhancedConfigs = allConfigs.map(config => ({
        ...config,
        displayTitle: config.customTitle || extractTitle(config.data),
        formattedData: formatConfigData(config.data),
      }));

      setConfigs(enhancedConfigs);
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

      const selectedConfig = configs.find(config => config.id === configId);
      if (selectedConfig) {
        await saveConfig(selectedConfig.data);
      }

      setAlertMessage('Configuration activated successfully!');
      setAlertModal(true);
    } catch (error) {
      console.error('Error selecting configuration:', error);
      setAlertMessage('Failed to select configuration. Please try again.');
      setAlertModal(true);
    }
  };

  const handleEditTitle = config => {
    setEditingConfig(config);
    setEditedTitle(config.customTitle || config.displayTitle);
    setEditModalVisible(true);
  };

  const saveEditedTitle = async () => {
    try {
      const updatedConfig = {
        ...editingConfig,
        name: editedTitle,
        customTitle: editedTitle,
        data: editingConfig.data,
      };

      await updateConfigById(editingConfig.id, updatedConfig);

      setEditModalVisible(false);
      await loadConfigurations();

      setAlertMessage('Title updated successfully!');
      setAlertModal(true);
    } catch (error) {
      console.error('Error updating title:', error);
      setAlertMessage('Failed to update title. Please try again.');
      setAlertModal(true);
    }
  };

  const handleDeleteConfiguration = (configId, configName) => {
    setSelectedRecId(configId);
    setSelectedRecName(configName);
    setDeleteModal(true);
  };

  const deleteConfiguration = async configId => {
    try {
      if (configId === activeConfigId) {
        await setActiveConfig(null);
        await clearConfig();
        setActiveConfigId(null);
      }

      await clearConfigById(configId);
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
      <TouchableOpacity
        style={[styles.configCard, isActive && styles.activeConfigCard]}
        onPress={() => handleSelectConfiguration(item.id)}
        activeOpacity={0.7}>
        {/* Active Badge */}
        {isActive && (
          <View style={styles.activeBadge}>
            <Icon name="check-circle" size={16} color="#fff" />
            <Text style={styles.activeBadgeText}>ACTIVE</Text>
          </View>
        )}

        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View
              style={[
                styles.iconContainer,
                isActive && styles.activeIconContainer,
              ]}>
              <Icon
                name="server"
                size={20}
                color={isActive ? '#fff' : '#0A66C2'}
              />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={[styles.configTitle, isActive && styles.activeText]}>
                {item.displayTitle}
              </Text>
              <Text
                style={[
                  styles.configSubtitle,
                  isActive && styles.activeSubText,
                ]}>
                Added{' '}
                {new Date(item.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </View>

          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditTitle(item)}>
              <Icon
                name="edit"
                size={18}
                color={isActive ? '#0A66C2' : '#666'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                handleDeleteConfiguration(item.id, item.displayTitle)
              }>
              <Icon name="trash" size={18} color="#dc3545" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Card Details */}
        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Icon
              name="globe"
              size={14}
              color="#666"
              style={styles.detailIcon}
            />
            <Text style={styles.detailLabel}>Environment:</Text>
            <Text
              style={[
                styles.detailValue,
                isActive && styles.activeDetailValue,
              ]}>
              {item.formattedData.environment}
            </Text>
          </View>

          {/* <View style={styles.detailRow}>
            <Icon name="key" size={14} color="#666" style={styles.detailIcon} />
            <Text style={styles.detailLabel}>Client ID:</Text>
            <Text
              style={[
                styles.detailValue,
                isActive && styles.activeDetailValue,
              ]}>
              {item.formattedData.clientId}
            </Text>
          </View> */}

          {/* <View style={styles.detailRow}>
            <Icon
              name="shield"
              size={14}
              color="#666"
              style={styles.detailIcon}
            />
            <Text style={styles.detailLabel}>Grant Type:</Text>
            <Text
              style={[
                styles.detailValue,
                isActive && styles.activeDetailValue,
              ]}>
              {item.formattedData.grantType}
            </Text>
          </View> */}

          <View style={styles.detailRow}>
            <Icon
              name="link"
              size={14}
              color="#666"
              style={styles.detailIcon}
            />
            <Text style={styles.detailLabel}>Resource:</Text>
            <Text
              style={[
                styles.detailValue,
                styles.urlValue,
                isActive && styles.activeDetailValue,
              ]}
              numberOfLines={1}
              ellipsizeMode="middle">
              {item.formattedData.resourceUrl}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Icon name="qrcode" size={70} color="#0A66C2" />
      </View>
      <Text style={styles.emptyStateTitle}>No Configurations Yet</Text>
      <Text style={styles.emptyStateSubtitle}>
        Get started by scanning a QR code to add your first configuration
      </Text>
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleAddConfiguration}
        activeOpacity={0.8}>
        <Icon
          name="plus-circle"
          size={20}
          color="#fff"
          style={styles.buttonIcon}
        />
        <Text style={styles.primaryButtonText}>Add Configuration</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={22} color="#0A66C2" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Configurations</Text>
          <Text style={styles.headerSubtitle}>
            {configs.length} {configs.length === 1 ? 'Config' : 'Configs'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleAddConfiguration}>
          <Icon name="plus" size={22} color="#0A66C2" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {configs.length > 0 ? (
          <FlatList
            data={configs}
            keyExtractor={item => item.id}
            renderItem={renderConfigItem}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#0A66C2']}
                tintColor="#0A66C2"
              />
            }
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          !loading && renderEmptyState()
        )}

        {loading && (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingSpinner}>
              <Icon name="spinner" size={40} color="#0A66C2" />
            </View>
            <Text style={styles.loadingText}>Loading configurations...</Text>
          </View>
        )}
      </View>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Configuration Title</Text>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={styles.modalCloseButton}>
                <Icon name="times" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.input}
                value={editedTitle}
                onChangeText={setEditedTitle}
                placeholder="Enter configuration title"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setEditModalVisible(false)}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryButtonModal}
                onPress={saveEditedTitle}>
                <Icon
                  name="check"
                  size={16}
                  color="#fff"
                  style={styles.buttonIcon}
                />
                <Text style={styles.primaryButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <AlertModal
        visible={alertModal}
        heading="Configuration"
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />

      <AlertDeleteModal
        visible={deleteModal}
        heading="Confirm Deletion"
        text={`Are you sure you want to delete "${selectedRecName}"?`}
        onPress={() => {
          deleteConfiguration(selectedRecId);
          setDeleteModal(false);
        }}
        onCancel={() => setDeleteModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8eaed',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: '#f0f8ff',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  configCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e8eaed',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  activeConfigCard: {
    borderColor: '#0A66C2',
    backgroundColor: '#f8fbff',
  },
  activeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#0A66C2',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  activeBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activeIconContainer: {
    backgroundColor: '#0A66C2',
  },
  cardHeaderText: {
    flex: 1,
  },
  configTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  configSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  activeText: {
    color: '#0A66C2',
  },
  activeSubText: {
    color: '#0A66C2',
    opacity: 0.8,
  },
  cardActions: {
    marginTop: height * 0.035,
    flexDirection: 'row',
    gap: width * 0.02,
  },
  actionButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f5f7fa',
  },
  cardDetails: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    marginRight: 8,
    width: 16,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    width: 90,
  },
  detailValue: {
    fontSize: 12,
    color: '#1a1a1a',
    flex: 1,
    fontWeight: '500',
  },
  activeDetailValue: {
    color: '#0A66C2',
  },
  urlValue: {
    fontFamily: 'monospace',
  },
  separator: {
    height: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  emptyStateSubtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  primaryButton: {
    backgroundColor: '#0A66C2',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0A66C2',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonIcon: {
    marginRight: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingSpinner: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e8eaed',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#f5f7fa',
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: '#e8eaed',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#f8f9fa',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e8eaed',
  },
  secondaryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f5f7fa',
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '600',
  },
  primaryButtonModal: {
    backgroundColor: '#0A66C2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default ConfigSelectionScreen;
