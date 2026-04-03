// ─────────────────────────────────────────────
// components/AttendanceManagement/QRScannerModal.js
// ─────────────────────────────────────────────
/* eslint-disable curly */
/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  StyleSheet,
  Platform,
  Linking,
  ActivityIndicator,
  Vibration,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCodeScanner,
} from 'react-native-vision-camera';
import {C, R, Sh} from './theme';

// ── Helpers ───────────────────────────────────
export const isQRCodeActive = fence => {
  if (!fence) return false;
  const val = String(fence.IsQRCodeActive ?? '')
    .trim()
    .toLowerCase();
  return val === 'yes' || val === '1' || val === 'true';
};

// ── Face ID helpers ────────────────────────────
// IsFaceIDActive values from RetrieveByPerson:
//   'NotRequired'            → no face gate
//   'Required'               → face gate before action
//   'RequiredWithBackground' → face gate + periodic background re-check
export const FACE_ID_MODE = {
  NOT_REQUIRED: 'NotRequired',
  REQUIRED: 'Required',
  REQUIRED_WITH_BACKGROUND: 'RequiredWithBackground',
};

export const isFaceRecognitionActive = fence => {
  const val = String(fence?.IsFaceIDActive ?? '').trim();
  return (
    val === FACE_ID_MODE.REQUIRED ||
    val === FACE_ID_MODE.REQUIRED_WITH_BACKGROUND
  );
};

export const isFaceBackgroundRequired = fence =>
  String(fence?.IsFaceIDActive ?? '').trim() ===
  FACE_ID_MODE.REQUIRED_WITH_BACKGROUND;

const SCAN_TIMEOUT_MS = 30_000; // QR3 — 30 s before showing timeout UI
const SCAN_DEBOUNCE_MS = 500; // QR5 — ignore rapid re-scans

