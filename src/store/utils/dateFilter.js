import dayjs from 'dayjs';

// ─────────────────────────────────────────────────────────────────────────────
//  Date-range presets — single source of truth for the FilterPanel UI (the
//  selectable rows) and the predicate used by each screen's getPillBase().
//
//  State is shaped as a preset KEY (string) so a 'custom' two-date option can be
//  added later without reworking the wiring.
// ─────────────────────────────────────────────────────────────────────────────
export const DATE_PRESETS = [
  {key: 'all', label: 'All time'},
  {key: 'today', label: 'Today'},
  {key: 'last7', label: 'Last 7 days'},
  {key: 'last30', label: 'Last 30 days'},
  {key: 'thisMonth', label: 'This month'},
];

/**
 * Returns the inclusive start boundary (a dayjs instance) for a preset, or null
 * for 'all' / unknown keys (meaning "no lower bound").
 */
const startOf = presetKey => {
  const now = dayjs();
  switch (presetKey) {
    case 'today':
      return now.startOf('day');
    case 'last7':
      // Last 7 days including today → start of the day 6 days ago.
      return now.subtract(6, 'day').startOf('day');
    case 'last30':
      return now.subtract(29, 'day').startOf('day');
    case 'thisMonth':
      return now.startOf('month');
    default:
      return null;
  }
};

/**
 * True if `value` (any date-parseable value) falls within the given preset.
 * 'all', empty, or unknown presets always match. Unparseable dates never match
 * a bounded preset.
 */
export const matchesDateRange = (value, presetKey) => {
  if (!presetKey || presetKey === 'all') {
    return true;
  }
  const start = startOf(presetKey);
  if (!start) {
    return true;
  }
  const d = dayjs(value);
  if (!d.isValid()) {
    return false;
  }
  // Inclusive lower bound; upper bound is "now" for all presets.
  return !d.isBefore(start) && !d.isAfter(dayjs());
};
