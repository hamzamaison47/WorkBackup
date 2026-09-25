import React, {useState, useRef, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import {useNavigation} from '@react-navigation/native';
import MenuCard from './MenuCard';
// import {chunkArray} from '../../store/utils/helpers';
import {AppTokens} from '../AppComponentsDesign/Appcomponents';
import useAppTokens from '../AppComponentsDesign/useAppTokens';
import {
  conditionalScale,
  conditionalVerticalScale,
  conditionalFontScale,
} from '../../store/utils/scaling';
import {RetrieveByEmail} from '../../API/WorkflowTrackingStatusTable/retrieveByEmail';
import WorkflowItemAction from '../../API/WorkflowTrackingStatusTable/WorkflowItemAction';
import {RetrieveEntitlementBalanceRequest} from '../../API/EntitlementBalance/RetrieveEntitlementBalanceRequest';
import styles from '../../styles/styles';
import LinearGradient from 'react-native-linear-gradient';
import brand from '../../theme/brand';
import useExtraWorkflowFields from '../../hooks/useExtraWorkflowFields';
import {TABLE_EXTRA_FIELDS} from '../../Controller/workflowExtraFields';

// ✅ Brand-only tokens — never change between themes
const BRAND = {
  blue: brand.primaryStrong, // used as accent TEXT on blueSoft
  blueSoft: brand.tint,
  green: '#0A8F5C',
  greenSoft: '#E8F7F1',
  amber: '#B45309',
  amberSoft: '#FEF3C7',
  red: '#C0392B',
  redSoft: '#FEF0EE',
  purple: '#6D28D9',
  purpleSoft: '#EDE9FE',
  teal: '#0E7490',
  tealSoft: AppTokens.tealBg,
  muted: '#9AA3AF',
};

const DOCUMENT_TYPE_OVERRIDES = {
  HRMCourseAttendee: 'Training Calendar',
  SLD_HRTrainingRequests: 'Employee Course Request',
};

const formatRelativeTime = raw => {
  if (!raw) {
    return '';
  }
  try {
    const diff = Date.now() - new Date(raw).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) {
      return 'just now';
    }
    if (mins < 60) {
      return `${mins}m ago`;
    }
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) {
      return `${hrs}h ago`;
    }
    const days = Math.floor(hrs / 24);
    if (days < 7) {
      return `${days}d ago`;
    }
    return new Date(raw).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
};

const getTypeAccent = type => {
  const t = (type || '').toLowerCase();
  if (t.includes('leave')) {
    return {color: BRAND.blue, bg: BRAND.blueSoft};
  }
  if (t.includes('purchase') || t.includes('requisition')) {
    return {color: BRAND.amber, bg: BRAND.amberSoft};
  }
  if (t.includes('expense')) {
    return {color: BRAND.green, bg: BRAND.greenSoft};
  }
  if (t.includes('travel')) {
    return {color: BRAND.teal, bg: BRAND.tealSoft};
  }
  return {color: BRAND.blue, bg: BRAND.blueSoft};
};

