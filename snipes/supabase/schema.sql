-- One row per (snipe, person sniped). Run this in the Supabase SQL editor.
create table if not exists snipes (
  id bigint generated always as identity primary key,
  sniper_id text not null,
  sniped_id text not null,
  channel_id text not null,
  message_ts text not null,
  created_at timestamptz not null default now()
);

-- Slack redelivers events it believes failed; this keeps retries from double counting.
create unique index if not exists snipes_message_target_idx
  on snipes (message_ts, sniped_id);

create index if not exists snipes_sniper_idx on snipes (sniper_id);
create index if not exists snipes_sniped_idx on snipes (sniped_id);

-- The bot connects with the service role key, which bypasses RLS.
alter table snipes enable row level security;

-- All-time leaderboards. security_invoker keeps these under the RLS above:
-- the service role still reads everything, the anon key reads nothing.
-- The ordering here is for querying by hand; callers should still ask for it.
-- Names are not here on purpose: only a couple of dozen people land on these
-- boards, so the worker resolves that handful against Slack directly.
create or replace view top_snipers with (security_invoker = on) as
select
  sniper_id,
  count(*) as total_snipes
from snipes
group by sniper_id
order by total_snipes desc;

-- One row per person tagged, so a post naming three people counts three
-- times here, the same way the bot counts it in the channel.
create or replace view top_sniped with (security_invoker = on) as
select
  sniped_id,
  count(*) as total_sniped
from snipes
group by sniped_id
order by total_sniped desc;
