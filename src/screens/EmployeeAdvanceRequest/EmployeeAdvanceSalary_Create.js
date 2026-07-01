/* eslint-disable curly */
/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, {useState, useCallback, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  BackHandler,
  ActivityIndicator,
  Keyboard,
  StyleSheet,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/FontAwesome';
import {translate as t} from '../../store/utils/translate';

import {CreateAdvanceRequest} from '../../API/EmployeeAdvanceRequest/CreateAdvanceRequest';

import AlertModal from '../../components/Alert/AlertModal';
import CalendarModal from '../../components/Leaves/CalendarModal';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import styles from '../../styles/styles';

const EmployeeAdvanceSalary_Create = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);

  const isRTL = useSelector(state => state.language.isRTL);
  const userData = useSelector(state => state.user.userData);
  const {menuItems} = useSelector(state => state.menuItem);

  const routeUserData = route.params?.userData;
  const effectiveUserData = routeUserData || userData || {};

  const {
    advanceData = {},
    employeeId = advanceData.employeeId || effectiveUserData?.employeeId || '',
    employeeName = advanceData.employeeName ||
      effectiveUserData?.employeeName ||
      '',
    WorkerRecId = advanceData.WorkerRecId ||
      effectiveUserData?.WorkerRecId ||
      '',
    cameFrom = 'MainDashboard',
  } = route.params || {};

  // ── today string ──
  const todayISO = new Date().toISOString().split('T')[0];

  const formatDate = dateStr => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  const formatToISOWithTime = date => {
    if (!date) return '';
    try {
      const baseDate = new Date(date);
      if (isNaN(baseDate.getTime())) return '';
      const year = baseDate.getFullYear();
      const month = String(baseDate.getMonth() + 1).padStart(2, '0');
      const day = String(baseDate.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}T12:00:00`;
    } catch {
      return '';
    }
  };

  // ── form state ──
  const [formData, setFormData] = useState({
    employeeId,
    employeeName,
    WorkerRecId,
    requestDate: todayISO,
    RequestedPaymentDate: '',
    AdvanceAmount: '',
    AdvanceDescription: '',
  });

  const [showPaymentDateCalendar, setShowPaymentDateCalendar] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  // ── keyboard listener ──
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardVisible(true),
    );
    const hide = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // ── hardware back ──
  useFocusEffect(
    useCallback(() => {
      const onBack = () => {
        goBack();
        return true;
      };
      BackHandler.addEventListener('hardwareBackPress', onBack);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBack);
    }, []),
  );

  // ── scroll to top on focus ──
  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({y: 0, animated: false});
    }, []),
  );

  const goBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('MainDashboard');
  };

  const getPageLabel = () => {
    const item = menuItems?.find(
      m => m.MenuId === 'EmployeeAdvanceSalaryCreate',
    );
    return item?.Label || 'Create Advance Salary';
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({...prev, [field]: value}));
  };

  const formatNumber = value => {
    if (value === null || value === undefined || value === '') return '';
    const num = Number(value.toString().replace(/,/g, ''));
    if (isNaN(num)) return '';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const parseNumber = value => {
    if (!value) return 0;
    const cleanValue = value.toString().replace(/,/g, '');
    const num = parseFloat(cleanValue);
    return isNaN(num) ? 0 : num;
  };

  const handleAdvanceAmountChange = value => {
    const cleanedValue = value.replace(/[^0-9.]/g, '');
    const formattedValue = formatNumber(cleanedValue);
    handleInputChange('AdvanceAmount', formattedValue);
  };

  const handlePaymentDateChange = date => {
    const formatted = formatToISOWithTime(date);
    setFormData(prev => ({...prev, RequestedPaymentDate: formatted}));
    setShowPaymentDateCalendar(false);
  };

  // ── validation ──
  const validateFields = () => {
    const errors = [];

    if (!formData.RequestedPaymentDate) errors.push('Payment Date is required');

    const advanceAmount = parseNumber(formData.AdvanceAmount);
    if (!advanceAmount || advanceAmount === 0)
      errors.push('Advance Amount is required and must be greater than 0');

    return {isValid: errors.length === 0, errors};
  };

  // ── submit ──
  // ── submit ──
  const handleCreate = async () => {
    const validation = validateFields();
    if (!validation.isValid) {
      setAlertMessage(validation.errors.join('\n'));
      setAlertModal(true);
      return;
    }

    setIsProcessing(true);

    try {
      const payload = {
        AdvanceTypeCode: 'Advance Salary',
        AdvanceAmount: parseNumber(formData.AdvanceAmount).toString(),
        RequestedPaymentDate: formData.RequestedPaymentDate,
        RecoveryStartDate: formData.RequestedPaymentDate, // ✅ same as payment date, never empty
        RequestedInstallmentAmount: '0',
        RequestedInstallments: '0',
        AdvanceDescription: formData.AdvanceDescription || '',
        EmployeeId: WorkerRecId,
        RecId: '0',
        RequestDate: `${todayISO}T12:00:00`,
        Guarantor1: '',
        Guarantor2: '',
      };

      const response = await CreateAdvanceRequest({advanceData: payload});

      if (response?.IsSuccess === 'true' || response?.IsSuccess === true) {
        setAlertMessage('Advance salary request created successfully.');
        setAlertModal(true);
        setTimeout(() => {
          setAlertModal(false);
          goBack();
        }, 2000);
      } else {
        setAlertMessage(
          response?.Message || 'Failed to create advance salary request.',
        );
        setAlertModal(true);
      }
    } catch (error) {
      console.error('Error creating advance salary request:', error);
      setAlertMessage('A network or server error occurred. Please try again.');
      setAlertModal(true);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ActionPaneContainer
      pageTitle={getPageLabel()}
      isBackButton={true}
      showFooter={false}
      showTabNavigator={!isKeyboardVisible}
      showFloatingButton={false}
      isHeaderActive={true}
      onBackPress={goBack}
      showPageTitleRow={true}>
      <SafeAreaView style={styles.DSR_SafeArea}>
        {isProcessing && (
          <View style={styles.DSR_ProcessingOverlay}>
            <View style={styles.DSR_ProcessingContainer}>
              <ActivityIndicator size="large" color="#0A66C2" />
              <Text style={styles.DSR_ProcessingText}>
                {t('common.processing') || 'Processing...'}
              </Text>
            </View>
          </View>
        )}

        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.DSR_FormContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* ── 1. Employee ID ── */}
          <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
            Employee ID
          </Text>
          <Text
            style={[
              styles.DSR_Input,
              styles.DSR_Disabled,
              isRTL && {textAlign: 'left'},
            ]}>
            {formData.employeeId}
          </Text>

          {/* ── 2. Request Date ── */}
          <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
            Request Date
          </Text>
          <Text
            style={[
              styles.DSR_Input,
              styles.DSR_Disabled,
              isRTL && {textAlign: 'left'},
            ]}>
            {formatDate(formData.requestDate)}
          </Text>

          {/* ── 3. Payment Date ── */}
          <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
            Payment Date *
          </Text>
          <TouchableOpacity
            style={[styles.DSR_DateSelector, isRTL && {flexDirection: 'row'}]}
            onPress={() => setShowPaymentDateCalendar(true)}>
            <View style={{flex: 1}}>
              <Text
                style={[
                  styles.DSR_DateText,
                  isRTL && {textAlign: 'left'},
                  !formData.RequestedPaymentDate && {color: '#999'},
                ]}>
                {formData.RequestedPaymentDate
                  ? formatDate(formData.RequestedPaymentDate)
                  : 'Select Payment Date'}
              </Text>
            </View>
            <Icon name="calendar" size={20} color="#0A66C2" />
          </TouchableOpacity>

          {/* ── 4. Advance Type Code (read-only) ── */}
          <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
            Advance Type Code
          </Text>
          <Text
            style={[
              styles.DSR_Input,
              styles.DSR_Disabled,
              isRTL && {textAlign: 'left'},
            ]}>
            Advance Salary
          </Text>

          {/* ── 5. Advance Description ── */}
          <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
            Advance Description
          </Text>
          <TextInput
            style={[styles.DSR_Input, styles.DSR_TextArea]}
            value={formData.AdvanceDescription}
            onChangeText={value =>
              handleInputChange('AdvanceDescription', value)
            }
            placeholder="Enter advance description"
            placeholderTextColor="#888"
            multiline
            numberOfLines={4}
            maxLength={60}
          />
          <Text style={styles.DSR_CharCount}>
            {formData.AdvanceDescription?.length || 0}/60
          </Text>

          {/* ── 6. Advance Amount ── */}
          <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
            Advance Amount *
          </Text>
          <TextInput
            style={styles.DSR_Input}
            value={formData.AdvanceAmount}
            onChangeText={handleAdvanceAmountChange}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#888"
          />

          {/* ── 7. Currency (read-only) ── */}
          <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
            Currency
          </Text>
          <Text
            style={[
              styles.DSR_Input,
              styles.DSR_Disabled,
              isRTL && {textAlign: 'left'},
            ]}>
            PKR
          </Text>
        </ScrollView>

        {/* ── Footer buttons ── */}
        <View style={localStyles.footer}>
          <TouchableOpacity
            style={[localStyles.btn, localStyles.cancelBtn]}
            onPress={goBack}
            disabled={isProcessing}>
            <Text style={localStyles.cancelText}>
              {t('common.cancel') || 'Cancel'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              localStyles.btn,
              localStyles.createBtn,
              isProcessing && {opacity: 0.6},
            ]}
            onPress={handleCreate}
            disabled={isProcessing}>
            {isProcessing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={localStyles.createText}>
                {t('common.create') || 'Create'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* ── Payment Date Calendar ── */}
      <CalendarModal
        visible={showPaymentDateCalendar}
        initialDate={formData.RequestedPaymentDate || todayISO}
        onDateSelected={handlePaymentDateChange}
        onClose={() => setShowPaymentDateCalendar(false)}
      />

      {/* ── Alert ── */}
      <AlertModal
        visible={alertModal}
        heading={t('common.alert') || 'Alert'}
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />
    </ActionPaneContainer>
  );
};

const localStyles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  btn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: '#ccc',
  },
  cancelText: {
    fontSize: 15,
    color: '#555',
    fontWeight: '500',
  },
  createBtn: {
    backgroundColor: '#0A66C2',
  },
  createText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
});

export default EmployeeAdvanceSalary_Create;
