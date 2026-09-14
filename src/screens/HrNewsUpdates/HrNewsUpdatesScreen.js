// export default HrNewsUpdatesScreen;
import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Animated,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import ActionPaneContainer from '../../components/ActionPaneContainer';
import {RetrieveHrNewsUpdates} from '../../API/HRNewsUpdates/RetrieveHrNewsUpdates';

const {width} = Dimensions.get('window');
const CARD_WIDTH = width * 0.88; // Card takes up most of the screen
const SPACING = 12; // Gap between cards
const SNAP_INTERVAL = CARD_WIDTH + SPACING; // Total distance to snap

// ── Skeleton Loader ──────────────────────────────────────────────────────────
const ModernSkeleton = () => {
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
    <Animated.View
      style={[
        styles.newsCard,
        {opacity, height: 120, backgroundColor: '#F1F5F9', borderWidth: 0},
      ]}
    />
  );
};

const HrNewsUpdatesScreen = ({navigation}) => {
  const [newsUpdates, setNewsUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animation value for scroll tracking (for pagination dots)
  const scrollX = useRef(new Animated.Value(0)).current;

  const fetchNewsUpdates = useCallback(async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }
      const data = await RetrieveHrNewsUpdates();
      setNewsUpdates(Array.isArray(data) ? data : []);
      console.log('here is the data', data);
    } catch (error) {
      console.error('HR News Fetch Error:', error);
      setNewsUpdates([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    fetchNewsUpdates();
  }, [fetchNewsUpdates]);

  // ── Render Components ─────────────────────────────────────────────────────

  const renderHeroCard = (item, index) => (
    <TouchableOpacity
      key={item.RecId || index}
      activeOpacity={0.9}
      style={styles.heroCard}>
      <View
        style={[
          styles.heroBackground,
          {backgroundColor: index % 2 === 0 ? '#6366F1' : '#4F46E5'},
        ]}
      />
      <View style={styles.heroOverlay}>
        <View style={styles.badgeRow}>
          <View style={styles.glassBadge}>
            <Text style={styles.glassBadgeText}>FEATURED</Text>
          </View>
          <Text style={styles.heroDate}>
            {new Date(item.Start).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>
        <Text style={styles.heroTitle} numberOfLines={2}>
          {item.Subject || 'No Subject'}
        </Text>
        <Text style={styles.heroSub} numberOfLines={2}>
          {item.Detail}
        </Text>
        <View style={styles.heroActionRow}>
          <Text style={styles.readMoreText}>Read Announcement</Text>
          <Feather name="arrow-right" size={16} color="#FFF" />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderNewsItem = ({item}) => (
    <TouchableOpacity activeOpacity={0.7} style={styles.newsCard}>
      <View style={styles.newsColorStrip(item.TargetAudience)} />
      <View style={styles.newsBody}>
        <View style={styles.newsHeader}>
          <Text style={styles.newsCategory}>
            {item.TargetAudience === 1 ? 'Management' : 'General'}
          </Text>
          <Text style={styles.newsDate}>
            {item.Start ? new Date(item.Start).toLocaleDateString() : 'Recent'}
          </Text>
        </View>
        <Text style={styles.newsTitle} numberOfLines={2}>
          {item.Subject}
        </Text>
        <Text style={styles.newsDetail} numberOfLines={2}>
          {item.Detail}
        </Text>
        <View style={styles.newsFooter}>
          <View style={styles.footerTag}>
            <Feather name="tag" size={10} color="#94A3B8" />
            <Text style={styles.tagText}>Internal Update</Text>
          </View>
          <Feather name="chevron-right" size={18} color="#CBD5E1" />
        </View>
      </View>
    </TouchableOpacity>
  );

  const featuredItems = newsUpdates.slice(0, 3);

  return (
    <ActionPaneContainer
      pageTitle="News & Updates"
      isBackButton={true}
      isHeaderActive={true}
      showPageTitleRow={true}
      onBackPress={() => navigation.goBack()}>
      <View style={styles.container}>
        {loading && !refreshing ? (
          <View style={{paddingHorizontal: 24, paddingTop: 20}}>
            <ModernSkeleton />
            <ModernSkeleton />
            <ModernSkeleton />
          </View>
        ) : (
          <FlatList
            data={newsUpdates.length > 3 ? newsUpdates.slice(3) : []}
            keyExtractor={(item, index) =>
              item.RecId?.toString() || index.toString()
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  fetchNewsUpdates();
                }}
                tintColor="#6366F1"
              />
            }
            // eslint-disable-next-line react/no-unstable-nested-components
            ListHeaderComponent={() => (
              <View style={styles.headerGap}>
                {featuredItems.length > 0 && (
                  <View>
                    <Animated.ScrollView
                      horizontal
                      decelerationRate="fast"
                      snapToInterval={SNAP_INTERVAL}
                      snapToAlignment="start"
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.carouselContainer}
                      onScroll={Animated.event(
                        [{nativeEvent: {contentOffset: {x: scrollX}}}],
                        {useNativeDriver: false},
                      )}
                      scrollEventThrottle={16}>
                      {featuredItems.map((item, index) =>
                        renderHeroCard(item, index),
                      )}
                    </Animated.ScrollView>

                    {/* Pagination Dots */}
                    <View style={styles.paginationRow}>
                      {featuredItems.map((_, i) => {
                        const inputRange = [
                          (i - 1) * SNAP_INTERVAL,
                          i * SNAP_INTERVAL,
                          (i + 1) * SNAP_INTERVAL,
                        ];
                        const dotWidth = scrollX.interpolate({
                          inputRange,
                          outputRange: [8, 20, 8],
                          extrapolate: 'clamp',
                        });
                        const opacity = scrollX.interpolate({
                          inputRange,
                          outputRange: [0.3, 1, 0.3],
                          extrapolate: 'clamp',
                        });
                        return (
                          <Animated.View
                            key={i}
                            style={[styles.dot, {width: dotWidth, opacity}]}
                          />
                        );
                      })}
                    </View>
                  </View>
                )}
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent News</Text>
                </View>
              </View>
            )}
            renderItem={renderNewsItem}
            ListEmptyComponent={
              newsUpdates.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Feather name="inbox" size={40} color="#CBD5E1" />
                  <Text style={styles.emptyText}>No news at the moment</Text>
                </View>
              ) : null
            }
          />
        )}
      </View>
    </ActionPaneContainer>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FFFFFF'},
  carouselContainer: {
    paddingLeft: 24,
    paddingRight: 24,
    paddingBottom: 10,
    paddingTop: 10,
  },
  heroCard: {
    width: CARD_WIDTH,
    marginRight: SPACING,
    height: 230,
    borderRadius: 32,
    overflow: 'hidden',
  },
  heroBackground: {...StyleSheet.absoluteFillObject},
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
    padding: 24,
    justifyContent: 'flex-end',
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  glassBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  glassBadgeText: {color: '#FFF', fontSize: 10, fontWeight: '800'},
  heroDate: {color: '#FFF', fontSize: 12, fontWeight: '600'},
  heroTitle: {color: '#FFF', fontSize: 22, fontWeight: '800', marginBottom: 8},
  heroSub: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  heroActionRow: {flexDirection: 'row', alignItems: 'center'},
  readMoreText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
    marginRight: 6,
  },

  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366F1',
    marginHorizontal: 4,
  },

  listContent: {paddingBottom: 40},
  headerGap: {paddingTop: 10},
  sectionHeader: {paddingHorizontal: 24, marginBottom: 16},
  sectionTitle: {fontSize: 20, fontWeight: '700', color: '#1E293B'},

  newsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  newsColorStrip: audience => ({
    width: 6,
    backgroundColor: audience === 1 ? '#6366F1' : '#E2E8F0',
  }),
  newsBody: {flex: 1, padding: 18},
  newsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  newsCategory: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366F1',
    textTransform: 'uppercase',
  },
  newsDate: {fontSize: 11, color: '#94A3B8'},
  newsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  newsDetail: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 12,
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {fontSize: 10, color: '#94A3B8', fontWeight: '600', marginLeft: 4},
  emptyBox: {alignItems: 'center', marginTop: 100},
  emptyText: {color: '#94A3B8', marginTop: 12, fontSize: 14},
});

export default HrNewsUpdatesScreen;
