// Everything here is reckoned in Ann Arbor time rather than UTC, so a Sunday
// evening snipe counts against the day and week it actually happened in.
const TIMEZONE = 'America/Detroit';
const DAY_MS = 86400000;

const LOCAL_DATE = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const LOCAL_PARTS = new Intl.DateTimeFormat('en-US', {
  timeZone: TIMEZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

const MONTH_DAY = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' });
const MONTH_DAY_YEAR = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const split = (date) => date.split('-').map(Number);
const asDate = (ms) => new Date(ms).toISOString().slice(0, 10);
const wallClock = (date) => {
  const [year, month, day] = split(date);
  return Date.UTC(year, month - 1, day);
};

/** Date.UTC rolls February 30th into March rather than refusing it. */
function isRealDate(date) {
  const [year, month, day] = split(date);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

/** How far Ann Arbor's clocks sit from UTC at a given instant. */
function offsetAt(ms) {
  const parts = Object.fromEntries(
    LOCAL_PARTS.formatToParts(new Date(ms)).map((part) => [part.type, part.value]),
  );
  const local = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );

  return local - ms;
}

/**
 * The instant at which Ann Arbor's clocks read midnight on this date. The
 * offset has to be measured at the answer rather than at the guess, so it is
 * applied twice: the first pass lands within an hour, the second settles the
 * two weekends a year when the clocks move.
 */
function midnight(date) {
  const wall = wallClock(date);
  return wall - offsetAt(wall - offsetAt(wall));
}

/** A period is a pair of inclusive local dates, plus how it was asked for. */
const period = (from, to, isWeek = false) => ({ from, to, isWeek });

function weekOf(date) {
  const wall = wallClock(date);
  const sinceMonday = (new Date(wall).getUTCDay() + 6) % 7;
  const monday = wall - sinceMonday * DAY_MS;

  return period(asDate(monday), asDate(monday + 6 * DAY_MS), true);
}

const currentWeek = (now = new Date()) => weekOf(LOCAL_DATE.format(now));

function shiftWeeks(weeks, now = new Date()) {
  const { from } = currentWeek(now);
  return weekOf(asDate(wallClock(from) + weeks * 7 * DAY_MS));
}

/**
 * Half-open instants for a database query: from midnight on the first day up
 * to, but not including, midnight after the last one.
 */
function bounds({ from, to }) {
  return {
    fromIso: new Date(midnight(from)).toISOString(),
    toIso: new Date(midnight(asDate(wallClock(to) + DAY_MS))).toISOString(),
  };
}

/** "week of Sep 21–27", "Sep 1–11", or "Sep 1, 2026–Jan 3, 2027". */
function format({ from, to, isWeek }) {
  const start = new Date(wallClock(from));
  const end = new Date(wallClock(to));

  let label;
  if (start.getUTCFullYear() !== end.getUTCFullYear()) {
    label = `${MONTH_DAY_YEAR.format(start)}\u2013${MONTH_DAY_YEAR.format(end)}`;
  } else if (start.getUTCMonth() === end.getUTCMonth()) {
    label = `${MONTH_DAY.format(start)}\u2013${end.getUTCDate()}`;
  } else {
    label = `${MONTH_DAY.format(start)}\u2013${MONTH_DAY.format(end)}`;
  }

  return isWeek ? `week of ${label}` : label;
}

module.exports = {
  currentWeek,
  shiftWeeks,
  period,
  isRealDate,
  bounds,
  format,
  TIMEZONE,
};
