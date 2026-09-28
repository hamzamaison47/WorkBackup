import React, {useMemo, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import useAppTokens from '../AppComponentsDesign/useAppTokens';

const SEVERITY_ICON = {
  warning: 'alert-triangle',
  error: 'alert-circle',
  success: 'check-circle',
};

// One shared panel, headed "Alerts", for every dashboard notice (attendance +
// OPD claim alerts). The whole panel can be collapsed/expanded via the
// Hide/Show toggle in the header. State is in-memory only, so the panel
// starts expanded on every app launch.
const DashboardAlertsCard = ({alerts}) => {
  const T = useAppTokens();
  const styles = useMemo(() => createStyles(T), [T]);
  const [collapsed, setCollapsed] = useState(false);

  const list = alerts || [];
  if (!list.length) return null;

  const hasUrgent = list.some(a => a.severity === 'error');

  return (
    <View style={styles.panel}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.headerIconWrap,
              hasUrgent ? styles.errorIconBg : styles.headerIconBgNeutral,
            ]}>
            <FeatherIcon
              name="bell"
              size={15}
              color={hasUrgent ? styles.errorIcon.color : T.blueStrong}
            />
          </View>
          <Text style={styles.headerTitle}>Alerts</Text>
        </View>

        <TouchableOpacity
          onPress={() => setCollapsed(prev => !prev)}
          activeOpacity={0.65}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
          style={styles.toggleBtn}>
          <Text style={styles.toggleText}>{collapsed ? 'Show' : 'Hide'}</Text>
          <FeatherIcon
            name={collapsed ? 'chevron-down' : 'chevron-up'}
            size={15}
            color={T.blueStrong}
          />
        </TouchableOpacity>
      </View>

      {!collapsed && (
        <>
          <View style={styles.headerDivider} />

          {/* ── Rows ── */}
          {list.map((alert, index) => (
            <View key={alert.id}>
              <View style={styles.row}>
                <View
                  style={[styles.iconWrap, styles[`${alert.severity}IconBg`]]}>
                  <FeatherIcon
                    name={SEVERITY_ICON[alert.severity]}
                    size={16}
                    color={styles[`${alert.severity}Icon`].color}
                  />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.title}>{alert.title}</Text>
                  <Text style={styles.message}>{alert.message}</Text>
                </View>
              </View>
              {index < list.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </>
      )}
    </View>
  );
};

const createStyles = T =>
  StyleSheet.create({
    panel: {
      marginHorizontal: 16,
      marginTop: 8,
      backgroundColor: T.cardBg,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: T.cardDivider,
      shadowColor: T.shadowColor,
      shadowOffset: {width: 0, height: 3},
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingTop: 12,
      paddingBottom: 10,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    headerIconWrap: {
      width: 27,
      height: 27,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerIconBgNeutral: {backgroundColor: T.blueBg},
    headerTitle: {
      fontSize: 15.5,
      fontWeight: '800',
      color: T.titleText,
      letterSpacing: 0.2,
    },
    headerDivider: {
      height: 1,
      backgroundColor: T.cardDivider,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: 12,
      paddingHorizontal: 14,
    },
    iconWrap: {
      width: 28,
      height: 28,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
      marginTop: 1,
    },
    textContainer: {flex: 1, paddingTop: 1},
    title: {fontWeight: '700', fontSize: 13.5, color: T.titleText},
    message: {fontSize: 12.5, color: T.subtitleText, marginTop: 2},
    toggleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    toggleText: {
      fontSize: 13,
      fontWeight: '600',
      color: T.blueStrong,
    },
    divider: {
      height: 1,
      backgroundColor: T.cardDivider,
      marginLeft: 55, // aligns under the icon, not the stripe
    },
    // Severity accents
    warningIconBg: {backgroundColor: T.yellowBg ?? '#FFF7E0'},
    warningIcon: {color: T.yellowStrong ?? '#F0B429'},
    errorIconBg: {backgroundColor: T.redBg},
    errorIcon: {color: T.red},
    successIconBg: {backgroundColor: T.greenBg ?? '#E6F7EC'},
    successIcon: {color: T.green},
  });

export default DashboardAlertsCard;
