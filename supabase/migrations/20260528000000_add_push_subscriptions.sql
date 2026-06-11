/*
  # Add push_subscriptions table for Web Push notifications

  Stores browser push subscription data so the server-side Edge Function
  can send real push notifications even when the browser tab is closed.

  1. New Table
    - `push_subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `endpoint` (text, the push service URL)
      - `p256dh` (text, encryption key)
      - `auth` (text, authentication secret)
      - `created_at` (timestamptz)
      - UNIQUE(user_id, endpoint) to prevent duplicate subscriptions

  2. Security
    - RLS enabled
    - Users can only manage their own subscriptions
*/

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscriptions
CREATE POLICY "Users can read own push subscriptions"
  ON push_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own subscriptions
CREATE POLICY "Users can insert own push subscriptions"
  ON push_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own subscriptions
CREATE POLICY "Users can delete own push subscriptions"
  ON push_subscriptions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow service role full access (needed by Edge Function)
CREATE POLICY "Service role can read all push subscriptions"
  ON push_subscriptions FOR SELECT
  TO service_role
  USING (true);

-- Index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
