import React, {useState, useEffect, useContext, useCallback} from 'react';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {styles} from '../../styles/WorkItemsAssignToMe';
import {hp, wp} from '../../constants/Size';
import {retrieveByEmail} from '../../API/WorkflowTrackingStatusTable/retrieveByEmail';
import AlertModal from '../../components/Leaves/AlertModal';
import {UserContext} from '../../context/UserContext';
import {reject} from '../../API/WorkflowTrackingStatusTable/reject';
import {approve} from '../../API/WorkflowTrackingStatusTable/approve';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
const {height, width} = Dimensions.get('window');

const WorkItemAssignedToMe = () => {
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null); // Track which row is being processed
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const navigation = useNavigation();
  const {userData} = useContext(UserContext);

  useFocusEffect(
    useCallback(() => {
      fetchTableData(); // Fetch data whenever the screen is focused
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  useEffect(() => {
    naviSetting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const naviSetting = () => {
    navigation.setOptions({
      // eslint-disable-next-line react/no-unstable-nested-components
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          // eslint-disable-next-line react-native/no-inline-styles
          style={{
            width: wp(9),
            alignItems: 'center',
            height: hp(6),
            justifyContent: 'center',
            marginLeft: width * 0.03,
          }}>
          <Icon name="arrow-left" size={20} color="white" />
        </TouchableOpacity>
      ),
      // eslint-disable-next-line react/no-unstable-nested-components
      headerRight: () => (
        <TouchableOpacity
          onPress={fetchTableData}
          style={{marginRight: width * 0.05}}>
          <Icon name="refresh" size={20} color="white" />
        </TouchableOpacity>
      ),
      headerStyle: {
        backgroundColor: '#FFA500',
        // height: Platform.OS === 'ios' ? height * 0.13 : height * 0.09,
      },
      headerTintColor: '#fff',
      headerTitleAlign: 'center',
      headerTitleStyle: {
        fontSize: hp(2.3),
        color: 'white',
      },
    });
  };

  const fetchTableData = async () => {
    try {
      setLoading(true);
      const data = await retrieveByEmail({email: userData.email});
      const formattedData = data.map((item, index) => ({
        id: index,
        document: item.Document,
        documentType: item.DocumentType,
        correlationId: item.CorrelationId,
        additionalDetails: `Additional details for ${item.Document}`,
      }));
      setTableData(formattedData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async correlationId => {
    try {
      setProcessingId(correlationId);
      const response = await reject({correlationId});
      if (response.success) {
        setAlertMessage(
          `Successfully rejected the request with Correlation ID: ${correlationId}`,
        );
        await fetchTableData(); // Refresh table data after successful rejection
      } else {
        setAlertMessage(
          `Failed to reject the request with Correlation ID: ${correlationId}`,
        );
      }
    } catch (error) {
      console.error('Rejection Error:', error);
      setAlertMessage(
        `An error occurred while rejecting the request: ${error.message}`,
      );
    } finally {
      setProcessingId(null);
      setAlertModal(true);
    }
  };

  const handleApprove = async correlationId => {
    try {
      setProcessingId(correlationId);
      const response = await approve({correlationId});

      setAlertMessage(
        `Successfully approved the request with Correlation ID: ${correlationId}`,
      );
      await fetchTableData(); // Refresh table data after successful approval
    } catch (error) {
      console.error('Approval Error:', error);
      setAlertMessage(
        `An error occurred while approving the request: ${error.message}`,
      );
    } finally {
      setProcessingId(null);
      setAlertModal(true);
    }
  };

  const handleExpandPress = id => {
    setExpandedItemId(expandedItemId === id ? null : id);
  };

  const renderRow = ({item}) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => handleExpandPress(item.id)}>
      <View style={styles.rowContent}>
        <Text style={styles.text}>{item.document}</Text>
        <Text style={styles.text}>{item.documentType}</Text>

        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => handleExpandPress(item.id)}>
          <Icon
            name={expandedItemId === item.id ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="orange"
          />
        </TouchableOpacity>
      </View>

      {expandedItemId === item.id && (
        <View style={styles.expandedSection}>
          <Text style={styles.expandedText}>{item.additionalDetails}</Text>

          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.button, {backgroundColor: '#4CAF50'}]}
              onPress={() => handleApprove(item.correlationId)}
              disabled={processingId === item.correlationId}>
              {processingId === item.correlationId ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.buttonText}>Approve</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, {backgroundColor: '#ff4c4c'}]}
              onPress={() => handleReject(item.correlationId)}
              disabled={processingId === item.correlationId}>
              {processingId === item.correlationId ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.buttonText}>Reject</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.headerText}>Document</Text>
      <Text style={styles.headerText}>Document Type</Text>
      <Text style={styles.headerText}>Action</Text>
    </View>
  );
  return (
    <View style={styles.container}>
      {renderHeader()}
      {loading ? (
        // <ActivityIndicator
        //   size="large"
        //   color="#FF6B00"
        //   style={styles.loading}
        // />
        <CustomIndicator />
      ) : (
        <FlatList
          data={tableData}
          keyExtractor={item => item.id.toString()}
          renderItem={renderRow}
        />
      )}

      {/* <AlertModal
        visible={alertModal}
        heading="Alert"
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      /> */}
    </View>
  );
};
export default WorkItemAssignedToMe;
