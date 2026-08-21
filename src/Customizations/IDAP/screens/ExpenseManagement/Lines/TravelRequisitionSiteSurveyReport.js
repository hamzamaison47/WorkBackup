// export default TravelRequisitionSiteSurveyReport;
/* eslint-disable curly */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
// Editable Site Survey Report form. Opened from
// ExpenseManagementLinesListPage's "Site Survey Report" link, scoped to the
// current expense report (ExpNumber). Loads any existing survey via
// RetrieveSiteSurveyByExpense; Save writes via CreateSiteSurvey.
import React, {useCallback, useMemo, useState} from 'react';
import {
  Text,
  ScrollView,
  View,
  Image,
  TextInput,
  TouchableOpacity,
  BackHandler,
  ActivityIndicator,
  Modal,
  StyleSheet,
} from 'react-native';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import {RetrieveSiteSurveyByExpense} from '../../../API/SiteSurveyReport/retrieveSiteSurveryReport';
import {CreateSiteSurvey} from '../../../API/SiteSurveyReport/CreateSiteSurvey';

import AlertModal from '../../../../../components/Alert/AlertModal';
import useAlertModal from '../../../../../hooks/useAlertModal';
import ActionPaneContainer from '../../../../../components/ActionPaneContainer';
import CustomIndicator from '../../../../../components/CustomIndicator/CustomIndicator';
import CalendarModal from '../../../../../components/Leaves/CalendarModal';
import DynamicAttachmentModal from '../../../../../shared/DynamicAttachmentModal';
import useNotify from '../../../../../hooks/useNotify';
import useAppTokens from '../../../../../components/AppComponentsDesign/useAppTokens';
import {
  conditionalScale,
  conditionalVerticalScale,
  conditionalFontScale,
  borderRadius,
} from '../../../../../store/utils/scaling';
import {useSelector} from 'react-redux';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';

// ── Logo asset ────────────────────────────────────────────────────────────
let SITE_SURVEY_LOGO = null;
try {
  // eslint-disable-next-line global-require
  SITE_SURVEY_LOGO = require('../../../../../assets/IDAPLogoForSiteSurveyReport.png');
} catch (e) {
  SITE_SURVEY_LOGO = null;
}

// ── Attachment table name (mirrors PREmployeeLeaveRequest pattern used by
// the Leave Request module) ────────────────────────────────────────────────
const SITE_SURVEY_ATTACHMENT_TABLE = 'MCSHD_TrvSiteSurveyForm';

// ── Date helpers — module scope, no closures needed ────────────────────────
// Display formatter for the read-only field (dd/mm/yyyy)
const formatDate = value => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return null;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// CalendarModal speaks "YYYY-MM-DD" strings on both sides (initialDate prop,
// onDateSelected callback). Parse that as LOCAL date components (not via
// `new Date(string)`, which treats a bare YYYY-MM-DD as UTC midnight and can
// shift the day depending on timezone/Hermes quirks — the same class of bug
// noted elsewhere as parseLocalDateTimeString/toLocalDateTimeString).
const parseYMD = dateString => {
  if (!dateString) return null;
  const datePart = dateString.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  return isNaN(date.getTime()) ? null : date;
};

