import React, {useState, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Alert,
  BackHandler,
  I18nManager,
  ActivityIndicator,
} from 'react-native';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {useSelector} from 'react-redux';

import ActionPaneContainer from '../../components/ActionPaneContainer';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import AlertModal from '../../components/Alert/AlertModal';
import usePalette from '../../hooks/usePalette';

import {retrieveEmployeeQuestionsWithMCQs} from '../../API/Exit Interview/retrieveEmployeeQuestionsWithMCQs';
import {updateExitInterview} from '../../API/Exit Interview/UpdateExitInterview';
import styles from '../../styles/styles';

// ─────────────────────────────────────────────
// Small inline card – replaces DynamicRequestCard
// ─────────────────────────────────────────────
const ExitInterviewCard = ({item, status, onPress, isRTL}) => {
  const isClickable = status === 'open';
  const isAnswered = !!item.answer;

  return (
    <TouchableOpacity
      style={[
        styles.EI_Card,
        !isClickable && styles.EI_CardDisabled,
        isAnswered && styles.EI_CardAnswered,
      ]}
      onPress={() => isClickable && onPress(item)}
      activeOpacity={isClickable ? 0.7 : 1}
      disabled={!isClickable}>
      {/* Header row */}
      <View style={[styles.EI_CardHeader, isRTL && styles.EI_RowRTL]}>
        <View style={styles.EI_TypeBadge}>
          <Text style={styles.EI_TypeBadgeText}>
            {item.QuestionType || 'Simple'}
          </Text>
        </View>

        <View style={styles.EI_AnsweredBadge}>
          <Text
            style={[
              styles.EI_AnsweredBadgeText,
              {color: isAnswered ? '#2e7d32' : '#9e9e9e'},
            ]}>
            {isAnswered ? '✓ Answered' : 'Pending'}
          </Text>
        </View>
      </View>

      {/* Question text */}
      <Text style={styles.EI_QuestionText}>{item.questionDescription}</Text>

      {/* Show saved answer preview if answered */}
      {isAnswered && (
        <Text style={styles.EI_AnswerPreview} numberOfLines={2}>
          {item.answer}
        </Text>
      )}
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────
const HRExitInterviewListPage = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const isRTL = I18nManager.isRTL;
  const P = usePalette();

  const {employeeId, userData: routeUserData} = route.params || {};
  const reduxUserData = useSelector(state => state.user.userData);
  const effectiveUserData = routeUserData || reduxUserData;
  const effectiveEmployeeId = employeeId || effectiveUserData?.employeeId;

  // ── Data state ──────────────────────────────
  const [rawData, setRawData] = useState([]);
  const [data, setData] = useState([]);
  const [displayData, setDisplayData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  // ── UI state ────────────────────────────────
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState(null);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // ── Answer pane state ───────────────────────
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [selectedMCQ, setSelectedMCQ] = useState(null);
  const [selectedOption, setSelectedOption] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // ─────────────────────────────────────────────
  // FETCH
  // ─────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!effectiveEmployeeId) return;
    setLoading(true);
    try {
      const res = await retrieveEmployeeQuestionsWithMCQs({
        employeeId: effectiveEmployeeId,
      });

      setRawData(res || []);

      if (res && res.length > 0) {
        setStatus(res[0].Status?.toLowerCase() || 'open');

        const filtered = [];
        const mcqIds = new Set();

        res.forEach(item => {
          const type = item.QuestionType?.toLowerCase();
          if (type === 'multiple choice') {
            if (!mcqIds.has(item.question)) {
              filtered.push(item);
              mcqIds.add(item.question);
            }
          } else {
            filtered.push(item);
          }
        });

        setData(filtered);
        setDisplayData(filtered);
      } else {
        setData([]);
        setDisplayData([]);
        setStatus('');
      }
    } catch (err) {
      console.log('Fetch ERROR:', err);
      setAlertMessage('Unable to load data. Please check your connection.');
      setAlertModal(true);
    } finally {
      setLoading(false);
    }
  }, [effectiveEmployeeId]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  // Back handler
  useFocusEffect(
    useCallback(() => {
      const onBack = () => {
        navigation.goBack();
        return true;
      };
      BackHandler.addEventListener('hardwareBackPress', onBack);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBack);
    }, [navigation]),
  );

  // ─────────────────────────────────────────────
  // FILTER / SEARCH / SORT
  // ─────────────────────────────────────────────
  const getAnswerLabel = item => {
    if (!item) return 'Pending';
    return item.answer ? 'Answered' : 'Pending';
  };

  const visiblePills = useMemo(() => {
    if (!data.length) return ['All'];
    return ['All', 'Answered', 'Pending'];
  }, [data]);

  const getFilterCounts = () => {
    const counts = {All: data.length};
    counts.Answered = data.filter(i => !!i.answer).length;
    counts.Pending = data.filter(i => !i.answer).length;
    return counts;
  };

  const applySearchAndSort = useCallback((source, query, sort) => {
    let result = [...source];

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(item =>
        [item.questionDescription, item.QuestionType, item.answer]
          .filter(Boolean)
          .some(v => v.toLowerCase().includes(q)),
      );
    }

    if (sort === 'asc') {
      result.sort((a, b) =>
        (a.questionDescription || '').localeCompare(
          b.questionDescription || '',
        ),
      );
    } else if (sort === 'desc') {
      result.sort((a, b) =>
        (b.questionDescription || '').localeCompare(
          a.questionDescription || '',
        ),
      );
    }

    setDisplayData(result);
  }, []);

  const getFilteredData = () => {
    const base = searchQuery.trim() ? displayData : data;
    if (activeFilter === 'All') return base;
    return base.filter(item => getAnswerLabel(item) === activeFilter);
  };

  const handleSearch = query => {
    setSearchQuery(query);
    applySearchAndSort(data, query, sortOrder);
  };

  const handleSort = sort => {
    setSortOrder(sort);
    applySearchAndSort(data, searchQuery, sort);
  };

  const handleRefresh = () => fetchData();

  // ─────────────────────────────────────────────
  // ROW PRESS
  // ─────────────────────────────────────────────
  const handleRowPress = item => {
    if (status !== 'open') return;

    const type = item.QuestionType?.toLowerCase();

    if (type === 'simple') {
      setSelectedMCQ(null);
      setSelectedQuestion(item);
      const existing = rawData.find(
        x =>
          x.question === item.question &&
          x.QuestionType?.toLowerCase() === 'simple',
      );
      setAnswer(existing?.answer || '');
    } else {
      setSelectedQuestion(null);
      setSelectedMCQ(item);
      const options = rawData.filter(
        x =>
          x.question === item.question &&
          x.QuestionType?.toLowerCase() === 'multiple choice',
      );
      const selected = options.find(x => x.answer);
      setSelectedOption(selected?.answer ? [selected.answer] : []);
    }
  };

  // ─────────────────────────────────────────────
  // SAVE
  // ─────────────────────────────────────────────
  const handleSaveSimple = async () => {
    if (!answer.trim()) {
      Alert.alert('Validation', 'Please enter an answer');
      return;
    }
    setIsSaving(true);
    try {
      await updateExitInterview({
        questionRecId: selectedQuestion.question,
        answer,
      });
      setAlertMessage('Answer saved successfully');
      setAlertModal(true);
      setSelectedQuestion(null);
      setAnswer('');
      fetchData();
    } catch {
      setAlertMessage('Failed to save answer');
      setAlertModal(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveMCQ = async () => {
    if (!selectedOption.length) {
      Alert.alert('Validation', 'Please select an option');
      return;
    }
    setIsSaving(true);
    try {
      await updateExitInterview({
        questionRecId: selectedMCQ.question,
        answer: selectedOption[0],
      });
      setAlertMessage('Answer saved successfully');
      setAlertModal(true);
      setSelectedMCQ(null);
      setSelectedOption([]);
      fetchData();
    } catch {
      setAlertMessage('Failed to save answer');
      setAlertModal(true);
    } finally {
      setIsSaving(false);
    }
  };

  // ─────────────────────────────────────────────
  // MCQ OPTIONS
  // ─────────────────────────────────────────────
  const mcqOptions = selectedMCQ
    ? rawData.filter(
        x =>
          x.question === selectedMCQ.question &&
          x.QuestionType?.toLowerCase() === 'multiple choice',
      )
    : [];

  // ─────────────────────────────────────────────
  // RENDER CARD
  // ─────────────────────────────────────────────
  const renderItem = ({item}) => (
    <ExitInterviewCard
      item={item}
      status={status}
      onPress={handleRowPress}
      isRTL={isRTL}
    />
  );

  const filteredData = getFilteredData();

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <ActionPaneContainer
      pageTitle="Exit Interview"
      showFooter
      isHeaderActive
      onBackPress={() => navigation.goBack()}
      onRefresh={handleRefresh}
      showFilterPills={data.length > 0}
      filterPills={visiblePills}
      activeFilter={activeFilter}
      onFilterChange={setActiveFilter}
      filterCounts={getFilterCounts()}
      showPageTitleRow
      showSearchBar
      onSearchChange={handleSearch}
      onSortChange={handleSort}
      activeSortOrder={sortOrder}>
      {/* Processing overlay (saving) */}
      {isSaving && (
        <View style={styles.DLP_ProcessingOverlay}>
          <View style={styles.DLP_ProcessingContainer}>
            <ActivityIndicator size="large" color={P.primaryStrong} />
            <Text style={styles.DLP_ProcessingText}>Saving…</Text>
          </View>
        </View>
      )}

      {/* Status banner – only when closed and has data */}
      {!loading && status !== 'open' && data.length > 0 && (
        <View style={styles.statusMessage}>
          <Text style={styles.statusMessageText}>
            The questions are in review.
          </Text>
        </View>
      )}

      {/* Main content */}
      {loading ? (
        <View style={styles.DLP_LoadingContainer}>
          <CustomIndicator />
        </View>
      ) : filteredData.length > 0 ? (
        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={(item, index) =>
            item.question?.toString() || index.toString()
          }
          contentContainerStyle={styles.DLP_ListContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
          }
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.DLP_NoDataContainer}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
          }>
          {searchQuery.trim() ? (
            <Text style={styles.DLP_NoDataSubText}>
              No questions match "{searchQuery}"
            </Text>
          ) : data.length === 0 ? (
            <>
              <Text style={styles.DLP_NoDataText}>No questions assigned</Text>
              <Text style={styles.DLP_NoDataSubText}>
                No exit interview questions found for this employee.
              </Text>
            </>
          ) : (
            <Text style={styles.DLP_NoDataText}>
              {`No ${activeFilter} questions found.`}
            </Text>
          )}
        </ScrollView>
      )}

      {/* ── Simple answer pane ── */}
      {selectedQuestion && status === 'open' && (
        <View style={styles.card}>
          <Text style={styles.title}>Your Answer</Text>
          <Text style={styles.question}>
            {selectedQuestion.questionDescription}
          </Text>
          <TextInput
            style={styles.input}
            value={answer}
            onChangeText={setAnswer}
            multiline
            placeholder="Type your answer here…"
          />
          <View style={styles.EI_BtnRow}>
            <TouchableOpacity
              style={[styles.saveBtn, styles.EI_CancelBtn]}
              onPress={() => {
                setSelectedQuestion(null);
                setAnswer('');
              }}>
              <Text style={[styles.btnText, {color: '#555'}]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveSimple}>
              <Text style={styles.btnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── MCQ answer pane ── */}
      {selectedMCQ && status === 'open' && (
        <View style={styles.card}>
          <Text style={styles.title}>Multiple Choice</Text>
          <Text style={styles.question}>{selectedMCQ.questionDescription}</Text>

          {mcqOptions.map((opt, index) => {
            const isSelected = selectedOption.includes(opt.mcqDescription);
            return (
              <TouchableOpacity
                key={index}
                style={[styles.optionRow, isSelected && styles.selectedOption]}
                onPress={() => setSelectedOption([opt.mcqDescription])}>
                <View style={styles.checkboxContainer}>
                  <View
                    style={[styles.checkbox, isSelected && styles.checkedBox]}
                  />
                  <Text style={styles.optionText}>{opt.mcqDescription}</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          <View style={styles.EI_BtnRow}>
            <TouchableOpacity
              style={[styles.saveBtn, styles.EI_CancelBtn]}
              onPress={() => {
                setSelectedMCQ(null);
                setSelectedOption([]);
              }}>
              <Text style={[styles.btnText, {color: '#555'}]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveMCQ}>
              <Text style={styles.btnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Alert modal */}
      <AlertModal
        visible={alertModal}
        heading="Alert"
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />
    </ActionPaneContainer>
  );
};

export default HRExitInterviewListPage;
