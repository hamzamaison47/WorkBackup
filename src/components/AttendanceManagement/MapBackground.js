/* eslint-disable curly */
/* eslint-disable react-hooks/exhaustive-deps */
// ─────────────────────────────────────────────
// components/MapBackground.js
//
// MIGRATED TO GOOGLE APIs:
//   • PROVIDER_GOOGLE replaces PROVIDER_DEFAULT (Apple Maps / OSM)
//   • Google Map tiles: vectorised, cached, offline-capable
//   • PulseDot and geofence Circle interface unchanged
//
// Setup (one-time):
//   Android: add <meta-data android:name="com.google.android.geo.API_KEY"
//              android:value="YOUR_KEY"/> in AndroidManifest.xml
//   iOS:     call GMSServices.provideAPIKey("YOUR_KEY") in AppDelegate.swift
// ─────────────────────────────────────────────
import React, {useRef, useEffect, useMemo} from 'react';
import {View, Text, StyleSheet, Animated} from 'react-native';
import MapView, {Marker, Circle, PROVIDER_GOOGLE} from 'react-native-maps';
import usePalette from '../../hooks/usePalette';

// ── Pulse animation around user dot ──────────
const PulseDot = () => {
  const pulse = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;
  const P = usePalette();
  const S = useMemo(() => makeStyles(P), [P]);

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 2.4,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.6,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ).start();
  }, []);

  return (
    <View style={S.dotWrap}>
      <Animated.View
        style={[S.pulseRing, {transform: [{scale: pulse}], opacity}]}
      />
      <View style={S.coreDot} />
    </View>
  );
};

// ── No-location placeholder ───────────────────
const NoLocationPlaceholder = ({reason}) => {
  const P = usePalette();
  const S = useMemo(() => makeStyles(P), [P]);
  return (
    <View style={S.placeholder}>
      <Text style={S.placeholderIcon}>📍</Text>
      <Text style={S.placeholderTitle}>
        {reason === 'denied'
          ? 'Location Access Denied'
          : 'Location Not Configured'}
      </Text>
      <Text style={S.placeholderSub}>
        {reason === 'denied'
          ? 'Enable location permission in Settings to see the map.'
          : 'No radius or office location has been set yet.'}
      </Text>
    </View>
  );
};

// ── Main component ────────────────────────────
const MapBackground = ({
  permissionStatus,
  userCoords,
  locationConfig,
  withinRadius,
}) => {
  const mapRef = useRef(null);
  const P = usePalette();
  const S = useMemo(() => makeStyles(P), [P]);

  // Smoothly pan to user when coords arrive or update
  useEffect(() => {
    if (userCoords && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: userCoords.latitude,
          longitude: userCoords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        800,
      );
    }
  }, [userCoords?.latitude, userCoords?.longitude]);

  if (permissionStatus === 'denied') {
    return (
      <View style={S.fill}>
        <NoLocationPlaceholder reason="denied" />
      </View>
    );
  }

  if (permissionStatus === 'granted' && !userCoords && !locationConfig) {
    return (
      <View style={S.fill}>
        <NoLocationPlaceholder reason="notConfigured" />
      </View>
    );
  }

  const initialRegion = userCoords
    ? {
        latitude: userCoords.latitude,
        longitude: userCoords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }
    : locationConfig
    ? {
        latitude: locationConfig.latitude,
        longitude: locationConfig.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : null;

  if (!initialRegion) return null;

  // Geofence circle colour driven by withinRadius (set by Geofencing API events)
  const circleStroke = withinRadius === false ? '#e74c3c' : '#27ae60';
  const circleFill =
    withinRadius === false ? 'rgba(231,76,60,0.12)' : 'rgba(39,174,96,0.12)';

  return (
    <MapView
      ref={mapRef}
      style={S.fill}
      provider={PROVIDER_GOOGLE} // ← Google Maps tile engine
      initialRegion={initialRegion}
      showsUserLocation={false} // we render our own PulseDot
      showsMyLocationButton={false}
      pitchEnabled={false}
      rotateEnabled={false}
      zoomControlEnabled={false}
      // Google Maps extras
      showsTraffic={false}
      showsBuildings={true} // 3-D building footprints on zoom
      showsIndoors={true} // indoor floor plans where available
      mapType="standard" // standard | satellite | hybrid | terrain
    >
      {/* Geofence circle — radius driven by Geofencing API */}
      {locationConfig && (
        <Circle
          center={{
            latitude: locationConfig.latitude,
            longitude: locationConfig.longitude,
          }}
          radius={locationConfig.radius}
          strokeColor={circleStroke}
          strokeWidth={2}
          fillColor={circleFill}
        />
      )}

      {/* Office centre pin */}
      {locationConfig && (
        <Marker
          coordinate={{
            latitude: locationConfig.latitude,
            longitude: locationConfig.longitude,
          }}
          anchor={{x: 0.5, y: 0.5}}
          flat>
          <View style={S.officePinOuter}>
            <View style={S.officePinInner} />
          </View>
        </Marker>
      )}

      {/* Live user position — PulseDot fed by FusedLocationProvider */}
      {userCoords && (
        <Marker
          coordinate={{
            latitude: userCoords.latitude,
            longitude: userCoords.longitude,
          }}
          anchor={{x: 0.5, y: 0.5}}
          flat>
          <PulseDot />
        </Marker>
      )}
    </MapView>
  );
};

export default MapBackground;

const makeStyles = P =>
  StyleSheet.create({
    fill: {...StyleSheet.absoluteFillObject},

    dotWrap: {
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pulseRing: {
      position: 'absolute',
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: P.primary,
    },
    coreDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: P.primary,
      borderWidth: 2,
      borderColor: '#fff',
    },

    officePinOuter: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: 'rgba(232,137,12,0.3)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: '#E8890C',
    },
    officePinInner: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#E8890C',
    },

    placeholder: {
      flex: 1,
      backgroundColor: '#eef2f5',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    },
    placeholderIcon: {fontSize: 48, marginBottom: 16},
    placeholderTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: '#333',
      textAlign: 'center',
      marginBottom: 8,
    },
    placeholderSub: {
      fontSize: 13,
      color: '#888',
      textAlign: 'center',
      lineHeight: 20,
    },
  });
