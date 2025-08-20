import {FindByEmployeeAdvanceRequest} from '../API/EmployeeAdvanceRequest/FindByEmployeeAdvanceRequest';
import {RetrieveAllAdvanceTypeRequest} from '../API/EmployeeAdvanceRequest/RetrieveAllAdvanceTypeRequest';

export const fetchAdvances = async employeeId => {
  try {
    const data = await FindByEmployeeAdvanceRequest({employeeId});
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
      //AdvanceId: item.AdvanceId,
      AdvanceRequestId: item.AdvanceRequestId,
      //AdvanceRequestStatus: item.AdvanceRequestStatus,
      //CreatedBy: item.CreatedBy,
      //CreatedDateTime: item.CreatedDateTime,
      Currency: item.Currency,
      //DataAreaId: item.DataAreaId,
      EmployeeName: item.EmployeeName,
      Guarantor1: item.Guarantor1,
      Guarantor2: item.Guarantor2,
      //ModifiedBy: item.ModifiedBy,
      //ModifiedDateTime: item.ModifiedDateTime,
      // Partition: item.Partition,
      // PayPeriodCode: item.PayPeriodCode,
      // PayPeriodYear: item.PayPeriodYear,
      // RequestedBy: item.RequestedBy,
      WFStatus: item.WFStatus,
    }));
  } catch (error) {
    throw new Error('Error fetching Advance Request');
  }
};

export const retrieveAdvanceTypeCode = async () => {
  try {
    const data = await RetrieveAllAdvanceTypeRequest();
    console.log('Main Data of Advance Type Request', data);
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