// Convert our stored Date (or date-ish value) into the "YYYY-MM-DD" string
// CalendarModal's initialDate prop expects.
const toYMD = value => {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return undefined;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// ── Themed styles factory — mirrors the getDSRStyles pattern in styles.js ──
const createStyles = tokens =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: tokens.pageBg,
    },
    logoHeader: {
      alignItems: 'center',
      paddingTop: conditionalVerticalScale(14, 16, 18, 20),
      paddingBottom: conditionalVerticalScale(10, 12, 14, 16),
    },
    logoImage: {
      width: conditionalScale(120, 130, 140, 150),
      height: conditionalVerticalScale(44, 48, 52, 56),
    },
    scrollContent: {
      paddingHorizontal: conditionalScale(14, 16, 18, 20),
      paddingTop: conditionalVerticalScale(2, 4, 6, 8),
      paddingBottom: conditionalVerticalScale(96, 100, 106, 112),
    },
    card: {
      backgroundColor: tokens.cardBg,
      borderRadius: borderRadius.lg,
      padding: conditionalScale(14, 16, 18, 20),
      marginBottom: conditionalVerticalScale(12, 14, 16, 18),
      borderWidth: 1,
      borderColor: tokens.cardDivider,
      shadowColor: tokens.shadowColor,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: conditionalVerticalScale(12, 13, 14, 16),
    },
    sectionIconBadge: {
      width: conditionalScale(28, 30, 32, 34),
      height: conditionalScale(28, 30, 32, 34),
      borderRadius: conditionalScale(8, 9, 10, 10),
      backgroundColor: tokens.blueBg,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: conditionalScale(9, 10, 11, 12),
    },
    sectionTitle: {
      fontSize: conditionalFontScale(14, 14.5, 15, 15.5),
      fontWeight: '700',
      color: tokens.titleText,
      letterSpacing: 0.2,
    },
    refStrip: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      backgroundColor: tokens.pageBg,
      borderRadius: borderRadius.md,
      paddingVertical: conditionalVerticalScale(10, 11, 12, 13),
      paddingHorizontal: conditionalScale(12, 13, 14, 15),
      marginBottom: conditionalVerticalScale(16, 17, 18, 20),
    },
    refItem: {
      minWidth: '33%',
      marginBottom: conditionalVerticalScale(6, 7, 8, 8),
      paddingRight: conditionalScale(8, 10, 10, 12),
    },
    refLabel: {
      fontSize: conditionalFontScale(9.5, 10, 10.5, 11),
      fontWeight: '600',
      color: tokens.subtitleText,
      letterSpacing: 0.3,
      textTransform: 'uppercase',
      marginBottom: 2,
    },
    refValue: {
      fontSize: conditionalFontScale(12.5, 13, 13.5, 14),
      fontWeight: '600',
      color: tokens.titleText,
    },
    fieldRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    fieldCol: {
      width: '31%',
    },
    fieldRow2: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    fieldCol2: {
      width: '48%',
    },
    fieldGroup: {
      marginBottom: conditionalVerticalScale(12, 13, 14, 16),
    },
    fieldLabel: {
      fontSize: conditionalFontScale(10.5, 11, 11.5, 12),
      fontWeight: '600',
      color: tokens.subtitleText,
      marginBottom: conditionalVerticalScale(4, 5, 5, 6),
      letterSpacing: 0.3,
      textTransform: 'uppercase',
    },
    lockedBox: {
      borderWidth: 1,
      borderColor: tokens.disabledBorder,
      borderRadius: borderRadius.md,
      backgroundColor: tokens.disabledBg,
      paddingVertical: conditionalVerticalScale(9, 10, 10, 11),
      paddingHorizontal: conditionalScale(11, 12, 12, 13),
    },
    lockedText: {
      fontSize: conditionalFontScale(13, 13.5, 14, 14),
      fontWeight: '500',
      color: tokens.disabledText,
    },
    inputBox: {
      borderWidth: 1,
      borderColor: tokens.inputBorder,
      borderRadius: borderRadius.md,
      backgroundColor: tokens.inputBg,
      paddingHorizontal: conditionalScale(11, 12, 12, 13),
    },
    inputBoxSingle: {
      paddingVertical: 2,
    },
    inputBoxMultiline: {
      paddingVertical: conditionalVerticalScale(9, 10, 10, 11),
    },
    inputText: {
      fontSize: conditionalFontScale(13, 13.5, 14, 14),
      fontWeight: '500',
      color: tokens.inputText,
    },
    inputTextSingle: {
      paddingVertical: conditionalVerticalScale(9, 10, 10, 11),
    },
    inputTextMultiline: {
      paddingVertical: 0,
      textAlignVertical: 'top',
      minHeight: conditionalVerticalScale(56, 60, 64, 68),
    },
    dateField: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: tokens.inputBorder,
      borderRadius: borderRadius.md,
      backgroundColor: tokens.inputBg,
      paddingVertical: conditionalVerticalScale(9, 10, 10, 11),
      paddingHorizontal: conditionalScale(11, 12, 12, 13),
    },
    dateText: {
      fontSize: conditionalFontScale(13, 13.5, 14, 14),
      fontWeight: '500',
    },
    toggleRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    togglePill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: conditionalVerticalScale(7, 8, 8, 9),
      paddingHorizontal: conditionalScale(11, 12, 12, 13),
      borderRadius: borderRadius.full,
      marginRight: conditionalScale(7, 8, 8, 9),
      marginBottom: conditionalVerticalScale(7, 8, 8, 9),
      borderWidth: 1,
    },
    togglePillText: {
      fontSize: conditionalFontScale(11.5, 12, 12.5, 13),
      fontWeight: '600',
    },
    saveBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: tokens.cardBg,
      paddingHorizontal: conditionalScale(14, 16, 18, 20),
      paddingTop: conditionalVerticalScale(10, 12, 12, 14),
      paddingBottom: conditionalVerticalScale(20, 22, 24, 26),
      borderTopWidth: 1,
      borderTopColor: tokens.cardDivider,
    },
    // Row that holds Cancel / Attachment / Save side-by-side.
    saveBarRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
    },
    cancelButton: {
      flex: 1,
      marginRight: conditionalScale(8, 9, 10, 10),
      borderRadius: borderRadius.lg,
      paddingVertical: conditionalVerticalScale(13, 14, 14, 15),
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: tokens.inputBorder,
      backgroundColor: tokens.cardBg,
    },
    cancelButtonText: {
      fontSize: conditionalFontScale(13, 13.5, 14, 14),
      fontWeight: '700',
      color: tokens.subtitleText,
    },
    attachmentButton: {
      flex: 1,
      flexDirection: 'row',
      marginRight: conditionalScale(8, 9, 10, 10),
      borderRadius: borderRadius.lg,
      paddingVertical: conditionalVerticalScale(13, 14, 14, 15),
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: tokens.blue,
      backgroundColor: tokens.blueBg,
    },
    attachmentButtonText: {
      fontSize: conditionalFontScale(13, 13.5, 14, 14),
      fontWeight: '700',
      color: tokens.blue,
      marginLeft: conditionalScale(6, 6, 7, 7),
    },
    saveButton: {
      flex: 1,
      backgroundColor: tokens.blue,
      borderRadius: borderRadius.lg,
      paddingVertical: conditionalVerticalScale(13, 14, 14, 15),
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveButtonDisabled: {
      opacity: 0.7,
    },
    saveButtonText: {
      fontSize: conditionalFontScale(14, 14.5, 15, 15.5),
      fontWeight: '700',
      color: tokens.onPrimary || '#FFFFFF',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    processingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: tokens.overlayBg,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
    },
    processingCard: {
      backgroundColor: tokens.cardBg,
      borderRadius: borderRadius.xl,
      paddingVertical: conditionalVerticalScale(22, 24, 26, 28),
      paddingHorizontal: conditionalScale(28, 30, 32, 36),
      alignItems: 'center',
      minWidth: conditionalScale(160, 170, 180, 190),
      borderWidth: 1,
      borderColor: tokens.cardDivider,
    },
    processingText: {
      marginTop: conditionalVerticalScale(10, 11, 12, 13),
      fontSize: conditionalFontScale(14, 14.5, 15, 15.5),
      fontWeight: '600',
      color: tokens.titleText,
    },
  });

