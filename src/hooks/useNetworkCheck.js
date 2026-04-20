// ─────────────────────────────────────────────
// hooks/useNetworkCheck.js
//
// FIXED FOR iOS:
//   - iOS requires special handling for SSID/BSSID
//   - NetInfo on iOS returns limited WiFi details
//   - Added multiple fetch attempts for iOS
// ─────────────────────────────────────────────
import {useCallback} from 'react';
import {Platform} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import {
  checkNetworkMatch,
  buildNetworkErrorMessage,
} from '../components/AttendanceManagement/GeofenceContext';

// ── Simple connectivity check ─────────────────────────────────
export const checkIsOnline = async () => {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected === true && state.isInternetReachable !== false;
  } catch {
    return false;
  }
};

// ── Get WiFi details cross-platform ──────────────────────────
const getWifiDetails = async () => {
  let wifiSsid = null;
  let wifiBssid = null;
  let isWifi = false;

  try {
    // ── Attempt 1: Standard NetInfo fetch ──
    let state = await NetInfo.fetch();
    console.log('📶 NetInfo state type:', state.type);
    console.log('📶 NetInfo details:', JSON.stringify(state.details));

    if (state.type === 'wifi' && state.details) {
      isWifi = true;
      wifiSsid = state.details.ssid ?? null;
      wifiBssid = state.details.bssid ?? null;
    }

    // ── Attempt 2: Force wifi-specific fetch if SSID missing ──
    if (isWifi && !wifiSsid) {
      try {
        const wifiState = await NetInfo.fetch('wifi');
        if (wifiState?.details?.ssid) {
          wifiSsid = wifiState.details.ssid;
          wifiBssid = wifiState.details.bssid ?? wifiBssid;
          console.log('📶 Got SSID from wifi-specific fetch:', wifiSsid);
        }
      } catch {}
    }

    // ── Attempt 3: iOS refresh ──
    if (Platform.OS === 'ios' && isWifi && !wifiSsid) {
      try {
        if (NetInfo.refresh) {
          const refreshed = await NetInfo.refresh();
          if (refreshed?.details?.ssid) {
            wifiSsid = refreshed.details.ssid;
            wifiBssid = refreshed.details.bssid ?? wifiBssid;
            console.log('📶 Got SSID from NetInfo.refresh:', wifiSsid);
          }
        }
      } catch {}
    }

    console.log('📶 Final WiFi details:', {isWifi, wifiSsid, wifiBssid});
  } catch (err) {
    console.warn('📶 getWifiDetails error:', err.message);
  }

  return {isWifi, wifiSsid, wifiBssid};
};

const useNetworkCheck = () => {
  const runNetworkCheck = useCallback(async fence => {
    const fenceNetworks = fence?.networks ?? [];

    // Get WiFi details using cross-platform helper
    const {isWifi, wifiSsid, wifiBssid} = await getWifiDetails();

    // ── iOS specific: SSID may not be available ───────────────
    // On iOS 13+, SSID requires Location permission AND
    // the device must be connected to WiFi
   // iOS: if on WiFi but SSID unavailable, check if fence has networks
// If fence has no networks configured, allow through anyway
if (Platform.OS === 'ios' && isWifi && !wifiSsid) {
  console.warn('📶 iOS: SSID unavailable');
  // If no fence networks configured, pass through
  if (!fenceNetworks.length) {
    return {
      passed: true,
      networkContext: {networkId: null, networkName: null, bssid: null},
    };
  }
  // If fence has networks but we cant read SSID on iOS
  // Try matching by BSSID only if available
  if (wifiBssid) {
    const normalizeNet = s => String(s ?? '').trim().toLowerCase();
    const bssidOnlyMatch = fenceNetworks.find(
      net => net.BSSID &&
      normalizeNet(net.BSSID) === normalizeNet(wifiBssid)
    );
    if (bssidOnlyMatch) {
      console.log('📶 iOS: Matched by BSSID only:', wifiBssid);
      return {
        passed: true,
        networkContext: {
          networkId: bssidOnlyMatch?.NetworkID ?? null,
          networkName: bssidOnlyMatch?.NetworkName ?? null,
          bssid: wifiBssid,
        },
      };
    }
  }
}

    // If no fence networks configured, pass through
    if (!fenceNetworks.length) {
      return {
        passed: true,
        networkContext: {
          networkId: null,
          networkName: wifiSsid,
          bssid: wifiBssid,
        },
      };
    }

    const {networkMatched, networkFailReason} = checkNetworkMatch(
      fenceNetworks,
      wifiSsid,
      wifiBssid,
      isWifi,
    );

    if (networkMatched) {
      const normalizeNet = s => String(s ?? '').trim().toLowerCase();
      const matchedNetwork = fenceNetworks.find(net => {
        const ssidMatch =
          net.NetworkName &&
          normalizeNet(net.NetworkName) === normalizeNet(wifiSsid);
        const bssidMatch =
          !net.BSSID ||
          (wifiBssid && normalizeNet(net.BSSID) === normalizeNet(wifiBssid));
        return ssidMatch && bssidMatch;
      });

      return {
        passed: true,
        networkContext: {
          networkId: matchedNetwork?.NetworkID ?? null,
          networkName: matchedNetwork?.NetworkName ?? wifiSsid,
          bssid: matchedNetwork?.BSSID ?? wifiBssid,
        },
      };
    }

    return {
      passed: false,
      errorTitle: 'Network Verification Failed',
      errorMessage: buildNetworkErrorMessage(fence, networkFailReason),
      networkContext: {
        networkId: null,
        networkName: wifiSsid,
        bssid: wifiBssid,
      },
    };
  }, []);

  return {runNetworkCheck};
};

export default useNetworkCheck;