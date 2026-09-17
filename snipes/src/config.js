function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

module.exports = {
  slack: {
    signingSecret: () => requireEnv('SLACK_SIGNING_SECRET'),
    botToken: () => requireEnv('SLACK_BOT_TOKEN'),
  },
  supabase: {
    url: () => requireEnv('SUPABASE_URL'),
    serviceKey: () => requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  },
  snipes: {
    // Required: the bot ignores every channel until this is set.
    channelId: () => requireEnv('SNIPES_CHANNEL_ID'),
  },
};
