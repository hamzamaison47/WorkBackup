// import {useCallback} from 'react';
// import NetInfo from '@react-native-community/netinfo';
// import {
//   fetchPublicIP,
//   checkNetworkMatch,
//   buildNetworkErrorMessage,
// } from '../components/AttendanceManagement/GeofenceContext';

// const normalizeValue = value =>
//   String(value ?? '')
//     .trim()
//     .toLowerCase();

// const useNetworkCheck = () => {
//   const runNetworkCheck = useCallback(async fence => {
//     const fenceNetworks = fence?.networks ?? [];

//     let wifiSsid = null;
//     let wifiBssid = null;
//     let isWifi = false;
//     let isInternetReachable = false;
//     try {
//       // Force refresh natively to bypass any cached permission-denied state
//       let state = await (NetInfo.refresh ? NetInfo.refresh() : NetInfo.fetch());

//       // Fallback explicitly to the wifi interface if the general refresh still hid the SSID
//       if (state.type === 'wifi' && !state.details?.ssid) {
//         state = await NetInfo.fetch('wifi');
//       }

//       isInternetReachable = state.isInternetReachable !== false; // true if null or true
//       if (state.type === 'wifi' && state.details) {
//         isWifi = true;
//         wifiSsid = state.details.ssid ?? null;
//         wifiBssid = state.details.bssid ?? null;
//       }
//     } catch {}

//     let publicIP = null;
//     if (isWifi && isInternetReachable) {
//       publicIP = await fetchPublicIP();
//       console.log('[NetworkCheck] Public IP:', publicIP, '| SSID:', wifiSsid, '| BSSID:', wifiBssid);
//     }

//     if (!fenceNetworks.length) {
//       return {
//         passed: true,
//         networkContext: {
//           networkId: publicIP,
//           networkName: wifiSsid,
//           bssid: wifiBssid,
//         },
//       };
//     }

//     const {networkMatched, networkFailReason} = checkNetworkMatch(
//       fenceNetworks,
//       wifiSsid,
//       wifiBssid,
//       isWifi,
//       publicIP,
//       isInternetReachable
//     );

//     const matchedNetwork = fenceNetworks.find(
//       net =>
//         normalizeValue(net.NetworkName) === normalizeValue(wifiSsid) &&
//         (!isInternetReachable || normalizeValue(net.NetworkID) === normalizeValue(publicIP)) &&
//         normalizeValue(net.BSSID) === normalizeValue(wifiBssid),
//     );

//     if (networkMatched) {
//       return {
//         passed: true,
//         networkContext: {
//           networkId: matchedNetwork?.NetworkID ?? publicIP,
//           networkName: matchedNetwork?.NetworkName ?? wifiSsid,
//           bssid: matchedNetwork?.BSSID ?? wifiBssid,
//         },
//       };
//     }

//     return {
//       passed: false,
//       errorTitle: 'Network Verification Failed',
//       errorMessage: buildNetworkErrorMessage(fence, networkFailReason),
//       networkContext: {
//         networkId: publicIP,
//         networkName: wifiSsid,
//         bssid: wifiBssid,
//       },
//     };
//   }, []);

//   return {runNetworkCheck};
// };

// export default useNetworkCheck;

import {useCallback} from 'react';
import NetInfo from '@react-native-community/netinfo';
import {
  fetchPublicIP,
  checkNetworkMatch,
  buildNetworkErrorMessage,
} from '../components/AttendanceManagement/GeofenceContext';

const normalizeValue = value =>
  String(value ?? '')
    .trim()
    .toLowerCase();

// ── NEW: simple connectivity check ───────────────────────────
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
    let isInternetReachable = false;

    try {
      let state = await (NetInfo.refresh ? NetInfo.refresh() : NetInfo.fetch());
      if (state.type === 'wifi' && !state.details?.ssid) {
        state = await NetInfo.fetch('wifi');
      }
      isInternetReachable = state.isInternetReachable !== false;
      if (state.type === 'wifi' && state.details) {
        isWifi = true;
        wifiSsid = state.details.ssid ?? null;
        wifiBssid = state.details.bssid ?? null;
      }
    } catch {}

    let publicIP = null;
    if (isWifi && isInternetReachable) {
      publicIP = await fetchPublicIP();
      console.log(
        '[NetworkCheck] Public IP:',
        publicIP,
        '| SSID:',
        wifiSsid,
        '| BSSID:',
        wifiBssid,
      );
    }

    if (!fenceNetworks.length) {
      return {
        passed: true,
        networkContext: {
          networkId: publicIP,
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
      publicIP,
      isInternetReachable,
    );

    const matchedNetwork = fenceNetworks.find(
      net =>
        normalizeValue(net.NetworkName) === normalizeValue(wifiSsid) &&
        (!isInternetReachable ||
          normalizeValue(net.NetworkID) === normalizeValue(publicIP)) &&
        normalizeValue(net.BSSID) === normalizeValue(wifiBssid),
    );

    if (networkMatched) {
      return {
        passed: true,
        networkContext: {
          networkId: matchedNetwork?.NetworkID ?? publicIP,
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
        networkId: publicIP,
        networkName: wifiSsid,
        bssid: wifiBssid,
      },
    };
  }, []);

  return {runNetworkCheck};
};

export default useNetworkCheck;
