import moment from 'moment-timezone';

const INVALID_YEAR_THRESHOLD = 1971;

export function formatDateValue(
  value,
  formatOption,
  type,
  timeFormatOption,
  timezoneOption,
) {
  if (!value) {
    return '—';
  }

  const d = typeof value === 'string' ? new Date(value) : value;
  if (!d || isNaN(d.getTime())) {
    return '—';
  }
  if (d.getFullYear() < INVALID_YEAR_THRESHOLD) {
    return '—';
  }

  try {
    const isLocal =
      !timezoneOption ||
      timezoneOption.value === 'local' ||
      !timezoneOption.value;

    // Create moment object in the correct timezone
    const m = isLocal ? moment(d) : moment(d).tz(timezoneOption.value);

    // Build format string based on selected options
    const dateFormat = momentDateFormat(formatOption?.dateFormat);
    const timeFormat = momentTimeFormat(timeFormatOption?.timeFormat);

    if (type === 'date') {
      return m.format(dateFormat);
    }
    if (type === 'time') {
      return m.format(timeFormat);
    }
    if (type === 'datetime') {
      return m.format(`${dateFormat} ${timeFormat}`);
    }
  } catch (e) {
    console.warn('formatDateValue error:', e?.message, '| value:', value);
    return '—';
  }

  return '—';
}

// Map your Redux format strings to moment format strings
function momentDateFormat(dateFormat) {
  switch (dateFormat) {
    case 'MM/dd/yyyy':
      return 'MM/DD/YYYY';
    case 'dd/MM/yyyy':
      return 'DD/MM/YYYY';
    case 'yyyy-MM-dd':
      return 'YYYY-MM-DD';
    case 'dd MMM yyyy':
      return 'DD MMM YYYY';
    case 'MMMM dd, yyyy':
      return 'MMMM DD, YYYY';
    case 'MMM dd, yyyy':
    default:
      return 'MMM DD, YYYY';
  }
}

function momentTimeFormat(timeFormat) {
  switch (timeFormat) {
    case 'HH:mm':
      return 'HH:mm'; // 24 hour
    case 'hh:mm a':
    default:
      return 'hh:mm A'; // 12 hour
  }
}
