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
import AttendanceCalendarScreen from '../screens/Attendance/AttendanceCalendarScreen';
import EmploymentCertificate from '../screens/EmploymentCertificate/EmploymentCertificate';

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
  AttendanceCalendarScreen: AttendanceCalendarScreen,
  EmploymentCertificate: EmploymentCertificate,
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
  AttendanceCalendarScreen: require('../assets/machine.png'),
  EmploymentCertificate: require('..//assets/Certificate/certificate.png'),
};
