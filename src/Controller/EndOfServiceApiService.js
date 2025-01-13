import {RetrieveAll} from '../API/EOS/RetriveAll';

export const fetchAllServices = async employeeId => {
  try {
    const data = await RetrieveAll({employeeId});
    return data.map(item => ({
      RecId: item.RecId,
      EmployeePersonnelNumber: item.EmployeePersonnelNumber,
      EmployeeName: item.EmployeeName,
      EOSRequestId: item.EOSRequestId,
      EOSType: item.EOSType,
      EOSStatus: item.EOSStatus,
      EOSReasonCode: item.EOSReasonCode,
      EOSNotificationDate: item.EOSNotificationDate,
      LastWorkingDate_Actual: item.LastWorkingDate_Actual,
      LastWorkingDate_Calculated: item.LastWorkingDate_Calculated,
      NoticePeriodCode: item.NoticePeriodCode,
      OffsetDimension: item.OffsetDimension,
      Remarks: item.Remarks,
      WorkflowStatus: item.WorkflowStatus,
    }));
  } catch (error) {
    throw new Error('Error fetching End of Service Request');
  }
};
