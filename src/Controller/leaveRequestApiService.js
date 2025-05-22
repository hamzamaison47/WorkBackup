import {RetrieveAll} from '../API/RetrieveAllApi/RetrieveAll';
import {RetrieveLeaveCodes} from '../API/Leaves/LeaveCodes';
import {GetLeaveBalance} from '../API/Leaves/LeaveBalance';

export const fetchLeaves = async employeeId => {
  try {
    const data = await RetrieveAll({employeeId});
    // console.log('main Data of Leave REquest', data);
    return data.map(item => ({
      recId: item.RecId,
      leaveReqId: item.LeaveReqId,
      employeeName: item.EmployeeName,
      leaveCode: item.LeaveCode,
      leaveCategory: item.LeaveCategory,
      leaveReqDate: item.LeaveReqDate,
      leaveDays: item.LeaveDays,
      leaveStartDate: item.LeaveStartDate,
      leaveEndDate: item.LeaveEndDate,
      reason: item.Reason,
      balance: item.Balance,
      wfStatus: item.WFStatus,
    }));
  } catch (error) {
    throw new Error('Error fetching leaves');
  }
};

// export const fetchEmployeeIds = async employeeId => {
//   try {
//     const data = await RetrieveEmployeeIds({employeeId});
//     return data.map(item => ({
//       label: item.EmployeeId.toString(),
//       value: item.EmployeeId.toString(),
//     }));
//   } catch (error) {
//     throw new Error('Error fetching employee IDs');
//   }
// };

export const fetchLeaveCodes = async () => {
  try {
    const data = await RetrieveLeaveCodes({dataAreaId: 'DAT'});
    return data.map(item => ({
      label: item?.LeaveCode,
      value: item?.LeaveCode,
    }));
  } catch (error) {
    throw new Error('Error fetching leave codes');
  }
};

export const fetchLeaveBalance = async (
  employeeId,
  leaveCode,
  leaveStartDate,
) => {
  try {
    const balanceData = await GetLeaveBalance({
      employeeId,
      leaveCode,
      leaveStartDate,
    });
    return balanceData || '0';
  } catch (error) {
    throw new Error('Error fetching leave balance');
  }
};
