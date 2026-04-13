// /* eslint-disable curly */
// /* eslint-disable no-unused-vars */
// /* eslint-disable react-hooks/exhaustive-deps */
// /* eslint-disable react-native/no-inline-styles */
// import React, {useState, useEffect, useCallback} from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   FlatList,
//   RefreshControl,
//   TextInput,
//   Modal,
//   I18nManager,
// } from 'react-native';
// import {useNavigation, useFocusEffect} from '@react-navigation/native';
// import Icon from 'react-native-vector-icons/FontAwesome';
// import {translate as t} from '../../store/utils/translate';

// import {
//   saveConfig,
//   getConfig,
//   clearConfig,
//   getAllConfigs,
//   saveConfigWithId,
//   setActiveConfig,
//   getActiveConfig,
//   clearConfigById,
//   updateConfigById,
// } from '../../Controller/secureConfig';

// import AlertModal from '../../components/Alert/AlertModal';
// import AlertDeleteModal from '../../components/Alert/AlertDeleteModal';

// import styles from '../../styles/styles';
// import {iconSize, scale} from '../../store/utils/scaling';

// const ConfigSelectionScreen = () => {
//   const navigation = useNavigation();
//   const [configs, setConfigs] = useState([]);
//   const [activeConfigId, setActiveConfigId] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [alertModal, setAlertModal] = useState(false);
//   const [deleteModal, setDeleteModal] = useState(false);
//   const [selectedRecId, setSelectedRecId] = useState(null);
//   const [selectedRecName, setSelectedRecName] = useState('');
//   const [alertMessage, setAlertMessage] = useState('');
//   const [refreshing, setRefreshing] = useState(false);
//   const [editModalVisible, setEditModalVisible] = useState(false);
//   const [editingConfig, setEditingConfig] = useState(null);
//   const [editedTitle, setEditedTitle] = useState('');

//   // Extract title from resource URL
//   const extractTitle = configOrUrl => {
//     try {
//       const resource =
//         typeof configOrUrl === 'string'
//           ? configOrUrl
//           : configOrUrl?.resource || '';

//       if (!resource) return t('configSelection.unknownConfig');

//       let withoutProtocol = resource.replace(/(^\w+:|^)\/\//, '');
//       const hostname = withoutProtocol.split('/')[0];
//       const firstPart = hostname.split('.')[0];
//       const hyphenParts = firstPart.split('-');

//       if (hyphenParts.length >= 2) {
//         return `${hyphenParts[0]}-${hyphenParts[1]}`;
//       }

//       return firstPart || 'Unknown Configuration';
//     } catch (err) {
//       console.error('extractTitle parsing error:', err);
//       return t('configSelection.unknownConfig');
//     }
//   };

//   // Format configuration data for display
//   const formatConfigData = configData => {
//     return {
//       environment: extractTitle(configData),
//       clientId:
//         configData.client_id?.substring(0, 8) + '...' ||
//         t('configSelection.notAvailable'),
//       grantType: configData.grant_type || t('configSelection.notAvailable'),
//       resourceUrl: configData.resource || t('configSelection.notAvailable'),
//     };
//   };

//   useFocusEffect(
//     useCallback(() => {
//       loadConfigurations();
//     }, []),
//   );

//   const loadConfigurations = async () => {
//     try {
//       setLoading(true);
//       const allConfigs = await getAllConfigs();
//       const activeId = await getActiveConfig();

//       const enhancedConfigs = allConfigs.map(config => ({
//         ...config,
//         displayTitle:
//           config.customTitle || config.name || extractTitle(config.data),
//         formattedData: formatConfigData(config.data),
//       }));

//       setConfigs(enhancedConfigs);
//       setActiveConfigId(activeId);
//     } catch (error) {
//       console.error('Error loading configurations:', error);
//       setAlertMessage(t('configSelection.loadFailed'));
//       setAlertModal(true);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const onRefresh = async () => {
//     setRefreshing(true);
//     await loadConfigurations();
//     setRefreshing(false);
//   };

//   const handleAddConfiguration = () => {
//     navigation.navigate('QRSetupScreen', {
//       returnScreen: 'ConfigSelectionScreen',
//       isFromConfigSelection: true,
//     });
//   };

