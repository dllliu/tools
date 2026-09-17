const { createClient } = require('@supabase/supabase-js');
const config = require('../config');

const TABLE = 'snipes';

let client;

function getClient() {
  if (!client) {
    client = createClient(config.supabase.url(), config.supabase.serviceKey(), {
      auth: { persistSession: false },
    });
  }
  return client;
}

/**
 * Records one snipe. Slack retries events it thinks failed, so the unique
 * index on (message_ts, sniped_id) makes a repeat delivery a no-op.
 * Resolves to false when the row already existed.
 */
async function recordSnipe({ sniperId, snipedId, channelId, messageTs }) {
  const { data, error } = await getClient()
    .from(TABLE)
    .upsert(
      {
        sniper_id: sniperId,
        sniped_id: snipedId,
        channel_id: channelId,
        message_ts: messageTs,
      },
      { onConflict: 'message_ts,sniped_id', ignoreDuplicates: true },
    )
    .select('id');

  if (error) throw error;
  return data.length > 0;
}

async function countBy(column, userId) {
  const { count, error } = await getClient()
    .from(TABLE)
    .select('id', { count: 'exact', head: true })
    .eq(column, userId);

  if (error) throw error;
  return count ?? 0;
}

const countSnipesTaken = (userId) => countBy('sniper_id', userId);
const countTimesSniped = (userId) => countBy('sniped_id', userId);

module.exports = { recordSnipe, countSnipesTaken, countTimesSniped };
