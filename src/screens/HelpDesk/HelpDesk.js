import React, {useState, useEffect, useContext} from 'react';
import {View, Text, StyleSheet, FlatList} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {UserContext} from '../../context/UserContext';

import {AlertModal} from '../../components/Leaves/AlertModal';
import PageHeader from '../../components/PageHeader/PageHeader';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import EndOfServiceCard from '../../components/EOS/EndOfServiceCard';
import EOSModal from '../../components/EOS/EOSModal';

import {DeleteServiceRequest} from '../../API/EOS/DeleteServiceRequest';
import {Create} from '../../API/EOS/Create';
import {Update} from '../../API/EOS/Update';
import {SubmitRequest} from '../../API/EOS/SubmitRequest';
import TabNavigator from '../../Navigation/TabNavigator';
import {ESSHelpDeskRetrieveAll} from '../../API/HelpDesk/ESSHelpDeskRetrieveAll';

const HelpDesk = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [serviceData, setServiceData] = useState([]);

  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedLeave, setSelectedLeave] = useState(null);

  const navigation = useNavigation();
  const {userData} = useContext(UserContext);

  useEffect(() => {
    const fetchhelp = async () => {
      if (userData.employeeId) {
        setIsLoading(true);
        try {
          const helpDeskData = await ESSHelpDeskRetrieveAll();
          console.log('I am here');
          setServiceData(helpDeskData);
        } catch (error) {
          setAlertMessage('Failed to Fetch Data.');
          setAlertModal(true);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchhelp();
  }, [userData.employeeId]);

  // useEffect(() => {
  //   if (userData.employeeId) {
  //     ESSHelpDeskRetrieveAll(userData.employeeId);
  //   }
  // }, [userData.employeeId]);

  useEffect(() => {
    // Set header options using PageHeaderComponent
    const headerOptions = PageHeader({
      onGoBack: handleGoBack,
      onRefresh: handleRefresh,
      // OnNewRecord: () => handleOpenModal('create'),
    });
    navigation.setOptions(headerOptions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation]);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const helpDeskData = await ESSHelpDeskRetrieveAll();
      console.log('I Believe i can fly', helpDeskData);
      setServiceData(helpDeskData);
    } catch (error) {
      setAlertMessage('Failed in Fetch Data.', error);
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <CustomIndicator />
      ) : serviceData.length > 0 ? (
        <FlatList
          data={serviceData}
          // renderItem={renderLeavesCard}
          keyExtractor={(item, index) => index.toString()}
          // eslint-disable-next-line react-native/no-inline-styles
          contentContainerStyle={{flexGrow: 1}}
        />
      ) : (
        <Text style={styles.mainTxt}>No Data Found</Text>
      )}
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
    // fontSize: 16,

    fontSize: 18,
    fontWeight: 'bold',
    color: '#cccccc',
  },
});

export default HelpDesk;
