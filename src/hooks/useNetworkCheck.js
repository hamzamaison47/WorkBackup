// ─────────────────────────────────────────────
// hooks/useNetworkCheck.js
//
// P1.2 OPTIMIZATION: Removed fetchPublicIP / api.ipify.org call.
// Network validation is now SSID + BSSID only — no external HTTP call
// in the critical attendance path.
// ─────────────────────────────────────────────
import {useCallback} from 'react';
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

const useNetworkCheck = () => {
  const runNetworkCheck = useCallback(async fence => {
    const fenceNetworks = fence?.networks ?? [];

    let wifiSsid = null;
    let wifiBssid = null;
    let isWifi = false;

    try {
      let state = await (NetInfo.refresh ? NetInfo.refresh() : NetInfo.fetch());
      // Force a wifi-specific fetch if SSID is missing from the first result
      if (state.type === 'wifi' && !state.details?.ssid) {
        state = await NetInfo.fetch('wifi');
      }
      if (state.type === 'wifi' && state.details) {
        isWifi = true;
        wifiSsid = state.details.ssid ?? null;
        wifiBssid = state.details.bssid ?? null;
      }
    } catch {}

    // If no fence networks configured, pass through with collected context
    if (!fenceNetworks.length) {
      return {
        passed: true,
        networkContext: {
          networkId: null, // no public IP — removed
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
      // Find the matching entry to use its canonical values in the payload
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
