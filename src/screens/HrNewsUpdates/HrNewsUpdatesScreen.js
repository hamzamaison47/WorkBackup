/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Animated,
  Easing,
} from 'react-native';
// import {useSelector} from 'react-redux';

import ActionPaneContainer from '../../components/ActionPaneContainer';
import {RetrieveHrNewsUpdates} from '../../API/HRNewsUpdates/RetrieveHrNewsUpdates';
import styles from '../../styles/styles';

// ───────────────── Skeleton Loader ─────────────────
const SkeletonCard = ({index}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const delay = index * 120;
    const timer = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.8,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.3,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [opacity, index]);

  return (
    <Animated.View style={[localStyles.skeletonCard, {opacity}]}>
      <View style={localStyles.skeletonHeader}>
        <View style={localStyles.skeletonCircle} />
        <View style={localStyles.skeletonTitleBlock} />
        <View style={localStyles.skeletonBadge} />
      </View>
      <View style={localStyles.skeletonLine} />
      <View style={[localStyles.skeletonLine, {width: '60%'}]} />
      <View style={localStyles.skeletonDivider} />
      <View style={[localStyles.skeletonLine, {width: '45%'}]} />
    </Animated.View>
  );
};

const SkeletonLoader = () => (
  <View style={localStyles.skeletonContainer}>
    {[0, 1, 2, 3].map(i => (
      <SkeletonCard key={i} index={i} />
    ))}
  </View>
);

// ───────────────── Animated News Card ─────────────────
const NewsCard = ({item, index, isVisible}) => {
  const translateY = useRef(new Animated.Value(80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    // Staggered delay: 3s base + 150ms per card
    const staggerDelay = 3000 + index * 160;

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 550,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 480,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 60,
          friction: 9,
          useNativeDriver: true,
        }),
      ]).start();
    }, staggerDelay);

    return () => clearTimeout(timer);
  }, [isVisible, index, translateY, opacity, scale]);

  // ── TargetAudience number → readable label
  const getAudienceLabel = audience => {
    const map = {
      0: 'ALL',
      1: 'MANAGEMENT',
      2: 'STAFF',
      3: 'DEPARTMENT',
      4: 'ORGANIZATION',
      5: 'INDIVIDUAL',
    };
    return map[audience] ?? 'ORGANIZATION';
  };

  // ── Emoji based on Subject text
  const getEmoji = subject => {
    if (!subject) {
      return '📋';
    }
    const t = subject.toLowerCase();
    if (t.includes('global') || t.includes('worldwide')) {
      return '🌍';
    }
    if (t.includes('coffee') || t.includes('cafeteria')) {
      return '☕';
    }
    if (t.includes('employee') || t.includes('staff')) {
      return '🎉';
    }
    if (t.includes('team') || t.includes('dynaface')) {
      return '💪';
    }
    if (t.includes('policy') || t.includes('hr')) {
      return '📜';
    }
    if (t.includes('leave') || t.includes('vacation')) {
      return '🏖️';
    }
    if (t.includes('salary') || t.includes('pay')) {
      return '💰';
    }
    if (t.includes('meet') || t.includes('event')) {
      return '📅';
    }
    if (t.includes('train') || t.includes('learn')) {
      return '📚';
    }
    if (t.includes('health') || t.includes('medical')) {
      return '❤️';
    }
    if (t.includes('music') || t.includes('background')) {
      return '🎶';
    }
    if (t.includes('update') || t.includes('news')) {
      return '📢';
    }
    if (t.includes('holiday') || t.includes('off')) {
      return '🗓️';
    }
    return '📢';
  };

  // ── Format ISO date string → M/D/YYYY
  const formatDate = rawDate => {
    if (!rawDate) {
      return '—';
    }
    try {
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) {
        return rawDate;
      }
      const month = d.getMonth() + 1;
      const day = d.getDate();
      const year = d.getFullYear();
      return `${month}/${day}/${year}`;
    } catch {
      return rawDate;
    }
  };

  // ── Exact API field names
  const title = item?.Subject || '—';
  const description = item?.Detail || '';
  const startDate = item?.Start || '';
  const expiryDate = item?.Expiry || '';
  const category = getAudienceLabel(item?.TargetAudience);

  return (
    <Animated.View
      style={[
        localStyles.cardWrapper,
        {
          transform: [{translateY}, {scale}],
          opacity,
        },
      ]}>
      {/* Card */}
      <View style={localStyles.card}>
        {/* Header Row */}
        <View style={localStyles.cardHeader}>
          <View style={localStyles.cardTitleRow}>
            <Text style={localStyles.cardEmoji}>{getEmoji(title)}</Text>
            <Text style={localStyles.cardTitle} numberOfLines={1}>
              {title}
            </Text>
          </View>
          <View style={localStyles.categoryBadge}>
            <Text style={localStyles.categoryBadgeText}>
              {String(category).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Description */}
        {!!description && (
          <Text style={localStyles.cardDescription} numberOfLines={3}>
            {description}
          </Text>
        )}

        {/* Divider */}
        <View style={localStyles.cardDivider} />

        {/* Footer Row */}
        <View style={localStyles.cardFooter}>
          <View>
            <Text style={localStyles.effectiveLabel}>
              Effective:{' '}
              <Text style={localStyles.effectiveDate}>
                {formatDate(startDate)}
              </Text>
            </Text>
            {!!expiryDate && (
              <Text style={[localStyles.effectiveLabel, {marginTop: 2}]}>
                Expires:{' '}
                <Text style={localStyles.effectiveDate}>
                  {formatDate(expiryDate)}
                </Text>
              </Text>
            )}
          </View>
          <Text style={localStyles.arrowIcon}>›</Text>
        </View>
      </View>
    </Animated.View>
  );
};

