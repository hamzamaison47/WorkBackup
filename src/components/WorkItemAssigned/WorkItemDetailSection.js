import React, {useState} from 'react';
import {View, Text, StyleSheet, Button} from 'react-native';
import {AlertModal} from '../Leaves/AlertModal';
import {approve} from '../../API/WorkflowTrackingStatusTable/approve';
import {reject} from '../../API/WorkflowTrackingStatusTable/reject';

// const WorkItemDetailSection = ({
//   detailData,
//   correlationId,
//   dataType,
//   refreshPage,
// }) => {
//   const [alertModal, setAlertModal] = useState(false);
//   const [alertMessage, setAlertMessage] = useState('');

//   const renderDetails = () => {
//     if (!detailData || detailData.length === 0) {
//       return <Text style={styles.cardTextHeading}>No Details Available</Text>;
//     }
//     return <Text style={styles.cardTextHeading}>Details</Text>;
//   };

//   const fetchApproveRequest = async id => {
//     try {
//       const response = await approve({correlationId: id});
//       console.log('Approve request Successful:', response);
//       setAlertMessage('Request Approved Successfully.');
//       setAlertModal(true);
//     } catch (error) {
//       console.error('Failed to Approve Request:', error);
//       setAlertMessage('Failed to Approve Request.');
//       setAlertModal(true);
//     }
//   };

//   const fetchRejectRequest = async id => {
//     try {
//       const response = await reject({correlationId: id});
//       console.log('Reject request successful:', response);
//       setAlertMessage('Request Rejected Successfully.');
//       setAlertModal(true);
//     } catch (error) {
//       console.error('Failed to Reject Request:', error);
//       setAlertMessage('Failed to Reject Request.');
//       setAlertModal(true);
//     }
//   };

//   const dataMappings = {
//     leave: [
//       {label: 'Employee Name', field: 'EmployeeName'},
//       {label: 'Leave Code', field: 'LeaveCode'},
//       {label: 'Start Date', field: 'LeaveStartDate'},
//       {label: 'End Date', field: 'LeaveEndDate'},
//       {label: 'Balance', field: 'Balance'},
//       {label: 'Leave Days', field: 'LeaveDays'},
//       {label: 'Reason', field: 'Reason'},
//     ],
//     eos: [
//       {label: 'Employee Name', field: 'EmployeeName'},
//       {label: 'Notice Period Code', field: 'NoticePeriodCode'},
//       {label: 'Notification Date', field: 'EOSNotificationDate'},
//       {label: 'Last Working Date Requested', field: 'LastWorkingDate_Actual'},
//       {label: 'Last Working Date Planned', field: 'LastWorkingDate_Calculated'},
//       {label: 'EOS Reason Code', field: 'EOSReasonCode'},
//       {label: 'Remarks', field: 'Remarks'},
//     ],
//     advance: [
//       {label: 'Employee Name', field: 'EmployeeName'},
//       {label: 'Advance Type Code', field: 'AdvanceTypeCode'},
//       {label: 'Payment Date', field: 'RequestedPaymentDate'},
//       {label: 'Advance Amount', field: 'AdvanceAmount'},
//       {label: 'Recovery Start Date', field: 'RecoveryStartDate'},
//       {label: 'Recovery Amount', field: 'RequestedInstallmentAmount'},
//       {label: 'Recoveries', field: 'RequestedInstallments'},
//       {label: 'Description', field: 'AdvanceDescription'},
//     ],
//   };

//   const mapping = dataMappings[dataType] || [];
//   const detail = detailData && detailData.length > 0 ? detailData[0] : {};

//   return (
//     <View style={styles.detailsContainer}>
//       {renderDetails()}

//       {detailData && detailData.length > 0 && (
//         <View style={styles.detailsContainerBorder}>
//           {mapping.map(({label, field}) => (
//             <View key={field} style={styles.textContainer}>
//               <Text style={styles.cardTextHeading}>{label}:</Text>
//               <Text style={styles.cardText}>
//                 {field.includes('Date')
//                   ? detail[field]
//                     ? new Date(detail[field]).toLocaleDateString()
//                     : 'N/A'
//                   : detail[field] || 'N/A'}
//               </Text>
//             </View>
//           ))}

