import React, {useState, useCallback} from 'react';
import {
  Text,
  FlatList,
  View,
  RefreshControl,
  I18nManager,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {
  useNavigation,
  useFocusEffect,
  useRoute,
} from '@react-navigation/native';
import {useSelector} from 'react-redux';

import {retrieveAllESSEmployeeCourse} from '../../API/ESSEmployeeOpenCourse/RetrieveAllEmployeeCourse';
import {RetrieveAllEmployeeAssignedCourse} from '../../API/ESSEmployeeOpenCourse/RetrieveAllEmployeeAssignedCourse';

import ActionPaneContainer from '../../components/ActionPaneContainer';
import DynamicRequestCard from '../../components/DynamicRequestCard';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import AlertModal from '../../components/Alert/AlertModal';

const ESSEmployeeCourse_ListPage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const isRTL = I18nManager.isRTL;

  const reduxUserData = useSelector(state => state.user.userData);

  const {employeeId, userData: routeUserData} = route.params || {};
  const effectiveUserData = routeUserData || reduxUserData;
  const effectiveEmployeeId = employeeId || effectiveUserData?.employeeId;

  const [isLoading, setIsLoading] = useState(false);
  const [courseData, setCourseData] = useState([]);
  const [activeTab, setActiveTab] = useState('assigned');

  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  /** Fetch Courses */
  const fetchCourses = useCallback(async () => {
    if (!effectiveEmployeeId) return;

    setIsLoading(true);

    try {
      let response = [];

      if (activeTab === 'assigned') {
        response = await RetrieveAllEmployeeAssignedCourse({
          employeeId: effectiveEmployeeId,
        });
      } else {
        response = await retrieveAllESSEmployeeCourse({
          employeeId: effectiveEmployeeId,
        });
      }

      console.log('Courses API Response:', response);

      setCourseData(response || []);
    } catch (error) {
      console.log('Course fetch error', error);
      setAlertMessage('Unable to load courses');
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveEmployeeId, activeTab]);

  useFocusEffect(
    useCallback(() => {
      fetchCourses();
    }, [fetchCourses]),
  );

  const handleRefresh = () => fetchCourses();

  /** Card Configurations */

  const assignedCardConfig = {
    // headerConfig: {
    //   title: {key: 'courseTitle'},
    //   subtitle: {key: 'courseId'},
    // },
    fields: [
      {key: 'courseId', label: 'Course ID', type: 'text'},
      {key: 'courseTitle', label: 'Course Title', type: 'text'},
      {key: 'dueDate', label: 'Due Date', type: 'date'},
    ],
    gradientColors: ['#6ee0ff', '#bddeff', '#cce6ff'],
    isRTL,
  };

  const completedCardConfig = {
    headerConfig: {
      title: {key: 'courseTitle'},
      subtitle: {key: 'courseId'},
    },
    fields: [
      {key: 'courseId', label: 'Course ID', type: 'text'},
      {key: 'courseTitle', label: 'Course Title', type: 'text'},
      {key: 'location', label: 'Location', type: 'text'},
    ],
    expandableFields: [
      {key: 'startDate', label: 'Start Date', type: 'date'},
      {key: 'endDate', label: 'End Date', type: 'date'},
    ],
    gradientColors: ['#6ee0ff', '#bddeff', '#cce6ff'],
    isRTL,
  };

  /** Render Card */

  const renderCourseCard = ({item}) => {
    if (!item) return null;

    const processedItem = {
      recId: item['a:recId'] || item.recId || '',
      courseId: item['a:courseId'] || item.courseId || '',
      courseTitle:
        item['a:courseTitle'] || item.courseName || item.description || '',
      location: item['a:location'] || item.location || '',
      startDate: item['a:startDate'] || item.startDate || '',
      endDate: item['a:endDate'] || item.endDate || '',
      dueDate: item['a:dueDate'] || item.dueDate || '',
    };

    const config =
      activeTab === 'assigned' ? assignedCardConfig : completedCardConfig;

    return (
      <DynamicRequestCard
        data={processedItem}
        headerConfig={config.headerConfig}
        fields={config.fields}
        expandableFields={config.expandableFields}
        isExpandable={activeTab === 'completed'}
        gradientColors={config.gradientColors}
        isRTL={isRTL}
      />
    );
  };

  return (
    <ActionPaneContainer
      pageTitle="Courses"
      showFooter
      isHeaderActive
      onRefresh={handleRefresh}
      showPageTitleRow
      showFloatingButton={false}>
      {/* Top Buttons */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'assigned' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('assigned')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'assigned' && styles.activeText,
            ]}>
            Assigned
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'completed' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('completed')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'completed' && styles.activeText,
            ]}>
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <CustomIndicator />
        </View>
      ) : courseData.length > 0 ? (
        <FlatList
          data={courseData}
          renderItem={renderCourseCard}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
          }
        />
      ) : (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No Courses Found</Text>
        </View>
      )}

      <AlertModal
        visible={alertModal}
        heading="Alert"
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />
    </ActionPaneContainer>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 5,
  },
  activeTab: {
    backgroundColor: '#0A66C2',
  },
  tabText: {
    fontSize: 14,
    color: '#333',
  },
  activeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingContainer: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  listContainer: {paddingBottom: 20},
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  noDataText: {fontSize: 16, color: '#555'},
});

export default ESSEmployeeCourse_ListPage;
