// Must agree with the weekly_snipers view in supabase/schema.sql: weeks run
// Monday to Sunday, in Ann Arbor time rather than UTC.
const TIMEZONE = 'America/Detroit';
const DAY_MS = 86400000;

// en-CA formats as YYYY-MM-DD, which is what the view's week_start compares to.
const LOCAL_DATE = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const RANGE = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  month: 'short',
  day: 'numeric',
});

const iso = (ms) => new Date(ms).toISOString().slice(0, 10);
const parse = (date) => date.split('-').map(Number);

/**
 * Counting whole days back from a calendar date keeps the answer clear of
 * daylight saving: the arithmetic never crosses a clock change.
 */
function mondayOf(year, month, day) {
  const midnight = Date.UTC(year, month - 1, day);
  const sinceMonday = (new Date(midnight).getUTCDay() + 6) % 7;

  return iso(midnight - sinceMonday * DAY_MS);
}

/** The Monday of the week happening now in Ann Arbor, as YYYY-MM-DD. */
function currentWeekStart(now = new Date()) {
  return mondayOf(...parse(LOCAL_DATE.format(now)));
}

/**
 * The Monday of the week holding this date, or null if the date is not real.
 * Date.UTC rolls February 30th over into March rather than refusing it, so
 * check the parts survived the trip.
 */
function weekStartContaining(date) {
  const [year, month, day] = parse(date);
  const asDate = new Date(Date.UTC(year, month - 1, day));

  const intact =
    asDate.getUTCFullYear() === year &&
    asDate.getUTCMonth() === month - 1 &&
    asDate.getUTCDate() === day;

  return intact ? mondayOf(year, month, day) : null;
}

function shiftWeeks(weekStart, weeks) {
  const [year, month, day] = parse(weekStart);
  return iso(Date.UTC(year, month - 1, day) + weeks * 7 * DAY_MS);
}

/** "Sep 21–27", or "Sep 28–Oct 4" when the week straddles two months. */
function formatWeek(weekStart) {
  const [year, month, day] = parse(weekStart);
  const start = Date.UTC(year, month - 1, day);
  const end = new Date(start + 6 * DAY_MS);

  const sameMonth = end.getUTCMonth() === month - 1;
  const closing = sameMonth ? String(end.getUTCDate()) : RANGE.format(end);

  return `${RANGE.format(new Date(start))}\u2013${closing}`;
}

module.exports = {
  currentWeekStart,
  weekStartContaining,
  shiftWeeks,
  formatWeek,
  TIMEZONE,
};
