// screenMapping.js
import LeaveRequestListPage from '../screens/Leaves/LeaveRequestListPage';
import LeaveRequestSaveRecord from '../screens/Leaves/LeaveRequestSaveRecord';
import PRSalarySlip from '../screens/SalarySlip/PRSalarySlip';
import PRTaxCertificate from '../screens/TaxCertificate/PRTaxCertificate';
// import RequestForRegistration from '../screens/RequestForRegistration/RequestForRegistration';
import EntitlementBalance from '../screens/EntitlementBalance/EntitlementBalance';
import GenericAdvanceListScreen from '../screens/EmployeeAdvanceRequest/GenericAdvanceListScreen';
import GenericAdvanceSaveScreen from '../screens/EmployeeAdvanceRequest/GenericAdvanceSaveScreen';
import CreateAttendanceScreen from '../screens/Attendance/CreateAttendanceScreen';
import AttendanceDetailsScreen from '../screens/Attendance/AttendanceDetailsScreen';
import EmployeeAdjustmentScreen from '../screens/Attendance/EmployeeAdjustmentScreen';
import EmploymentCertificate from '../screens/EmploymentCertificate/EmploymentCertificate';
import RosterDetailsScreen from '../screens/Attendance/RosterDetailsScreen';
import PurchaseRequisitionListPage from '../screens/PurchaseRequisition/PurchaseRequisitionListPage';
import PurchaseRequisitionSaveRecord from '../screens/PurchaseRequisition/PurchaseRequisitionSaveRecord';
import ExpenseManagmentListPage from '../screens/ExpenseManagment/Header/ExpenseManagmentListPage';
import ExpenseManagmentLinesListPage from '../screens/ExpenseManagment/Lines/ExpenseManagmentLinesListPage';
import ExpenseManagementHeaderSaveRecord from '../screens/ExpenseManagment/Header/ExpenseManagmentHeaderSaveRecord';
import ExpenseManagmentLinesSaveRecord from '../screens/ExpenseManagment/Lines/ExpenseManagmentLinesSaveRecord';
import PurchaseRequisitionLinesListPage from '../screens/PurchaseRequisitionLines/PurchaseRequisitionLinesListPage';
import PurchaseRequisitionLinesSaveRecord from '../screens/PurchaseRequisitionLines/PurchaseRequisitionLinesSaveRecord';
import EmployeeEOSRequestListPage from '../screens/EmployeeEOSRequest/EmployeeEOSRequest_ListPage';
import WorkflowHistoryScreen from '../screens/WorkflowHistory/WorkflowHistoryListPage';
import MainDashboard from '../screens/Maindasboard';
import Profile from '../screens/Profile/Profile';
import DisplayListPage from '../screens/TabListPage/DisplayListPage';
import WorkerAssignedToMe from '../screens/WorkerAssignedToMe/WorkerAssignedToMe';
import WorkItemAssigned from '../screens/WorkItemsAssignedToMe/WorkItemAssigned';
import ESSMyRequestStatusListPage from '../screens/ESSMyRequestStatus';
import AttendanceCalendarScreen from '../screens/Attendance/AttendanceCalendarScreen';
import WorkItemsAssignedToMePage from '../screens/WorkItemsAssignedToMe/WorkItemAssignedToMe';
import BiometricSettings from '../screens/Profile/Preferences/BiometricSettings/BiometricSettings';
import DisplayPersonalInfo from '../screens/Profile/PersonalInformation/DisplayPersonalInfo';
import ContactDetailsListPage from '../screens/Profile/PersonalInformation/PersonalContacts/ContactDetailsListPage';
import ContactDetailsSaveRecord from '../screens/Profile/PersonalInformation/PersonalContacts/ContactDetailsSaveRecord';
import {FamilyContact_ListPage} from '../screens/Profile/PersonalInformation/FamilyContact/FamilyContact_ListPage';
import FamilyContact_SaveRecord from '../screens/Profile/PersonalInformation/FamilyContact/FamilyContact_SaveRecord';
import IdentificationNumberListPage from '../screens/Profile/PersonalInformation/Identification/IdentificationNumberListPage';
import IdentificationNumberSaveRecord from '../screens/Profile/PersonalInformation/Identification/IdentificationNumberSaveRecord';
import PersonalEducationListPage from '../screens/Profile/PersonalInformation/PersonalEducation/PersonalEducationListPage';
import PersonalEducationSaveRecord from '../screens/Profile/PersonalInformation/PersonalEducation/PersonalEducationSaveRecord';
import {BankAccountListPage} from '../screens/Profile/PersonalInformation/BankAccount/BankAccountListPage';
import BankAccountSaveRecord from '../screens/Profile/PersonalInformation/BankAccount/BankAccountSaveRecord';
import DateFormatSettingsScreen from '../screens/Profile/Preferences/DateSettings/DateFormatSettingsScreen';
import ESSEmployeeTask_ListPage from '../screens/ESSEmployeeTask/ESSEmployeeTask_ListPage';
import ESSEmployeeTaskDetail from '../screens/ESSEmployeeTask/ESSEmployeeTaskDetail';
import ChangeProfileImage from '../screens/Profile/PersonalInformation/ChangeProfileImage/ChangeProfileImage';
import WorkflowDetailScreen from '../screens/WorkflowDetailScreen';
import HRHelpDeskListScreen from '../screens/HRHelpDeskRequest/HRHelpDeskList_Screen';
import HRHelpDeskSaveScreen from '../screens/HRHelpDeskRequest/HRHelpDeskSave_Screen';
import EmployeeAdvancesList from '../screens/EmployeeAdvances/EmployeeAdvancesList';
import HrPoliciesScreen from '../screens/HrPolicies/HrPoliciesScreen';
import HrNewsUpdatesScreen from '../screens/HrNewsUpdates/HrNewsUpdatesScreen';
import OutstandingAdvancesScreen from '../screens/OutstandingAdvances/OutstandingAdvancesScreen';
import ESSEmployeeCourse_ListPage from '../screens/EmployeeOpenCourse/ESSEmployeeCourse_ListPage';
import HRExitInterviewListPage from '../screens/ExitInterview/HRExitInterview_ListPage';
import AttendanceManagement from '../screens/AttendanceManagement/AttendanceManagement';
import EmployeeEOS_SaveRecord from '../screens/EmployeeEOSRequest/EmployeeEOS_SaveRecord';
import EmployeeEOSClearanceItemsListPage from '../screens/EmployeeEOSClearanceItems/EmployeeEOSClearanceItems_ListPage';
import ESSEmployeeCertificate_Listpage from '../screens/Certificates/ESSEmployeeCertificate_Listpage';
import ESSEmployeeCertificate_Saverecord from '../screens/Certificates/ESSEmployeeCertificate_Saverecord'; // Map MenuId from API → Screen component
import ESSOPDMedicalExpense_ListPage from '../screens/OPD Expense/ESSOPDMedicalExpense_ListPage';
import ESSOPDMedicalExpense_SaveRecord from '../screens/OPD Expense/ESSOPDMedicalExpense_SaveRecord';
import LeaveEncashment_ListPage from '../screens/LeaveEncashment/LeaveEncashment_ListPage';
import LeaveEncashment_SaveRecord from '../screens/LeaveEncashment/LeaveEncashment_SaveRecord';
import OvertimePlanner_ListPage from '../screens/OvertimePlanner/OvertimePlanner_ListPage';
import overtimePlanner_Create from '../screens/OvertimePlanner/OvertimePlanner_Create';
import EmployeeAdvanceSalary_Create from '../screens/EmployeeAdvanceRequest/EmployeeAdvanceSalary_Create';
export const screenMapping = {
  // Tab Navigator Screens
  MainDashboard: MainDashboard,
  WorkerAssignedToMe: WorkerAssignedToMe,
  DisplayListPage: DisplayListPage,
  WorkItemAssigned: WorkItemAssigned,
  ESSMyRequestStatusListPage: ESSMyRequestStatusListPage,
  WorkItemsAssignedToMePage: WorkItemsAssignedToMePage,
  Profile: Profile,

  // Home And Drawer Navigator Screens
  WorkflowHistoryScreen: WorkflowHistoryScreen,
  LeavesListPage: LeaveRequestListPage,
  LeaveSaveRecord: LeaveRequestSaveRecord,
  PRSalarySlip: PRSalarySlip,
  PRTaxCertificate: PRTaxCertificate,
  EntitlementBalance: EntitlementBalance,
  GenericAdvanceListScreen: GenericAdvanceListScreen,
  GenericAdvanceSaveScreen: GenericAdvanceSaveScreen,
  CreateAttendanceScreen: CreateAttendanceScreen,
  AttendanceDetailsScreen: AttendanceDetailsScreen,
  AttendanceCalendarScreen: AttendanceCalendarScreen,
  EmployeeAdjustmentScreen: EmployeeAdjustmentScreen,
  EmploymentCertificate: EmploymentCertificate,
  RosterDetailsScreen: RosterDetailsScreen,
  PurchaseRequisitionListPage: PurchaseRequisitionListPage,
  PurchaseRequisitionSaveRecord: PurchaseRequisitionSaveRecord,
  ExpenseManagmentListPage: ExpenseManagmentListPage,
  ExpenseManagmentLinesListPage: ExpenseManagmentLinesListPage,
  PurchaseRequisitionLinesListPage: PurchaseRequisitionLinesListPage,
  PurchaseRequisitionLinesSaveRecord: PurchaseRequisitionLinesSaveRecord,
  ExpenseManagementHeaderSaveRecord: ExpenseManagementHeaderSaveRecord,
  ExpenseManagmentLinesSaveRecord: ExpenseManagmentLinesSaveRecord,
  BiometricSettings: BiometricSettings,
  DisplayPersonalInfo: DisplayPersonalInfo,
  ContactDetailsListPage: ContactDetailsListPage,
  ContactDetailsSaveRecord: ContactDetailsSaveRecord,
  FamilyContact_ListPage: FamilyContact_ListPage,
  FamilyContact_SaveRecord: FamilyContact_SaveRecord,
  IdentificationNumberListPage: IdentificationNumberListPage,
  IdentificationNumberSaveRecord: IdentificationNumberSaveRecord,
  PersonalEducationListPage: PersonalEducationListPage,
  PersonalEducationSaveRecord: PersonalEducationSaveRecord,
  BankAccountListPage: BankAccountListPage,
  BankAccountSaveRecord: BankAccountSaveRecord,
  DateFormatSettingsScreen: DateFormatSettingsScreen,
  AttendanceManagement: AttendanceManagement,
  // OutstandingAdvancesScreen: OutstandingAdvancesScreen,
  // TimeClockListPage: TimeClockListPage,
  EmployeeEOSRequestListPage: EmployeeEOSRequestListPage,
  ESSEmployeeTask_ListPage: ESSEmployeeTask_ListPage,
  ESSEmployeeTaskDetail: ESSEmployeeTaskDetail,
  ESSEmployeeCourse_ListPage: ESSEmployeeCourse_ListPage,
  // WorkflowHistoryScreen: WorkflowHistoryScreen,
  ChangeProfileImage: ChangeProfileImage,
  WorkflowDetailScreen: WorkflowDetailScreen,
  HRHelpDeskListScreen: HRHelpDeskListScreen,
  HRHelpDeskSaveScreen: HRHelpDeskSaveScreen,
  EmployeeAdvancesList: EmployeeAdvancesList,
  HrPoliciesScreen: HrPoliciesScreen,
  HrNewsUpdatesScreen: HrNewsUpdatesScreen,
  OutstandingAdvancesScreen: OutstandingAdvancesScreen,
  HRExitInterviewListPage: HRExitInterviewListPage,
  EmployeeEOS_SaveRecord: EmployeeEOS_SaveRecord,
  EmployeeEOSClearanceItemsListPage: EmployeeEOSClearanceItemsListPage,
  ESSEmployeeCertificate_Listpage: ESSEmployeeCertificate_Listpage,
  ESSEmployeeCertificate_Saverecord: ESSEmployeeCertificate_Saverecord,
  ESSOPDMedicalExpense_ListPage: ESSOPDMedicalExpense_ListPage,
  ESSOPDMedicalExpense_SaveRecord: ESSOPDMedicalExpense_SaveRecord,
  LeaveEncashment_ListPage: LeaveEncashment_ListPage,
  LeaveEncashment_SaveRecord: LeaveEncashment_SaveRecord,
  OvertimePlanner_ListPage: OvertimePlanner_ListPage,
  OvertimePlanner_Create: overtimePlanner_Create,
  EmployeeAdvanceSalary_Create: EmployeeAdvanceSalary_Create,
};