//   const handleSelectConfiguration = async configId => {
//     try {
//       const selectedConfig = configs.find(config => config.id === configId);

//       // Save data first — if this fails, we stop before updating the active ID
//       if (selectedConfig) {
//         await saveConfig(selectedConfig.data);
//       }

//       // Only mark as active after data is safely persisted
//       await setActiveConfig(configId);
//       setActiveConfigId(configId);

//       setAlertMessage(t('configSelection.activateSuccess'));
//       setAlertModal(true);
//     } catch (error) {
//       console.error('Error selecting configuration:', error);
//       setAlertMessage(t('configSelection.activateFailed'));
//       setAlertModal(true);
//     }
//   };

//   const handleEditTitle = config => {
//     setEditingConfig(config);
//     setEditedTitle(config.customTitle || config.displayTitle);
//     setEditModalVisible(true);
//   };

//   const saveEditedTitle = async () => {
//     try {
//       if (!editingConfig) return;

//       const updatedConfig = {
//         id: editingConfig.id,
//         name: editedTitle,
//         customTitle: editedTitle,
//         data: editingConfig.data,
//         createdAt: editingConfig.createdAt,
//       };

//       await updateConfigById(editingConfig.id, updatedConfig);

//       setEditModalVisible(false);
//       await loadConfigurations();

//       setAlertMessage(t('configSelection.updateSuccess'));
//       setAlertModal(true);
//     } catch (error) {
//       console.error('Error updating title:', error);
//       setAlertMessage(t('configSelection.updateFailed'));
//       setAlertModal(true);
//     }
//   };

//   const handleDeleteConfiguration = (configId, configName) => {
//     setSelectedRecId(configId);
//     setSelectedRecName(configName);
//     setDeleteModal(true);
//   };

//   const deleteConfiguration = async configId => {
//     try {
//       const isDeletingActive = configId === activeConfigId;

//       // Remove the config from Keychain and the list
//       await clearConfigById(configId);

//       if (isDeletingActive) {
//         // Clear the active pointer and the main config fallback
//         await setActiveConfig(null);
//         await clearConfig();
//         setActiveConfigId(null);
//       }

//       // Reload configs to get the updated list after deletion
//       await loadConfigurations();

//       if (isDeletingActive) {
//         // Check if other configs are still available after reload
//         const remaining = await getAllConfigs();
//         if (remaining.length > 0) {
//           // Auto-activate the first remaining config so the user doesn't
//           // get stuck with no active config
//           console.log(
//             'Auto-selecting next config after active config deletion:',
//             remaining[0].id,
//           );
//           await handleSelectConfiguration(remaining[0].id);
//         }
//       }

//       setAlertMessage(t('configSelection.deleteSuccess'));
//       setAlertModal(true);
//     } catch (error) {
//       console.error('Error deleting configuration:', error);
//       setAlertMessage(t('configSelection.deleteFailed'));
//       setAlertModal(true);
//     }
//   };

//   const renderConfigItem = ({item}) => {
//     const isActive = item.id === activeConfigId;

//     return (
//       <TouchableOpacity
//         style={[
//           styles.ConfigSelection_ConfigCard,
//           isActive && styles.ConfigSelection_ActiveConfigCard,
//         ]}
//         onPress={() => handleSelectConfiguration(item.id)}
//         activeOpacity={0.7}>
//         {/* Active Badge */}
//         {isActive && (
//           <View style={styles.ConfigSelection_ActiveBadge}>
//             <Icon name="check-circle" size={iconSize.xs} color="#fff" />
//             <Text style={styles.ConfigSelection_ActiveBadgeText}>
//               {t('configSelection.active').toUpperCase()}
//             </Text>
//           </View>
//         )}

