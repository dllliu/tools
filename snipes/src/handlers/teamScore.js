const { loadTeams } = require('../store/teams');
const { snipesBetween } = require('../store/leaderboard');
const { displayNames } = require('../slack/userNames');
const periods = require('../periods');

const USAGE = 'Usage: `/team-score "team name" [this | last | -3]`';

// Phones turn a typed quote into a curly pair, so a name can open with one
// character and close with a different one.
const CLOSING_QUOTE = { '"': '"', "'": "'", '\u2018': '\u2019', '\u201c': '\u201d' };

const THIS_WEEK = /^this$/i;
const LAST_WEEK = /^(last|prev|previous)$/i;
const WEEKS_BACK = /^-\d+$/;
const WEEK_WORD = /^(this|last|prev|previous|-\d+)$/i;

/** The week asked for, or null if the word is not one. */
function parsePeriod(word, now = new Date()) {
  if (!word || THIS_WEEK.test(word)) return periods.currentWeek(now);
  if (LAST_WEEK.test(word)) return periods.shiftWeeks(-1, now);
  if (WEEKS_BACK.test(word)) return periods.shiftWeeks(Number(word), now);

  return null;
}

/**
 * A team name can hold spaces, so quoting it settles where it ends. Unquoted,
 * the last word is only a week if it reads as one and leaves a name behind,
 * so "Sports Desk" stays whole while "Sports Desk last" splits. A lone word is
 * always the name, which leaves a desk called Last reachable as itself.
 */
function parseArgs(text) {
  const raw = (text ?? '').trim();

  const closing = CLOSING_QUOTE[raw[0]];
  const quoted = closing ? raw.indexOf(closing, 1) : -1;
  if (quoted > 0) {
    return { teamName: raw.slice(1, quoted).trim(), word: raw.slice(quoted + 1).trim() };
  }

  const words = raw.split(/\s+/).filter(Boolean);
  if (words.length > 1 && WEEK_WORD.test(words.at(-1))) {
    return { teamName: words.slice(0, -1).join(' '), word: words.at(-1) };
  }

  return { teamName: words.join(' '), word: '' };
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
  const { teamName, word } = parseArgs(text);
  const teams = await loadTeams();

  if (!teamName) return `${USAGE}. ${nameList(teams)}`;

  const team = teams.get(teamName.toLowerCase());
  if (!team) return `I don't know a team called *${teamName}*. ${nameList(teams)}`;

  const period = parsePeriod(word);
  if (!period) return `I can't read *${word}* as a week. ${USAGE}`;

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
