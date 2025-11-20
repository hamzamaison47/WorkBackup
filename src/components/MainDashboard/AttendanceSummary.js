/* eslint-disable no-unused-vars */
/* eslint-disable curly */
import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, useWindowDimensions} from 'react-native';
import moment from 'moment';

import {getRegisterSummaryColorByDate} from '../../API/Attendance/getRegisterSummaryColorByDate';

const AttendanceSummary = ({userData, screenWidth}) => {
  const {width} = useWindowDimensions();
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch attendance data
  useEffect(() => {
    const fetchAttendanceData = async () => {
      if (!userData?.employeeId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const fromDate = moment().startOf('month').format('YYYY-MM-DD');
        const toDate = moment().endOf('month').format('YYYY-MM-DD');

        const data = await getRegisterSummaryColorByDate({
          employeeId: userData.employeeId,
          fromDate,
          toDate,
        });

        setAttendanceData(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching attendance data:', error);
        setAttendanceData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, [userData?.employeeId]);

  // Process the data for the graph
  const processGraphData = () => {
    if (loading || !attendanceData || attendanceData.length === 0) {
      return {
        presentCount: 0,
        absentCount: 0,
        leaveCount: 0,
        presentColor: '#4CAF50',
        absentColor: '#F44336',
        leaveColor: '#2196F3',
      };
    }

    const summary = attendanceData[0] || {};

    return {
      presentCount: Number(summary.PresentCount) || 0,
      absentCount: Number(summary.AbsentCount) || 0,
      leaveCount: Number(summary.LeaveCount) || 0,
      presentColor: summary.PresentColor || '#4CAF50',
      absentColor: summary.AbsentColor || '#F44336',
      leaveColor: summary.LeaveColor || '#2196F3',
    };
  };

  const graphData = processGraphData();
  const today = moment().date();
  const maxDays = today; // Y-axis goes from 1 to today

  // Data points for the bars
  const dataPoints = [
    {
      category: 'Present',
      count: graphData.presentCount,
      color: graphData.presentColor,
    },
    {
      category: 'Absent',
      count: graphData.absentCount,
      color: graphData.absentColor,
    },
    {
      category: 'Leave',
      count: graphData.leaveCount,
      color: graphData.leaveColor,
    },
  ];

  // Generate Y-axis labels (1 to today)
  const generateYAxisLabels = () => {
    const labels = [];
    const step = Math.max(1, Math.ceil(maxDays / 8)); // Show ~8 labels

    for (let i = 1; i <= maxDays; i += step) {
      labels.push(i);
    }

    // Always include the max value if not already there
    if (!labels.includes(maxDays)) {
      labels.push(maxDays);
    }

    return labels;
  };

  const yAxisLabels = generateYAxisLabels();

  // Calculate height position based on count (1 to maxDays)
  const getHeightPercentage = count => {
    if (maxDays === 0) return 0;
    return (count / maxDays) * 100;
  };

  return (
    <View style={[styles.container, {paddingHorizontal: screenWidth * 0.05}]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Attendance Summary</Text>
        <Text style={styles.subtitle}>{moment().format('MMMM YYYY')}</Text>
      </View>

      {/* Graph Container */}
      <View style={styles.graphContainer}>
        {/* Y-axis Labels */}
        <View style={styles.yAxis}>
          {yAxisLabels.reverse().map((label, index) => (
            <Text key={index} style={styles.yAxisLabel}>
              {label}
            </Text>
          ))}
        </View>

        {/* Graph Content */}
        <View style={styles.graph}>
          {/* Grid Lines */}
          <View style={styles.gridLines}>
            {yAxisLabels.map((label, index) => (
              <View
                key={index}
                style={[
                  styles.gridLine,
                  {bottom: `${(label / maxDays) * 100}%`},
                ]}
              />
            ))}
          </View>

          {/* Horizontal Bars Container */}
          <View style={styles.barsContainer}>
            {dataPoints.map((point, index) => {
              const barWidth = 100 / dataPoints.length;
              const leftPosition = index * barWidth;

              return (
                <View
                  key={index}
                  style={[
                    styles.barColumn,
                    {
                      left: `${leftPosition}%`,
                      width: `${barWidth}%`,
                    },
                  ]}>
                  {/* Only show bar if count > 0 */}
                  {point.count > 0 && (
                    <>
                      {/* Horizontal Bar */}
                      <View
                        style={[
                          styles.horizontalBar,
                          {
                            height: `${getHeightPercentage(point.count)}%`,
                            backgroundColor: point.color,
                          },
                        ]}
                      />

                      {/* Count Badge at top of bar */}
                      <View
                        style={[
                          styles.countBadge,
                          {
                            bottom: `${getHeightPercentage(point.count)}%`,
                            backgroundColor: point.color,
                          },
                        ]}>
                        <Text style={styles.countText}>{point.count}</Text>
                      </View>
                    </>
                  )}

                  {/* Category Label at bottom */}
                  <View style={styles.categoryLabelContainer}>
                    <Text style={[styles.categoryLabel, {color: point.color}]}>
                      {point.category}
                    </Text>
                    {point.count === 0 && (
                      <Text style={styles.zeroText}>0</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {/* X-axis Base */}
          <View style={styles.xAxis} />
        </View>
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <View
            style={[
              styles.summaryDot,
              {backgroundColor: graphData.presentColor},
            ]}
          />
          <Text style={styles.summaryLabel}>Present</Text>
          <Text style={styles.summaryValue}>{graphData.presentCount}</Text>
        </View>
        <View style={styles.summaryItem}>
          <View
            style={[
              styles.summaryDot,
              {backgroundColor: graphData.absentColor},
            ]}
          />
          <Text style={styles.summaryLabel}>Absent</Text>
          <Text style={styles.summaryValue}>{graphData.absentCount}</Text>
        </View>
        <View style={styles.summaryItem}>
          <View
            style={[styles.summaryDot, {backgroundColor: graphData.leaveColor}]}
          />
          <Text style={styles.summaryLabel}>Leave</Text>
          <Text style={styles.summaryValue}>{graphData.leaveCount}</Text>
        </View>
        <View style={styles.summaryItem}>
          <View style={styles.summaryDot} />
          <Text style={styles.summaryLabel}>Days Tracked</Text>
          <Text style={styles.summaryValue}>
            {today}/{moment().daysInMonth()}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  header: {
    marginBottom: 24,
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
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
  graphContainer: {
    flexDirection: 'row',
    height: 240,
    marginBottom: 24,
  },
  yAxis: {
    width: 36,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 10,
    paddingTop: 8,
    paddingBottom: 40,
  },
  yAxisLabel: {
    fontSize: 11,
    color: '#9E9E9E',
    fontWeight: '600',
  },
  graph: {
    flex: 1,
    position: 'relative',
    marginLeft: 8,
  },
  gridLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 40,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#F5F5F5',
  },
  barsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 40,
  },
  barColumn: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  horizontalBar: {
    position: 'absolute',
    bottom: 0,
    width: '70%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  countBadge: {
    position: 'absolute',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: -14,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  categoryLabelContainer: {
    position: 'absolute',
    bottom: -32,
    alignItems: 'center',
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  zeroText: {
    fontSize: 11,
    color: '#BDBDBD',
    fontWeight: '500',
  },
  xAxis: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 40,
    height: 2,
    backgroundColor: '#E0E0E0',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#BDBDBD',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#757575',
    marginBottom: 4,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
});

export default AttendanceSummary;
