/* eslint-disable curly */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/no-unstable-nested-components */
import React, {useState, useEffect, useCallback, useRef} from 'react';
import {View, Text, ScrollView} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialIcons';

import {RetrieveEntitlementBalanceRequest} from '../../API/EntitlementBalance/RetrieveEntitlementBalanceRequest';
import styles from '../../styles/styles';
import {AppTokens} from '../AppComponentsDesign/Tokens';

const LeaveEntitlementProgress = ({userData, screenWidth, onDataStatus}) => {
  const [leaveData, setLeaveData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const scrollViewRef = useRef(null);
  const contentWidthRef = useRef(0);
  const scrollPositionRef = useRef(0);

  // Predefined color palette for leaves (15 colors)
  const LEAVE_COLORS = [
    '#4CAF50', // Green
    AppTokens.indigo, // Indigo
    '#9C27B0', // Purple
    '#E91E63', // Pink
    '#FF9800', // Orange
    '#00BCD4', // Cyan
    '#8BC34A', // Light Green
    '#FF5722', // Deep Orange
    '#673AB7', // Deep Purple
    '#009688', // Teal
    '#FFC107', // Amber
    '#795548', // Brown
    '#607D8B', // Blue Grey
    '#F44336', // Red
    AppTokens.statusDraft, // was Material blue; light slate keeps it distinct
  ];

  // Cache for mapping leave types to colors
  const leaveColorMapRef = useRef(new Map());
  const defaultColor = AppTokens.slate; // for any additional leaves beyond 15

  // Function to get color for a leave type
  const getLeaveColor = useCallback(entitlementCode => {
    // Return cached color if exists
    if (leaveColorMapRef.current.has(entitlementCode)) {
      return leaveColorMapRef.current.get(entitlementCode);
    }

    // Find next available color
    let assignedColor = defaultColor;

    // Count how many unique leaves we've assigned colors to
    const assignedCount = leaveColorMapRef.current.size;

    // If we have colors left in our palette, assign the next one
    if (assignedCount < LEAVE_COLORS.length) {
      assignedColor = LEAVE_COLORS[assignedCount];
    }

    // Cache the assignment
    leaveColorMapRef.current.set(entitlementCode, assignedColor);

    return assignedColor;
  }, []);

  // Clear color cache when leave data changes significantly
  useEffect(() => {
    // Reset color map when leave data changes
    leaveColorMapRef.current.clear();

    // Pre-assign colors to all leave types in the data
    if (leaveData.length > 0) {
      leaveData.forEach(item => {
        getLeaveColor(item.EntitlementCode);
      });
    }
  }, [leaveData, getLeaveColor]);

  // Fetch entitlement data
  const fetchEntitlementData = useCallback(async () => {
    if (!userData?.employeeId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const myEntitlementData = await RetrieveEntitlementBalanceRequest({
        employeeId: userData.employeeId,
      });

      const filteredEntitlementData = myEntitlementData.filter(
        e => e.EmployeeId === userData.employeeId,
      );

      console.log('filteredEntitlementData on dashboard:', {
        filteredEntitlementData,
      });

      setLeaveData(filteredEntitlementData);
    } catch (error) {
      console.error('Failed to fetch entitlement data:', error);
      setLeaveData([]);
    } finally {
      setLoading(false);
    }
  }, [userData?.employeeId]);

  useEffect(() => {
    fetchEntitlementData();
  }, [fetchEntitlementData]);

  // Notify parent component about data status
  useEffect(() => {
    if (!loading && onDataStatus) {
      onDataStatus(leaveData.length === 0);
    }
  }, [loading, leaveData, onDataStatus]);

  // Check arrow visibility after data loads and layout
  useEffect(() => {
    if (leaveData.length > 0) {
      setTimeout(() => {
        checkArrowVisibility();
      }, 100);
    }
  }, [leaveData]);

  const checkArrowVisibility = () => {
    if (!scrollViewRef.current || contentWidthRef.current === 0) return;

    const containerWidth = screenWidth * 0.9; // Approximate container width
    const isAtStart = scrollPositionRef.current <= 0;
    const isAtEnd =
      scrollPositionRef.current + containerWidth >=
      contentWidthRef.current - 10; // 10px buffer

    setShowLeftArrow(!isAtStart);
    setShowRightArrow(!isAtEnd && contentWidthRef.current > containerWidth);
  };

  const handleScroll = event => {
    const {contentOffset, contentSize, layoutMeasurement} = event.nativeEvent;
    scrollPositionRef.current = contentOffset.x;
    contentWidthRef.current = contentSize.width;

    const isAtStart = contentOffset.x <= 0;
    const isAtEnd =
      contentOffset.x + layoutMeasurement.width >= contentSize.width - 10;

    setShowLeftArrow(!isAtStart);
    setShowRightArrow(!isAtEnd && contentSize.width > layoutMeasurement.width);
  };

  const handleContentSizeChange = (contentWidth, contentHeight) => {
    contentWidthRef.current = contentWidth;
    checkArrowVisibility();
  };

  const SemiCircleProgress = ({percentage, color, taken, accrued}) => {
    const size = 110;
    const strokeWidth = 10;
    const radius = (size - strokeWidth) / 2;
    const circumference = Math.PI * radius; // Half circle
    const progress = Math.min(Math.max(percentage, 0), 100);
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <View style={styles.LeaveEnt_semiCircleContainer}>
        <Svg width={size} height={size / 2 + 10} style={styles.LeaveEnt_svg}>
          {/* Background Semi-Circle */}
          <Path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${
              size - strokeWidth / 2
            } ${size / 2}`}
            stroke="#E8F5E9"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />

          {/* Progress Semi-Circle */}
          <Path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${
              size - strokeWidth / 2
            } ${size / 2}`}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </Svg>

        {/* Center Text */}
        <View style={styles.LeaveEnt_centerText}>
          <Text style={styles.LeaveEnt_takenText}>{taken}</Text>
          <Text style={styles.LeaveEnt_divider}>/</Text>
          <Text style={styles.LeaveEnt_totalText}>{accrued}</Text>
        </View>

        {/* Base Line */}
        <View style={[styles.LeaveEnt_baseLine, {width: size}]} />
      </View>
    );
  };

  const LeaveItem = ({item, showDivider}) => {
    const accrued = Number(item.Accrued) || 0;
    const taken = Number(item.Taken) || 0;
    const balance = Number(item.Balance) || 0;
    const percentage = accrued > 0 ? (taken / accrued) * 100 : 0;
    const color = getLeaveColor(item.EntitlementCode);

    return (
      <>
        <View style={styles.LeaveEnt_leaveItem}>
          {/* Semi-Circle Progress */}
          <View style={styles.LeaveEnt_progressSection}>
            <SemiCircleProgress
              percentage={percentage}
              color={color}
              taken={taken}
              accrued={accrued}
            />

            {/* Leave Type Label */}
            <Text
              style={[styles.LeaveEnt_leaveLabel, {color}]}
              numberOfLines={1}
              ellipsizeMode="tail">
              {item.EntitlementCode}
            </Text>
          </View>

          {/* Stats Box */}
          <View style={styles.LeaveEnt_statsBox}>
            <View style={styles.LeaveEnt_statRow}>
              <View style={styles.LeaveEnt_stat}>
                <Text style={styles.LeaveEnt_statLabel}>TOTAL</Text>
                <Text style={[styles.LeaveEnt_statValue, {color}]}>
                  {accrued}
                </Text>
              </View>
              <View style={styles.LeaveEnt_stat}>
                <Text style={styles.LeaveEnt_statLabel}>TAKEN</Text>
                <Text style={[styles.LeaveEnt_statValue, {color: '#757575'}]}>
                  {taken}
                </Text>
              </View>
              <View style={styles.LeaveEnt_stat}>
                <Text style={styles.LeaveEnt_statLabel}>BALANCE</Text>
                <Text style={[styles.LeaveEnt_statValue, {color}]}>
                  {balance}
                </Text>
              </View>
            </View>
          </View>

          {/* Unit Badge */}
          <View style={styles.LeaveEnt_unitBadge}>
            <Text style={styles.LeaveEnt_unitText}>{item.EntitlementUnit}</Text>
          </View>
        </View>

        {/* Divider */}
        {showDivider && <View style={styles.LeaveEnt_itemDivider} />}
      </>
    );
  };

  // If no data after loading, return null to hide the component completely
  if (!loading && leaveData.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <View
        style={[
          styles.LeaveEnt_container,
          {paddingHorizontal: screenWidth * 0.05},
        ]}>
        <Text style={styles.LeaveEnt_loadingText}>
          Loading leave entitlements...
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.LeaveEnt_container,
        {paddingHorizontal: screenWidth * 0.05},
      ]}>
      {/* Header */}
      <View style={styles.LeaveEnt_header}>
        <Text style={styles.LeaveEnt_title}>Leave Entitlements</Text>
        <Text style={styles.LeaveEnt_subtitle}>Swipe to view all types</Text>
      </View>

      {/* Left Arrow */}
      {showLeftArrow && (
        <View style={[styles.LeaveEnt_arrowButton, styles.LeaveEnt_leftArrow]}>
          <Icon name="chevron-left" size={24} color="#666" />
        </View>
      )}

      {/* Content with Arrows */}
      <View style={styles.LeaveEnt_scrollContainer}>
        {/* Scrollable Content */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.LeaveEnt_scrollContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onContentSizeChange={handleContentSizeChange}>
          {leaveData.map((item, index) => (
            <LeaveItem
              key={`${item.EntitlementCode}-${index}`}
              item={item}
              showDivider={index < leaveData.length - 1}
            />
          ))}
        </ScrollView>
      </View>

      {/* Right Arrow */}
      {showRightArrow && (
        <View style={[styles.LeaveEnt_arrowButton, styles.LeaveEnt_rightArrow]}>
          <Icon name="chevron-right" size={24} color="#666" />
        </View>
      )}
    </View>
  );
};

export default LeaveEntitlementProgress;
