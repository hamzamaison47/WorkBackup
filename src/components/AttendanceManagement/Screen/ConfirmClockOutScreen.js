/* eslint-disable curly */
/* eslint-disable react-native/no-inline-styles */
// ─────────────────────────────────────────────
// components/AttendanceManagement/screens/ConfirmClockOutScreen.js
//
// P2.3 OPTIMIZATION: Uses AttendanceOrchestrator token pattern.
// Confirm press delegates entirely to Orchestrator.confirm().
// ─────────────────────────────────────────────
import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useSelector} from 'react-redux';
import ConfirmSheet from '../ConfirmSheet';
import {NoteRow, CheckboxRow} from '../FormRow';
import LocationPickerModal from '../LocationPickerModal';
import ProcessingOverlay from '../ProcessingOverlay';
import {useGeofence} from '../GeofenceContext';
import useLocation from '../../../hooks/useLocation';
import DeviceInfo from 'react-native-device-info';
import {
  loadRecords,
  formatTime,
  formatDuration,
  formatDurationShort,
  getSessionStats,
} from '../../../screens/AttendanceManagement/helpers';
import AttendanceOrchestrator from '../../../services/AttendanceManagement/AttendanceOrchestrator';
import {C, R} from '../theme';

const GENERATION_TYPE = 'ClockOut';

const ConfirmClockOutScreen = ({
  validationToken, // P2: ValidationToken from AttendanceOrchestrator.prepare()
  onConfirm,
  onBack,
}) => {
  const [note, setNote] = useState('');
  const [endWorkDay, setEndWorkDay] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingLabel, setProcessingLabel] = useState('Processing...');
  const [sessionSummary, setSessionSummary] = useState(null);

  const {matchedFence, clockInFence, locationError, locationLoading} =
    useGeofence();
  const {spoofingDetected} = useLocation();
  const {userData} = useSelector(s => s.user);

  // Load session summary from embedded token data (no extra SOAP call)
  useEffect(() => {
    if (!validationToken?.serverPunches?.length) return;
    try {
      const records =
        require('../../../screens/AttendanceManagement/helpers').aggregateServerPunches(
          validationToken.serverPunches,
        );
      if (!records.length) return;
      const last = records[records.length - 1];
      if (!last.clockOut && last.clockIn) {
        const stats = getSessionStats(last);
        if (stats) {
          setSessionSummary({
            clockIn: last.clockIn,
            breakCount: stats.completedBreaks,
            breakMs: stats.breakMs,
            netMs: stats.netMs,
            grossMs: stats.grossMs,
            fenceName: last.FenceName,
          });
        }
      }
    } catch {}
  }, [validationToken]);

  const handleConfirmPress = useCallback(async () => {
    if (isProcessing) return;
    setProcessingLabel('Clocking out…');
    setIsProcessing(true);
    try {
      const deviceId = await DeviceInfo.getUniqueId();

      await AttendanceOrchestrator.confirm({
        token: validationToken,
        generationType: GENERATION_TYPE,
        personRecId: userData?.Person,
        deviceId,
        clockInFence,
        spoofingDetected,
      });

      await AsyncStorage.removeItem('@attendance_clock_in_fence');
      await onConfirm(note, endWorkDay);
    } catch (error) {
      Alert.alert(
        'Clock Out Failed',
        error.message || 'Unable to record attendance. Please try again.',
      );
    } finally {
      setIsProcessing(false);
    }
  }, [
    isProcessing,
    validationToken,
    userData?.Person,
    clockInFence,
    spoofingDetected,
    note,
    endWorkDay,
    onConfirm,
  ]);

  const displayFence =
    validationToken?.matchedFence ?? clockInFence ?? matchedFence;
  const matched = !!matchedFence;

  return (
    <>
      <ConfirmSheet
        title="Confirm Clock Out"
        subtitle="Stop the timer"
        status="Active now"
        onBack={onBack}
        onConfirm={handleConfirmPress}
        confirmDisabled={!validationToken}
        disableActions={isProcessing}
        confirmLabel="Clock Out"
        confirmColor={C.redMid}>
        {isProcessing && <ProcessingOverlay label={processingLabel} />}

        {/* Validation status badge */}
        {validationToken ? (
          <View style={S.validBadge}>
            <Text style={S.validBadgeText}>
              ✓ All checks passed — ready to clock out
            </Text>
          </View>
        ) : (
          <View style={S.pendingBadge}>
            <Text style={S.pendingBadgeText}>Validation pending…</Text>
          </View>
        )}

        {/* Session summary card */}
        {sessionSummary && (
          <View style={S.summaryCard}>
            <Text style={S.summaryTitle}>Session Summary</Text>
            <View style={S.divider} />
            <View style={S.summaryRow}>
              <Text style={S.summaryKey}>Clocked in at</Text>
              <Text style={S.summaryVal}>
                {formatTime(sessionSummary.clockIn)}
              </Text>
            </View>
            <View style={S.summaryRow}>
              <Text style={S.summaryKey}>Total breaks</Text>
              <Text style={S.summaryVal}>
                {sessionSummary.breakCount > 0
                  ? `${sessionSummary.breakCount} break${
                      sessionSummary.breakCount > 1 ? 's' : ''
                    } · ${formatDurationShort(sessionSummary.breakMs)}`
                  : 'None'}
              </Text>
            </View>
            <View style={S.summaryRow}>
              <Text style={S.summaryKey}>Net work time</Text>
              <Text
                style={[S.summaryVal, {color: C.greenDark, fontWeight: '700'}]}>
                {formatDuration(sessionSummary.netMs)}
              </Text>
            </View>
            {sessionSummary.fenceName && (
              <View style={S.summaryRow}>
                <Text style={S.summaryKey}>Clocked in at</Text>
                <Text style={S.summaryVal}>{sessionSummary.fenceName}</Text>
              </View>
            )}
          </View>
        )}

        {/* Current location */}
        <TouchableOpacity
          style={[
            S.locationRow,
            matched ? S.locationRowOk : S.locationRowNeutral,
          ]}
          onPress={() => setLocationModalVisible(true)}
          activeOpacity={0.75}
          disabled={isProcessing}>
          {locationLoading ? (
            <ActivityIndicator size="small" color={C.blue} />
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
            <Text
              style={[S.locValue, !matched && {color: C.inkMuted}]}
              numberOfLines={1}>
              {locationLoading
                ? 'Verifying…'
                : matched
                ? matchedFence?.FenceName
                : locationError ?? 'Outside office zone (allowed)'}
            </Text>
          </View>
          <Text
            style={[S.locArrow, {color: matched ? C.greenDark : C.inkFaint}]}>
            ›
          </Text>
        </TouchableOpacity>

        {displayFence && (
          <Text style={S.fenceNote}>
            Validating against fence: {displayFence.FenceName ?? 'N/A'}
          </Text>
        )}

        <View style={S.divider} />
        <NoteRow value={note} onChangeText={setNote} />
        <CheckboxRow
          checked={endWorkDay}
          onToggle={() => setEndWorkDay(v => !v)}
          label="End work for the day?"
        />
      </ConfirmSheet>

      <LocationPickerModal
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
      />
    </>
  );
};

export default ConfirmClockOutScreen;

const S = StyleSheet.create({
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

  summaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 10,
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: C.inkSub,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryKey: {fontSize: 12, color: C.inkMuted},
  summaryVal: {fontSize: 12, fontWeight: '600', color: C.ink},

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
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginBottom: 4,
    marginTop: 4,
  },
});
