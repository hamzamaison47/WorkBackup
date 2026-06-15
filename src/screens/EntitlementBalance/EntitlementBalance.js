// /* eslint-disable curly */
// /* eslint-disable react-native/no-inline-styles */
// import React, {useState, useCallback} from 'react';
// import {Text, FlatList, RefreshControl, ScrollView} from 'react-native';
// import {useSelector} from 'react-redux';
// import {useNavigation, useFocusEffect} from '@react-navigation/native';

// import {RetrieveEntitlementBalanceRequest} from '../../API/EntitlementBalance/RetrieveEntitlementBalanceRequest';

// import AlertModal from '../../components/Alert/AlertModal';
// import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
// import ActionPaneContainer from '../../components/ActionPaneContainer';
// import EntitlementCards from '../../components/EntitlementBalance/EntitlementCards';

// import styles from '../../styles/styles';

// const EntitlementBalance = () => {
//   const [isLoading, setIsLoading] = useState(false);
//   const [allEntitlementData, setAllEntitlementData] = useState([]);
//   const [alertModal, setAlertModal] = useState(false);
//   const [alertMessage, setAlertMessage] = useState('');

//   const navigation = useNavigation();
//   const {userData} = useSelector(state => state.user);
//   // const {menuItems} = useSelector(state => state.menuItem);

//   // Fetch entitlement data
//   const fetchEntitlementData = useCallback(async () => {
//     if (!userData?.employeeId) return;

//     setIsLoading(true);
//     try {
//       const myEntitlementData = await RetrieveEntitlementBalanceRequest({
//         employeeId: userData.employeeId,
//       });

//       const filteredEntitlementData = myEntitlementData.filter(
//         e => e.EmployeeId === userData.employeeId,
//       );

//       setAllEntitlementData(filteredEntitlementData);
//     } catch (error) {
//       console.error('Failed to fetch entitlement data:', error);
//       setAlertMessage('Failed to fetch data.');
//       setAlertModal(true);
//     } finally {
//       setIsLoading(false);
//     }
//   }, [userData?.employeeId]);

//   // Refresh data when screen comes into focus
//   useFocusEffect(
//     useCallback(() => {
//       fetchEntitlementData();
//     }, [fetchEntitlementData]),
//   );

//   // Handle back navigation
//   const handleGoBack = () => navigation.goBack();

//   // Handle refresh
//   const handleRefresh = () => fetchEntitlementData();
//   const renderEntitlementCard = ({item}) => (
//     <EntitlementCards
//       employeeName={item.EmployeeName}
//       entitlementCode={item.EntitlementCode}
//       payGroupCode={item.PayGroupCode}
//       taken={item.Taken}
//       accrued={item.Accrued}
//       balance={item.Balance}
//     />
//   );

//   return (
//     <ActionPaneContainer
//       pageTitle="Leave Balance"
//       showFooter
//       showFloatingButton={false}
//       isHeaderActive
//       onBackPress={handleGoBack}
//       onRefresh={handleRefresh}>
//       {isLoading ? (
//         <CustomIndicator />
//       ) : allEntitlementData.length > 0 ? (
//         <FlatList
//           data={allEntitlementData}
//           renderItem={renderEntitlementCard}
//           keyExtractor={(item, index) =>
//             item.RecId?.toString() ||
//             item.EntitlementCode?.toString() ||
//             index.toString()
//           }
//           contentContainerStyle={{flexGrow: 1}}
//           showsVerticalScrollIndicator={false}
//           refreshControl={
//             <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
//           }
//         />
//       ) : (
//         <ScrollView
//           contentContainerStyle={{flexGrow: 1}}
//           refreshControl={
//             <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
//           }>
//           <Text style={styles.EntBal_NoDataText}>No Data Found</Text>
//         </ScrollView>
//       )}

//       <AlertModal
//         visible={alertModal}
//         heading="Alert"
//         text={alertMessage}
//         onPress={() => setAlertModal(false)}
//       />
//     </ActionPaneContainer>
//   );
// };

