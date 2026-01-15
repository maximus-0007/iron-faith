/*
  # Remove Profile Picture Feature

  1. Changes
    - Drop `profile_picture_url` column from user_profiles table
    - Profile pictures add unnecessary complexity for a faith-based app
    - Focus remains on spiritual content and conversations

  2. Security
    - No impact on existing RLS policies
    - No data loss concerns (feature not widely used)
*/

-- Remove profile picture column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'profile_picture_url'
  ) THEN
    ALTER TABLE user_profiles DROP COLUMN profile_picture_url;
  END IF;
END $$;