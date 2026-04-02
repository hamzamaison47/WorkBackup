import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Alert} from 'react-native';
import {useSelector} from 'react-redux';
import ConfirmSheet from '../ConfirmSheet';
import {NoteRow, CheckboxRow} from '../FormRow';
import LocationPickerModal from '../LocationPickerModal';
import QRScannerModal, {isQRCodeActive} from '../QRScannerModal';
import ProcessingOverlay from '../ProcessingOverlay';
import {useGeofence} from '../GeofenceContext';
import useNetworkCheck, {checkIsOnline} from '../../../hooks/useNetworkCheck';
import useLocation from '../../../hooks/useLocation';
import DeviceInfo from 'react-native-device-info';
import {loadRecords} from '../../../screens/AttendanceManagement/helpers';
import {enqueueAttendance} from '../../../services/AttendanceManagement/SyncManager';
import {
  ACTION_TYPES,
  ATTENDANCE_MODE,
  buildAttendancePayload,
  getActionFence,
  getValidationMessage,
} from './attendanceActionHelpers';
import {C, R} from '../theme';
// import {checkIsOnline, ATTENDANCE_MODE} from '../../../hooks/useNetworkCheck';

const GENERATION_TYPE = 'ClockOut';

const ConfirmClockOutScreen = ({
  initialQrValue = null,
  initialFaceResult = null,
  onConfirm,
  onBack,
}) => {
  const [note, setNote] = useState('');
  const [endWorkDay, setEndWorkDay] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingLabel, setProcessingLabel] = useState('Processing...');
  const [refreshing, setRefreshing] = useState(false);
  const [actionFence, setActionFence] = useState(null);
  const [requiresQR, setRequiresQR] = useState(false);
  const [qrValue, setQrValue] = useState(initialQrValue);

  const {matchedFence, clockInFence, coords, refresh, locationError} =
    useGeofence();
  const {runNetworkCheck} = useNetworkCheck();
  const {spoofingDetected, spoofingReason} = useLocation();
  const {userData} = useSelector(s => s.user);

  const applyLatestState = useCallback(
    (latestState, autoPromptQr = true) => {
      const nextFence = getActionFence({
        actionType: ACTION_TYPES.CLOCK_OUT,
        matchedFence: latestState?.matchedFence ?? matchedFence,
        clockInFence,
      });
      const nextRequiresQR = isQRCodeActive(nextFence);
      const fenceChanged =
        String(actionFence?.GeoFenceID ?? '') !==
        String(nextFence?.GeoFenceID ?? '');
      const nextQrValue = nextRequiresQR
        ? fenceChanged
          ? null
          : qrValue
        : null;

      setActionFence(nextFence);
      setRequiresQR(nextRequiresQR);
      setQrValue(nextQrValue);

      if (!nextRequiresQR) {
        setQrModalVisible(false);
      } else if (autoPromptQr && !nextQrValue) {
        setQrModalVisible(true);
      }

      return {
        fence: nextFence,
        qrRequired: nextRequiresQR,
        qrValue: nextQrValue,
        coords: latestState?.coords ?? coords,
        locationError: latestState?.locationError ?? locationError,
      };
    },
    [actionFence, clockInFence, coords, locationError, matchedFence, qrValue],
  );

  const loadLatestState = useCallback(
    async ({label, asRefresh = false, autoPromptQr = true} = {}) => {
      if (asRefresh) {
        setRefreshing(true);
      }
      setProcessingLabel(label ?? 'Processing...');
      setIsProcessing(true);

      try {
        const latestState = await refresh();
        return applyLatestState(latestState, autoPromptQr);
      } catch (error) {
        Alert.alert(
          'Retrieve Failed',
          error.message || 'Unable to retrieve the latest attendance state.',
        );
        return null;
      } finally {
        if (asRefresh) {
          setRefreshing(false);
        }
        setIsProcessing(false);
      }
    },
    [applyLatestState, refresh],
  );

  useEffect(() => {
    // autoPromptQr=false: QR was already scanned before this screen opened.
    loadLatestState({label: 'Processing...', autoPromptQr: false});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleQRSuccess = useCallback(rawValue => {
    setQrModalVisible(false);
    setQrValue(rawValue);
  }, []);

  const handleConfirmPress = useCallback(async () => {
    if (isProcessing) return;

    setProcessingLabel('Processing...');
    setIsProcessing(true);

    try {
      const isOnline = await checkIsOnline();
      const mode = isOnline ? ATTENDANCE_MODE.ONLINE : ATTENDANCE_MODE.OFFLINE;

      const latestState = await refresh();
      const resolvedState = applyLatestState(latestState, false);
      const records = await loadRecords({person: userData?.Person});

      if (spoofingDetected) {
        Alert.alert(
          'GPS Integrity Issue',
          'Suspicious GPS activity detected. Cannot record attendance.',
        );
        return;
      }

      if (isOnline) {
        const validationMessage = getValidationMessage({
          actionType: ACTION_TYPES.CLOCK_OUT,
          records,
          matchedFence: resolvedState?.fence,
          locationError: resolvedState?.locationError,
        });
        if (validationMessage) {
          Alert.alert('Validation Failed', validationMessage);
          return;
        }

        if (resolvedState?.qrRequired && !resolvedState.qrValue) {
          setQrModalVisible(true);
          Alert.alert(
            'QR Verification Required',
            'Scan the attendance QR code before clocking out.',
          );
          return;
        }
      }

      let networkResult = {
        passed: true,
        networkContext: {networkId: null, networkName: null, bssid: null},
      };
      if (isOnline) {
        networkResult = await runNetworkCheck(resolvedState?.fence);
        if (!networkResult.passed) {
          Alert.alert(networkResult.errorTitle, networkResult.errorMessage);
          return;
        }
      }

      const deviceId = await DeviceInfo.getUniqueId();

      const attendanceData = await buildAttendancePayload({
        fence: resolvedState?.fence,
        coords: resolvedState?.coords,
        generationType: GENERATION_TYPE,
        networkContext: networkResult.networkContext,
        personRecId: userData?.Person,
        qrValue: isOnline ? resolvedState?.qrValue : null,
        faceResult: initialFaceResult, // Always pass, since liveness is on-device
        deviceContext: {id: deviceId},
        mode,
      });

      await enqueueAttendance(attendanceData);
      await onConfirm(
        note,
        endWorkDay,
        isOnline ? resolvedState?.qrValue ?? null : null,
      );
    } catch (error) {
      Alert.alert(
        'Clock Out Failed',
        error.message || 'Unable to record attendance. Please try again.',
      );
    } finally {
      setIsProcessing(false);
    }
  }, [
    applyLatestState,
    endWorkDay,
    isProcessing,
    note,
    onConfirm,
    refresh,
    runNetworkCheck,
    spoofingDetected,
    userData?.Person,
  ]);

  const displayFence = actionFence ?? clockInFence ?? matchedFence;
  const matched = !!matchedFence;

  return (
    <>
      <ConfirmSheet
        title="Confirm Clock Out"
        subtitle="Clock out and stop the timer"
        userName={userData?.employeeName || userData?.Name || 'Employee'}
        status="Active now"
        onBack={onBack}
        onConfirm={handleConfirmPress}
        onRefresh={() =>
          loadLatestState({label: 'Refreshing...', asRefresh: true})
        }
        refreshing={refreshing}
        confirmDisabled={requiresQR && (!qrValue || !qrValue.value)}
        disableActions={isProcessing}
        confirmLabel="Clock Out"
        confirmColor={C.redMid}>
        {isProcessing && <ProcessingOverlay label={processingLabel} />}

        {requiresQR && (
          <View style={S.qrBadge}>
            <Text style={S.qrBadgeTxt}>
              {qrValue?.value
                ? `QR verified (${qrValue.value.slice(0, 10)}...)`
                : 'QR scan required before clock out.'}
            </Text>
            <TouchableOpacity
              style={S.qrAction}
              onPress={() => setQrModalVisible(true)}
              disabled={isProcessing}>
              <Text style={S.qrActionText}>
                {qrValue?.value ? 'Scan Again' : 'Open Scanner'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[
            S.locationRow,
            matched ? S.locationRowOk : S.locationRowNeutral,
          ]}
          onPress={() => setLocationModalVisible(true)}
          activeOpacity={0.75}
          disabled={isProcessing}>
          <View
            style={[
              S.locDot,
              {backgroundColor: matched ? C.greenMid : C.inkFaint},
            ]}
          />
          <View style={S.locBody}>
            <Text style={S.locLabel}>CURRENT LOCATION</Text>
            <Text
              style={[S.locValue, !matched && {color: C.inkMuted}]}
              numberOfLines={1}>
              {matched
                ? matchedFence?.FenceName
                : locationError ?? 'Outside office zone (allowed)'}
            </Text>
          </View>
          <Text
            style={[S.locArrow, {color: matched ? C.greenDark : C.inkFaint}]}>
            ›
          </Text>
        </TouchableOpacity>
        <View style={S.infoRow}>
          <Text style={S.infoText}>
            Validation uses the original clock-in fence:
            {displayFence?.FenceName ? ` ${displayFence.FenceName}` : ' N/A'}
          </Text>
        </View>
        <View style={S.divider} />

        <NoteRow value={note} onChangeText={setNote} />
        <CheckboxRow
          checked={endWorkDay}
          onToggle={() => setEndWorkDay(value => !value)}
          label="End work for the day?"
        />
      </ConfirmSheet>

      <LocationPickerModal
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
      />

      <QRScannerModal
        visible={qrModalVisible}
        eventLabel="CLOCK_OUT"
        fenceName={displayFence?.FenceName}
        onScanSuccess={handleQRSuccess}
        onCancel={() => setQrModalVisible(false)}
      />
    </>
  );
};

export default ConfirmClockOutScreen;

const S = StyleSheet.create({
  qrBadge: {
    backgroundColor: C.blueLight,
    borderWidth: 1,
    borderColor: C.blueMid,
    borderRadius: R.sm,
    padding: 12,
    marginBottom: 10,
    gap: 10,
  },
  qrBadgeTxt: {fontSize: 12, color: C.blueDark, fontWeight: '500'},
  qrAction: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: R.full,
    backgroundColor: C.blue,
  },
  qrActionText: {fontSize: 12, color: C.white, fontWeight: '700'},
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
  locDot: {width: 8, height: 8, borderRadius: 4},
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
  infoRow: {paddingBottom: 8},
  infoText: {fontSize: 12, color: C.inkMuted},
  divider: {height: 1, backgroundColor: C.border, marginBottom: 4},
});
