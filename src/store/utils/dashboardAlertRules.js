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

export const isWithinOpdClaimWindow = (date = new Date()) => {
  const day = date.getDate();
  return day >= 1 && day <= 10;
};

// Always refers to the month before the current one.
export const getOpdClaimTargetMonthLabel = (date = new Date()) => {
  const target = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  const month = MONTH_NAMES[target.getMonth()];
  const year = target.getFullYear();
  return `${month}, ${year}`;
};
