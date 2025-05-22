// /* eslint-disable react-native/no-inline-styles */
// /* eslint-disable eqeqeq */
// /* eslint-disable no-unused-vars */
// /* eslint-disable react-hooks/exhaustive-deps */
// import React, {useState, useEffect, useContext} from 'react';
// import {View, Text, StyleSheet, FlatList} from 'react-native';
// import {useNavigation} from '@react-navigation/native';
// import {UserContext} from '../../context/UserContext';
// import {AlertModal} from '../../components/Leaves/AlertModal';
// import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
// import PageHeader from '../../components/PageHeader/PageHeader';
// import {RetrieveAdvancesRequest} from '../../API/Advance/RetrieveAdvancesRequest';
// import {RetrieveAdvanceType} from '../../API/Advance/RetrieveAdvanceType';
// import {AdvanceCard} from '../../components/Advance/AdvanceCard';
// import {DeleteAdvanceRequest} from '../../API/Advance/DeleteAdvanceRequest';

// const AdvanceSalary = () => {
//   const [isLoading, setIsLoading] = useState(false);
//   const [advanceData, setAdvanceData] = useState([]);

//   const [isModalVisible, setIsModalVisible] = useState(false);
//   const [modalMode, setModalMode] = useState('create');
//   const [selectedAdvance, setSelectedAdvance] = useState(null);

//   const [alertModal, setAlertModal] = useState(false);
//   const [alertMessage, setAlertMessage] = useState('');

//   const navigation = useNavigation();
//   const {userData} = useContext(UserContext);

//   // Shows record on loading screen automatically
//   useEffect(() => {
//     fetchAdvances();
//   }, []);

//   useEffect(() => {
//     const headerOptions = PageHeader({
//       onGoBack: handleGoBack,
//       onRefresh: handleRefresh,
//       OnNewRecord: () => handleOpenModal('create'),
//     });
//     navigation.setOptions(headerOptions);
//   }, [navigation, handleGoBack, handleRefresh]);

//   const getStatusLabel = status => {
//     switch (status) {
//       case 0:
//         return 'Draft';
//       case 1:
//         return 'Approved';
//       case 2:
//         return 'Cancelled';
//       case 3:
//         return 'Rejected';
//       case 4:
//         return 'Submitted';
//       case 5:
//         return 'Change Request';
//       case 6:
//         return 'Pending Cancellation';
//       case 7:
//         return 'Retured';
//       case 8:
//         return 'Pending Approval';
//       case 9:
//         return 'Pending Complete';
//       case 10:
//         return 'Workflow Completed';
//       case 11:
//         return 'Completed';
//       case 12:
//         return 'Failed';
//       default:
//         return 'Pending Complete';
//     }
//   };

//   const handleGoBack = () => {
//     navigation.goBack();
//   };

//   const fetchAdvances = async () => {
//     setIsLoading(true);
//     try {
//       const advances = await RetrieveAdvancesRequest();
//       const typeCode = await RetrieveAdvanceType();

//       const filteredTypeCode = typeCode.filter(type => type.AdvanceType === 1);

//       const validAdvanceTypeCodes = filteredTypeCode.map(
//         type => type.AdvanceTypeCode,
//       );

//       const filteredAdvanceData = advances.filter(
//         advance =>
//           advance.EmployeeId === userData.WorkerRecId &&
//           validAdvanceTypeCodes.includes(advance.AdvanceTypeCode),
//       );

//       setAdvanceData(filteredAdvanceData);
//     } catch (error) {
//       console.error('Error fetching advances:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleOpenModal = (mode, advancesData = null) => {
//     if (mode === 'create') {
//       advancesData = {
//         RecId: userData.WorkerRecId,
//         EmployeeId: userData.employeeId,
//         EmployeeName: userData.employeeName,
//       };
//     }
//     setModalMode(mode);
//     setSelectedAdvance(advancesData);
//     setIsModalVisible(true);
//   };

//   const handleRefresh = async () => {
//     setIsLoading(true);
//     try {
//       const refreshAdvance = await RetrieveAdvancesRequest();
//       const typeCode = await RetrieveAdvanceType();

//       const filteredTypeCode = typeCode.filter(type => type.AdvanceType === 1);