// export default EntitlementBalance;
/* eslint-disable curly */

import React, {useState, useCallback} from 'react';
import {Text, FlatList, RefreshControl, ScrollView} from 'react-native';
import {useSelector} from 'react-redux';
import {useNavigation, useFocusEffect} from '@react-navigation/native';

import {RetrieveEntitlementBalanceRequest} from '../../API/EntitlementBalance/RetrieveEntitlementBalanceRequest';

import AlertModal from '../../components/Alert/AlertModal';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import DynamicRequestCard from '../../components/DynamicRequestCard';

import styles from '../../styles/styles';

const EntitlementBalance = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [allEntitlementData, setAllEntitlementData] = useState([]);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const navigation = useNavigation();
  const {userData} = useSelector(state => state.user);
  const [searchQuery, setSearchQuery] = useState('');
  const [rawData, setRawData] = useState([]);
  const [displayData, setDisplayData] = useState([]);

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
      setRawData(filteredEntitlementData);
      setDisplayData(filteredEntitlementData);

      setAllEntitlementData(filteredEntitlementData);
    } catch (error) {
      console.error('Failed to fetch entitlement data:', error);
      setAlertMessage('Failed to fetch data.');
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  }, [userData?.employeeId]);

  useFocusEffect(
    useCallback(() => {
      fetchEntitlementData();
    }, [fetchEntitlementData]),
  );

  const handleGoBack = () => navigation.goBack();
  const handleRefresh = () => fetchEntitlementData();

  // ── Card Config ──
  const cardConfig = {
    headerConfig: {
      title: {key: 'EntitlementCode', label: 'Entitlement'},
      subtitle: {key: 'PayGroupCode'},
    },
    fields: [
      {key: 'EmployeeName', label: 'Employee', type: 'text'},
      {key: 'Accrued', label: 'Accrued', type: 'text'},
      {key: 'Taken', label: 'Taken', type: 'text'},
      {key: 'Balance', label: 'Balance', type: 'text'},
    ],
  };

  const handleSearch = query => {
    setSearchQuery(query);
    if (!query.trim()) {
      setDisplayData(rawData);
    } else {
      const q = query.toLowerCase();
      setDisplayData(
        rawData.filter(item =>
          Object.values(item).some(val =>
            String(val ?? '')
              .toLowerCase()
              .includes(q),
          ),
        ),
      );
    }
  };

  const renderEntitlementCard = ({item}) => (
    <DynamicRequestCard
      data={item}
      headerConfig={cardConfig.headerConfig}
      fields={cardConfig.fields}
      buttons={{}}
      onButtonPress={() => {}}
      processingButtons={[]}
      isExpandable
      gradientColors={['#e0f2fe', '#bae6fd', '#dbeafe']}
      showNavigationArrow={false}
      searchQuery={searchQuery}
    />
  );

  return (
    <ActionPaneContainer
      pageTitle="Leave Balance"
      showFooter
      showFloatingButton={false}
      isHeaderActive
      onBackPress={handleGoBack}
      onRefresh={handleRefresh}
      showPageTitleRow={true}
      showSearchBar={true}
      onSearchChange={handleSearch}>
      {isLoading ? (
        <CustomIndicator />
      ) : displayData.length > 0 ? (
        <FlatList
          data={displayData}
          renderItem={renderEntitlementCard}
          keyExtractor={(item, index) =>
            item.RecId?.toString() ||
            item.EntitlementCode?.toString() ||
            index.toString()
          }
          contentContainerStyle={styles.DLP_ListContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
          }
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.DLP_NoDataContainer}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
          }>
          {searchQuery.trim() ? (
            <>
              {/* <Text style={styles.DLP_NoDataText}>No results found</Text> */}
              <Text style={styles.DLP_NoDataSubText}>
                No records match "{searchQuery}"
              </Text>
            </>
          ) : (
            <Text style={styles.DLP_NoDataText}>No Data Found</Text>
          )}
        </ScrollView>
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

export default EntitlementBalance;
