// // ─────────────────────────────────────────────
// // components/AttendanceManagement/screens/HomeScreen.js
// // ─────────────────────────────────────────────
// /* eslint-disable curly */
// /* eslint-disable react-native/no-inline-styles */
// import React, {useState, useEffect} from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   ScrollView,
//   SafeAreaView,
//   StatusBar,
//   StyleSheet,
//   ActivityIndicator,
//   Linking,
//   Platform,
// } from 'react-native';
// import {useGeofence} from '../GeofenceContext';
// import LocationPickerModal from '../LocationPickerModal';
// import NavigationFAB from '../NavigationFAB';
// import {
//   loadRecords,
//   formatTime,
// } from '../../../screens/AttendanceManagement/helpers';
// import {C, R, Sh} from '../theme';

// // ─────────────────────────────────────────────
// // Full-screen: P1 — Permission denied
// // ─────────────────────────────────────────────
// const PermissionDeniedView = ({onNavigate}) => (
//   <View style={S.stateWrap}>
//     <View style={[S.stateIconCircle, {backgroundColor: C.redLight}]}>
//       <Text style={S.stateEmoji}>📍</Text>
//     </View>
//     <Text style={S.stateTitle}>Location Access Required</Text>
//     <Text style={S.stateSub}>
//       Attendance tracking needs your location to confirm you're at an authorised
//       office zone before clocking in or out.
//     </Text>
//     <TouchableOpacity
//       style={S.stateBtn}
//       onPress={() =>
//         Platform.OS === 'android'
//           ? Linking.openSettings()
//           : Linking.openURL('app-settings:')
//       }>
//       <Text style={S.stateBtnTxt}>Open Settings</Text>
//     </TouchableOpacity>
//     <NavigationFAB activeScreen="Home" onNavigate={onNavigate} />
//   </View>
// );

// // ─────────────────────────────────────────────
// // Full-screen: P3 — GPS loading
// // ─────────────────────────────────────────────
// const LoadingView = ({onNavigate}) => (
//   <View style={S.stateWrap}>
//     <View style={[S.stateIconCircle, {backgroundColor: C.blueLight}]}>
//       <ActivityIndicator size="large" color={C.blue} />
//     </View>
//     <Text style={S.stateTitle}>Getting Your Location</Text>
//     <Text style={S.stateSub}>
//       Verifying GPS signal and checking authorised office zones…
//     </Text>
//     <NavigationFAB activeScreen="Home" onNavigate={onNavigate} />
//   </View>
// );

// // ─────────────────────────────────────────────
// // Full-screen: P2 — GPS off / no fix
// // ─────────────────────────────────────────────
// const GPSUnavailableView = ({onNavigate, onRetry}) => (
//   <View style={S.stateWrap}>
//     <View style={[S.stateIconCircle, {backgroundColor: C.amberLight}]}>
//       <Text style={S.stateEmoji}>🛰</Text>
//     </View>
//     <Text style={S.stateTitle}>GPS Unavailable</Text>
//     <Text style={S.stateSub}>
//       Unable to get your location. Make sure GPS / Location Services are enabled
//       on your device.
//     </Text>
//     <TouchableOpacity
//       style={[S.stateBtn, {marginBottom: 12}]}
//       onPress={() =>
//         Platform.OS === 'android'
//           ? Linking.openSettings()
//           : Linking.openURL('app-settings:')
//       }>
//       <Text style={S.stateBtnTxt}>Open Settings</Text>
//     </TouchableOpacity>
//     <TouchableOpacity
//       style={[
//         S.stateBtn,
//         {backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border},
//       ]}
//       onPress={onRetry}>
//       <Text style={[S.stateBtnTxt, {color: C.ink}]}>Retry</Text>
//     </TouchableOpacity>
//     <NavigationFAB activeScreen="Home" onNavigate={onNavigate} />
//   </View>
// );

// // ─────────────────────────────────────────────
// // Location card
// // ─────────────────────────────────────────────
// const LocationCard = ({
//   matchedFence,
//   locationLoading,
//   locationError,
//   coords,
//   onPress,
// }) => {
//   const matched = !!matchedFence;
//   return (
//     <TouchableOpacity
//       style={[
//         S.locationCard,
//         matched ? S.locationCardGreen : S.locationCardRed,
//       ]}
//       onPress={onPress}
//       activeOpacity={0.75}>
//       <View
//         style={[
//           S.locationBar,
//           {backgroundColor: matched ? C.greenMid : C.redMid},
//         ]}
//       />
//       <View style={S.locationCardBody}>
//         <Text style={S.locationCardLabel}>CURRENT LOCATION</Text>
//         {locationLoading ? (
//           <View style={S.locationCardLoading}>
//             <ActivityIndicator size="small" color={C.blue} />
//             <Text
//               style={[S.locationCardName, {color: C.inkMuted, fontSize: 13}]}>
//               Verifying…
//             </Text>
//           </View>
//         ) : (
//           <>
//             <Text
//               style={[S.locationCardName, !matched && {color: C.redDark}]}
//               numberOfLines={1}>
//               {matched
//                 ? matchedFence.FenceName
//                 : locationError ?? 'No authorised zone matched'}
//             </Text>
//             {matched && matchedFence.distanceMetres != null && (
//               <Text style={S.locationCardMeta}>
//                 ✓ Within zone · {matchedFence.distanceMetres} m away
//               </Text>
//             )}
//             {matched && coords && (
//               <Text style={S.locationCardCoords}>
//                 {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
//                 {coords.accuracy
//                   ? `  ·  ±${Math.round(coords.accuracy)} m`
//                   : ''}
//               </Text>
//             )}
//           </>
//         )}
//       </View>
//       <Text
//         style={[
//           S.locationCardArrow,
//           {color: matched ? C.greenDark : C.redDark},
//         ]}>
//         ›
//       </Text>
//     </TouchableOpacity>
//   );
// };

