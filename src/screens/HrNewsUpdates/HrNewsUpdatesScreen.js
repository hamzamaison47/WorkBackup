// /* eslint-disable react-native/no-inline-styles */
// import React, {useState, useEffect, useCallback, useRef} from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   FlatList,
//   RefreshControl,
//   Animated,
//   Easing,
// } from 'react-native';
// // import {useSelector} from 'react-redux';

// import ActionPaneContainer from '../../components/ActionPaneContainer';
// import {RetrieveHrNewsUpdates} from '../../API/HRNewsUpdates/RetrieveHrNewsUpdates';
// import styles from '../../styles/styles';

// // ───────────────── Skeleton Loader ─────────────────
// const SkeletonCard = ({index}) => {
//   const opacity = useRef(new Animated.Value(0.3)).current;

//   useEffect(() => {
//     const delay = index * 120;
//     const timer = setTimeout(() => {
//       Animated.loop(
//         Animated.sequence([
//           Animated.timing(opacity, {
//             toValue: 0.8,
//             duration: 700,
//             useNativeDriver: true,
//           }),
//           Animated.timing(opacity, {
//             toValue: 0.3,
//             duration: 700,
//             useNativeDriver: true,
//           }),
//         ]),
//       ).start();
//     }, delay);
//     return () => clearTimeout(timer);
//   }, [opacity, index]);

//   return (
//     <Animated.View style={[localStyles.skeletonCard, {opacity}]}>
//       <View style={localStyles.skeletonHeader}>
//         <View style={localStyles.skeletonCircle} />
//         <View style={localStyles.skeletonTitleBlock} />
//         <View style={localStyles.skeletonBadge} />
//       </View>
//       <View style={localStyles.skeletonLine} />
//       <View style={[localStyles.skeletonLine, {width: '60%'}]} />
//       <View style={localStyles.skeletonDivider} />
//       <View style={[localStyles.skeletonLine, {width: '45%'}]} />
//     </Animated.View>
//   );
// };

// const SkeletonLoader = () => (
//   <View style={localStyles.skeletonContainer}>
//     {[0, 1, 2, 3].map(i => (
//       <SkeletonCard key={i} index={i} />
//     ))}
//   </View>
// );

// // ───────────────── Animated News Card ─────────────────
// const NewsCard = ({item, index, isVisible}) => {
//   const translateY = useRef(new Animated.Value(80)).current;
//   const opacity = useRef(new Animated.Value(0)).current;
//   const scale = useRef(new Animated.Value(0.96)).current;

//   useEffect(() => {
//     if (!isVisible) {
//       return;
//     }

//     // Staggered delay: 3s base + 150ms per card
//     const staggerDelay = 3000 + index * 160;

//     const timer = setTimeout(() => {
//       Animated.parallel([
//         Animated.timing(translateY, {
//           toValue: 0,
//           duration: 550,
//           easing: Easing.out(Easing.cubic),
//           useNativeDriver: true,
//         }),
//         Animated.timing(opacity, {
//           toValue: 1,
//           duration: 480,
//           easing: Easing.out(Easing.ease),
//           useNativeDriver: true,
//         }),
//         Animated.spring(scale, {
//           toValue: 1,
//           tension: 60,
//           friction: 9,
//           useNativeDriver: true,
//         }),
//       ]).start();
//     }, staggerDelay);

//     return () => clearTimeout(timer);
//   }, [isVisible, index, translateY, opacity, scale]);

//   // ── TargetAudience number → readable label
//   const getAudienceLabel = audience => {
//     const map = {
//       0: 'ALL',
//       1: 'MANAGEMENT',
//       2: 'STAFF',
//       3: 'DEPARTMENT',
//       4: 'ORGANIZATION',
//       5: 'INDIVIDUAL',
//     };
//     return map[audience] ?? 'ORGANIZATION';
//   };

