// config/workflowExtraFields.js

export const TABLE_EXTRA_FIELDS = {
  SLD_HRLeaveHistory: [
    {
      sourceLabel: 'Leave Name',
      targetKey: 'ExtraLeaveName',
      cardLabel: 'Leave Name',
    },
  ],

  TrvExpTable: [
    {
      sourceLabel: 'Employee',
      targetKey: 'ExtraExpenseEmployee',
      cardLabel: 'Employee',
    },
    {
      sourceLabel: 'Expense Amount',
      targetKey: 'ExtraExpenseAmount',
      cardLabel: 'Expense Amount',
    },
  ],

  TrvRequisitionTable: [
    {
      sourceLabel: 'Employee',
      targetKey: 'ExtraTravelEmployee',
      cardLabel: 'Employee',
    },
    {
      sourceLabel: 'Destination',
      targetKey: 'ExtraLocation',
      cardLabel: 'Location',
    },
    {
      sourceLabel: 'Days',
      targetKey: 'ExtraTravelReqTotalDays',
      cardLabel: 'Total Days',
    },
    {
      sourceLabel: 'Total estimate',
      targetKey: 'ExtraTravelReqAmount',
      cardLabel: 'Total Estimate',
    },
  ],

  SLD_HRPenaltyLeave: [
    {
      sourceLabel: 'Worker Name',
      targetKey: 'ExtraPenaltyWorkerName',
      cardLabel: 'Worker Name',
    },
    {
      sourceLabel: 'Days',
      targetKey: 'ExtraPenaltyDays',
      cardLabel: 'Days',
    },
    {
      sourceLabel: 'Type',
      targetKey: 'ExtraPenaltyType',
      cardLabel: 'Type',
    },
  ],

  PurchTable: [
    {
      sourceLabel: 'Vendor name',
      targetKey: 'ExtraVendorName',
      cardLabel: 'Vendor Name',
    },
    {
      sourceLabel: 'Net Amount',
      targetKey: 'ExtraNetAmount',
      cardLabel: 'Net Amount',
    },
  ],

  HcmGoal: [
    {
      sourceLabel: 'Goal name',
      targetKey: 'ExtraGoalDescription',
      cardLabel: 'Goal Type',
    },
    {
      sourceLabel: 'Department',
      targetKey: 'ExtraGoalDepartment',
      cardLabel: 'Department',
    },
    {sourceLabel: 'Worker', targetKey: 'ExtraGoalWorker', cardLabel: 'Worker'},
  ],

  LedgerJournalTable: [
    {
      sourceLabel: 'Description',
      targetKey: 'ExtraLedgerTitle',
      cardLabel: 'Title',
    },
    {
      sourceLabel: 'Vendor Name',
      targetKey: 'ExtraLedgerVendorName',
      cardLabel: 'Vendor Name',
    },
    {
      sourceLabel: 'Vendor transaction total',
      targetKey: 'ExtraLedgerTotalAmount',
      cardLabel: 'Total Amount',
    },
  ],
  IDAP_EmpClearanceTable: [
    {
      sourceLabel: 'Description',
      targetKey: 'ExtraClearanceDescription',
      cardLabel: 'Description',
    },
    {
      sourceLabel: 'Worker Name',
      targetKey: 'ExtraClearanceWorker',
      cardLabel: 'Worker Name',
    },
  ],
  SLD_HRTrainingRequests: [
    {
      sourceLabel: 'Reference',
      targetKey: 'ExtraTrainingReference',
      cardLabel: 'Reference',
    },
    {
      sourceLabel: 'Course title',
      targetKey: 'ExtraTrainingCourseTitle',
      cardLabel: 'Course Title',
    },
    {
      sourceLabel: 'Department',
      targetKey: 'ExtraTrainingDepartment',
      cardLabel: 'Department',
    },
    {
      sourceLabel: 'Estimated cost',
      targetKey: 'ExtraTrainingEstimatedCost',
      cardLabel: 'Estimated Cost',
    },
    {
      sourceLabel: 'Requested by',
      targetKey: 'ExtraTrainingRequestedBy',
      cardLabel: 'Requested By',
    },
  ],
};
