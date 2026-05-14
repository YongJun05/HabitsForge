/*
  # Create profiles, habits, and habit_logs tables

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `display_name` (text, not null)
      - `created_at` (timestamptz, default now())
    - `habits`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `user_id` (uuid, not null, references profiles)
      - `name` (text, not null, max 50 chars)
      - `description` (text, optional, max 200 chars)
      - `icon` (text, default '🎯')
      - `color` (text, default '#FFE566')
      - `reminder_enabled` (boolean, default false)
      - `reminder_time` (text, optional, HH:MM format)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
    - `habit_logs`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `habit_id` (uuid, not null, references habits)
      - `user_id` (uuid, not null, references profiles)
      - `log_date` (date, not null)
      - `created_at` (timestamptz, default now())
      - UNIQUE constraint on (habit_id, log_date) to prevent double-logging

  2. Security
    - Enable RLS on all three tables
    - profiles: users can only read/update their own profile
    - habits: users can only access their own habits
    - habit_logs: users can only access their own logs

  3. Important Notes
    - CASCADE deletes ensure that deleting a user removes their profile,
      deleting a profile removes their habits, and deleting a habit removes its logs
    - The unique constraint on habit_logs prevents duplicate entries for the same habit on the same day
*/

-- Profiles table (linked to Supabase auth users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habits table
CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) <= 50),
  description TEXT CHECK (char_length(description) <= 200),
  icon TEXT DEFAULT '🎯',
  color TEXT DEFAULT '#FFE566',
  reminder_enabled BOOLEAN DEFAULT FALSE,
  reminder_time TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habit logs table (one row per habit per day when completed)
CREATE TABLE IF NOT EXISTS habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(habit_id, log_date)
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies: users can only read and update their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Habits policies: users can only access their own habits
CREATE POLICY "Users can read own habits"
  ON habits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habits"
  ON habits FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits"
  ON habits FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits"
  ON habits FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Habit logs policies: users can only access their own logs
CREATE POLICY "Users can read own logs"
  ON habit_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs"
  ON habit_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own logs"
  ON habit_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index for faster habit_logs queries by user
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_id ON habit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_id ON habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