//   // ── Emoji based on Subject text
//   const getEmoji = subject => {
//     if (!subject) {
//       return '📋';
//     }
//     const t = subject.toLowerCase();
//     if (t.includes('global') || t.includes('worldwide')) {
//       return '🌍';
//     }
//     if (t.includes('coffee') || t.includes('cafeteria')) {
//       return '☕';
//     }
//     if (t.includes('employee') || t.includes('staff')) {
//       return '🎉';
//     }
//     if (t.includes('team') || t.includes('dynaface')) {
//       return '💪';
//     }
//     if (t.includes('policy') || t.includes('hr')) {
//       return '📜';
//     }
//     if (t.includes('leave') || t.includes('vacation')) {
//       return '🏖️';
//     }
//     if (t.includes('salary') || t.includes('pay')) {
//       return '💰';
//     }
//     if (t.includes('meet') || t.includes('event')) {
//       return '📅';
//     }
//     if (t.includes('train') || t.includes('learn')) {
//       return '📚';
//     }
//     if (t.includes('health') || t.includes('medical')) {
//       return '❤️';
//     }
//     if (t.includes('music') || t.includes('background')) {
//       return '🎶';
//     }
//     if (t.includes('update') || t.includes('news')) {
//       return '📢';
//     }
//     if (t.includes('holiday') || t.includes('off')) {
//       return '🗓️';
//     }
//     return '📢';
//   };

//   // ── Format ISO date string → M/D/YYYY
//   const formatDate = rawDate => {
//     if (!rawDate) {
//       return '—';
//     }
//     try {
//       const d = new Date(rawDate);
//       if (isNaN(d.getTime())) {
//         return rawDate;
//       }
//       const month = d.getMonth() + 1;
//       const day = d.getDate();
//       const year = d.getFullYear();
//       return `${month}/${day}/${year}`;
//     } catch {
//       return rawDate;
//     }
//   };

//   // ── Exact API field names
//   const title = item?.Subject || '—';
//   const description = item?.Detail || '';
//   const startDate = item?.Start || '';
//   const expiryDate = item?.Expiry || '';
//   const category = getAudienceLabel(item?.TargetAudience);

//   return (
//     <Animated.View
//       style={[
//         localStyles.cardWrapper,
//         {
//           transform: [{translateY}, {scale}],
//           opacity,
//         },
//       ]}>
//       {/* Card */}
//       <View style={localStyles.card}>
//         {/* Header Row */}
//         <View style={localStyles.cardHeader}>
//           <View style={localStyles.cardTitleRow}>
//             <Text style={localStyles.cardEmoji}>{getEmoji(title)}</Text>
//             <Text style={localStyles.cardTitle} numberOfLines={1}>
//               {title}
//             </Text>
//           </View>
//           <View style={localStyles.categoryBadge}>
//             <Text style={localStyles.categoryBadgeText}>
//               {String(category).toUpperCase()}
//             </Text>
//           </View>
//         </View>

//         {/* Description */}
//         {!!description && (
//           <Text style={localStyles.cardDescription} numberOfLines={3}>
//             {description}
//           </Text>
//         )}

//         {/* Divider */}
//         <View style={localStyles.cardDivider} />

//         {/* Footer Row */}
//         <View style={localStyles.cardFooter}>
//           <View>
//             <Text style={localStyles.effectiveLabel}>
//               Effective:{' '}
//               <Text style={localStyles.effectiveDate}>
//                 {formatDate(startDate)}
//               </Text>
//             </Text>
//             {!!expiryDate && (
//               <Text style={[localStyles.effectiveLabel, {marginTop: 2}]}>
//                 Expires:{' '}
//                 <Text style={localStyles.effectiveDate}>
//                   {formatDate(expiryDate)}
//                 </Text>
//               </Text>
//             )}
//           </View>
//           <Text style={localStyles.arrowIcon}>›</Text>
//         </View>
//       </View>
//     </Animated.View>
//   );
// };

// // ───────────────── Screen ─────────────────
// const HrNewsUpdatesScreen = ({navigation}) => {
//   const [newsUpdates, setNewsUpdates] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [cardsVisible, setCardsVisible] = useState(false);

