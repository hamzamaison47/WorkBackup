/* eslint-disable curly */
/* eslint-disable react-native/no-inline-styles */
// ─────────────────────────────────────────────
// components/AttendanceManagement/screens/ConfirmBreakScreen.js
//
// P2.4 OPTIMIZATION: Uses AttendanceOrchestrator token pattern.
// Confirm press delegates entirely to Orchestrator.confirm().
// Session context built from token's embedded punch data.
// ─────────────────────────────────────────────
import React, {useCallback, useEffect, useMemo, useState, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useSelector} from 'react-redux';
import ConfirmSheet from '../ConfirmSheet';
import {NoteRow} from '../FormRow';
import LocationPickerModal from '../LocationPickerModal';
import ProcessingOverlay from '../ProcessingOverlay';
import {useGeofence} from '../GeofenceContext';
import useLocation from '../../../hooks/useLocation';
import DeviceInfo from 'react-native-device-info';
import {
  aggregateServerPunches,
  formatTime,
  formatDuration,
  formatDurationShort,
  getSessionStats,
} from '../../../screens/AttendanceManagement/helpers';
import AttendanceOrchestrator, {
  qrRejectionMessage,
} from '../../../services/AttendanceManagement/AttendanceOrchestrator';
import QRScannerModal, {isQRCodeActive} from '../QRScannerModal';
import {
  validateQRCode,
  QR_STATUS,
} from '../../../API/AttendanceManagement/ValidateQRCode';
import {ACTION_TYPES} from './attendanceActionHelpers';
import {runBiometricGate, BIOMETRIC_GATE_REASON} from './biometricGate';
import useAttendanceTheme from '../useAttendanceTheme';

const GENERATION_TYPE_MAP = {
  BREAK_START: 'StartBreak',
  BREAK_END: 'EndBreak',
};

const SPOOF_LABELS = {
  mock_flag: 'Mock location app detected',
  accuracy_too_perfect: 'Suspiciously perfect GPS accuracy',
  impossible_speed: 'Impossible movement speed detected',
  stale_fix: 'GPS fix is too old',
  position_jump: 'Sudden location jump detected',
  rooted_device: 'Device appears to be rooted or jailbroken',
};

