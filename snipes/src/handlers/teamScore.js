const { loadTeams } = require('../store/teams');
const { snipesBetween } = require('../store/leaderboard');
const { displayNames } = require('../slack/userNames');
const periods = require('../periods');

const USAGE =
  'Usage: `/team-score "team name" [last | -2 | 2026-09-01 to 2026-09-11]`';

// Phones turn a typed quote into a curly pair, so a name can open with one
// character and close with a different one.
const CLOSING_QUOTE = { '"': '"', "'": "'", '\u2018': '\u2019', '\u201c': '\u201d' };

const DATE = '\\d{4}-\\d{2}-\\d{2}';
const RANGE = new RegExp(`^(${DATE})\\s*(?:to|\\.\\.)\\s*(${DATE})$`, 'i');

// Words that are an attempt at a period, sound or not. Recognising the attempt
// is what separates "that range runs backwards" from "no such team".
const PERIOD_WORD = new RegExp(
  `^(${DATE}|${DATE}\\.\\.${DATE}|to|\\.\\.|this|last|prev|previous|-\\d+)$`,
  'i',
);

// "2026-09-01 to 2026-09-11" is the longest an argument gets.
const MAX_WORDS = 3;

/**
 * The window asked for, or null if these words are not one. Weeks still have
 * their shorthands; anything else is a plain range of dates, which is why the
 * end is spelled out rather than inferred from a week the dates fall in.
 */
function parsePeriod(words, now = new Date()) {
  const argument = words.join(' ');

  if (words.length === 0 || /^this$/i.test(argument)) return periods.currentWeek(now);
  if (/^(last|prev|previous)$/i.test(argument)) return periods.shiftWeeks(-1, now);
  if (/^-\d+$/.test(argument)) return periods.shiftWeeks(Number(argument), now);

  const range = argument.match(RANGE);
  if (!range) return null;

  const [, from, to] = range;
  if (!periods.isRealDate(from) || !periods.isRealDate(to) || from > to) return null;

  return periods.period(from, to);
}

/**
 * A team name can hold spaces, so quoting it settles where it ends. Unquoted,
 * the split falls after the last word that could not be part of a period, so
 * "Sports Desk" stays whole while "Sports Desk last" splits. A single word is
 * always the name, which leaves a desk called Last reachable as itself.
 */
function parseArgs(text) {
  const raw = (text ?? '').trim();

  const closing = CLOSING_QUOTE[raw[0]];
  const quoted = closing ? raw.indexOf(closing, 1) : -1;
  if (quoted > 0) {
    return {
      teamName: raw.slice(1, quoted).trim(),
      words: raw.slice(quoted + 1).trim().split(/\s+/).filter(Boolean),
    };
  }

  const words = raw.split(/\s+/).filter(Boolean);
  for (let take = Math.min(MAX_WORDS, words.length - 1); take >= 1; take -= 1) {
    if (words.slice(-take).every((word) => PERIOD_WORD.test(word))) {
      return { teamName: words.slice(0, -take).join(' '), words: words.slice(-take) };
    }
  }

  return { teamName: words.join(' '), words: [] };
}

function nameList(teams) {
  if (teams.size === 0) return 'No teams are set up yet.';
  const names = [...teams.values()].map((team) => team.name).sort();
  return `Teams: ${names.join(', ')}`;
}

/**
 * One line per person with the snipes they took, then the team's total.
 * Everybody on the roster is listed, including whoever scored nothing,
 * because a team score is about who turned up as much as who led.
 */
function format({ team, period, totals, names }) {
  const rows = team.userIds
    .map((userId) => ({
      name: names.get(userId) ?? `<@${userId}>`,
      points: totals.get(userId) ?? 0,
    }))
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));

  const sum = rows.reduce((running, row) => running + row.points, 0);

  return [
    `*${team.name}* \u2014 ${periods.format(period)}`,
    ...rows.map((row) => `${row.name}: \`${row.points}\``),
    `*Total: \`${sum}\`*`,
  ].join('\n');
}

async function teamScoreMessage({ text, client, logger = console }) {
  const { teamName, words } = parseArgs(text);
  const teams = await loadTeams();

  if (!teamName) return `${USAGE}. ${nameList(teams)}`;

  const team = teams.get(teamName.toLowerCase());
  if (!team) return `I don't know a team called *${teamName}*. ${nameList(teams)}`;

  const period = parsePeriod(words);
  if (!period) return `I can't read *${words.join(' ')}* as a period. ${USAGE}`;

  const { fromIso, toIso } = periods.bounds(period);
  const [totals, names] = await Promise.all([
    snipesBetween(team.userIds, fromIso, toIso),
    displayNames(team.userIds, { client, logger }),
  ]);

  return format({ team, period, totals, names });
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

module.exports = { handleTeamScore, teamScoreMessage, parseArgs, parsePeriod };
