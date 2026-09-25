const { topSnipers, topSniped } = require('../store/leaderboard');
const { displayNames } = require('../slack/userNames');
const { renderDashboard } = require('../web/dashboard');

const CACHE_SECONDS = 60;

function html(body, status = 200, cacheSeconds = 0) {
  const headers = { 'content-type': 'text/html; charset=utf-8' };
  if (cacheSeconds > 0) headers['cache-control'] = `public, max-age=${cacheSeconds}`;
  return new Response(body, { status, headers });
}

const attachNames = (rows, names) =>
  rows.map((row) => ({ ...row, name: names.get(row.userId) ?? null }));

/**
 * Serves the leaderboard. Both boards are rendered into the page, and the
 * result sits in the edge cache for a minute so a crowd of readers does not
 * become a crowd of Supabase queries.
 */
async function handleDashboardRequest({ request, ctx, logger = console }) {
  // The cache only takes GETs, and there is nothing to do with anything else.
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405, headers: { allow: 'GET' } });
  }

  const cache = caches.default;
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const [snipers, sniped] = await Promise.all([topSnipers(), topSniped()]);

    // Only the people actually on a board, and only the ones not already held
    // from an earlier request or an earlier snipe.
    const ids = new Set([...snipers, ...sniped].map((row) => row.userId));
    const names = await displayNames([...ids], { logger });

    const response = html(
      renderDashboard({ snipers: attachNames(snipers, names), sniped: attachNames(sniped, names) }),
      200,
      CACHE_SECONDS,
    );
    ctx.waitUntil(cache.put(request, response.clone()));
    return response;
  } catch (error) {
    logger.error(error);
    return html('<h1>Snipes leaderboard</h1><p>Could not load the board. Try again shortly.</p>', 500);
  }
}

module.exports = { handleDashboardRequest };
