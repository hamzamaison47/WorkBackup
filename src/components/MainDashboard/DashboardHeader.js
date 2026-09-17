import React, {useEffect, useRef} from 'react';
import {View, Text, TouchableOpacity, Image, Animated} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import {AppTokens} from '../AppComponentsDesign/Appcomponents';
import useAppTokens from '../AppComponentsDesign/useAppTokens';
import {getInitials, calculateYearsSinceHire} from '../../store/utils/helpers';
import useTodayAttendance from '../../hooks/Usetodayattendance';
import {
  conditionalScale,
  conditionalVerticalScale,
  conditionalFontScale,
} from '../../store/utils/scaling';
import styles from '../../styles/styles';

// DOJ (date of joining) — dd/mm/yyyy, not the old "MMM yyyy" format.
const formatDOJ = raw => {
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return raw;
  }
};

// Real data shape (per the punch/audit log): an array of records like
//   {GenerationType: 'ClockIn' | 'ClockOut', PunchDateTime: '2026-09-06T16:44:13Z', ...}
// PunchDateTime is a true UTC instant (has the trailing 'Z'), unlike the
// calendar-only "midnight" dates elsewhere in this app — so plain
// `new Date(...)` + the locale Date/Time methods below already convert to
// the device's local time correctly; no manual offset math needed here.
const isSameLocalDay = (isoString, reference) => {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return false;
  return (
    d.getFullYear() === reference.getFullYear() &&
    d.getMonth() === reference.getMonth() &&
    d.getDate() === reference.getDate()
  );
};

// First ClockIn and last ClockOut of the day — a worker can clock in/out
// more than once (see the sample log: multiple ClockIn/ClockOut pairs on
// the same day), so "today's" clock in is the earliest, clock out the
// latest, not just "the first record found".
const getTodayPunch = (records, generationType, pick) => {
  if (!Array.isArray(records) || records.length === 0) return null;
  const today = new Date();
  const matches = records
    .filter(
      r =>
        r?.GenerationType === generationType &&
        r?.PunchDateTime &&
        isSameLocalDay(r.PunchDateTime, today),
    )
    .sort((a, b) => new Date(a.PunchDateTime) - new Date(b.PunchDateTime));
  if (matches.length === 0) return null;
  return pick === 'first' ? matches[0] : matches[matches.length - 1];
};

const formatPunchTime = punch => {
  if (!punch?.PunchDateTime) return '—';
  const d = new Date(punch.PunchDateTime);
  if (isNaN(d.getTime())) return '—';
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12; // 0 → 12, 13 → 1, etc.
  return `${hours}:${minutes} ${period}`;
};

const StatCell = ({icon, label, value, valueNode}) => {
  const T = useAppTokens();
  return (
    <View style={styles.DH_statCell}>
      <FeatherIcon
        name={icon}
        size={conditionalFontScale(11, 11, 12, 12)}
        color={AppTokens.blueStrong}
      />
      <Text style={[styles.DH_statLabel, {color: T.subtitleText}]}>
        {label}
      </Text>
      {valueNode ? (
        valueNode
      ) : (
        <Text
          style={[styles.DH_statValue, {color: T.titleText}]}
          numberOfLines={1}>
          {value}
        </Text>
      )}
    </View>
  );
};

