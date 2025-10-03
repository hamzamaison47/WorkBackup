import React from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;

// ✅ Improved Circular Attendance Button with responsiveness
const AttendanceButton = ({onPress, loading}) => (
  <TouchableOpacity
    style={[styles.buttonOuter, styles.responsiveButton]}
    onPress={onPress}
    disabled={loading}
    activeOpacity={0.7}>
    <View style={styles.buttonInner}>
      {loading ? (
        <ActivityIndicator
          size={isSmallDevice ? 'small' : 'large'}
          color="#1E88E5"
        />
      ) : (
        <Icon
          name="fingerprint"
          size={isSmallDevice ? 32 : 42}
          color="#1E88E5"
        />
      )}
      <Text
        style={[
          styles.buttonText,
          isSmallDevice ? styles.buttonTextSmall : styles.buttonTextLarge,
        ]}>
        {loading ? 'PROCESSING...' : 'MARK ATTENDANCE'}
      </Text>
    </View>
  </TouchableOpacity>
);

// ✅ Responsive Info Item
const InfoItem = ({icon, label, value, loading = false}) => (
  <View style={styles.infoItem}>
    <Icon name={icon} size={isSmallDevice ? 18 : 22} color="#1E88E5" />
    <Text
      style={[
        styles.infoLabel,
        isSmallDevice ? styles.infoLabelSmall : styles.infoLabelLarge,
      ]}>
      {label}
    </Text>
    {loading ? (
      <ActivityIndicator size="small" color="#1E88E5" />
    ) : (
      <Text
        style={[
          styles.infoValue,
          isSmallDevice ? styles.infoValueSmall : styles.infoValueLarge,
        ]}>
        {value || '-'}
      </Text>
    )}
  </View>
);

// ✅ Summary Item for Monthly Summary
const SummaryItem = ({label, value, color = '#1E88E5'}) => (
  <View style={styles.summaryItem}>
    <Text
      style={[
        styles.summaryLabel,
        isSmallDevice ? styles.summaryLabelSmall : styles.summaryLabelLarge,
      ]}>
      {label}
    </Text>
    <View style={[styles.summaryValueContainer, {backgroundColor: color}]}>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  </View>
);

// ✅ Improved Bottom Navigation
const BottomTabs = ({active, onChange}) => (
  <View style={styles.bottomTabs}>
    <TouchableOpacity
      style={[styles.tab, active === 'home' && styles.activeTab]}
      onPress={() => onChange('home')}
      activeOpacity={0.7}>
      <Icon
        name="home"
        size={isSmallDevice ? 20 : 24}
        color={active === 'home' ? '#FFF' : '#1E88E5'}
      />
      <Text
        style={[
          styles.tabText,
          active === 'home' && styles.activeTabText,
          isSmallDevice ? styles.tabTextSmall : styles.tabTextLarge,
        ]}>
        Home
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={[styles.tab, active === 'summary' && styles.activeTab]}
      onPress={() => onChange('summary')}
      activeOpacity={0.7}>
      <Icon
        name="event-note"
        size={isSmallDevice ? 20 : 24}
        color={active === 'summary' ? '#FFF' : '#1E88E5'}
      />
      <Text
        style={[
          styles.tabText,
          active === 'summary' && styles.activeTabText,
          isSmallDevice ? styles.tabTextSmall : styles.tabTextLarge,
        ]}>
        Monthly Summary
      </Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  buttonOuter: {
    borderWidth: 3,
    borderColor: '#1E88E5',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  responsiveButton: {
    width: SCREEN_WIDTH * 0.4, // 40% of screen width
    height: SCREEN_WIDTH * 0.4,
    maxWidth: 180,
    maxHeight: 180,
    minWidth: 140,
    minHeight: 140,
  },
  buttonInner: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  buttonText: {
    color: '#1E88E5',
    marginTop: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonTextSmall: {
    fontSize: 12,
  },
  buttonTextLarge: {
    fontSize: 14,
  },

  infoItem: {
    alignItems: 'center',
    marginHorizontal: 5,
    flex: 1,
    minWidth: 80, // Ensure minimum width for small devices
  },
  infoLabel: {
    color: '#757575',
    marginTop: 4,
    textAlign: 'center',
  },
  infoLabelSmall: {
    fontSize: 10,
  },
  infoLabelLarge: {
    fontSize: 12,
  },
  infoValue: {
    fontWeight: 'bold',
    color: '#1E88E5',
    textAlign: 'center',
    marginTop: 2,
  },
  infoValueSmall: {
    fontSize: 14,
  },
  infoValueLarge: {
    fontSize: 16,
  },

  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    minHeight: 50,
  },
  summaryLabel: {
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  summaryLabelSmall: {
    fontSize: 14,
  },
  summaryLabelLarge: {
    fontSize: 16,
  },
  summaryValueContainer: {
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 40,
    alignItems: 'center',
  },
  summaryValue: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },

  bottomTabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    minHeight: 60,
  },
  tab: {
    alignItems: 'center',
    padding: 8,
    flex: 1,
    borderRadius: 8,
    marginHorizontal: 4,
    justifyContent: 'center',
    minHeight: 50,
  },
  activeTab: {
    backgroundColor: '#1E88E5',
  },
  tabText: {
    color: '#1E88E5',
    marginTop: 4,
    textAlign: 'center',
  },
  tabTextSmall: {
    fontSize: 10,
  },
  tabTextLarge: {
    fontSize: 12,
  },
  activeTabText: {
    color: '#FFF',
  },
});

export {AttendanceButton, InfoItem, SummaryItem, BottomTabs};
