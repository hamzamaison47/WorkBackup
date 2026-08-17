// Shared service coordinates for the NEW Expense Management HEADER service.
//
// The service contract has been renamed twice already (Svc → SvcNew →
// SvcNewAgain). Every header API imports these two constants instead of
// hardcoding the names, so the next rename is a one-line change here.
//
//   Endpoint   : ${config.resource}soap/services/${EXP_MGMT_HEADER_GROUP}
//   SOAPAction : http://tempuri.org/${EXP_MGMT_HEADER_CONTRACT}/<operation>
//
// NOTE: the body operation namespace is "http://tempuri.org" with NO trailing
// slash — do not copy the trailing-slash convention used by the old
// ExpenseManagmentSvcGroup.
export const EXP_MGMT_HEADER_CONTRACT = 'DFExpenseManagementHeaderSvcNewAgain';
export const EXP_MGMT_HEADER_GROUP = 'DFExpenseManagementHeaderSvcGroup';
