// /* eslint-disable react-native/no-inline-styles */
// /* eslint-disable eqeqeq */
// /* eslint-disable no-shadow */
// /* eslint-disable react-hooks/exhaustive-deps */
// import React, {useState, useEffect, useContext} from 'react';
// import {View, FlatList, StyleSheet, Text} from 'react-native';
// import {useNavigation} from '@react-navigation/native';
// import {UserContext} from '../../context/UserContext';
// import {RetrieveAdvancesRequest} from '../../API/Advance/RetrieveAdvancesRequest';
// import {DeleteAdvanceRequest} from '../../API/Advance/DeleteAdvanceRequest';

// import PageHeader from '../../components/PageHeader/PageHeader';
// import LoanModal from '../../components/Advance/LoanModal';
// import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
// import {AdvanceCard} from '../../components/Advance/AdvanceCard';
// import {AlertModal} from '../../components/Leaves/AlertModal';
// import {CreateAdvanceRequest} from '../../API/Advance/CreateAdvanceRequest';
// import {SubmitAdvanceRecord} from '../../API/Advance/SubmitAdvanceRecord';
// import {UpdateAdvanceRecord} from '../../API/Advance/UpdateAdvanceRecord';
// import {RetrieveAdvanceType} from '../../API/Advance/RetrieveAdvanceType';

// const LoanRequest = () => {
//   const [isLoading, setIsLoading] = useState(false);
//   const [modalKey, setModalKey] = useState(0);
//   const [advanceData, setAdvanceData] = useState([]);

//   const [isModalVisible, setIsModalVisible] = useState(false);
//   const [modalMode, setModalMode] = useState('create');
//   const [selectedLoan, setSelectedLoan] = useState(null);

//   const [alertModal, setAlertModal] = useState(false);
//   const [alertMessage, setAlertMessage] = useState('');

//   const navigation = useNavigation();
//   const {userData} = useContext(UserContext);

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

//   const handleCloseModal = () => {
//     setIsModalVisible(false);
//     setModalKey(prev => prev + 1);
//   };

//   const handleGoBack = () => {
//     navigation.goBack();
//   };

//   const handleRefresh = async () => {
//     setIsLoading(true);
//     try {
//       const refreshAdvance = await RetrieveAdvancesRequest();
//       const typeCode = await RetrieveAdvanceType();

//       const filteredTypeCode = typeCode.filter(type => type.AdvanceType === 0);

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

//   const handleOpenModal = (mode, loanData = null) => {
//     if (mode === 'create') {
//       loanData = {
//         RecId: userData.WorkerRecId,
//         EmployeeId: userData.employeeId,
//         EmployeeName: userData.employeeName,
//       };
//     }
//     setModalMode(mode);
//     setSelectedLoan(loanData);
//     setIsModalVisible(true);
//   };

//   const handleDeleteLoan = async recId => {
//     try {
//       const response = await DeleteAdvanceRequest({recordsRecId: [recId]});
//       if (response[0].IsSuccess == true) {
//         setAlertMessage('Loan Request Deleted Successfully.');
//         setAlertModal(true);
//         const updatedLoanData = advanceData.filter(
//           advance => advance.recId !== recId,
//         );
//         setAdvanceData(updatedLoanData);
//       } else {
//         setAlertMessage('Unable to Delete Loan Request.');
//         setAlertModal(true);
//       }
//     } catch (error) {
//       console.log('Error', error);
//       setAlertMessage('Error occur while deleting Loan Request');
//       setAlertModal(true);
//     } finally {
//       handleRefresh();
//     }
//   };

//   const fetchAdvances = async () => {
//     setIsLoading(true);
//     try {
//       const advances = await RetrieveAdvancesRequest();
//       const typeCode = await RetrieveAdvanceType();

//       const filteredTypeCode = typeCode.filter(type => type.AdvanceType === 0);

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

//   const handleAction = async (actionType, modalMode, data = {}) => {
//     try {
//       const formattedLoanReqDate = `${
//         new Date().toISOString().split('T')[0]
//       }T12:00:00`;

//       // Validation of advance Type Code, Advance Amount, and Payment Date
//       if (!data.AdvanceTypeCode) {
//         setAlertMessage('Advance Type Code is Required');
//         setAlertModal(true);
//         return false;
//       } else if (data.AdvanceAmount === '') {
//         setAlertMessage('Advance Amount is Required');
//         setAlertModal(true);
//         return false;
//       } else if (
//         !data.PaymentDate &&
//         isNaN(new Date(data.PaymentDate).getTime())
//       ) {
//         setAlertMessage('Missing Payment Date');
//         setAlertModal(true);
//         return false;
//       }

