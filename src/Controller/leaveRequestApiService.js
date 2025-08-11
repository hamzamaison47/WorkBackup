import {RetrieveAllLeaves} from '../API/Leaves/RetrieveAllLeaves';
import {RetrieveLeaveCodes} from '../API/Leaves/LeaveCodes';
import {GetLeaveBalance} from '../API/Leaves/LeaveBalance';

export const fetchLeaves = async employeeId => {
  try {
    const data = await RetrieveAllLeaves({employeeId});

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

export const fetchLeaveCodes = async employeeId => {
  try {
    const data = await RetrieveLeaveCodes({employeeId});
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
