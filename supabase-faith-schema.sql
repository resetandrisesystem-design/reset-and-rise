-- ================================================================
-- Reset & Rise™ — Faith & Renewal (VIP Add-On)
-- Run this in: Supabase → SQL Editor → New Query
-- ================================================================

create table if not exists faith_entries (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users(id) on delete cascade not null,
  entry_date          date not null,
  morning_prayer      text,
  scripture_today     text,
  scripture_note      text,
  gratitude_1         text,
  gratitude_2         text,
  gratitude_3         text,
  prayer_categories   text,  -- JSON: string[]
  prayer_requests     text,
  sermon_title        text,
  sermon_notes        text,
  healing_prompt      text,
  evening_reflection  text,
  monthly_reset       text,  -- stored as "answer1|||answer2|||answer3|||answer4"
  faith_intention     text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now(),
  unique(user_id, entry_date)
);

alter table faith_entries enable row level security;
create policy "Users own faith entries"
  on faith_entries for all using (auth.uid() = user_id);

create trigger trg_faith_updated
  before update on faith_entries
  for each row execute function update_updated_at();
