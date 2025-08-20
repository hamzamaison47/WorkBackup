/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect} from 'react';
import {Text, FlatList, RefreshControl} from 'react-native';
import {useSelector} from 'react-redux';

import {RetrieveEmployeeReportToMe} from '../../API/WorkerAssignedToMe/RetrieveEmployeeReportToMe';

import {AlertModal} from '../../components/Alert/AlertModal';
import AssignedWorkerCard from '../../components/WorkerAssigned/AssignedWorkerCard';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import {styles} from '../../styles/styles';

const WorkerAssignedToMe = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [teamData, setTeamData] = useState([]);

  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const {userData} = useSelector(state => state.user);

  useEffect(() => {
    const fetchEmployeeReportToMe = async () => {
      if (userData.employeeId) {
        setIsLoading(true);
        try {
          const myTeamData = await RetrieveEmployeeReportToMe({
            employeeId: userData.employeeId,
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
      isHeaderActive={true}
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
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
          }
        />
      ) : (
        <Text style={styles.Team_MainTxt}>No Data Found</Text>
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

export default WorkerAssignedToMe;