//         {/* Card Header */}
//         <View style={styles.ConfigSelection_CardHeader}>
//           <View style={styles.ConfigSelection_CardHeaderLeft}>
//             <View
//               style={[
//                 styles.ConfigSelection_IconContainer,
//                 isActive && styles.ConfigSelection_ActiveIconContainer,
//               ]}>
//               <Icon
//                 name="server"
//                 size={iconSize.sm}
//                 color={isActive ? '#fff' : '#0A66C2'}
//               />
//             </View>
//             <View style={{flex: 1}}>
//               <Text
//                 style={[
//                   styles.ConfigSelection_ConfigTitle,
//                   isActive && {color: '#0A66C2'},
//                 ]}>
//                 {item.displayTitle}
//               </Text>
//               <Text
//                 style={[
//                   styles.ConfigSelection_ConfigSubtitle,
//                   isActive && {color: '#0A66C2', opacity: 0.8},
//                 ]}>
//                 {t('configSelection.addedOn')}{' '}
//                 {new Date(item.createdAt).toLocaleDateString('en-US', {
//                   month: 'short',
//                   day: 'numeric',
//                   year: 'numeric',
//                 })}
//               </Text>
//             </View>
//           </View>

//           <View style={styles.ConfigSelection_CardActions}>
//             <TouchableOpacity
//               style={styles.ConfigSelection_ActionButton}
//               onPress={() => handleEditTitle(item)}>
//               <Icon
//                 name="edit"
//                 size={iconSize.xs}
//                 color={isActive ? '#0A66C2' : '#666'}
//               />
//             </TouchableOpacity>
//             <TouchableOpacity
//               style={styles.ConfigSelection_ActionButton}
//               onPress={() =>
//                 handleDeleteConfiguration(item.id, item.displayTitle)
//               }>
//               <Icon name="trash" size={iconSize.xs} color="#dc3545" />
//             </TouchableOpacity>
//           </View>
//         </View>
//       </TouchableOpacity>
//     );
//   };

//   const renderEmptyState = () => (
//     <View style={styles.ConfigSelection_EmptyState}>
//       <View style={styles.ConfigSelection_EmptyIconContainer}>
//         <Icon name="qrcode" size={scale(70)} color="#0A66C2" />
//       </View>
//       <Text style={styles.ConfigSelection_EmptyStateTitle}>
//         {t('configSelection.noConfigs')}
//       </Text>
//       <Text style={styles.ConfigSelection_EmptyStateSubtitle}>
//         {t('configSelection.getStarted')}
//       </Text>
//       <TouchableOpacity
//         style={styles.ConfigSelection_PrimaryButton}
//         onPress={handleAddConfiguration}
//         activeOpacity={0.8}>
//         <Icon
//           name="plus-circle"
//           size={iconSize.sm}
//           color="#fff"
//           style={styles.ConfigSelection_ButtonIcon}
//         />
//         <Text style={styles.ConfigSelection_PrimaryButtonText}>
//           {t('configSelection.addConfig')}
//         </Text>
//       </TouchableOpacity>
//     </View>
//   );

//   return (
//     <View style={styles.ConfigSelection_Container}>
//       {/* Header */}
//       <View style={styles.ConfigSelection_Header}>
//         <TouchableOpacity
//           style={styles.ConfigSelection_HeaderButton}
//           onPress={() => navigation.goBack()}>
//           <Icon
//             name={I18nManager.isRTL ? 'arrow-right' : 'arrow-left'}
//             size={iconSize.sm}
//             color="#0A66C2"
//           />
//         </TouchableOpacity>

//         <View style={styles.ConfigSelection_HeaderCenter}>
//           <Text style={styles.ConfigSelection_HeaderTitle}>
//             {t('configSelection.configurations')}
//           </Text>
//           <Text style={styles.ConfigSelection_HeaderSubtitle}>
//             {configs.length}{' '}
//             {configs.length === 1
//               ? t('configSelection.configSingular')
//               : t('configSelection.configPlural')}
//           </Text>
//         </View>

//         <TouchableOpacity
//           style={styles.ConfigSelection_HeaderButton}
//           onPress={handleAddConfiguration}>
//           <Icon name="plus" size={iconSize.sm} color="#0A66C2" />
//         </TouchableOpacity>
//       </View>

//       {/* Content */}
//       <View style={{flex: 1}}>
//         {configs.length > 0 ? (
//           <FlatList
//             data={configs}
//             keyExtractor={item => item.id}
//             renderItem={renderConfigItem}
//             contentContainerStyle={styles.ConfigSelection_ListContainer}
//             refreshControl={
//               <RefreshControl
//                 refreshing={refreshing}
//                 onRefresh={onRefresh}
//                 colors={['#0A66C2']}
//                 tintColor="#0A66C2"
//               />
//             }
//             showsVerticalScrollIndicator={false}
//           />
//         ) : (
//           !loading && renderEmptyState()
//         )}

