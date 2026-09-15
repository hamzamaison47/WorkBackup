/* eslint-disable curly */
/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */

import React, {useState, useCallback, useRef, useEffect} from 'react';

import {
  View,
  Text,
  TextInput,
  SafeAreaView,
  ScrollView,
  BackHandler,
  Platform,
  ActivityIndicator,
  I18nManager,
} from 'react-native';

import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';

import {useSelector} from 'react-redux';
import {Dropdown} from 'react-native-element-dropdown';
import Icon from 'react-native-vector-icons/FontAwesome';

import ActionPaneContainer from '../../components/ActionPaneContainer';
import AlertModal from '../../components/Alert/AlertModal';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';

// ✅ Import SaveRecordButtons and BUTTON_TYPES exactly like LeaveRequestSaveRecord
import SaveRecordButtons, {
  BUTTON_TYPES,
} from '../../components/Buttons/SaveRecordButtons';

import styles from '../../styles/styles';

import {CreateEncashment} from '../../API/LeaveEncashment/CreateEncashment';
import {RetrieveEntitlementCode} from '../../API/LeaveEncashment/RetrieveEntitlementCode';
import {GetBalanceBeforeApplication} from '../../API/LeaveEncashment/GetBalanceBefore';
import brand from '../../theme/brand';

