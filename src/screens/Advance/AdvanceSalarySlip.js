/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect, useContext} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  FlatList,
  Image,
} from 'react-native';
import {UserContext} from '../../context/UserContext';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {Calendar} from 'react-native-calendars';
import Icon from 'react-native-vector-icons/FontAwesome';
import FilterIcon from 'react-native-vector-icons/Entypo';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import CalendarIcon from 'react-native-vector-icons/FontAwesome5';
import {hp, wp} from '../../constants/Size';
import {Dropdown} from 'react-native-element-dropdown';
import {AdvanceCard} from '../../components/Advance/AdvanceCard';
import {AlertModal, AlertDeleteModal} from '../../components/Leaves/AlertModal';
import {
  fetchAdvances,
  getPayGroupPayPeriod,
  retrieveAdvanceTypeCode,
} from '../../Controller/AdvanceRequestApiService';
import {CreateAdvanceRequest} from '../../API/Advance/CreateAdvanceRequest';
import {RetrieveAdvancesRequest} from '../../API/Advance/RetrieveAdvancesRequest';
import {DeleteAdvanceRequest} from '../../API/Advance/DeleteAdvanceRequest';
import {UpdateAdvanceRecord} from '../../API/Advance/UpdateAdvanceRecord';
import {SubmitAdvanceRecord} from '../../API/Advance/SubmitAdvanceRecord';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import logo from '../../assets/cloud.png';

