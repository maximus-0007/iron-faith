/*
  # Add Missing Features Support

  1. Profile Pictures
    - Add `profile_picture_url` to user_profiles table
    - Stores URL to profile image in storage

  2. Conversation Pinning
    - Add `pinned` boolean to conversations table
    - Add `pinned_at` timestamp for sort order
    - Add index for efficient queries

  3. Data Export Tracking
    - Add `last_data_export_at` to user_profiles
    - Track when users last exported their data (GDPR compliance)

  4. Security
    - All changes maintain existing RLS policies
    - No breaking changes to existing functionality
*/

-- Add profile picture support to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'profile_picture_url'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN profile_picture_url text;
  END IF;
END $$;

-- Add data export tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'last_data_export_at'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN last_data_export_at timestamptz;
  END IF;
END $$;

-- Add conversation pinning support
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'pinned'
  ) THEN
    ALTER TABLE conversations ADD COLUMN pinned boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'pinned_at'
  ) THEN
    ALTER TABLE conversations ADD COLUMN pinned_at timestamptz;
  END IF;
END $$;

-- Create index for efficient pinned conversation queries
CREATE INDEX IF NOT EXISTS idx_conversations_user_pinned 
  ON conversations(user_id, pinned, pinned_at DESC) 
  WHERE pinned = true;

-- Create index for general conversation queries (user + updated_at)
CREATE INDEX IF NOT EXISTS idx_conversations_user_updated 
  ON conversations(user_id, updated_at DESC);
