import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const EntitlementCards = ({entitlementCode, taken, accrued, balance}) => (
  <View style={styles.cardContainer}>
    <LinearGradient
      colors={['#6ee0ff', '#bddeff', '#cce6ff']}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardHeaderText}>{entitlementCode}</Text>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.textContainer}>
          <Text style={styles.cardTextHeading}>Accrued:</Text>
          <Text style={styles.cardText}>{accrued}</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.cardTextHeading}>Taken:</Text>
          <Text style={styles.cardText}>{taken}</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.cardTextHeading}>Balance:</Text>
          <Text style={styles.cardText}>{balance}</Text>
        </View>
      </View>
    </LinearGradient>
  </View>
);

const styles = StyleSheet.create({
  cardContainer: {
    marginVertical: 10,
    marginHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  card: {
    borderRadius: 16,
    padding: 16,
  },
  cardHeader: {
    borderBottomWidth: 2,
    borderBottomColor: '#ffffffff',
    paddingBottom: 8,
    marginBottom: 12,
  },
  cardHeaderText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#004aad',
    textAlign: 'center',
  },
  cardContent: {
    flexDirection: 'column',
    gap: 8,
  },
  textContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardTextHeading: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  cardText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111',
  },
});

export default EntitlementCards;
