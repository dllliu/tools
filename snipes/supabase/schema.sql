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
