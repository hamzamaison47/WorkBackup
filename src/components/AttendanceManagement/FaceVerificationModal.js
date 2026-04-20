/* eslint-disable curly */
/* eslint-disable react-native/no-inline-styles */
// ─────────────────────────────────────────────────────────────────────────────
// components/AttendanceManagement/FaceVerificationModal.js  (v4 — Screen Flash / Reflection)
//
// ARCHITECTURE: Ref-based state machine + passive liveness + Custom Screen Flash
//
// CHANGES FROM v3:
//   • Added 2 new active phases: `flash_white` and `flash_black`.
//   • Worklet now reads raw Y-channel (luminance) from the YUV frame buffer.
//   • Analyzes the reflection brightness diff to prevent laptop/screen spoofing.
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
const NO_FACE_GUARD_MS = 5000;  // Bail to 'no_face' if nothing detected
const THROTTLE_MS      = 300;   // Frame processor throttle interval
const FLASH_WAIT_MS    = 300;   // Wait for screen to emit light before sampling
const SPOOF_THRESHOLD  = 75;    // Minimum score to pass passive check (out of 100)
const REFLECTION_DIFF  = 3;     // Minimum Luma differnce between White & Black Flash

const ACTION_LABEL = {
  CLOCK_IN:    'Clock In',
  CLOCK_OUT:   'Clock Out',
  BREAK_START: 'Break Start',
  BREAK_END:   'Break End',
};

