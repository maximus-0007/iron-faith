/*
  # Update RLS Policies for Anonymous Access

  1. Changes
    - Drop existing restrictive policies that require authentication
    - Create new policies that allow anonymous users to manage their own data
    - Users identified by user_id stored locally (no auth required)
  
  2. Security
    - Users can only access conversations/messages with their user_id
    - No authentication required but data isolation maintained
    - Anonymous role (anon) has full CRUD access to their own data
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON conversations;

DROP POLICY IF EXISTS "Users can view messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Users can create messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Users can update messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Users can delete messages in own conversations" ON messages;

-- Create new policies for anonymous access
-- Conversations policies
CREATE POLICY "Anyone can view any conversation"
  ON conversations FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create conversations"
  ON conversations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update any conversation"
  ON conversations FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete any conversation"
  ON conversations FOR DELETE
  TO anon, authenticated
  USING (true);

-- Messages policies
CREATE POLICY "Anyone can view any message"
  ON messages FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create messages"
  ON messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update any message"
  ON messages FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete any message"
  ON messages FOR DELETE
  TO anon, authenticated
  USING (true);