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

// Map MenuId from API → Screen component
export const screenMapping = {
  LeavesListPage: LeaveRequestListPage,
  LeaveSaveRecord: LeaveRequestSaveRecord,
  PRSalarySlip: PRSalarySlip,
  PRTaxCertificate: PRTaxCertificate,
  // RequestForRegistration: RequestForRegistration,
  EntitlementBalance: EntitlementBalance,
  GenericAdvanceListScreen: GenericAdvanceListScreen,
  GenericAdvanceSaveScreen: GenericAdvanceSaveScreen,
  CreateAttendanceScreen: CreateAttendanceScreen,
  AttendanceDetailsScreen: AttendanceDetailsScreen,
  EmployeeAdjustmentScreen: EmployeeAdjustmentScreen,
  EmploymentCertificate: EmploymentCertificate,
  RosterDetailsScreen: RosterDetailsScreen,
  PurchaseRequisitionListPage: PurchaseRequisitionListPage,
  PurchaseRequisitionSaveRecord: PurchaseRequisitionSaveRecord,
  ExpenseManagmentListPage: ExpenseManagmentListPage,
  ExpenseManagementHeaderSaveRecord: ExpenseManagementHeaderSaveRecord,
  ExpenseManagmentLinesListPage: ExpenseManagmentLinesListPage,
  ExpenseManagmentLinesSaveRecord: ExpenseManagmentLinesSaveRecord,
  PurchaseRequisitionLinesListPage: PurchaseRequisitionLinesListPage,
  PurchaseRequisitionLinesSaveRecord: PurchaseRequisitionLinesSaveRecord,
  EmployeeEOSRequestListPage: EmployeeEOSRequestListPage,
};

// Map Images → Screen component
export const iconMapping = {
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
};
