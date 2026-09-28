// // components/MainDashboard/DashboardAlertsCard.js
// import React, {useMemo} from 'react';
// import {View, Text, StyleSheet} from 'react-native';
// import FeatherIcon from 'react-native-vector-icons/Feather';
// import useAppTokens from '../AppComponentsDesign/useAppTokens';

// const SEVERITY_ICON = {
//   warning: 'alert-triangle',
//   error: 'alert-circle',
//   success: 'check-circle',
// };

// const DashboardAlertsCard = ({alerts}) => {
//   const T = useAppTokens();
//   const styles = useMemo(() => createStyles(T), [T]);

//   if (!alerts?.length) return null;

//   return (
//     <View style={styles.container}>
//       {alerts.map(alert => (
//         <View key={alert.id} style={[styles.row, styles[alert.severity]]}>
//           <FeatherIcon
//             name={SEVERITY_ICON[alert.severity]}
//             size={18}
//             color={styles[`${alert.severity}Icon`].color}
//           />
//           <View style={styles.textContainer}>
//             <Text style={styles.title}>{alert.title}</Text>
//             <Text style={styles.message}>{alert.message}</Text>
//           </View>
//         </View>
//       ))}
//     </View>
//   );
// };

// const createStyles = T =>
//   StyleSheet.create({
//     container: {marginHorizontal: 16, marginTop: 8, gap: 8},
//     row: {
//       flexDirection: 'row',
//       alignItems: 'flex-start',
//       gap: 10,
//       padding: 12,
//       borderRadius: 10,
//       borderWidth: 1,
//     },
//     textContainer: {flex: 1},
//     title: {fontWeight: '700', fontSize: 13.5, color: T.titleText},
//     message: {fontSize: 12.5, color: T.subtitleText, marginTop: 2},
//     warning: {
//       backgroundColor: T.yellowBg ?? '#FFF7E0',
//       borderColor: T.yellowStrong ?? '#F0B429',
//     },
//     warningIcon: {color: T.yellowStrong ?? '#F0B429'},
//     error: {backgroundColor: T.redBg, borderColor: T.red},
//     errorIcon: {color: T.red},
//     success: {backgroundColor: T.greenBg ?? '#E6F7EC', borderColor: T.green},
//     successIcon: {color: T.green},
//   });

// export default DashboardAlertsCard;
// // components/MainDashboard/DashboardAlertsCard.js
// import React, {useMemo} from 'react';
// import {View, Text, StyleSheet} from 'react-native';
// import FeatherIcon from 'react-native-vector-icons/Feather';
// import useAppTokens from '../AppComponentsDesign/useAppTokens';

// const SEVERITY_ICON = {
//   warning: 'alert-triangle',
//   error: 'alert-circle',
//   success: 'check-circle',
// };

// const DashboardAlertsCard = ({alerts}) => {
//   const T = useAppTokens();
//   const styles = useMemo(() => createStyles(T), [T]);

//   if (!alerts?.length) return null;

//   return (
//     <View style={styles.container}>
//       {alerts.map(alert => (
//         <View key={alert.id} style={[styles.row, styles[alert.severity]]}>
//           <FeatherIcon
//             name={SEVERITY_ICON[alert.severity]}
//             size={18}
//             color={styles[`${alert.severity}Icon`].color}
//           />
//           <View style={styles.textContainer}>
//             <Text style={styles.title}>{alert.title}</Text>
//             <Text style={styles.message}>{alert.message}</Text>
//           </View>
//         </View>
//       ))}
//     </View>
//   );
// };

// const createStyles = T =>
//   StyleSheet.create({
//     container: {marginHorizontal: 16, marginTop: 8, gap: 8},
//     row: {
//       flexDirection: 'row',
//       alignItems: 'flex-start',
//       gap: 10,
//       padding: 12,
//       borderRadius: 10,
//       borderWidth: 1,
//     },
//     textContainer: {flex: 1},
//     title: {fontWeight: '700', fontSize: 13.5, color: T.titleText},
//     message: {fontSize: 12.5, color: T.subtitleText, marginTop: 2},
//     warning: {
//       backgroundColor: T.yellowBg ?? '#FFF7E0',
//       borderColor: T.yellowStrong ?? '#F0B429',
//     },
//     warningIcon: {color: T.yellowStrong ?? '#F0B429'},
//     error: {backgroundColor: T.redBg, borderColor: T.red},
//     errorIcon: {color: T.red},
//     success: {backgroundColor: T.greenBg ?? '#E6F7EC', borderColor: T.green},
//     successIcon: {color: T.green},
//   });

// export default DashboardAlertsCard;
import React, {useMemo, useState, useCallback} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import useAppTokens from '../AppComponentsDesign/useAppTokens';

const SEVERITY_ICON = {
  warning: 'alert-triangle',
  error: 'alert-circle',
  success: 'check-circle',
};

// One shared panel, headed "Alerts", for every dashboard notice (attendance +
// OPD claim alerts). Each row can be dismissed independently; dismissal is
// in-memory only (a plain useState Set), so it resets on app restart — a
// still-true condition (e.g. still haven't clocked in) will show again next
// launch.
const DashboardAlertsCard = ({alerts}) => {
  const T = useAppTokens();
  const styles = useMemo(() => createStyles(T), [T]);
  const [dismissedIds, setDismissedIds] = useState(() => new Set());

  const visibleAlerts = useMemo(
    () => (alerts || []).filter(a => !dismissedIds.has(a.id)),
    [alerts, dismissedIds],
  );

  const dismiss = useCallback(id => {
    setDismissedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  if (!visibleAlerts.length) return null;

  const hasUrgent = visibleAlerts.some(a => a.severity === 'error');

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
      </View>

      <View style={styles.headerDivider} />

      {/* ── Rows ── */}
      {visibleAlerts.map((alert, index) => (
        <View key={alert.id}>
          <View style={styles.row}>
            <View style={[styles.iconWrap, styles[`${alert.severity}IconBg`]]}>
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
            <TouchableOpacity
              onPress={() => dismiss(alert.id)}
              activeOpacity={0.65}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
              style={styles.closeBtn}>
              <FeatherIcon name="x" size={15} color={T.subtitleText} />
            </TouchableOpacity>
          </View>
          {index < visibleAlerts.length - 1 && <View style={styles.divider} />}
        </View>
      ))}
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
    closeBtn: {
      width: 26,
      height: 26,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 4,
      marginTop: -2,
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
