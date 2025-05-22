/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect, useContext} from 'react';
import {View, Text, StyleSheet, FlatList} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {UserContext} from '../../context/UserContext';

import {AlertModal} from '../../components/Leaves/AlertModal';
import RefreshHeader from '../../components/PageHeader/RefreshHeader';
import {RetrieveEmployeeReportToMe} from '../../API/WorkerAssignedToMe/RetrieveEmployeeReportToMe';
import AssignedWorkerCard from '../../components/WorkerAssigned/AssignedWorkerCard';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
// import {FindByEmployeeId} from '../../API/PREmploymentInformation/FindByEmployeeId';
// import {ProfilePicture} from '../../API/ProfilePicture/ProfilePicture';

const WorkerAssignedToMe = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [teamData, setTeamData] = useState([]);

  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const navigation = useNavigation();
  const {userData} = useContext(UserContext);

  useEffect(() => {
    const fetchEmployeeReportToMe = async () => {
      if (userData.employeeId) {
        setIsLoading(true);
        try {
          const myTeamData = await RetrieveEmployeeReportToMe({
            employeeId: userData.employeeId,
          });

          // Get this foem above retrieve data and then show all of it in one state
          // Filter or whatever
          // Correct this and tell me if I could use this
          //   const myEmployeeData = await FindByEmployeeId({
          //     employeeId: myTeamData.EmployeId,
          //   });

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

  useEffect(() => {
    const headerOptions = RefreshHeader({
      onGoBack: handleGoBack,
      onRefresh: handleRefresh,
    });
    navigation.setOptions(headerOptions);
  }, [navigation]);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const refreshTeamData = await RetrieveEmployeeReportToMe({
        employeeId: userData.employeeId,
      });

      setTeamData(refreshTeamData);
    } catch (error) {
      setAlertMessage('Failed to fetch data.');
      setAlertModal(true);
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
    />
  );

  return (
    <View style={styles.container}>
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
    </View>
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
    color: 'black',
  },
});

export default WorkerAssignedToMe;
