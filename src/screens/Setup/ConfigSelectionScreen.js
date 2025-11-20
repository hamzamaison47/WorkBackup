/* eslint-disable curly */
/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  TextInput,
  Modal,
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
// import {scale, fontScale} from '../../Controller/scaling';
import AlertModal from '../../components/Alert/AlertModal';
import AlertDeleteModal from '../../components/Alert/AlertDeleteModal';
import styles from '../../styles/styles';
import {fontScale, scale} from '../../store/utils/scaling';

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
        style={[
          styles.ConfigSelection_ConfigCard,
          isActive && styles.ConfigSelection_ActiveConfigCard,
        ]}
        onPress={() => handleSelectConfiguration(item.id)}
        activeOpacity={0.7}>
        {/* Active Badge */}
        {isActive && (
          <View style={styles.ConfigSelection_ActiveBadge}>
            <Icon name="check-circle" size={fontScale(16)} color="#fff" />
            <Text style={styles.ConfigSelection_ActiveBadgeText}>ACTIVE</Text>
          </View>
        )}

        {/* Card Header */}
        <View style={styles.ConfigSelection_CardHeader}>
          <View style={styles.ConfigSelection_CardHeaderLeft}>
            <View
              style={[
                styles.ConfigSelection_IconContainer,
                isActive && styles.ConfigSelection_ActiveIconContainer,
              ]}>
              <Icon
                name="server"
                size={fontScale(20)}
                color={isActive ? '#fff' : '#0A66C2'}
              />
            </View>
            <View style={{flex: 1}}>
              <Text
                style={[
                  styles.ConfigSelection_ConfigTitle,
                  isActive && {color: '#0A66C2'},
                ]}>
                {item.displayTitle}
              </Text>
              <Text
                style={[
                  styles.ConfigSelection_ConfigSubtitle,
                  isActive && {color: '#0A66C2', opacity: 0.8},
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

          <View style={styles.ConfigSelection_CardActions}>
            <TouchableOpacity
              style={styles.ConfigSelection_ActionButton}
              onPress={() => handleEditTitle(item)}>
              <Icon
                name="edit"
                size={fontScale(18)}
                color={isActive ? '#0A66C2' : '#666'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.ConfigSelection_ActionButton}
              onPress={() =>
                handleDeleteConfiguration(item.id, item.displayTitle)
              }>
              <Icon name="trash" size={fontScale(18)} color="#dc3545" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Card Details */}
        <View style={styles.ConfigSelection_CardDetails}>
          <View style={styles.ConfigSelection_DetailRow}>
            <Icon
              name="globe"
              size={fontScale(14)}
              color="#666"
              style={styles.ConfigSelection_DetailIcon}
            />
            <Text style={styles.ConfigSelection_DetailLabel}>Environment:</Text>
            <Text
              style={[
                styles.ConfigSelection_DetailValue,
                isActive && {color: '#0A66C2'},
              ]}>
              {item.formattedData.environment}
            </Text>
          </View>

          <View style={styles.ConfigSelection_DetailRow}>
            <Icon
              name="link"
              size={fontScale(14)}
              color="#666"
              style={styles.ConfigSelection_DetailIcon}
            />
            <Text style={styles.ConfigSelection_DetailLabel}>Resource:</Text>
            <Text
              style={[
                styles.ConfigSelection_DetailValue,
                {fontFamily: 'monospace'},
                isActive && {color: '#0A66C2'},
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
    <View style={styles.ConfigSelection_EmptyState}>
      <View style={styles.ConfigSelection_EmptyIconContainer}>
        <Icon name="qrcode" size={scale(70)} color="#0A66C2" />
      </View>
      <Text style={styles.ConfigSelection_EmptyStateTitle}>
        No Configurations Yet
      </Text>
      <Text style={styles.ConfigSelection_EmptyStateSubtitle}>
        Get started by scanning a QR code to add your first configuration
      </Text>
      <TouchableOpacity
        style={styles.ConfigSelection_PrimaryButton}
        onPress={handleAddConfiguration}
        activeOpacity={0.8}>
        <Icon
          name="plus-circle"
          size={fontScale(20)}
          color="#fff"
          style={styles.ConfigSelection_ButtonIcon}
        />
        <Text style={styles.ConfigSelection_PrimaryButtonText}>
          Add Configuration
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.ConfigSelection_Container}>
      {/* Header */}
      <View style={styles.ConfigSelection_Header}>
        <TouchableOpacity
          style={styles.ConfigSelection_HeaderButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={fontScale(22)} color="#0A66C2" />
        </TouchableOpacity>

        <View style={styles.ConfigSelection_HeaderCenter}>
          <Text style={styles.ConfigSelection_HeaderTitle}>Configurations</Text>
          <Text style={styles.ConfigSelection_HeaderSubtitle}>
            {configs.length} {configs.length === 1 ? 'Config' : 'Configs'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.ConfigSelection_HeaderButton}
          onPress={handleAddConfiguration}>
          <Icon name="plus" size={fontScale(22)} color="#0A66C2" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={{flex: 1}}>
        {configs.length > 0 ? (
          <FlatList
            data={configs}
            keyExtractor={item => item.id}
            renderItem={renderConfigItem}
            contentContainerStyle={styles.ConfigSelection_ListContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#0A66C2']}
                tintColor="#0A66C2"
              />
            }
            showsVerticalScrollIndicator={false}
          />
        ) : (
          !loading && renderEmptyState()
        )}

        {loading && (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Icon name="spinner" size={scale(40)} color="#0A66C2" />
            <Text
              style={{
                marginTop: scale(16),
                fontSize: fontScale(16),
                color: '#666',
                fontWeight: '500',
              }}>
              Loading configurations...
            </Text>
          </View>
        )}
      </View>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.ConfigSelection_ModalOverlay}>
          <View style={styles.ConfigSelection_ModalContent}>
            <View style={styles.ConfigSelection_ModalHeader}>
              <Text style={styles.ConfigSelection_ModalTitle}>
                Edit Configuration Title
              </Text>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={styles.ConfigSelection_ModalCloseButton}>
                <Icon name="times" size={fontScale(20)} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.ConfigSelection_ModalBody}>
              <Text style={styles.ConfigSelection_InputLabel}>Title</Text>
              <TextInput
                style={styles.ConfigSelection_Input}
                value={editedTitle}
                onChangeText={setEditedTitle}
                placeholder="Enter configuration title"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.ConfigSelection_ModalFooter}>
              <TouchableOpacity
                style={styles.ConfigSelection_SecondaryButton}
                onPress={() => setEditModalVisible(false)}>
                <Text style={styles.ConfigSelection_SecondaryButtonText}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.ConfigSelection_PrimaryButtonModal}
                onPress={saveEditedTitle}>
                <Icon
                  name="check"
                  size={fontScale(16)}
                  color="#fff"
                  style={styles.ConfigSelection_ButtonIcon}
                />
                <Text style={styles.ConfigSelection_PrimaryButtonText}>
                  Save
                </Text>
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

export default ConfigSelectionScreen;