// ────────────────────────────────────────────────────────────────────────
// Building-block components — ALL defined at MODULE scope (outside the
// screen component). This is what actually fixes the keyboard-dismiss bug:
// if these were defined inside the component body, React would treat them
// as a brand-new component type on every keystroke (since `form` state
// changing triggers a re-render, which redefines the function), forcing
// TextInput to unmount/remount and drop focus. Defining them here means
// their identity is stable across every render, so focus is preserved.
//
// Because they're outside, they can no longer close over `tokens`/`styles`/
// `form` from the screen — everything they need is passed in as props.
// ────────────────────────────────────────────────────────────────────────

const LogoHeader = ({styles}) =>
  SITE_SURVEY_LOGO ? (
    <View style={styles.logoHeader}>
      <Image
        source={SITE_SURVEY_LOGO}
        style={styles.logoImage}
        resizeMode="contain"
      />
    </View>
  ) : null;

const Card = ({children, style, styles}) => (
  <View style={[styles.card, style]}>{children}</View>
);

const SectionHeader = ({title, icon, styles, tokens}) => (
  <View style={styles.sectionHeaderRow}>
    <View style={styles.sectionIconBadge}>
      <Ionicons name={icon} size={16} color={tokens.blue} />
    </View>
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

// Read-only display box for locked fields (ExpNumber, Travel Req, Designation)
const FieldBoxLocked = ({label, value, styles}) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={styles.lockedBox}>
      <Text numberOfLines={1} style={styles.lockedText}>
        {value || 'N/A'}
      </Text>
    </View>
  </View>
);

