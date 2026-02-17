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
  I18nManager,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import {translate as t} from '../../store/utils/translate';

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

import styles from '../../styles/styles';
import {iconSize, scale} from '../../store/utils/scaling';

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

      if (!resource) return t('configSelection.unknownConfig');

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
      return t('configSelection.unknownConfig');
    }
  };

  // Format configuration data for display
  const formatConfigData = configData => {
    return {
      environment: extractTitle(configData),
      clientId:
        configData.client_id?.substring(0, 8) + '...' ||
        t('configSelection.notAvailable'),
      grantType: configData.grant_type || t('configSelection.notAvailable'),
      resourceUrl: configData.resource || t('configSelection.notAvailable'),
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

      const enhancedConfigs = allConfigs.map(config => ({
        ...config,
        displayTitle:
          config.customTitle || config.name || extractTitle(config.data),
        formattedData: formatConfigData(config.data),
      }));

      setConfigs(enhancedConfigs);
      setActiveConfigId(activeId);
    } catch (error) {
      console.error('Error loading configurations:', error);
      setAlertMessage(t('configSelection.loadFailed'));
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
      const selectedConfig = configs.find(config => config.id === configId);

      // Save data first — if this fails, we stop before updating the active ID
      if (selectedConfig) {
        await saveConfig(selectedConfig.data);
      }

      // Only mark as active after data is safely persisted
      await setActiveConfig(configId);
      setActiveConfigId(configId);

      setAlertMessage(t('configSelection.activateSuccess'));
      setAlertModal(true);
    } catch (error) {
      console.error('Error selecting configuration:', error);
      setAlertMessage(t('configSelection.activateFailed'));
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
      if (!editingConfig) return;

      const updatedConfig = {
        id: editingConfig.id,
        name: editedTitle,
        customTitle: editedTitle,
        data: editingConfig.data,
        createdAt: editingConfig.createdAt,
      };

      await updateConfigById(editingConfig.id, updatedConfig);

      setEditModalVisible(false);
      await loadConfigurations();

      setAlertMessage(t('configSelection.updateSuccess'));
      setAlertModal(true);
    } catch (error) {
      console.error('Error updating title:', error);
      setAlertMessage(t('configSelection.updateFailed'));
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
      const isDeletingActive = configId === activeConfigId;

      // Remove the config from Keychain and the list
      await clearConfigById(configId);

      if (isDeletingActive) {
        // Clear the active pointer and the main config fallback
        await setActiveConfig(null);
        await clearConfig();
        setActiveConfigId(null);
      }

      // Reload configs to get the updated list after deletion
      await loadConfigurations();

      if (isDeletingActive) {
        // Check if other configs are still available after reload
        const remaining = await getAllConfigs();
        if (remaining.length > 0) {
          // Auto-activate the first remaining config so the user doesn't
          // get stuck with no active config
          console.log(
            'Auto-selecting next config after active config deletion:',
            remaining[0].id,
          );
          await handleSelectConfiguration(remaining[0].id);
        }
      }

      setAlertMessage(t('configSelection.deleteSuccess'));
      setAlertModal(true);
    } catch (error) {
      console.error('Error deleting configuration:', error);
      setAlertMessage(t('configSelection.deleteFailed'));
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
            <Icon name="check-circle" size={iconSize.xs} color="#fff" />
            <Text style={styles.ConfigSelection_ActiveBadgeText}>
              {t('configSelection.active').toUpperCase()}
            </Text>
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
                size={iconSize.sm}
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
                {t('configSelection.addedOn')}{' '}
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
                size={iconSize.xs}
                color={isActive ? '#0A66C2' : '#666'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.ConfigSelection_ActionButton}
              onPress={() =>
                handleDeleteConfiguration(item.id, item.displayTitle)
              }>
              <Icon name="trash" size={iconSize.xs} color="#dc3545" />
            </TouchableOpacity>
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
        {t('configSelection.noConfigs')}
      </Text>
      <Text style={styles.ConfigSelection_EmptyStateSubtitle}>
        {t('configSelection.getStarted')}
      </Text>
      <TouchableOpacity
        style={styles.ConfigSelection_PrimaryButton}
        onPress={handleAddConfiguration}
        activeOpacity={0.8}>
        <Icon
          name="plus-circle"
          size={iconSize.sm}
          color="#fff"
          style={styles.ConfigSelection_ButtonIcon}
        />
        <Text style={styles.ConfigSelection_PrimaryButtonText}>
          {t('configSelection.addConfig')}
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
          <Icon
            name={I18nManager.isRTL ? 'arrow-right' : 'arrow-left'}
            size={iconSize.sm}
            color="#0A66C2"
          />
        </TouchableOpacity>

        <View style={styles.ConfigSelection_HeaderCenter}>
          <Text style={styles.ConfigSelection_HeaderTitle}>
            {t('configSelection.configurations')}
          </Text>
          <Text style={styles.ConfigSelection_HeaderSubtitle}>
            {configs.length}{' '}
            {configs.length === 1
              ? t('configSelection.configSingular')
              : t('configSelection.configPlural')}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.ConfigSelection_HeaderButton}
          onPress={handleAddConfiguration}>
          <Icon name="plus" size={iconSize.sm} color="#0A66C2" />
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
                fontSize: iconSize.xs,
                color: '#666',
                fontWeight: '500',
              }}>
              {t('configSelection.loading')}
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
                {t('configSelection.editTitle')}
              </Text>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={styles.ConfigSelection_ModalCloseButton}>
                <Icon name="times" size={iconSize.sm} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.ConfigSelection_ModalBody}>
              <Text style={styles.ConfigSelection_InputLabel}>
                {t('configSelection.title')}
              </Text>
              <TextInput
                style={styles.ConfigSelection_Input}
                value={editedTitle}
                onChangeText={setEditedTitle}
                placeholder={t('configSelection.titlePlaceholder')}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.ConfigSelection_ModalFooter}>
              <TouchableOpacity
                style={styles.ConfigSelection_SecondaryButton}
                onPress={() => setEditModalVisible(false)}>
                <Text style={styles.ConfigSelection_SecondaryButtonText}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.ConfigSelection_PrimaryButtonModal}
                onPress={saveEditedTitle}>
                <Icon
                  name="check"
                  size={iconSize.xs}
                  color="#fff"
                  style={styles.ConfigSelection_ButtonIcon}
                />
                <Text style={styles.ConfigSelection_PrimaryButtonText}>
                  {t('common.save')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <AlertModal
        visible={alertModal}
        heading={t('configSelection.configurations')}
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />

      <AlertDeleteModal
        visible={deleteModal}
        heading={t('configSelection.confirmDelete')}
        text={t('configSelection.deleteMessage', {configName: selectedRecName})}
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
