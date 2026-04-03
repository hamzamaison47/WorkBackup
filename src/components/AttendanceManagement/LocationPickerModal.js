/* eslint-disable no-unused-vars */
// ─────────────────────────────────────────────
// components/AttendanceManagement/LocationPickerModal.js
//
// FLOW CHANGE:
//   - Shows GPS + coordinate status only.
//   - Network badges removed (network check happens at confirm-time).
//   - Multi-select is COMMENTED OUT (not removed).
// ─────────────────────────────────────────────
/* eslint-disable curly */
/* eslint-disable react-native/no-inline-styles */
import React, {useCallback} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import {useGeofence} from './GeofenceContext';
import {C, R, Sh} from './theme';

const fmtDist = m =>
  m == null ? '—' : m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`;

// ─────────────────────────────────────────────
// Single fence row — GPS status only
// ─────────────────────────────────────────────
const FenceRow = ({item, isMatched}) => {
  const isInactive = !item.active || !item.dateValid;
  const isOutside = !item.withinRadius;

  return (
    <View
      style={[S.row, isMatched && S.rowMatched, isInactive && S.rowInactive]}>
      {/* Icon */}
      <View
        style={[
          S.icon,
          isMatched && S.iconMatched,
          isInactive && S.iconInactive,
        ]}>
        <Text
          style={[
            S.iconChar,
            isMatched && {color: C.greenDark},
            isInactive && {color: C.redDark},
          ]}>
          {isMatched ? '✓' : isInactive ? '✕' : '○'}
        </Text>
      </View>

      {/* Body */}
      <View style={S.rowBody}>
        <Text
          style={[
            S.rowName,
            isMatched && S.rowNameMatch,
            isInactive && S.rowNameInactive,
          ]}
          numberOfLines={1}>
          {item.FenceName}
        </Text>

        {item.LocationDescription || item.LocationCode ? (
          <Text style={S.rowDesc} numberOfLines={1}>
            {item.LocationDescription || item.LocationCode}
          </Text>
        ) : null}

        <View style={S.pills}>
          {/* Distance + in/out */}
          <View
            style={[
              S.pill,
              isMatched ? S.pillGreen : isOutside ? S.pillRed : S.pillBlue,
            ]}>
            <Text
              style={[
                S.pillTxt,
                isMatched
                  ? S.pillTxtGreen
                  : isOutside
                  ? S.pillTxtRed
                  : S.pillTxtBlue,
              ]}>
              {fmtDist(item.distanceMetres)}
              {item.distanceMetres != null
                ? item.withinRadius
                  ? '  ·  In zone'
                  : '  ·  Out of zone'
                : ''}
            </Text>
          </View>

          {/* Allowed radius */}
          {!isNaN(item.allowedRadius) && (
            <View style={S.pillGrey}>
              <Text style={S.pillGreyTxt}>Radius {item.allowedRadius} m</Text>
            </View>
          )}

          {/* M4 — expired */}
          {item.active && !item.dateValid && (
            <View style={[S.pillGrey, {backgroundColor: C.redLight}]}>
              <Text style={[S.pillGreyTxt, {color: C.redDark}]}>Expired</Text>
            </View>
          )}
        </View>

        {/* Network hint — informational only, validation happens at confirm-time */}
        {item.networks?.length > 0 && (
          <Text style={S.networkHint}>
            📶 Network verification required on confirm
          </Text>
        )}

        {/* M3 — inactive label */}
        {isInactive && (
          <Text style={S.inactiveTag}>
            {!item.active ? 'Inactive' : 'Schedule Expired'}
          </Text>
        )}
      </View>

      {/* Right dot */}
      <View style={[S.dot, isMatched ? S.dotGreen : S.dotGrey]} />
    </View>
  );
};

// ─────────────────────────────────────────────
// Modal
// ─────────────────────────────────────────────
const LocationPickerModal = ({visible, onClose}) => {
  const {
    allFences,
    matchedFence,
    locationLoading,
    locationError,
    coords,
    refresh,
    // setManualSelectedFence,  // MULTI-SELECT COMMENTED OUT
  } = useGeofence();

  const matchedId = matchedFence?.GeoFenceID ?? null;

  // MULTI-SELECT COMMENTED OUT:
  // U2 — manual selection was previously allowed for fences in radius.
  // Disabled for now — auto-selection (closest GPS match) is used exclusively.
  //
  // const handleManualSelect = useCallback(item => {
  //   const selectable = item.withinRadius && item.active && item.dateValid;
  //   if (!selectable) return;
  //   setManualSelectedFence(item);
  //   onClose();
  // }, [setManualSelectedFence, onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <SafeAreaView style={S.sheet}>
        {/* Handle bar */}
        <View style={S.handleWrap}>
          <View style={S.handle} />
        </View>

        {/* Header */}
        <View style={S.header}>
          <View>
            <Text style={S.headerTitle}>Authorised Locations</Text>
            <Text style={S.headerSub}>
              GPS verified. Network check happens when you confirm.
            </Text>
          </View>
          {!locationLoading && (
            <TouchableOpacity style={S.refreshBtn} onPress={refresh}>
              <Text style={S.refreshTxt}>↺ Refresh</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* GPS accuracy badge */}
        {coords && !locationLoading && (
          <View style={S.gpsBadge}>
            <View style={S.gpsDot} />
            <Text style={S.gpsTxt}>
              GPS active · ±{Math.round(coords.accuracy ?? 0)} m accuracy
            </Text>
          </View>
        )}

        {/* Loading */}
        {locationLoading ? (
          <View style={S.center}>
            <ActivityIndicator
              size="large"
              color={C.blue}
              style={{marginBottom: 16}}
            />
            <Text style={S.centerTitle}>Verifying your location…</Text>
            <Text style={S.centerSub}>
              Fetching GPS and checking office zones
            </Text>
          </View>
        ) : allFences.length === 0 ? (
          <View style={S.center}>
            <Text style={S.centerEmoji}>⚠️</Text>
            <Text style={S.centerTitle}>No locations found</Text>
            <Text style={S.centerSub}>
              {locationError ?? 'No geofence configured for your account.'}
            </Text>
            <TouchableOpacity style={S.retryBtn} onPress={refresh}>
              <Text style={S.retryTxt}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* G3 — Inside/outside status banner */}
            <View style={[S.banner, matchedId ? S.bannerGreen : S.bannerRed]}>
              <View
                style={[
                  S.bannerIcon,
                  matchedId ? S.bannerIconGreen : S.bannerIconRed,
                ]}>
                <Text style={S.bannerIconChar}>{matchedId ? '✓' : '✕'}</Text>
              </View>
              <View style={{flex: 1}}>
                <Text
                  style={[
                    S.bannerTitle,
                    {color: matchedId ? C.greenDark : C.redDark},
                  ]}>
                  {matchedId
                    ? 'Within an authorised zone'
                    : 'Outside all authorised zones'}
                </Text>
                {matchedId && matchedFence?.distanceMetres != null && (
                  <Text style={S.bannerSub}>
                    {matchedFence.FenceName} · {matchedFence.distanceMetres} m
                    away
                  </Text>
                )}
                {!matchedId && locationError && (
                  <Text style={S.bannerSub}>{locationError}</Text>
                )}
              </View>
            </View>

            {/* MULTI-SELECT HINT COMMENTED OUT:
            {allFences.filter(f => f.withinRadius && f.active && f.dateValid).length > 1 && (
              <View style={S.hintBanner}>
                <Text style={S.hintTxt}>
                  💡 Multiple zones match your position. Tap one to select it.
                </Text>
              </View>
            )} */}

            {/* Fence list — sorted closest first */}
            <FlatList
              data={[...allFences].sort((a, b) => {
                const aOk = a.active && a.dateValid && a.withinRadius ? 0 : 1;
                const bOk = b.active && b.dateValid && b.withinRadius ? 0 : 1;
                if (aOk !== bOk) return aOk - bOk;
                return (a.distanceMetres ?? 9999) - (b.distanceMetres ?? 9999);
              })}
              keyExtractor={item => String(item.GeoFenceID)}
              renderItem={({item}) => (
                // MULTI-SELECT COMMENTED OUT: rows are view-only, no tap-to-select
                // To re-enable: wrap in TouchableOpacity calling handleManualSelect(item)
                <FenceRow
                  item={item}
                  isMatched={String(item.GeoFenceID) === String(matchedId)}
                />
              )}
              contentContainerStyle={S.list}
              showsVerticalScrollIndicator={false}
            />
          </>
        )}

        {/* Close */}
        <View style={S.footer}>
          <TouchableOpacity style={S.closeBtn} onPress={onClose}>
            <Text style={S.closeTxt}>Close</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default LocationPickerModal;

const S = StyleSheet.create({
  sheet: {flex: 1, backgroundColor: C.bg},
  handleWrap: {alignItems: 'center', paddingTop: 12, paddingBottom: 4},
  handle: {width: 38, height: 4, borderRadius: 2, backgroundColor: C.borderMid},

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerTitle: {fontSize: 17, fontWeight: '700', color: C.ink, marginBottom: 2},
  headerSub: {fontSize: 12, color: C.inkMuted, lineHeight: 17, maxWidth: 260},
  refreshBtn: {
    backgroundColor: C.blueLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: R.full,
    marginTop: 2,
  },
  refreshTxt: {fontSize: 13, fontWeight: '600', color: C.blue},

  gpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.greenLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  gpsDot: {width: 7, height: 7, borderRadius: 4, backgroundColor: C.greenMid},
  gpsTxt: {fontSize: 12, color: C.greenDark, fontWeight: '500'},

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 6,
    borderRadius: R.md,
    padding: 14,
  },
  bannerGreen: {backgroundColor: C.greenLight},
  bannerRed: {backgroundColor: C.redLight},
  bannerIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerIconGreen: {backgroundColor: C.greenMid},
  bannerIconRed: {backgroundColor: C.redMid},
  bannerIconChar: {fontSize: 16, fontWeight: '700', color: C.white},
  bannerTitle: {fontSize: 14, fontWeight: '600'},
  bannerSub: {fontSize: 12, color: C.inkMuted, marginTop: 2},

  list: {padding: 16, paddingBottom: 8, gap: 10},

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.surface,
    borderRadius: R.md,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...Sh.xs,
  },
  rowMatched: {borderColor: C.greenMid, backgroundColor: '#F0FFF8'},
  rowInactive: {opacity: 0.45},

  icon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surfaceAlt,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  iconMatched: {backgroundColor: C.greenLight, borderColor: C.greenMid},
  iconInactive: {backgroundColor: C.redLight, borderColor: C.redMid},
  iconChar: {fontSize: 16, fontWeight: '700', color: C.inkMuted},

  rowBody: {flex: 1},
  rowName: {fontSize: 15, fontWeight: '600', color: C.ink, marginBottom: 2},
  rowNameMatch: {color: C.greenDark},
  rowNameInactive: {color: C.inkFaint},
  rowDesc: {fontSize: 12, color: C.inkFaint, marginBottom: 6},

  pills: {flexDirection: 'row', flexWrap: 'wrap', gap: 5},
  pill: {paddingHorizontal: 8, paddingVertical: 3, borderRadius: R.full},
  pillGreen: {backgroundColor: C.greenLight},
  pillBlue: {backgroundColor: C.blueLight},
  pillRed: {backgroundColor: C.redLight},
  pillTxt: {fontSize: 11, fontWeight: '600'},
  pillTxtGreen: {color: C.greenDark},
  pillTxtBlue: {color: C.blueDark},
  pillTxtRed: {color: C.redDark},
  pillGrey: {
    backgroundColor: C.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: R.full,
  },
  pillGreyTxt: {fontSize: 11, color: C.inkMuted, fontWeight: '500'},
  inactiveTag: {fontSize: 11, color: C.redMid, marginTop: 4, fontWeight: '500'},
  networkHint: {fontSize: 11, color: C.inkMuted, marginTop: 4},

  dot: {width: 12, height: 12, borderRadius: 6},
  dotGreen: {backgroundColor: C.greenMid},
  dotGrey: {backgroundColor: C.border},

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  centerEmoji: {fontSize: 44, marginBottom: 14},
  centerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.ink,
    marginBottom: 8,
    textAlign: 'center',
  },
  centerSub: {
    fontSize: 14,
    color: C.inkSub,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  retryBtn: {
    backgroundColor: C.blue,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: R.full,
    ...Sh.sm,
  },
  retryTxt: {color: C.white, fontWeight: '700', fontSize: 14},

  footer: {padding: 16, paddingBottom: Platform.OS === 'ios' ? 8 : 16},
  closeBtn: {
    backgroundColor: C.amber,
    borderRadius: R.md,
    paddingVertical: 16,
    alignItems: 'center',
    ...Sh.sm,
  },
  closeTxt: {color: C.white, fontSize: 16, fontWeight: '700'},
});