// // ─────────────────────────────────────────────
// // Main HomeScreen
// // ─────────────────────────────────────────────
// const HomeScreen = ({onNavigate}) => {
//   const [lastOut, setLastOut] = useState(null);
//   const [isActive, setIsActive] = useState(false);
//   const [modalVisible, setModalVisible] = useState(false);

//   const {
//     permissionStatus,
//     locationLoading,
//     locationError,
//     matchedFence,
//     coords,
//     refresh,
//   } = useGeofence();

//   useEffect(() => {
//     (async () => {
//       const records = await loadRecords();
//       if (!records.length) return;
//       const last = records[records.length - 1];
//       if (last.clockOut) setLastOut(last.clockOut);
//       setIsActive(!last.clockOut);
//     })();
//   }, []);

//   // ── P1 — Permission denied ─────────────────────────────
//   if (permissionStatus === 'denied') {
//     return (
//       <SafeAreaView style={S.screen}>
//         <StatusBar barStyle="dark-content" />
//         <PermissionDeniedView onNavigate={onNavigate} />
//       </SafeAreaView>
//     );
//   }

//   // ── P3 — Still loading initial GPS ─────────────────────
//   if (permissionStatus === 'unknown' || (locationLoading && !coords)) {
//     return (
//       <SafeAreaView style={S.screen}>
//         <StatusBar barStyle="dark-content" />
//         <LoadingView onNavigate={onNavigate} />
//       </SafeAreaView>
//     );
//   }

//   // ── P2 — GPS granted but no fix and not loading ─────────
//   // coords is null after loading finishes = GPS off or unavailable
//   if (!locationLoading && !coords && permissionStatus === 'granted') {
//     return (
//       <SafeAreaView style={S.screen}>
//         <StatusBar barStyle="dark-content" />
//         <GPSUnavailableView onNavigate={onNavigate} onRetry={refresh} />
//       </SafeAreaView>
//     );
//   }

//   // ── Normal home ─────────────────────────────────────────
//   // G3, N1 — Warning banner when outside or API error
//   const showWarning = !locationLoading && !!locationError && !matchedFence;

//   return (
//     <SafeAreaView style={S.screen}>
//       <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

//       <ScrollView
//         contentContainerStyle={S.scroll}
//         showsVerticalScrollIndicator={false}>
//         {/* G3, N1 — Warning banner with retry */}
//         {showWarning && (
//           <TouchableOpacity
//             style={S.warningBanner}
//             onPress={refresh}
//             activeOpacity={0.8}>
//             <Text style={S.warningIcon}>⚠️</Text>
//             <View style={{flex: 1}}>
//               <Text style={S.warningTitle}>Location Issue</Text>
//               <Text style={S.warningText} numberOfLines={2}>
//                 {locationError} Tap to retry.
//               </Text>
//             </View>
//           </TouchableOpacity>
//         )}

//         {/* Location card */}
//         <LocationCard
//           matchedFence={matchedFence}
//           locationLoading={locationLoading}
//           locationError={locationError}
//           coords={coords}
//           onPress={() => setModalVisible(true)}
//         />

//         {/* Stats */}
//         <View style={S.statsRow}>
//           <View style={[S.statCard, {backgroundColor: C.greenLight}]}>
//             <Text style={[S.statNum, {color: C.greenDark}]}>
//               {isActive ? 1 : 0}
//             </Text>
//             <Text style={S.statLabel}>In</Text>
//           </View>
//           <View style={[S.statCard, {backgroundColor: C.purpleLight}]}>
//             <Text style={[S.statNum, {color: C.purpleDark}]}>0</Text>
//             <Text style={S.statLabel}>On Break</Text>
//           </View>
//           <View
//             style={[
//               S.statCard,
//               {
//                 backgroundColor: C.surfaceAlt,
//                 borderWidth: 1,
//                 borderColor: C.border,
//               },
//             ]}>
//             <Text style={[S.statNum, {color: C.inkSub}]}>
//               {isActive ? 0 : 1}
//             </Text>
//             <Text style={S.statLabel}>Out</Text>
//           </View>
//         </View>

//         {/* Time Clock card */}
//         <View style={S.card}>
//           <View style={S.cardTitleRow}>
//             <Text style={S.cardTitle}>Time Clock</Text>
//             {isActive && (
//               <View style={S.activePill}>
//                 <View style={S.activePillDot} />
//                 <Text style={S.activePillTxt}>Active</Text>
//               </View>
//             )}
//           </View>
//           <Text style={S.cardSub}>
//             {lastOut
//               ? `Last clocked out at ${formatTime(lastOut)}`
//               : "You haven't clocked in yet today"}
//           </Text>
//           <View style={S.cardDivider} />
//           <TouchableOpacity
//             style={S.cardAction}
//             onPress={() => onNavigate('TimeClock')}>
//             <Text style={S.cardActionTxt}>
//               {isActive ? 'View Time Clock' : 'Clock In Now'}
//             </Text>
//             <Text style={S.cardActionArrow}>→</Text>
//           </TouchableOpacity>
//         </View>

//         {/* Quick actions */}
//         {/* <View style={S.quickRow}>
//           <TouchableOpacity
//             style={[S.quickBtn, {backgroundColor: C.blue}]}
//             onPress={() => onNavigate('TimeClock')}>
//             <Text style={S.quickIcon}>⏱</Text>
//             <Text style={[S.quickTxt, {color: C.white}]}>Time Clock</Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={[
//               S.quickBtn,
//               {
//                 backgroundColor: C.surface,
//                 borderWidth: 1,
//                 borderColor: C.border,
//               },
//             ]}
//             onPress={() => onNavigate('Records')}>
//             <Text style={S.quickIcon}>📋</Text>
//             <Text style={[S.quickTxt, {color: C.blue}]}>Timesheets</Text>
//           </TouchableOpacity>
//         </View> */}
//       </ScrollView>

