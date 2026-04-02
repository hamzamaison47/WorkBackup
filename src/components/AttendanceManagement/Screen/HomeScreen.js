// ─────────────────────────────────────────────
// components/AttendanceManagement/screens/HomeScreen.js
// ─────────────────────────────────────────────
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
  StyleSheet,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import {useGeofence} from '../GeofenceContext';
import LocationPickerModal from '../LocationPickerModal';
import NavigationFAB from '../NavigationFAB';
import {
  loadRecords,
  formatTime,
} from '../../../screens/AttendanceManagement/helpers';
import {C, R, Sh} from '../theme';

// ─────────────────────────────────────────────
// Full-screen: P1 — Permission denied
// ─────────────────────────────────────────────
const PermissionDeniedView = ({onNavigate}) => (
  <View style={S.stateWrap}>
    <View style={[S.stateIconCircle, {backgroundColor: C.redLight}]}>
      <Text style={S.stateEmoji}>📍</Text>
    </View>
    <Text style={S.stateTitle}>Location Access Required</Text>
    <Text style={S.stateSub}>
      Attendance tracking needs your location to confirm you're at an authorised
      office zone before clocking in or out.
    </Text>
    <TouchableOpacity
      style={S.stateBtn}
      onPress={() =>
        Platform.OS === 'android'
          ? Linking.openSettings()
          : Linking.openURL('app-settings:')
      }>
      <Text style={S.stateBtnTxt}>Open Settings</Text>
    </TouchableOpacity>
    <NavigationFAB activeScreen="Home" onNavigate={onNavigate} />
  </View>
);

// ─────────────────────────────────────────────
// Full-screen: P3 — GPS loading
// ─────────────────────────────────────────────
const LoadingView = ({onNavigate}) => (
  <View style={S.stateWrap}>
    <View style={[S.stateIconCircle, {backgroundColor: C.blueLight}]}>
      <ActivityIndicator size="large" color={C.blue} />
    </View>
    <Text style={S.stateTitle}>Getting Your Location</Text>
    <Text style={S.stateSub}>
      Verifying GPS signal and checking authorised office zones…
    </Text>
    <NavigationFAB activeScreen="Home" onNavigate={onNavigate} />
  </View>
);

// ─────────────────────────────────────────────
// Full-screen: P2 — GPS off / no fix
// ─────────────────────────────────────────────
const GPSUnavailableView = ({onNavigate, onRetry}) => (
  <View style={S.stateWrap}>
    <View style={[S.stateIconCircle, {backgroundColor: C.amberLight}]}>
      <Text style={S.stateEmoji}>🛰</Text>
    </View>
    <Text style={S.stateTitle}>GPS Unavailable</Text>
    <Text style={S.stateSub}>
      Unable to get your location. Make sure GPS / Location Services are enabled
      on your device.
    </Text>
    <TouchableOpacity
      style={[S.stateBtn, {marginBottom: 12}]}
      onPress={() =>
        Platform.OS === 'android'
          ? Linking.openSettings()
          : Linking.openURL('app-settings:')
      }>
      <Text style={S.stateBtnTxt}>Open Settings</Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[
        S.stateBtn,
        {backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border},
      ]}
      onPress={onRetry}>
      <Text style={[S.stateBtnTxt, {color: C.ink}]}>Retry</Text>
    </TouchableOpacity>
    <NavigationFAB activeScreen="Home" onNavigate={onNavigate} />
  </View>
);

