import React, {useState, useCallback} from 'react';
import {
  FlatList,
  View,
  RefreshControl,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';

import ActionPaneContainer from '../../components/ActionPaneContainer';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';

import {retrieveEmployeeQuestionsWithMCQs} from '../../API/Exit Interview/retrieveEmployeeQuestionsWithMCQs';
import {updateExitInterview} from '../../API/Exit Interview/UpdateExitInterview';
import styles from '../../styles/styles';

const HRExitInterviewListPage = () => {
  const [data, setData] = useState([]);
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [answer, setAnswer] = useState('');

  const [selectedMCQ, setSelectedMCQ] = useState(null);
  const [selectedOption, setSelectedOption] = useState([]);

  const [status, setStatus] = useState(''); // 🔹 Interview status

  // 🔹 FETCH DATA
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await retrieveEmployeeQuestionsWithMCQs({
        employeeId: '000074',
      });

      setRawData(res || []);

      if (res && res.length > 0) {
        // ✅ Get status from API (assuming it's same for all rows)
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
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  // 🔹 HANDLE ROW CLICK
  const handleRowPress = item => {
    if (status !== 'open') return; // ❌ Block if status not open

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

  // 🔥 SAVE SIMPLE ANSWER
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
      console.log('Save Error:', e);
      Alert.alert('Error', 'Failed to save');
    }
  };

  // 🔥 SAVE MCQ ANSWER
  const handleSaveMCQ = async () => {
    if (selectedOption.length === 0) {
      Alert.alert('Validation', 'Please select option');
      return;
    }

    try {
      const finalAnswer = selectedOption[0];
      await updateExitInterview({
        questionRecId: selectedMCQ.question,
        answer: finalAnswer,
      });

      Alert.alert('Success', 'Answer saved');
      setSelectedMCQ(null);
      setSelectedOption([]);
      fetchData();
    } catch (e) {
      console.log('MCQ Save Error:', e);
      Alert.alert('Error', 'Failed to save');
    }
  };

  return (
    <ActionPaneContainer pageTitle="Exit Interview">
      {/* STATUS MESSAGE */}
      {status !== 'open' && (
        <View style={styles.statusMessage}>
          <Text style={styles.statusMessageText}>
            The questions are in review.
          </Text>
        </View>
      )}

      {/* HEADER */}
      <View style={styles.headerRow}>
        <View style={styles.typeContainer}>
          <Text style={styles.headerText}>Type</Text>
        </View>
        <View style={styles.questionContainer}>
          <Text style={styles.headerText}>Question</Text>
        </View>
      </View>

      {/* LIST */}
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

      {/* SIMPLE CARD */}
      {selectedQuestion && (
        <View style={styles.card}>
          <Text style={styles.title}>Answer</Text>

          <Text style={styles.question}>
            {selectedQuestion.questionDescription}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Write your answer..."
            value={answer}
            onChangeText={setAnswer}
            multiline
            editable={status === 'open'}
          />

          {status === 'open' && (
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveSimple}>
              <Text style={styles.btnText}>Save</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* MCQ CARD */}
      {selectedMCQ && (
        <View style={styles.card}>
          <Text style={styles.title}>Multiple Choice</Text>

          {mcqOptions.map((opt, index) => {
            const isSelected = selectedOption.includes(opt.mcqDescription);
            return (
              <TouchableOpacity
                key={index}
                style={[styles.optionRow, isSelected && styles.selectedOption]}
                onPress={() =>
                  status === 'open' && setSelectedOption([opt.mcqDescription])
                }
                disabled={status !== 'open'}>
                <View style={styles.checkboxContainer}>
                  <View
                    style={[styles.checkbox, isSelected && styles.checkedBox]}
                  />
                  <Text style={styles.optionText}>{opt.mcqDescription}</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {status === 'open' && (
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveMCQ}>
              <Text style={styles.btnText}>Save</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ActionPaneContainer>
  );
};

// const styles = StyleSheet.create({
//   headerRow: {
//     flexDirection: 'row',
//     backgroundColor: '#f1f3f6',
//     padding: 12,
//   },

//   headerText: {fontWeight: 'bold'},

//   touchable: {margin: 8},

//   row: {
//     flexDirection: 'row',
//     backgroundColor: '#fff',
//     padding: 12,
//     borderRadius: 8,
//     elevation: 2,
//   },

//   typeContainer: {flex: 1},
//   questionContainer: {flex: 2},

//   typeText: {color: '#555'},
//   questionText: {color: '#222'},

//   card: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     backgroundColor: '#fff',
//     padding: 20,
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     elevation: 10,
//   },

//   title: {fontSize: 16, fontWeight: 'bold', marginBottom: 10},
//   question: {marginBottom: 10},

//   input: {
//     borderWidth: 1,
//     borderColor: '#ccc',
//     padding: 10,
//     borderRadius: 8,
//     minHeight: 100,
//   },

//   saveBtn: {
//     marginTop: 15,
//     backgroundColor: '#007bff',
//     padding: 12,
//     borderRadius: 8,
//     alignItems: 'center',
//   },

//   btnText: {color: '#fff', fontWeight: 'bold'},

//   optionRow: {
//     padding: 12,
//     borderWidth: 1,
//     borderColor: '#ccc',
//     borderRadius: 8,
//     marginTop: 8,
//   },

//   selectedOption: {
//     backgroundColor: '#d0ebff',
//     borderColor: '#007bff',
//   },

//   checkboxContainer: {flexDirection: 'row', alignItems: 'center'},

//   checkbox: {
//     width: 18,
//     height: 18,
//     borderWidth: 2,
//     borderColor: '#999',
//     marginRight: 10,
//   },

//   checkedBox: {
//     backgroundColor: '#007bff',
//     borderColor: '#007bff',
//   },

//   optionText: {fontSize: 14},

//   // 🔹 Status message
//   statusMessage: {
//     backgroundColor: '#fff3cd',
//     padding: 12,
//     margin: 8,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: '#ffeeba',
//   },
//   statusMessageText: {
//     color: '#856404',
//     fontWeight: 'bold',
//     textAlign: 'center',
//   },
// });

export default HRExitInterviewListPage;
