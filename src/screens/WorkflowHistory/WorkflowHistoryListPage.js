/* eslint-disable curly */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  BackHandler,
  RefreshControl,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';

// Components
import ActionPaneContainer from '../../components/ActionPaneContainer';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import AlertModal from '../../components/Alert/AlertModal';

// API
import {retrieveWorkflowHistory} from '../../API/WorkflowHistory/retrieveWorkflowHistory';

import styles from '../../styles/styles';

const WorkflowHistoryScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const {recId, tableId, cameFrom} = route.params ?? {};
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [workflowData, setWorkflowData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchWorkflowHistory = useCallback(async () => {
    console.log('[WorkflowHistory] fetchWorkflowHistory called with:', {
      recId,
      tableId,
    });
    if (!recId) {
      setAlertMessage('Missing required parameter: recId');
      setAlertModal(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await retrieveWorkflowHistory({
        _recId: recId,
        _tableId: tableId,
      });

      setTotalRecords(data.length);

      const transformedData = data.map(item => {
        let trackingType = 'Unknown';

        switch (item.TrackingType) {
          default:
            trackingType = item.TrackingType;
        }

        return {
          RecId: item.TrackingId,
          TrackingType: trackingType,
          CreatedDateTime: item.Created,
          User: item.User,
          Comment: item.Comment || '',
          StepId: item.StepId,
          ElementId: item.ElementId,
          TrackingContext: item.TrackingContext,
          Name: item.Name,
          LocalizedTrackingMessage: item.LocalizedTrackingMessage,
          originalData: item,
        };
      });

      transformedData.sort(
        (a, b) => new Date(a.CreatedDateTime) - new Date(b.CreatedDateTime),
      );

      setWorkflowData(transformedData);
    } catch (error) {
      setAlertMessage('Failed to load workflow history');
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  }, [recId, tableId]); // ← ADD tableId here

  useFocusEffect(
    useCallback(() => {
      fetchWorkflowHistory();
    }, [fetchWorkflowHistory]),
  );

  useFocusEffect(
    useCallback(() => {
      const unsub = navigation.addListener('beforeRemove', e => {
        console.log('[WFH] beforeRemove fired, cameFrom:', cameFrom);
        if (!cameFrom) return;
        e.preventDefault();
        navigation.removeListener('beforeRemove', () => {}); // stop re-entry
        navigation.reset({
          index: 0,
          routes: [
            {name: 'DrawerNavigator', state: {routes: [{name: cameFrom}]}},
          ],
        });
      });
      return unsub;
    }, [navigation, cameFrom]),
  );

  const handleRefresh = () => fetchWorkflowHistory();

  // const handleGoBack = () => {
  //   console.log(
  //     '[WorkflowHistory] handleGoBack called | cameFrom:',
  //     cameFrom,
  //     '| canGoBack:',
  //     navigation.canGoBack(),
  //   );

  //   if (cameFrom) {
  //     navigation.navigate(cameFrom); // ← always prefer explicit target
  //   } else if (navigation.canGoBack()) {
  //     navigation.goBack();
  //   } else {
  //     console.warn('[WorkflowHistory] No cameFrom and cannot goBack — stuck!');
  //   }
  // };

  // const handleGoBack = () => {
  //   if (navigation.canGoBack()) {
  //     navigation.goBack(); // pops the actual entry beneath this screen
  //   } else if (cameFrom) {
  //     navigation.navigate(cameFrom); // fallback for deep-link / no back stack case
  //   } else {
  //     console.warn('[WorkflowHistory] No cameFrom and cannot goBack — stuck!');
  //   }
  // };

  const handleGoBack = () => {
    console.log('[WFH] cameFrom:', cameFrom);
    console.log(
      '[WFH] parent state:',
      JSON.stringify(
        navigation.getParent()?.getState()?.routeNames ?? 'no parent',
      ),
    );
    console.log(
      '[WFH] own state:',
      JSON.stringify(navigation.getState()?.routeNames),
    );

    if (cameFrom) {
      navigation.navigate(cameFrom);
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  // ── Manual dd/mm/yyyy + hh:mm AM/PM formatter (no locale dependency) ──
  // ── Parses API string directly (no Date object, no timezone shift) ──
  // Handles formats like "2026-08-20T14:45:00", "2026-08-20 14:45:00", etc.
  const formatDateTime = dateTimeStr => {
    if (!dateTimeStr) return 'N/A';

    try {
      const match = dateTimeStr.match(
        /(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/,
      );

      if (!match) return dateTimeStr; // fallback: show raw value if format is unexpected

      const [, year, month, day, hourStr, minute] = match;

      let hours = parseInt(hourStr, 10);
      const ampm = hours >= 12 ? 'PM' : 'AM';

      hours = hours % 12;
      if (hours === 0) hours = 12; // 0 -> 12
      const hoursDisplay = String(hours).padStart(2, '0');

      return `${day}/${month}/${year}  ${hoursDisplay}:${minute} ${ampm}`;
    } catch {
      return dateTimeStr;
    }
  };

  // ── Splits PascalCase/camelCase into spaced words ──
  const formatLabel = str => {
    if (!str) return '';
    return str
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2') // camel -> camel Case
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2') // ABCDef -> ABC Def
      .trim();
  };

  /**
   * Returns status config with color, icon, and category.
   * The badge label now reflects a SHORT category only (e.g. "Approved"),
   * while the card title shows the full tracking type — no duplication.
   */
  const getStatusConfig = trackingType => {
    const type = trackingType?.toLowerCase() || '';

    if (type.includes('created'))
      return {
        color: '#2563EB',
        bgColor: '#EFF6FF',
        dotColor: '#BFDBFE',
        icon: '⬡',
        category: 'Created',
      };
    if (type.includes('started'))
      return {
        color: '#7C3AED',
        bgColor: '#F5F3FF',
        dotColor: '#DDD6FE',
        icon: '▷',
        category: 'Started',
      };
    if (type.includes('submitted'))
      return {
        color: '#0891B2',
        bgColor: '#ECFEFF',
        dotColor: '#A5F3FC',
        icon: '↗',
        category: 'Submitted',
      };
    if (type.includes('assigned'))
      return {
        color: '#D97706',
        bgColor: '#FFFBEB',
        dotColor: '#FDE68A',
        icon: '⊕',
        category: 'Assigned',
      };
    if (type.includes('pending'))
      return {
        color: '#B45309',
        bgColor: '#FEF3C7',
        dotColor: '#FDE68A',
        icon: '◔',
        category: 'Pending',
      };
    if (type.includes('approved'))
      return {
        color: '#059669',
        bgColor: '#ECFDF5',
        dotColor: '#A7F3D0',
        icon: '✓',
        category: 'Approved',
      };
    if (type.includes('completed'))
      return {
        color: '#047857',
        bgColor: '#F0FDF4',
        dotColor: '#BBF7D0',
        icon: '✓',
        category: 'Completed',
      };
    if (type.includes('rejected'))
      return {
        color: '#DC2626',
        bgColor: '#FEF2F2',
        dotColor: '#FECACA',
        icon: '✕',
        category: 'Rejected',
      };
    if (type.includes('cancelled'))
      return {
        color: '#6B7280',
        bgColor: '#F9FAFB',
        dotColor: '#E5E7EB',
        icon: '⊘',
        category: 'Cancelled',
      };

    return {
      color: '#6B7280',
      bgColor: '#F9FAFB',
      dotColor: '#E5E7EB',
      icon: '●',
      category: 'Unknown',
    };
  };

  const renderTimelineItem = ({item, index}) => {
    const isLast = index === workflowData.length - 1;
    const statusConfig = getStatusConfig(item.TrackingType);
    const hasMessage =
      item.LocalizedTrackingMessage &&
      item.LocalizedTrackingMessage.trim() !== '' &&
      item.LocalizedTrackingMessage !== item.TrackingType;
    const hasComment = item.Comment && item.Comment.trim() !== '';

    return (
      <View style={tl.row}>
        {/* ── Left: connector column ── */}
        <View style={tl.connectorCol}>
          <View
            style={[
              tl.dot,
              {
                borderColor: statusConfig.color,
                backgroundColor: statusConfig.bgColor,
              },
            ]}>
            <Text style={[tl.dotIcon, {color: statusConfig.color}]}>
              {statusConfig.icon}
            </Text>
          </View>
          {!isLast && (
            <View style={[tl.line, {backgroundColor: statusConfig.dotColor}]} />
          )}
        </View>

        {/* ── Right: card ── */}
        <View style={tl.cardWrap}>
          <View style={[tl.card, {borderLeftColor: statusConfig.color}]}>
            {/* Top row: title + badge */}
            <View style={tl.cardTop}>
              <Text style={tl.title} numberOfLines={2}>
                {formatLabel(item.TrackingType)}
              </Text>
              {statusConfig.category !== 'Unknown' && (
                <View
                  style={[tl.badge, {backgroundColor: statusConfig.bgColor}]}>
                  <View
                    style={[tl.badgeDot, {backgroundColor: statusConfig.color}]}
                  />
                  <Text style={[tl.badgeText, {color: statusConfig.color}]}>
                    Action
                  </Text>
                </View>
              )}
            </View>

            {/* TrackingContext */}
            {item.TrackingContext ? (
              <View style={tl.contextRow}>
                <Text style={tl.contextText}>{item.TrackingContext}</Text>
              </View>
            ) : null}

            {/* Timestamp */}
            <Text style={tl.timestamp}>
              {formatDateTime(item.CreatedDateTime)}
            </Text>

            {/* User (if available) */}
            {item.User ? (
              <View style={tl.metaRow}>
                <Text style={tl.metaIcon}>👤</Text>
                <Text style={tl.metaText}>{item.User}</Text>
              </View>
            ) : null}

            {/* Localized message */}
            {hasMessage && (
              <View style={tl.infoBox}>
                <Text style={tl.infoText}>{item.LocalizedTrackingMessage}</Text>
              </View>
            )}

            {/* Comment */}
            {hasComment && (
              <View style={tl.commentBox}>
                <Text style={tl.commentLabel}>Comment</Text>
                <Text style={tl.commentText}>{item.Comment}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  /* ─── Render ─── */
  return (
    <ActionPaneContainer
      pageTitle="Workflow History"
      isBackButton
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive
      showTabNavigator
      onBackPress={handleGoBack}
      onRefresh={handleRefresh}>
      {isLoading ? (
        <View style={styles.DLP_LoadingContainer}>
          <CustomIndicator />
        </View>
      ) : workflowData.length > 0 ? (
        <FlatList
          data={workflowData}
          renderItem={renderTimelineItem}
          keyExtractor={(item, index) =>
            item.RecId?.toString() || index.toString()
          }
          ListHeaderComponent={
            <View style={tl.header}>
              <Text style={tl.headerTitle}>Workflow Tracking</Text>
              <View style={tl.headerPill}>
                <Text style={tl.headerPillText}>
                  {totalRecords} {totalRecords === 1 ? 'event' : 'events'}
                </Text>
              </View>
            </View>
          }
          contentContainerStyle={tl.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
          }
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.DLP_NoDataContainer}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
          }>
          <Text style={styles.DLP_NoDataText}>No Data Found</Text>
          <Text style={styles.DLP_NoDataSubText}>
            No workflow history available
          </Text>
        </ScrollView>
      )}

      <AlertModal
        visible={alertModal}
        heading="Alert"
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />
    </ActionPaneContainer>
  );
};

/* ─────────────────────────────────────────
   Styles
───────────────────────────────────────── */
const tl = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    backgroundColor: '#F8FAFC',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  headerPill: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  headerPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },

  row: {
    flexDirection: 'row',
    marginBottom: 2,
  },

  connectorCol: {
    width: 44,
    alignItems: 'center',
  },
  dot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  dotIcon: {
    fontSize: 15,
    fontWeight: '700',
  },
  line: {
    flex: 1,
    width: 2,
    marginTop: 2,
    marginBottom: -2,
    borderRadius: 1,
    minHeight: 16,
  },

  cardWrap: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    shadowColor: '#64748B',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
    lineHeight: 21,
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
    flexShrink: 0,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  contextText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },

  timestamp: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 6,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  metaIcon: {
    fontSize: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },

  infoBox: {
    marginTop: 6,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#38BDF8',
  },
  infoText: {
    fontSize: 12,
    color: '#0369A1',
    lineHeight: 17,
  },

  commentBox: {
    marginTop: 6,
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#FCD34D',
  },
  commentLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  commentText: {
    fontSize: 12,
    color: '#78350F',
    fontStyle: 'italic',
    lineHeight: 17,
  },
});

export default WorkflowHistoryScreen;
