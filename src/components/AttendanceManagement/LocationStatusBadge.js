/* eslint-disable curly */
// ─────────────────────────────────────────────
// components/LocationStatusBadge.js
//
// Small pill badge rendered over the Google Map.
// Updated to display granular spoofing reasons
// exposed by the migrated useLocation hook.
// ─────────────────────────────────────────────
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

const SPOOFING_LABELS = {
  mock_flag: 'Mock Location Detected',
  accuracy_too_perfect: 'Suspicious GPS Accuracy',
  impossible_speed: 'Impossible Speed Detected',
  stale_fix: 'Stale GPS Fix',
  position_jump: 'Location Jump Detected',
};

const LocationStatusBadge = ({
  withinRadius,
  spoofingDetected,
  spoofingReason,
  userCoords,
  locationConfig,
}) => {
  if (!userCoords) return null;

  if (spoofingDetected) {
    const label = SPOOFING_LABELS[spoofingReason] ?? 'GPS Spoofing Detected';
    return (
      <View style={[styles.badge, styles.badgeSpoofing]}>
        <Text style={styles.badgeIcon}>⚠️</Text>
        <Text style={styles.badgeText}>{label}</Text>
      </View>
    );
  }

  if (!locationConfig) {
    return (
      <View style={[styles.badge, styles.badgeNeutral]}>
        <Text style={styles.badgeIcon}>📍</Text>
        <Text style={styles.badgeText}>No geofence set</Text>
      </View>
    );
  }

  if (withinRadius === true) {
    return (
      <View style={[styles.badge, styles.badgeInside]}>
        <Text style={styles.badgeIcon}>✅</Text>
        <Text style={styles.badgeText}>Within office zone</Text>
      </View>
    );
  }

  if (withinRadius === false) {
    return (
      <View style={[styles.badge, styles.badgeOutside]}>
        <Text style={styles.badgeIcon}>🚫</Text>
        <Text style={styles.badgeText}>Outside office zone</Text>
      </View>
    );
  }

  return null;
};

export default LocationStatusBadge;

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  badgeIcon: {fontSize: 13},
  badgeText: {fontSize: 12, fontWeight: '600', color: '#fff'},

  badgeInside: {backgroundColor: '#27ae60'},
  badgeOutside: {backgroundColor: '#e74c3c'},
  badgeSpoofing: {backgroundColor: '#c0392b'},
  badgeNeutral: {backgroundColor: '#555'},
});