//   //   const {userData} = useSelector(state => state.user);

//   // ───────────── Fetch News Updates ─────────────
//   const fetchNewsUpdates = useCallback(async () => {
//     try {
//       if (!refreshing) {
//         setLoading(true);
//       }
//       setCardsVisible(false);

//       const data = await RetrieveHrNewsUpdates();
//       const validData = Array.isArray(data) ? data : [];

//       setNewsUpdates(validData);

//       // Small pause then trigger card animations
//       setTimeout(() => {
//         setCardsVisible(true);
//       }, 200);
//     } catch (error) {
//       console.log('News updates fetch error', error);
//       setCardsVisible(true);
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   }, [refreshing]);

//   useEffect(() => {
//     fetchNewsUpdates();
//   }, [fetchNewsUpdates]);

//   const onRefresh = () => {
//     setRefreshing(true);
//     fetchNewsUpdates();
//   };

//   // ───────────── Render Card ─────────────
//   const renderCard = ({item, index}) => {
//     if (!item?.RecId) {
//       return null;
//     }
//     return <NewsCard item={item} index={index} isVisible={cardsVisible} />;
//   };

//   // ───────────── Empty State ─────────────
//   const renderEmpty = () => (
//     <View style={localStyles.emptyContainer}>
//       <Text style={localStyles.emptyEmoji}>📭</Text>
//       <Text style={localStyles.emptyTitle}>No News & Updates</Text>
//       <Text style={localStyles.emptySubtitle}>
//         Check back later for the latest updates.
//       </Text>
//     </View>
//   );

//   // ───────────── UI ─────────────
//   return (
//     <ActionPaneContainer
//       pageTitle="News & Updates"
//       isBackButton={true}
//       isHeaderActive={true}
//       showPageTitleRow={true}
//       onBackPress={() => navigation.goBack()}>
//       <View style={[styles.container, localStyles.screenBg]}>
//         {loading && !refreshing ? (
//           <SkeletonLoader />
//         ) : (
//           <FlatList
//             data={newsUpdates}
//             renderItem={renderCard}
//             keyExtractor={(item, index) =>
//               item.RecId?.toString() || index.toString()
//             }
//             contentContainerStyle={localStyles.listContainer}
//             showsVerticalScrollIndicator={false}
//             refreshControl={
//               <RefreshControl
//                 refreshing={refreshing}
//                 onRefresh={onRefresh}
//                 tintColor="#0A66C2"
//               />
//             }
//             ListEmptyComponent={renderEmpty}
//           />
//         )}
//       </View>
//     </ActionPaneContainer>
//   );
// };

// // ───────────────── Styles ─────────────────
// const localStyles = StyleSheet.create({
//   screenBg: {
//     backgroundColor: '#F5F7FA',
//   },

//   listContainer: {
//     paddingHorizontal: 14,
//     paddingTop: 12,
//     paddingBottom: 24,
//   },

//   // ── Card ──
//   cardWrapper: {
//     marginBottom: 14,
//   },

//   card: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 16,
//     paddingTop: 14,
//     paddingBottom: 0,
//     paddingHorizontal: 16,
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: 3},
//     shadowOpacity: 0.07,
//     shadowRadius: 8,
//     elevation: 4,
//   },

//   cardHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     marginBottom: 10,
//   },

//   cardTitleRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//     marginRight: 10,
//   },

//   cardEmoji: {
//     fontSize: 22,
//     marginRight: 8,
//   },

//   cardTitle: {
//     fontSize: 15,
//     fontWeight: '700',
//     color: '#111827',
//     flex: 1,
//     letterSpacing: 0.1,
//   },

//   categoryBadge: {
//     backgroundColor: '#F3F4F6',
//     borderRadius: 6,
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderWidth: 1,
//     borderColor: '#E5E7EB',
//   },

//   categoryBadgeText: {
//     fontSize: 10,
//     fontWeight: '700',
//     color: '#6B7280',
//     letterSpacing: 0.8,
//   },

