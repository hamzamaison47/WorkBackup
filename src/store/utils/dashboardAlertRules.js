// utils/dashboardAlertRules.js

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

// The month a claim is currently expected for.
// Window for month M = 1st of M .. 10th of M+1, so:
//   day <= 10 -> previous month (grace period still open)
//   day >= 11 -> current month
export const getOpdClaimTargetMonth = (date = new Date()) => {
  const monthOffset = date.getDate() <= 10 ? -1 : 0;
  return new Date(date.getFullYear(), date.getMonth() + monthOffset, 1);
};

export const getOpdClaimTargetMonthLabel = (date = new Date()) => {
  const target = getOpdClaimTargetMonth(date);
  return `${MONTH_NAMES[target.getMonth()]}, ${target.getFullYear()}`;
};

// Does a record's SLD_MonthOfYear ("2026-08-20T12:00:00") fall in the target month?
const matchesTargetMonth = (record, target) => {
  const raw = record?.SLD_MonthOfYear;
  if (!raw || typeof raw !== 'string') return false;
  const [y, m] = raw.split('T')[0].split('-').map(Number);
  if (!y || !m) return false;
  return y === target.getFullYear() && m === target.getMonth() + 1;
};

// A record in one of these states means the claim for its month is handled.
const COVERED_STATUSES = new Set([
  'Submitted',
  'In review',
  'Approved',
  'Processed for payment',
  'Paid',
]);

export const buildOpdClaimAlert = (expenseRecords = [], date = new Date()) => {
  const target = getOpdClaimTargetMonth(date);
  const monthLabel = getOpdClaimTargetMonthLabel(date);

  const monthRecords = (expenseRecords || []).filter(r =>
    matchesTargetMonth(r, target),
  );

  // No record for the target month -> create it.
  if (monthRecords.length === 0) {
    return {
      id: 'opd-claim-create',
      severity: 'warning',
      title: 'OPD medical claim pending',
      message: `No OPD medical expense report exists for ${monthLabel}. Please create one.`,
    };
  }

  // Already submitted/approved/paid -> nothing to show.
  if (monthRecords.some(r => COVERED_STATUSES.has(r.ApprovalStatus))) {
    return null;
  }

  // Rejected -> re-submit.
  const rejected = monthRecords.find(r => r.ApprovalStatus === 'Rejected');
  if (rejected) {
    return {
      id: 'opd-claim-resubmit',
      severity: 'error',
      title: 'OPD medical claim rejected',
      message: `Your OPD medical expense ${rejected.ExpenseNumber} for ${monthLabel} was rejected. Please review and re-submit it.`,
    };
  }

  // Only Draft(s) -> submit.
  const draft = monthRecords[0];
  return {
    id: 'opd-claim-submit',
    severity: 'warning',
    title: 'OPD medical claim not submitted',
    message: `Your OPD medical expense ${draft.ExpenseNumber} for ${monthLabel} is still in Draft. Please submit it.`,
  };
};
