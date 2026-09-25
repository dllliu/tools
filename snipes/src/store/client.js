const { createClient } = require('@supabase/supabase-js');
const config = require('../config');

let client;

/**
 * One client per isolate. supabase-js talks to PostgREST over HTTP, so this
 * holds no connection, just the url and key.
 */
function getClient() {
  if (!client) {
    client = createClient(config.supabase.url(), config.supabase.serviceKey(), {
      auth: { persistSession: false },
    });
  }
  return client;
}

module.exports = { getClient };
