import React, {useState} from 'react';
import {Text, FlatList, View, StyleSheet, I18nManager} from 'react-native';
import {useNavigation} from '@react-navigation/native';

import ActionPaneContainer from '../../components/ActionPaneContainer';
import DynamicRequestCard from '../../components/DynamicRequestCard';

const ESSOPDMedicalExpense_ListPage = () => {
  const isRTL = I18nManager.isRTL;
  const navigation = useNavigation();

  /** ✅ Dummy Data */
  const [expenseData] = useState([
    {
      recId: 1,
      patientName: 'Ali Khan',
      relation: 'Self',
      hospitalName: 'City Hospital',
      visitDate: '2024-01-10',
      doctorName: 'Dr. Ahmed',
      diagnosis: 'Fever',
      totalAmount: 2500,
      status: 'Submitted',
      remarks: 'Regular checkup',
    },
    {
      recId: 2,
      patientName: 'Sara Khan',
      relation: 'Spouse',
      hospitalName: 'Al-Shifa Clinic',
      visitDate: '2024-02-05',
      doctorName: 'Dr. Usman',
      diagnosis: 'Flu',
      totalAmount: 1800,
      status: 'Approved',
      remarks: 'Medicines included',
    },
  ]);

  /** ✅ Card Config */
  const cardConfig = {
    headerConfig: {
      title: {key: 'patientName'},
      subtitle: {key: 'hospitalName'},
    },
    fields: [
      {key: 'relation', label: 'Relation', type: 'text'},
      {key: 'visitDate', label: 'Visit Date', type: 'date'},
      {key: 'totalAmount', label: 'Total Amount', type: 'text'},
      {key: 'status', label: 'Status', type: 'text'},
    ],
    expandableFields: [
      {key: 'doctorName', label: 'Doctor Name', type: 'text'},
      {key: 'diagnosis', label: 'Diagnosis', type: 'text'},
      {key: 'remarks', label: 'Remarks', type: 'text'},
    ],
    gradientColors: ['#d4fc79', '#96e6a1', '#c2ffd8'],
    isRTL,
  };

  /** ✅ Render Card */
  const renderExpenseCard = ({item}) => {
    return (
      <DynamicRequestCard
        data={item}
        headerConfig={cardConfig.headerConfig}
        fields={cardConfig.fields}
        expandableFields={cardConfig.expandableFields}
        isExpandable={true}
        gradientColors={cardConfig.gradientColors}
        isRTL={isRTL}
      />
    );
  };

  return (
    <ActionPaneContainer
      pageTitle="OPD Medical Expenses"
      showFooter
      isHeaderActive
      showPageTitleRow
      showFloatingButton={true}
      onFloatingButtonPress={() =>
        navigation.navigate('ESSOPDMedicalExpense_SaveRecord')
      }>
      {expenseData.length > 0 ? (
        <FlatList
          data={expenseData}
          renderItem={renderExpenseCard}
          keyExtractor={(item, index) =>
            item.recId ? String(item.recId) : index.toString()
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No Records Found</Text>
        </View>
      )}
    </ActionPaneContainer>
  );
};

const styles = StyleSheet.create({
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

export default ESSOPDMedicalExpense_ListPage;