//   cardDescription: {
//     fontSize: 14,
//     color: '#374151',
//     lineHeight: 20,
//     marginBottom: 12,
//     letterSpacing: 0.1,
//   },

//   cardDivider: {
//     height: 1,
//     backgroundColor: '#F0F2F5',
//     marginHorizontal: -16,
//   },

//   cardFooter: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingVertical: 11,
//   },

//   effectiveLabel: {
//     fontSize: 13,
//     color: '#6B7280',
//     letterSpacing: 0.1,
//   },

//   effectiveDate: {
//     color: '#374151',
//     fontWeight: '600',
//   },

//   arrowIcon: {
//     fontSize: 22,
//     color: '#9CA3AF',
//     fontWeight: '300',
//     lineHeight: 24,
//   },

//   // ── Skeleton ──
//   skeletonContainer: {
//     padding: 14,
//     paddingTop: 12,
//   },

//   skeletonCard: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 16,
//     padding: 16,
//     marginBottom: 14,
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: 2},
//     shadowOpacity: 0.05,
//     shadowRadius: 6,
//     elevation: 3,
//   },

//   skeletonHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 12,
//   },

//   skeletonCircle: {
//     width: 28,
//     height: 28,
//     borderRadius: 14,
//     backgroundColor: '#E8EAF0',
//     marginRight: 10,
//   },

//   skeletonTitleBlock: {
//     flex: 1,
//     height: 14,
//     backgroundColor: '#E8EAF0',
//     borderRadius: 7,
//     marginRight: 12,
//   },

//   skeletonBadge: {
//     width: 72,
//     height: 22,
//     backgroundColor: '#E8EAF0',
//     borderRadius: 6,
//   },

//   skeletonLine: {
//     width: '85%',
//     height: 11,
//     backgroundColor: '#ECEEF2',
//     borderRadius: 6,
//     marginBottom: 8,
//   },

//   skeletonDivider: {
//     height: 1,
//     backgroundColor: '#F0F2F5',
//     marginHorizontal: -16,
//     marginVertical: 8,
//   },

//   // ── Empty State ──
//   emptyContainer: {
//     flex: 1,
//     alignItems: 'center',
//     marginTop: 72,
//     paddingHorizontal: 32,
//   },

//   emptyEmoji: {
//     fontSize: 52,
//     marginBottom: 16,
//   },

//   emptyTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#374151',
//     marginBottom: 8,
//     textAlign: 'center',
//   },

//   emptySubtitle: {
//     fontSize: 14,
//     color: '#9CA3AF',
//     textAlign: 'center',
//     lineHeight: 20,
//   },
// });

// export default HrNewsUpdatesScreen;
// import React, {useState, useEffect, useCallback} from 'react';
// import {View, FlatList, RefreshControl, ScrollView, Text} from 'react-native';
// import {
//   PageBackground,
//   AnimatedCard,
//   CardHeading,
//   SettingRow,
//   RowSkeleton,
//   EmptyState,
//   FooterNote,
//   CARD_STAGGER,
// } from '../../components/AppComponentsDesign/Appcomponents';
// import {RetrieveHrNewsUpdates} from '../../API/HRNewsUpdates/RetrieveHrNewsUpdates';
// import useAppTokens from '../../components/AppComponentsDesign/useAppTokens';
// import {
//   conditionalScale,
//   conditionalFontScale,
// } from '../../store/utils/scaling';

// const HrNewsUpdatesScreen = ({navigation}) => {
//   const T = useAppTokens();
//   const [newsUpdates, setNewsUpdates] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);

//   // ── Data Fetching ──────────────────────────────────────────────────────────
//   const fetchNewsUpdates = useCallback(async () => {
//     try {
//       if (!refreshing) setLoading(true);
//       const data = await RetrieveHrNewsUpdates();
//       setNewsUpdates(Array.isArray(data) ? data : []);
//     } catch (error) {
//       console.error('Fetch error:', error);
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   }, [refreshing]);