// ─────────────────────────────────────────────
// Location card
// ─────────────────────────────────────────────
const LocationCard = ({
  matchedFence,
  locationLoading,
  locationError,
  coords,
  onPress,
}) => {
  const matched = !!matchedFence;
  return (
    <TouchableOpacity
      style={[
        S.locationCard,
        matched ? S.locationCardGreen : S.locationCardRed,
      ]}
      onPress={onPress}
      activeOpacity={0.75}>
      <View
        style={[
          S.locationBar,
          {backgroundColor: matched ? C.greenMid : C.redMid},
        ]}
      />
      <View style={S.locationCardBody}>
        <Text style={S.locationCardLabel}>CURRENT LOCATION</Text>
        {locationLoading ? (
          <View style={S.locationCardLoading}>
            <ActivityIndicator size="small" color={C.blue} />
            <Text
              style={[S.locationCardName, {color: C.inkMuted, fontSize: 13}]}>
              Verifying…
            </Text>
          </View>
        ) : (
          <>
            <Text
              style={[S.locationCardName, !matched && {color: C.redDark}]}
              numberOfLines={1}>
              {matched
                ? matchedFence.FenceName
                : locationError ?? 'No authorised zone matched'}
            </Text>
            {matched && matchedFence.distanceMetres != null && (
              <Text style={S.locationCardMeta}>
                ✓ Within zone · {matchedFence.distanceMetres} m away
              </Text>
            )}
            {matched && coords && (
              <Text style={S.locationCardCoords}>
                {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
                {coords.accuracy
                  ? `  ·  ±${Math.round(coords.accuracy)} m`
                  : ''}
              </Text>
            )}
          </>
        )}
      </View>
      <Text
        style={[
          S.locationCardArrow,
          {color: matched ? C.greenDark : C.redDark},
        ]}>
        ›
      </Text>
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────
// Main HomeScreen
// ─────────────────────────────────────────────
const HomeScreen = ({onNavigate}) => {
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
      <SafeAreaView style={S.screen}>
        <StatusBar barStyle="dark-content" />
        <PermissionDeniedView onNavigate={onNavigate} />
      </SafeAreaView>
    );
  }

  // ── P3 — Still loading initial GPS ─────────────────────
  if (permissionStatus === 'unknown' || (locationLoading && !coords)) {
    return (
      <SafeAreaView style={S.screen}>
        <StatusBar barStyle="dark-content" />
        <LoadingView onNavigate={onNavigate} />
      </SafeAreaView>
    );
  }

  // ── P2 — GPS granted but no fix and not loading ─────────
  // coords is null after loading finishes = GPS off or unavailable
  if (!locationLoading && !coords && permissionStatus === 'granted') {
    return (
      <SafeAreaView style={S.screen}>
        <StatusBar barStyle="dark-content" />
        <GPSUnavailableView onNavigate={onNavigate} onRetry={refresh} />
      </SafeAreaView>
    );
  }

  // ── Normal home ─────────────────────────────────────────
  // G3, N1 — Warning banner when outside or API error
  const showWarning = !locationLoading && !!locationError && !matchedFence;

  return (
    <SafeAreaView style={S.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <ScrollView
        contentContainerStyle={S.scroll}
        showsVerticalScrollIndicator={false}>
        {/* G3, N1 — Warning banner with retry */}
        {showWarning && (
          <TouchableOpacity
            style={S.warningBanner}
            onPress={refresh}
            activeOpacity={0.8}>
            <Text style={S.warningIcon}>⚠️</Text>
            <View style={{flex: 1}}>
              <Text style={S.warningTitle}>Location Issue</Text>
              <Text style={S.warningText} numberOfLines={2}>
                {locationError} Tap to retry.
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Location card */}
        <LocationCard
          matchedFence={matchedFence}
          locationLoading={locationLoading}
          locationError={locationError}
          coords={coords}
          onPress={() => setModalVisible(true)}
        />

        {/* Stats */}
        <View style={S.statsRow}>
          <View style={[S.statCard, {backgroundColor: C.greenLight}]}>
            <Text style={[S.statNum, {color: C.greenDark}]}>
              {isActive ? 1 : 0}
            </Text>
            <Text style={S.statLabel}>In</Text>
          </View>
          <View style={[S.statCard, {backgroundColor: C.purpleLight}]}>
            <Text style={[S.statNum, {color: C.purpleDark}]}>0</Text>
            <Text style={S.statLabel}>On Break</Text>
          </View>
          <View
            style={[
              S.statCard,
              {
                backgroundColor: C.surfaceAlt,
                borderWidth: 1,
                borderColor: C.border,
              },
            ]}>
            <Text style={[S.statNum, {color: C.inkSub}]}>
              {isActive ? 0 : 1}
            </Text>
            <Text style={S.statLabel}>Out</Text>
          </View>
        </View>

        {/* Time Clock card */}
        <View style={S.card}>
          <View style={S.cardTitleRow}>
            <Text style={S.cardTitle}>Time Clock</Text>
            {isActive && (
              <View style={S.activePill}>
                <View style={S.activePillDot} />
                <Text style={S.activePillTxt}>Active</Text>
              </View>
            )}
          </View>
          <Text style={S.cardSub}>
            {lastOut
              ? `Last clocked out at ${formatTime(lastOut)}`
              : "You haven't clocked in yet today"}
          </Text>
          <View style={S.cardDivider} />
          <TouchableOpacity
            style={S.cardAction}
            onPress={() => onNavigate('TimeClock')}>
            <Text style={S.cardActionTxt}>
              {isActive ? 'View Time Clock' : 'Clock In Now'}
            </Text>
            <Text style={S.cardActionArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Quick actions */}
        {/* <View style={S.quickRow}>
          <TouchableOpacity
            style={[S.quickBtn, {backgroundColor: C.blue}]}
            onPress={() => onNavigate('TimeClock')}>
            <Text style={S.quickIcon}>⏱</Text>
            <Text style={[S.quickTxt, {color: C.white}]}>Time Clock</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              S.quickBtn,
              {
                backgroundColor: C.surface,
                borderWidth: 1,
                borderColor: C.border,
              },
            ]}
            onPress={() => onNavigate('Records')}>
            <Text style={S.quickIcon}>📋</Text>
            <Text style={[S.quickTxt, {color: C.blue}]}>Timesheets</Text>
          </TouchableOpacity>
        </View> */}
      </ScrollView>

      <NavigationFAB activeScreen="Home" onNavigate={onNavigate} />
      <LocationPickerModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
};

export default HomeScreen;

const S = StyleSheet.create({
  screen: {flex: 1, backgroundColor: C.bg},
  scroll: {padding: 16, paddingBottom: 100},

  stateWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
    backgroundColor: C.bg,
  },
  stateIconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
    ...Sh.sm,
  },
  stateEmoji: {fontSize: 38},
  stateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: C.ink,
    textAlign: 'center',
    marginBottom: 10,
  },
  stateSub: {
    fontSize: 14,
    color: C.inkSub,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  stateBtn: {
    backgroundColor: C.blue,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: R.full,
    ...Sh.sm,
  },
  stateBtnTxt: {color: C.white, fontWeight: '700', fontSize: 15},

  greeting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greetSub: {fontSize: 13, color: C.inkMuted},
  greetName: {fontSize: 22, fontWeight: '800', color: C.ink, marginTop: 2},
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: C.blue,
    alignItems: 'center',
    justifyContent: 'center',
    ...Sh.sm,
  },
  avatarLetter: {fontSize: 18, color: C.white, fontWeight: '700'},

  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.amberLight,
    borderRadius: R.md,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: C.amber,
    ...Sh.xs,
  },
  warningIcon: {fontSize: 18},
  warningTitle: {fontSize: 13, fontWeight: '600', color: C.ink},
  warningText: {fontSize: 12, color: C.inkSub, marginTop: 2},

  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: R.md,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1.5,
    ...Sh.sm,
    backgroundColor: C.surface,
  },
  locationCardGreen: {borderColor: C.greenMid},
  locationCardRed: {borderColor: C.redMid},
  locationBar: {width: 4, alignSelf: 'stretch'},
  locationCardBody: {flex: 1, padding: 14},
  locationCardLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: C.inkFaint,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  locationCardLoading: {flexDirection: 'row', alignItems: 'center', gap: 8},
  locationCardName: {
    fontSize: 15,
    fontWeight: '700',
    color: C.ink,
    marginBottom: 2,
  },
  locationCardMeta: {fontSize: 12, color: C.greenDark, fontWeight: '500'},
  locationCardCoords: {fontSize: 11, color: C.inkFaint, marginTop: 3},
  locationCardArrow: {fontSize: 20, paddingRight: 14},

  statsRow: {flexDirection: 'row', gap: 10, marginBottom: 12},
  statCard: {
    flex: 1,
    borderRadius: R.md,
    padding: 14,
    alignItems: 'center',
    ...Sh.xs,
  },
  statNum: {fontSize: 28, fontWeight: '800'},
  statLabel: {fontSize: 11, color: C.inkMuted, marginTop: 2, fontWeight: '500'},

  card: {
    backgroundColor: C.surface,
    borderRadius: R.md,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
    ...Sh.xs,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardTitle: {fontSize: 16, fontWeight: '700', color: C.ink},
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.greenLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: R.full,
  },
  activePillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.greenMid,
  },
  activePillTxt: {fontSize: 11, fontWeight: '600', color: C.greenDark},
  cardSub: {fontSize: 13, color: C.inkMuted, lineHeight: 19},
  cardDivider: {height: 1, backgroundColor: C.border, marginVertical: 12},
  cardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardActionTxt: {fontSize: 14, fontWeight: '600', color: C.blue},
  cardActionArrow: {fontSize: 16, color: C.blue},

  quickRow: {flexDirection: 'row', gap: 10},
  quickBtn: {
    flex: 1,
    borderRadius: R.md,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    ...Sh.xs,
  },
  quickIcon: {fontSize: 22},
  quickTxt: {fontSize: 14, fontWeight: '600'},
});
