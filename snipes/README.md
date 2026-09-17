# Slack Bot

Slack snipes bot running on [Cloudflare Workers](https://developers.cloudflare.com/workers/)
via [slack-cloudflare-workers](https://github.com/slack-edge/slack-cloudflare-workers),
with counts stored in Supabase.

## Features

- Welcome DM on `team_join`
- Snipe counter for one channel: an image post that mentions someone credits the
  poster with a snipe and each mentioned user with a "sniped" (set the channel in
  `src/handlers/channelMessage.js`)

Counts live in Supabase; the bot reads and writes them with `@supabase/supabase-js`.

## Setup

1. Create a Slack app at https://api.slack.com/apps for your workspace.
2. Enable **Event Subscriptions** and, under **Subscribe to bot events**, add:
   - `team_join` (for welcome DMs)
   - `message.channels` (public channels)
   - `message.groups` (private channels)
3. Under **OAuth & Permissions**, add bot scopes such as:
   - `chat:write`
   - `channels:history` (public channels)
   - `groups:history` (private channels)
   - `files:read` (so image posts arrive with their `files` array)
   - `im:write` (for DMs)
   - `users:read` (to show display names instead of raw user ids)
4. Turn **Socket Mode off**. With it on, Slack delivers events over a WebSocket
   and never calls your Request URL.
5. Install the app to your workspace and copy the **Bot Token** and **Signing Secret**.
6. Create the table by running `supabase/schema.sql` in the Supabase SQL editor,
   then copy the project URL and service role key from **Project Settings → API**.

Wrangler needs Node 22+:

```bash
nvm use          # reads .nvmrc
npm install
```

Secrets for local runs live in `.dev.vars` (same keys as `.env.example`, gitignored).

## Local testing

```bash
npm start        # wrangler dev on port 3000
# in another terminal, expose it:
npx cloudflared tunnel --url http://localhost:3000
```

Set the Slack **Request URL** to the tunnel host plus `/slack/events`:

`https://<tunnel-host>/slack/events`

Note the path has no `/dev` prefix, unlike the old API Gateway setup.

## Deploy

```bash
npm run deploy   # wrangler deploy
```

Upload the secrets once per environment:

```bash
wrangler secret put SLACK_SIGNING_SECRET
wrangler secret put SLACK_BOT_TOKEN
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

Then point Event Subscriptions at `https://<worker-subdomain>.workers.dev/slack/events`.

## AWS Lambda (previous target)

`serverless.yml` and `src/app.js` still hold the Bolt + Lambda setup, reachable via
`npm run lambda:start` and `npm run lambda:deploy`. Delete them once the Worker is
running to avoid maintaining two entry points.

## Next steps

- Edit welcome copy in `src/handlers/welcome.js`
- Adjust what counts as a snipe in `src/handlers/channelMessage.js`
- Add a leaderboard command on top of the counts in `src/store/snipes.js`