//   useEffect(() => {
//     fetchNewsUpdates();
//   }, [fetchNewsUpdates]);

//   // ── Helpers ───────────────────────────────────────────────────────────────
//   const getAudienceLabel = audience => {
//     const map = {0: 'All', 1: 'Management', 2: 'Staff', 3: 'Dept', 4: 'Org'};
//     return map[audience] ?? 'General';
//   };

//   const formatDate = raw => {
//     if (!raw) return '—';
//     const d = new Date(raw);
//     return isNaN(d.getTime())
//       ? raw
//       : `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
//   };

//   // ── Render Components ─────────────────────────────────────────────────────

//   // 1. Featured Top Scroll (Horizontal)
//   const renderFeaturedSection = () => (
//     <View style={{marginBottom: conditionalScale(20, 22, 24, 24)}}>
//       <CardHeading label="FEATURED ANNOUNCEMENTS" />
//       <ScrollView
//         horizontal
//         showsHorizontalScrollIndicator={false}
//         contentContainerStyle={{paddingLeft: 16, paddingRight: 8}}>
//         {newsUpdates.slice(0, 3).map((item, index) => (
//           <View
//             key={`featured-${index}`}
//             style={{
//               width: conditionalScale(240, 260, 280, 280),
//               marginRight: 12,
//               backgroundColor: T.cardBg,
//               borderRadius: 16,
//               padding: 16,
//               ...T.shadowProps, // Applying system shadow
//               elevation: T.elevation,
//             }}>
//             <Text
//               style={{
//                 color: T.blue,
//                 fontWeight: 'bold',
//                 fontSize: 10,
//                 marginBottom: 4,
//               }}>
//               {getAudienceLabel(item.TargetAudience).toUpperCase()}
//             </Text>
//             <Text
//               style={{color: T.titleText, fontWeight: '700', fontSize: 14}}
//               numberOfLines={1}>
//               {item.Subject}
//             </Text>
//             <Text
//               style={{color: T.subtitleText, fontSize: 12, marginTop: 4}}
//               numberOfLines={2}>
//               {item.Detail}
//             </Text>
//           </View>
//         ))}
//       </ScrollView>
//     </View>
//   );

//   if (loading && !refreshing) {
//     return (
//       <PageBackground>
//         <CardHeading label="LOADING UPDATES..." />
//         <AnimatedCard delay={0}>
//           <RowSkeleton count={5} />
//         </AnimatedCard>
//       </PageBackground>
//     );
//   }

//   return (
//     <PageBackground>
//       <FlatList
//         data={newsUpdates}
//         keyExtractor={item => item.RecId?.toString()}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={fetchNewsUpdates}
//             tintColor={T.blue}
//           />
//         }
//         ListHeaderComponent={() => (
//           <>
//             {newsUpdates.length > 0 && renderFeaturedSection()}
//             <CardHeading label="ALL UPDATES" />
//           </>
//         )}
//         renderItem={({item, index}) => (
//           <AnimatedCard delay={index * 30 + CARD_STAGGER}>
//             <SettingRow
//               title={item.Subject}
//               subtitle={item.Detail}
//               icon="message-square"
//               iconColor={T.indigo}
//               iconBg={T.indigoBg}
//               rightLabel={formatDate(item.Start)}
//               onPress={() => {
//                 /* Navigate to detail */
//               }}
//               isLast={true} // Each card contains one row for a "clean" look
//             />
//           </AnimatedCard>
//         )}
//         ListEmptyComponent={
//           <EmptyState
//             title="No News Found"
//             subtitle="Everything is up to date."
//           />
//         }
//         ListFooterComponent={<FooterNote text="End of updates" />}
//         contentContainerStyle={{paddingBottom: 40}}
//       />
//     </PageBackground>
//   );
// };

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
  StatusBar,
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
      if (!refreshing) setLoading(true);
      const data = await RetrieveHrNewsUpdates();
      setNewsUpdates(Array.isArray(data) ? data : []);
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
        <StatusBar barStyle="dark-content" />

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