// ───────────────── Screen ─────────────────
const HrNewsUpdatesScreen = ({navigation}) => {
  const [newsUpdates, setNewsUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cardsVisible, setCardsVisible] = useState(false);

  //   const {userData} = useSelector(state => state.user);

  // ───────────── Fetch News Updates ─────────────
  const fetchNewsUpdates = useCallback(async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }
      setCardsVisible(false);

      const data = await RetrieveHrNewsUpdates();
      const validData = Array.isArray(data) ? data : [];

      setNewsUpdates(validData);

      // Small pause then trigger card animations
      setTimeout(() => {
        setCardsVisible(true);
      }, 200);
    } catch (error) {
      console.log('News updates fetch error', error);
      setCardsVisible(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    fetchNewsUpdates();
  }, [fetchNewsUpdates]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNewsUpdates();
  };

  // ───────────── Render Card ─────────────
  const renderCard = ({item, index}) => {
    if (!item?.RecId) {
      return null;
    }
    return <NewsCard item={item} index={index} isVisible={cardsVisible} />;
  };

  // ───────────── Empty State ─────────────
  const renderEmpty = () => (
    <View style={localStyles.emptyContainer}>
      <Text style={localStyles.emptyEmoji}>📭</Text>
      <Text style={localStyles.emptyTitle}>No News & Updates</Text>
      <Text style={localStyles.emptySubtitle}>
        Check back later for the latest updates.
      </Text>
    </View>
  );

  // ───────────── UI ─────────────
  return (
    <ActionPaneContainer
      pageTitle="News & Updates"
      isBackButton={true}
      isHeaderActive={true}
      showPageTitleRow={true}
      onBackPress={() => navigation.goBack()}>
      <View style={[styles.container, localStyles.screenBg]}>
        {loading && !refreshing ? (
          <SkeletonLoader />
        ) : (
          <FlatList
            data={newsUpdates}
            renderItem={renderCard}
            keyExtractor={(item, index) =>
              item.RecId?.toString() || index.toString()
            }
            contentContainerStyle={localStyles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#0A66C2"
              />
            }
            ListEmptyComponent={renderEmpty}
          />
        )}
      </View>
    </ActionPaneContainer>
  );
};

// ───────────────── Styles ─────────────────
const localStyles = StyleSheet.create({
  screenBg: {
    backgroundColor: '#F5F7FA',
  },

  listContainer: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 24,
  },

  // ── Card ──
  cardWrapper: {
    marginBottom: 14,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingTop: 14,
    paddingBottom: 0,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 4,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },

  cardEmoji: {
    fontSize: 22,
    marginRight: 8,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    letterSpacing: 0.1,
  },

  categoryBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.8,
  },

  cardDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
    letterSpacing: 0.1,
  },

  cardDivider: {
    height: 1,
    backgroundColor: '#F0F2F5',
    marginHorizontal: -16,
  },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
  },

  effectiveLabel: {
    fontSize: 13,
    color: '#6B7280',
    letterSpacing: 0.1,
  },

  effectiveDate: {
    color: '#374151',
    fontWeight: '600',
  },

  arrowIcon: {
    fontSize: 22,
    color: '#9CA3AF',
    fontWeight: '300',
    lineHeight: 24,
  },

  // ── Skeleton ──
  skeletonContainer: {
    padding: 14,
    paddingTop: 12,
  },

  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },

  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  skeletonCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8EAF0',
    marginRight: 10,
  },

  skeletonTitleBlock: {
    flex: 1,
    height: 14,
    backgroundColor: '#E8EAF0',
    borderRadius: 7,
    marginRight: 12,
  },

  skeletonBadge: {
    width: 72,
    height: 22,
    backgroundColor: '#E8EAF0',
    borderRadius: 6,
  },

  skeletonLine: {
    width: '85%',
    height: 11,
    backgroundColor: '#ECEEF2',
    borderRadius: 6,
    marginBottom: 8,
  },

  skeletonDivider: {
    height: 1,
    backgroundColor: '#F0F2F5',
    marginHorizontal: -16,
    marginVertical: 8,
  },

  // ── Empty State ──
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: 72,
    paddingHorizontal: 32,
  },

  emptyEmoji: {
    fontSize: 52,
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },

  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default HrNewsUpdatesScreen;