//       const validAdvanceTypeCodes = filteredTypeCode.map(
//         type => type.AdvanceTypeCode,
//       );

//       const filteredAdvanceData = refreshAdvance.filter(
//         advance =>
//           advance.EmployeeId === userData.WorkerRecId &&
//           validAdvanceTypeCodes.includes(advance.AdvanceTypeCode),
//       );

//       setAdvanceData(filteredAdvanceData);
//     } catch (error) {
//       console.error('Failed to fetch data:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleDeleteAdvance = async recId => {
//     try {
//       const response = await DeleteAdvanceRequest({recordsRecId: [recId]});
//       if (response[0].IsSuccess == true) {
//         setAlertMessage('Advance Salary Request Deleted Successfully.');
//         setAlertModal(true);
//         const updatedAdvanceData = advanceData.filter(
//           advance => advance.recId !== recId,
//         );
//         setAdvanceData(updatedAdvanceData);
//       } else {
//         setAlertMessage('Unable to Delete Advance Salary Request.');
//         setAlertModal(true);
//       }
//     } catch (error) {
//       console.log('Error', error);
//       setAlertMessage('Error occur while deleting Advance Salary Request');
//       setAlertModal(true);
//     } finally {
//       handleRefresh();
//     }
//   };

//   const renderAdvanceCard = ({item}) => (
//     <AdvanceCard
//       RecId={item.RecId}
//       EmployeeId={item.EmployeeId}
//       AdvanceTypeCode={item.AdvanceTypeCode}
//       AdvanceAmount={item.AdvanceAmount}
//       PaymentDate={item.RequestedPaymentDate}
//       RecoveryStartDate={item.RecoveryStartDate}
//       RequestedInstallmentAmount={item.RequestedInstallmentAmount}
//       RequestedInstallments={item.RequestedInstallments}
//       RequestDate={item.RequestDate}
//       AdvanceDescription={item.AdvanceDescription}
//       AdvanceRequestId={item.AdvanceRequestId}
//       WFStatus={getStatusLabel(item.WFStatus)}
//       onPress={
//         item.WFStatus === 0
//           ? () =>
//               handleOpenModal('edit', {
//                 RecId: item.RecId,
//                 EmployeeId: item.EmployeeId,
//                 EmployeeName: item.EmployeeName,
//                 AdvanceTypeCode: item.AdvanceTypeCode,
//                 AdvanceAmount: item.AdvanceAmount,
//                 PaymentDate: item.RequestedPaymentDate,
//                 RecoveryStartDate: item.RecoveryStartDate,
//                 RequestedInstallmentAmount: item.RequestedInstallmentAmount,
//                 RequestedInstallments: item.RequestedInstallments,
//                 RequestDate: item.RequestDate,
//                 AdvanceDescription: item.AdvanceDescription,
//                 AdvanceRequestId: item.AdvanceRequestId,
//               })
//           : null
//       }
//       onDelete={
//         item.WFStatus === 0 ? () => handleDeleteAdvance(item.RecId) : null
//       }
//     />
//   );

//   return (
//     <View style={styles.container}>
//       {isLoading ? (
//         <CustomIndicator />
//       ) : advanceData.length > 0 ? (
//         <FlatList
//           data={advanceData}
//           renderItem={renderAdvanceCard}
//           keyExtractor={(item, index) => index.toString()}
//           contentContainerStyle={{flexGrow: 1}}
//         />
//       ) : (
//         <Text style={styles.mainTxt}>No Data Found</Text>
//       )}

//       <AlertModal
//         visible={alertModal}
//         heading="Alert"
//         text={alertMessage}
//         onPress={() => setAlertModal(false)}
//       />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   listContainer: {
//     flexGrow: 1,
//   },
//   indicator: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//   },
//   mainTxt: {
//     flex: 1,
//     textAlign: 'center',
//     textAlignVertical: 'center',
//     fontSize: 16,

//     fontWeight: 'bold',
//     color: '#cccccc',
//   },
// });

// export default AdvanceSalary;

import React from 'react';
import GenericAdvanceScreen from './GenericAdvanceScreen';

const AdvanceSalary = () => {
  return <GenericAdvanceScreen advanceType={1} screenName="Advance Salary" />;
};

export default AdvanceSalary;
