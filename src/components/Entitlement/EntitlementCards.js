import React from 'react';
import {View, Text} from 'react-native';
import {styles} from '../../styles/LeaveRequestStyles';
import LinearGradient from 'react-native-linear-gradient';

const EntitlementCards = ({
  employeeName,
  entitlementCode,
  entitlementUnit,
  payGroupCode,
  taken,
  accrued,
  balance,
}) => (
  <View style={styles.cardContainer}>
    <LinearGradient
      colors={['#FFF3E0', '#FFF3E0', '#FFF3E0']}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardHeaderText}>{entitlementCode}</Text>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.textContainer}>
          <Text style={styles.cardTextHeading}>Pay Group Code:</Text>
          <Text style={styles.cardText}>{payGroupCode}</Text>
        </View>
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

export default EntitlementCards;
