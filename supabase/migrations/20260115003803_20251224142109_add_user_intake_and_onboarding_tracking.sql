/*
  # Add User Intake and Onboarding Progress Tracking

  ## Overview
  Enhances the user_profiles table to support personalized onboarding experience
  and track user context for better AI accountability interactions.

  ## Changes

  1. New Columns Added to user_profiles
    - `relationship_status` (text) - User's relationship status (single, dating, engaged, married)
    - `has_children` (boolean) - Whether user has children
    - `career_stage` (text) - Current career stage (student, early_career, established, executive, retired, unemployed)
    - `spiritual_struggles` (text[]) - Array of areas user wants accountability (e.g., pornography, anger, laziness)
    - `accountability_goals` (text[]) - Specific goals user wants to work on
    - `daily_reminder_time` (time) - Preferred time for daily check-in reminders
    - `completed_onboarding_steps` (text[]) - Tracks which onboarding steps user has completed
    - `intake_completed_at` (timestamptz) - When user completed the intake questionnaire
    - `has_seen_welcome_carousel` (boolean) - Whether user has viewed the welcome carousel
    - `first_message_sent_at` (timestamptz) - When user sent their first message
    - `first_bookmark_created_at` (timestamptz) - When user created their first bookmark
    - `onboarding_completed_at` (timestamptz) - When user completed all onboarding steps

  ## Security
  - Existing RLS policies cover new columns
  - Users can only read/update their own intake data
*/

-- Add intake questionnaire fields
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS relationship_status text,
ADD COLUMN IF NOT EXISTS has_children boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS career_stage text,
ADD COLUMN IF NOT EXISTS spiritual_struggles text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS accountability_goals text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS daily_reminder_time time;

-- Add onboarding progress tracking fields
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS completed_onboarding_steps text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS intake_completed_at timestamptz,
ADD COLUMN IF NOT EXISTS has_seen_welcome_carousel boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS first_message_sent_at timestamptz,
ADD COLUMN IF NOT EXISTS first_bookmark_created_at timestamptz,
ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

-- Add check constraints for valid enum values
ALTER TABLE user_profiles
DROP CONSTRAINT IF EXISTS valid_relationship_status;

ALTER TABLE user_profiles
ADD CONSTRAINT valid_relationship_status 
CHECK (relationship_status IS NULL OR relationship_status IN ('single', 'dating', 'engaged', 'married', 'widowed', 'divorced'));

ALTER TABLE user_profiles
DROP CONSTRAINT IF EXISTS valid_career_stage;

ALTER TABLE user_profiles
ADD CONSTRAINT valid_career_stage
CHECK (career_stage IS NULL OR career_stage IN ('student', 'early_career', 'established', 'executive', 'retired', 'unemployed', 'self_employed'));

-- Create index on onboarding completion for analytics
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding_completed 
ON user_profiles(onboarding_completed_at) 
WHERE onboarding_completed_at IS NOT NULL;

-- Create index on intake completion for analytics
CREATE INDEX IF NOT EXISTS idx_user_profiles_intake_completed
ON user_profiles(intake_completed_at)
WHERE intake_completed_at IS NOT NULL;