// ─────────────────────────────────────────────
const QRScannerModal = ({
  visible,
  eventLabel, // 'CLOCK_IN' | 'CLOCK_OUT' | 'BREAK_START' | 'BREAK_END'
  fenceName, // displayed in UI
  onScanSuccess, // (rawValue: string) => void — called once per open
  onCancel, // () => void
}) => {
  const [permissionStatus, setPermissionStatus] = useState('checking'); // 'checking' | 'granted' | 'denied' | 'unavailable'
  const [torchOn, setTorchOn] = useState(false); // QR7
  const [timedOut, setTimedOut] = useState(false); // QR3
  const [scanned, setScanned] = useState(false); // one-shot lock
  const [scanError, setScanError] = useState(null); // QR4

  const lastScanRef = useRef(0); // QR5
  const timeoutRef = useRef(null);
  const scanLockRef = useRef(false); // Synchronous lock to prevent multiple frame triggers

  const device = useCameraDevice('back'); // QR2

  // ── Permission + device check ────────────────
  useEffect(() => {
    if (!visible) return;

    // Reset state on each open
    setScanned(false);
    scanLockRef.current = false;
    setTimedOut(false);
    setTorchOn(false);
    setScanError(null);

    const checkPermission = async () => {
      // QR2 — no camera
      if (!device) {
        setPermissionStatus('unavailable');
        return;
      }

      const current = await Camera.getCameraPermissionStatus();

      if (current === 'granted') {
        setPermissionStatus('granted');
        startTimeout();
        return;
      }

      if (current === 'denied') {
        setPermissionStatus('denied');
        return;
      }

      // 'not-determined' — request
      const requested = await Camera.requestCameraPermission();
      if (requested === 'granted') {
        setPermissionStatus('granted');
        startTimeout();
      } else {
        setPermissionStatus('denied');
      }
    };

    checkPermission();

    return () => clearTimeout(timeoutRef.current); // QR6
  }, [visible, device]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── QR3 — Scan timeout ───────────────────────
  const startTimeout = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (!scanned) setTimedOut(true);
    }, SCAN_TIMEOUT_MS);
  };

  const handleRetry = useCallback(() => {
    setTimedOut(false);
    setScanError(null);
    scanLockRef.current = false;
    setScanned(false);
    startTimeout();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── QR code scanner ──────────────────────────
  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: codes => {
      if (scanned || timedOut || scanLockRef.current) return; // one-shot synchronous check

      // QR5 — debounce
      const now = Date.now();
      if (now - lastScanRef.current < SCAN_DEBOUNCE_MS) return;
      lastScanRef.current = now;

      if (!codes.length) return;

      const raw = codes[0]?.value ?? '';

      // QR4 — Validate it looks like an attendance QR
      // Adjust this regex to match your actual QR payload format
      if (!raw || raw.trim().length === 0) {
        setScanError('Invalid QR code. Please scan the correct attendance QR.');
        return;
      }

      // ── Success ──────────────────────────────
      scanLockRef.current = true; // Lock immediately on the same thread
      clearTimeout(timeoutRef.current);
      setScanned(true);
      Vibration.vibrate(200);

      const qrObject = {
        value: raw,
        type: codes[0]?.type ?? 'qr',
        scannedAt: new Date().toISOString(),
      };

      console.log(`\n========== QR SCAN: ${eventLabel} ==========`);
      console.log('📷 QR Object:', JSON.stringify(qrObject, null, 2));
      console.log('🏢 Fence:', fenceName);
      console.log('============================================\n');

      // Small delay so user sees the success flash
      setTimeout(() => onScanSuccess(qrObject), 500);
    },
  });

  // ── Event label display map ──────────────────
  const EVENT_DISPLAY = {
    CLOCK_IN: 'Clock In',
    CLOCK_OUT: 'Clock Out',
    BREAK_START: 'Break Start',
    BREAK_END: 'Break End',
  };

  const displayLabel = EVENT_DISPLAY[eventLabel] ?? eventLabel;

  // ── Render states ────────────────────────────

  const renderBody = () => {
    // Checking permission
    if (permissionStatus === 'checking') {
      return (
        <View style={S.center}>
          <ActivityIndicator size="large" color={C.blue} />
          <Text style={S.centerTxt}>Checking camera permission…</Text>
        </View>
      );
    }

    // QR2 — No camera hardware
    if (permissionStatus === 'unavailable') {
      return (
        <View style={S.center}>
          <Text style={S.stateEmoji}>📷</Text>
          <Text style={S.stateTitle}>No Camera Found</Text>
          <Text style={S.stateSub}>
            This device does not have a usable back camera. QR verification is
            unavailable.
          </Text>
          <TouchableOpacity style={S.cancelBtn} onPress={onCancel}>
            <Text style={S.cancelBtnTxt}>Cancel</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // QR1 — Permission denied
    if (permissionStatus === 'denied') {
      return (
        <View style={S.center}>
          <Text style={S.stateEmoji}>🚫</Text>
          <Text style={S.stateTitle}>Camera Access Denied</Text>
          <Text style={S.stateSub}>
            Please enable camera permission in your device Settings so QR
            attendance verification can work.
          </Text>
          <TouchableOpacity
            style={S.primaryBtn}
            onPress={() =>
              Platform.OS === 'android'
                ? Linking.openSettings()
                : Linking.openURL('app-settings:')
            }>
            <Text style={S.primaryBtnTxt}>Open Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={S.cancelBtn} onPress={onCancel}>
            <Text style={S.cancelBtnTxt}>Cancel</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // QR3 — Timed out
    if (timedOut) {
      return (
        <View style={S.center}>
          <Text style={S.stateEmoji}>⏱</Text>
          <Text style={S.stateTitle}>Scan Timed Out</Text>
          <Text style={S.stateSub}>
            No QR code was detected within 30 seconds. Make sure the QR code is
            well-lit and held steady.
          </Text>
          <TouchableOpacity style={S.primaryBtn} onPress={handleRetry}>
            <Text style={S.primaryBtnTxt}>↺ Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={S.cancelBtn} onPress={onCancel}>
            <Text style={S.cancelBtnTxt}>Cancel</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // QR4 — Invalid QR, but camera still active — show error overlay
    if (scanError) {
      return (
        <View style={S.center}>
          <Text style={S.stateEmoji}>⚠️</Text>
          <Text style={S.stateTitle}>Invalid QR Code</Text>
          <Text style={S.stateSub}>{scanError}</Text>
          <TouchableOpacity
            style={S.primaryBtn}
            onPress={() => {
              setScanError(null);
              startTimeout();
            }}>
            <Text style={S.primaryBtnTxt}>↺ Scan Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={S.cancelBtn} onPress={onCancel}>
            <Text style={S.cancelBtnTxt}>Cancel</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Scanned successfully — brief success flash
    if (scanned) {
      return (
        <View style={S.center}>
          <View style={S.successCircle}>
            <Text style={S.successCheck}>✓</Text>
          </View>
          <Text style={[S.stateTitle, {color: C.greenDark}]}>QR Verified!</Text>
          <Text style={S.stateSub}>Processing your {displayLabel}…</Text>
        </View>
      );
    }

    // ── Active scanning view ─────────────────────
    return (
      <View style={{flex: 1}}>
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={
            visible && permissionStatus === 'granted' && !scanned && !timedOut
          }
          codeScanner={codeScanner}
          torch={torchOn ? 'on' : 'off'} // QR7
        />

        {/* Overlay: corner brackets */}
        <View style={S.overlay}>
          <View style={S.scanWindow}>
            <View style={[S.corner, S.cornerTL]} />
            <View style={[S.corner, S.cornerTR]} />
            <View style={[S.corner, S.cornerBL]} />
            <View style={[S.corner, S.cornerBR]} />
          </View>
          <Text style={S.scanHint}>Align the QR code within the frame</Text>

          {/* QR4 error inline */}
          {scanError && (
            <View style={S.errorBadge}>
              <Text style={S.errorBadgeTxt}>{scanError}</Text>
            </View>
          )}
        </View>

        {/* QR7 — Torch toggle */}
        <TouchableOpacity
          style={S.torchBtn}
          onPress={() => setTorchOn(v => !v)}>
          <Text style={S.torchIcon}>{torchOn ? '🔦' : '💡'}</Text>
          <Text style={S.torchTxt}>{torchOn ? 'Torch On' : 'Torch Off'}</Text>
        </TouchableOpacity>

        {/* Timeout countdown hint */}
        <View style={S.timeoutHint}>
          <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" />
          <Text style={S.timeoutHintTxt}>Waiting for QR code…</Text>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onCancel} // QR6 — Android back button
    >
      <SafeAreaView style={S.sheet}>
        {/* Header */}
        <View style={S.header}>
          <View>
            <Text style={S.headerTitle}>QR Verification</Text>
            <Text style={S.headerSub}>
              {displayLabel}
              {fenceName ? `  ·  ${fenceName}` : ''}
            </Text>
          </View>
          <TouchableOpacity onPress={onCancel} style={S.closeBtn}>
            <Text style={S.closeTxt}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Instruction strip */}
        {permissionStatus === 'granted' &&
          !scanned &&
          !timedOut &&
          !scanError && (
            <View style={S.instructStrip}>
              <Text style={S.instructTxt}>
                Scan the attendance QR code at your location to confirm your{' '}
                {displayLabel.toLowerCase()}.
              </Text>
            </View>
          )}

        <View style={{flex: 1}}>{renderBody()}</View>
      </SafeAreaView>
    </Modal>
  );
};

export default QRScannerModal;

// ─────────────────────────────────────────────
const CORNER_SIZE = 28;
const CORNER_THICK = 4;
const WINDOW_SIZE = 240;

const S = StyleSheet.create({
  sheet: {flex: 1, backgroundColor: '#000'},

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {fontSize: 17, fontWeight: '700', color: '#fff'},
  headerSub: {fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2},
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeTxt: {fontSize: 14, color: '#fff', fontWeight: '700'},

  instructStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(27,79,216,0.85)',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  instructIcon: {fontSize: 16},
  instructTxt: {flex: 1, fontSize: 12, color: '#fff', lineHeight: 18},

  // ── Scanner overlay ──────────────────────────
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scanWindow: {
    width: WINDOW_SIZE,
    height: WINDOW_SIZE,
    backgroundColor: 'transparent',
    position: 'relative',
  },

  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: '#fff',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICK,
    borderLeftWidth: CORNER_THICK,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICK,
    borderRightWidth: CORNER_THICK,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICK,
    borderLeftWidth: CORNER_THICK,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICK,
    borderRightWidth: CORNER_THICK,
    borderBottomRightRadius: 4,
  },

  scanHint: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginTop: 24,
    textAlign: 'center',
  },

  errorBadge: {
    marginTop: 16,
    backgroundColor: 'rgba(220,38,38,0.85)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: R.full,
  },
  errorBadgeTxt: {color: '#fff', fontSize: 13, fontWeight: '600'},

  // ── Torch ────────────────────────────────────
  torchBtn: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: R.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  torchIcon: {fontSize: 18},
  torchTxt: {color: '#fff', fontSize: 13, fontWeight: '600'},

  // ── Timeout hint ─────────────────────────────
  timeoutHint: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeoutHintTxt: {color: 'rgba(255,255,255,0.5)', fontSize: 12},

  // ── Generic state views ──────────────────────
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
    backgroundColor: C.bg,
  },
  stateEmoji: {fontSize: 52, marginBottom: 16},
  stateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: C.ink,
    textAlign: 'center',
    marginBottom: 8,
  },
  stateSub: {
    fontSize: 14,
    color: C.inkSub,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  centerTxt: {fontSize: 14, color: C.inkMuted, marginTop: 16},

  primaryBtn: {
    backgroundColor: C.blue,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: R.full,
    marginBottom: 12,
    ...Sh.sm,
  },
  primaryBtnTxt: {color: '#fff', fontWeight: '700', fontSize: 15},

  cancelBtn: {
    backgroundColor: C.surfaceAlt,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: R.full,
  },
  cancelBtnTxt: {color: C.inkSub, fontWeight: '600', fontSize: 15},

  // ── Success flash ────────────────────────────
  successCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: C.greenMid,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    ...Sh.md,
  },
  successCheck: {fontSize: 42, color: '#fff', fontWeight: '700'},
});
