import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Animated,
} from 'react-native';
import {useSelector} from 'react-redux';

import ActionPaneContainer from '../../components/ActionPaneContainer';
import DynamicRequestCard, {
  BUTTON_TYPES,
} from '../../components/DynamicRequestCard';
import DynamicAttachmentModal from '../../shared/DynamicAttachmentModal';
import usePalette from '../../hooks/usePalette';

import {RetrieveAllHrPolicies} from '../../API/HRPolicies/RetrieveAllHrPolicies';
import styles from '../../styles/styles';

// ───────────────── Skeleton Loader ─────────────────
const SkeletonLoader = () => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [opacity]);

  return (
    <View style={localStyles.skeletonContainer}>
      {[1, 2, 3, 4].map(i => (
        <Animated.View key={i} style={[localStyles.skeletonCard, {opacity}]} />
      ))}
    </View>
  );
};

// ───────────────── Screen ─────────────────
const HrPoliciesScreen = ({navigation}) => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [attachmentModalVisible, setAttachmentModalVisible] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);

  const {userData} = useSelector(state => state.user);
  const {selectedLegalEntity} = useSelector(state => state.company);
  const P = usePalette();

  // ───────────── Fetch Policies ─────────────
  const fetchPolicies = useCallback(async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }

      const data = await RetrieveAllHrPolicies();
      const validData = Array.isArray(data) ? data : [];

      setPolicies(validData);
    } catch (error) {
      console.log('Policy fetch error', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPolicies();
  };

  // ───────────── Card Configuration ─────────────
  const cardConfig = {
    headerConfig: {
      title: {key: 'Title'},
    },
    fields: [
      {
        key: 'Description',
        label: 'Description',
        type: 'text',
      },
    ],
    expandableFields: [],
  };

  // ───────────── Button Config ─────────────
  const getButtonConfig = () => {
    return {
      attachment: {
        show: true,
        position: 'header',
        style: 'icon',
        icon: 'paperclip',
        iconSize: 20,
        iconColor: P.onPrimary,
        backgroundColor: P.primary,
        disabled: false,
      },
    };
  };

  // ───────────── Button Handler ─────────────
  const handleButtonPress = (buttonType, itemData) => {
    if (buttonType === BUTTON_TYPES.ATTACHMENT) {
      if (!itemData?.RecId) {
        console.log('Attachment failed: RecId missing');
        return;
      }

      setSelectedPolicy(itemData);
      setAttachmentModalVisible(true);
    }
  };

  // ───────────── Render Card ─────────────
  const renderPolicyCard = ({item}) => {
    if (!item?.RecId) {
      return null;
    }

    return (
      <DynamicRequestCard
        data={item}
        headerConfig={cardConfig.headerConfig}
        fields={cardConfig.fields}
        expandableFields={cardConfig.expandableFields}
        buttons={getButtonConfig(item)}
        isExpandable={false}
        gradientColors={['#e0f2fe', '#bae6fd', '#dbeafe']}
        onButtonPress={handleButtonPress}
      />
    );
  };

  // ───────────── Empty State ─────────────
  const renderEmpty = () => (
    <View style={localStyles.emptyContainer}>
      <Text style={localStyles.emptyText}>No Policies Available</Text>
    </View>
  );

  // ───────────── UI ─────────────
  return (
    <ActionPaneContainer
      pageTitle="HR Policies"
      isBackButton={true}
      isHeaderActive={true}
      showPageTitleRow={true}
      onBackPress={() => navigation.goBack()}>
      <View style={styles.container}>
        {loading && !refreshing ? (
          <SkeletonLoader />
        ) : (
          <FlatList
            data={policies}
            renderItem={renderPolicyCard}
            keyExtractor={(item, index) =>
              item.RecId?.toString() || index.toString()
            }
            contentContainerStyle={styles.DLP_ListContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={renderEmpty}
          />
        )}
      </View>

      {/* Attachment Modal */}
      <DynamicAttachmentModal
        visible={attachmentModalVisible}
        recordData={selectedPolicy}
        recordIdKey="RecId"
        tableName="HRPolicies"
        onClose={() => {
          setAttachmentModalVisible(false);
          setSelectedPolicy(null);
        }}
        onSave={fetchPolicies}
        legalEntity={selectedLegalEntity}
        employeeId={userData?.employeeId}
        employeeName={userData?.employeeName}
        modalTitle="HR Policies Attachments"
        showDetails={true}
        detailFields={[
          {key: 'Title', label: 'Policy'},
          {key: 'Description', label: 'Description'},
        ]}
        detailData={selectedPolicy || {}}
        showTakePhoto={false}
        showChooseFile={false}
        showDownload={true}
        showDelete={true}
      />
    </ActionPaneContainer>
  );
};

// ───────────────── Styles ─────────────────
const localStyles = StyleSheet.create({
  skeletonContainer: {
    padding: 16,
  },

  skeletonCard: {
    height: 110,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#ECEFF1',
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: 60,
  },

  emptyText: {
    fontSize: 16,
    color: '#90A4AE',
  },
});

export default HrPoliciesScreen;
