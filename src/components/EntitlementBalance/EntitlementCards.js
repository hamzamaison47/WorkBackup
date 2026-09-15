import React from 'react';
import {View, Text} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import styles from '../../styles/styles';
import brand from '../../theme/brand';

const EntitlementCards = ({entitlementCode, taken, accrued, balance}) => (
  <View style={styles.EntCards_CardContainer}>
    <LinearGradient
      colors={[brand.tint, brand.surface]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.EntCards_Card}>
      <View style={styles.EntCards_CardHeader}>
        <Text style={styles.EntCards_CardHeaderText}>{entitlementCode}</Text>
      </View>

      <View style={styles.EntCards_CardContent}>
        <View style={styles.EntCards_TextContainer}>
          <Text style={styles.EntCards_CardTextHeading}>Accrued:</Text>
          <Text style={styles.EntCards_CardText}>{accrued}</Text>
        </View>
        <View style={styles.EntCards_TextContainer}>
          <Text style={styles.EntCards_CardTextHeading}>Taken:</Text>
          <Text style={styles.EntCards_CardText}>{taken}</Text>
        </View>
        <View style={styles.EntCards_TextContainer}>
          <Text style={styles.EntCards_CardTextHeading}>Balance:</Text>
          <Text style={styles.EntCards_CardText}>{balance}</Text>
        </View>
      </View>
    </LinearGradient>
  </View>
);

export default EntitlementCards;