// ── Passive anti-spoofing scorer ───────────────────────────────────────────────
const analyzePassiveLiveness = face => {
  let score = 0;
  const checks = [];

  const leftEye  = face.leftEyeOpenProbability  ?? -1;
  const rightEye = face.rightEyeOpenProbability ?? -1;
  if (
    leftEye  >= 0 && leftEye  >= 0.15 && leftEye  <= 0.95 &&
    rightEye >= 0 && rightEye >= 0.15 && rightEye <= 0.95
  ) {
    score += 25;
    checks.push('eyes_natural');
  }

  const yaw   = Math.abs(face.yawAngle   ?? 0);
  const pitch = Math.abs(face.pitchAngle ?? 0);
  if (yaw < 25 && pitch < 20) {
    score += 25;
    checks.push('pose_frontal');
  }

  const bounds = face.bounds ?? null;
  if (bounds) {
    const w = bounds.width ?? 0;
    if (w >= 80 && w <= 900) {
      score += 25;
      checks.push('size_ok');
    }
  }

  if ((face.smilingProbability ?? -1) >= 0) {
    score += 25;
    checks.push('classifications_available');
  }

  const isReal = score >= SPOOF_THRESHOLD;
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
  const capturedRef  = useRef(false);  

  // ── Camera ────────────────────────────────────────────────────────────────
  const device = useCameraDevice('front');
  const {detectFaces} = useFaceDetector({
    performanceMode: 'fast',
    classificationMode: 'all',
  });

  // ── SharedValues (worklet ↔ JS) ───────────────────────────────────────────
  const svPhase      = useSharedValue('checking');
  const svLock       = useSharedValue(false);       
  const svLastMs     = useSharedValue(0);           

  // Flash data
  const svFaceBounds = useSharedValue(null);
  const svWhiteLuma  = useSharedValue(0);
  const svBlackLuma  = useSharedValue(0);

  // ── Atomic phase setter ───────────────────────────────────────────────────
  const setPhase = useCallback(p => {
    phaseRef.current = p;
    if (mountedRef.current) setPhaseState(p);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Timer helpers ─────────────────────────────────────────────────────────
  const pushTimer    = id => { timerIds.current.push(id); return id; };
  const clearAllTimers = useCallback(() => {
    timerIds.current.forEach(id => clearTimeout(id));
    timerIds.current = [];
  }, []);

  // ── onLumaCaptured — Triggered via Worklet when Y channel is computed ────
  const onLumaCaptured = Worklets.createRunOnJS(color => {
    if (!mountedRef.current) return;
    
    if (color === 'white') {
      console.log(`[FaceVerification] White Luma: ${svWhiteLuma.value.toFixed(2)}`);
      // Start Black Flash
      setPhase('flash_black');
      svPhase.value = 'flash_black_prepare';
      pushTimer(setTimeout(() => {
        if (!mountedRef.current) return;
        svPhase.value = 'flash_black_capture';
      }, FLASH_WAIT_MS));
    } else if (color === 'black') {
      console.log(`[FaceVerification] Black Luma: ${svBlackLuma.value.toFixed(2)}`);
      
      const diff = Math.abs(svWhiteLuma.value - svBlackLuma.value);
      console.log(`[FaceVerification] Reflection Diff: ${diff.toFixed(2)}`);
      
      setPhase('analyzing');
      
      // Delay before reporting
      pushTimer(setTimeout(() => {
        if (!mountedRef.current) return;
        
        if (diff > REFLECTION_DIFF) {
          setPhase('success');
          Vibration.vibrate(200);
          pushTimer(setTimeout(() => {
            if (mountedRef.current) onSuccess({verified: true});
          }, 900));
        } else {
          console.warn(`[FaceVerification] Screen spoof detected! Reflection (${diff.toFixed(2)}) is beneath threshold (${REFLECTION_DIFF}).`);
          setPhase('failed');
        }
      }, 500));
    }
  });


  // ── onFaceCaptured — Triggered via Worklet when face passes heuristic ────
  const onFaceCaptured = Worklets.createRunOnJS(faceData => {
    if (!mountedRef.current || capturedRef.current) return;
    capturedRef.current = true;
    
    const result = analyzePassiveLiveness(faceData);
    if (!result.isReal) {
      console.warn(`[FaceVerification] Passive checks failed: ${result.score}/100.`);
      setPhase('failed');
      return;
    }

    console.log('[FaceVerification] Passive checks passed. Initiating Flash Reflection...');
    
    // Start White Flash
    setPhase('flash_white');
    svPhase.value = 'flash_white_prepare';
    pushTimer(setTimeout(() => {
      // Allow physical camera to adapt to flash
      if (!mountedRef.current) return;
      svPhase.value = 'flash_white_capture';
    }, FLASH_WAIT_MS));
  });

  // ── Frame Processor ───────────────────────────────────────────────────────
  const frameProcessor = useFrameProcessor(
    frame => {
      'worklet';

      // 1) Luminance sampling for Reflection Flash
      if (svPhase.value === 'flash_white_capture' || svPhase.value === 'flash_black_capture') {
        const bounds = svFaceBounds.value;
        if (!bounds) return; // safety
        
        const buffer = frame.toArrayBuffer();
        const data = new Uint8Array(buffer);
        
        // Safety check — Ensure we don't read out of bounds. Y channel takes up W*H array length
        if (data.length < frame.width * frame.height) return;
        
        let totalY = 0;
        let validSamples = 0;
        const stepX = Math.floor(bounds.width / 10) || 1;
        const stepY = Math.floor(bounds.height / 10) || 1;

        // Sample 100 scattered points inside face box
        for (let i = 0; i < 10; i++) {
          for (let j = 0; j < 10; j++) {
            const x = Math.floor(bounds.x + (i * stepX));
            const y = Math.floor(bounds.y + (j * stepY));
            
            if (x >= 0 && x < frame.width && y >= 0 && y < frame.height) {
                const index = (y * frame.width) + x;
                totalY += data[index];
                validSamples++;
            }
          }
        }
        
        const avg = validSamples > 0 ? (totalY / validSamples) : 0;
        
        if (svPhase.value === 'flash_white_capture') {
          svPhase.value = 'idle'; // consume exactly 1 frame
          svWhiteLuma.value = avg;
          onLumaCaptured('white');
        } else {
          svPhase.value = 'idle'; // consume exactly 1 frame
          svBlackLuma.value = avg;
          onLumaCaptured('black');
        }
        return;
      }

      // 2) Normal Face tracking logic
      if (svPhase.value !== 'capturing') return;
      if (svLock.value) return;

      const now = Date.now();
      if (now - svLastMs.value < THROTTLE_MS) return;
      svLastMs.value = now;

      const faces = detectFaces(frame);
      if (!faces || faces.length === 0) return;

      const face = faces[0];

      svLock.value = true;
      
      // Store coordinate bounds globally for Native thread reading during flash
      if (face.bounds) {
        svFaceBounds.value = {
          x: face.bounds.x,
          y: face.bounds.y,
          width: face.bounds.width,
          height: face.bounds.height,
        };
      }

      onFaceCaptured({
        leftEyeOpenProbability:  face.leftEyeOpenProbability  ?? -1,
        rightEyeOpenProbability: face.rightEyeOpenProbability ?? -1,
        smilingProbability:      face.smilingProbability      ?? -1,
        yawAngle:                face.yawAngle                ?? 0,
        pitchAngle:              face.pitchAngle              ?? 0,
        bounds: face.bounds ?? null,
      });
    },
    [detectFaces, onFaceCaptured, onLumaCaptured],
  );

  // ── startCapturing ────────────────────────────────────────────────────────
  const startCapturingRef = useRef(null);
  startCapturingRef.current = useCallback(() => {
    if (!mountedRef.current) return;
    clearAllTimers();

    capturedRef.current   = false;
    svLock.value          = false;
    svLastMs.value        = 0;
    svPhase.value         = 'capturing';

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
      mountedRef.current  = false;
      capturedRef.current = false;
      clearAllTimers();
      svLock.value   = true;
      svPhase.value  = 'checking';
      return;
    }

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
  // Keep camera live during capturing & flashing to maintain physical data stream
  const cameraActive  = visible && ['capturing', 'flash_white', 'flash_black'].includes(phase);

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
        <Text style={S.stateTitle}>Analyzing Security Data…</Text>
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

    // ── capturing + flashes ──────────────────────────────────────
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

        {/* Normal Camera Guidance */}
        {phase === 'capturing' && (
          <View style={S.overlay} pointerEvents="none">
            <View style={S.ovalWrap}>
              <View style={S.oval} />
            </View>

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
        )}

        {/* Screen Flash Overlays */}
        {phase === 'flash_white' && (
           <View style={{...StyleSheet.absoluteFillObject, backgroundColor: '#FFFFFF', opacity: 0.95}} />
        )}

        {phase === 'flash_black' && (
           <View style={{...StyleSheet.absoluteFillObject, backgroundColor: '#000000', opacity: 0.95}} />
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onCancel}>
      <SafeAreaView style={S.sheet}>
        <View style={S.header}>
          <View>
            <Text style={S.headerTitle}>Face Verification</Text>
            <Text style={S.headerSub}>{displayLabel}</Text>
          </View>
          <TouchableOpacity onPress={onCancel} style={S.closeBtn}>
            <Text style={S.closeTxt}>✕</Text>
          </TouchableOpacity>
        </View>

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

  scanBar: {
    marginTop: 8, width: '60%', height: 3, borderRadius: 2,
    backgroundColor: C.blue, opacity: 0.7,
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
