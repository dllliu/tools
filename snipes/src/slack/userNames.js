const { SlackAPIClient } = require('slack-cloudflare-workers');
const config = require('../config');

// Names change rarely, so hold them for the life of the isolate. The bot and
// the leaderboard share this map, so each one warms the other.
const TTL_MS = 6 * 60 * 60 * 1000;
const names = new Map();

let ownClient;

// Event handlers arrive with a client; the leaderboard has no event, so it
// falls back to one built from the bot token.
function clientOr(client) {
  if (client) return client;
  if (!ownClient) ownClient = new SlackAPIClient(config.slack.botToken());
  return ownClient;
}

function cached(userId) {
  const hit = names.get(userId);
  if (hit && hit.expiresAt > Date.now()) return hit.name;
  return null;
}

async function lookup(client, userId) {
  const { user } = await clientOr(client).users.info({ user: userId });
  const name = user.profile?.display_name || user.real_name || user.name;
  if (!name) return null;

  names.set(userId, { name, expiresAt: Date.now() + TTL_MS });
  return name;
}

/**
 * Human-readable name for a user id, falling back to a plain mention if the
 * lookup fails so a snipe still gets announced.
 */
async function displayName(client, userId) {
  const hit = cached(userId);
  if (hit) return hit;

  try {
    // Leave failures uncached so the next snipe retries the lookup.
    return (await lookup(client, userId)) ?? `<@${userId}>`;
  } catch {
    return `<@${userId}>`;
  }
}

/**
 * Names for a set of ids, as a map. Only the ids on the board get looked up,
 * which is a few dozen calls rather than a walk of the whole workspace, and
 * ids that cannot be resolved are simply absent so callers can show the id.
 */
async function displayNames(userIds, { client, logger = console } = {}) {
  const resolved = new Map();
  const missing = [];

  for (const userId of userIds) {
    const hit = cached(userId);
    if (hit) resolved.set(userId, hit);
    else missing.push(userId);
  }

  const fetched = await Promise.all(
    missing.map(async (userId) => {
      try {
        return [userId, await lookup(client, userId)];
      } catch (error) {
        logger.error(error);
        return [userId, null];
      }
    }),
  );

  for (const [userId, name] of fetched) {
    if (name) resolved.set(userId, name);
  }

  return resolved;
}

module.exports = { displayName, displayNames };