//       <NavigationFAB activeScreen="Home" onNavigate={onNavigate} />
//       <LocationPickerModal
//         visible={modalVisible}
//         onClose={() => setModalVisible(false)}
//       />
//     </SafeAreaView>
//   );
// };

// export default HomeScreen;

// const S = StyleSheet.create({
//   screen: {flex: 1, backgroundColor: C.bg},
//   scroll: {padding: 16, paddingBottom: 100},

//   stateWrap: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 36,
//     backgroundColor: C.bg,
//   },
//   stateIconCircle: {
//     width: 84,
//     height: 84,
//     borderRadius: 42,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 22,
//     ...Sh.sm,
//   },
//   stateEmoji: {fontSize: 38},
//   stateTitle: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: C.ink,
//     textAlign: 'center',
//     marginBottom: 10,
//   },
//   stateSub: {
//     fontSize: 14,
//     color: C.inkSub,
//     textAlign: 'center',
//     lineHeight: 22,
//     marginBottom: 28,
//   },
//   stateBtn: {
//     backgroundColor: C.blue,
//     paddingHorizontal: 32,
//     paddingVertical: 14,
//     borderRadius: R.full,
//     ...Sh.sm,
//   },
//   stateBtnTxt: {color: C.white, fontWeight: '700', fontSize: 15},

//   greeting: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   greetSub: {fontSize: 13, color: C.inkMuted},
//   greetName: {fontSize: 22, fontWeight: '800', color: C.ink, marginTop: 2},
//   avatar: {
//     width: 46,
//     height: 46,
//     borderRadius: 23,
//     backgroundColor: C.blue,
//     alignItems: 'center',
//     justifyContent: 'center',
//     ...Sh.sm,
//   },
//   avatarLetter: {fontSize: 18, color: C.white, fontWeight: '700'},

//   warningBanner: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 10,
//     backgroundColor: C.amberLight,
//     borderRadius: R.md,
//     padding: 12,
//     marginBottom: 12,
//     borderLeftWidth: 4,
//     borderLeftColor: C.amber,
//     ...Sh.xs,
//   },
//   warningIcon: {fontSize: 18},
//   warningTitle: {fontSize: 13, fontWeight: '600', color: C.ink},
//   warningText: {fontSize: 12, color: C.inkSub, marginTop: 2},

//   locationCard: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderRadius: R.md,
//     marginBottom: 12,
//     overflow: 'hidden',
//     borderWidth: 1.5,
//     ...Sh.sm,
//     backgroundColor: C.surface,
//   },
//   locationCardGreen: {borderColor: C.greenMid},
//   locationCardRed: {borderColor: C.redMid},
//   locationBar: {width: 4, alignSelf: 'stretch'},
//   locationCardBody: {flex: 1, padding: 14},
//   locationCardLabel: {
//     fontSize: 9,
//     fontWeight: '700',
//     color: C.inkFaint,
//     letterSpacing: 1,
//     textTransform: 'uppercase',
//     marginBottom: 4,
//   },
//   locationCardLoading: {flexDirection: 'row', alignItems: 'center', gap: 8},
//   locationCardName: {
//     fontSize: 15,
//     fontWeight: '700',
//     color: C.ink,
//     marginBottom: 2,
//   },
//   locationCardMeta: {fontSize: 12, color: C.greenDark, fontWeight: '500'},
//   locationCardCoords: {fontSize: 11, color: C.inkFaint, marginTop: 3},
//   locationCardArrow: {fontSize: 20, paddingRight: 14},

//   statsRow: {flexDirection: 'row', gap: 10, marginBottom: 12},
//   statCard: {
//     flex: 1,
//     borderRadius: R.md,
//     padding: 14,
//     alignItems: 'center',
//     ...Sh.xs,
//   },
//   statNum: {fontSize: 28, fontWeight: '800'},
//   statLabel: {fontSize: 11, color: C.inkMuted, marginTop: 2, fontWeight: '500'},

//   card: {
//     backgroundColor: C.surface,
//     borderRadius: R.md,
//     padding: 16,
//     marginBottom: 12,
//     borderWidth: 1,
//     borderColor: C.border,
//     ...Sh.xs,
//   },
//   cardTitleRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     marginBottom: 6,
//   },
//   cardTitle: {fontSize: 16, fontWeight: '700', color: C.ink},
//   activePill: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 5,
//     backgroundColor: C.greenLight,
//     paddingHorizontal: 10,
//     paddingVertical: 3,
//     borderRadius: R.full,
//   },
//   activePillDot: {
//     width: 6,
//     height: 6,
//     borderRadius: 3,
//     backgroundColor: C.greenMid,
//   },
//   activePillTxt: {fontSize: 11, fontWeight: '600', color: C.greenDark},
//   cardSub: {fontSize: 13, color: C.inkMuted, lineHeight: 19},
//   cardDivider: {height: 1, backgroundColor: C.border, marginVertical: 12},
//   cardAction: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//   },
//   cardActionTxt: {fontSize: 14, fontWeight: '600', color: C.blue},
//   cardActionArrow: {fontSize: 16, color: C.blue},

