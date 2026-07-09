-- ================================================================
-- Reset & Rise™ — Parenting Lane
-- Run this in: Supabase → SQL Editor → New Query
-- ================================================================

create table if not exists parenting_entries (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete cascade not null,
  entry_date       date not null,
  child_name       text,
  morning_checked  text,  -- JSON: string[]
  evening_checked  text,  -- JSON: string[]
  morning_custom   text,  -- JSON: string[]
  evening_custom   text,  -- JSON: string[]
  chores_done      text,  -- JSON: string[]
  chores_custom    text,  -- JSON: string[]
  emotion_today    text,
  emotion_note     text,
  reward_chosen    text,
  parenting_note   text,
  proud_moment     text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),
  unique(user_id, entry_date)
);

alter table parenting_entries enable row level security;
create policy "Users own parenting entries"
  on parenting_entries for all using (auth.uid() = user_id);

create trigger trg_parenting_updated
  before update on parenting_entries
  for each row execute function update_updated_at();
