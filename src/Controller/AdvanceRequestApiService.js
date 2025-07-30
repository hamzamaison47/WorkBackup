import {FindByEmployee} from '../API/Advance/FindByEmployee';
// import {RetriveEmployeeReportees} from '../API/EOS/RetriveEmployeeReportees';
// import {RetrieveAdvancesRequest} from '../API/Advance/RetrieveAdvancesRequest';
import {RetrieveAdvanceType} from '../API/Advance/RetrieveAdvanceType';
import {PayGroupPayPeriod} from '../API/Advance/PayGroupPayPeriod';

export const fetchAdvances = async employeeId => {
  try {
    const data = await FindByEmployee({employeeId});
    // console.log(employeeId);
    // console.log('Main Data of Advance REquest', data);
    return data.map(item => ({
      RecId: item.RecId,
      EmployeeId: item.EmployeeId,
      AdvanceTypeCode: item.AdvanceTypeCode,
      AdvanceAmount: item.AdvanceAmount,
      RequestedPaymentDate: item.RequestedPaymentDate,
      RecoveryStartDate: item.RecoveryStartDate,
      RequestedInstallmentAmount: item.RequestedInstallmentAmount,
      RequestedInstallments: item.RequestedInstallments,
      RequestDate: item.RequestDate,
      AdvanceDescription: item.AdvanceDescription,
    }));
  } catch (error) {
    throw new Error('Error fetching Advance Request');
  }
};

export const retrieveAdvanceTypeCode = async () => {
  try {
    const data = await RetrieveAdvanceType();
    return data.map(item => ({
      AdvanceTypeCode: item.AdvanceTypeCode,
      Description: item.Description,
      EmploymentType: item.EmploymentType,
      MaxAdanceAmount: item.MaxAdanceAmount,
      MaxAdavnceTaken: item.MaxAdavnceTaken,
      MinServiceYear: item.MinServiceYear,
      RecoveryCode: item.RecoveryCode,
      CalculationCode: item.CalculationCode,
      Recoveries: item.Recoveries,
      RecId: item.RecId,
    }));
  } catch (error) {
    throw new Error('Error fetching Advace Type Code Request');
  }
};

export const getPayGroupPayPeriod = async employeeId => {
  try {
    const data = await PayGroupPayPeriod({employeeId});
    return data.map(item => ({
      EndDate: item.EndDate,
      StartDate: item.StartDate,
      PayGroupCode: item.PayGroupCode,
      PayPeriodYear: item.PayPeriodYear,
      StatementDate: item.StatementDate,
      PayPeriodCode: item.PayPeriodCode,
      PayPeriodNumber: item.PayPeriodNumber,
      PayPeriodStatus: item.PayPeriodStatus,
      RecId: item.RecId,
    }));
  } catch (error) {
    throw new Error('Error fetching Pay Group Pay Period Request');
  }
};