// ─────────────────────────────────────────────────────────────────────────────
// SectionHeader
// ─────────────────────────────────────────────────────────────────────────────
const SectionHeader = ({title, count, actionLabel, onAction, rightLabel}) => {
  const T = useAppTokens();
  return (
    <View style={styles.MG_sectionHeader}>
      <View style={styles.MG_sectionLeft}>
        <Text style={[styles.MG_sectionTitle, {color: T.titleText}]}>
          {title}
        </Text>
        {count != null && count > 0 && (
          <View style={[styles.MG_badge, {backgroundColor: '#F4B400'}]}>
            <Text style={styles.MG_badgeText}>{count}</Text>
          </View>
        )}
      </View>
      {onAction && (
        <TouchableOpacity
          onPress={onAction}
          style={styles.MG_sectionAction}
          activeOpacity={0.6}>
          <Text style={[styles.MG_sectionActionText, {color: BRAND.blue}]}>
            {actionLabel || 'View all'}
          </Text>
          <FeatherIcon
            name="arrow-right"
            size={conditionalFontScale(11, 11, 12, 12)}
            color={BRAND.blue}
          />
        </TouchableOpacity>
      )}
      {rightLabel && !onAction && (
        <Text style={[styles.MG_pageLabelText, {color: T.subtitleText}]}>
          {rightLabel}
        </Text>
      )}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ApprovalCard
// ─────────────────────────────────────────────────────────────────────────────
const ApprovalCard = ({item, onApprove, onReject, onPress, processingKey}) => {
  const T = useAppTokens();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(8)).current;
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const accent = getTypeAccent(item.documentType);
  const isProcessing = processingKey === item.recId;
  const daysOld = getDaysOld(item.createdDateTime);
  const overdue = daysOld >= OVERDUE_THRESHOLD_DAYS;

  // Same extra-field extraction the full work-items card uses, so the
  // dashboard preview shows the same per-type fields (Employee/Amount,
  // Leave Name, etc.). One extra fetch per card via the hook.
  const fieldConfigs = TABLE_EXTRA_FIELDS[item.TableName] || [];
  const sourceLabels = fieldConfigs.map(fc => fc.sourceLabel);
  const {fields: extractedFields} =
    useExtraWorkflowFields(item, sourceLabels) || {};

  const topFields = fieldConfigs
    .map(({sourceLabel, cardLabel}) => ({
      label: cardLabel,
      value: extractedFields?.[sourceLabel],
    }))
    .filter(fld => fld.value != null && fld.value !== '')
    .slice(0, 2);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Blinking loop for the overdue dot only — starts/stops based on `overdue`
  // so non-overdue cards never run the animation loop at all.
  useEffect(() => {
    let loop;
    if (overdue) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, {
            toValue: 0.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(blinkAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
    } else {
      blinkAnim.setValue(1);
    }
    return () => loop?.stop();
  }, [overdue, blinkAnim]);

  return (
    <Animated.View
      style={[
        styles.MG_aCard,
        {
          backgroundColor: T.cardBg,
          borderColor: T.cardDivider,
          opacity: fadeAnim,
          transform: [{translateY: slideAnim}],
        },
      ]}>
      <View style={[styles.MG_aCardStrip, {backgroundColor: accent.color}]} />

      {/* Blinking red dot — the only overdue indicator on the card itself */}
      {overdue && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: BRAND.red,
            opacity: blinkAnim,
            zIndex: 1,
          }}
        />
      )}

      <TouchableOpacity
        onPress={() => onPress(item)}
        activeOpacity={0.7}
        style={styles.MG_aCardInner}>
        <View style={styles.MG_aCardTop}>
          <View style={[styles.MG_aTypePill, {backgroundColor: accent.bg}]}>
            <Text
              style={[styles.MG_aTypePillText, {color: accent.color}]}
              numberOfLines={1}>
              {item.documentType || 'Request'}
            </Text>
          </View>

          {overdue ? (
            <Text
              style={{
                fontSize: 10.5,
                fontWeight: '700',
                color: BRAND.red,
              }}>
              {daysOld}d overdue
            </Text>
          ) : (
            <Text style={[styles.MG_aTimeText, {color: T.subtitleText}]}>
              {formatRelativeTime(item.createdDateTime)}
            </Text>
          )}
        </View>

        {topFields[0] ? (
          <Text
            style={[styles.MG_aDocId, {color: T.titleText}]}
            numberOfLines={1}>
            {topFields[0].value}
          </Text>
        ) : item.TableName === 'HRMCourseAttendee' && item.Subject ? (
          <Text
            style={[styles.MG_aDocId, {color: T.titleText}]}
            numberOfLines={1}>
            {item.Subject}
          </Text>
        ) : null}

        {topFields[1] ? (
          <Text
            style={[styles.MG_aFromText, {color: T.subtitleText}]}
            numberOfLines={1}>
            {topFields[1].value}
          </Text>
        ) : item.TableName === 'SLD_HRLeaveHistory' ? (
          <Text
            style={[styles.MG_aFromText, {color: T.subtitleText}]}
            numberOfLines={1}>
            {item.documentId || item.Document || '—'}
          </Text>
        ) : item.TableName === 'HRMCourseAttendee' && item.From ? (
          <Text
            style={[styles.MG_aFromText, {color: T.subtitleText}]}
            numberOfLines={1}>
            From {item.From}
          </Text>
        ) : null}

        <View style={styles.MG_aActions}>
          {isProcessing ? (
            <View style={styles.MG_aProcessing}>
              <ActivityIndicator size="small" color={BRAND.blue} />
              <Text
                style={[styles.MG_aProcessingText, {color: T.subtitleText}]}>
                Processing…
              </Text>
            </View>
          ) : item.workflowWorkItemType === 'WorkItem' ? (
            <>
              <TouchableOpacity
                style={styles.MG_aApproveBtn}
                onPress={() => onApprove(item.recId)}
                activeOpacity={0.75}>
                <FeatherIcon
                  name="check"
                  size={conditionalFontScale(10, 10, 11, 11)}
                  color={BRAND.green}
                />
                <Text style={[styles.MG_aActionText, {color: BRAND.green}]}>
                  Approve
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.MG_aRejectBtn}
                onPress={() => onReject(item.recId)}
                activeOpacity={0.75}>
                <FeatherIcon
                  name="x"
                  size={conditionalFontScale(10, 10, 11, 11)}
                  color={BRAND.red}
                />
                <Text style={[styles.MG_aActionText, {color: BRAND.red}]}>
                  Reject
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.MG_aReturnedChip}>
              <FeatherIcon
                name="rotate-ccw"
                size={conditionalFontScale(9, 9, 10, 10)}
                color={BRAND.amber}
              />
              <Text style={[styles.MG_aActionText, {color: BRAND.amber}]}>
                Returned
              </Text>
            </View>
          )}
          <FeatherIcon
            name="chevron-right"
            size={conditionalFontScale(14, 14, 15, 15)}
            color={T.subtitleText}
            style={styles.MG_aChevron}
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const OVERDUE_THRESHOLD_DAYS = 7;

