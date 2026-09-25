# Slack Bot

Slack snipes bot running on [Cloudflare Workers](https://developers.cloudflare.com/workers/)
via [slack-cloudflare-workers](https://github.com/slack-edge/slack-cloudflare-workers),
with counts stored in Supabase.

## Features

- Welcome DM on `team_join`
- Snipe counter for one channel: an image post that mentions someone credits the
  poster with a snipe and each mentioned user with a "sniped" (set the channel
  with `SNIPES_CHANNEL_ID`)
- Public leaderboard at the Worker's root url, with all-time boards for both
  snipers and their victims

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
6. Create the table and the leaderboard views by running `supabase/schema.sql`
   in the Supabase SQL editor, then copy the project URL and service role key
   from **Project Settings → API**. Re-run the file after pulling changes to
   it; everything in there is `if not exists` or `create or replace`.
7. Copy the channel id you want to count snipes in (right-click the channel in
   Slack → **View channel details**) into `SNIPES_CHANNEL_ID`.

Wrangler needs Node 22+:

```bash
nvm use          # reads .nvmrc
npm install
```

Secrets for local runs live in `.dev.vars` (same keys as `.env.example`, gitignored).

## Leaderboard

`GET /` serves the board; `/slack/events` stays the bot's endpoint. It is
public, so anyone with the url sees staff names and counts.

Both boards are queried and rendered server side, so the "Top victims" button
only flips which table is visible and the default one works with scripting
off. Gold, silver and bronze go by score rather than row position: everyone
tied at third place gets a bronze, and the next person down is fifth.

Totals count rows in `snipes`, so a post that tags three people is three
snipes for the poster, matching the running count the bot posts in the
channel. Change `count(*)` to `count(distinct message_ts)` in
`supabase/schema.sql` to rank by posts instead.

Only ids are stored, so names come from Slack, looked up for the couple of
dozen people actually on a board rather than by walking the workspace. Three
things keep that cheap: the page sits in the edge cache for a minute, names
are held for six hours in `src/slack/userNames.js` (shared with the bot, so
each warms the other), and ids common to both boards are resolved once.
Anyone who fails to resolve falls back to their raw id. If the board ever
approaches a hundred people, a single paginated `users.list` becomes the
better trade.

## Local testing

```bash
npm start        # wrangler dev on port 3001
# in another terminal, expose it:
npx cloudflared tunnel --url http://localhost:3001
```

The leaderboard is then at `http://localhost:3001/`.

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
wrangler secret put SNIPES_CHANNEL_ID
```

Then point Event Subscriptions at `https://<worker-subdomain>.workers.dev/slack/events`.
The leaderboard is at `https://<worker-subdomain>.workers.dev/`.

## AWS Lambda (previous target)

`serverless.yml` and `src/app.js` still hold the Bolt + Lambda setup, reachable via
`npm run lambda:start` and `npm run lambda:deploy`. Delete them once the Worker is
running to avoid maintaining two entry points.

## Next steps

- Edit welcome copy in `src/handlers/welcome.js`
- Point the bot at a different channel with `SNIPES_CHANNEL_ID`
- Adjust what counts as a snipe in `src/handlers/channelMessage.js`
- Restyle the leaderboard in `src/web/dashboard.js`
- Add weekly or per-semester boards alongside the views in `supabase/schema.sql`
