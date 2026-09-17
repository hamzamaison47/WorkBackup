// components/MainDashboard/DashboardAlertsCard.js
import React, {useMemo} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import useAppTokens from '../AppComponentsDesign/useAppTokens';

const SEVERITY_ICON = {
  warning: 'alert-triangle',
  error: 'alert-circle',
  success: 'check-circle',
};

const DashboardAlertsCard = ({alerts}) => {
  const T = useAppTokens();
  const styles = useMemo(() => createStyles(T), [T]);

  if (!alerts?.length) return null;

  return (
    <View style={styles.container}>
      {alerts.map(alert => (
        <View key={alert.id} style={[styles.row, styles[alert.severity]]}>
          <FeatherIcon
            name={SEVERITY_ICON[alert.severity]}
            size={18}
            color={styles[`${alert.severity}Icon`].color}
          />
          <View style={styles.textContainer}>
            <Text style={styles.title}>{alert.title}</Text>
            <Text style={styles.message}>{alert.message}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const createStyles = T =>
  StyleSheet.create({
    container: {marginHorizontal: 16, marginTop: 8, gap: 8},
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
    },
    textContainer: {flex: 1},
    title: {fontWeight: '700', fontSize: 13.5, color: T.titleText},
    message: {fontSize: 12.5, color: T.subtitleText, marginTop: 2},
    warning: {
      backgroundColor: T.yellowBg ?? '#FFF7E0',
      borderColor: T.yellowStrong ?? '#F0B429',
    },
    warningIcon: {color: T.yellowStrong ?? '#F0B429'},
    error: {backgroundColor: T.redBg, borderColor: T.red},
    errorIcon: {color: T.red},
    success: {backgroundColor: T.greenBg ?? '#E6F7EC', borderColor: T.green},
    successIcon: {color: T.green},
  });

export default DashboardAlertsCard;
