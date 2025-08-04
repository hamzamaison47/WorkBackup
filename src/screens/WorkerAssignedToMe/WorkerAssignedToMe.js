/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect} from 'react';
import {Text, StyleSheet, FlatList} from 'react-native';
import {useSelector} from 'react-redux';

import {RetrieveEmployeeReportToMe} from '../../API/WorkerAssignedToMe/RetrieveEmployeeReportToMe';

import {AlertModal} from '../../components/Alert/AlertModal';
import AssignedWorkerCard from '../../components/WorkerAssigned/AssignedWorkerCard';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../components/ActionPaneContainer';

const WorkerAssignedToMe = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [teamData, setTeamData] = useState([]);

  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const {selectedLegalEntity, defaultLegalEntity} = useSelector(
    state => state.company,
  );
  const {userData} = useSelector(state => state.user);
  const companyToUse = selectedLegalEntity || defaultLegalEntity;

  useEffect(() => {
    const fetchEmployeeReportToMe = async () => {
      if (userData.employeeId) {
        setIsLoading(true);
        try {
          const myTeamData = await RetrieveEmployeeReportToMe({
            employeeId: userData.employeeId,
            defaultCompany: companyToUse,
          });

          setTeamData(myTeamData);
        } catch (error) {
          setAlertMessage('Failed to Fetch Data.');
          setAlertModal(true);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchEmployeeReportToMe();
  }, [userData.employeeId]);

  const handleRefresh = async () => {
    setIsLoading(true);

    try {
      // clearFormData();

      const myTeamData = await RetrieveEmployeeReportToMe({
        employeeId: userData.employeeId,
        defaultCompany: companyToUse,
      });

      setTeamData(myTeamData);
    } catch (error) {
      console.error('Error in My Team Record Screen', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderTeamCard = ({item}) => (
    <AssignedWorkerCard
      employeeId={item.EmployeId}
      employeeName={item.Name}
      defaultCompany={companyToUse}
      departmentName={item.DepartmentName}
      email={item.Email}
      positionId={item.PositionId}
      positionDescription={item.PositionDescription}
      workerRecId={userData.WorkerRecId}
    />
  );

  return (
    <ActionPaneContainer
      pageTitle="My Team"
      isBackButton={false}
      showFooter={false}
      showFloatingButton={false}
      onRefresh={handleRefresh}>
      {/* Show loading indicator when isLoading is true */}
      {isLoading ? (
        <CustomIndicator />
      ) : teamData.length > 0 ? (
        <FlatList
          data={teamData}
          renderItem={renderTeamCard}
          keyExtractor={(item, index) => index.toString()}
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
    </ActionPaneContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mainTxt: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#9f9f9fff',
  },
});

export default WorkerAssignedToMe;