//       // console.log('data================', data);

//       const loanData = {
//         RecId: data.RecId,
//         EmployeeId: Number(userData.WorkerRecId),
//         RequestDate: formattedLoanReqDate,
//         AdvanceRequestId: data.AdvanceRequestId,
//         AdvanceDescription: data.AdvanceDescription,
//         AdvanceTypeCode: data.AdvanceTypeCode,
//         AdvanceAmount: Number(data.AdvanceAmount.replace(/,/g, '')),
//         RequestedPaymentDate: data.PaymentDate,
//         RecoveryStartDate: data.RecoveryStartDate,
//         RequestedInstallmentAmount: Number(
//           (data.RequestedInstallmentAmount || '0').toString().replace(/,/g, ''),
//         ),
//         RequestedInstallments: Number(
//           (data.RequestedInstallments || '0').toString().replace(/,/g, ''),
//         ),
//       };

//       // console.log('loanData============', loanData);

//       let response;

//       // API Call Logic
//       if (modalMode.toLowerCase() === 'create'.toLowerCase()) {
//         response = await CreateAdvanceRequest(loanData);
//         if (
//           response.IsSuccess &&
//           actionType.toLowerCase() === 'submit'.toLowerCase()
//         ) {
//           const submitResponse = await SubmitAdvanceRecord({
//             recId: response.RecId,
//           });
//           if (!submitResponse) {
//             setAlertMessage('Failed to Submit Loan Request.');
//             setAlertModal(true);
//             return false;
//           }
//         }
//       } else {
//         response = await UpdateAdvanceRecord(loanData);
//         if (
//           response.IsSuccess &&
//           actionType.toLowerCase() === 'submit'.toLowerCase()
//         ) {
//           const submitResponse = await SubmitAdvanceRecord({recId: data.RecId});
//           if (!submitResponse) {
//             setAlertMessage('Failed to Submit Loan Request.');
//             setAlertModal(true);
//             return false;
//           }
//         }
//       }

//       // Success or Error Messages
//       if (response.IsSuccess) {
//         const successMessage =
//           modalMode.toLowerCase() === 'create'.toLowerCase()
//             ? actionType.toLowerCase() === 'save'.toLowerCase()
//               ? 'Loan Request Created Successfully.'
//               : 'Loan Request Created and Submitted Successfully.'
//             : actionType.toLowerCase() === 'save'.toLowerCase()
//             ? 'Loan Request Updated Successfully.'
//             : 'Loan Request Updated and Submitted Successfully.';
//         setAlertMessage(successMessage);
//         return true;
//       } else {
//         setAlertMessage(response.Message || 'Operation Failed.');
//         return false;
//       }
//     } catch (error) {
//       setAlertMessage('An error occurred while processing the request.');
//       console.error(error);
//       return false;
//     } finally {
//       setAlertModal(true);
//       handleRefresh();
//     }
//   };

//   const renderLoanCard = ({item}) => (
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
//       onDelete={item.WFStatus === 0 ? () => handleDeleteLoan(item.RecId) : null}
//     />
//   );

//   return (
//     <View style={styles.container}>
//       {isLoading ? (
//         <CustomIndicator />
//       ) : advanceData.length > 0 ? (
//         <FlatList
//           data={advanceData}
//           renderItem={renderLoanCard}
//           keyExtractor={(item, index) => index.toString()}
//           contentContainerStyle={{flexGrow: 1}}
//         />
//       ) : (
//         <Text style={styles.mainTxt}>No Data Found</Text>
//       )}

//       <LoanModal
//         key={modalKey}
//         visible={isModalVisible}
//         onClose={handleCloseModal}
//         mode={modalMode.toLowerCase()}
//         onAction={handleAction}
//         userData={userData}
//         advancesData={selectedLoan}
//       />

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
//     backgroundColor: '#FAFAFA',
//   },
//   item: {
//     backgroundColor: '#fff',
//     padding: 15,
//     marginVertical: 8,
//     borderRadius: 8,
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: 2},
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   itemText: {
//     fontSize: 16,
//   },
//   mainTxt: {
//     flex: 1,
//     textAlign: 'center',
//     textAlignVertical: 'center',
//     // fontSize: 16,

//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#cccccc',
//   },
// });

// export default LoanRequest;

import React from 'react';
import GenericAdvanceScreen from './GenericAdvanceScreen';

const LoanRequest = () => {
  return <GenericAdvanceScreen advanceType={0} screenName="Loan" />;
};

export default LoanRequest;