//         {loading && (
//           <View
//             style={{
//               flex: 1,
//               justifyContent: 'center',
//               alignItems: 'center',
//             }}>
//             <Icon name="spinner" size={scale(40)} color="#0A66C2" />
//             <Text
//               style={{
//                 marginTop: scale(16),
//                 fontSize: iconSize.xs,
//                 color: '#666',
//                 fontWeight: '500',
//               }}>
//               {t('configSelection.loading')}
//             </Text>
//           </View>
//         )}
//       </View>

//       {/* Edit Modal */}
//       <Modal
//         visible={editModalVisible}
//         transparent={true}
//         animationType="fade"
//         onRequestClose={() => setEditModalVisible(false)}>
//         <View style={styles.ConfigSelection_ModalOverlay}>
//           <View style={styles.ConfigSelection_ModalContent}>
//             <View style={styles.ConfigSelection_ModalHeader}>
//               <Text style={styles.ConfigSelection_ModalTitle}>
//                 {t('configSelection.editTitle')}
//               </Text>
//               <TouchableOpacity
//                 onPress={() => setEditModalVisible(false)}
//                 style={styles.ConfigSelection_ModalCloseButton}>
//                 <Icon name="times" size={iconSize.sm} color="#666" />
//               </TouchableOpacity>
//             </View>

//             <View style={styles.ConfigSelection_ModalBody}>
//               <Text style={styles.ConfigSelection_InputLabel}>
//                 {t('configSelection.title')}
//               </Text>
//               <TextInput
//                 style={styles.ConfigSelection_Input}
//                 value={editedTitle}
//                 onChangeText={setEditedTitle}
//                 placeholder={t('configSelection.titlePlaceholder')}
//                 placeholderTextColor="#999"
//               />
//             </View>

//             <View style={styles.ConfigSelection_ModalFooter}>
//               <TouchableOpacity
//                 style={styles.ConfigSelection_SecondaryButton}
//                 onPress={() => setEditModalVisible(false)}>
//                 <Text style={styles.ConfigSelection_SecondaryButtonText}>
//                   {t('common.cancel')}
//                 </Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={styles.ConfigSelection_PrimaryButtonModal}
//                 onPress={saveEditedTitle}>
//                 <Icon
//                   name="check"
//                   size={iconSize.xs}
//                   color="#fff"
//                   style={styles.ConfigSelection_ButtonIcon}
//                 />
//                 <Text style={styles.ConfigSelection_PrimaryButtonText}>
//                   {t('common.save')}
//                 </Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>

//       <AlertModal
//         visible={alertModal}
//         heading={t('configSelection.configurations')}
//         text={alertMessage}
//         onPress={() => setAlertModal(false)}
//       />

//       <AlertDeleteModal
//         visible={deleteModal}
//         heading={t('configSelection.confirmDelete')}
//         text={t('configSelection.deleteMessage', {configName: selectedRecName})}
//         onPress={() => {
//           deleteConfiguration(selectedRecId);
//           setDeleteModal(false);
//         }}
//         onCancel={() => setDeleteModal(false)}
//       />
//     </View>
//   );
// };

// export default ConfigSelectionScreen;
/* eslint-disable react-native/no-inline-styles */
import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  TextInput,
  Modal,
  I18nManager,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import {translate as t} from '../../store/utils/translate';

import {
  saveConfig,
  clearConfig,
  getAllConfigs,
  setActiveConfig,
  getActiveConfig,
  clearConfigById,
  updateConfigById,
} from '../../Controller/secureConfig';

import AlertModal from '../../components/Alert/AlertModal';
import AlertDeleteModal from '../../components/Alert/AlertDeleteModal';