// Editable text input styled to match the FieldBox look
const FieldInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  styles,
  tokens,
}) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View
      style={[
        styles.inputBox,
        multiline ? styles.inputBoxMultiline : styles.inputBoxSingle,
      ]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || 'Enter value'}
        placeholderTextColor={tokens.placeholderText}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        style={[
          styles.inputText,
          multiline ? styles.inputTextMultiline : styles.inputTextSingle,
        ]}
      />
    </View>
  </View>
);

// Date picker field — tap opens CalendarModal.
const DateField = ({label, value, onPress, styles, tokens}) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.dateField}>
      <Text
        style={[
          styles.dateText,
          {color: value ? tokens.inputText : tokens.placeholderText},
        ]}>
        {value ? formatDate(value) : 'Select date'}
      </Text>
      <Ionicons name="calendar-outline" size={16} color={tokens.subtitleText} />
    </TouchableOpacity>
  </View>
);

// Tappable toggle chip — enabled, drives form state via onToggle callback.
const TogglePill = ({label, fieldKey, isYes, onToggle, styles, tokens}) => (
  <TouchableOpacity
    onPress={() => onToggle(fieldKey)}
    activeOpacity={0.7}
    style={[
      styles.togglePill,
      {
        backgroundColor: isYes ? tokens.blueBg : tokens.disabledBg,
        borderColor: isYes ? tokens.blue : tokens.disabledBorder,
      },
    ]}>
    <Ionicons
      name={isYes ? 'checkmark-circle' : 'close-circle-outline'}
      size={14}
      color={isYes ? tokens.blue : tokens.subtitleText}
      style={{marginRight: 6}}
    />
    <Text
      style={[
        styles.togglePillText,
        {color: isYes ? tokens.titleText : tokens.subtitleText},
      ]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const PURPOSE_TOGGLES = [
  {label: 'Site Visit', key: 'isSiteVisit'},
  {label: 'Site Meeting', key: 'isSiteMeeting'},
  {label: 'Site Survey', key: 'isSiteSurvey'},
  {label: 'Progress Review', key: 'isProgressReview'},
  {label: 'Safety Inspection', key: 'isSafetyInspection'},
  {label: 'Site Inspection', key: 'isSiteInspection'},
  {label: 'Other', key: 'isOther'},
];

// The full scrollable form body — also module scope, taking everything it
// needs (form values + setField/toggleField callbacks) as props.
const SurveyForm = ({
  styles,
  tokens,
  expenseNumber,
  surveyData,
  form,
  setField,
  toggleField,
  onOpenCalendar,
}) => (
  <KeyboardAwareScrollView
    contentContainerStyle={styles.scrollContent}
    showsVerticalScrollIndicator={false}
    keyboardShouldPersistTaps="handled"
    enableOnAndroid={true}
    enableAutomaticScroll={true}
    extraScrollHeight={20}
    extraHeight={120}
    keyboardOpeningTime={0}>
    {/* ── General ── */}
    <Card styles={styles}>
      <SectionHeader
        title="General"
        icon="information-circle-outline"
        styles={styles}
        tokens={tokens}
      />
      <FieldBoxLocked label="Exp No" value={expenseNumber} styles={styles} />
      <DateField
        label="Survey Date"
        value={form.surveyDate}
        onPress={onOpenCalendar}
        styles={styles}
        tokens={tokens}
      />
      <FieldInput
        label="Project Name *"
        value={form.projectName}
        onChangeText={v => setField('projectName', v)}
        styles={styles}
        tokens={tokens}
      />
      <FieldBoxLocked
        label="Travel Req."
        value={surveyData?.TravelRequisitionId}
        styles={styles}
      />
      <FieldInput
        label="Location *"
        value={form.location}
        onChangeText={v => setField('location', v)}
        styles={styles}
        tokens={tokens}
      />
      <FieldBoxLocked
        label="Designation"
        value={surveyData?.Designation}
        styles={styles}
      />
    </Card>

    {/* ── Purpose of Visit ── */}
    <Card styles={styles}>
      <SectionHeader
        title="Purpose of Visit"
        icon="flag-outline"
        styles={styles}
        tokens={tokens}
      />
      <View style={styles.toggleRow}>
        {PURPOSE_TOGGLES.map(item => (
          <TogglePill
            key={item.key}
            label={item.label}
            fieldKey={item.key}
            isYes={form[item.key] === 'Yes'}
            onToggle={toggleField}
            styles={styles}
            tokens={tokens}
          />
        ))}
      </View>
      {form.isOther === 'Yes' && (
        <FieldInput
          label="Other Description"
          value={form.isOtherYesDescription}
          onChangeText={v => setField('isOtherYesDescription', v)}
          multiline
          styles={styles}
          tokens={tokens}
        />
      )}
      <FieldInput
        label="Inspection Status *"
        value={form.inspectionStatus}
        onChangeText={v => setField('inspectionStatus', v)}
        styles={styles}
        tokens={tokens}
      />
      <FieldInput
        label="Reason *"
        value={form.reason}
        onChangeText={v => setField('reason', v)}
        multiline
        styles={styles}
        tokens={tokens}
      />
    </Card>

    {/* ── Meeting Details ── */}
    <Card styles={styles}>
      <SectionHeader
        title="Meeting Details"
        icon="people-outline"
        styles={styles}
        tokens={tokens}
      />
      <FieldInput
        label="Agenda of Meeting *"
        value={form.agendaOfMeeting}
        onChangeText={v => setField('agendaOfMeeting', v)}
        multiline
        styles={styles}
        tokens={tokens}
      />
      <FieldInput
        label="Points of Discussion *"
        value={form.pointsOfDiscussion}
        onChangeText={v => setField('pointsOfDiscussion', v)}
        multiline
        styles={styles}
        tokens={tokens}
      />
      <FieldInput
        label="Conclusions *"
        value={form.conclusions}
        onChangeText={v => setField('conclusions', v)}
        multiline
        styles={styles}
        tokens={tokens}
      />
    </Card>

    {/* ── Team Information ── */}
    <Card style={{marginBottom: 4}} styles={styles}>
      <SectionHeader
        title="Team Information"
        icon="business-outline"
        styles={styles}
        tokens={tokens}
      />
      <FieldInput
        label="Contractor / Company *"
        value={form.contractorCompany}
        onChangeText={v => setField('contractorCompany', v)}
        styles={styles}
        tokens={tokens}
      />
      <FieldInput
        label="Representative Name *"
        value={form.representativeName}
        onChangeText={v => setField('representativeName', v)}
        styles={styles}
        tokens={tokens}
      />
      <FieldInput
        label="Team Designation *"
        value={form.teamDesignation}
        onChangeText={v => setField('teamDesignation', v)}
        styles={styles}
        tokens={tokens}
      />
    </Card>
  </KeyboardAwareScrollView>
);

const TravelRequisitionSiteSurveyReport = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const tokens = useAppTokens();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const {showError, showSuccess, showWarning, alertModalProps} =
    useAlertModal();
  const {notifySuccess, notifyError} = useNotify('Site Survey Report');

  const reduxUserData = useSelector(state => state.user.userData);

  const {
    expenseNumber,
    headerRecId,
    approvalStatus, // ← add this
    personnelNumber,
    workerRecId,
    legalEntity,
    userData,
    cameFrom,
    originalCameFrom,
  } = route.params || {};

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [surveyData, setSurveyData] = useState(null);
  const [existingRecId, setExistingRecId] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);
  // Attachment modal visibility — mirrors LeaveRequestListPage's
  // attachmentModalVisible/selectedLeaveItem pattern.
  const [attachmentModalVisible, setAttachmentModalVisible] = useState(false);

  // Editable form state — locked fields (ExpenseNumber, TravelRequisitionId,
  // Designation) still come from the caller record and are NOT editable here,
  // same as the D365 form's initValue()-driven lock.
  const [form, setForm] = useState({
    surveyDate: null,
    projectName: '',
    location: '',
    isSiteVisit: 'No',
    isSiteMeeting: 'No',
    isSiteSurvey: 'No',
    isProgressReview: 'No',
    isSafetyInspection: 'No',
    isSiteInspection: 'No',
    isOther: 'No',
    isOtherYesDescription: '',
    inspectionStatus: '',
    reason: '',
    agendaOfMeeting: '',
    pointsOfDiscussion: '',
    conclusions: '',
    contractorCompany: '',
    representativeName: '',
    teamDesignation: '',
  });

  const setField = useCallback(
    (key, value) => setForm(prev => ({...prev, [key]: value})),
    [],
  );
  const toggleField = useCallback(
    key =>
      setForm(prev => ({...prev, [key]: prev[key] === 'Yes' ? 'No' : 'Yes'})),
    [],
  );

  const fetchSurveyData = useCallback(async () => {
    if (!expenseNumber) {
      setIsLoading(false);
      return;
    }

    try {
      const result = await RetrieveSiteSurveyByExpense({expenseNumber});
      const record = result && result.length > 0 ? result[0] : null;

      const resolvedDesignation =
        record?.Designation || reduxUserData?.PositionDescription || '';
      setSurveyData(
        record
          ? {...record, Designation: resolvedDesignation}
          : {Designation: resolvedDesignation, TravelRequisitionId: ''},
      );

      if (record) {
        setExistingRecId(record.RecId || 0);
        setForm({
          Designation: reduxUserData?.PositionDescription || '',
          TravelRequisitionId: '', // still needs the header param fix discussed earli
          surveyDate: record.SurveyDate ? new Date(record.SurveyDate) : null,
          projectName: record.ProjectName || '',
          location: record.Location || '',
          isSiteVisit: record.IsSiteVisit || 'No',
          isSiteMeeting: record.IsSiteMeeting || 'No',
          isSiteSurvey: record.IsSiteSurvey || 'No',
          isProgressReview: record.IsProgressReview || 'No',
          isSafetyInspection: record.IsSafetyInspection || 'No',
          isSiteInspection: record.IsSiteInspection || 'No',
          isOther: record.IsOther || 'No',
          isOtherYesDescription: record.IsOtherYesDescription || '',
          inspectionStatus: record.InspectionStatus || '',
          reason: record.Reason || '',
          agendaOfMeeting: record.AgendaOfMeeting || '',
          pointsOfDiscussion: record.PointsOfDiscussion || '',
          conclusions: record.Conclusions || '',
          contractorCompany: record.ContractorCompany || '',
          representativeName: record.RepresentativeName || '',
          teamDesignation: record.TeamDesignation || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch Site Survey Report:', error);
      showError('Failed to fetch Site Survey Report');
    } finally {
      setIsLoading(false);
    }
  }, [expenseNumber]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchSurveyData();
    }, [fetchSurveyData]),
  );

  const handleGoBack = useCallback(() => {
    navigation.navigate('ExpenseManagementLinesListPage', {
      headerRecId,
      expenseNumber,
      approvalStatus, // ← add this
      forceShowAddButton: true, // ← add this, matching the pattern goBack in
      //    ExpenseManagementLineSaveRecord already uses
      personnelNumber,
      workerRecId,
      legalEntity,
      userData,
      cameFrom: originalCameFrom || cameFrom || 'DrawerNavigator',
    });
  }, [
    navigation,
    headerRecId,
    expenseNumber,
    approvalStatus, // ← add to deps
    personnelNumber,
    workerRecId,
    legalEntity,
    userData,
    cameFrom,
    originalCameFrom,
  ]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleGoBack();
        return true;
      };
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [handleGoBack]),
  );

  // Cancel button — same destination/params as the hardware back handler, so
  // Cancel and back behave identically and no unsaved-changes prompt is
  // introduced beyond what already existed.
  const handleCancel = useCallback(() => {
    handleGoBack();
  }, [handleGoBack]);

  // Attachment button — record has to exist in D365 first (needs a RecId),
  // same constraint the Leave list enforces implicitly by only ever opening
  // the modal against an already-saved leave row.
  const handleAttachmentPress = useCallback(() => {
    if (!existingRecId) {
      showWarning(
        'Please save the Site Survey Report before adding attachments.',
      );
      return;
    }
    setAttachmentModalVisible(true);
  }, [existingRecId, showWarning]);

  const handleSave = async () => {
    const missing = [];

    if (!form.surveyDate) missing.push('Survey Date');
    if (!form.projectName.trim()) missing.push('Project Name');
    if (!form.location.trim()) missing.push('Location');
    if (!form.inspectionStatus.trim()) missing.push('Inspection Status');
    if (!form.reason.trim()) missing.push('Reason');
    if (!form.agendaOfMeeting.trim()) missing.push('Agenda of Meeting');
    if (!form.pointsOfDiscussion.trim()) missing.push('Points of Discussion');
    if (!form.conclusions.trim()) missing.push('Conclusions');
    if (!form.contractorCompany.trim()) missing.push('Contractor / Company');
    if (!form.representativeName.trim()) missing.push('Representative Name');
    if (!form.teamDesignation.trim()) missing.push('Team Designation');

    // Conditional on the "Other" toggle, same as before — not a toggle itself.
    if (form.isOther === 'Yes' && !form.isOtherYesDescription.trim()) {
      missing.push('Other Description');
    }

    if (missing.length > 0) {
      showWarning(
        `Please fill the following required fields:\n${missing.join('\n')}`,
      );
      return;
    }

    setIsSaving(true);

    try {
      const result = await CreateSiteSurvey({
        agendaOfMeeting: form.agendaOfMeeting,
        conclusions: form.conclusions,
        contractorCompany: form.contractorCompany,
        designation: surveyData?.Designation || '',
        expenseNumber,
        inspectionStatus: form.inspectionStatus,
        isOther: form.isOther,
        isOtherYesDescription: form.isOtherYesDescription,
        isProgressReview: form.isProgressReview,
        isSafetyInspection: form.isSafetyInspection,
        isSiteInspection: form.isSiteInspection,
        isSiteMeeting: form.isSiteMeeting,
        isSiteSurvey: form.isSiteSurvey,
        isSiteVisit: form.isSiteVisit,
        location: form.location,
        otherPurpose: '',
        pointsOfDiscussion: form.pointsOfDiscussion,
        projectName: form.projectName,
        purposeOfVisit: '',
        reason: form.reason,
        recId: existingRecId,
        representativeName: form.representativeName,
        surveyDate: form.surveyDate,
        tableId: surveyData?.TableId || 0,
        teamDesignation: form.teamDesignation,
        travelRequisitionId: surveyData?.TravelRequisitionId || '',
      });

      if (result.IsSuccess) {
        notifySuccess(result.Message || 'Site Survey saved successfully.');
        showSuccess(result.Message || 'Site Survey saved successfully.');
        fetchSurveyData();
      } else {
        notifyError(result.Message || 'Failed to save Site Survey.');
        showError(result.Message || 'Failed to save Site Survey.');
      }
    } catch (error) {
      console.error('Save Site Survey error:', error);
      notifyError('Failed to save Site Survey. Please try again.');
      showError('Failed to save Site Survey. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ActionPaneContainer
      pageTitle="Site Survey Report"
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive
      onBackPress={handleGoBack}
      showPageTitleRow={true}
      showSearchBar={false}>
      <View style={styles.screen}>
        <LogoHeader styles={styles} />
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <CustomIndicator />
          </View>
        ) : (
          <SurveyForm
            styles={styles}
            tokens={tokens}
            expenseNumber={expenseNumber}
            surveyData={surveyData}
            form={form}
            setField={setField}
            toggleField={toggleField}
            onOpenCalendar={() => setShowCalendar(true)}
          />
        )}

        {/* Sticky bottom bar: Cancel / Attachment / Save */}
        {!isLoading && (
          <View style={styles.saveBar}>
            <View style={styles.saveBarRow}>
              <TouchableOpacity
                onPress={handleCancel}
                activeOpacity={0.8}
                disabled={isSaving}
                style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAttachmentPress}
                activeOpacity={0.8}
                disabled={isSaving}
                style={styles.attachmentButton}>
                <Ionicons name="attach-outline" size={16} color={tokens.blue} />
                <Text style={styles.attachmentButtonText}>Attachment</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSave}
                activeOpacity={0.8}
                disabled={isSaving}
                style={[
                  styles.saveButton,
                  isSaving && styles.saveButtonDisabled,
                ]}>
                {isSaving ? (
                  <ActivityIndicator
                    size="small"
                    color={tokens.onPrimary || '#FFFFFF'}
                  />
                ) : (
                  <Text style={styles.saveButtonText}>Save Survey</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Date picker */}
      <CalendarModal
        visible={showCalendar}
        onClose={() => setShowCalendar(false)}
        initialDate={toYMD(form.surveyDate)}
        onDateSelected={dateString => {
          setField('surveyDate', parseYMD(dateString));
        }}
      />

      {/* Attachment Modal — same component/contract as the Leave module,
          pointed at the Site Survey table. */}
      <DynamicAttachmentModal
        visible={attachmentModalVisible}
        recordData={surveyData || {RecId: existingRecId}}
        recordIdKey="RecId"
        tableName={SITE_SURVEY_ATTACHMENT_TABLE}
        onClose={() => setAttachmentModalVisible(false)}
        onSave={() => {
          fetchSurveyData();
        }}
        legalEntity={legalEntity}
        employeeId={personnelNumber}
        employeeName={userData?.employeeName || userData?.EmployeeName || ''}
        modalTitle="Site Survey Report Attachments"
        showDetails={true}
        detailFields={[
          {key: 'ProjectName', label: 'Project Name'},
          {key: 'Location', label: 'Location'},
          {key: 'SurveyDate', label: 'Survey Date'},
        ]}
        detailData={{
          ProjectName: form.projectName,
          Location: form.location,
          SurveyDate: formatDate(form.surveyDate) || '—',
        }}
        showTakePhoto={true}
        showChooseFile={true}
        showDownload={true}
        showDelete={true}
      />

      <Modal
        visible={isSaving}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => {}}>
        <View style={styles.processingOverlay}>
          <View style={styles.processingCard}>
            <ActivityIndicator size="large" color={tokens.blue} />
            <Text style={styles.processingText}>Saving...</Text>
          </View>
        </View>
      </Modal>

      <AlertModal {...alertModalProps} />
    </ActionPaneContainer>
  );
};

export default TravelRequisitionSiteSurveyReport;
