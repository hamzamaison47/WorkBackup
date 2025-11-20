/* eslint-disable curly */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/no-unstable-nested-components */
import React, {useState, useEffect, useCallback, useRef} from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialIcons';

import {RetrieveEntitlementBalanceRequest} from '../../API/EntitlementBalance/RetrieveEntitlementBalanceRequest';

const LeaveEntitlementProgress = ({userData, screenWidth}) => {
  const [leaveData, setLeaveData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const scrollViewRef = useRef(null);
  const contentWidthRef = useRef(0);
  const scrollPositionRef = useRef(0);

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

  // Define colors for different leave types
  const getLeaveColor = entitlementCode => {
    const colors = {
      'Annual Leave': '#4CAF50',
      'Casual Leave': '#2196F3',
      'Maternity Leaves': '#E91E63',
      'Sick Leaves': '#FF9800',
      default: '#9C27B0',
    };
    return colors[entitlementCode] || colors.default;
  };

  const SemiCircleProgress = ({percentage, color, taken, accrued}) => {
    const size = 110;
    const strokeWidth = 10;
    const radius = (size - strokeWidth) / 2;
    const circumference = Math.PI * radius; // Half circle
    const progress = Math.min(Math.max(percentage, 0), 100);
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <View style={styles.semiCircleContainer}>
        <Svg width={size} height={size / 2 + 10} style={styles.svg}>
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
        <View style={styles.centerText}>
          <Text style={styles.takenText}>{taken}</Text>
          <Text style={styles.divider}>/</Text>
          <Text style={styles.totalText}>{accrued}</Text>
        </View>

        {/* Base Line */}
        <View style={[styles.baseLine, {width: size}]} />
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
        <View style={styles.leaveItem}>
          {/* Semi-Circle Progress */}
          <View style={styles.progressSection}>
            <SemiCircleProgress
              percentage={percentage}
              color={color}
              taken={taken}
              accrued={accrued}
            />

            {/* Leave Type Label */}
            <Text style={[styles.leaveLabel, {color}]} numberOfLines={1}>
              {item.EntitlementCode}
            </Text>
          </View>

          {/* Stats Box */}
          <View style={styles.statsBox}>
            <View style={styles.statRow}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>TOTAL</Text>
                <Text style={[styles.statValue, {color}]}>{accrued}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>TAKEN</Text>
                <Text style={[styles.statValue, {color: '#757575'}]}>
                  {taken}
                </Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>BALANCE</Text>
                <Text style={[styles.statValue, {color: '#4CAF50'}]}>
                  {balance}
                </Text>
              </View>
            </View>
          </View>

          {/* Unit Badge */}
          <View style={styles.unitBadge}>
            <Text style={styles.unitText}>{item.EntitlementUnit}</Text>
          </View>
        </View>

        {/* Divider */}
        {showDivider && <View style={styles.itemDivider} />}
      </>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, {paddingHorizontal: screenWidth * 0.05}]}>
        <Text style={styles.loadingText}>Loading leave entitlements...</Text>
      </View>
    );
  }

  if (leaveData.length === 0) {
    return (
      <View style={[styles.container, {paddingHorizontal: screenWidth * 0.05}]}>
        <View style={styles.header}>
          <Text style={styles.title}>Leave Entitlements</Text>
        </View>
        <Text style={styles.noDataText}>No leave entitlements available</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, {paddingHorizontal: screenWidth * 0.05}]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Leave Entitlements</Text>
        <Text style={styles.subtitle}>Swipe to view all types</Text>
      </View>

      {/* Left Arrow */}
      {showLeftArrow && (
        <View style={[styles.arrowButton, styles.leftArrow]}>
          <Icon name="chevron-left" size={24} color="#666" />
        </View>
      )}

      {/* Content with Arrows */}
      <View style={styles.scrollContainer}>
        {/* Scrollable Content */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onContentSizeChange={handleContentSizeChange}>
          {leaveData.map((item, index) => (
            <LeaveItem
              key={index}
              item={item}
              showDivider={index < leaveData.length - 1}
            />
          ))}
        </ScrollView>
      </View>

      {/* Right Arrow */}
      {showRightArrow && (
        <View style={[styles.arrowButton, styles.rightArrow]}>
          <Icon name="chevron-right" size={24} color="#666" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    paddingLeft: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#757575',
    fontWeight: '500',
  },
  scrollContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollContent: {
    paddingVertical: 8,
  },
  leaveItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
    minWidth: 160,
  },
  progressSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  semiCircleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 75,
    marginBottom: 8,
    position: 'relative',
  },
  svg: {
    position: 'absolute',
    top: 0,
  },
  centerText: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'baseline',
    bottom: 8,
  },
  takenText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  divider: {
    fontSize: 14,
    fontWeight: '400',
    color: '#BDBDBD',
    marginHorizontal: 2,
  },
  totalText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
  },
  baseLine: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    backgroundColor: '#d1d1d1ff',
  },
  leaveLabel: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },
  statsBox: {
    width: '100%',
    backgroundColor: '#f3f3f3ff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 7,
    color: '#9E9E9E',
    fontWeight: '600',
    marginBottom: 3,
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  unitBadge: {
    backgroundColor: '#ebebebff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  unitText: {
    fontSize: 9,
    color: '#757575',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#E0E0E0',
    marginHorizontal: 12,
    alignSelf: 'center',
  },
  arrowButton: {
    position: 'absolute',
    top: '55%',
    // marginTop: -20,
    // width: 30,
    // height: 30,
    // borderRadius: 15,
    // backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.25,
    // shadowRadius: 3.84,
    // elevation: 5,
    // zIndex: 10,
  },
  leftArrow: {
    left: 8,
  },
  rightArrow: {
    right: 8,
  },
  loadingText: {
    textAlign: 'center',
    color: '#757575',
    fontSize: 14,
    marginTop: 20,
  },
  noDataText: {
    textAlign: 'center',
    color: '#9E9E9E',
    fontSize: 14,
    marginTop: 12,
    fontStyle: 'italic',
  },
});

export default LeaveEntitlementProgress;