const getDaysOld = raw => {
  if (!raw) return 0;
  const created = new Date(raw).getTime();
  if (isNaN(created)) return 0;
  const diffMs = Date.now() - created;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

const isOverdue = raw => getDaysOld(raw) >= OVERDUE_THRESHOLD_DAYS;

// ─────────────────────────────────────────────────────────────────────────────
// ApprovalsSection
// ─────────────────────────────────────────────────────────────────────────────
const ApprovalsSection = ({userData, navigation, refreshKey}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingKey, setProcessingKey] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchApprovals = useCallback(async () => {
    if (!userData?.email) {
      return;
    }
    setLoading(true);
    try {
      const data = await RetrieveByEmail({email: userData.email});
      const formatted = (data || []).map((item, index) => {
        const documentStr = item.Document || '';
        const documentIdMatch = documentStr.match(/:\s*([^,]+)/);
        const documentId = documentIdMatch
          ? documentIdMatch[1].trim()
          : documentStr;
        let documentType = item.DocumentType || '';
        documentType = documentType.replace(/\b\w/g, l => l.toUpperCase());

        documentType = DOCUMENT_TYPE_OVERRIDES[item.TableName] || documentType;
        return {
          id: item.workflowWorkItemRecId ?? index,
          recId: item.workflowWorkItemRecId,
          documentId,
          documentType,
          workflowWorkItemType: item.workflowWorkItemType,
          Document: item.Document,
          createdDateTime: item.createdDateTime,
          From: item.From,
          Subject: item.Subject,
          ContextTableId: item.ContextTableId,
          ContextRecId: item.ContextRecId,
          TableName: item.TableName, // ← needed for extra-field extraction
        };
      });
      const sorted = [...formatted].sort((a, b) => {
        const aOverdue = isOverdue(a.createdDateTime);
        const bOverdue = isOverdue(b.createdDateTime);
        if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
        return new Date(a.createdDateTime) - new Date(b.createdDateTime);
      });
      setItems(sorted);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [userData?.email]);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals, refreshKey]); // ← now actually re-fetches on pull-to-refresh

  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, fadeAnim]);

  const handleApprove = async recId => {
    setProcessingKey(recId);
    try {
      await WorkflowItemAction({recId: [recId], action: 'Approve'});
      await fetchApprovals();
    } catch {
    } finally {
      setProcessingKey(null);
    }
  };

  const handleReject = async recId => {
    setProcessingKey(recId);
    try {
      await WorkflowItemAction({recId: [recId], action: 'Reject'});
      await fetchApprovals();
    } catch {
    } finally {
      setProcessingKey(null);
    }
  };

  const handleCardPress = item => {
    navigation.navigate('WorkflowDetailScreen', {
      tableId: item.ContextTableId,
      contextRecId: item.ContextRecId,
      returnTo: 'MainDashboard', // ← where back should land when opened from the dashboard
    });
  };

  if (!loading && items.length === 0) {
    return null;
  }

  return (
    <Animated.View style={[styles.MG_section, {opacity: fadeAnim}]}>
      <SectionHeader
        title="Pending Approvals"
        count={!loading ? items.length : null}
        actionLabel="View all"
        onAction={() => navigation.navigate('WorkItemsAssignedToMePage')}
      />
      {loading ? (
        <View style={styles.MG_aSkeletonRow}>
          {[1, 0.5].map((op, i) => (
            <View key={i} style={[styles.MG_aSkeletonCard, {opacity: op}]} />
          ))}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.recId?.toString()}
          renderItem={({item}) => (
            <ApprovalCard
              item={item}
              onApprove={handleApprove}
              onReject={handleReject}
              onPress={handleCardPress}
              processingKey={processingKey}
            />
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.MG_aListContent}
          ItemSeparatorComponent={() => (
            <View style={{width: conditionalScale(10, 10, 12, 12)}} />
          )}
        />
      )}
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// LeaveStatCard
// ─────────────────────────────────────────────────────────────────────────────
const LEAVE_TYPES = [
  {
    key: 'annual',
    label: 'Annual',
    available: 12,
    total: 18,
    color: BRAND.blue,
    bg: BRAND.blueSoft,
  },
  {
    key: 'sick',
    label: 'Sick',
    available: 5,
    total: 10,
    color: BRAND.green,
    bg: BRAND.greenSoft,
  },
  {
    key: 'emergency',
    label: 'Emergency',
    available: 2,
    total: 3,
    color: BRAND.amber,
    bg: BRAND.amberSoft,
  },
  {
    key: 'unpaid',
    label: 'Unpaid',
    available: 30,
    total: 30,
    color: BRAND.purple,
    bg: BRAND.purpleSoft,
  },
];

const LeaveStatCard = ({item, index}) => {
  const T = useAppTokens();
  const barAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const ratio = item.total > 0 ? item.available / item.total : 0;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 55,
        useNativeDriver: true,
      }),
      Animated.timing(barAnim, {
        toValue: ratio,
        duration: 500,
        delay: index * 55 + 100,
        useNativeDriver: false,
      }),
    ]).start();
  }, [barAnim, fadeAnim, index, ratio]);

  const barWidth = barAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', `${Math.round(ratio * 100)}%`],
  });

  return (
    <Animated.View
      style={[
        styles.MG_leaveCard,
        {
          backgroundColor: T.cardBg,
          borderColor: T.cardDivider,
          opacity: fadeAnim,
        },
      ]}>
      <Text style={[styles.MG_leaveNumber, {color: item.color}]}>
        {item.available}
      </Text>
      <Text style={[styles.MG_leaveLabel, {color: T.subtitleText}]}>
        {item.label}
      </Text>
      <View style={[styles.MG_leaveTrack, {backgroundColor: T.surface}]}>
        <Animated.View
          style={[
            styles.MG_leaveFill,
            {width: barWidth, backgroundColor: item.color},
          ]}
        />
      </View>
      <Text style={[styles.MG_leaveOf, {color: T.subtitleText}]}>
        of {item.total} days
      </Text>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// LeavesAvailableSection
// ─────────────────────────────────────────────────────────────────────────────
const LeavesAvailableSection = ({navigation, userData}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchLeaves = useCallback(async () => {
    if (!userData?.employeeId) {
      return;
    }

    setLoading(true);
    try {
      const data = await RetrieveEntitlementBalanceRequest({
        employeeId: userData.employeeId,
      });

      const filtered = (data || []).filter(
        e => e.EmployeeId === userData.employeeId,
      );

      const formatted = filtered.map(item => {
        const total = Number(item.Accrued ?? 0);
        const available = Number(item.Taken ?? 0);

        const accent = getTypeAccent(item.EntitlementCode);

        return {
          key: item.RecId ?? item.EntitlementCode,
          label: item.EntitlementCode,
          available: available,
          total: total,
          color: accent.color,
          bg: accent.bg,
        };
      });

      setItems(formatted);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [userData?.employeeId]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, fadeAnim]);
  if (!loading && items.length === 0) {
    return null;
  }

  return (
    <Animated.View style={[styles.MG_section, {opacity: fadeAnim}]}>
      <SectionHeader
        title="Leave Balance"
        actionLabel="Details"
        onAction={() => navigation.navigate('EntitlementBalance')}
      />

      {loading ? (
        <View style={styles.MG_aSkeletonRow}>
          {[1, 0.5].map((op, i) => (
            <View key={i} style={[styles.MG_leaveCard, {opacity: op}]} />
          ))}
        </View>
      ) : (
        <TouchableOpacity
          activeOpacity={0.97}
          onPress={() => navigation.navigate('EntitlementBalance')}
          style={styles.MG_leaveGrid}>
          {items.map((item, index) => (
            <LeaveStatCard key={item.key} item={item} index={index} />
          ))}
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MenuGrid
// ─────────────────────────────────────────────────────────────────────────────
const MenuGrid = ({
  dynamicMenus,
  dimensions,
  onCardPress,
  userData,
  refreshKey,
}) => {
  const T = useAppTokens();
  const navigation = useNavigation();

  const {
    computedCardWidth,
    computedCardHeight,
    iconSize,
    GRID_GAP,
    numColumns,
  } = dimensions;

  const reducedIconSize = Math.round(iconSize * 0.72);

  // ── Split tiles into an Attendance group + everything else ──
  // Adjust this matcher if your attendance MenuIds don't contain "attendance".
  // For exact control, swap it for a Set:
  //   const ATTENDANCE_IDS = new Set(['MarkAttendance', 'AttendanceHistory', ...]);
  //   const isAttendanceTile = card => ATTENDANCE_IDS.has(card.menuItem?.MenuId);
  const isAttendanceTile = card => {
    const hay = `${card.menuItem?.MenuId || ''} ${
      card.title || ''
    }`.toLowerCase();
    return hay.includes('attendance');
  };

  const attendanceMenus = dynamicMenus.filter(isAttendanceTile);
  const otherMenus = dynamicMenus.filter(card => !isAttendanceTile(card));

  // Shared wrapping grid — cards wrap to the next row and the section grows
  // downward, scrolling with the dashboard's outer ScrollView.
  const renderTileGrid = cards => (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingLeft: GRID_GAP, // ✅ space on the left side of the tiles
      }}>
      {cards.map((card, index) => (
        <View
          key={card.id}
          style={{
            width: computedCardWidth,
            marginRight: (index + 1) % numColumns === 0 ? 0 : GRID_GAP,
            marginBottom: GRID_GAP,
          }}>
          <MenuCard
            card={card}
            cardWidth={computedCardWidth}
            cardHeight={computedCardHeight}
            iconSize={reducedIconSize}
            gridGap={GRID_GAP}
            onPress={() => onCardPress(card)}
            badgeCount={card.badgeCount}
          />
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.MG_container}>
      <ApprovalsSection
        userData={userData}
        navigation={navigation}
        refreshKey={refreshKey}
      />

      {dynamicMenus.length === 0 ? (
        <View style={styles.MG_emptyState}>
          <View style={[styles.MG_emptyIcon, {backgroundColor: T.surface}]}>
            <FeatherIcon
              name="inbox"
              size={conditionalFontScale(22, 24, 26, 26)}
              color={T.subtitleText}
            />
          </View>
          <Text style={[styles.MG_emptyTitle, {color: T.titleText}]}>
            No actions available
          </Text>
          <Text style={[styles.MG_emptyBody, {color: T.subtitleText}]}>
            Contact your administrator to get started.
          </Text>
        </View>
      ) : (
        <>
          {otherMenus.length > 0 && (
            <>
              <SectionHeader title="Quick Actions" />
              {renderTileGrid(otherMenus)}
            </>
          )}

          {attendanceMenus.length > 0 && (
            <>
              <SectionHeader title="Attendance" />
              {renderTileGrid(attendanceMenus)}
            </>
          )}
        </>
      )}
    </View>
  );
};

export default MenuGrid;
