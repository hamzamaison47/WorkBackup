// Shared service coordinates for the Expense Management LINES service.
//
// ⚠️ The lines contract is "SvcNew" — NOT "SvcNewAgain". The HEADER service is
// DFExpenseManagementHeaderSvcNewAgain (it was renamed one more time than this
// one). The two are genuinely different; do not "fix" the mismatch by making
// them match.
//
//   Endpoint   : ${config.resource}soap/services/${EXP_MGMT_LINES_GROUP}
//   SOAPAction : http://tempuri.org/${EXP_MGMT_LINES_CONTRACT}/<operation>
//
// Body operation namespace is "http://tempuri.org" with NO trailing slash.
//
// Every lines API imports these constants rather than hardcoding the names, so
// the next rename (this contract has a history of them) is a one-line change.
export const EXP_MGMT_LINES_CONTRACT = 'DFExpenseManagementLinesSvcNew';
export const EXP_MGMT_LINES_GROUP = 'DFExpenseManagementLinesSvcGroup';
