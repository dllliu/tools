const { loadTeams } = require('../store/teams');
const { weeklySnipes } = require('../store/leaderboard');
const { displayNames } = require('../slack/userNames');
const {
  currentWeekStart,
  weekStartContaining,
  shiftWeeks,
  formatWeek,
} = require('../weeks');

const USAGE = 'Usage: `/team-score "team name" [last | -2 | 2026-09-21]`';

// Phones turn a typed quote into a curly pair, so a name can open with one
// character and close with a different one.
const CLOSING_QUOTE = { '"': '"', "'": "'", '\u2018': '\u2019', '\u201c': '\u201d' };
const WEEK_ARG = /^(this|last|prev|previous|-\d+|\d{4}-\d{2}-\d{2})$/i;

/**
 * A team name can hold spaces, so quoting it settles where it ends. Without
 * quotes the only ambiguity is the final word, and that is only a week if it
 * looks like nothing else: "Sports Desk" stays whole, "Sports Desk last" does
 * not. Anyone with a desk genuinely called "last" can quote their way out.
 */
function parseArgs(text) {
  const raw = (text ?? '').trim();

  const closing = CLOSING_QUOTE[raw[0]];
  const end = closing ? raw.indexOf(closing, 1) : -1;
  if (end > 0) {
    return { teamName: raw.slice(1, end).trim(), week: raw.slice(end + 1).trim() };
  }

  const words = raw.split(/\s+/).filter(Boolean);
  if (words.length > 1 && WEEK_ARG.test(words.at(-1))) {
    return { teamName: words.slice(0, -1).join(' '), week: words.at(-1) };
  }

  return { teamName: words.join(' '), week: '' };
}

/** The Monday the argument points at, or null if it points nowhere real. */
function resolveWeek(argument) {
  if (!argument || /^this$/i.test(argument)) return currentWeekStart();
  if (/^(last|prev|previous)$/i.test(argument)) return shiftWeeks(currentWeekStart(), -1);
  if (/^-\d+$/.test(argument)) return shiftWeeks(currentWeekStart(), Number(argument));

  return weekStartContaining(argument);
}

function nameList(teams) {
  if (teams.size === 0) return 'No teams are set up yet.';
  const names = [...teams.values()].map((team) => team.name).sort();
  return `Teams: ${names.join(', ')}`;
}

/**
 * One line per person with the snipes they took that week, then the team's
 * total. Everybody on the roster is listed, including whoever scored nothing,
 * because a team score is about who turned up as much as who led.
 */
function format({ team, weekStart, totals, names }) {
  const rows = team.userIds
    .map((userId) => ({
      name: names.get(userId) ?? `<@${userId}>`,
      points: totals.get(userId) ?? 0,
    }))
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));

  const sum = rows.reduce((running, row) => running + row.points, 0);

  return [
    `*${team.name}* \u2014 week of ${formatWeek(weekStart)}`,
    ...rows.map((row) => `${row.name}: \`${row.points}\``),
    `*Total: \`${sum}\`*`,
  ].join('\n');
}

async function teamScoreMessage({ text, client, logger = console }) {
  const { teamName, week } = parseArgs(text);
  const teams = await loadTeams();

  if (!teamName) return `${USAGE}. ${nameList(teams)}`;

  const team = teams.get(teamName.toLowerCase());
  if (!team) return `I don't know a team called *${teamName}*. ${nameList(teams)}`;

  const weekStart = resolveWeek(week);
  if (!weekStart) return `*${week}* is not a date I can read. ${USAGE}`;

  const [totals, names] = await Promise.all([
    weeklySnipes(team.userIds, weekStart),
    displayNames(team.userIds, { client, logger }),
  ]);

  return format({ team, weekStart, totals, names });
}

/**
 * Runs after the command has already been acknowledged, so Slack is not
 * waiting on Supabase; the reply arrives over the response url instead.
 */
async function handleTeamScore({ text, client, respond, logger = console }) {
  try {
    await respond({
      text: await teamScoreMessage({ text, client, logger }),
      response_type: 'in_channel',
    });
  } catch (error) {
    logger.error(error);
    await respond({ text: 'Could not work out that score. Try again shortly.' });
  }
}

module.exports = { handleTeamScore, teamScoreMessage, parseArgs, resolveWeek };
