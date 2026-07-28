-- ================================================================
-- Reset & Rise™ — Faith Mode + Quote Refresh Updates
-- Run this in: Supabase → SQL Editor → New Query
-- ================================================================

-- Add faith_mode column to faith_entries
-- Stores whether the user has selected 'christian' or 'generic' mode
alter table faith_entries 
  add column if not exists faith_mode text default 'christian';

-- Constraint to valid values only
alter table faith_entries 
  drop constraint if exists faith_entries_mode_check;

alter table faith_entries
  add constraint faith_entries_mode_check 
  check (faith_mode in ('christian', 'generic'));