//   quickRow: {flexDirection: 'row', gap: 10},
//   quickBtn: {
//     flex: 1,
//     borderRadius: R.md,
//     padding: 16,
//     alignItems: 'center',
//     gap: 6,
//     ...Sh.xs,
//   },
//   quickIcon: {fontSize: 22},
//   quickTxt: {fontSize: 14, fontWeight: '600'},
// });
// ─────────────────────────────────────────────────────────────────────────────
// components/AttendanceManagement/screens/HomeScreen.js
// ─────────────────────────────────────────────────────────────────────────────
/* eslint-disable curly */
/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Linking,
  Platform,
  Dimensions,
} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import {useGeofence} from '../GeofenceContext';
import LocationPickerModal from '../LocationPickerModal';
import NavigationFAB from '../NavigationFAB';
import {
  loadRecords,
  formatTime,
} from '../../../screens/AttendanceManagement/helpers';
import {
  PageBackground,
  AnimatedCard,
  CardHeading,
  SettingRow,
  IconBadge,
  CARD_STAGGER,
} from '../../AppComponentsDesign/Appcomponents';
import {
  conditionalScale,
  conditionalVerticalScale,
  conditionalFontScale,
} from '../../../store/utils/scaling';
import useAppTokens from '../../AppComponentsDesign/useAppTokens';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
// Full-screen: P1 — Permission denied
// ─────────────────────────────────────────────────────────────────────────────
const PermissionDeniedView = ({onNavigate}) => {
  const T = useAppTokens();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: conditionalScale(32, 36, 40, 40),
        backgroundColor: T.pageBg,
      }}>
      <View
        style={{
          width: conditionalScale(80, 84, 88, 88),
          height: conditionalScale(80, 84, 88, 88),
          borderRadius: conditionalScale(40, 42, 44, 44),
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: conditionalVerticalScale(20, 22, 24, 24),
          backgroundColor: T.redBg,
        }}>
        <FeatherIcon
          name="map-pin"
          size={conditionalFontScale(36, 38, 40, 40)}
          color={T.red}
        />
      </View>
      <Text
        style={{
          fontSize: conditionalFontScale(16, 17, 18, 18),
          fontWeight: '700',
          color: T.titleText,
          textAlign: 'center',
          marginBottom: conditionalVerticalScale(8, 9, 10, 10),
        }}>
        Location Access Required
      </Text>
      <Text
        style={{
          fontSize: conditionalFontScale(13, 13, 14, 14),
          color: T.subtitleText,
          textAlign: 'center',
          lineHeight: conditionalFontScale(20, 21, 22, 22),
          marginBottom: conditionalVerticalScale(26, 28, 30, 30),
          paddingHorizontal: conditionalScale(16, 18, 20, 20),
        }}>
        Attendance tracking needs your location to confirm you're at an
        authorised office zone before clocking in or out.
      </Text>
      <TouchableOpacity
        style={{
          backgroundColor: T.blue,
          paddingHorizontal: conditionalScale(28, 30, 32, 32),
          paddingVertical: conditionalVerticalScale(12, 13, 14, 14),
          borderRadius: conditionalScale(20, 22, 24, 24),
          shadowColor: T.shadowColor,
          shadowOffset: {width: 0, height: 2},
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3,
        }}
        onPress={() =>
          Platform.OS === 'android'
            ? Linking.openSettings()
            : Linking.openURL('app-settings:')
        }>
        <Text
          style={{
            color: '#FFFFFF',
            fontWeight: '700',
            fontSize: conditionalFontScale(14, 14, 15, 15),
          }}>
          Open Settings
        </Text>
      </TouchableOpacity>
      <NavigationFAB activeScreen="Home" onNavigate={onNavigate} />
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Full-screen: P3 — GPS loading
// ─────────────────────────────────────────────────────────────────────────────
const LoadingView = ({onNavigate}) => {
  const T = useAppTokens();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: conditionalScale(32, 36, 40, 40),
        backgroundColor: T.pageBg,
      }}>
      <View
        style={{
          width: conditionalScale(80, 84, 88, 88),
          height: conditionalScale(80, 84, 88, 88),
          borderRadius: conditionalScale(40, 42, 44, 44),
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: conditionalVerticalScale(20, 22, 24, 24),
          backgroundColor: T.blueBg,
        }}>
        <ActivityIndicator size="large" color={T.blue} />
      </View>
      <Text
        style={{
          fontSize: conditionalFontScale(16, 17, 18, 18),
          fontWeight: '700',
          color: T.titleText,
          textAlign: 'center',
          marginBottom: conditionalVerticalScale(8, 9, 10, 10),
        }}>
        Getting Your Location
      </Text>
      <Text
        style={{
          fontSize: conditionalFontScale(13, 13, 14, 14),
          color: T.subtitleText,
          textAlign: 'center',
          lineHeight: conditionalFontScale(20, 21, 22, 22),
        }}>
        Verifying GPS signal and checking authorised office zones…
      </Text>
      <NavigationFAB activeScreen="Home" onNavigate={onNavigate} />
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Full-screen: P2 — GPS off / no fix
// ─────────────────────────────────────────────────────────────────────────────
const GPSUnavailableView = ({onNavigate, onRetry}) => {
  const T = useAppTokens();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: conditionalScale(32, 36, 40, 40),
        backgroundColor: T.pageBg,
      }}>
      <View
        style={{
          width: conditionalScale(80, 84, 88, 88),
          height: conditionalScale(80, 84, 88, 88),
          borderRadius: conditionalScale(40, 42, 44, 44),
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: conditionalVerticalScale(20, 22, 24, 24),
          backgroundColor: T.amberBg,
        }}>
        <FeatherIcon
          name="navigation"
          size={conditionalFontScale(36, 38, 40, 40)}
          color={T.amber}
        />
      </View>
      <Text
        style={{
          fontSize: conditionalFontScale(16, 17, 18, 18),
          fontWeight: '700',
          color: T.titleText,
          textAlign: 'center',
          marginBottom: conditionalVerticalScale(8, 9, 10, 10),
        }}>
        GPS Unavailable
      </Text>
      <Text
        style={{
          fontSize: conditionalFontScale(13, 13, 14, 14),
          color: T.subtitleText,
          textAlign: 'center',
          lineHeight: conditionalFontScale(20, 21, 22, 22),
          marginBottom: conditionalVerticalScale(26, 28, 30, 30),
          paddingHorizontal: conditionalScale(16, 18, 20, 20),
        }}>
        Unable to get your location. Make sure GPS / Location Services are
        enabled on your device.
      </Text>
      <TouchableOpacity
        style={{
          backgroundColor: T.blue,
          paddingHorizontal: conditionalScale(28, 30, 32, 32),
          paddingVertical: conditionalVerticalScale(12, 13, 14, 14),
          borderRadius: conditionalScale(20, 22, 24, 24),
          marginBottom: conditionalVerticalScale(10, 11, 12, 12),
          shadowColor: T.shadowColor,
          shadowOffset: {width: 0, height: 2},
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3,
        }}
        onPress={() =>
          Platform.OS === 'android'
            ? Linking.openSettings()
            : Linking.openURL('app-settings:')
        }>
        <Text
          style={{
            color: '#FFFFFF',
            fontWeight: '700',
            fontSize: conditionalFontScale(14, 14, 15, 15),
          }}>
          Open Settings
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          backgroundColor: T.cardBg,
          paddingHorizontal: conditionalScale(28, 30, 32, 32),
          paddingVertical: conditionalVerticalScale(12, 13, 14, 14),
          borderRadius: conditionalScale(20, 22, 24, 24),
          borderWidth: 1,
          borderColor: T.cardDivider,
        }}
        onPress={onRetry}>
        <Text
          style={{
            color: T.titleText,
            fontWeight: '700',
            fontSize: conditionalFontScale(14, 14, 15, 15),
          }}>
          Retry
        </Text>
      </TouchableOpacity>
      <NavigationFAB activeScreen="Home" onNavigate={onNavigate} />
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Location Status Banner
// ─────────────────────────────────────────────────────────────────────────────
const LocationBanner = ({
  matchedFence,
  locationLoading,
  locationError,
  coords,
  onPress,
}) => {
  const T = useAppTokens();
  const matched = !!matchedFence;

  return (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: matched ? T.greenBg : T.redBg,
        borderRadius: conditionalScale(10, 11, 12, 12),
        padding: conditionalScale(12, 13, 14, 14),
        marginBottom: conditionalVerticalScale(14, 15, 16, 16),
        borderLeftWidth: 4,
        borderLeftColor: matched ? T.green : T.red,
      }}
      onPress={onPress}
      activeOpacity={0.7}>
      <View
        style={{
          width: conditionalScale(36, 38, 40, 40),
          height: conditionalScale(36, 38, 40, 40),
          borderRadius: conditionalScale(18, 19, 20, 20),
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: matched ? T.green : T.red,
          marginRight: conditionalScale(10, 11, 12, 12),
        }}>
        {locationLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <FeatherIcon
            name={matched ? 'check-circle' : 'alert-circle'}
            size={conditionalFontScale(18, 19, 20, 20)}
            color="#FFFFFF"
          />
        )}
      </View>
      <View style={{flex: 1}}>
        <Text
          style={{
            fontSize: conditionalFontScale(8, 8, 9, 9),
            fontWeight: '700',
            color: matched ? T.green : T.red,
            letterSpacing: 0.8,
            marginBottom: 2,
          }}>
          {locationLoading ? 'VERIFYING' : 'CURRENT LOCATION'}
        </Text>
        <Text
          style={{
            fontSize: conditionalFontScale(13, 13, 14, 14),
            fontWeight: '600',
            color: matched ? T.green : T.red,
          }}
          numberOfLines={1}>
          {locationLoading
            ? 'Checking location…'
            : matched
            ? matchedFence.FenceName
            : locationError ?? 'No authorised zone matched'}
        </Text>
        {matched && matchedFence.distanceMetres != null && (
          <Text
            style={{
              fontSize: conditionalFontScale(10, 10, 11, 11),
              color: matched ? T.green : T.red,
              marginTop: 2,
              opacity: 0.8,
            }}>
            Within zone · {matchedFence.distanceMetres}m away
          </Text>
        )}
      </View>
      <FeatherIcon
        name="chevron-right"
        size={conditionalFontScale(16, 17, 18, 18)}
        color={matched ? T.green : T.red}
      />
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Today's Shift Card
// ─────────────────────────────────────────────────────────────────────────────
const TodayShiftCard = ({isActive, lastOut, onNavigate}) => {
  const T = useAppTokens();
  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();

  // Mock shift data - replace with real data
  const shiftStart = '09:00 AM';
  const shiftEnd = '06:00 PM';
  const todayDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  // Calculate hours worked today (mock)
  const hoursWorked = isActive ? '5.2' : '8.5';

  return (
    <AnimatedCard delay={CARD_STAGGER * 0}>
      <View
        style={{
          padding: conditionalScale(16, 17, 18, 18),
        }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: conditionalVerticalScale(14, 15, 16, 16),
          }}>
          <View style={{flex: 1}}>
            <Text
              style={{
                fontSize: conditionalFontScale(9, 9, 10, 10),
                fontWeight: '700',
                color: T.titleText,
                letterSpacing: 1,
                marginBottom: 4,
              }}>
              TODAY'S SHIFT
            </Text>
            <Text
              style={{
                fontSize: conditionalFontScale(11, 11, 12, 12),
                color: T.titleText,
                marginBottom: 6,
              }}>
              {todayDate}
            </Text>
            <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
              <Text
                style={{
                  fontSize: conditionalFontScale(11, 12, 14, 16),
                  fontWeight: '800',
                  color: T.titleText,
                }}>
                {shiftStart}
              </Text>
              <Text
                style={{
                  fontSize: conditionalFontScale(16, 17, 18, 18),
                  fontWeight: '600',
                  color: T.subtitleText,
                  marginHorizontal: conditionalScale(6, 7, 8, 8),
                }}>
                -
              </Text>
              <Text
                style={{
                  fontSize: conditionalFontScale(11, 12, 14, 16),
                  fontWeight: '800',
                  color: T.titleText,
                }}>
                {shiftEnd}
              </Text>
            </View>
          </View>
          {isActive && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: T.greenBg,
                paddingHorizontal: conditionalScale(11, 12, 13, 13),
                paddingVertical: conditionalVerticalScale(6, 7, 7, 7),
                borderRadius: conditionalScale(18, 19, 20, 20),
              }}>
              <View
                style={{
                  width: conditionalScale(7, 7, 8, 8),
                  height: conditionalScale(7, 7, 8, 8),
                  borderRadius: conditionalScale(4, 4, 4, 4),
                  backgroundColor: T.green,
                  marginRight: conditionalScale(6, 7, 7, 7),
                }}
              />
              <Text
                style={{
                  fontSize: conditionalFontScale(11, 11, 12, 12),
                  fontWeight: '600',
                  color: T.green,
                }}>
                Active
              </Text>
            </View>
          )}
        </View>

        {/* Hours worked today */}
        <View
          style={{
            backgroundColor: T.blueBg,
            borderRadius: conditionalScale(8, 9, 10, 10),
            padding: conditionalScale(12, 13, 14, 14),
            marginBottom: conditionalVerticalScale(14, 15, 16, 16),
          }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
            <View>
              <Text
                style={{
                  fontSize: conditionalFontScale(10, 10, 11, 11),
                  color: T.blue,
                  fontWeight: '500',
                  marginBottom: 2,
                }}>
                Hours Worked Today
              </Text>
              <Text
                style={{
                  fontSize: conditionalFontScale(14, 16, 18, 18),
                  fontWeight: '800',
                  color: T.blue,
                }}>
                {hoursWorked}
                <Text
                  style={{
                    fontSize: conditionalFontScale(12, 13, 14, 14),
                    fontWeight: '500',
                  }}>
                  {' '}
                  hrs
                </Text>
              </Text>
            </View>
            <View
              style={{
                width: conditionalScale(46, 48, 50, 50),
                height: conditionalScale(46, 48, 50, 50),
                borderRadius: conditionalScale(23, 24, 25, 25),
                backgroundColor: T.blue,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <FeatherIcon
                name="clock"
                size={conditionalFontScale(22, 23, 24, 24)}
                color="#FFFFFF"
              />
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isActive ? T.cardBg : T.blue,
            paddingVertical: conditionalVerticalScale(13, 14, 15, 15),
            borderRadius: conditionalScale(10, 11, 12, 12),
            borderWidth: isActive ? 1 : 0,
            borderColor: T.cardDivider,
          }}
          onPress={() => onNavigate('TimeClock')}
          activeOpacity={0.7}>
          <FeatherIcon
            name={isActive ? 'activity' : 'log-in'}
            size={conditionalFontScale(16, 17, 18, 18)}
            color={isActive ? T.blue : '#FFFFFF'}
            style={{marginRight: conditionalScale(8, 9, 10, 10)}}
          />
          <Text
            style={{
              fontSize: conditionalFontScale(14, 14, 15, 15),
              fontWeight: '700',
              color: isActive ? T.blue : '#FFFFFF',
            }}>
            {isActive ? 'View Time Clock' : 'Clock In Now'}
          </Text>
        </TouchableOpacity>
      </View>
    </AnimatedCard>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Stats Card
// ─────────────────────────────────────────────────────────────────────────────
const StatsCard = ({isActive}) => {
  const T = useAppTokens();

  const StatItem = ({icon, iconColor, iconBg, label, value, valueColor}) => (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        paddingVertical: conditionalVerticalScale(16, 17, 18, 18),
      }}>
      <View
        style={{
          width: conditionalScale(50, 52, 54, 54),
          height: conditionalScale(50, 52, 54, 54),
          borderRadius: conditionalScale(25, 26, 27, 27),
          backgroundColor: iconBg,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: conditionalVerticalScale(10, 11, 12, 12),
        }}>
        <FeatherIcon
          name={icon}
          size={conditionalFontScale(24, 25, 26, 26)}
          color={iconColor}
        />
      </View>
      <Text
        style={{
          fontSize: conditionalFontScale(22, 24, 26, 26),
          fontWeight: '800',
          color: valueColor,
          marginBottom: 4,
        }}>
        {value}
      </Text>
      <Text
        style={{
          fontSize: conditionalFontScale(11, 11, 12, 12),
          color: T.subtitleText,
          fontWeight: '600',
        }}>
        {label}
      </Text>
    </View>
  );

  return (
    <AnimatedCard delay={CARD_STAGGER * 1}>
      <View
        style={{
          paddingTop: conditionalVerticalScale(4, 5, 6, 6),
        }}>
        <Text
          style={{
            fontSize: conditionalFontScale(9, 9, 10, 10),
            fontWeight: '700',
            color: T.titleText,
            letterSpacing: 1,
            paddingHorizontal: conditionalScale(20, 20, 20, 20),
            paddingBottom: conditionalVerticalScale(12, 13, 14, 14),
            marginTop: conditionalVerticalScale(8, 10, 12, 12), // 👈 ADD THIS
          }}>
          TODAY'S SUMMARY
        </Text>
        <View style={{flexDirection: 'row'}}>
          <StatItem
            icon="log-in"
            iconColor={T.green}
            iconBg={T.greenBg}
            label="In"
            value={isActive ? '1' : '0'}
            valueColor={T.green}
          />
          <View
            style={{
              width: 1,
              backgroundColor: T.rowDivider,
              marginVertical: conditionalVerticalScale(14, 15, 16, 16),
            }}
          />
          <StatItem
            icon="coffee"
            iconColor={T.purple}
            iconBg={T.purpleBg}
            label="Break"
            value="0"
            valueColor={T.purple}
          />
          <View
            style={{
              width: 1,
              backgroundColor: T.rowDivider,
              marginVertical: conditionalVerticalScale(14, 15, 16, 16),
            }}
          />
          <StatItem
            icon="log-out"
            iconColor={T.subtitleText}
            iconBg={T.slateBg}
            label="Out"
            value={isActive ? '0' : '1'}
            valueColor={T.subtitleText}
          />
        </View>
      </View>
    </AnimatedCard>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Weekly Hours Chart Card
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Weekly Hours Chart Card - Stacked Hours with Color Legend
// ─────────────────────────────────────────────────────────────────────────────
const WeeklyHoursCard = () => {
  const T = useAppTokens();

  // Mock data with breakdown - replace with real data
  const weekData = [
    {day: 'M', worked: 7.0, break: 1.0, overtime: 0.5},
    {day: 'T', worked: 6.5, break: 1.0, overtime: 0.3},
    {day: 'W', worked: 8.0, break: 0.5, overtime: 0.5},
    {day: 'T', worked: 7.2, break: 1.0, overtime: 0},
    {day: 'F', worked: 5.5, break: 1.0, overtime: 0},
    {day: 'S', worked: 0, break: 0, overtime: 0},
    {day: 'S', worked: 0, break: 0, overtime: 0},
  ];

  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const maxTotalHours = 10; // Max scale for bar height

  // Legend Item Component
  const LegendItem = ({color, label}) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: conditionalScale(8, 9, 10, 10),
      }}>
      <View
        style={{
          width: conditionalScale(10, 11, 12, 12),
          height: conditionalScale(10, 11, 12, 12),
          borderRadius: conditionalScale(2, 2, 3, 3),
          backgroundColor: color,
          marginRight: conditionalScale(5, 6, 7, 7),
        }}
      />
      <Text
        style={{
          fontSize: conditionalFontScale(10, 11, 12, 12),
          color: T.titleText,
          fontWeight: '500',
        }}>
        {label}
      </Text>
    </View>
  );

  return (
    <AnimatedCard delay={CARD_STAGGER * 2}>
      <View style={{padding: conditionalScale(16, 17, 18, 18)}}>
        {/* Header - Only "This Week" */}
        <View
          style={{
            marginBottom: conditionalVerticalScale(16, 17, 18, 18),
          }}>
          <Text
            style={{
              fontSize: conditionalFontScale(11, 12, 13, 13),
              fontWeight: '700',
              color: T.titleText,
            }}>
            This Week
          </Text>
        </View>

        {/* Stacked Bar Chart */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            paddingHorizontal: conditionalScale(4, 5, 6, 6),
            marginBottom: conditionalVerticalScale(16, 17, 18, 18),
          }}>
          {weekData.map((item, index) => {
            const isToday = index === todayIndex;
            const totalHours = item.worked + item.break + item.overtime;
            const hasData = totalHours > 0;

            // Calculate heights proportional to max
            const getHeight = hours =>
              hasData
                ? (hours / maxTotalHours) *
                  conditionalVerticalScale(50, 55, 60, 60)
                : 0;

            return (
              <View key={index} style={{alignItems: 'center', flex: 1}}>
                {/* Stacked Bar Container */}
                <View
                  style={{
                    width: conditionalScale(10, 11, 12, 12),
                    height: conditionalVerticalScale(50, 55, 60, 60),
                    justifyContent: 'flex-end',
                    marginBottom: conditionalVerticalScale(8, 9, 10, 10),
                    opacity: isToday ? 1 : hasData ? 0.9 : 0.3,
                  }}>
                  {/* Overtime - Red (top) */}
                  {item.overtime > 0 && (
                    <View
                      style={{
                        width: '100%',
                        height: getHeight(item.overtime),
                        backgroundColor: T.red,
                        borderTopLeftRadius: conditionalScale(2, 2, 3, 3),
                        borderTopRightRadius: conditionalScale(2, 2, 3, 3),
                      }}
                    />
                  )}

                  {/* Break - Orange (middle) */}
                  {item.break > 0 && (
                    <View
                      style={{
                        width: '100%',
                        height: getHeight(item.break),
                        backgroundColor: T.amber,
                      }}
                    />
                  )}

                  {/* Worked - Green (bottom) */}
                  {item.worked > 0 && (
                    <View
                      style={{
                        width: '100%',
                        height: getHeight(item.worked),
                        backgroundColor: T.green,
                        borderBottomLeftRadius: conditionalScale(2, 2, 3, 3),
                        borderBottomRightRadius: conditionalScale(2, 2, 3, 3),
                      }}
                    />
                  )}

                  {/* Empty state placeholder */}
                  {!hasData && (
                    <View
                      style={{
                        width: '100%',
                        height: conditionalVerticalScale(4, 4, 5, 5),
                        backgroundColor: T.rowDivider,
                        borderRadius: conditionalScale(2, 2, 3, 3),
                      }}
                    />
                  )}
                </View>

                {/* Day */}
                <Text
                  style={{
                    fontSize: conditionalFontScale(11, 12, 13, 13),
                    fontWeight: isToday ? '700' : '600',
                    color: isToday
                      ? T.indigo
                      : hasData
                      ? T.titleText
                      : T.emptyText,
                  }}>
                  {item.day}
                </Text>

                {/* Total Hours */}
                <Text
                  style={{
                    fontSize: conditionalFontScale(9, 10, 10, 10),
                    color: T.subtitleText,
                    marginTop: conditionalVerticalScale(3, 4, 4, 4),
                    fontWeight: hasData ? '600' : '400',
                  }}>
                  {hasData ? totalHours.toFixed(1) : '—'}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Color Legend */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: conditionalVerticalScale(8, 9, 10, 10),
            borderTopWidth: 1,
            borderTopColor: T.cardDivider,
          }}>
          <LegendItem color={T.green} label="Worked hours" />
          <LegendItem color={T.amber} label="Breaks" />
          <LegendItem color={T.red} label="Overtime" />
        </View>
      </View>
    </AnimatedCard>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Upcoming Holidays Card - Minimal with Blue Dates
// ─────────────────────────────────────────────────────────────────────────────
const UpcomingHolidaysCard = () => {
  const T = useAppTokens();

  const holidays = [
    {name: 'Labour Day', date: 'May 1', daysUntil: 12},
    {name: 'Eid ul-Fitr', date: 'May 10–12', daysUntil: 21},
  ];

  return (
    <AnimatedCard delay={CARD_STAGGER * 3} style={{marginBottom: 0}}>
      <View style={{padding: conditionalScale(16, 17, 18, 18)}}>
        {/* Header */}
        <Text
          style={{
            fontSize: conditionalFontScale(11, 11, 12, 12),
            fontWeight: '600',
            color: T.titleText,
            marginBottom: conditionalVerticalScale(12, 13, 14, 14),
          }}>
          Upcoming Holidays
        </Text>

        {/* Holiday Items */}
        {holidays.map((holiday, index) => (
          <View
            key={index}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom:
                index === holidays.length - 1
                  ? 0
                  : conditionalVerticalScale(16, 17, 18, 18),
            }}>
            {/* Date Block - Blue */}
            <View
              style={{
                width: conditionalScale(44, 46, 48, 48),
                alignItems: 'center',
                marginRight: conditionalScale(12, 13, 14, 14),
              }}>
              <Text
                style={{
                  fontSize: conditionalFontScale(20, 21, 22, 22),
                  fontWeight: '700',
                  color: T.indigo, // Blue day number
                  lineHeight: conditionalFontScale(24, 25, 26, 26),
                }}>
                {holiday.date.split(' ')[1].replace('–12', '')}
              </Text>
              <Text
                style={{
                  fontSize: conditionalFontScale(11, 11, 12, 12),
                  color: T.indigo, // Blue month
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  opacity: 0.8,
                }}>
                {holiday.date.split(' ')[0]}
              </Text>
            </View>

            {/* Divider */}
            <View
              style={{
                width: 2,
                height: conditionalScale(32, 34, 36, 36),
                backgroundColor: T.rowDivider,
                borderRadius: 1,
                marginRight: conditionalScale(12, 13, 14, 14),
              }}
            />

            {/* Info */}
            <View style={{flex: 1}}>
              <Text
                style={{
                  fontSize: conditionalFontScale(14, 14, 15, 15),
                  fontWeight: '600',
                  color: T.titleText,
                  marginBottom: 2,
                }}>
                {holiday.name}
              </Text>
              <Text
                style={{
                  fontSize: conditionalFontScale(12, 12, 13, 13),
                  color: T.subtitleText,
                }}>
                in {holiday.daysUntil} days
              </Text>
            </View>
          </View>
        ))}
      </View>
    </AnimatedCard>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main HomeScreen
// ─────────────────────────────────────────────────────────────────────────────
const HomeScreen = ({onNavigate}) => {
  const T = useAppTokens();
  const [lastOut, setLastOut] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const {
    permissionStatus,
    locationLoading,
    locationError,
    matchedFence,
    coords,
    refresh,
  } = useGeofence();

  useEffect(() => {
    (async () => {
      const records = await loadRecords();
      if (!records.length) return;
      const last = records[records.length - 1];
      if (last.clockOut) setLastOut(last.clockOut);
      setIsActive(!last.clockOut);
    })();
  }, []);

  // ── P1 — Permission denied ─────────────────────────────
  if (permissionStatus === 'denied') {
    return (
      <SafeAreaView style={{flex: 1, backgroundColor: T.pageBg}}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={T.pageBg}
          translucent={false}
        />
        <PermissionDeniedView onNavigate={onNavigate} />
      </SafeAreaView>
    );
  }

  // ── P3 — Still loading initial GPS ─────────────────────
  if (permissionStatus === 'unknown' || (locationLoading && !coords)) {
    return (
      <SafeAreaView style={{flex: 1, backgroundColor: T.pageBg}}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={T.pageBg}
          translucent={false}
        />
        <LoadingView onNavigate={onNavigate} />
      </SafeAreaView>
    );
  }

  // ── P2 — GPS granted but no fix and not loading ─────────
  if (!locationLoading && !coords && permissionStatus === 'granted') {
    return (
      <SafeAreaView style={{flex: 1, backgroundColor: T.pageBg}}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={T.pageBg}
          translucent={false}
        />
        <GPSUnavailableView onNavigate={onNavigate} onRetry={refresh} />
      </SafeAreaView>
    );
  }

  // ── Normal home ─────────────────────────────────────────
  return (
    <PageBackground>
      <SafeAreaView style={{flex: 1}}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={T.pageBg}
          translucent={false}
        />

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: conditionalScale(4, 6, 8, 8),
            paddingVertical: conditionalScale(12, 13, 14, 14),
            paddingBottom: conditionalVerticalScale(10, 10, 10, 10),
          }}
          showsVerticalScrollIndicator={false}>
          {/* Location Banner */}
          <LocationBanner
            matchedFence={matchedFence}
            locationLoading={locationLoading}
            locationError={locationError}
            coords={coords}
            onPress={() => setModalVisible(true)}
          />

          {/* Today's Shift */}
          <TodayShiftCard
            isActive={isActive}
            lastOut={lastOut}
            onNavigate={onNavigate}
          />

          {/* Stats */}
          <StatsCard isActive={isActive} />

          {/* Weekly Hours Chart */}
          <WeeklyHoursCard />

          {/* Upcoming Holidays */}
          <UpcomingHolidaysCard />
        </ScrollView>

        <NavigationFAB activeScreen="Home" onNavigate={onNavigate} />
        <LocationPickerModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
        />
      </SafeAreaView>
    </PageBackground>
  );
};

export default HomeScreen;
