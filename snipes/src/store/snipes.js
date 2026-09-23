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
 * Records one snipe against every person it named, in a single statement so a
 * post can never end up half counted. Slack retries events it thinks failed,
 * so the unique index on (message_ts, sniped_id) makes a repeat delivery a
 * no-op. Resolves to the number of rows that were new.
 */
async function recordSnipes({ sniperId, snipedIds, channelId, messageTs }) {
  const { data, error } = await getClient()
    .from(TABLE)
    .upsert(
      snipedIds.map((snipedId) => ({
        sniper_id: sniperId,
        sniped_id: snipedId,
        channel_id: channelId,
        message_ts: messageTs,
      })),
      { onConflict: 'message_ts,sniped_id', ignoreDuplicates: true },
    )
    .select('id');

  if (error) throw error;
  return data.length;
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

module.exports = { recordSnipes, countSnipesTaken, countTimesSniped };
