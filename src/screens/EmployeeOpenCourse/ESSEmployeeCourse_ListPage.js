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

import {retrieveAssigned} from '../../API/ESSEmployeeCourse/retrieveAssigned';
import {retrieveOpenCourses} from '../../API/ESSEmployeeCourse/retrieveOpenCourses';
import {retrieveConfirmCourses} from '../../API/ESSEmployeeCourse/retrieveConfirmCourses';

import ActionPaneContainer from '../../components/ActionPaneContainer';
import DynamicRequestCard from '../../components/DynamicRequestCard';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import AlertModal from '../../components/Alert/AlertModal';

const ESSEmployeeCourse_ListPage = () => {
  const isRTL = I18nManager.isRTL;

  // ✅ Adjust this if your Redux slice is different
  const {userData} = useSelector(state => state.user);

  const [activeTab, setActiveTab] = useState('assigned');
  const [assignedCourses, setAssignedCourses] = useState([]);
  const [openCourses, setOpenCourses] = useState([]);
  const [completedCourses, setCompletedCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  /** ✅ Fetch Data Based on Active Tab */
  useFocusEffect(
    useCallback(() => {
      const person = userData?.Person;

      if (!person) {
        console.warn('Person is missing, API not called');
        return;
      }

      console.log('PERSON:', person, 'TAB:', activeTab);

      const fetchCourses = async () => {
        setLoading(true);
        try {
          let data = [];

          if (activeTab === 'assigned') {
            data = await retrieveAssigned({person: String(person)});
            setAssignedCourses(data || []);
          } else if (activeTab === 'open') {
            data = await retrieveOpenCourses({person: String(person)});
            setOpenCourses(data || []);
          } else if (activeTab === 'completed') {
            data = await retrieveConfirmCourses({person: String(person)});
            setCompletedCourses(data || []);
          }

          console.log(`${activeTab} DATA:`, data);
        } catch (error) {
          console.error(`Error fetching ${activeTab} courses:`, error);

          if (activeTab === 'assigned') setAssignedCourses([]);
          if (activeTab === 'open') setOpenCourses([]);
          if (activeTab === 'completed') setCompletedCourses([]);
        } finally {
          setLoading(false);
        }
      };

      fetchCourses();
    }, [userData?.Person, activeTab]),
  );

  /** Data Switch */
  const courseData =
    activeTab === 'assigned'
      ? assignedCourses
      : activeTab === 'open'
      ? openCourses
      : completedCourses;

  /** Card Configurations */
  const assignedCardConfig = {
    fields: [
      {key: 'hrmCourseId', label: 'Course ID', type: 'text'},
      {key: 'courseName', label: 'Course Title', type: 'text'},
      {key: 'dueDate', label: 'Due Date', type: 'date'},
    ],
    gradientColors: ['#6ee0ff', '#bddeff', '#cce6ff'],
    isRTL,
  };

  const openCardConfig = {
    fields: [
      {key: 'hrmCourseId', label: 'Course ID', type: 'text'},
      {key: 'description', label: 'Course Title', type: 'text'},
    ],
    gradientColors: ['#fff4cc', '#ffe6cc', '#ffb3b3'],
    isRTL,
  };

  const completedCardConfig = {
    headerConfig: {
      title: {key: 'courseTitle'},
      subtitle: {key: 'courseId'},
    },
    fields: [
      {key: 'hrmCourseId', label: 'Course ID', type: 'text'},
      {key: 'description', label: 'Course Title', type: 'text'},
      {key: 'Location', label: 'Location', type: 'text'},
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
    let config;

    if (activeTab === 'assigned') config = assignedCardConfig;
    else if (activeTab === 'open') config = openCardConfig;
    else config = completedCardConfig;

    return (
      <DynamicRequestCard
        data={item}
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
      showPageTitleRow
      showFloatingButton={false}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        {['assigned', 'open', 'completed'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}>
            <Text
              style={[styles.tabText, activeTab === tab && styles.activeText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <CustomIndicator />
      ) : courseData.length > 0 ? (
        <FlatList
          data={courseData}
          renderItem={renderCourseCard}
          keyExtractor={(item, index) =>
            item.recId ? String(item.recId) : index.toString()
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No Courses Found</Text>
        </View>
      )}
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
  listContainer: {
    paddingBottom: 20,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  noDataText: {
    fontSize: 16,
    color: '#555',
  },
});

export default ESSEmployeeCourse_ListPage;
