-- ============================================================
-- 002_gamification.sql
-- Run this in the Supabase SQL Editor after 001 (schema.sql)
-- ============================================================

-- Profiles table (XP + streak, one row per auth user)
CREATE TABLE IF NOT EXISTS profiles (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_xp       INTEGER NOT NULL DEFAULT 0,
  total_xp         INTEGER NOT NULL DEFAULT 0,
  user_level       INTEGER NOT NULL DEFAULT 1,
  current_streak   INTEGER NOT NULL DEFAULT 0,
  longest_streak   INTEGER NOT NULL DEFAULT 0,
  last_study_date  DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);

-- Add response_type to card_reviews (tracks easy/hard/forgot/important)
ALTER TABLE card_reviews ADD COLUMN IF NOT EXISTS response_type TEXT;
