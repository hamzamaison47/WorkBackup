import React, {useEffect, useRef} from 'react';
import {View, Text, TouchableOpacity, Image, Animated} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import {AppTokens} from '../AppComponentsDesign/Appcomponents';
import useAppTokens from '../AppComponentsDesign/useAppTokens';
import {getInitials, calculateYearsSinceHire} from '../../store/utils/helpers';
import {
  conditionalScale,
  conditionalVerticalScale,
  conditionalFontScale,
} from '../../store/utils/scaling';
import styles from '../../styles/styles';

const formatHireDate = raw => {
  try {
    const d = new Date(raw);
    return d.toLocaleDateString('en-US', {month: 'short', year: 'numeric'});
  } catch {
    return raw;
  }
};

const StatCell = ({icon, label, value}) => {
  // ✅ useAppTokens inside component — reactive
  const T = useAppTokens();
  return (
    <View style={styles.DH_statCell}>
      <FeatherIcon
        name={icon}
        size={conditionalFontScale(11, 11, 12, 12)}
        color={AppTokens.blue}
      />
      <Text style={[styles.DH_statLabel, {color: T.subtitleText}]}>
        {label}
      </Text>
      <Text
        style={[styles.DH_statValue, {color: T.titleText}]}
        numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
};

const DashboardHeader = ({
  userData,
  profilePictureUrl,
  isLoading,
  onProfilePress,
}) => {
  console.log('here is the user data', userData);
  console.log('[DashboardHeader] location fields:', {
    location: userData?.location,
    workLocation: userData?.workLocation,
    OriginalHireDate: userData?.OriginalHireDate,
    // dump everything so you can see all available keys
    allKeys: userData ? Object.keys(userData) : 'userData is null/undefined',
    fullData: userData,
  });
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
                borderColor: AppTokens.blue + '40',
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
                color={AppTokens.blue}
              />
              <Text style={[styles.DH_editChipText, {color: AppTokens.blue}]}>
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
                  color={AppTokens.blue}
                />
                <Text
                  style={[styles.DH_tagText, {color: AppTokens.blue}]}
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

      {/* Stats strip */}
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
          icon="map-pin"
          label="Location"
          value={userData?.location || userData?.workLocation || '—'}
        />
        <View
          style={[styles.DH_statsDivider, {backgroundColor: T.rowDivider}]}
        />
        <StatCell
          icon="calendar"
          label="Since"
          value={
            userData?.OriginalHireDate
              ? formatHireDate(userData.OriginalHireDate)
              : '—'
          }
        />
      </View>
    </Animated.View>
  );
};

export default DashboardHeader;
