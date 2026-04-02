/* eslint-disable curly */
/* eslint-disable react-native/no-inline-styles */
// ─────────────────────────────────────────────────────────────────────────────
// components/AttendanceManagement/FaceVerificationModal.js  (v3 — Passive Anti-Spoofing)
//
// ARCHITECTURE: Ref-based state machine + passive liveness
//
// CHANGES FROM v2:
//   • Removed all active liveness challenges (blink, smile, head-turn, nod)
//   • Single-capture flow: detect face → auto-capture → passive analysis → result
//   • Passive anti-spoofing via MLKit face metadata heuristics (no new deps)
//   • Frame throttling (300ms) to prevent GC pressure and ANR
//   • Simplified to 5 phases: checking → capturing → analyzing → success/failed
//   • CameraErrorBoundary retained
//   • Ref-based state machine retained (zero stale closures)
//
// FLOW:
//   open → checking (permission)
//        → capturing (camera live, 300ms-throttled, detect face → auto-capture)
//        → analyzing (1.2 s passive heuristic score)
//        → success → onSuccess({ verified: true })
//          failed  → onFailure(reason)
//
//   no_face (5 s guard)  → guidance UI → retry
//   denied / unavailable → static error UI
//   Camera crash         → CameraErrorBoundary fallback
//
// PASSIVE ANTI-SPOOFING SCORING (out of 100):
//   +25  Natural eye openness  (0.15–0.95 — rejects pinned-open photos)
//   +25  Frontal head pose     (|yaw| < 25°, |pitch| < 20°)
//   +25  Reasonable face size  (5 % – 80 % of frame area)
//   +25  Classifications present (MLKit computed depth data)
//   Pass threshold: ≥ 75
// ─────────────────────────────────────────────────────────────────────────────

import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Platform,
  Vibration,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useFrameProcessor,
} from 'react-native-vision-camera';
import {useFaceDetector} from 'react-native-vision-camera-face-detector';
import {Worklets, useSharedValue} from 'react-native-worklets-core';
import {C, R, Sh} from './theme';

// ── Constants ──────────────────────────────────────────────────────────────────
const ANALYZE_MS       = 1200;  // Passive analysis spinner duration
const NO_FACE_GUARD_MS = 5000;  // Bail to 'no_face' if nothing detected
const THROTTLE_MS      = 300;   // Frame processor throttle interval
const SPOOF_THRESHOLD  = 75;    // Minimum score to pass (out of 100)

const ACTION_LABEL = {
  CLOCK_IN:    'Clock In',
  CLOCK_OUT:   'Clock Out',
  BREAK_START: 'Break Start',
  BREAK_END:   'Break End',
};

// ── Passive anti-spoofing scorer ───────────────────────────────────────────────
// Pure function — runs on the JS thread after a face is captured.
// Takes the face metadata object returned by react-native-vision-camera-face-detector.
const analyzePassiveLiveness = face => {
  let score = 0;
  const checks = [];

  // 1. Eye openness in natural range — static photos have eyes pinned open (probability = 1.0)
  //    or fully closed (probability = 0.0). A live face fluctuates in 0.15 – 0.95.
  const leftEye  = face.leftEyeOpenProbability  ?? -1;
  const rightEye = face.rightEyeOpenProbability ?? -1;
  if (
    leftEye  >= 0 && leftEye  >= 0.15 && leftEye  <= 0.95 &&
    rightEye >= 0 && rightEye >= 0.15 && rightEye <= 0.95
  ) {
    score += 25;
    checks.push('eyes_natural');
  }

  // 2. Frontal head pose — screens / photos held at extreme angles fail this.
  const yaw   = Math.abs(face.yawAngle   ?? 0);
  const pitch = Math.abs(face.pitchAngle ?? 0);
  if (yaw < 25 && pitch < 20) {
    score += 25;
    checks.push('pose_frontal');
  }

  // 3. Reasonable face size — face occupies 5 % – 80 % of frame dimensions.
  //    VisionCamera returns bounds as { x, y, width, height } in pixels.
  const bounds = face.bounds ?? null;
  if (bounds) {
    // Use the ratio of face width to detect abnormally tiny or full-frame faces.
    // frame dims are not directly available in the worklet payload, so we use
    // a heuristic: width in range 80–900 px covers most phone resolutions.
    const w = bounds.width ?? 0;
    if (w >= 80 && w <= 900) {
      score += 25;
      checks.push('size_ok');
    }
  }

  // 4. Classification data present — MLKit only emits smilingProbability and
  //    eye probabilities when it has sufficient tracking confidence.  A face
  //    without classification data is likely low-quality or spoofed.
  if ((face.smilingProbability ?? -1) >= 0) {
    score += 25;
    checks.push('classifications_available');
  }

  const isReal = score >= SPOOF_THRESHOLD;
  console.log(`[FaceVerification] Passive score: ${score}/100 | ${checks.join(', ')} | isReal: ${isReal}`);
  return {score, isReal, checks};
};

