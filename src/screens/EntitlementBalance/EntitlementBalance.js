/* eslint-disable curly */
/* eslint-disable react-native/no-inline-styles */
import React, {useState, useCallback} from 'react';
import {Text, FlatList, StyleSheet} from 'react-native';
import {useSelector} from 'react-redux';
import {useNavigation, useFocusEffect} from '@react-navigation/native';

import {RetrieveEntitlementBalanceRequest} from '../../API/EntitlementBalance/RetrieveEntitlementBalanceRequest';

import {AlertModal} from '../../components/Alert/AlertModal';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import EntitlementCards from '../../components/EntitlementBalance/EntitlementCards';

const EntitlementBalance = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [allEntitlementData, setAllEntitlementData] = useState([]);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const navigation = useNavigation();
  const {userData} = useSelector(state => state.user);

  // Fetch entitlement data
  const fetchEntitlementData = useCallback(async () => {
    if (!userData?.employeeId) return;

    setIsLoading(true);
    try {
      const myEntitlementData = await RetrieveEntitlementBalanceRequest({
        employeeId: userData.employeeId,
      });

      const filteredEntitlementData = myEntitlementData.filter(
        e => e.EmployeeId === userData.employeeId,
      );

      setAllEntitlementData(filteredEntitlementData);
    } catch (error) {
      console.error('Failed to fetch entitlement data:', error);
      setAlertMessage('Failed to fetch data.');
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  }, [userData?.employeeId]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchEntitlementData();
    }, [fetchEntitlementData]),
  );

  // Handle back navigation
  const handleGoBack = () => navigation.goBack();

  // Handle refresh
  const handleRefresh = () => fetchEntitlementData();

  const renderEntitlementCard = ({item}) => (
    <EntitlementCards
      employeeName={item.EmployeeName}
      entitlementCode={item.EntitlementCode}
      payGroupCode={item.PayGroupCode}
      taken={item.Taken}
      accrued={item.Accrued}
      balance={item.Balance}
    />
  );

  return (
    <ActionPaneContainer
      pageTitle="Entitlement Balance"
      isBackButton
      showFooter
      showFloatingButton={false}
      isHeaderActive
      onBackPress={handleGoBack}
      onRefresh={handleRefresh}>
      {isLoading ? (
        <CustomIndicator />
      ) : allEntitlementData.length > 0 ? (
        <FlatList
          data={allEntitlementData}
          renderItem={renderEntitlementCard}
          keyExtractor={(item, index) =>
            item.RecId?.toString() ||
            item.EntitlementCode?.toString() ||
            index.toString()
          }
          contentContainerStyle={{flexGrow: 1}}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <Text style={styles.noDataText}>No Data Found</Text>
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
  noDataText: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#cccccc',
  },
});

export default EntitlementBalance;