// Map Images → Screen component
export const iconMapping = {
  MainDashboard: require('../assets/Maindashboard/dashboard.png'),
  LeavesListPage: require('../assets/Maindashboard/calendar.png'),
  LeaveSaveRecord: require('../assets/Maindashboard/calendar.png'),
  PRSalarySlip: require('../assets/Maindashboard/payment.png'),
  PRTaxCertificate: require('../assets/Maindashboard/certificate.png'),
  // RequestForRegistration: require('../assets/Maindashboard/salary.png'),
  EntitlementBalance: require('../assets/Maindashboard/justice.png'),
  GenericAdvanceListScreen: require('../assets/Maindashboard/signing.png'),
  GenericAdvanceSaveScreen: require('../assets/Maindashboard/loan-approved.png'),
  CreateAttendanceScreen: require('../assets/immigration.png'),
  AttendanceDetailsScreen: require('../assets/calendar.png'),
  EmployeeAdjustmentScreen: require('../assets/machine.png'),
  RosterDetailsScreen: require('../assets/OJ91AO0.jpg'),
  EmploymentCertificate: require('..//assets/Certificate/certificate.png'),
  PurchaseRequisitionListPage: require('..//assets//Maindashboard/PurchaseRequisition.png'),
  ExpenseManagmentListPage: require('../assets/Maindashboard/Expense.png'),
  EmployeeEOSRequestListPage: require('../assets/Maindashboard/EOSRequestNew.png'),
  HRHelpDeskListScreen: require('../assets/Maindashboard/helpDesk.png'),
  HrPoliciesScreen: require('../assets/Maindashboard/policies.png'),
  HrNewsUpdatesScreen: require('../assets/Maindashboard/news.png'),
  OutstandingAdvancesScreen: require('../assets/Maindashboard/Loan.png'),
  EmployeeAdvanceSalary_Create: require('../assets/Maindashboard/loan-approved.png'),
};
