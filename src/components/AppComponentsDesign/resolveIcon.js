/**
 * resolveIcon.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Returns the correct icon component for a given library string.
 *
 * Supported values:
 *   'feather' (default) — react-native-vector-icons/Feather
 *   'ion'               — react-native-vector-icons/Ionicons
 *   'fa'                — react-native-vector-icons/FontAwesome
 * ─────────────────────────────────────────────────────────────────────────────
 */

import FeatherIcon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FAIcon from 'react-native-vector-icons/FontAwesome';

const resolveIcon = (lib = 'feather') => {
  switch (lib) {
    case 'ion':
      return Ionicons;
    case 'fa':
      return FAIcon;
    case 'feather':
    default:
      return FeatherIcon;
  }
};

export default resolveIcon;
