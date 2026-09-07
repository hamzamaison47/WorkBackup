// Single source of truth for Dynamics SOAP date/time formatting across the app.
//
// All timezone conversion now happens on the Dynamics X++ side
// (DateTimeUtil::applyTimeZoneOffset), using the Dynamics user's own
// preferred timezone. Every date/datetime value that reaches mobile is
// already the correct value to display — mobile just parses and formats
// the literal digits, with no timezone math of its own, in either
// direction (read or write).

export const isPlaceholderDate = str => !str || str.startsWith('1900-01-01');

/**
 * Parses a Dynamics SOAP date string into a Date object, taking the digits
 * literally as local wall-clock values — no timezone interpretation,
 * regardless of any trailing "Z" (which Dynamics appends to SOAP dates
 * as a formatting artifact, not a semantic UTC marker).
 * @param {string} value - raw wire value, e.g. "2026-08-29T12:00:44Z"
 * @returns {Date|null}
 */
export const parseDynamicsDate = value => {
  const str = String(value ?? '');
  if (isPlaceholderDate(str)) return null;

  const match = str.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2}))?/,
  );
  if (!match) return null;

  const [, year, month, day, hours = '00', minutes = '00', seconds = '00'] =
    match;

  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hours),
    Number(minutes),
    Number(seconds),
  );
  return isNaN(date.getTime()) ? null : date;
};

/** Formats a Date (or null) as DD/MM/YYYY, or '' if null. */
export const formatDynamicsDate = date => {
  if (!date) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
};

/** Formats a Date (or null) as DD/MM/YYYY HH:mm:ss (24-hour), or '' if null. */
export const formatDynamicsDateTime = date => {
  if (!date) return '';
  const datePart = formatDynamicsDate(date);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${datePart} ${hours}:${minutes}:${seconds}`;
};

/**
 * Formats a business date (Date, or Dynamics wire string) into the outgoing
 * SOAP wire shape Dynamics expects for a date-only field: "YYYY-MM-DDT00:00:00".
 * Uses parseDynamicsDate under the hood, so it's immune to the same
 * date-only-vs-timestamp and "Z" quirks as everything else in this file.
 * @param {Date|string} value
 * @returns {string} '' if value is empty/invalid
 */
export const toDynamicsWireDate = value => {
  const date = value instanceof Date ? value : parseDynamicsDate(value);
  if (!date || isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T00:00:00`;
};

/**
 * Returns the current local date+time as a Dynamics wire literal
 * (YYYY-MM-DDTHH:mm:ss). Never uses toISOString(), which converts to UTC
 * first and can silently shift the calendar day during the first few hours
 * of the local day.
 */
export const getLocalNowWireDateTime = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

/**
 * Formats a business date/time (Date, or Dynamics wire string) into the
 * outgoing SOAP wire shape, PRESERVING whatever time-of-day it carries.
 * Use this for real date+time fields (Transaction, DepartureDateTime,
 * ArrivalDateTime, per-diem DateFrom/DateTo, etc.). Use toDynamicsWireDate
 * instead for pure date-only fields, which always resets to midnight.
 * X++ handles converting this literal local value to/from UTC on its side.
 * @param {Date|string} value
 * @returns {string} '' if value is empty/invalid
 */
export const toDynamicsWireDateTime = value => {
  const date = value instanceof Date ? value : parseDynamicsDate(value);
  if (!date || isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};
