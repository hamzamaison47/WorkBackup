import React, {useState, useCallback} from 'react';
import {
  FlatList,
  View,
  RefreshControl,
  Text,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import {useFocusEffect, useRoute} from '@react-navigation/native';
import {useSelector} from 'react-redux';

import ActionPaneContainer from '../../components/ActionPaneContainer';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';

import {retrieveEmployeeQuestionsWithMCQs} from '../../API/Exit Interview/retrieveEmployeeQuestionsWithMCQs';
import {updateExitInterview} from '../../API/Exit Interview/UpdateExitInterview';
import styles from '../../styles/styles';

const HRExitInterviewListPage = () => {
  const route = useRoute();

  // 🔹 Get employeeId from route OR Redux (same as Leave page)
  const {employeeId, userData: routeUserData} = route.params || {};
  const reduxUserData = useSelector(state => state.user.userData);

  const effectiveUserData = routeUserData || reduxUserData;
  const effectiveEmployeeId = employeeId || effectiveUserData?.employeeId;

  const [data, setData] = useState([]);
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [answer, setAnswer] = useState('');

  const [selectedMCQ, setSelectedMCQ] = useState(null);
  const [selectedOption, setSelectedOption] = useState([]);

  const [status, setStatus] = useState('');

  // 🔹 FETCH DATA
  const fetchData = useCallback(async () => {
    if (!effectiveEmployeeId) return;

    setLoading(true);
    try {
      const res = await retrieveEmployeeQuestionsWithMCQs({
        employeeId: effectiveEmployeeId, // ✅ dynamic
      });

      setRawData(res || []);

      if (res && res.length > 0) {
        setStatus(res[0].Status?.toLowerCase() || 'open');

        const filteredData = [];
        const mcqIds = new Set();

        res.forEach(item => {
          const type = item.QuestionType?.toLowerCase();

          if (type === 'multiple choice') {
            if (!mcqIds.has(item.question)) {
              filteredData.push(item);
              mcqIds.add(item.question);
            }
          } else {
            filteredData.push(item);
          }
        });

        setData(filteredData);
      } else {
        setData([]);
        setStatus('closed');
      }
    } catch (err) {
      console.log('Fetch ERROR:', err);
    } finally {
      setLoading(false);
    }
  }, [effectiveEmployeeId]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  // 🔹 HANDLE ROW CLICK
  const handleRowPress = item => {
    if (status !== 'open') return;

    const type = item.QuestionType?.toLowerCase();

    if (type === 'simple') {
      setSelectedQuestion(item);
      setSelectedMCQ(null);

      const existing = rawData.find(
        x =>
          x.question === item.question &&
          x.QuestionType?.toLowerCase() === 'simple',
      );
      setAnswer(existing?.answer || '');
    } else {
      setSelectedMCQ(item);
      setSelectedQuestion(null);

      const options = rawData.filter(
        x =>
          x.question === item.question &&
          x.QuestionType?.toLowerCase() === 'multiple choice',
      );

      const selected = options.find(x => x.answer);
      setSelectedOption(selected?.answer ? [selected.answer] : []);
    }
  };

  // 🔹 RENDER ROW
  const renderItem = ({item}) => {
    const isClickable = status === 'open';
    return (
      <TouchableOpacity
        style={[styles.touchable, !isClickable && {opacity: 0.5}]}
        onPress={() => isClickable && handleRowPress(item)}
        disabled={!isClickable}>
        <View style={styles.row}>
          <View style={styles.typeContainer}>
            <Text style={styles.typeText}>{item.QuestionType}</Text>
          </View>

          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>{item.questionDescription}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // 🔹 MCQ OPTIONS
  const mcqOptions = selectedMCQ
    ? rawData.filter(
        x =>
          x.question === selectedMCQ.question &&
          x.QuestionType?.toLowerCase() === 'multiple choice',
      )
    : [];

  // 🔥 SAVE SIMPLE
  const handleSaveSimple = async () => {
    if (!answer.trim()) {
      Alert.alert('Validation', 'Please enter answer');
      return;
    }

    try {
      await updateExitInterview({
        questionRecId: selectedQuestion.question,
        answer: answer,
      });

      Alert.alert('Success', 'Answer saved');
      setSelectedQuestion(null);
      setAnswer('');
      fetchData();
    } catch (e) {
      Alert.alert('Error', 'Failed to save');
    }
  };

  // 🔥 SAVE MCQ
  const handleSaveMCQ = async () => {
    if (selectedOption.length === 0) {
      Alert.alert('Validation', 'Please select option');
      return;
    }

    try {
      await updateExitInterview({
        questionRecId: selectedMCQ.question,
        answer: selectedOption[0],
      });

      Alert.alert('Success', 'Answer saved');
      setSelectedMCQ(null);
      setSelectedOption([]);
      fetchData();
    } catch (e) {
      Alert.alert('Error', 'Failed to save');
    }
  };

  return (
    <ActionPaneContainer pageTitle="Exit Interview">
      {status !== 'open' && (
        <View style={styles.statusMessage}>
          <Text style={styles.statusMessageText}>
            The questions are in review.
          </Text>
        </View>
      )}

      <View style={styles.headerRow}>
        <View style={styles.typeContainer}>
          <Text style={styles.headerText}>Type</Text>
        </View>
        <View style={styles.questionContainer}>
          <Text style={styles.headerText}>Question</Text>
        </View>
      </View>

      {loading ? (
        <CustomIndicator />
      ) : (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item, index) =>
            item.question?.toString() || index.toString()
          }
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchData} />
          }
          contentContainerStyle={{paddingBottom: 150}}
        />
      )}

      {/* SIMPLE */}
      {selectedQuestion && (
        <View style={styles.card}>
          <Text style={styles.title}>Answer</Text>

          <Text style={styles.question}>
            {selectedQuestion.questionDescription}
          </Text>

          <TextInput
            style={styles.input}
            value={answer}
            onChangeText={setAnswer}
            multiline
          />

          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveSimple}>
            <Text style={styles.btnText}>Save</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* MCQ */}
      {selectedMCQ && (
        <View style={styles.card}>
          <Text style={styles.title}>Multiple Choice</Text>

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

          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveMCQ}>
            <Text style={styles.btnText}>Save</Text>
          </TouchableOpacity>
        </View>
      )}
    </ActionPaneContainer>
  );
};

export default HRExitInterviewListPage;
