/*
  # Add Onboarding Status to User Profiles

  1. Changes
    - Add `onboarding_completed` column to `user_profiles` table
      - Type: boolean
      - Default: false
      - Description: Tracks whether user has completed the onboarding flow
  
  2. Purpose
    - Enable first-time user experience with welcome screen and guided tour
    - Once completed, users proceed directly to chat interface
    - Personalizes initial experience for new users
  
  3. Notes
    - Default false ensures all new users see onboarding
    - Existing users will also see onboarding once (can be skipped)
    - No RLS changes needed as column follows existing table policies
*/

-- Add onboarding_completed column to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN onboarding_completed boolean DEFAULT false;
  END IF;
END $$;
