import React, {useState, useEffect, useContext} from 'react';
import {View, Text, StyleSheet, FlatList} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {UserContext} from '../../context/UserContext';
import {AlertModal} from '../../components/Leaves/AlertModal';
import {getEntitlementBalances} from '../../Controller/EntitlementRequestApiService';
import EntitlementCards from '../../components/Entitlement/EntitlementCards';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import RefreshHeader from '../../components/PageHeader/RefreshHeader';

const EntitlementBalance = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [allEntitlementData, setAllEntitlementData] = useState([]);

  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const navigation = useNavigation();
  const {userData} = useContext(UserContext);

  // Shows record on loading screen automatically
  useEffect(() => {
    const fetchEntitlementData = async () => {
      if (userData.employeeId) {
        setIsLoading(true);
        try {
          const entitlementData = await getEntitlementBalances(
            userData.employeeId,
          );

          const filteredEntitlementData = entitlementData.filter(
            advance => advance.EmployeeId === userData.employeeId,
          );

          setAllEntitlementData(filteredEntitlementData);
        } catch (error) {
          setAlertMessage('Failed to fetch data.');
          setAlertModal(true);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchEntitlementData();
  }, [userData.employeeId]);

  useEffect(() => {
    // Set header options using HeaderComponent
    const headerOptions = RefreshHeader({
      onGoBack: handleGoBack,
      onRefresh: handleRefresh,
    });
    navigation.setOptions(headerOptions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation]);

  useEffect(() => {
    if (userData.employeeId) {
      getEntitlementBalances(userData.employeeId);
    }
  }, [userData.employeeId]);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const refreshEntitlement = await getEntitlementBalances(
        userData.employeeId,
      );

      const filteredEntitlementData = refreshEntitlement.filter(
        advance => advance.EmployeeId === userData.employeeId,
      );

      setAllEntitlementData(filteredEntitlementData);
    } catch (error) {
      setAlertMessage('Failed in fetch data.', error);
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const renderEntitlementCard = ({item}) => (
    <EntitlementCards
      employeeName={item.EmployeeName}
      entitlementCode={item.EntitlementCode}
      entitlementUnit={item.EntitlementUnit}
      payGroupCode={item.PayGroupCode}
      taken={item.Taken}
      accrued={item.Accrued}
      balance={item.Balance}
    />
  );

  return (
    <View style={styles.container}>
      {isLoading ? (
        <CustomIndicator />
      ) : allEntitlementData.length > 0 ? (
        <FlatList
          data={allEntitlementData}
          renderItem={renderEntitlementCard}
          keyExtractor={(item, index) => index.toString()}
          // eslint-disable-next-line react-native/no-inline-styles
          contentContainerStyle={{flexGrow: 1}}
        />
      ) : (
        <Text style={styles.mainTxt}>No Data Found</Text>
      )}

      <AlertModal
        visible={alertModal}
        heading="Alert"
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContainer: {
    flexGrow: 1,
  },
  indicator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  mainTxt: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 16,

    fontWeight: 'bold',
    color: '#cccccc',
  },
});

export default EntitlementBalance;