const ConfirmBreakScreen = ({
  validationToken, // P2: ValidationToken from AttendanceOrchestrator.prepare()
  onConfirm,
  onBack,
  breakType = 'BREAK_START',
}) => {
  const {C, R} = useAttendanceTheme();
  const S = useMemo(() => makeStyles(C, R), [C, R]);
  const [note, setNote] = useState('');
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingLabel, setProcessingLabel] = useState('Processing...');
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [sessionSummary, setSessionSummary] = useState(null);
  // Carries the Confirm-press biometric outcome across the QR modal round-trip
  // (handleConfirmPress → handleQrScanned). A ref, not state: it must not
  // trigger a re-render or re-create doSubmit in the middle of the flow.
  const biometricVerifiedRef = useRef(false);

  const {matchedFence, clockInFence, locationLoading, locationError} =
    useGeofence();
  const {spoofingDetected, spoofingReason} = useLocation();
  const {userData} = useSelector(s => s.user);

  const isBreakEnd = breakType === 'BREAK_END';
  const generationType = GENERATION_TYPE_MAP[breakType] ?? 'StartBreak';
  const title = isBreakEnd ? 'End Break' : 'Start Break';
  const subtitle = isBreakEnd
    ? 'Resume the timer and return to work'
    : 'Pause the timer for your break';
  const confirmColor = isBreakEnd ? C.amber : '#7C3AED';

  // Fence the Confirm-time gates run against — the one prepare() validated and
  // confirm() will submit the punch against. Biometric and QR share it.
  const gateFence = useMemo(
    () => validationToken?.matchedFence ?? clockInFence ?? matchedFence,
    [validationToken, clockInFence, matchedFence],
  );

  // Build session context from embedded token data — no extra SOAP call
  useEffect(() => {
    if (!validationToken?.serverPunches?.length) return;
    try {
      const records = aggregateServerPunches(validationToken.serverPunches);
      if (!records.length) return;
      const last = records[records.length - 1];
      if (!last.clockOut && last.clockIn) {
        const stats = getSessionStats(last);
        if (stats) {
          setSessionSummary({
            clockIn: last.clockIn,
            netMs: stats.netMs,
            breakCount: stats.completedBreaks,
            breakMs: stats.breakMs,
            ongoingBreakStart:
              isBreakEnd && last.breaks?.length
                ? (() => {
                    const lb = last.breaks[last.breaks.length - 1];
                    return lb && !lb.breakEnd ? lb.breakStart : null;
                  })()
                : null,
          });
        }
      }
    } catch {}
  }, [validationToken, isBreakEnd]);

  // Everything after the Confirm-time gates. qrResult is null when the fence
  // has no QR policy.
  const doSubmit = useCallback(
    async (qrResult, biometricVerified = false) => {
      setProcessingLabel(isBreakEnd ? 'Ending break…' : 'Starting break…');
      setIsProcessing(true);
      try {
        const deviceId = await DeviceInfo.getUniqueId();

        await AttendanceOrchestrator.confirm({
          token: validationToken,
          generationType,
          personRecId: userData?.Person,
          deviceId,
          clockInFence,
          spoofingDetected,
          qrResult,
          biometricVerified,
        });

        await onConfirm(note);
      } catch (error) {
        Alert.alert(
          isBreakEnd ? 'End Break Failed' : 'Start Break Failed',
          error.message || 'Unable to record attendance. Please try again.',
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [
      isBreakEnd,
      validationToken,
      generationType,
      userData?.Person,
      clockInFence,
      spoofingDetected,
      note,
      onConfirm,
    ],
  );

  const handleConfirmPress = useCallback(async () => {
    if (isProcessing) return;

    // Biometric gate — runs ONLY on Confirm, before any processing UI, so the
    // system dialog never appears over a spinner. Gates on the token's fence
    // (the one prepare() validated and confirm() will submit against).
    const gate = await runBiometricGate(gateFence);
    if (!gate.ok) {
      Alert.alert('Biometric Verification Required', gate.message);
      return;
    }

    // ok:true covers two different things — an actual biometric match
    // (AUTHENTICATED) and a fence with no biometric policy (NOT_REQUIRED).
    // Only the first is a verification, so only the first records 'Yes'.
    const biometricVerified =
      gate.reason === BIOMETRIC_GATE_REASON.AUTHENTICATED;
    biometricVerifiedRef.current = biometricVerified;

    // QR gate — same position and same fence as the biometric gate.
    if (isQRCodeActive(gateFence)) {
      // Lock the Confirm button while the scanner is up — handleQrScanned or
      // handleQrCancel releases it.
      setProcessingLabel('Waiting for QR scan…');
      setIsProcessing(true);
      setQrModalVisible(true);
      return;
    }

    await doSubmit(null, biometricVerified);
  }, [isProcessing, gateFence, doSubmit]);

  const handleQrScanned = useCallback(
    async scan => {
      setQrModalVisible(false);

      // QRScannerModal passes {value, type, scannedAt}, not a bare string.
      const value = scan && typeof scan === 'object' ? scan.value : scan;

      setProcessingLabel('Verifying QR code…');
      setIsProcessing(true);

      const result = await validateQRCode({
        qrData: value,
        geoFenceIds: [gateFence?.GeoFenceID],
      });

      // FAIL CLOSED: only an explicit IsValid === true alongside a 'Valid'
      // StatusCode proceeds. Anything else — including a self-contradictory
      // answer — is a rejection.
      if (
        result?.IsValid !== true ||
        String(result.StatusCode ?? '').trim() !== QR_STATUS.VALID
      ) {
        setIsProcessing(false);
        Alert.alert('QR Verification Failed', qrRejectionMessage(result));
        return;
      }

      await doSubmit(
        {...result, rawValue: value},
        biometricVerifiedRef.current,
      );
    },
    [gateFence, doSubmit],
  );

  const handleQrCancel = useCallback(() => {
    setQrModalVisible(false);
    setIsProcessing(false);
  }, []);

  const displayFence = useMemo(
    () => validationToken?.matchedFence ?? clockInFence ?? matchedFence,
    [validationToken, clockInFence, matchedFence],
  );
  const matched = !!matchedFence;

  return (
    <>
      <ConfirmSheet
        title={title}
        subtitle={subtitle}
        status="Active now"
        onBack={onBack}
        onConfirm={handleConfirmPress}
        confirmDisabled={!validationToken}
        disableActions={isProcessing}
        confirmLabel={isBreakEnd ? 'End Break' : 'Start Break'}
        confirmColor={confirmColor}>
        {isProcessing && <ProcessingOverlay label={processingLabel} />}

        {/* Validation status badge */}
        {validationToken ? (
          <View style={S.validBadge}>
            <Text style={S.validBadgeText}>
              ✓ All checks passed — ready to{' '}
              {isBreakEnd ? 'end break' : 'start break'}
            </Text>
          </View>
        ) : (
          <View style={S.pendingBadge}>
            <Text style={S.pendingBadgeText}>Validation pending…</Text>
          </View>
        )}

        {/* Session context card */}
        {sessionSummary && (
          <View
            style={[
              S.contextCard,
              isBreakEnd
                ? {backgroundColor: '#FFFBEB', borderColor: '#FCD34D'}
                : {},
            ]}>
            <Text style={[S.contextTitle, isBreakEnd && {color: '#92400E'}]}>
              {isBreakEnd ? 'Break in Progress' : 'Session So Far'}
            </Text>
            <View style={S.divider} />
            <View style={S.contextRow}>
              <Text style={[S.contextKey, isBreakEnd && {color: '#92400E'}]}>
                Clocked in at
              </Text>
              <Text style={[S.contextVal, isBreakEnd && {color: '#92400E'}]}>
                {formatTime(sessionSummary.clockIn)}
              </Text>
            </View>
            {isBreakEnd && sessionSummary.ongoingBreakStart ? (
              <View style={S.contextRow}>
                <Text style={[S.contextKey, {color: '#92400E'}]}>
                  Break started
                </Text>
                <Text
                  style={[S.contextVal, {color: '#92400E', fontWeight: '700'}]}>
                  {formatTime(sessionSummary.ongoingBreakStart)}
                  {' · '}
                  {formatDurationShort(
                    Date.now() -
                      new Date(sessionSummary.ongoingBreakStart).getTime(),
                  )}{' '}
                  ago
                </Text>
              </View>
            ) : (
              <View style={S.contextRow}>
                <Text style={S.contextKey}>Time worked</Text>
                <Text style={[S.contextVal, {fontWeight: '700'}]}>
                  {formatDuration(sessionSummary.netMs)}
                </Text>
              </View>
            )}
            {sessionSummary.breakCount > 0 && !isBreakEnd && (
              <View style={S.contextRow}>
                <Text style={S.contextKey}>Breaks taken</Text>
                <Text style={S.contextVal}>
                  {sessionSummary.breakCount} ·{' '}
                  {formatDurationShort(sessionSummary.breakMs)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* GPS spoofing warning */}
        {spoofingDetected && (
          <View style={S.spoofBanner}>
            <Text style={S.spoofTitle}>GPS Integrity Warning</Text>
            <Text style={S.spoofSub}>
              {SPOOF_LABELS[spoofingReason] ??
                'Suspicious GPS activity detected'}
            </Text>
          </View>
        )}

        {/* Location row */}
        <TouchableOpacity
          style={[
            S.locationRow,
            matched
              ? S.locationRowOk
              : locationLoading
              ? S.locationRowLoading
              : S.locationRowNeutral,
          ]}
          onPress={() => setLocationModalVisible(true)}
          activeOpacity={0.75}
          disabled={isProcessing}>
          {locationLoading ? (
            <ActivityIndicator
              size="small"
              color={C.blue}
              style={{marginRight: 4}}
            />
          ) : (
            <View
              style={[
                S.locDot,
                {backgroundColor: matched ? C.greenMid : C.inkFaint},
              ]}
            />
          )}
          <View style={S.locBody}>
            <Text style={S.locLabel}>CURRENT LOCATION</Text>
            {locationLoading ? (
              <Text style={[S.locValue, {color: C.inkMuted}]}>
                Verifying location…
              </Text>
            ) : (
              <Text
                style={[S.locValue, !matched && {color: C.inkMuted}]}
                numberOfLines={1}>
                {matched
                  ? matchedFence?.FenceName
                  : locationError ?? 'Outside all zones (break allowed here)'}
              </Text>
            )}
          </View>
          <Text
            style={[S.locArrow, {color: matched ? C.greenDark : C.inkFaint}]}>
            ›
          </Text>
        </TouchableOpacity>

        {displayFence && (
          <Text style={S.fenceNote}>
            {isBreakEnd ? 'Returning to' : 'Using'} clock-in fence:{' '}
            {displayFence.FenceName ?? 'N/A'}
          </Text>
        )}

        {!matched && !locationLoading && (
          <View style={S.allowedNote}>
            <Text style={S.allowedNoteTxt}>
              Breaks may be taken outside the office zone.
            </Text>
          </View>
        )}

        <View style={S.divider} />
        <NoteRow value={note} onChangeText={setNote} />
      </ConfirmSheet>

      <LocationPickerModal
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
      />

      <QRScannerModal
        visible={qrModalVisible}
        eventLabel={isBreakEnd ? 'BREAK_END' : 'BREAK_START'}
        fenceName={gateFence?.FenceName}
        onScanSuccess={handleQrScanned}
        onCancel={handleQrCancel}
      />
    </>
  );
};

export default ConfirmBreakScreen;

const makeStyles = (C, R) =>
  StyleSheet.create({
    validBadge: {
      backgroundColor: '#D1FAE5',
      borderWidth: 1,
      borderColor: '#6EE7B7',
      borderRadius: R.sm,
      padding: 10,
      marginBottom: 10,
    },
    validBadgeText: {fontSize: 12, fontWeight: '600', color: '#065F46'},
    pendingBadge: {
      backgroundColor: '#FEF3C7',
      borderWidth: 1,
      borderColor: '#FCD34D',
      borderRadius: R.sm,
      padding: 10,
      marginBottom: 10,
    },
    pendingBadgeText: {fontSize: 12, color: '#92400E'},

    contextCard: {
      backgroundColor: C.surfaceAlt,
      borderRadius: R.md,
      borderWidth: 1,
      borderColor: C.border,
      padding: 14,
      marginBottom: 10,
    },
    contextTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: C.inkSub,
      marginBottom: 8,
      letterSpacing: 0.3,
    },
    contextRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 3,
    },
    contextKey: {fontSize: 12, color: C.inkMuted},
    contextVal: {fontSize: 12, fontWeight: '600', color: C.ink},

    spoofBanner: {
      backgroundColor: '#FFF3CD',
      borderWidth: 1,
      borderColor: '#FFC107',
      borderRadius: R.sm,
      padding: 12,
      marginBottom: 10,
    },
    spoofTitle: {fontSize: 13, fontWeight: '700', color: '#856404'},
    spoofSub: {fontSize: 12, color: '#856404', marginTop: 2},

    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: R.sm,
      marginBottom: 4,
      borderWidth: 1,
    },
    locationRowOk: {backgroundColor: C.greenLight, borderColor: C.greenMid},
    locationRowNeutral: {backgroundColor: C.surfaceAlt, borderColor: C.border},
    locationRowLoading: {backgroundColor: C.blueLight, borderColor: C.blueMid},
    locDot: {width: 8, height: 8, borderRadius: 4, flexShrink: 0},
    locBody: {flex: 1},
    locLabel: {
      fontSize: 9,
      fontWeight: '700',
      color: C.inkFaint,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      marginBottom: 2,
    },
    locValue: {fontSize: 14, fontWeight: '600', color: C.greenDark},
    locArrow: {fontSize: 18},
    fenceNote: {fontSize: 11, color: C.inkMuted, marginBottom: 6},
    allowedNote: {marginBottom: 8},
    allowedNoteTxt: {fontSize: 11, color: C.inkMuted, fontStyle: 'italic'},
    divider: {
      height: 1,
      backgroundColor: C.border,
      marginBottom: 4,
      marginTop: 4,
    },
  });
