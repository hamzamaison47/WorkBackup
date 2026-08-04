/* eslint-disable curly */
// ─────────────────────────────────────────────
// components/AttendanceManagement/Screen/biometricGate.js
//
// Biometric verification gate for marking attendance.
//
// POLICY:
//   A geofence may require biometric verification (IsBiometricActive). When it
//   does, the user must pass a device biometric prompt BEFORE the `create`
//   attendance SOAP call is made. When it does not, nothing here runs and the
//   flow is byte-for-byte what it was before.
//
// WHEN IT FIRES:
//   Only from a confirm screen's Confirm handler — never on mount, never in a
//   useEffect. Mounting a confirm screen must not raise a system dialog.
//
// LIBRARY CHOICE — react-native-biometrics (already installed at ^3.0.1 and
//   already used by the biometric-login path in store/utils/biometricUtils.js).
//   This is a bare React Native 0.74 app (no `expo` package, no expo-modules-core),
//   so expo-local-authentication is not usable here without adding the entire
//   Expo Modules API. It would also buy nothing: see MODALITY note below.
//
// MODALITY NOTE (why there is no "fingerprint first, then face" sequence):
//   Android's BiometricPrompt — which every RN biometric library wraps — decides
//   for itself which enrolled modality it presents. It cannot be told "show the
//   fingerprint sheet, then a separate face sheet", and no reliable API reports
//   whether a *fingerprint specifically* is enrolled as opposed to a face
//   (isSensorAvailable() reports the generic 'Biometrics' on Android; expo's
//   supportedAuthenticationTypesAsync() reports hardware presence, not
//   enrollment). Since both of the policy's positive branches end in the same
//   action — show the prompt — the branching only ever affects wording. So the
//   enrolled-modality check drives the PROMPT COPY (real on iOS, generic on
//   Android) and the prompt itself is a single system call. Nothing is faked.
// ─────────────────────────────────────────────
import ReactNativeBiometrics, {BiometryTypes} from 'react-native-biometrics';

// allowDeviceCredentials: FALSE — deliberately different from biometricUtils.js,
// which uses `true` so a PIN/pattern can satisfy the login prompt. For marking
// attendance a device passcode must NOT stand in for a biometric, or the control
// is worthless: anyone who can unlock the phone could punch for its owner.
const rnBiometrics = new ReactNativeBiometrics({allowDeviceCredentials: false});

// Exact copy required by the attendance policy when nothing is enrolled.
export const BIOMETRIC_NOT_ENROLLED_MESSAGE =
  "You can't mark attendance. First set up biometric on your phone, then mark attendance.";

export const BIOMETRIC_GATE_REASON = {
  NOT_REQUIRED: 'not_required',
  AUTHENTICATED: 'authenticated',
  NOT_ENROLLED: 'not_enrolled',
  CANCELLED: 'cancelled',
  ERROR: 'error',
};

// ─────────────────────────────────────────────
// isBiometricRequired
//
// Mirrors isQRCodeActive() in QRScannerModal.js — same normalization, same
// accepted truthy set. The string/number juggling is required because
// soapNormalize.normalizeValue() rewrites SOAP 'Yes'/'No' to 1/0, so this flag
// arrives as a NUMBER, not a boolean (live payloads show `IsQRCodeActive: 0`).
//
// NOTE: as of this writing the live DFUserGeofencesSvc/retrieveByPerson contract
// returns IsQRCodeActive and IsFaceIDActive but NOT IsBiometricActive — the D365
// side has not shipped parmIsBiometricActive yet. An absent key normalizes to ''
// and returns false, so until it ships this gate is inert and attendance behaves
// exactly as it does today. It activates on its own once the field appears; no
// client change will be needed. The key name follows the proven
// parmIsQRCodeActive → IsQRCodeActive convention.
// ─────────────────────────────────────────────
export const isBiometricRequired = fence => {
  if (!fence) return false;
  const val = String(fence.IsBiometricActive ?? '')
    .trim()
    .toLowerCase();
  return val === 'yes' || val === '1' || val === 'true';
};

// Prompt copy. iOS reports the real modality, so we can name it; Android reports
// the generic 'Biometrics' because the system picks the modality at display time.
const buildPromptMessage = biometryType => {
  if (biometryType === BiometryTypes.FaceID)
    return 'Verify your face to mark attendance';
  if (biometryType === BiometryTypes.TouchID)
    return 'Verify your fingerprint to mark attendance';
  return 'Verify your identity to mark attendance';
};

// ─────────────────────────────────────────────
// runBiometricGate
//
// The single entry point a confirm handler needs.
//
//   fence — the geofence the punch will be recorded against (prefer the one
//           embedded in the ValidationToken, since that is what was validated).
//
// Returns {ok, reason, message}. `ok: true` means "proceed to the create call":
// either the fence does not require biometrics, or the user authenticated.
// `ok: false` always carries a user-facing `message` — never throws, so a
// confirm handler can branch on it without its own try/catch.
// ─────────────────────────────────────────────
export const runBiometricGate = async fence => {
  if (!isBiometricRequired(fence)) {
    return {ok: true, reason: BIOMETRIC_GATE_REASON.NOT_REQUIRED};
  }

  let available = false;
  let biometryType = null;
  try {
    const sensor = await rnBiometrics.isSensorAvailable();
    available = sensor?.available === true;
    biometryType = sensor?.biometryType ?? null;

    if (__DEV__) {
      console.log('[biometricGate] isSensorAvailable →', {
        available,
        biometryType,
        error: sensor?.error ?? null,
        fence: fence?.GeoFenceID,
      });
    }
  } catch (err) {
    console.error('[biometricGate] isSensorAvailable failed:', err?.message);
    // Availability could not be established — fail CLOSED. This fence requires
    // biometrics, so an unknown sensor state must not silently mark attendance.
    return {
      ok: false,
      reason: BIOMETRIC_GATE_REASON.ERROR,
      message:
        'Unable to check biometric availability on this device. Please try again.',
    };
  }

  // Covers both "no biometric hardware" and "hardware present, nothing
  // enrolled" — in either case the user cannot satisfy the fence's policy.
  if (!available) {
    return {
      ok: false,
      reason: BIOMETRIC_GATE_REASON.NOT_ENROLLED,
      message: BIOMETRIC_NOT_ENROLLED_MESSAGE,
    };
  }

  try {
    const {success} = await rnBiometrics.simplePrompt({
      promptMessage: buildPromptMessage(biometryType),
      cancelButtonText: 'Cancel',
    });

    if (success) {
      return {ok: true, reason: BIOMETRIC_GATE_REASON.AUTHENTICATED};
    }

    // User cancelled or the match failed. Distinct from a system error so the
    // caller can avoid showing a scary "attendance failed" alert for a cancel.
    return {
      ok: false,
      reason: BIOMETRIC_GATE_REASON.CANCELLED,
      message:
        'Biometric verification was not completed. Attendance was not marked.',
    };
  } catch (err) {
    console.error('[biometricGate] simplePrompt failed:', err?.message);
    return {
      ok: false,
      reason: BIOMETRIC_GATE_REASON.ERROR,
      message:
        'Biometric verification failed on this device. Please try again.',
    };
  }
};
