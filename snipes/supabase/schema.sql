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

-- Rosters behind /score, kept here rather than in the code so a desk can
-- be re-staffed from the Supabase table editor without a deploy. Keying on the
-- person is what holds them to one team: there is nowhere to record a second,
-- so no snipe can be counted for two teams at once. It also makes moving
-- somebody an upsert rather than a delete and an insert.
create table if not exists teams (
  user_id text primary key,
  team_name text not null
);

-- The first cut of this table keyed on (team_name, user_id), which let one
-- person sit on several teams at once. Move the key where that is still so.
do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conrelid = 'teams'::regclass
      and contype = 'p'
      and array_length(conkey, 1) > 1
  ) then
    alter table teams drop constraint teams_pkey;
    alter table teams add constraint teams_pkey primary key (user_id);
  end if;
end $$;

alter table teams enable row level security;

-- /score counts a week at a time by filtering snipes on created_at, which
-- keeps week boundaries in one place in the worker instead of baking Ann Arbor
-- time into a view here. This index is what keeps that filter off a table scan.
create index if not exists snipes_created_at_idx on snipes (created_at);
