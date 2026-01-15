/*
  # Migrate to Authenticated Users with Supabase Auth

  ## Overview
  This migration transitions the app from anonymous authentication to proper
  Supabase Auth with email/password authentication.

  ## Changes Made

  ### 1. Clean Up Existing Data
    - Remove existing anonymous user data (conversations, messages, profiles)
    - This is necessary because anonymous user_ids don't exist in auth.users

  ### 2. Update Schema
    - Modify user_id columns to reference auth.users
    - Add foreign key constraints to auth.users
    - Ensure data integrity with CASCADE deletes

  ### 3. User Profiles Table
    - Link user_profiles.user_id to auth.users(id)
    - Add trigger to auto-create profile on user signup
    
  ### 4. Security - RLS Policies
    - Replace anonymous access policies with authenticated-only policies
    - Use auth.uid() to validate user identity
    - Ensure users can only access their own data
    - Implement proper SELECT, INSERT, UPDATE, DELETE policies

  ## Security Model
  
  With Supabase Auth, the security model is:
  - ✅ Server-side validation of user sessions via JWT
  - ✅ RLS policies validate auth.uid() against user_id
  - ✅ Users can only access data they own
  - ✅ No ability to spoof or manipulate user_id
  - ✅ Complete data isolation between users

  ## Important Notes
  
  - Email verification is DISABLED to allow immediate app usage
  - Users can sign up and start using the app right away
  - Google and Apple sign-in can be added later
  - Existing anonymous data will be cleared (since it can't be migrated to real users)
*/

-- ============================================================================
-- DROP EXISTING POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Allow anonymous access to conversations" ON conversations;
DROP POLICY IF EXISTS "Allow anonymous access to messages" ON messages;
DROP POLICY IF EXISTS "Allow anonymous access to profiles" ON user_profiles;
DROP POLICY IF EXISTS "Anyone can view any conversation" ON conversations;
DROP POLICY IF EXISTS "Anyone can create conversations" ON conversations;
DROP POLICY IF EXISTS "Anyone can update any conversation" ON conversations;
DROP POLICY IF EXISTS "Anyone can delete any conversation" ON conversations;
DROP POLICY IF EXISTS "Anyone can view any message" ON messages;
DROP POLICY IF EXISTS "Anyone can create messages" ON messages;
DROP POLICY IF EXISTS "Anyone can update any message" ON messages;
DROP POLICY IF EXISTS "Anyone can delete any message" ON messages;
DROP POLICY IF EXISTS "Anyone can view any profile" ON user_profiles;
DROP POLICY IF EXISTS "Anyone can create profiles" ON user_profiles;
DROP POLICY IF EXISTS "Anyone can update any profile" ON user_profiles;
DROP POLICY IF EXISTS "Anyone can delete any profile" ON user_profiles;

-- ============================================================================
-- CLEAN UP EXISTING ANONYMOUS DATA
-- ============================================================================

-- Delete all existing messages (they belong to anonymous users)
DELETE FROM messages;

-- Delete all existing conversations (they belong to anonymous users)
DELETE FROM conversations;

-- Delete all existing user profiles (they belong to anonymous users)
DELETE FROM user_profiles;

-- ============================================================================
-- UPDATE SCHEMA TO REFERENCE AUTH.USERS
-- ============================================================================

-- Add foreign key constraint to conversations.user_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'conversations_user_id_fkey'
    AND table_name = 'conversations'
  ) THEN
    ALTER TABLE conversations
      ADD CONSTRAINT conversations_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES auth.users(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key constraint to user_profiles.user_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'user_profiles_user_id_fkey'
    AND table_name = 'user_profiles'
  ) THEN
    ALTER TABLE user_profiles
      ADD CONSTRAINT user_profiles_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES auth.users(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================================
-- CREATE RLS POLICIES FOR AUTHENTICATED USERS
-- ============================================================================

-- Conversations: Users can only access their own conversations
CREATE POLICY "Users can view own conversations"
  ON conversations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations"
  ON conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON conversations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON conversations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Messages: Users can only access messages in their own conversations
CREATE POLICY "Users can view messages in own conversations"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own conversations"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages in own conversations"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages in own conversations"
  ON messages
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- User Profiles: Users can only access their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- ============================================================================

-- Function to automatically create a user profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id)
  VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to call function on new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- UPDATE DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE conversations IS 'Stores user conversations. Protected by RLS using auth.uid(). Users can only access their own conversations.';

COMMENT ON TABLE messages IS 'Stores chat messages. Protected by RLS. Users can only access messages in conversations they own.';

COMMENT ON TABLE user_profiles IS 'Stores user profile information. Protected by RLS using auth.uid(). Automatically created on user signup.';

COMMENT ON FUNCTION public.handle_new_user IS 'Trigger function that automatically creates a user profile when a new user signs up via Supabase Auth.';