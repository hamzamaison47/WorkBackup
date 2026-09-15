/* eslint-disable no-unused-vars */
/* eslint-disable curly */
/* eslint-disable react-native/no-inline-styles */
// ─────────────────────────────────────────────
// components/AttendanceManagement/LocationPickerModal.js
// ─────────────────────────────────────────────
import React, {useCallback, useMemo} from 'react';
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
import useAttendanceTheme from './useAttendanceTheme';

// A coordinate older than this is shown as "last known", not "GPS active" — so
// the badge never implies a fresh fix when the watch has gone quiet.
const GPS_FRESH_MS = 60_000;

const fmtDist = m =>
  m == null ? '—' : m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`;

const isQRActive = fence => {
  if (!fence) return false;
  const v = String(fence.IsQRCodeActive ?? '')
    .trim()
    .toLowerCase();
  return v === '1' || v === 'yes' || v === 'true';
};

const isFaceActive = fence => {
  if (!fence) return false;
  const v = String(fence.IsFaceIDActive ?? '').trim();
  return v === 'Required' || v === 'RequiredWithBackground';
};

// ─────────────────────────────────────────────
// Single fence row
// ─────────────────────────────────────────────
const FenceRow = ({item, isMatched}) => {
  const {C, R, Sh} = useAttendanceTheme();
  const S = useMemo(() => makeStyles(C, R, Sh), [C, R, Sh]);
  const isInactive = !item.active || !item.dateValid;
  const isOutside = !item.withinRadius;
  const hasNetwork = Array.isArray(item.networks) && item.networks.length > 0;
  const qrRequired = isQRActive(item);
  const faceRequired = isFaceActive(item);

  return (
    <View
      style={[S.row, isMatched && S.rowMatched, isInactive && S.rowInactive]}>
      {/* Left colour bar */}
      <View
        style={[
          S.rowBar,
          {
            backgroundColor: isMatched
              ? C.greenMid
              : isInactive
              ? C.redMid
              : isOutside
              ? C.border
              : C.blueMid,
          },
        ]}
      />

      {/* Status icon */}
      <View
        style={[
          S.icon,
          isMatched && S.iconMatched,
          isInactive && S.iconInactive,
          !isMatched && !isInactive && isOutside && S.iconOutside,
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

        {(item.LocationDescription || item.LocationCode) && (
          <Text style={S.rowDesc} numberOfLines={1}>
            {item.LocationCode}
            {item.LocationDescription ? `  ·  ${item.LocationDescription}` : ''}
          </Text>
        )}

        {/* Distance pill */}
        <View style={S.pills}>
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

          {!isNaN(item.allowedRadius) && (
            <View style={S.pillGrey}>
              <Text style={S.pillGreyTxt}>Radius {item.allowedRadius} m</Text>
            </View>
          )}

          {item.active && !item.dateValid && (
            <View style={[S.pillGrey, {backgroundColor: C.redLight}]}>
              <Text style={[S.pillGreyTxt, {color: C.redDark}]}>Expired</Text>
            </View>
          )}
        </View>

        {/* Verification requirements */}
        {(qrRequired || faceRequired || hasNetwork) && (
          <View style={S.verifyRow}>
            {qrRequired && (
              <View
                style={[
                  S.verifyBadge,
                  {backgroundColor: C.amberLight, borderColor: C.amber},
                ]}>
                <Text style={[S.verifyBadgeTxt, {color: C.amberDark}]}>
                  QR required
                </Text>
              </View>
            )}
            {faceRequired && (
              <View
                style={[
                  S.verifyBadge,
                  {backgroundColor: '#EDE9FE', borderColor: '#C4B5FD'},
                ]}>
                <Text style={[S.verifyBadgeTxt, {color: '#5B21B6'}]}>
                  Face ID
                </Text>
              </View>
            )}
            {hasNetwork && (
              <View
                style={[
                  S.verifyBadge,
                  {backgroundColor: C.blueLight, borderColor: C.blueDark},
                ]}>
                <Text style={[S.verifyBadgeTxt, {color: C.blueDark}]}>
                  Network verified
                </Text>
              </View>
            )}
          </View>
        )}

        {isInactive && (
          <Text style={S.inactiveTag}>
            {!item.active ? 'Inactive' : 'Schedule Expired'}
          </Text>
        )}
      </View>

      {/* Right status dot */}
      <View
        style={[
          S.dot,
          isMatched ? S.dotGreen : isOutside ? S.dotGrey : S.dotBlue,
        ]}
      />
    </View>
  );
};

// ─────────────────────────────────────────────
// Modal
// ─────────────────────────────────────────────
const LocationPickerModal = ({visible, onClose}) => {
  const {C, R, Sh} = useAttendanceTheme();
  const S = useMemo(() => makeStyles(C, R, Sh), [C, R, Sh]);
  const {
    allFences,
    matchedFence,
    locationLoading,
    locationError,
    coords,
    refresh,
  } = useGeofence();

  const matchedId = matchedFence?.GeoFenceID ?? null;

  // Freshness of the current fix — gates the "GPS active" badge below so a
  // stale last-known coordinate is presented honestly instead of as live.
  const coordsAgeMs = coords?.timestamp ? Date.now() - coords.timestamp : null;
  const coordsFresh = coordsAgeMs != null && coordsAgeMs < GPS_FRESH_MS;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <SafeAreaView style={S.sheet}>
        {/* Handle */}
        <View style={S.handleWrap}>
          <View style={S.handle} />
        </View>

        {/* Header */}
        <View style={S.header}>
          <View style={{flex: 1}}>
            <Text style={S.headerTitle}>Authorised Locations</Text>
            <Text style={S.headerSub}>
              GPS verified · network &amp; QR checks happen at confirm-time
            </Text>
          </View>
          {!locationLoading && (
            <TouchableOpacity style={S.refreshBtn} onPress={refresh}>
              <Text style={S.refreshTxt}>↺ Refresh</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* GPS accuracy badge — green/"active" only when the fix is recent;
            otherwise a muted "last known · updating…" so we never claim a live
            fix while the watch is re-arming. */}
        {coords && !locationLoading && (
          <View style={[S.gpsBadge, !coordsFresh && S.gpsBadgeStale]}>
            <View style={[S.gpsDot, !coordsFresh && S.gpsDotStale]} />
            <Text style={[S.gpsTxt, !coordsFresh && S.gpsTxtStale]}>
              {coordsFresh
                ? `GPS active · ±${Math.round(coords.accuracy ?? 0)} m accuracy`
                : 'Last known location · updating…'}
              {coords.latitude
                ? `  ·  ${coords.latitude.toFixed(
                    4,
                  )}, ${coords.longitude.toFixed(4)}`
                : ''}
            </Text>
          </View>
        )}

        {/* Loading */}
        {locationLoading ? (
          <View style={S.center}>
            <ActivityIndicator
              size="large"
              color={C.blueDark}
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
              {locationError ??
                'No geofence configured for your account. Contact HR.'}
            </Text>
            <TouchableOpacity style={S.retryBtn} onPress={refresh}>
              <Text style={S.retryTxt}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Status banner */}
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

            <FlatList
              data={[...allFences].sort((a, b) => {
                const aOk = a.active && a.dateValid && a.withinRadius ? 0 : 1;
                const bOk = b.active && b.dateValid && b.withinRadius ? 0 : 1;
                if (aOk !== bOk) return aOk - bOk;
                return (a.distanceMetres ?? 9999) - (b.distanceMetres ?? 9999);
              })}
              keyExtractor={item => String(item.GeoFenceID)}
              renderItem={({item}) => (
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

        {/* Close button */}
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

const makeStyles = (C, R, Sh) =>
  StyleSheet.create({
    sheet: {flex: 1, backgroundColor: C.bg},
    handleWrap: {alignItems: 'center', paddingTop: 12, paddingBottom: 4},
    handle: {
      width: 38,
      height: 4,
      borderRadius: 2,
      backgroundColor: C.borderMid,
    },

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
    headerTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: C.ink,
      marginBottom: 2,
    },
    headerSub: {fontSize: 12, color: C.inkMuted, lineHeight: 17, maxWidth: 260},
    refreshBtn: {
      backgroundColor: C.blueLight,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: R.full,
      marginTop: 2,
    },
    refreshTxt: {fontSize: 13, fontWeight: '600', color: C.blueDark},

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
    gpsTxt: {fontSize: 11, color: C.greenDark, fontWeight: '500'},
    gpsBadgeStale: {backgroundColor: C.surfaceAlt},
    gpsDotStale: {backgroundColor: C.inkFaint},
    gpsTxtStale: {color: C.inkMuted},

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
      gap: 10,
      backgroundColor: C.surface,
      borderRadius: R.md,
      overflow: 'hidden',
      borderWidth: 1.5,
      borderColor: 'transparent',
      ...Sh.xs,
    },
    rowMatched: {borderColor: C.greenMid, backgroundColor: C.greenLight},
    rowInactive: {opacity: 0.45},

    rowBar: {width: 4, alignSelf: 'stretch'},

    icon: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.surfaceAlt,
      borderWidth: 1.5,
      borderColor: C.border,
      flexShrink: 0,
      marginLeft: 4,
    },
    iconMatched: {backgroundColor: C.greenLight, borderColor: C.greenMid},
    iconInactive: {backgroundColor: C.redLight, borderColor: C.redMid},
    iconOutside: {backgroundColor: C.surfaceAlt, borderColor: C.border},
    iconChar: {fontSize: 15, fontWeight: '700', color: C.inkMuted},

    rowBody: {flex: 1, paddingVertical: 12, paddingRight: 4},
    rowName: {fontSize: 14, fontWeight: '600', color: C.ink, marginBottom: 2},
    rowNameMatch: {color: C.greenDark},
    rowNameInactive: {color: C.inkFaint},
    rowDesc: {fontSize: 11, color: C.inkFaint, marginBottom: 5},

    pills: {flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 5},
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

    verifyRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 5},
    verifyBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: R.full,
      borderWidth: 1,
    },
    verifyBadgeTxt: {fontSize: 10, fontWeight: '600'},

    inactiveTag: {
      fontSize: 11,
      color: C.redMid,
      marginTop: 4,
      fontWeight: '500',
    },

    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 12,
      flexShrink: 0,
    },
    dotGreen: {backgroundColor: C.greenMid},
    dotBlue: {backgroundColor: C.blueMid},
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
    retryTxt: {color: C.onBlue, fontWeight: '700', fontSize: 14},

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
