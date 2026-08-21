// import moment from 'moment-timezone';

// const INVALID_YEAR_THRESHOLD = 1971;

// export function formatDateValue(
//   value,
//   formatOption,
//   type,
//   timeFormatOption,
//   timezoneOption,
// ) {
//   if (!value) {
//     return '—';
//   }

//   const d = typeof value === 'string' ? new Date(value) : value;
//   if (!d || isNaN(d.getTime())) {
//     return '—';
//   }
//   if (d.getFullYear() < INVALID_YEAR_THRESHOLD) {
//     return '—';
//   }

//   try {
//     const isLocal =
//       !timezoneOption ||
//       timezoneOption.value === 'local' ||
//       !timezoneOption.value;

//     // Create moment object in the correct timezone
//     const m = isLocal ? moment(d) : moment(d).tz(timezoneOption.value);

//     // Build format string based on selected options
//     const dateFormat = momentDateFormat(formatOption?.dateFormat);
//     const timeFormat = momentTimeFormat(timeFormatOption?.timeFormat);

//     if (type === 'date') {
//       return m.format(dateFormat);
//     }
//     if (type === 'time') {
//       return m.format(timeFormat);
//     }
//     if (type === 'datetime') {
//       return m.format(`${dateFormat} ${timeFormat}`);
//     }
//   } catch (e) {
//     console.warn('formatDateValue error:', e?.message, '| value:', value);
//     return '—';
//   }

//   return '—';
// }

// // Map your Redux format strings to moment format strings
// function momentDateFormat(dateFormat) {
//   switch (dateFormat) {
//     case 'MM/dd/yyyy':
//       return 'MM/DD/YYYY';
//     case 'dd/MM/yyyy':
//       return 'DD/MM/YYYY';
//     case 'yyyy-MM-dd':
//       return 'YYYY-MM-DD';
//     case 'dd MMM yyyy':
//       return 'DD MMM YYYY';
//     case 'MMMM dd, yyyy':
//       return 'MMMM DD, YYYY';
//     case 'MMM dd, yyyy':
//     default:
//       return 'MMM DD, YYYY';
//   }
// }

// function momentTimeFormat(timeFormat) {
//   switch (timeFormat) {
//     case 'HH:mm':
//       return 'HH:mm'; // 24 hour
//     case 'hh:mm a':
//     default:
//       return 'hh:mm A'; // 12 hour
//   }
// }
import moment from 'moment-timezone';

const INVALID_YEAR_THRESHOLD = 1971;

// Dynamics sends timestamps like "2026-08-16T21:02:56" with NO timezone
// offset. That string is the actual local wall-clock time, but JS's
// `new Date(string)` parses offset-less ISO strings as UTC — shifting the
// displayed time by the device's UTC offset (e.g. 9:02 PM becomes 2:02 AM
// in PKT, UTC+5). This reads the date/time digits directly instead, so the
// value shown matches Dynamics exactly. Strings that DO have a 'Z' or an
// explicit +HH:mm offset are real absolute timestamps and are left as-is.
function parseLocalDateTimeString(value) {
  if (typeof value !== 'string') return new Date(value);

  const trimmed = value.trim();

  // Trust an explicit NUMERIC offset (+05:00 / -0500) as a real UTC-relative
  // timestamp. A bare trailing 'Z' is NOT trusted here — this SOAP service
  // has been observed sending local wall-clock time with a 'Z' suffix
  // (e.g. CreatedDateTime), which is not a real UTC marker.
  const hasNumericOffset = /[+-]\d{2}:?\d{2}$/.test(trimmed);
  if (hasNumericOffset) return new Date(trimmed);

  // Strip a trailing Z (if present) before reading the digits as local time.
  const withoutZ = trimmed.replace(/Z$/, '');

  const match = withoutZ.match(
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/,
  );
  if (!match) return new Date(trimmed);

  const [, y, mo, da, h, mi, s] = match;
  return new Date(
    Number(y),
    Number(mo) - 1,
    Number(da),
    Number(h),
    Number(mi),
    Number(s || 0),
  );
}

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

  const d = typeof value === 'string' ? parseLocalDateTimeString(value) : value;
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
