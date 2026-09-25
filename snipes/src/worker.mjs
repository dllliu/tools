import { SlackApp } from 'slack-cloudflare-workers';
import { handleTeamJoin } from './handlers/welcome.js';
import { handleChannelMessage } from './handlers/channelMessage.js';
import { handleDashboardRequest } from './handlers/dashboard.js';

// Workers hands bindings to each request, while config.js and the store read
// process.env, so mirror them across before any handler runs.
const SECRETS = [
  'SLACK_SIGNING_SECRET',
  'SLACK_BOT_TOKEN',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SNIPES_CHANNEL_ID',
];

function exposeSecrets(env) {
  for (const key of SECRETS) {
    if (env[key]) process.env[key] = env[key];
  }
}

function slackApp(env) {
  return new SlackApp({ env })
    .event('team_join', async ({ payload, context }) =>
      handleTeamJoin({ event: payload, client: context.client, logger: console }),
    )
    .event('message', async ({ payload, context }) =>
      handleChannelMessage({
        message: payload,
        say: (arg) =>
          context.client.chat.postMessage({
            channel: payload.channel,
            ...(typeof arg === 'string' ? { text: arg } : arg),
          }),
        client: context.client,
        logger: console,
      }),
    );
}

export default {
  async fetch(request, env, ctx) {
    exposeSecrets(env);

    const { pathname } = new URL(request.url);

    if (pathname === '/') return handleDashboardRequest({ request, ctx, logger: console });
    if (pathname.startsWith('/slack/')) return await slackApp(env).run(request, ctx);

    return new Response('Not found', { status: 404 });
  },
};
