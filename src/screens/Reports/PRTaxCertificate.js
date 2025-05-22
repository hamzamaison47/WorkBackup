import React, {useState, useContext, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {PREmailTaxCertificate} from '../../API/Reports/PREmailTaxCertificate';
import PopupDialog from 'react-native-popup-dialog';
import {useTheme} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import {useRoute, useNavigation} from '@react-navigation/native';
import {UserContext} from '../../context/UserContext';
import Icon from 'react-native-vector-icons/FontAwesome';
import {hp, wp} from '../../constants/Size';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import logo from '../../assets/cloud.png';

const {height, width} = Dimensions.get('window');

const PRTaxCertificate = () => {
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const {colors} = useTheme();
  const route = useRoute();
  const navigation = useNavigation();
  const {employeeId} = route.params || {};
  const {userData} = useContext(UserContext);

  // Replacing componentWillReceiveProps with useEffect to handle prop updates
  useEffect(() => {
    if (employeeId || userData?.employeeId) {
      // Any logic that should run when employeeId or userData changes
    }
  }, [employeeId, userData]);

  useEffect(() => {
    naviSetting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation]);

  const onPressButton = async () => {
    setLoading(true);
    await sendTaxCertificate(userData.employeeId, startDate, endDate);
  };

  const sendTaxCertificate = async (employeeId, startDate, endDate) => {
    try {
      const response = await PREmailTaxCertificate({
        employeeId: employeeId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      setDialogMessage('Your Tax Certificate has been successfully emailed.');
    } catch (error) {
      console.error(error);
      setDialogMessage('There was an error sending the Tax Certificate.');
    } finally {
      setLoading(false);
      setDialogVisible(true);
    }
  };

  const naviSetting = () => {
    navigation.setOptions({
      // headerLeft: () => (
      //   <TouchableOpacity
      //     onPress={() => navigation.goBack()}
      //     style={styles.headerLeftButton}>
      //     <Icon name="arrow-left" size={16} color="white" />
      //   </TouchableOpacity>
      // ),
      headerTitle: () => {
        '';
      },
      // eslint-disable-next-line react/no-unstable-nested-components
      headerLeft: () => (
        <View style={styles.rightSideView}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.leftSide}>
            <Icon name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
          <Image source={logo} style={styles.headerImage} />
        </View>
      ),
      headerStyle: {
        backgroundColor: '#FFA500',
        height: Platform.OS === 'ios' ? height * 0.13 : height * 0.09,
      },
      headerTintColor: '#fff',
      headerTitleAlign: 'center',
      headerTitleStyle: {
        fontSize: hp(2.5),
        fontWeight: 'bold',
        color: '#fff',
      },
    });
  };

  const onStartDateChange = (event, selectedDate) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const onEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  return (
    <View style={styles.container}>
      <Icon name="file-pdf-o" size={60} color="#FF6B00" style={styles.icon} />
      <Text style={styles.screenTitle}>Request Tax Certificate</Text>
      <Text style={styles.instructions}>
        Please select the start and end date for the period you want the tax
        certificate.
      </Text>

      <TouchableOpacity
        onPress={() => setShowStartDatePicker(true)}
        style={styles.datePickerButton}>
        <Text style={styles.datePickerText}>
          Start Date: {startDate.toDateString()}
        </Text>
      </TouchableOpacity>
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={onStartDateChange}
        />
      )}

      <TouchableOpacity
        onPress={() => setShowEndDatePicker(true)}
        style={styles.datePickerButton}>
        <Text style={styles.datePickerText}>
          End Date: {endDate.toDateString()}
        </Text>
      </TouchableOpacity>
      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={onEndDateChange}
        />
      )}

      {loading ? (
        // <ActivityIndicator size="large" color="#FF6B00" />
        <CustomIndicator />
      ) : (
        <LinearGradient colors={['#FFA500', '#FF8C00']} style={styles.button}>
          <TouchableOpacity
            onPress={onPressButton}
            style={styles.buttonContent}>
            <Text style={styles.buttonText}>Send Tax Certificate</Text>
          </TouchableOpacity>
        </LinearGradient>
      )}

      <PopupDialog
        visible={dialogVisible}
        onTouchOutside={() => setDialogVisible(false)}
        dialogStyle={styles.dialogContainer}
        width={0.8}
        height={0.3}
        dialogTitle={<Text style={styles.dialogTitle}>Notification</Text>}>
        <View style={styles.dialogContent}>
          <Text style={styles.dialogMessage}>{dialogMessage}</Text>
          <TouchableOpacity
            style={styles.dialogButton}
            onPress={() => setDialogVisible(false)}>
            <Text style={styles.dialogButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </PopupDialog>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f7f7f7',
  },
  headerLeftButton: {
    width: wp(10),
    alignItems: 'center',
    height: hp(4),
    justifyContent: 'center',
    marginLeft: width * 0.03,
  },
  icon: {
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  instructions: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    marginBottom: 15,
    width: '100%',
    alignItems: 'center',
  },
  datePickerText: {
    fontSize: 16,
    color: '#333',
  },
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 25,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  buttonContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dialogContainer: {
    borderRadius: 10,
    padding: 15,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  dialogContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  dialogButton: {
    backgroundColor: '#FF6B00',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  dialogButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rightSideView: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: wp(3), // Adjusted margin
  },
  leftSide: {
    width: wp(9),
    alignItems: 'center',
    height: hp(6),
    justifyContent: 'center',
    marginRight: 9,
    marginLeft: 5,
  },
  headerImage: {
    width: 100,
    height: 40,
  },
});

export default PRTaxCertificate;
