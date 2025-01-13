import {EntitlementBalances} from '../API/Leaves/EntitlementBalances';

export const getEntitlementBalances = async employeeId => {
  try {
    const data = await EntitlementBalances({employeeId});
    return data.map(item => ({
      RecId: item.RecId,
      EmployeeId: item.EmployeeId,
      EmployeeName: item.EmployeeName,
      EntitlementCode: item.EntitlementCode,
      EntitlementUnit: item.EntitlementUnit,
      PayGroupCode: item.PayGroupCode,
      Taken: item.Taken,
      Accrued: item.Accrued,
      Balance: item.Balance,
    }));
  } catch (error) {
    throw new Error('Error fetching Pay Group Pay Period Request');
  }
};