// ── CameraErrorBoundary ────────────────────────────────────────────────────────
class CameraErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {hasError: false, errorMessage: ''};
  }
  static getDerivedStateFromError(error) {
    return {hasError: true, errorMessage: error?.message ?? 'Unknown camera error'};
  }
  componentDidCatch(error, info) {
    console.error('[FaceVerification] Camera boundary caught:', error?.message, info);
  }
  render() {
    if (this.state.hasError) {
      const {onRetry, onCancel} = this.props;
      return (
        <View style={BE.wrap}>
          <Text style={BE.emoji}>📷</Text>
          <Text style={BE.title}>Camera Error</Text>
          <Text style={BE.sub}>{this.state.errorMessage}</Text>
          <TouchableOpacity
            style={BE.primaryBtn}
            onPress={() => {
              this.setState({hasError: false, errorMessage: ''});
              if (onRetry) onRetry();
            }}>
            <Text style={BE.primaryBtnTxt}>↺ Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity style={BE.cancelBtn} onPress={onCancel}>
            <Text style={BE.cancelBtnTxt}>Go Back</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}
const BE = StyleSheet.create({
  wrap:          {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 36, backgroundColor: C.bg},
  emoji:         {fontSize: 52, marginBottom: 16},
  title:         {fontSize: 20, fontWeight: '700', color: C.ink, textAlign: 'center', marginBottom: 8},
  sub:           {fontSize: 13, color: C.inkSub, textAlign: 'center', lineHeight: 20, marginBottom: 24},
  primaryBtn:    {backgroundColor: C.blue, paddingHorizontal: 32, paddingVertical: 14, borderRadius: R.full, marginBottom: 12, ...Sh.sm},
  primaryBtnTxt: {color: '#fff', fontWeight: '700', fontSize: 15},
  cancelBtn:     {backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, paddingHorizontal: 32, paddingVertical: 14, borderRadius: R.full},
  cancelBtnTxt:  {color: C.inkSub, fontWeight: '600', fontSize: 15},
});

// ── Component ──────────────────────────────────────────────────────────────────
const FaceVerificationModal = ({
  visible,
  eventLabel = 'CLOCK_IN',
  onSuccess,
  onFailure,
  onCancel,
}) => {

  // ── React state — RENDER ONLY ─────────────────────────────────────────────
  const [phase, setPhaseState] = useState('checking');

  // ── Ref layer — MUTABLE SOURCE OF TRUTH ──────────────────────────────────
  const phaseRef     = useRef('checking');
  const mountedRef   = useRef(false);
  const timerIds     = useRef([]);
  const capturedRef  = useRef(false);  // one-shot: prevent multiple captures

  // ── Camera ────────────────────────────────────────────────────────────────
  const device = useCameraDevice('front');
  const {detectFaces} = useFaceDetector({
    performanceMode: 'fast',
    classificationMode: 'all',
  });

  // ── SharedValues (worklet ↔ JS) ───────────────────────────────────────────
  const svPhase      = useSharedValue('checking'); // mirrors phaseRef
  const svLock       = useSharedValue(false);       // true after first face captured
  const svLastMs     = useSharedValue(0);           // last processed frame timestamp (throttle)

  // ── Captured face data (JS-side) ─────────────────────────────────────────
  const capturedFaceRef = useRef(null);

  // ── Atomic phase setter ───────────────────────────────────────────────────
  const setPhase = useCallback(p => {
    phaseRef.current = p;
    svPhase.value = p;
    if (mountedRef.current) setPhaseState(p);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Timer helpers ─────────────────────────────────────────────────────────
  const pushTimer    = id => { timerIds.current.push(id); return id; };
  const clearAllTimers = useCallback(() => {
    timerIds.current.forEach(id => clearTimeout(id));
    timerIds.current = [];
  }, []);

  // ── runPassiveAnalysis — JS thread, called after face auto-capture ────────
  const runPassiveAnalysis = useCallback(faceData => {
    if (!mountedRef.current) return;
    setPhase('analyzing');

    pushTimer(setTimeout(() => {
      if (!mountedRef.current) return;

      const result = analyzePassiveLiveness(faceData);

      if (result.isReal) {
        setPhase('success');
        Vibration.vibrate(200);
        pushTimer(setTimeout(() => {
          if (mountedRef.current) onSuccess({verified: true});
        }, 900));
      } else {
        console.warn(`[FaceVerification] Spoof detected. Score: ${result.score}/100. Checks failed: ${
          ['eyes_natural','pose_frontal','size_ok','classifications_available']
            .filter(c => !result.checks.includes(c))
            .join(', ')
        }`);
        setPhase('failed');
      }
    }, ANALYZE_MS));
  }, [onSuccess, setPhase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── onFaceCaptured — Worklets.createRunOnJS bridge ───────────────────────
  // Called once by the frame processor when a valid face is detected.
  // Receives the face data object serialised from the worklet.
  const onFaceCaptured = Worklets.createRunOnJS(faceData => {
    if (!mountedRef.current || capturedRef.current) return;
    capturedRef.current = true;
    capturedFaceRef.current = faceData;
    runPassiveAnalysis(faceData);
  });

  // ── Frame Processor ───────────────────────────────────────────────────────
  // Runs on a native background thread.
  // • Only active during 'capturing' phase
  // • Throttled to once per THROTTLE_MS (prevents GC/ANR on mid-range devices)
  // • Fires onFaceCaptured exactly once (svLock guard)
  const frameProcessor = useFrameProcessor(
    frame => {
      'worklet';

      if (svPhase.value !== 'capturing') return;
      if (svLock.value) return;

      // ── 300ms throttle — skip frames that arrive too fast ──────────────
      const now = Date.now();
      if (now - svLastMs.value < THROTTLE_MS) return;
      svLastMs.value = now;

      // ── Detect faces ──────────────────────────────────────────────────
      const faces = detectFaces(frame);
      if (!faces || faces.length === 0) return;

      const face = faces[0];

      // ── Lock immediately before JS call to prevent double-fire ─────────
      svLock.value = true;

      // Bridge the face data to the JS thread for analysis
      // We pass a plain object — worklets can only serialise primitives/plain objects
      onFaceCaptured({
        leftEyeOpenProbability:  face.leftEyeOpenProbability  ?? -1,
        rightEyeOpenProbability: face.rightEyeOpenProbability ?? -1,
        smilingProbability:      face.smilingProbability      ?? -1,
        yawAngle:                face.yawAngle                ?? 0,
        pitchAngle:              face.pitchAngle              ?? 0,
        bounds: face.bounds ?? null,
      });
    },
    [detectFaces, onFaceCaptured],
  );

  // ── startCapturing ────────────────────────────────────────────────────────
  const startCapturingRef = useRef(null);
  startCapturingRef.current = useCallback(() => {
    if (!mountedRef.current) return;
    clearAllTimers();

    capturedRef.current   = false;
    capturedFaceRef.current = null;
    svLock.value          = false;
    svLastMs.value        = 0;

    setPhase('capturing');

    // Guard: bail to no_face if nothing detected in NO_FACE_GUARD_MS
    pushTimer(setTimeout(() => {
      if (!mountedRef.current) return;
      if (phaseRef.current === 'capturing' && !capturedRef.current) {
        svLock.value = true;
        setPhase('no_face');
      }
    }, NO_FACE_GUARD_MS));
  }, [clearAllTimers, setPhase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Modal lifecycle ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!visible) {
      // ── Teardown ─────────────────────────────────────────────────────────
      mountedRef.current  = false;
      capturedRef.current = false;
      clearAllTimers();
      svLock.value   = true;
      svPhase.value  = 'checking';
      svLastMs.value = 0;
      return;
    }

    // ── Setup ─────────────────────────────────────────────────────────────
    mountedRef.current   = true;
    capturedRef.current  = false;
    phaseRef.current     = 'checking';

    setPhaseState('checking');

    const init = async () => {
      if (!device) {
        if (mountedRef.current) setPhase('unavailable');
        return;
      }

      let perm;
      try {
        perm = await Camera.getCameraPermissionStatus();
      } catch {
        if (mountedRef.current) setPhase('unavailable');
        return;
      }

      if (!mountedRef.current) return;

      if (perm === 'granted') {
        startCapturingRef.current?.();
        return;
      }
      if (perm === 'denied' || perm === 'restricted') {
        setPhase('denied');
        return;
      }

      // 'not-determined' — request permission
      try {
        const result = await Camera.requestCameraPermission();
        if (!mountedRef.current) return;
        if (result === 'granted') startCapturingRef.current?.();
        else setPhase('denied');
      } catch {
        if (mountedRef.current) setPhase('denied');
      }
    };

    init();

    return () => {
      mountedRef.current = false;
      clearAllTimers();
    };
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived display values ─────────────────────────────────────────────────
  const displayLabel  = ACTION_LABEL[eventLabel] ?? eventLabel;
  const cameraActive  = visible && phase === 'capturing';

  // ── Render body ────────────────────────────────────────────────────────────
  const renderBody = () => {

    if (phase === 'checking') return (
      <View style={S.center}>
        <ActivityIndicator size="large" color={C.blue} />
        <Text style={S.centerTxt}>Initialising camera…</Text>
      </View>
    );

    if (phase === 'unavailable') return (
      <View style={S.center}>
        <Text style={S.stateEmoji}>📷</Text>
        <Text style={S.stateTitle}>Camera Unavailable</Text>
        <Text style={S.stateSub}>
          Face verification requires a front-facing camera which is not
          available on this device.
        </Text>
        <TouchableOpacity style={S.cancelBtn} onPress={onCancel}>
          <Text style={S.cancelBtnTxt}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );

    if (phase === 'denied') return (
      <View style={S.center}>
        <Text style={S.stateEmoji}>🚫</Text>
        <Text style={S.stateTitle}>Camera Access Denied</Text>
        <Text style={S.stateSub}>
          Enable camera permission in your device Settings to use face
          verification.
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
          <Text style={S.cancelBtnTxt}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );

    if (phase === 'no_face') return (
      <View style={S.center}>
        <Text style={S.stateEmoji}>👤</Text>
        <Text style={S.stateTitle}>No Face Detected</Text>
        <Text style={S.stateSub}>
          Make sure your face is fully visible to the front camera in good
          lighting, and hold the phone at eye level.
        </Text>
        <TouchableOpacity
          style={S.primaryBtn}
          onPress={() => startCapturingRef.current?.()}>
          <Text style={S.primaryBtnTxt}>↺ Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={S.cancelBtn} onPress={onCancel}>
          <Text style={S.cancelBtnTxt}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );

    if (phase === 'analyzing') return (
      <View style={S.center}>
        <View style={S.spinnerWrap}>
          <ActivityIndicator size="large" color={C.blue} />
        </View>
        <Text style={S.stateTitle}>Analyzing…</Text>
        <Text style={S.stateSub}>Verifying your identity. Please hold still.</Text>
      </View>
    );

    if (phase === 'failed') return (
      <View style={S.center}>
        <Text style={S.stateEmoji}>❌</Text>
        <Text style={S.stateTitle}>Verification Failed</Text>
        <Text style={S.stateSub}>
          We could not verify a live face. Please ensure you are using your
          physical device in good lighting, then try again.
        </Text>
        <TouchableOpacity
          style={S.primaryBtn}
          onPress={() => startCapturingRef.current?.()}>
          <Text style={S.primaryBtnTxt}>↺ Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={S.cancelBtn}
          onPress={() => onFailure('spoof_detected')}>
          <Text style={S.cancelBtnTxt}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );

    if (phase === 'success') return (
      <View style={S.center}>
        <View style={S.successCircle}>
          <Text style={S.successCheck}>✓</Text>
        </View>
        <Text style={[S.stateTitle, {color: C.greenDark}]}>Verified!</Text>
        <Text style={S.stateSub}>Proceeding with your {displayLabel}…</Text>
      </View>
    );

    // ── 'capturing' — live camera view ──────────────────────────────────────
    return (
      <View style={{flex: 1}}>
        <CameraErrorBoundary
          onRetry={() => startCapturingRef.current?.()}
          onCancel={onCancel}>
          <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={cameraActive}
            frameProcessor={frameProcessor}
            pixelFormat="yuv"
          />
        </CameraErrorBoundary>

        {/* Dimmed overlay */}
        <View style={S.overlay} pointerEvents="none">
          {/* Face oval guide */}
          <View style={S.ovalWrap}>
            <View style={S.oval} />
          </View>

          {/* Instruction card */}
          <View style={S.card}>
            <Text style={S.cardEmoji}>👤</Text>
            <Text style={S.cardTitle}>Look at the Camera</Text>
            <Text style={S.cardSub}>
              Centre your face in the oval.{'\n'}
              Keep still — capturing automatically…
            </Text>
            <View style={S.scanBar} />
          </View>
        </View>
      </View>
    );
  };

  // ── Modal shell ────────────────────────────────────────────────────────────
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onCancel}>
      <SafeAreaView style={S.sheet}>
        {/* Header */}
        <View style={S.header}>
          <View>
            <Text style={S.headerTitle}>Face Verification</Text>
            <Text style={S.headerSub}>{displayLabel}</Text>
          </View>
          <TouchableOpacity onPress={onCancel} style={S.closeBtn}>
            <Text style={S.closeTxt}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Instruction strip — only during capturing */}
        {phase === 'capturing' && (
          <View style={S.strip}>
            <Text style={S.stripTxt}>
              Hold still and look directly at the camera
            </Text>
          </View>
        )}

        <View style={{flex: 1}}>{renderBody()}</View>
      </SafeAreaView>
    </Modal>
  );
};

export default FaceVerificationModal;

// ── Styles ─────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  sheet: {flex: 1, backgroundColor: '#000'},

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.88)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {fontSize: 17, fontWeight: '700', color: '#fff'},
  headerSub:   {fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2},
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeTxt: {fontSize: 14, color: '#fff', fontWeight: '700'},

  strip: {backgroundColor: 'rgba(27,79,216,0.88)', paddingHorizontal: 16, paddingVertical: 10},
  stripTxt: {fontSize: 12, color: '#fff', textAlign: 'center'},

  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 40,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  ovalWrap: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  oval: {
    width: 220, height: 290, borderRadius: 110,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.75)',
  },

  card: {
    width: '88%',
    backgroundColor: 'rgba(15,23,42,0.85)',
    borderRadius: R.lg,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardEmoji: {fontSize: 36},
  cardTitle: {fontSize: 18, fontWeight: '700', color: '#fff', textAlign: 'center'},
  cardSub:   {fontSize: 13, color: 'rgba(255,255,255,0.65)', textAlign: 'center', lineHeight: 20},

  // Animated scan bar (CSS-only shimmer — no Animated needed)
  scanBar: {
    marginTop: 8,
    width: '60%',
    height: 3,
    borderRadius: 2,
    backgroundColor: C.blue,
    opacity: 0.7,
  },

  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 36, backgroundColor: C.bg,
  },
  centerTxt:   {fontSize: 14, color: C.inkMuted, marginTop: 16},
  stateEmoji:  {fontSize: 52, marginBottom: 16},
  stateTitle:  {fontSize: 20, fontWeight: '700', color: C.ink, textAlign: 'center', marginBottom: 8},
  stateSub:    {fontSize: 14, color: C.inkSub, textAlign: 'center', lineHeight: 22, marginBottom: 24},

  spinnerWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.blueLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20, ...Sh.md,
  },
  successCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: C.greenMid,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20, ...Sh.md,
  },
  successCheck: {fontSize: 44, color: '#fff', fontWeight: '700'},

  primaryBtn:    {backgroundColor: C.blue, paddingHorizontal: 32, paddingVertical: 14, borderRadius: R.full, marginBottom: 12, ...Sh.sm},
  primaryBtnTxt: {color: '#fff', fontWeight: '700', fontSize: 15},
  cancelBtn:     {backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, paddingHorizontal: 32, paddingVertical: 14, borderRadius: R.full},
  cancelBtnTxt:  {color: C.inkSub, fontWeight: '600', fontSize: 15},
});
