/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect} from 'react';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../components/ActionPaneContainer';

const {width, height} = Dimensions.get('window');

const DisplayListPage = () => {
  const navigation = useNavigation();
  const userData = useSelector(state => state.user.userData);

  const pages = [
    {
      id: '1',
      title: 'Leave Request',
      icon: 'calendar-outline',
      screen: 'LeaveSaveRecord',
      color: '#0A66C2',
      category: 'PR',
      onPress: () =>
        navigation.navigate('LeavesListPage', {
          employeeId: userData.employeeId,
          employeeName: userData.employeeName,
          WorkerRecId: userData.WorkerRecId,
          cameFrom: 'DisplayListPage',
        }),
    },
    {
      id: '2',
      title: 'Salary Slip',
      icon: 'card-outline',
      screen: 'PRSalarySlip',
      color: '#0A66C2',
      category: 'PR',
      onPress: () =>
        navigation.navigate('PRSalarySlip', {
          employeeId: userData.employeeId,
        }),
    },
    {
      id: '3',
      title: 'Tax Certificate',
      icon: 'document-text-outline',
      screen: 'PRTaxCertificate',
      color: '#0A66C2',
      category: 'PR',
      onPress: () =>
        navigation.navigate('PRTaxCertificate', {
          employeeId: userData.employeeId,
        }),
    },
  ];

  const [activeFilter, setActiveFilter] = useState('All');
  const [filteredPages, setFilteredPages] = useState(pages);
  const [animatedValues, setAnimatedValues] = useState([]);
  const [isCompanySwitching, setIsCompanySwitching] = useState(false);

  // Filtering logic
  const filterPages = category => {
    const updatedPages =
      category === 'All'
        ? pages
        : pages.filter(page => page.category === category);

    setFilteredPages(updatedPages);
  };

  useEffect(() => {
    filterPages(activeFilter);
  }, [activeFilter]);

  // Animate menu items whenever filteredPages changes
  useEffect(() => {
    if (!isCompanySwitching && filteredPages.length > 0) {
      const newAnimatedValues = filteredPages.map(
        () => new Animated.Value(-width),
      );
      setAnimatedValues(newAnimatedValues);

      setTimeout(() => {
        const animations = newAnimatedValues.map((animValue, index) =>
          Animated.timing(animValue, {
            toValue: 0,
            duration: 300,
            delay: index * 100,
            useNativeDriver: true,
          }),
        );
        Animated.stagger(100, animations).start();
      }, 50); // slight delay to ensure values are initialized
    }
  }, [filteredPages, isCompanySwitching]);

  const handleRefresh = () => {
    setIsCompanySwitching(true);
    setTimeout(() => {
      setIsCompanySwitching(false);
    }, 1500);
  };

  const handleFilterPress = filter => setActiveFilter(filter);

  const handlePagePress = page => {
    if (page.onPress) {
      page.onPress();
    }
  };

  const getCategoryDisplayName = category => {
    switch (category) {
      case 'PR':
        return 'Payroll';
      case 'HR':
        return 'Human Resource';
      case 'TAS':
        return 'Time Attendance';
      default:
        return category;
    }
  };

  const renderFilterButton = filter => (
    <TouchableOpacity
      key={filter}
      style={[
        styles.filterButton,
        activeFilter === filter && styles.activeFilterButton,
      ]}
      onPress={() => handleFilterPress(filter)}
      activeOpacity={0.7}>
      <Text
        style={[
          styles.filterButtonText,
          activeFilter === filter && styles.activeFilterButtonText,
        ]}>
        {filter}
      </Text>
    </TouchableOpacity>
  );

  const renderMenuItem = (item, index) => (
    <Animated.View
      key={item.id}
      style={{
        transform: [
          {
            translateX:
              animatedValues[index] instanceof Animated.Value
                ? animatedValues[index]
                : new Animated.Value(0),
          },
        ],
      }}>
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => handlePagePress(item)}
        activeOpacity={0.7}>
        <View style={[styles.iconWrapper, {backgroundColor: item.color}]}>
          <Ionicons name={item.icon} size={width * 0.06} color="#ffffff" />
        </View>
        <Text style={styles.menuTitle}>{item.title}</Text>
        <Ionicons name="chevron-forward" size={width * 0.04} color="#9ca3af" />
      </TouchableOpacity>
    </Animated.View>
  );

  const renderNoMenuMessage = () => (
    <View style={styles.noMenuContainer}>
      <Text style={styles.noMenuText}>
        No menu item for{'\n'}
        {getCategoryDisplayName(activeFilter)}
      </Text>
    </View>
  );

  return (
    <ActionPaneContainer
      pageTitle="Employee History"
      isBackButton={false}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      onRefresh={handleRefresh}>
      {isCompanySwitching ? (
        <CustomIndicator />
      ) : (
        <SafeAreaView style={styles.container}>
          <View style={styles.filterContainer}>
            <View style={styles.filterScrollContent}>
              {['All', 'PR', 'HR', 'TAS'].map(filter =>
                renderFilterButton(filter),
              )}
            </View>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            <View style={styles.menuContainer}>
              {filteredPages.length > 0
                ? filteredPages.map(renderMenuItem)
                : renderNoMenuMessage()}
            </View>
            <View style={styles.bottomPadding} />
          </ScrollView>
        </SafeAreaView>
      )}
    </ActionPaneContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  filterContainer: {
    backgroundColor: '#ebf5ff',
    paddingBottom: 0,
    paddingHorizontal: 0,
    marginBottom: height * 0.01,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
    elevation: 2,
  },
  filterScrollContent: {
    paddingHorizontal: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  filterButton: {
    flex: 1,
    paddingVertical: height * 0.02,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    position: 'relative',
  },
  activeFilterButton: {
    borderBottomWidth: 5,
    borderBottomColor: '#0A66C2',
  },
  filterButtonText: {
    fontSize: width * 0.04,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
  activeFilterButtonText: {
    color: '#0A66C2',
    fontWeight: '700',
  },
  menuContainer: {
    paddingTop: width * 0.05,
    paddingHorizontal: width * 0.03,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.05,
    marginBottom: height * 0.015,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowOffset: {width: 0, height: 4},
    shadowRadius: 3,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    minHeight: height * 0.08,
  },
  iconWrapper: {
    width: width * 0.1,
    height: width * 0.1,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: width * 0.04,
  },
  menuTitle: {
    flex: 1,
    fontSize: width * 0.042,
    fontWeight: '600',
    color: '#1f2937',
  },
  noMenuContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: height * 0.1,
  },
  noMenuText: {
    fontSize: width * 0.045,
    fontWeight: '500',
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: width * 0.055,
  },
  bottomPadding: {
    height: height * 0.05,
  },
});

export default DisplayListPage;