// ─── HELPER OUTSIDE COMPONENT ──────────────────────────────────────
// Moving this outside ensures it has a stable reference and doesn't
// trigger hook dependency warnings.
const extractTitle = configOrUrl => {
  try {
    const resource =
      typeof configOrUrl === 'string'
        ? configOrUrl
        : configOrUrl?.resource || '';
    if (!resource) return 'Unknown Environment';
    let withoutProtocol = resource.replace(/(^\w+:|^)\/\//, '');
    const hostname = withoutProtocol.split('/')[0];
    const firstPart = hostname.split('.')[0];
    const hyphenParts = firstPart.split('-');
    if (hyphenParts.length >= 2) return `${hyphenParts[0]}-${hyphenParts[1]}`;
    return firstPart || 'Unknown Environment';
  } catch (err) {
    return 'Unknown Environment';
  }
};

const ConfigSelectionScreen = () => {
  const navigation = useNavigation();

  // State
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

  // ─── STABILIZED DATA LOADING ─────────────────────────────────────
  const loadConfigurations = useCallback(async () => {
    try {
      setLoading(true);
      const allConfigs = await getAllConfigs();
      const activeId = await getActiveConfig();

      const enhancedConfigs = allConfigs.map(config => ({
        ...config,
        displayTitle:
          config.customTitle || config.name || extractTitle(config.data),
      }));

      setConfigs(enhancedConfigs);
      setActiveConfigId(activeId);
    } catch (error) {
      setAlertMessage(t('configSelection.loadFailed'));
      setAlertModal(true);
    } finally {
      setLoading(false);
    }
  }, []); // 't' and 'extractTitle' are stable outer-scope references

  useFocusEffect(
    useCallback(() => {
      loadConfigurations();
    }, [loadConfigurations]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConfigurations();
    setRefreshing(false);
  };

  // ─── SELECTION & ACTION LOGIC ────────────────────────────────────
  const handleSelectConfiguration = async configId => {
    try {
      const selectedConfig = configs.find(config => config.id === configId);
      if (selectedConfig) await saveConfig(selectedConfig.data);
      await setActiveConfig(configId);
      setActiveConfigId(configId);
      setAlertMessage(t('configSelection.activateSuccess'));
      setAlertModal(true);
    } catch (error) {
      setAlertMessage(t('configSelection.activateFailed'));
      setAlertModal(true);
    }
  };

  const saveEditedTitle = async () => {
    try {
      if (!editingConfig) return;
      const updatedConfig = {
        ...editingConfig,
        name: editedTitle,
        customTitle: editedTitle,
      };
      await updateConfigById(editingConfig.id, updatedConfig);
      setEditModalVisible(false);
      await loadConfigurations();
    } catch (error) {
      setAlertMessage(t('configSelection.updateFailed'));
      setAlertModal(true);
    }
  };

  const deleteConfiguration = async configId => {
    try {
      const isDeletingActive = configId === activeConfigId;
      await clearConfigById(configId);

      if (isDeletingActive) {
        await setActiveConfig(null);
        await clearConfig();
        setActiveConfigId(null);
      }

      const remaining = await getAllConfigs();
      if (isDeletingActive && remaining.length > 0) {
        const nextConfig = remaining[0];
        await saveConfig(nextConfig.data);
        await setActiveConfig(nextConfig.id);
      }

      await loadConfigurations();
      setAlertMessage(t('configSelection.deleteSuccess'));
      setAlertModal(true);
    } catch (error) {
      setAlertMessage(t('configSelection.deleteFailed'));
      setAlertModal(true);
    }
  };

  const renderConfigItem = ({item}) => {
    const isActive = item.id === activeConfigId;
    return (
      <TouchableOpacity
        style={[styles.card, isActive && styles.activeCard]}
        onPress={() => handleSelectConfiguration(item.id)}
        activeOpacity={0.9}>
        <View style={styles.cardContent}>
          <View style={[styles.iconBox, isActive && styles.activeIconBox]}>
            <Icon
              name="server"
              size={20}
              color={isActive ? '#FFFFFF' : '#64748B'}
            />
          </View>

          <View style={styles.infoBox}>
            <Text
              style={[styles.titleText, isActive && styles.activeTitleText]}
              numberOfLines={1}>
              {item.displayTitle}
            </Text>
            <Text style={styles.dateText}>
              Added {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.actionContainer}>
            <TouchableOpacity
              onPress={() => {
                setEditingConfig(item);
                setEditedTitle(item.displayTitle);
                setEditModalVisible(true);
              }}
              style={styles.miniBtn}>
              <Icon
                name="edit-3"
                size={18}
                color={isActive ? '#0A66C2' : '#94A3B8'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setSelectedRecId(item.id);
                setSelectedRecName(item.displayTitle);
                setDeleteModal(true);
              }}
              style={styles.miniBtn}>
              <Icon name="trash-2" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        {isActive && (
          <View style={styles.statusBadge}>
            <Icon name="check" size={10} color="#FFF" />
            <Text style={styles.statusText}>ACTIVE</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerCircleBtn}>
          <Icon
            name={I18nManager.isRTL ? 'arrow-right' : 'arrow-left'}
            size={22}
            color="#1E293B"
          />
        </TouchableOpacity>

        <View style={styles.headerTitleCenter}>
          <Text style={styles.mainTitle}>
            {t('configSelection.configurations')}
          </Text>
          <Text style={styles.subTitle}>{configs.length} Environments</Text>
        </View>

        <TouchableOpacity
          onPress={() =>
            navigation.navigate('QRSetupScreen', {isFromConfigSelection: true})
          }
          style={styles.headerCircleBtn}>
          <Icon name="plus" size={22} color="#0A66C2" />
        </TouchableOpacity>
      </View>

      <View style={{flex: 1, paddingHorizontal: 20}}>
        {configs.length > 0 ? (
          <FlatList
            data={configs}
            keyExtractor={item => item.id}
            renderItem={renderConfigItem}
            contentContainerStyle={{paddingTop: 15, paddingBottom: 100}}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        ) : (
          !loading && (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Icon name="cloud-off" size={40} color="#CBD5E1" />
              </View>
              <Text style={styles.emptyTitle}>No Environments</Text>
              <Text style={styles.emptyDesc}>
                Scan a QR code to link your first environment.
              </Text>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() =>
                  navigation.navigate('QRSetupScreen', {
                    isFromConfigSelection: true,
                  })
                }>
                <Text style={styles.primaryBtnText}>Add Configuration</Text>
              </TouchableOpacity>
            </View>
          )
        )}
      </View>

      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalHeading}>Rename Environment</Text>
            <TextInput
              style={styles.input}
              value={editedTitle}
              onChangeText={setEditedTitle}
              placeholder="Enter name"
              autoFocus
            />
            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => setEditModalVisible(false)}>
                <Text style={styles.secondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={saveEditedTitle}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <AlertModal
        visible={alertModal}
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />
      <AlertDeleteModal
        visible={deleteModal}
        text={`Are you sure you want to remove "${selectedRecName}"?`}
        onPress={() => {
          deleteConfiguration(selectedRecId);
          setDeleteModal(false);
        }}
        onCancel={() => setDeleteModal(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F8FAFC'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleCenter: {alignItems: 'center'},
  mainTitle: {fontSize: 17, fontWeight: '800', color: '#1E293B'},
  subTitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
  },

  card: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeCard: {
    borderColor: '#0A66C2',
    backgroundColor: '#F0F9FF',
    borderWidth: 2,
  },
  cardContent: {flexDirection: 'row', alignItems: 'center'},
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconBox: {backgroundColor: '#0A66C2'},
  infoBox: {flex: 1, marginLeft: 12},
  titleText: {fontSize: 15, fontWeight: '700', color: '#334155'},
  activeTitleText: {color: '#0A66C2'},
  dateText: {fontSize: 12, color: '#94A3B8', marginTop: 2},

  actionContainer: {flexDirection: 'row'},
  miniBtn: {padding: 6, marginLeft: 2},

  statusBadge: {
    position: 'absolute',
    top: -8,
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A66C2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {color: '#FFF', fontSize: 9, fontWeight: '900', marginLeft: 3},

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  emptyIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  emptyTitle: {fontSize: 18, fontWeight: '800', color: '#1E293B'},
  emptyDesc: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 5,
    paddingHorizontal: 50,
  },

  primaryBtn: {
    backgroundColor: '#0A66C2',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  primaryBtnText: {color: '#FFF', fontWeight: '700', fontSize: 15},

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 35,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeading: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1E293B',
  },
  modalActionRow: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'space-between',
  },
  secondaryBtn: {flex: 1, alignItems: 'center', padding: 15},
  secondaryBtnText: {color: '#94A3B8', fontWeight: '700'},
  saveBtn: {
    flex: 2,
    backgroundColor: '#0A66C2',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {color: '#FFF', fontWeight: '700', fontSize: 15},
});

export default ConfigSelectionScreen;