//           <View style={styles.buttonContainer}>
//             <Button
//               title="Approve"
//               color="#FFA500"
//               onPress={async () => {
//                 try {
//                   fetchApproveRequest(correlationId);
//                   refreshPage();
//                 } catch (error) {
//                   console.error('Error during approval or refresh:', error);
//                 }
//               }}
//             />
//             <Button
//               title="Reject"
//               color="#D62828"
//               // onPress={() => fetchRejectRequest(correlationId)}
//               onPress={async () => {
//                 try {
//                   fetchRejectRequest(correlationId);
//                   refreshPage();
//                 } catch (error) {
//                   console.error('Error during reject or refresh:', error);
//                 }
//               }}
//             />
//           </View>
//         </View>
//       )}

//       {/* AlertModal to show errors */}
//       {alertModal && (
//         <AlertModal
//           visible={alertModal}
//           heading="Alert"
//           text={alertMessage}
//           onPress={() => setAlertModal(false)}
//         />
//       )}
//     </View>
//   );
// };

const WorkItemDetailSection = ({
  detailData,
  correlationId,
  dataType,
  // refreshPage,
}) => {
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  // const [isLoading, setIsLoading] = useState(false); // New state for button loading
  const [isProcessing, setIsProcessing] = useState(false);

  const formattedId = correlationId.toUpperCase();
  // const formattedId = correlationId.replace(/-/g, '').toUpperCase();
  // const formattedIdsss = correlationId.replace(/-/g, '');
  // var formattedId = formattedIdsss.replace(
  //   /(.{8})(.{4})(.{4})(.{4})(.{12})/,
  //   '$1-$2-$3-$4-$5',
  // ); //boom!

  const renderDetails = () => {
    if (!detailData || detailData.length === 0) {
      return <Text style={styles.cardTextHeading}>No Details Available</Text>;
    }
    return <Text style={styles.cardTextHeading}>Details</Text>;
  };

  // const fetchApproveRequest = async id => {
  //   try {
  //     const response = await approve({correlationId: id});
  //     console.log('Approve request Successful:', response);
  //     setAlertMessage('Request Approved Successfully.');
  //     setAlertModal(true);
  //   } catch (error) {
  //     console.error('Failed to Approve Request:', error);
  //     setAlertMessage('Failed to Approve Request.');
  //     setAlertModal(true);
  //   }
  // };

  // const fetchRejectRequest = async id => {
  //   try {
  //     const response = await reject({correlationId: id});
  //     console.log('Reject request Successful:', response);
  //     setAlertMessage('Request Rejected Successfully.');
  //     setAlertModal(true);
  //   } catch (error) {
  //     console.error('Failed to Reject Request:', error);
  //     setAlertMessage('Failed to Reject Request.');
  //     setAlertModal(true);
  //   }
  // };
  const fetchRejectRequest = async id => {
    setIsProcessing(true); // Disable buttons
    try {
      const response = await reject({CorrelationId: id});
      console.log('Reject request successful:', response);

      if (response.IsSuccess) {
        setAlertMessage('Request Rejected Successfully.');
      } else {
        setAlertMessage(response.Message || 'Failed to Reject Request.');
      }
    } catch (error) {
      console.error('Failed to Reject Request:', error);
      setAlertMessage('Failed to Reject Request due to a system error.');
    } finally {
      setAlertModal(true);
      // setIsProcessing(false); // Enable buttons again if needed
      // refreshPage(); // Refresh after processing
    }
  };

  const fetchApproveRequest = async id => {
    setIsProcessing(true); // Disable buttons
    try {
      const response = await approve({CorrelationId: id});
      console.log('Approve request successful:', response);

      if (response.IsSuccess) {
        setAlertMessage('Request Approved Successfully.');
      } else {
        setAlertMessage(response.Message || 'Failed to Approve Request.');
      }
    } catch (error) {
      console.error('Failed to Approve Request:', error);
      setAlertMessage('Failed to Approve Request due to a system error.');
    } finally {
      setAlertModal(true);
      // setIsProcessing(false); // Enable buttons again if needed
      // refreshPage(); // Refresh after processing
    }
  };

  // const handleButtonClick = async action => {
  //   setIsLoading(true); // Disable buttons
  //   if (action === 'approve') {
  //     await fetchApproveRequest(correlationId);
  //   } else if (action === 'reject') {
  //     await fetchRejectRequest(correlationId);
  //   }
  //   await refreshPage(); // Wait for page refresh to complete
  //   setIsLoading(false); // Re-enable buttons after refresh
  // };

  const dataMappings = {
    leave: [
      {label: 'Employee Name', field: 'EmployeeName'},
      {label: 'Leave Code', field: 'LeaveCode'},
      {label: 'Start Date', field: 'LeaveStartDate'},
      {label: 'End Date', field: 'LeaveEndDate'},
      {label: 'Balance', field: 'Balance'},
      {label: 'Leave Days', field: 'LeaveDays'},
      {label: 'Reason', field: 'Reason'},
    ],
    eos: [
      {label: 'Employee Name', field: 'EmployeeName'},
      {label: 'Notice Period Code', field: 'NoticePeriodCode'},
      {label: 'Notification Date', field: 'EOSNotificationDate'},
      {label: 'Last Working Date Requested', field: 'LastWorkingDate_Actual'},
      {label: 'Last Working Date Planned', field: 'LastWorkingDate_Calculated'},
      {label: 'EOS Reason Code', field: 'EOSReasonCode'},
      {label: 'Remarks', field: 'Remarks'},
    ],
    advance: [
      {label: 'Employee Name', field: 'EmployeeName'},
      {label: 'Advance Type Code', field: 'AdvanceTypeCode'},
      {label: 'Payment Date', field: 'RequestedPaymentDate'},
      {label: 'Advance Amount', field: 'AdvanceAmount'},
      {label: 'Recovery Start Date', field: 'RecoveryStartDate'},
      {label: 'Recovery Amount', field: 'RequestedInstallmentAmount'},
      {label: 'Recoveries', field: 'RequestedInstallments'},
      {label: 'Description', field: 'AdvanceDescription'},
    ],
  };

  const mapping = dataMappings[dataType] || [];
  const detail = detailData && detailData.length > 0 ? detailData[0] : {};
  console.log('correlationId-0-0-0-0-0-0-0-0-', correlationId);
  console.log('formattedId-0-0-0-0-0-0-0-0-0-', formattedId);

  return (
    <View style={styles.detailsContainer}>
      {renderDetails()}

      {detailData && detailData.length > 0 && (
        <View style={styles.detailsContainerBorder}>
          {mapping.map(({label, field}) => (
            <View key={field} style={styles.textContainer}>
              <Text style={styles.cardTextHeading}>{label}:</Text>
              <Text style={styles.cardText}>
                {field.includes('Date')
                  ? detail[field]
                    ? new Date(detail[field]).toLocaleDateString()
                    : 'N/A'
                  : detail[field] || 'N/A'}
              </Text>
            </View>
          ))}

          <View style={styles.buttonContainer}>
            <Button
              title="Approve"
              color="#FFA500"
              disabled={isProcessing}
              onPress={async () => {
                await fetchApproveRequest(formattedId);
              }}
            />
            <Button
              title="Reject"
              color="#D62828"
              disabled={isProcessing}
              onPress={async () => {
                await fetchRejectRequest(formattedId);
              }}
            />
          </View>
        </View>
      )}

      {/* AlertModal to show errors */}
      {alertModal && (
        <AlertModal
          visible={alertModal}
          heading="Alert"
          text={alertMessage}
          onPress={() => setAlertModal(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  detailsContainer: {
    padding: 10,
    marginTop: 10,
    backgroundColor: '#ffffff',
    borderRadius: 5,
    elevation: 2,
    paddingHorizontal: 15,
  },
  detailsContainerBorder: {
    padding: 10,
    marginTop: 10,
    backgroundColor: '#fffcf7',
    borderRadius: 5,
    elevation: 3,
  },
  textContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTextHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  cardText: {
    fontSize: 14,
    color: '#555',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
});

export default WorkItemDetailSection;
