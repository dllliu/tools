const { getClient } = require('./client');

/**
 * Every roster, keyed by lowercased name. The table holds a handful of rows,
 * so reading it whole costs nothing and saves matching a name people type by
 * hand through a pattern query, where a stray % would quietly match the wrong
 * team. It also leaves the caller with the full list to name in an error.
 */
async function loadTeams() {
  const { data, error } = await getClient().from('teams').select('team_name, user_id');

  if (error) throw error;

  const teams = new Map();
  for (const row of data ?? []) {
    const name = row.team_name.trim();
    const key = name.toLowerCase();
    const team = teams.get(key) ?? { name, userIds: [] };

    team.userIds.push(row.user_id);
    teams.set(key, team);
  }

  return teams;
}

module.exports = { loadTeams };
