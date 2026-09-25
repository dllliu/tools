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

module.exports = { topSnipers, topSniped };
