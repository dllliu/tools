const { getClient } = require('./client');

/**
 * Reads one of the all-time views. They sort themselves, but PostgREST is free
 * to wrap a view in an outer query, so ask for the order explicitly.
 */
async function readBoard(view, idColumn, totalColumn) {
  const { data, error } = await getClient()
    .from(view)
    .select(`${idColumn}, ${totalColumn}`)
    .order(totalColumn, { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    userId: row[idColumn],
    total: Number(row[totalColumn]),
  }));
}

const topSnipers = () => readBoard('top_snipers', 'sniper_id', 'total_snipes');
const topSniped = () => readBoard('top_sniped', 'sniped_id', 'total_sniped');

/**
 * Snipes these people took during one week, as a map. The view only has rows
 * for weeks somebody was active in, so anyone absent scored nothing and the
 * caller fills in the zero.
 */
async function weeklySnipes(userIds, weekStart) {
  if (userIds.length === 0) return new Map();

  const { data, error } = await getClient()
    .from('weekly_snipers')
    .select('sniper_id, total_snipes')
    .eq('week_start', weekStart)
    .in('sniper_id', userIds);

  if (error) throw error;

  return new Map((data ?? []).map((row) => [row.sniper_id, Number(row.total_snipes)]));
}

module.exports = { topSnipers, topSniped, weeklySnipes };