const DashboardHeader = ({
  userData,
  profilePictureUrl,
  isLoading,
  onProfilePress,
  // The raw punch/audit log array — same shape as "person attendance data"
  // in your logs: [{GenerationType: 'ClockIn'|'ClockOut', PunchDateTime, ...}].
  // Today's first ClockIn and last ClockOut are derived from it below.
  attendanceRecords,
}) => {
  console.log(
    '[DashboardHeader] render — attendanceRecords:',
    Array.isArray(attendanceRecords)
      ? attendanceRecords.length
      : attendanceRecords,
    attendanceRecords?.[0]?.PunchDateTime,
    attendanceRecords?.[0]?.GenerationType,
  );

  // console.log('here is the user data', userData);
  // console.log('[DashboardHeader] location fields:', {
  //   location: userData?.location,
  //   workLocation: userData?.workLocation,
  //   OriginalHireDate: userData?.OriginalHireDate,
  //   // dump everything so you can see all available keys
  //   allKeys: userData ? Object.keys(userData) : 'userData is null/undefined',
  //   fullData: userData,
  // });
  // ✅ useAppTokens at top — reactive
  const T = useAppTokens();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    if (userData) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 70,
          friction: 12,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [userData, fadeAnim, slideAnim]);

  // ✅ Skeleton uses T
  if (!userData) {
    return (
      <View
        style={[
          styles.DH_card,
          {backgroundColor: T.cardBg, borderColor: T.cardDivider},
        ]}>
        <View style={styles.DH_skeletonRow}>
          <View
            style={[styles.DH_skeletonAvatar, {backgroundColor: T.surface}]}
          />
          <View style={styles.DH_skeletonLines}>
            <View
              style={[
                styles.DH_skeletonBar,
                {width: '60%', backgroundColor: T.surface},
              ]}
            />
            <View
              style={[
                styles.DH_skeletonBar,
                {width: '42%', marginTop: 7, backgroundColor: T.surface},
              ]}
            />
            <View
              style={[
                styles.DH_skeletonBar,
                {width: '52%', marginTop: 7, backgroundColor: T.surface},
              ]}
            />
          </View>
        </View>
      </View>
    );
  }

  const yearsWorked = calculateYearsSinceHire(userData?.OriginalHireDate);
  const initials = getInitials(userData?.employeeName);

  const todayClockIn = getTodayPunch(attendanceRecords, 'ClockIn', 'first');
  const todayClockOut = getTodayPunch(attendanceRecords, 'ClockOut', 'last');

  return (
    <Animated.View
      style={[
        styles.DH_card,
        // ✅ card bg, border, shadow react to theme
        {
          backgroundColor: T.cardBg,
          borderColor: T.cardDivider,
          shadowColor: T.shadowColor,
          opacity: fadeAnim,
          transform: [{translateY: slideAnim}],
        },
      ]}>
      {/* Thin blue accent bar */}
      <View style={styles.DH_accentBar} />

      <View style={styles.DH_body}>
        {/* Avatar */}
        <TouchableOpacity
          onPress={onProfilePress}
          activeOpacity={0.82}
          style={styles.DH_avatarTouch}>
          <View
            style={[
              styles.DH_avatarRing,
              {
                borderColor: AppTokens.blueStrong + '40',
                backgroundColor: AppTokens.blueBg,
              },
            ]}>
            {profilePictureUrl && !isLoading ? (
              <Image
                source={{uri: profilePictureUrl}}
                style={styles.DH_avatarImg}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  styles.DH_avatarInitials,
                  {backgroundColor: AppTokens.blue},
                ]}>
                <Text style={styles.DH_avatarInitialsText}>{initials}</Text>
              </View>
            )}
          </View>
          <View style={[styles.DH_onlineDot, {borderColor: T.cardBg}]} />
        </TouchableOpacity>

        {/* Info */}
        <View style={styles.DH_info}>
          <TouchableOpacity
            onPress={onProfilePress}
            activeOpacity={0.7}
            style={styles.DH_nameRow}>
            <Text
              style={[styles.DH_nameText, {color: T.titleText}]}
              numberOfLines={1}>
              {userData?.employeeName || '—'}
            </Text>
            <View
              style={[styles.DH_editChip, {backgroundColor: AppTokens.blueBg}]}>
              <FeatherIcon
                name="edit-2"
                size={conditionalFontScale(9, 9, 10, 10)}
                color={AppTokens.blueStrong}
              />
              <Text
                style={[styles.DH_editChipText, {color: AppTokens.blueStrong}]}>
                Profile
              </Text>
            </View>
          </TouchableOpacity>

          {userData?.PositionDescription ? (
            <Text
              style={[styles.DH_positionText, {color: T.subtitleText}]}
              numberOfLines={1}>
              {userData.PositionDescription}
            </Text>
          ) : null}

          <View style={styles.DH_tagsRow}>
            {userData?.department ? (
              <View
                style={[styles.DH_tag, {backgroundColor: AppTokens.blueBg}]}>
                <FeatherIcon
                  name="briefcase"
                  size={conditionalFontScale(9, 9, 10, 10)}
                  color={AppTokens.blueStrong}
                />
                <Text
                  style={[styles.DH_tagText, {color: AppTokens.blueStrong}]}
                  numberOfLines={1}>
                  {userData.department}
                </Text>
              </View>
            ) : null}

            {yearsWorked > 0 ? (
              <View
                style={[
                  styles.DH_tag,
                  styles.DH_tagNeutral,
                  {backgroundColor: T.surface},
                ]}>
                <FeatherIcon
                  name="award"
                  size={conditionalFontScale(9, 9, 10, 10)}
                  color={T.subtitleText}
                />
                <Text style={[styles.DH_tagText, {color: T.subtitleText}]}>
                  {yearsWorked} {yearsWorked === 1 ? 'year' : 'years'}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      {/* Stats strip — Employee ID (left), DOJ (middle), Clock In/Out
          (right, sourced from today's attendance record). Location was
          dropped from this row to make room for Clock In/Out. */}
      <View
        style={[
          styles.DH_statsStrip,
          {backgroundColor: T.surface, borderTopColor: T.rowDivider},
        ]}>
        <StatCell
          icon="user"
          label="Employee ID"
          value={userData?.employeeId || '—'}
        />
        <View
          style={[styles.DH_statsDivider, {backgroundColor: T.rowDivider}]}
        />
        <StatCell
          icon="calendar"
          label="DOJ"
          value={
            userData?.OriginalHireDate
              ? formatDOJ(userData.OriginalHireDate)
              : '—'
          }
        />
        <View
          style={[styles.DH_statsDivider, {backgroundColor: T.rowDivider}]}
        />
        <StatCell
          icon="clock"
          label="Today's Clock In/Out"
          valueNode={
            <Text
              style={[styles.DH_statValue, {color: T.titleText}]}
              numberOfLines={1}>
              <Text style={{color: todayClockIn ? T.titleText : '#DC2626'}}>
                {formatPunchTime(todayClockIn)}
              </Text>
              <Text style={{color: T.titleText}}> / </Text>
              <Text style={{color: todayClockOut ? T.titleText : '#DC2626'}}>
                {formatPunchTime(todayClockOut)}
              </Text>
            </Text>
          }
        />
      </View>
    </Animated.View>
  );
};

export default DashboardHeader;