const AdvanceSalarySlip = () => {
  const [recId, setRecId] = useState(0);
  const [advanceData, setAdvanceData] = useState([]);
  const [allAdvanceData, setAllAdvanceData] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [payGroupData, setPayGroupData] = useState([]);
  const [advanceTypeCode, setAdvanceTypeCode] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [recoveryStartDate, setRecoveryStartDate] = useState(new Date());
  const [recoveryAmount, setRecoveryAmount] = useState('');
  const [recoveries, setRecoveries] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startDate, setStartDate] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [payPeriodStatus, setPayPeriodStatus] = useState('');
  const [selectedPaymentDate, setSelectedPaymentDate] = useState('');
  const [description, setDescription] = useState('');

  const [isFieldsDisabled, setIsFieldsDisabled] = useState(false);
  const [isAmountFieldsDisabled, setIsAmountFieldsDisabled] = useState(false);
  const [isDateValid, setIsDateValid] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAdvanceAmountValid, setIsAdvanceAmountValid] = useState(true);
  const [isAdvanceTypeValid, setIsAdvanceTypeValid] = useState(true);
  const [isRecoveryDateValid, setIsRecoveryDateValid] = useState(true);
  const [isPaymentDateValid, setIsPaymentDateValid] = useState(true);
  const [isAmountExceeds, setIsAmountExceeds] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [maxAdvanceAmount, setMaxAdvanceAmount] = useState(0);
  const [maxEditAdvanceAmount, setEditMaxAdvanceAmount] = useState(0);
  const [isRecoverieseValid, setIsRecoveriesValid] = useState(true);
  const [maxRecoveries, setMaxRecoveries] = useState(0);
  const [maxEditRecoveries, setMaxEditRecoveries] = useState(0);

  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [showPaymentCalendar, setShowPaymentCalendar] = useState(false);
  const [showStartCalendar, setShowStartCalendar] = useState(false);

  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // Edit Modal States
  const [selectedAdvanceData, setSelectedAdvanceData] = useState([]);
  const [editAdvanceTypeCode, setEditAdvanceTypeCode] = useState('');
  const [editablePaymentDate, setEditablePaymentDate] = useState('');
  const [editAdvanceAmount, setEditAdvanceAmount] = useState('');
  const [editRecoveryStartDate, setEditRecoveryStartDate] = useState('');
  const [editRecoveryAmount, setEditRecoveryAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editRecoveries, setEditRecoveries] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [editRequestDate, setEditRequestDate] = useState('');

  const [isDeleteConfirmationVisible, setIsDeleteConfirmationVisible] =
    useState(false);
  const [deleteRecId, setDeleteRecId] = useState(null);

  const navigation = useNavigation();
  const {userData} = useContext(UserContext);

  useFocusEffect(
    React.useCallback(() => {
      const fetchDataOnFocus = async () => {
        try {
          setIsLoading(true);

          const advances = await retrieveAdvanceTypeCode();
          // console.log('Advances', advances);
          setAdvanceData(advances);

          const payGroup = await getPayGroupPayPeriod(userData.employeeId);
          // console.log('Pay Group Pay Period', payGroup);
          setPayGroupData(payGroup);
        } catch (error) {
          console.error(error.message);
        } finally {
          setIsLoading(false);
        }
      };
      fetchDataOnFocus();
    }, [userData.employeeId]),
  );

  useEffect(() => {
    // eslint-disable-next-line no-shadow
    const fetchAdvances = async () => {
      try {
        const allAdvance = await RetrieveAdvancesRequest();
        // console.log('All Advance Data==============', allAdvance);

        const filteredAdvanceData = allAdvance.filter(
          advance => advance.EmployeeId === userData.WorkerRecId,
        );

        // console.log('UserData======================', userData);
        setAllAdvanceData(filteredAdvanceData);
      } catch (error) {
        console.error('Error fetching advance data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdvances();
  }, [userData.employeeId]);

  useEffect(() => {
    naviSetting();
  }, []);

  useEffect(() => {
    if (userData.employeeId) {
      retrieveAdvanceTypeCode();
    }
  }, [userData.employeeId]);

  useEffect(() => {
    if (userData.employeeId) {
      getPayGroupPayPeriod(userData.employeeId);
    }
  }, [userData.employeeId]);

  useEffect(() => {
    fetchPayGroupData();
  }, [userData.employeeId]);

  useEffect(() => {
    if (advanceTypeCode) {
      fetchRecoveries();
    }
  }, [advanceTypeCode]);

  useEffect(() => {
    if (editAdvanceTypeCode) {
      fetchRecoveries();
    }
  }, [editAdvanceTypeCode]);

  const dropdownData = Array.from(
    new Set(advanceData.map(item => item.AdvanceTypeCode)),
  ).map(code => ({
    label: code,
    value: code,
  }));

  const dropdownDataEdit = Array.from(
    new Set(advanceData.map(item => item.AdvanceTypeCode)),
  ).map(code => ({
    label: code,
    value: code,
  }));

  const handleButtonPressStart = () => {
    setShowStartCalendar(true);
  };

  const validateAdvanceAmount = () => {
    if (!advanceAmount) {
      setIsAdvanceAmountValid(false);
    } else {
      setIsAdvanceAmountValid(true);
    }
  };

  const validateAdvanceTypeCode = () => {
    if (!advanceTypeCode) {
      setIsAdvanceTypeValid(false);
    } else if (!editAdvanceTypeCode) {
      setIsAdvanceTypeValid(false);
    } else {
      setIsAdvanceTypeValid(true);
    }
  };

  // Handle opening the calendar and validating today’s date
  const handleButtonPressPayment = () => {
    const today = new Date().toISOString().split('T')[0];
    validatePaymentDate(today);
    setShowPaymentCalendar(true);
  };

  // Function to map EOS Status from number to string
  const getStatusLabel = status => {
    switch (status) {
      case 0:
        return 'Draft';
      case 1:
        return 'Approved';
      case 2:
        return 'Cancelled';
      case 3:
        return 'Rejected';
      case 4:
        return 'Submitted';
      case 5:
        return 'Change Request';
      case 6:
        return 'Pending Cancellation';
      case 7:
        return 'Retured';
      case 8:
        return 'Pending Approval';
      case 9:
        return 'Pending Complete';
      case 10:
        return 'Workflow Completed';
      case 11:
        return 'Completed';
      case 12:
        return 'Failed';
      default:
        return 'Pending Complete';
    }
  };

  // Fetch data from the API and update state variables
  const fetchPayGroupData = async () => {
    try {
      const response = await getPayGroupPayPeriod(userData.employeeId);
      setPayGroupData(response);
      setEndDate(response[0].EndDate);
      setPayPeriodStatus(response[0].PayPeriodStatus);
      setStartDate(response[0].StartDate);
    } catch (error) {
      console.error('Error fetching PayGroupPayPeriod data:', error);
    }
  };

  const validatePaymentDate = date => {
    const selectedDate = new Date(date);
    const paymentEndDate = new Date(endDate);
    const paymentStartDate = new Date(startDate);

    const dayBeforeStartDate = new Date(paymentStartDate);
    dayBeforeStartDate.setDate(paymentStartDate.getDate() - 1);

    if (selectedDate >= dayBeforeStartDate && selectedDate <= paymentEndDate) {
      setIsDateValid(true);
      setIsPaymentDateValid(true);
      setRecoveryStartDate('');
    } else if (selectedPaymentDate.valueOf() === '') {
      setIsDateValid(true);
    } else {
      setIsDateValid(false);
    }

    // Additionally validate Recovery Start Date (to ensure it doesn't exceed the Payment Date)
    if (recoveryStartDate === '') {
      setIsRecoveryDateValid(true);
    } else if (recoveryStartDate < selectedPaymentDate) {
      setIsRecoveryDateValid(false);
      setRecoveryStartDate('');
    } else {
      setIsRecoveryDateValid(true);
    }
  };

  // Validation logic for Recovery Start Date
  const validateRecoveryStartDate = date => {
    const selectedRecoveryDate = new Date(date);
    const paymentDateObj = new Date(selectedPaymentDate);
    const EditablepaymentDate = new Date(editablePaymentDate);

    const beforePaymentDateObj = new Date(paymentDateObj);
    beforePaymentDateObj.setDate(paymentDateObj.getDate() - 1);

    const beforeEditablepaymentDate = new Date(EditablepaymentDate);
    beforeEditablepaymentDate.setDate(EditablepaymentDate.getDate() - 1);

    if (
      selectedRecoveryDate <= beforePaymentDateObj ||
      selectedRecoveryDate <= beforeEditablepaymentDate
    ) {
      setIsRecoveryDateValid(false);
      setIsPaymentDateValid(true);
    } else if (
      // selectedPaymentDate.valueOf() === '' ||
      editablePaymentDate.valueOf() === ''
    ) {
      setIsRecoveryDateValid(true);
      setIsPaymentDateValid(false);
      setRecoveryStartDate('');
    } else {
      setIsRecoveryDateValid(true);
      setIsPaymentDateValid(true);
    }
  };

  const checkAdvanceAmountLimit = () => {
    let copyState = [...advanceData];

    const filteredAdvances = copyState.filter(
      a => a.AdvanceTypeCode === advanceTypeCode,
    );
    const filteredEditedAdvances = copyState.filter(
      a => a.AdvanceTypeCode === editAdvanceTypeCode,
    );

    const advanceAmountNum = Number(advanceAmount.replace(/,/g, ''));
    const editAdvanceAmountNum = Number(editAdvanceAmount.replace(/,/g, ''));

    if (filteredAdvances.length > 0 || filteredEditedAdvances.length > 0) {
      const maxAdvanceAmounts = filteredAdvances[0]?.MaxAdanceAmount || 0;
      const maxEditAdvanceAmounts =
        filteredEditedAdvances[0]?.MaxAdanceAmount || 0;

      // console.log(`MaxAdvanceAmount: ${maxAdvanceAmounts}`);
      // console.log(`MaxEditAdvanceAmount: ${maxEditAdvanceAmounts}`);

      if (
        (advanceAmountNum > maxAdvanceAmounts && maxAdvanceAmounts !== 0) ||
        (editAdvanceAmountNum > maxEditAdvanceAmounts &&
          maxEditAdvanceAmounts !== 0)
      ) {
        setIsAmountExceeds(true);
        setIsAdvanceAmountValid(true);
        setMaxAdvanceAmount(maxAdvanceAmounts);
        setEditMaxAdvanceAmount(maxEditAdvanceAmounts);
      } else {
        setIsAmountExceeds(false);
        setIsAdvanceAmountValid(true);
      }
    } else {
      console.log('No advances found with the specified AdvanceTypeCode.');
    }
  };

  const toggleModal = async () => {
    const prevState = isModalVisible;

    if (prevState) {
      try {
        const advances = await retrieveAdvanceTypeCode();
        setAdvanceData(advances);
      } catch (error) {
        console.error('Error fetching Advance Type:', error);
      }
    } else {
      resetForm();
    }

    setIsModalVisible(!prevState);
  };

  const resetForm = () => {
    setAdvanceTypeCode('');
    setAdvanceAmount('');
    setSelectedPaymentDate('');
    setRecoveryStartDate('');
    setRecoveryAmount('');
    setRecoveries('');
    setIsAdvanceTypeValid(true);
    setIsAdvanceAmountValid(true);
    setIsAmountExceeds(false);
    setIsDateValid(true);
    setIsRecoveryDateValid(true);
    setIsPaymentDateValid(true);
    setDescription('');
    setIsRecoveriesValid(true);
  };

  const validateRecoveries = value => {
    try {
      let copyState = [...advanceData];
      const filteredAdvances = copyState.filter(
        a => a.AdvanceTypeCode === advanceTypeCode,
      );
      const filteredEditedAdvances = copyState.filter(
        a => a.AdvanceTypeCode === editAdvanceTypeCode,
      );

      const maxRecoverie = filteredAdvances[0]?.Recoveries || 0;
      const maxEditRecovery = filteredEditedAdvances[0]?.Recoveries || 0;

      // Check if advanceAmount is 0, which makes recoveries invalid
      if (maxRecoverie === 0 && maxEditRecovery === 0) {
        setIsRecoveriesValid(true);
        setMaxRecoveries(0);
        setMaxEditRecoveries(0);
      }
      // Check if advanceAmount is 0, which makes recoveries invalid
      else if (advanceAmount === 0) {
        setIsRecoveriesValid(false);
        setMaxRecoveries(maxRecoverie);
        setMaxEditRecoveries(maxEditRecovery);
      }
      // Check if recoveries exceed maxRecoveries or maxEditRecovery
      else if (maxRecoverie > 0 && value > maxRecoverie) {
        setIsRecoveriesValid(false);
        setMaxRecoveries(maxRecoverie);
        setMaxEditRecoveries(maxEditRecovery);
      } else if (maxEditRecovery > 0 && value > maxEditRecovery) {
        setIsRecoveriesValid(false);
        setMaxRecoveries(maxRecoverie);
        setMaxEditRecoveries(maxEditRecovery);
      }
      // Valid case where recoveries do not exceed limits
      else {
        setIsRecoveriesValid(true);
        setMaxRecoveries(maxRecoverie);
        setMaxEditRecoveries(maxEditRecovery);
      }
    } catch (error) {
      console.error('Error fetching recoveries:', error);
    }
  };

  // Function to fetch recoveries based on the advance type code
  const fetchRecoveries = async () => {
    try {
      let copyState = [...advanceData];
      const filteredAdvances = copyState.filter(
        a => a.AdvanceTypeCode === advanceTypeCode,
      );
      const editFilteredAdvances = copyState.filter(
        a => a.AdvanceTypeCode === editAdvanceTypeCode,
      );

      if (filteredAdvances.length > 0 || editFilteredAdvances.length > 0) {
        const maxRecoverie = filteredAdvances[0]?.Recoveries || 0;
        const editMaxRecoveries = filteredAdvances[0]?.Recoveries || 0;

        console.log(
          'editMaxRecoveries=====================',
          editMaxRecoveries,
        );

        if (maxRecoverie > 0) {
          setRecoveries(maxRecoverie.toString());
          setRecoveryAmount('');
          setIsFieldsDisabled(false);
          setIsAmountFieldsDisabled(true);
        } else if (editMaxRecoveries > 0) {
          setEditRecoveries(editMaxRecoveries.toString());
          setEditRecoveryAmount('');
          setIsFieldsDisabled(false);
          setIsAmountFieldsDisabled(true);
        } else {
          setRecoveries('');
          setRecoveryAmount('');
          setEditRecoveries('');
          setEditRecoveryAmount('');
          setIsFieldsDisabled(false);
          setIsAmountFieldsDisabled(false);
        }
      } else {
        setRecoveries('');
        setRecoveryAmount('');
        setEditRecoveries('');
        setEditRecoveryAmount('');
        setIsFieldsDisabled(false);
        setIsAmountFieldsDisabled(true);
      }
    } catch (error) {
      console.error('Error fetching recoveries:', error);
    }
  };

  const handleLeaveCardPress = item => {
    // Set the selected leave data
    setSelectedAdvanceData(item);
    console.log('Item============', item);

    // Set the selected RecId
    setRecId(item.RecId);

    //Set Edit Advance Type Code
    setEditAdvanceTypeCode(item.AdvanceTypeCode);

    //Set Edit Advance Amount
    const formattedAmount = item.AdvanceAmount
      ? new Intl.NumberFormat().format(item.AdvanceAmount)
      : '0';
    setEditAdvanceAmount(formattedAmount);

    //Set Edit Payment Date
    const formattedEditablePaymentDate = new Date(item.RequestedPaymentDate)
      .toISOString()
      .split('T')[0];
    setEditablePaymentDate(formattedEditablePaymentDate);

    //Set Edit Ercovery Start Date
    const formattedEditableRecoveryStartDate = new Date(item.RecoveryStartDate)
      .toISOString()
      .split('T')[0];
    setEditRecoveryStartDate(formattedEditableRecoveryStartDate);

    //Set Edit Recoveries
    const formattedRecoveries = item.RequestedInstallments
      ? new Intl.NumberFormat().format(item.RequestedInstallments)
      : '0';
    setEditRecoveries(formattedRecoveries);

    //Set Edit Recovery Amount
    const formattedRecoveryAmount = item.RequestedInstallmentAmount
      ? new Intl.NumberFormat().format(item.RequestedInstallmentAmount)
      : '0';
    setEditRecoveryAmount(formattedRecoveryAmount);

    //Set Edit Recovery Amount
    setEditDescription(item.AdvanceDescription);

    //Set Edit Ercovery Start Date
    const formattedEditableRequestedDate = `${today}T12:00:00`;
    setEditRequestDate(formattedEditableRequestedDate);

    // Open the modal
    toggleEditModal();
  };

  const toggleEditModal = async () => {
    const prevState = isEditModalVisible;

    if (prevState) {
      try {
        const Advances = await fetchAdvances(userData.employeeId);
        setAdvanceData(Advances);
      } catch (error) {
        console.error('Error fetching Advances:', error);
      }
    } else {
      resetForm();
    }

    setIsEditModalVisible(!prevState);
  };

  const handleDeleteLeave = AdvanceRecId => {
    if (AdvanceRecId == null) {
      setAlertMessage('Invalid record for deletion.');
      setAlertModal(true);
      return;
    }

    setDeleteRecId(AdvanceRecId);
    setIsDeleteConfirmationVisible(true);
  };

  const deleteRecord = async AdvanceRecId => {
    try {
      // eslint-disable-next-line no-unused-vars
      const response = await DeleteAdvanceRequest({
        recordsRecId: [AdvanceRecId],
      });
      setAlertMessage('Loan has been deleted.');
      setAlertModal(true);

      const updatedAdvanceData = allAdvanceData.filter(
        advance => advance.WorkerRecId !== AdvanceRecId,
      );
      setAllAdvanceData(updatedAdvanceData);
      handleRefresh();
    } catch (error) {
      setAlertMessage('Failed to Delete Loan request');
      setAlertModal(true);
    }
  };

  const validateFields = () => {
    let valid = true;

    // Validate Advance Amount
    if (advanceAmount.trim() === '') {
      setIsAdvanceAmountValid(false);
      valid = false;
    } else {
      setIsAdvanceAmountValid(true);
    }

    // Validate Advance Type Code
    if (!advanceTypeCode) {
      setIsAdvanceTypeValid(false);
      valid = false;
    } else {
      setIsAdvanceTypeValid(true);
    }

    // Validate Payment Date
    if (endDate.trim() === '') {
      setIsDateValid(false);
      valid = false;
    } else {
      setIsDateValid(true);
    }

    // Validate Payment Date
    if (selectedPaymentDate.trim() === '') {
      setIsDateValid(false);
      valid = false;
    } else {
      setIsDateValid(true);
    }

    // Validate Recovery Date
    if (recoveryStartDate.trim() === '') {
      setIsRecoveryDateValid(false);
      valid = false;
    } else {
      setIsRecoveryDateValid(true);
    }

    return valid;
  };

  const handleCreateRequest = async () => {
    setLoading(true);
    try {
      if (!validateFields()) {
        setAlertMessage('Please fill out all required fields.');
        setAlertModal(true);
      }

      const formattedRecoveryDate = `${recoveryStartDate}T12:00:00`;
      const formattedRequestDate = `${today}T12:00:00`;
      const formattedEndDate = `${endDate.toString().split('T')[0]}T12:00:00`;
      const recIdNumber = Number(userData.WorkerRecId);

      // eslint-disable-next-line no-shadow
      const advanceData = {
        EmployeeId: recIdNumber,
        AdvanceTypeCode: advanceTypeCode,
        AdvanceAmount: Number(advanceAmount.replace(/,/g, '')),
        RequestedPaymentDate: formattedEndDate,
        RecoveryStartDate: formattedRecoveryDate,
        RequestedInstallmentAmount: Number(recoveryAmount.replace(/,/g, '')),
        RequestedInstallments: Number(recoveries),
        RequestDate: formattedRequestDate,
        AdvanceDescription: description,
      };

      const response = await CreateAdvanceRequest(advanceData);
      if (response.IsSuccess) {
        setAlertMessage('Loan request created successfully');
        setAlertModal(true);
        return response.RecId;
      } else {
        setAlertMessage(response.Message);
        setAlertModal(true);
      }
    } catch (error) {
      setAlertMessage('Failed to create Loan request');
      setAlertModal(true);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const refreshAdvance = await RetrieveAdvancesRequest();

      const filteredAdvanceData = refreshAdvance.filter(
        advance => advance.EmployeeId === userData.WorkerRecId,
      );

      setAllAdvanceData(filteredAdvanceData);
    } catch (error) {
      setAlertMessage('Failed in fetch data.', error);
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const validateEditFields = () => {
    let valid = true;

    // Validate Advance Amount
    if (editAdvanceAmount.trim() === '') {
      setIsAdvanceAmountValid(false);
      valid = false;
    } else {
      setIsAdvanceAmountValid(true);
    }

    // Validate Advance Type Code
    if (!editAdvanceTypeCode) {
      setIsAdvanceTypeValid(false);
      valid = false;
    } else {
      setIsAdvanceTypeValid(true);
    }

    // Validate Payment Date
    if (editablePaymentDate.trim() === '') {
      setIsDateValid(false);
      valid = false;
    } else {
      setIsDateValid(true);
    }

    // Validate Recovery Date
    if (editRecoveryStartDate.trim() === '') {
      setIsRecoveryDateValid(false);
      valid = false;
    } else {
      setIsRecoveryDateValid(true);
    }

    return valid;
  };

  const handleUpdateRequest = async () => {
    setLoadingUpdate(true);
    try {
      // Field validation
      if (!validateEditFields()) {
        setAlertMessage('Please fill out all required fields.');
        setAlertModal(true);
        return;
      }

      const formattedRecoveryDate = `${editRecoveryStartDate}T12:00:00`;
      const formattedRequestDate = `${today}T12:00:00`;
      const formattedPaymentDate = `${
        editablePaymentDate.toString().split('T')[0]
      }T12:00:00`;
      const recIdNumber = Number(userData.WorkerRecId);

      // eslint-disable-next-line no-shadow
      const advanceData = {
        RecId: recId,
        EmployeeId: recIdNumber,
        AdvanceTypeCode: editAdvanceTypeCode,
        AdvanceAmount: Number(editAdvanceAmount.replace(/,/g, '')),
        RequestedPaymentDate: formattedPaymentDate,
        RecoveryStartDate: formattedRecoveryDate,
        RequestedInstallmentAmount: Number(
          editRecoveryAmount.replace(/,/g, ''),
        ),
        RequestedInstallments: Number(editRecoveries),
        RequestDate: formattedRequestDate,
        AdvanceDescription: editDescription,
      };

      const response = await UpdateAdvanceRecord(advanceData);
      if (response.IsSuccess) {
        setAlertMessage('Loan request Updated successfully');
      } else {
        setAlertMessage(response.Message);
      }
      setAlertModal(true);
      toggleEditModal();
    } catch (error) {
      setAlertMessage('Failed to Update Loan request');
      setAlertModal(true);
    } finally {
      // setLoading(false);
      setLoadingUpdate(false);
    }
  };

  const submitOnEdit = async () => {
    setLoadingUpdate(true);
    try {
      const submitResponse = await SubmitAdvanceRecord({recId: recId});
      if (submitResponse) {
        setAlertMessage('Loan request submitted successfully.');
        setAlertModal(true);
      } else {
        setAlertMessage(submitResponse.Message);
      }
      setAlertModal(true);
      toggleEditModal();
    } catch (error) {
      setAlertMessage('Failed to update Loan request');
      setAlertModal(true);
    } finally {
      setLoadingUpdate(false);
    }
  };

  const submitRequest = async newRecIds => {
    setLoading(true);
    try {
      const submitResponse = await SubmitAdvanceRecord({recId: newRecIds});
      if (submitResponse) {
        setAlertMessage('Loan request submitted successfully.');
      } else {
        setAlertMessage(submitResponse.Message);
      }
      setAlertModal(true);
      toggleModal();
    } catch (error) {
      setAlertMessage('Failed to update Loan request');
      setAlertModal(true);
    } finally {
      setLoading(false);
    }
  };

  // Header Icons Declaration
  const naviSetting = () => {
    navigation.setOptions({
      // headerLeft: () => (
      //   <TouchableOpacity
      //     onPress={() => navigation.goBack()}
      //     style={styles.leftSide}>
      //     <Icon name="arrow-left" size={20} color="white" />
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
      // eslint-disable-next-line react/no-unstable-nested-components
      headerRight: () => (
        <View style={styles.rightSideView}>
          <TouchableOpacity onPress={handleRefresh} style={styles.rightSide}>
            <Icon name="refresh" size={24} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              marginLeft: 9 * 0.02,
              justifyContent: 'center',
            }}
            onPress={toggleModal}>
            <FilterIcon
              name="plus"
              size={30}
              color="#fff"
              style={styles.plusIcon}
            />
          </TouchableOpacity>
        </View>
      ),
      headerStyle: {
        backgroundColor: '#FFA500',
        height: 70,
      },
      headerTintColor: '#fff',
      headerTitleAlign: 'center',
      headerTitleStyle: {
        fontSize: hp(2.3),
        color: 'white',
      },
    });
  };

  const formatDate = date => date.toString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];

  const ExceptionDate = date =>
    new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

  return (
    <View style={{backgroundColor: '#FAFAFA', marginTop: hp(0), flex: 1}}>
      {/* Start of List on Advance Screen */}
      {isLoading ? (
        <>
          {/* <ActivityIndicator size="large" color="orange" /> */}
          <CustomIndicator />
        </>
      ) : (
        <FlatList
          data={allAdvanceData}
          renderItem={({item}) => (
            <AdvanceCard
              RecId={item.RecId}
              EmployeeId={item.EmployeeName}
              AdvanceTypeCode={item.AdvanceTypeCode}
              AdvanceAmount={item.AdvanceAmount}
              PaymentDate={item.RequestedPaymentDate}
              RecoveryStartDate={item.RecoveryStartDate}
              RequestedInstallmentAmount={item.RequestedInstallmentAmount}
              RequestedInstallments={item.RequestedInstallments}
              RequestDate={item.RequestDate}
              AdvanceDescription={item.AdvanceDescription}
              AdvanceRequestId={item.AdvanceRequestId}
              WFStatus={getStatusLabel(item.WFStatus)}
              onPress={
                item.WFStatus === 0 ? () => handleLeaveCardPress(item) : null
              }
              onDelete={
                item.WFStatus === 0 ? () => handleDeleteLeave(item.RecId) : null
              }
            />
          )}
          keyExtractor={(item, index) =>
            item.RecId?.toString() || index.toString()
          }
          contentContainerStyle={{flexGrow: 1}}
        />
      )}
      {/* End of List on Advance Screen */}

      {/* Start of Calender Form 1 */}
      <Modal
        visible={showPaymentCalendar}
        transparent={true}
        animationType="slide">
        <View style={styles.calendarModalContainer}>
          <View style={styles.calendarModalContent}>
            <Calendar
              current={selectedPaymentDate || endDate || editablePaymentDate}
              markedDates={{
                [selectedPaymentDate || editablePaymentDate]: {
                  selected: true,
                  marked: true,
                  selectedColor: '#FFA500',
                },
              }}
              onDayPress={day => {
                setSelectedPaymentDate(day.dateString);
                setEditablePaymentDate(day.dateString);
                validatePaymentDate(day.dateString);
                setShowPaymentCalendar(false);
              }}
            />
            <TouchableOpacity
              style={styles.closeCalendarButton}
              onPress={() => setShowPaymentCalendar(false)}>
              <Text style={styles.closeCalendarButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* End of Calender Form 1 */}

      {/* Start of Calender Form 2 */}
      <Modal
        visible={showStartCalendar}
        transparent={true}
        animationType="slide">
        <View style={styles.calendarModalContainer}>
          <View style={styles.calendarModalContent}>
            <Calendar
              current={
                recoveryStartDate.toString()?.slice(0, 10) ||
                editRecoveryStartDate
              }
              markedDates={{
                [recoveryStartDate || editRecoveryStartDate]: {
                  selected: true,
                  marked: true,
                  selectedColor: '#FFA500',
                },
              }}
              onDayPress={day => {
                setRecoveryStartDate(day.dateString);
                setEditRecoveryStartDate(day.dateString);
                validateRecoveryStartDate(day.dateString);
                setShowStartCalendar(false);
              }}
            />
            <TouchableOpacity
              style={styles.closeCalendarButton}
              onPress={() => setShowStartCalendar(false)}>
              <Text style={styles.closeCalendarButtonText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* End of Calender Form 2 */}

      {/* Start of Main Modal Code */}
      <Modal visible={isModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View
            style={{
              backgroundColor: '#FFF3E0',
              width: wp(80),
              borderTopLeftRadius: 10,
              borderTopRightRadius: 10,
              alignSelf: 'center',
              paddingRight: wp(3),
              justifyContent: 'flex-end',
              alignItems: 'flex-end',
              marginTop: hp(10),
            }}>
            <TouchableOpacity
              style={{
                marginTop: hp(2),
              }}
              onPress={() => {
                toggleModal();
              }}>
              <FontAwesome name="close" size={30} color="#FFA500" />
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <ScrollView contentContainerStyle={{paddingVertical: hp(3)}}>
              <Text style={styles.modalHeading}>Create Loan Request</Text>

              <View>
                <Text style={styles.fieldsHeading}>Employee</Text>
                <TextInput
                  style={[styles.reasonInput, styles.reasonInput]}
                  value={userData?.employeeName}
                  placeholderTextColor="grey"
                  color="grey"
                  editable={false}
                />
              </View>

              <View>
                <Text style={styles.fieldsHeading}>Request Date</Text>
                <TextInput
                  style={[styles.reasonInput, styles.reasonInput]}
                  value={today}
                  placeholderTextColor="grey"
                  color="grey"
                  editable={false}
                />
              </View>

              <View>
                <Text style={styles.fieldsHeading}>Advance Description</Text>
                <TextInput
                  style={[styles.reasonInput, styles.reasonInput]}
                  value={description}
                  onChangeText={text => setDescription(text)}
                />
              </View>

              <View>
                <Text style={styles.fieldsHeading}>Advance Type Code</Text>
                <Dropdown
                  style={[
                    styles.dropdown,
                    !isAdvanceTypeValid && styles.invalidField,
                  ]}
                  data={dropdownData}
                  itemTextStyle={{color: '#000'}}
                  labelField="label"
                  valueField="value"
                  placeholder="Select Advance Type"
                  value={advanceTypeCode}
                  onChange={item => {
                    setAdvanceTypeCode(item.value);
                    setIsAdvanceTypeValid(true);
                  }}
                  placeholderStyle={{color: '#555555'}}
                  selectedTextStyle={{color: '#000'}}
                  containerStyle={styles.dropdownContainer}
                  onBlur={() => {
                    validateAdvanceTypeCode();
                    setIsAdvanceTypeValid(true);
                  }}
                />
                {!isAdvanceTypeValid && (
                  <Text style={styles.errorText}>
                    Advance Type Code is required
                  </Text>
                )}
              </View>

              <View>
                <Text style={styles.fieldsHeading}>Advance Amount</Text>
                <TextInput
                  style={[
                    styles.reasonInput,
                    !isAdvanceAmountValid && styles.invalidField,
                  ]}
                  value={advanceAmount}
                  placeholder="0"
                  placeholderTextColor="grey"
                  onChangeText={value => {
                    const cleanedValue = value.replace(/[^0-9]/g, '');
                    const formattedValue = new Intl.NumberFormat().format(
                      cleanedValue,
                    );

                    setAdvanceAmount(formattedValue);
                    setIsAdvanceAmountValid(true);
                    setIsAmountExceeds(false);
                    if (cleanedValue === '0' || cleanedValue === '') {
                      setIsFieldsDisabled(true);
                      setIsAmountFieldsDisabled(true);
                    } else {
                      setIsFieldsDisabled(false);
                      setIsAmountFieldsDisabled(false);
                    }
                  }}
                  onBlur={() => {
                    validateAdvanceAmount();
                    checkAdvanceAmountLimit();
                  }}
                  keyboardType="numeric"
                  editable={true}
                />

                {!isAdvanceAmountValid && (
                  <Text style={styles.errorText}>
                    Advance Amount is required
                  </Text>
                )}

                {isAmountExceeds && (
                  <Text style={styles.errorText}>
                    Advance Amount cannot exceed{' '}
                    {Number(maxAdvanceAmount).toLocaleString()}
                  </Text>
                )}
              </View>

              <View style={styles.calendarContainer}>
                <Text style={styles.fieldsHeading}>Payment Date</Text>
                <TouchableOpacity
                  style={[styles.inputCon, !isDateValid && styles.invalidField]}
                  onPress={handleButtonPressPayment}
                  onBlur={() => {
                    validatePaymentDate(selectedPaymentDate);
                  }}>
                  <View style={{flex: 1}}>
                    <Text style={styles.inputTxt}>
                      {selectedPaymentDate
                        ? isNaN(Date.parse(selectedPaymentDate))
                          ? 'Invalid Date'
                          : new Date(selectedPaymentDate).toLocaleDateString(
                              'en-US',
                              {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                              },
                            )
                        : 'Select Payment Date'}
                    </Text>
                  </View>
                  <CalendarIcon
                    color={'#555555'}
                    name="calendar-alt"
                    size={25}
                  />
                </TouchableOpacity>
                {!isDateValid && (
                  <Text style={styles.errorText}>
                    {`Select Payment Date between ${formatDate(
                      startDate,
                    )} ${formatDate(endDate)}`}
                  </Text>
                )}
              </View>

              <View style={styles.calendarContainer}>
                <Text style={styles.fieldsHeading}>Recovery Start Date</Text>
                <TouchableOpacity
                  style={[
                    styles.inputCon,
                    !isRecoveryDateValid,
                    !isPaymentDateValid && styles.invalidField,
                  ]}
                  onPress={handleButtonPressStart}
                  onBlur={() => {
                    validateRecoveryStartDate(recoveryStartDate);
                    setIsRecoveryDateValid(true);
                    setIsPaymentDateValid(true);
                  }}>
                  <View style={{flex: 1}}>
                    <Text style={styles.inputTxt}>
                      {recoveryStartDate
                        ? isNaN(Date.parse(recoveryStartDate))
                          ? 'Invalid Date'
                          : new Date(recoveryStartDate).toLocaleDateString(
                              'en-US',
                              {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                              },
                            )
                        : 'Select Recovery Start Date'}
                    </Text>
                  </View>
                  <CalendarIcon
                    color={'#555555'}
                    name="calendar-alt"
                    size={25}
                  />
                </TouchableOpacity>
                {!isRecoveryDateValid && (
                  <Text style={styles.errorText}>
                    Recovery Start Date cannot exceed the Payment Date
                  </Text>
                )}
                {!isPaymentDateValid && (
                  <Text style={styles.errorText}>
                    Payment Date is Empty. Select the Payment Date First.
                  </Text>
                )}
              </View>

              <View>
                <Text style={styles.fieldsHeading}>Recovery Amount</Text>
                <TextInput
                  style={[styles.reasonInput, styles.reasonInput]}
                  value={recoveryAmount}
                  placeholder="0"
                  placeholderTextColor="grey"
                  onChangeText={value => {
                    const cleanedValue = value.replace(/[^0-9]/g, '');
                    const formattedValue = new Intl.NumberFormat().format(
                      cleanedValue,
                    );

                    if (
                      parseInt(cleanedValue, 10) >=
                      parseInt(Number(advanceAmount.replace(/,/g, '')), 10)
                    ) {
                      setAlertMessage(
                        `Recovery Amount cannot exceed Advance Amount (${advanceAmount})`,
                      );
                      setRecoveryAmount('');
                      setAlertModal(true);
                    } else {
                      setRecoveryAmount(formattedValue);
                      if (value !== '') {
                        setRecoveries('');
                        setIsFieldsDisabled(true);
                      } else {
                        setIsFieldsDisabled(false);
                      }
                    }
                  }}
                  keyboardType="numeric"
                  editable={
                    advanceAmount !== '0' &&
                    advanceAmount !== '' &&
                    (!isAmountFieldsDisabled ||
                      (recoveries === '' && recoveryAmount === ''))
                  }
                />

                <View>
                  <Text style={styles.fieldsHeading}>Recoveries</Text>
                  <TextInput
                    style={[styles.reasonInput, styles.reasonInput]}
                    value={recoveries}
                    placeholder="0"
                    placeholderTextColor="grey"
                    onChangeText={value => {
                      setRecoveries(value);
                      if (value !== '') {
                        setRecoveryAmount('');
                        setIsAmountFieldsDisabled(true);
                      } else {
                        setIsAmountFieldsDisabled(false);
                      }
                    }}
                    onBlur={() => {
                      validateRecoveries(recoveries);
                    }}
                    keyboardType="numeric"
                    editable={
                      advanceAmount !== '0' &&
                      advanceAmount !== '' &&
                      (!isFieldsDisabled ||
                        (recoveries === '' && recoveryAmount === ''))
                    }
                  />
                  {!isRecoverieseValid && (
                    <Text style={styles.errorText}>
                      Recovery cannot exceed {maxRecoveries}
                    </Text>
                  )}
                </View>
              </View>

              {loading ? (
                // <ActivityIndicator size="large" color="#FF6B00" />
                <CustomIndicator />
              ) : (
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[styles.button, styles.confirmButton]}
                    onPress={async () => {
                      if (!validateFields()) {
                        setAlertMessage('Please fill out all required fields.');
                        setAlertModal(true);
                        return;
                      }

                      setLoading(true);
                      try {
                        await handleCreateRequest();
                        await handleRefresh();
                      } catch (error) {
                        setAlertMessage('Something went wrong.', error.message);
                        setAlertModal(true);
                      } finally {
                        setLoading(false);
                        toggleModal();
                      }
                    }}>
                    <Text style={styles.buttonText}>Create</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.confirmButton]}
                    onPress={async () => {
                      if (!validateFields()) {
                        setAlertMessage('Please fill out all required fields.');
                        setAlertModal(true);
                        return;
                      }

                      setLoading(true);
                      try {
                        const newRecId = await handleCreateRequest();
                        if (newRecId) {
                          await submitRequest(newRecId);
                        }
                        await handleRefresh();
                      } catch (error) {
                        setAlertMessage('Something went wrong.', error.message);
                        setAlertModal(true);
                      } finally {
                        setLoading(false);
                        toggleModal();
                      }
                    }}>
                    <Text style={styles.buttonText}>Create & Submit</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
      {/* End of Main Modal Code */}

      {/* Start of Edit modal code */}
      <Modal
        visible={isEditModalVisible}
        transparent={true}
        animationType="slide">
        <View style={styles.modalContainer}>
          <View
            style={{
              backgroundColor: '#FFF3E0',
              width: wp(80),
              borderTopLeftRadius: 10,
              borderTopRightRadius: 10,
              alignSelf: 'center',
              paddingRight: wp(3),
              justifyContent: 'flex-end',
              alignItems: 'flex-end',
              marginTop: hp(10),
            }}>
            <TouchableOpacity
              style={{
                marginTop: hp(2),
              }}
              onPress={() => {
                toggleEditModal();
              }}>
              <FontAwesome name="close" size={30} color="#FFA500" />
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <ScrollView contentContainerStyle={{paddingVertical: hp(3)}}>
              <Text style={styles.modalHeading}>Edit Loan Request</Text>

              {selectedAdvanceData && (
                <>
                  <View>
                    <Text style={styles.fieldsHeading}>Employee</Text>
                    <TextInput
                      style={[styles.reasonInput, styles.reasonInput]}
                      value={userData?.employeeName}
                      placeholderTextColor="grey"
                      color="grey"
                      editable={false}
                    />
                  </View>

                  <View>
                    <Text style={styles.fieldsHeading}>Request Date</Text>
                    <TextInput
                      style={[styles.reasonInput, styles.reasonInput]}
                      value={today}
                      placeholderTextColor="grey"
                      color="grey"
                      editable={false}
                    />
                  </View>

                  <View>
                    <Text style={styles.fieldsHeading}>
                      Advance Description
                    </Text>
                    <TextInput
                      style={[styles.reasonInput, styles.reasonInput]}
                      value={editDescription}
                      onChangeText={text => setEditDescription(text)}
                    />
                  </View>

                  <View>
                    <Text style={styles.fieldsHeading}>Advance Type Code</Text>
                    <Dropdown
                      style={[
                        styles.dropdown,
                        !isAdvanceTypeValid && styles.invalidField,
                      ]}
                      data={dropdownDataEdit}
                      itemTextStyle={{color: '#000'}}
                      labelField="label"
                      valueField="value"
                      placeholder="Select Advance Type"
                      value={editAdvanceTypeCode}
                      onChange={item => {
                        setEditAdvanceTypeCode(item.value);
                        setIsAdvanceTypeValid(true);
                      }}
                      placeholderStyle={{color: '#555555'}}
                      selectedTextStyle={{color: '#000'}}
                      containerStyle={styles.dropdownContainer}
                      onBlur={() => {
                        validateAdvanceTypeCode();
                        setIsAdvanceTypeValid(true);
                      }}
                    />
                    {!isAdvanceTypeValid && (
                      <Text style={styles.errorText}>
                        Advance Type Code is required
                      </Text>
                    )}
                  </View>

                  <View>
                    <Text style={styles.fieldsHeading}>Advance Amount</Text>
                    <TextInput
                      style={[
                        styles.reasonInput,
                        !isAdvanceAmountValid && styles.invalidField,
                      ]}
                      value={editAdvanceAmount}
                      placeholder="0"
                      placeholderTextColor="grey"
                      onChangeText={value => {
                        const cleanedValue = value.replace(/[^0-9]/g, '');
                        const formattedValue = new Intl.NumberFormat().format(
                          cleanedValue,
                        );

                        setEditAdvanceAmount(formattedValue);
                        setIsAdvanceAmountValid(true);
                        setIsAmountExceeds(false);
                      }}
                      onBlur={() => {
                        validateAdvanceAmount();
                        checkAdvanceAmountLimit();
                      }}
                      keyboardType="numeric"
                      editable={true}
                    />

                    {!isAdvanceAmountValid && (
                      <Text style={styles.errorText}>
                        Advance Amount is required
                      </Text>
                    )}

                    {isAmountExceeds && (
                      <Text style={styles.errorText}>
                        Advance Amount cannot exceed{' '}
                        {Number(maxEditAdvanceAmount).toLocaleString()}
                      </Text>
                    )}
                  </View>

                  <View style={styles.calendarContainer}>
                    <Text style={styles.fieldsHeading}>Payment Date</Text>
                    <TouchableOpacity
                      style={[
                        styles.inputCon,
                        !isDateValid && styles.invalidField,
                      ]}
                      onPress={handleButtonPressPayment}
                      onBlur={() => {
                        validatePaymentDate(editablePaymentDate);
                      }}>
                      <View style={{flex: 1}}>
                        <Text style={styles.inputTxt}>
                          {editablePaymentDate
                            ? isNaN(Date.parse(editablePaymentDate))
                              ? 'Invalid Date'
                              : new Date(
                                  editablePaymentDate,
                                ).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                })
                            : 'Select Payment Date'}
                        </Text>
                      </View>
                      <CalendarIcon
                        color={'#555555'}
                        name="calendar-alt"
                        size={25}
                      />
                    </TouchableOpacity>
                    {!isDateValid && (
                      <Text style={styles.errorText}>
                        {`Select Payment Date between ${ExceptionDate(
                          startDate,
                        )} and ${ExceptionDate(endDate)}`}
                      </Text>
                    )}
                  </View>

                  <View style={styles.calendarContainer}>
                    <Text style={styles.fieldsHeading}>
                      Recovery Start Date
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.inputCon,
                        !isRecoveryDateValid,
                        !isPaymentDateValid && styles.invalidField,
                      ]}
                      onPress={handleButtonPressStart}
                      onBlur={() => {
                        validateRecoveryStartDate(editRecoveryStartDate);
                        setIsRecoveryDateValid(true);
                        setIsPaymentDateValid(true);
                      }}>
                      <View style={{flex: 1}}>
                        <Text style={styles.inputTxt}>
                          {editRecoveryStartDate
                            ? isNaN(Date.parse(editRecoveryStartDate))
                              ? 'Invalid Date'
                              : new Date(
                                  editRecoveryStartDate,
                                ).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                })
                            : 'Select Recovery Start Date'}
                        </Text>
                      </View>
                      <CalendarIcon
                        color={'#555555'}
                        name="calendar-alt"
                        size={25}
                      />
                    </TouchableOpacity>
                    {!isRecoveryDateValid && (
                      <Text style={styles.errorText}>
                        Recovery Start Date cannot exceed the Payment Date
                      </Text>
                    )}
                    {!isPaymentDateValid && (
                      <Text style={styles.errorText}>
                        Payment Date is Empty. Select the Payment Date First.
                      </Text>
                    )}
                  </View>

                  <View>
                    <Text style={styles.fieldsHeading}>Recovery Amount</Text>
                    <TextInput
                      style={[styles.reasonInput, styles.reasonInput]}
                      value={editRecoveryAmount}
                      placeholder="0"
                      placeholderTextColor="grey"
                      onChangeText={value => {
                        const cleanedValue = value.replace(/[^0-9]/g, '');
                        const formattedValue = new Intl.NumberFormat().format(
                          cleanedValue,
                        );

                        if (
                          parseInt(cleanedValue, 10) >=
                          parseInt(
                            Number(editAdvanceAmount.replace(/,/g, '')),
                            10,
                          )
                        ) {
                          setAlertMessage(
                            `Recovery Amount cannot exceed Advance Amount (${editAdvanceAmount})`,
                          );
                          setEditRecoveryAmount('');
                          setAlertModal(true);
                        } else {
                          setEditRecoveryAmount(formattedValue);
                          if (value !== '') {
                            setEditRecoveries('');
                            setIsFieldsDisabled(true);
                          } else {
                            setIsFieldsDisabled(false);
                          }
                        }
                      }}
                      keyboardType="numeric"
                      editable={
                        editAdvanceAmount !== '0' &&
                        editAdvanceAmount !== '' &&
                        (!isAmountFieldsDisabled ||
                          (editRecoveries === '' && editRecoveryAmount === ''))
                      }
                    />

                    <View>
                      <Text style={styles.fieldsHeading}>Recoveries</Text>
                      <TextInput
                        style={[styles.reasonInput, styles.reasonInput]}
                        value={editRecoveries}
                        placeholder="0"
                        placeholderTextColor="grey"
                        onChangeText={value => {
                          setEditRecoveries(value);
                          if (value !== '') {
                            setEditRecoveryAmount('');
                            setIsAmountFieldsDisabled(true);
                          } else {
                            setIsAmountFieldsDisabled(false);
                          }
                        }}
                        onBlur={() => {
                          validateRecoveries(editRecoveries);
                        }}
                        keyboardType="numeric"
                        editable={
                          editAdvanceAmount !== '0' &&
                          editAdvanceAmount !== '' &&
                          (!isFieldsDisabled ||
                            (editRecoveries === '' &&
                              editRecoveryAmount === ''))
                        }
                      />
                      {!isRecoverieseValid && (
                        <Text style={styles.errorText}>
                          Recovery cannot exceed {maxEditRecoveries}
                        </Text>
                      )}
                    </View>
                  </View>

                  {loadingUpdate ? (
                    // <ActivityIndicator size="large" color="#FF6B00" />
                    <CustomIndicator />
                  ) : (
                    <View style={styles.buttonContainer}>
                      <TouchableOpacity
                        style={[styles.button, styles.confirmButton]}
                        onPress={async () => {
                          try {
                            setLoadingUpdate(true);
                            await handleUpdateRequest();
                            await handleRefresh();
                          } catch (error) {
                            setAlertMessage('Update failed.', error.message);
                            setAlertModal(true);
                          } finally {
                            setLoadingUpdate(false);
                          }
                        }}>
                        <Text style={styles.buttonText}>Update</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.button, styles.confirmButton]}
                        onPress={async () => {
                          try {
                            setLoadingUpdate(true);
                            await handleUpdateRequest();
                            await submitOnEdit();
                            await handleRefresh();
                          } catch (error) {
                            setAlertMessage('Update failed.', error.message);
                            setAlertModal(true);
                          } finally {
                            setLoadingUpdate(false);
                          }
                        }}>
                        <Text style={styles.buttonText}>Update & Submit</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
      {/*-----------End of Edit Modal---------*/}

      <AlertDeleteModal
        visible={isDeleteConfirmationVisible}
        heading="Confirm Deletion"
        text="Are you sure you want to delete this loan request?"
        onPress={() => {
          deleteRecord(deleteRecId);
          setIsDeleteConfirmationVisible(false);
        }}
        onCancel={() => setIsDeleteConfirmationVisible(false)}
      />

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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0', // Light gray background
  },
  leftSide: {
    // width: wp(9),
    // alignItems: 'center',
    // height: hp(6),
    // justifyContent: 'center',
    // marginLeft: 9,
    // marginHorizontal: 50,
    width: wp(9),
    alignItems: 'center',
    height: hp(6),
    justifyContent: 'center',
    marginRight: 9,
    marginLeft: 5,
  },
  rightSideView: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: wp(3), // Adjusted margin
  },
  rightSide: {
    // width: wp(9),
    // alignItems: 'center',
    // height: hp(6),
    // justifyContent: 'center',
    // marginRight: 9,
    // marginHorizontal: 50,
    width: wp(9),
    alignItems: 'center',
    height: hp(6),
    justifyContent: 'center',
    marginRight: 9,
    marginHorizontal: 50,
  },
  plusIcon: {
    marginHorizontal: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)', // Darker overlay for better contrast
  },
  modalContent: {
    width: wp(80),
    backgroundColor: '#FFF3E0',
    borderBottomLeftRadius: 15, // Adjust as needed
    borderBottomRightRadius: 15, // Adjust as needed
    padding: hp(2.3),
    marginBottom: hp(10),
  },
  modalHeading: {
    fontSize: hp(5.0),
    color: '#555555', // Dark gray for modal heading
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: hp(2),
  },
  fieldsHeading: {
    fontSize: hp(4.5),
    color: '#555555', // Dark gray for fields heading
    fontWeight: '500',
    marginTop: 5,
    marginBottom: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 16,
    marginTop: 20,
    marginVertical: 8,
    paddingHorizontal: 12,
    marginLeft: '4%',
    width: '92%',
  },
  iconStyle: {
    marginRight: 4,
  },
  filterInput: {
    flex: 1,
    height: 40,
    color: '#333',
    paddingLeft: 8,
    width: 4, // Padding to create space between icon and text
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#555555', // Light gray for dropdown border
    padding: hp(1),
    borderRadius: 5,
    marginBottom: hp(1.5),
  },
  dropdownContainer: {
    backgroundColor: '#FFF3E0',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#555555', // Light gray for dropdown container border
  },
  invalidField: {
    borderColor: 'red', // Red border for invalid input
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 10,
  },
  calendarModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)', // Darker overlay for better contrast
  },
  calendarModalContent: {
    width: wp(80),
    backgroundColor: '#FFF3E0',
    borderRadius: 15,
    padding: hp(2),
  },
  closeCalendarButton: {
    backgroundColor: '#FFA500', // Bright orange for button
    borderRadius: 5,
    paddingVertical: hp(1.5),
    alignItems: 'center',
    marginTop: hp(2),
  },
  closeCalendarButtonText: {
    color: '#fff', // White text for button
    fontSize: hp(4.5),
    fontWeight: '500',
  },
  calendarContainer: {
    marginBottom: hp(1.5),
  },
  input: {
    borderWidth: 1,
    borderColor: '#555555', // Light gray for input border
    borderRadius: 5,
    padding: hp(1),
    marginBottom: hp(1),
    fontSize: hp(4.5),

    color: '#555555', // Dark gray for input text
  },
  inputCon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555555', // Light gray for input container border
    borderRadius: 5,
    padding: hp(1),
    marginBottom: hp(1.5),
  },
  inputTxt: {
    fontSize: hp(4.5),
    color: '#555555', // Dark gray for input text
  },
  reasonInput: {
    padding: hp(1),
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#555555', // Light gray for border
    fontSize: hp(4.5),
    color: '#333', // Dark gray for text
  },
  buttonContainer: {
    flexDirection: 'row', // Places buttons in a row
    justifyContent: 'space-between', // Adds space between buttons
    marginTop: 20,
    paddingHorizontal: 10,
  },
  button: {
    flex: 1, // Takes available space for responsive sizing
    marginHorizontal: 5, // Adds spacing between buttons
    padding: 10,
    borderRadius: 5,
  },
  confirmButton: {
    backgroundColor: 'orange', // Custom color for buttons
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  headerImage: {
    width: 100,
    height: 40,
  },
});

export default AdvanceSalarySlip;
