-- ================================================================
-- Reset & Rise™ — Supabase Database Schema
-- Run this entire file in: Supabase → SQL Editor → New Query
-- ================================================================

-- Enable Row Level Security on all tables
-- Users table is handled by Supabase Auth automatically

-- ── Profiles ─────────────────────────────────────────────────
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  timezone    text default 'Europe/London',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
alter table profiles enable row level security;
create policy "Users can view own profile"   on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- ── Daily Planner Entries ─────────────────────────────────────
create table if not exists daily_entries (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete cascade not null,
  entry_date     date not null,
  priority_1     text,
  priority_2     text,
  priority_3     text,
  block_morning  text,
  block_afternoon text,
  block_evening  text,
  affirmation    text,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now(),
  unique(user_id, entry_date)
);
alter table daily_entries enable row level security;
create policy "Users own daily entries" on daily_entries for all using (auth.uid() = user_id);

-- ── Habit Tracker ─────────────────────────────────────────────
create table if not exists habits (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  icon        text,
  sort_order  int default 0,
  created_at  timestamptz default now()
);
alter table habits enable row level security;
create policy "Users own habits" on habits for all using (auth.uid() = user_id);

create table if not exists habit_logs (
  id         uuid primary key default gen_random_uuid(),
  habit_id   uuid references habits(id) on delete cascade not null,
  user_id    uuid references auth.users(id) on delete cascade not null,
  log_date   date not null,
  completed  boolean default false,
  unique(habit_id, log_date)
);
alter table habit_logs enable row level security;
create policy "Users own habit logs" on habit_logs for all using (auth.uid() = user_id);

-- ── Mood & Mental Health ──────────────────────────────────────
create table if not exists mood_entries (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete cascade not null,
  entry_date     date not null,
  mood           text,          -- 'low' | 'okay' | 'good' | 'calm' | 'rising'
  stress_level   int,           -- 1–10
  brain_dump     text,
  reflection     text,
  peace_bank     text,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now(),
  unique(user_id, entry_date)
);
alter table mood_entries enable row level security;
create policy "Users own mood entries" on mood_entries for all using (auth.uid() = user_id);

-- ── Finance ───────────────────────────────────────────────────
create table if not exists finance_entries (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade not null,
  month           text not null,   -- e.g. '2025-06'
  income          numeric(12,2) default 0,
  exp_rent        numeric(12,2) default 0,
  exp_groceries   numeric(12,2) default 0,
  exp_children    numeric(12,2) default 0,
  exp_selfcare    numeric(12,2) default 0,
  exp_savings     numeric(12,2) default 0,
  exp_other       numeric(12,2) default 0,
  savings_goal    numeric(12,2) default 1000,
  savings_saved   numeric(12,2) default 0,
  mindset_note    text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique(user_id, month)
);
alter table finance_entries enable row level security;
create policy "Users own finance entries" on finance_entries for all using (auth.uid() = user_id);

-- ── Meal Plans ────────────────────────────────────────────────
create table if not exists meal_plans (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  week_start    date not null,   -- always a Monday
  grocery_list  text,
  batch_sunday  text,
  batch_midweek text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique(user_id, week_start)
);
alter table meal_plans enable row level security;
create policy "Users own meal plans" on meal_plans for all using (auth.uid() = user_id);

create table if not exists meal_entries (
  id          uuid primary key default gen_random_uuid(),
  plan_id     uuid references meal_plans(id) on delete cascade not null,
  user_id     uuid references auth.users(id) on delete cascade not null,
  day_label   text not null,   -- 'Mon', 'Tue', etc.
  breakfast   text,
  lunch       text,
  dinner      text
);
alter table meal_entries enable row level security;
create policy "Users own meal entries" on meal_entries for all using (auth.uid() = user_id);

-- ── Journal Entries ───────────────────────────────────────────
create table if not exists journal_entries (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade not null,
  entry_date      date not null,
  prompt_used     text,
  journal_text    text,
  ai_response     text,
  gratitude_1     text,
  gratitude_2     text,
  gratitude_3     text,
  tonight_intention text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique(user_id, entry_date)
);
alter table journal_entries enable row level security;
create policy "Users own journal entries" on journal_entries for all using (auth.uid() = user_id);

-- ── Auto-update timestamps ────────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger trg_profiles_updated    before update on profiles         for each row execute function update_updated_at();
create trigger trg_daily_updated       before update on daily_entries    for each row execute function update_updated_at();
create trigger trg_mood_updated        before update on mood_entries     for each row execute function update_updated_at();
create trigger trg_finance_updated     before update on finance_entries  for each row execute function update_updated_at();
create trigger trg_meal_plan_updated   before update on meal_plans       for each row execute function update_updated_at();
create trigger trg_journal_updated     before update on journal_entries  for each row execute function update_updated_at();

-- ── Seed default habits for new users (via trigger) ──────────
create or replace function create_default_habits()
returns trigger language plpgsql security definer as $$
begin
  insert into habits (user_id, name, icon, sort_order) values
    (new.id, 'Hydration (8 glasses)', '💧', 1),
    (new.id, 'Morning ritual',        '☀️', 2),
    (new.id, 'Movement / walk',       '🚶', 3),
    (new.id, 'Gratitude journal',     '📓', 4);
  return new;
end;
$$;

create trigger trg_new_user_habits
  after insert on profiles
  for each row execute function create_default_habits();

-- ── Profile auto-create on sign up ───────────────────────────
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
