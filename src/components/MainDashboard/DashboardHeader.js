import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import styles from '../../styles/styles';
import {getInitials, calculateYearsSinceHire} from '../../store/utils/helpers';

const DashboardHeader = ({
  userData,
  profilePictureUrl,
  isLoading,
  isSmallScreen,
  onProfilePress,
}) => {
  // If userData is null/undefined, show a loading state
  if (!userData) {
    return (
      <View style={styles.MainDash_HeaderContainer}>
        <View
          style={
            isSmallScreen
              ? styles.MainDash_HeaderContentSmall
              : styles.MainDash_HeaderContent
          }>
          <ActivityIndicator size="large" color="#fff" />
          <View
            style={
              isSmallScreen
                ? styles.MainDash_TextColumnSmall
                : styles.MainDash_TextColumn
            }>
            <Text
              style={
                isSmallScreen
                  ? styles.MainDash_NameTextSmall
                  : styles.MainDash_NameText
              }>
              Loading...
            </Text>
          </View>
        </View>
      </View>
    );
  }

  const yearsWorked = calculateYearsSinceHire(userData?.OriginalHireDate);

  return (
    <View style={styles.MainDash_HeaderContainer}>
      <View
        style={
          isSmallScreen
            ? styles.MainDash_HeaderContentSmall
            : styles.MainDash_HeaderContent
        }>
        {isLoading ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : (
          <TouchableOpacity
            onPress={onProfilePress}
            activeOpacity={0.8}
            style={
              isSmallScreen
                ? styles.MainDash_AvatarContainerSmall
                : styles.MainDash_AvatarContainer
            }>
            {profilePictureUrl ? (
              <Image
                source={{uri: profilePictureUrl}}
                style={styles.MainDash_ProfilePicture}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.MainDash_AvatarText}>
                {getInitials(userData?.employeeName)}
              </Text>
            )}
          </TouchableOpacity>
        )}

        <View
          style={
            isSmallScreen
              ? styles.MainDash_TextColumnSmall
              : styles.MainDash_TextColumn
          }>
          <Text
            style={
              isSmallScreen
                ? styles.MainDash_NameTextSmall
                : styles.MainDash_NameText
            }>
            {userData?.employeeName || 'Loading...'}
          </Text>

          <Text
            style={
              isSmallScreen
                ? styles.MainDash_EmailTextSmall
                : styles.MainDash_EmailText
            }>
            <Text style={styles.MainDash_BoldText}>Department: </Text>
            {userData?.department || 'N/A'}
          </Text>

          <Text
            style={
              isSmallScreen
                ? styles.MainDash_EmailTextSmall
                : styles.MainDash_EmailText
            }>
            <Text style={styles.MainDash_BoldText}>Position: </Text>
            {userData?.PositionDescription || 'N/A'}
          </Text>

          <Text
            style={
              isSmallScreen
                ? styles.MainDash_EmailTextSmall
                : styles.MainDash_EmailText
            }>
            <Text style={styles.MainDash_BoldText}>Years of Service: </Text>
            {yearsWorked || 0} years
          </Text>
        </View>
      </View>
    </View>
  );
};

export default DashboardHeader;
