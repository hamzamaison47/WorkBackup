/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect} from 'react';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import {styles} from '../../styles/styles';
const {width} = Dimensions.get('window');
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
    {
      id: '4',
      title: 'Loan & Advance',
      icon: 'wallet-outline',
      screen: 'LoanRequestListPage',
      color: '#0A66C2',
      category: 'PR',
      onPress: () =>
        navigation.navigate('LoanRequestListPage', {
          employeeId: userData.employeeId,
          employeeName: userData.employeeName,
          WorkerRecId: userData.WorkerRecId,
          cameFrom: 'DisplayListPage',
        }),
    },
    {
      id: '5',
      title: 'Entitlement Balance',
      icon: 'time-outline',
      screen: 'EntitlementBalance',
      color: '#0A66C2',
      category: 'PR',
      onPress: () =>
        navigation.navigate('EntitlementBalance', {
          employeeId: userData.employeeId,
          employeeName: userData.employeeName,
          WorkerRecId: userData.WorkerRecId,
          cameFrom: 'DisplayListPage',
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
        styles.DisLp_FilterButton,
        activeFilter === filter && styles.DisLp_ActiveFilterButton,
      ]}
      onPress={() => handleFilterPress(filter)}
      activeOpacity={0.7}>
      <Text
        style={[
          styles.DisLp_FilterButtonText,
          activeFilter === filter && styles.DisLp_ActiveFilterButtonText,
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
        style={styles.DisLp_MenuItem}
        onPress={() => handlePagePress(item)}
        activeOpacity={0.7}>
        <View style={[styles.DisLp_IconWrapper, {backgroundColor: item.color}]}>
          <Ionicons name={item.icon} size={width * 0.06} color="#ffffff" />
        </View>
        <Text style={styles.DisLp_MenuTitle}>{item.title}</Text>
        <Ionicons name="chevron-forward" size={width * 0.04} color="#9ca3af" />
      </TouchableOpacity>
    </Animated.View>
  );

  const renderNoMenuMessage = () => (
    <View style={styles.DisLp_MenuContainer}>
      <Text style={styles.DisplayNoMenuText}>
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
        <SafeAreaView style={styles.DisLp_container}>
          <View style={styles.DisLp_FilterContainer}>
            <View style={styles.DisLp_FilterScrollContent}>
              {['All', 'PR', 'HR', 'TAS'].map(filter =>
                renderFilterButton(filter),
              )}
            </View>
          </View>

          <ScrollView
            style={styles.DisLp_ScrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.DisLp_ScrollContent}>
            <View style={styles.DisLp_MenuContainer}>
              {filteredPages.length > 0
                ? filteredPages.map(renderMenuItem)
                : renderNoMenuMessage()}
            </View>
            <View style={styles.DisLp_BottomPadding} />
          </ScrollView>
        </SafeAreaView>
      )}
    </ActionPaneContainer>
  );
};

export default DisplayListPage;