const LeaveEncashment_SaveRecord = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const userData = useSelector(state => state.user.userData);
  const isRTL = useSelector(state => state.language.isRTL);

  const routeUserData = route.params?.userData;
  const effectiveUserData = routeUserData || userData || {};

  const employeeId =
    route.params?.employeeId || effectiveUserData?.employeeId || '';

  const employeeName =
    route.params?.employeeName || effectiveUserData?.employeeName || '';

  const today = new Date().toISOString().split('T')[0];

  const [entitlementOptions, setEntitlementOptions] = useState([]);

  const [formData, setFormData] = useState({
    EmployeeId: employeeId,
    RequestDate: today,
    EntitlementCode: '',
    BalanceBeforeApplication: '',
    LeavesToEncashed: '',
    RemainingBalance: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // ✅ processingButton state — same pattern as LeaveRequestSaveRecord
  const [processingButton, setProcessingButton] = useState('');

  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // =========================
  // LOAD ENTITLEMENTS
  // =========================
  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const result = await RetrieveEntitlementCode(employeeId);
        const formatted = (result || []).map(i => ({
          label: i.EntitlementCode,
          value: i.EntitlementCode,
        }));
        setEntitlementOptions(formatted);
      } catch (e) {
        setAlertMessage('Failed to load entitlement codes');
        setAlertModal(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (employeeId) load();
  }, [employeeId]);

  // =========================
  // BALANCE API
  // =========================
  const fetchBalance = async entitlementCode => {
    try {
      const result = await GetBalanceBeforeApplication(
        employeeId,
        entitlementCode,
      );
      const balance = result?.BalanceBeforeApplication ?? '';
      setFormData(prev => ({
        ...prev,
        BalanceBeforeApplication: String(balance),
        LeavesToEncashed: '',
        RemainingBalance: '',
      }));
    } catch (e) {
      console.log('fetchBalance error:', e);
    }
  };

  // =========================
  // HANDLERS
  // =========================
  const onSelectEntitlement = item => {
    setFormData(prev => ({...prev, EntitlementCode: item.value}));
    fetchBalance(item.value);
  };

  const onLeavesChange = value => {
    const balance = parseFloat(formData.BalanceBeforeApplication) || 0;
    const leaves = parseFloat(value) || 0;
    const remaining = balance - leaves;

    setFormData(prev => ({
      ...prev,
      LeavesToEncashed: value,
      RemainingBalance:
        value === '' ? '' : remaining >= 0 ? String(remaining) : '0',
    }));
  };

  const formatDate = date => {
    const d = new Date(date);
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(
      d.getDate(),
    ).padStart(2, '0')}/${d.getFullYear()}`;
  };

  // =========================
  // CREATE
  // ✅ Matches handleSave pattern from LeaveRequestSaveRecord
  // =========================
  const handleSave = async actionType => {
    if (processingButton) return;

    if (!formData.EntitlementCode || !formData.LeavesToEncashed) {
      setAlertMessage('Please fill all required fields');
      setAlertModal(true);
      return;
    }

    const balance = parseFloat(formData.BalanceBeforeApplication) || 0;
    const leaves = parseFloat(formData.LeavesToEncashed) || 0;

    if (leaves <= 0) {
      setAlertMessage('Leaves to be encashed must be greater than 0');
      setAlertModal(true);
      return;
    }

    if (leaves > balance) {
      setAlertMessage('Leaves to be encashed cannot exceed balance');
      setAlertModal(true);
      return;
    }

    setProcessingButton(actionType);
    setIsProcessing(true);

    try {
      const payload = {
        BalanceBeforeApplication: formData.BalanceBeforeApplication,
        Department: '',
        Description: '',
        EarningAmount: '0',
        EmployeeId: formData.EmployeeId,
        EmployeeName: employeeName,
        EntitlementCode: formData.EntitlementCode,
        LastEncashmentDate: '1900-01-01T12:00:00',
        LastEncashmentLeave: '0',
        LeavesToEncashed: formData.LeavesToEncashed,
        RecId: '0',
        RemainingBalance: formData.RemainingBalance,
        RequestDate: `${formData.RequestDate}T12:00:00`,
        RequestId: '',
        WFStatus: 'Draft',
      };

      console.log('Creating with payload:', JSON.stringify(payload, null, 2));

      const res = await CreateEncashment({encashmentData: payload});

      console.log('CreateEncashment response:', JSON.stringify(res, null, 2));

      if (String(res?.IsSuccess).toLowerCase() === 'true') {
        setAlertMessage(res?.Message || 'Record Created Successfully');
        setAlertModal(true);
        setTimeout(() => navigation.goBack(), 1500);
      } else {
        setAlertMessage(
          res?.Message || 'Failed to create record. Please try again.',
        );
        setAlertModal(true);
      }
    } catch (e) {
      console.log('handleSave error:', e);
      setAlertMessage('Error occurred while creating record');
      setAlertModal(true);
    } finally {
      setProcessingButton('');
      setIsProcessing(false);
    }
  };

  const goBack = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('LeaveEncashment_ListPage');
  }, [navigation]);

  return (
    <ActionPaneContainer
      pageTitle="Create Leave Encashment"
      isBackButton
      onBackPress={goBack}>
      {isLoading ? (
        <CustomIndicator />
      ) : (
        <SafeAreaView style={styles.DSR_SafeArea}>
          {isProcessing && (
            <View style={styles.DSR_ProcessingOverlay}>
              <ActivityIndicator size="large" />
              <Text>Processing...</Text>
            </View>
          )}

          <ScrollView contentContainerStyle={styles.DSR_FormContainer}>
            <Text style={styles.DSR_Label}>Employee Id</Text>
            <Text style={styles.DSR_Input}>{formData.EmployeeId}</Text>

            <Text style={styles.DSR_Label}>Request Date</Text>
            <Text style={styles.DSR_Input}>
              {formatDate(formData.RequestDate)}
            </Text>

            <View style={{zIndex: 1000, marginBottom: 10}}>
              <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
                Entitlement Code *
              </Text>
              <Dropdown
                style={[styles.DSR_Input, isRTL && {textAlign: 'left'}]}
                data={entitlementOptions}
                labelField="label"
                valueField="value"
                placeholder="Select item"
                value={formData.EntitlementCode}
                onChange={onSelectEntitlement}
                activeColor={brand.tint}
                containerStyle={[
                  styles.DSR_DropdownContainer,
                  {marginTop: Platform.OS === 'ios' ? 5 : 2},
                ]}
                itemContainerStyle={styles.DSR_DropdownItemContainer}
                placeholderStyle={[
                  styles.DSR_DropdownPlaceholder,
                  isRTL && {textAlign: 'left'},
                ]}
                selectedTextStyle={[
                  styles.DSR_DropdownSelectedText,
                  isRTL && {textAlign: 'left'},
                ]}
                itemTextStyle={[
                  styles.DSR_DropdownItemText,
                  isRTL && {textAlign: 'left'},
                ]}
                maxHeight={280}
                search
                searchPlaceholder="Search entitlement"
                inputSearchStyle={[
                  styles.DSR_DropdownSearchInput,
                  isRTL && {textAlign: 'right'},
                ]}
                keyboardAvoiding
                dropdownPosition="auto"
                renderRightIcon={() => (
                  <Icon
                    name="chevron-down"
                    size={12}
                    color="#8b8b8b"
                    style={{marginHorizontal: 8}}
                  />
                )}
              />
            </View>

            <Text style={styles.DSR_Label}>Balance Before Application</Text>
            <Text style={styles.DSR_Input}>
              {formData.BalanceBeforeApplication}
            </Text>

            <Text style={styles.DSR_Label}>Leaves to be Encashed *</Text>
            <TextInput
              style={styles.DSR_Input}
              value={formData.LeavesToEncashed}
              onChangeText={onLeavesChange}
              keyboardType="numeric"
            />

            <Text style={styles.DSR_Label}>Remaining Balance</Text>
            <Text style={styles.DSR_Input}>{formData.RemainingBalance}</Text>
          </ScrollView>

          {/* ✅ Exact same pattern as LeaveRequestSaveRecord without workflow —
               showButtons hides Submit, keeps Create + Cancel with matching design */}
          <SaveRecordButtons
            mode="create"
            processingButton={processingButton}
            onSave={handleSave}
            onCancel={goBack}
            isDisabled={processingButton === 'create'}
            showButtons={[BUTTON_TYPES.CREATE, BUTTON_TYPES.CANCEL]}
          />
        </SafeAreaView>
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

export default LeaveEncashment_SaveRecord;
