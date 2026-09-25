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

// PostgREST caps a response at a thousand rows, and silently: a truncated
// page looks exactly like a short one, so walk until a page comes back short.
const PAGE = 1000;

/**
 * Snipes these people took between two instants, as a map. The window is
 * half-open, and only people who scored appear, so the caller fills in zero
 * for the rest. Counting here rather than in the database is what lets the
 * window be any range at all instead of a week a view had to know about.
 */
async function snipesBetween(userIds, fromIso, toIso) {
  const totals = new Map();
  if (userIds.length === 0) return totals;

  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await getClient()
      .from('snipes')
      .select('sniper_id')
      .gte('created_at', fromIso)
      .lt('created_at', toIso)
      .in('sniper_id', userIds)
      // Paging is only stable under an order the database will not vary.
      .order('id')
      .range(offset, offset + PAGE - 1);

    if (error) throw error;

    const page = data ?? [];
    for (const row of page) {
      totals.set(row.sniper_id, (totals.get(row.sniper_id) ?? 0) + 1);
    }

    if (page.length < PAGE) return totals;
  }
}

module.exports = { topSnipers, topSniped, snipesBetween };
