/* eslint-disable curly */
/* eslint-disable react-native/no-inline-styles */
// ─────────────────────────────────────────────
// components/AttendanceManagement/screens/ConfirmClockInScreen.js
//
// P2.2 OPTIMIZATION: Replaced the redundant refresh + re-validation
// on confirm press with the AttendanceOrchestrator token pattern.
//
// Before: Confirm pressed → refresh() SOAP call → runNetworkCheck()
//         → invalidateRecordsCache() → enqueueAttendance()
//         (~2 additional SOAP calls, ~2.5s)
//
// After:  Confirm pressed → Orchestrator.confirm(token)
//         → workflow re-check from embedded data → CreateUserAttendance
//         (~0 additional SOAP calls if token fresh, ~0.3s)
// ─────────────────────────────────────────────
import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import {useSelector} from 'react-redux';
import ConfirmSheet from '../ConfirmSheet';
import {NoteRow, OptionRow} from '../FormRow';
import LocationPickerModal from '../LocationPickerModal';
import ProcessingOverlay from '../ProcessingOverlay';
import {useGeofence} from '../GeofenceContext';
import useLocation from '../../../hooks/useLocation';
import DeviceInfo from 'react-native-device-info';
import {
  formatTime,
  formatDateShort,
} from '../../../screens/AttendanceManagement/helpers';
import AttendanceOrchestrator from '../../../services/AttendanceManagement/AttendanceOrchestrator';
import {C, R} from '../theme';

const GENERATION_TYPE = 'ClockIn';

const ConfirmClockInScreen = ({
  lastOut,
  validationToken, // P2: ValidationToken from AttendanceOrchestrator.prepare()
  onConfirm,
  onBack,
}) => {
  const [note, setNote] = useState('');
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingLabel, setProcessingLabel] = useState('Processing...');

  const {matchedFence, clockInFence, locationError, locationLoading} = useGeofence();
  const {spoofingDetected} = useLocation();
  const {userData} = useSelector(s => s.user);

  const handleConfirmPress = useCallback(async () => {
    if (isProcessing) return;
    setProcessingLabel('Clocking in…');
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

      await onConfirm(note);
    } catch (error) {
      Alert.alert(
        'Clock In Failed',
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
    onConfirm,
  ]);

  // Derive display state from the token (already validated) or
  // fall back to GeofenceContext for live GPS strip
  const displayFence = validationToken?.matchedFence ?? matchedFence;
  const matched = !!displayFence;

  return (
    <>
      <ConfirmSheet
        title="Confirm Clock In"
        subtitle="Start the timer"
        status={
          lastOut
            ? `Last out ${formatTime(lastOut)} · ${formatDateShort(lastOut)}`
            : 'No previous record'
        }
        onBack={onBack}
        onConfirm={handleConfirmPress}
        confirmDisabled={!validationToken}
        disableActions={isProcessing}
        confirmLabel="Clock In"
        confirmColor={C.greenMid}>
        {isProcessing && <ProcessingOverlay label={processingLabel} />}

        {/* Validation status badge */}
        {validationToken ? (
          <View style={S.validBadge}>
            <Text style={S.validBadgeText}>✓ All checks passed — ready to clock in</Text>
          </View>
        ) : (
          <View style={S.pendingBadge}>
            <Text style={S.pendingBadgeText}>Validation pending…</Text>
          </View>
        )}

        {/* Location row */}
        <TouchableOpacity
          style={[S.locationRow, matched ? S.locationRowOk : S.locationRowBad]}
          onPress={() => setLocationModalVisible(true)}
          activeOpacity={0.75}
          disabled={isProcessing}>
          <View
            style={[
              S.locDot,
              {backgroundColor: matched ? C.greenMid : C.redMid},
            ]}
          />
          <View style={S.locBody}>
            <Text style={S.locLabel}>AUTHORISED LOCATION</Text>
            <Text
              style={[S.locValue, !matched && {color: C.redDark}]}
              numberOfLines={1}>
              {locationLoading
                ? 'Verifying location…'
                : matched
                ? displayFence.FenceName
                : locationError ?? 'No authorised zone matched'}
            </Text>
            {matched && displayFence?.distanceMetres != null && (
              <Text style={S.locSub}>{displayFence.distanceMetres} m away</Text>
            )}
          </View>
          <Text style={[S.locArrow, {color: matched ? C.greenDark : C.redDark}]}>
            ›
          </Text>
        </TouchableOpacity>

        <View style={S.divider} />
        <OptionRow icon="🏷" label="Select an activity" onPress={() => {}} />
        <OptionRow icon="📁" label="Select a project" onPress={() => {}} />
        <NoteRow value={note} onChangeText={setNote} />
      </ConfirmSheet>

      <LocationPickerModal
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
      />
    </>
  );
};

export default ConfirmClockInScreen;

const S = StyleSheet.create({
  validBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#6EE7B7',
    borderRadius: R.sm,
    padding: 10,
    marginBottom: 10,
  },
  validBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: R.sm,
    padding: 10,
    marginBottom: 10,
  },
  pendingBadgeText: {
    fontSize: 12,
    color: '#92400E',
  },
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
  locationRowBad: {backgroundColor: C.redLight, borderColor: C.redMid},
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
  locSub: {fontSize: 11, color: C.greenDark, opacity: 0.75, marginTop: 1},
  locArrow: {fontSize: 18},
  divider: {height: 1, backgroundColor: C.border, marginBottom: 4},
});
