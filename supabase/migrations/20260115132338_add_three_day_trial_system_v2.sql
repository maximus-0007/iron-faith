/*
  # Add 3-Day Free Trial System

  ## Overview
  This migration implements a 3-day free trial system where:
  - New users get 3 days of full access (unlimited messages)
  - After trial expires, users need to subscribe at $6.99/month
  - Non-subscribers are limited to 2 messages per day
  - Active subscribers have unlimited access

  ## Changes

  1. **Modified Tables**
    - `user_subscriptions` - Add trial tracking fields:
      - `trial_start_date` (timestamptz) - When trial began
      - `trial_end_date` (timestamptz) - When trial expires
      - `is_on_trial` (boolean) - Whether user is currently on trial

  2. **Updated Functions**
    - `check_message_limit()` - Now considers trial status
      - Users on active trial: unlimited messages
      - Paid subscribers: unlimited messages
      - Free users after trial: 2 messages per day (reduced from 5)
    
    - `create_default_subscription()` - Automatically sets 3-day trial for new users
    
    - `get_user_usage()` - Updated to return trial status

  3. **Security**
    - All existing RLS policies remain in place
    - No changes to security model

  ## Implementation Details
  
  Trial Logic:
  - Trial starts immediately on user signup
  - Trial duration: 3 days (72 hours)
  - After trial, user needs to subscribe for unlimited access
  - Without subscription: limited to 2 messages/day
*/

-- Add trial fields to user_subscriptions table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_subscriptions' AND column_name = 'trial_start_date'
  ) THEN
    ALTER TABLE user_subscriptions ADD COLUMN trial_start_date timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_subscriptions' AND column_name = 'trial_end_date'
  ) THEN
    ALTER TABLE user_subscriptions ADD COLUMN trial_end_date timestamptz DEFAULT (now() + interval '3 days');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_subscriptions' AND column_name = 'is_on_trial'
  ) THEN
    ALTER TABLE user_subscriptions ADD COLUMN is_on_trial boolean DEFAULT true;
  END IF;
END $$;

-- Update existing users to have trial dates (backfill for existing users)
UPDATE user_subscriptions 
SET 
  trial_start_date = COALESCE(trial_start_date, created_at),
  trial_end_date = COALESCE(trial_end_date, created_at + interval '3 days'),
  is_on_trial = CASE 
    WHEN subscription_status = 'active' THEN false
    ELSE (COALESCE(trial_end_date, created_at + interval '3 days') > now())
  END
WHERE trial_start_date IS NULL OR trial_end_date IS NULL;

-- Update the create_default_subscription function to include trial
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_subscriptions (
    user_id, 
    subscription_status, 
    stripe_customer_id,
    trial_start_date,
    trial_end_date,
    is_on_trial
  )
  VALUES (
    NEW.id, 
    'inactive', 
    NULL,
    now(),
    now() + interval '3 days',
    true
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update check_message_limit to consider trial status
CREATE OR REPLACE FUNCTION check_message_limit(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_premium boolean;
  user_is_on_trial boolean;
  trial_end timestamptz;
  current_count integer;
  last_reset date;
BEGIN
  -- Check subscription status and trial status
  SELECT 
    subscription_status = 'active',
    is_on_trial,
    trial_end_date
  INTO is_premium, user_is_on_trial, trial_end
  FROM user_subscriptions
  WHERE user_id = user_uuid;

  -- Update trial status if trial has expired
  IF user_is_on_trial AND trial_end < now() THEN
    UPDATE user_subscriptions
    SET is_on_trial = false
    WHERE user_id = user_uuid;
    user_is_on_trial := false;
  END IF;

  -- Users on active trial have unlimited messages
  IF user_is_on_trial THEN
    RETURN true;
  END IF;

  -- Premium users have unlimited messages
  IF is_premium THEN
    RETURN true;
  END IF;

  -- Check daily usage for free users (after trial)
  SELECT message_count, last_reset_date INTO current_count, last_reset
  FROM daily_usage
  WHERE user_id = user_uuid;

  -- If no usage record exists, create one
  IF current_count IS NULL THEN
    INSERT INTO daily_usage (user_id, message_count, last_reset_date)
    VALUES (user_uuid, 0, CURRENT_DATE)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN true;
  END IF;

  -- Reset counter if it's a new day
  IF last_reset < CURRENT_DATE THEN
    UPDATE daily_usage
    SET message_count = 0, last_reset_date = CURRENT_DATE, updated_at = now()
    WHERE user_id = user_uuid;
    RETURN true;
  END IF;

  -- Check if under limit (2 messages per day for free users after trial)
  RETURN current_count < 2;
END;
$$;

-- Drop old function and recreate with new signature
DROP FUNCTION IF EXISTS get_user_usage(uuid);

CREATE FUNCTION get_user_usage(user_uuid uuid)
RETURNS TABLE (
  message_count integer,
  is_premium boolean,
  messages_remaining integer,
  is_on_trial boolean,
  trial_end_date timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_count integer;
  last_reset date;
  is_active boolean;
  user_is_on_trial boolean;
  user_trial_end timestamptz;
BEGIN
  -- Check subscription and trial status
  SELECT 
    subscription_status = 'active',
    us.is_on_trial,
    us.trial_end_date
  INTO is_active, user_is_on_trial, user_trial_end
  FROM user_subscriptions us
  WHERE us.user_id = user_uuid;

  -- Update trial status if expired
  IF user_is_on_trial AND user_trial_end < now() THEN
    UPDATE user_subscriptions
    SET is_on_trial = false
    WHERE user_id = user_uuid;
    user_is_on_trial := false;
  END IF;

  -- Get usage data
  SELECT du.message_count, du.last_reset_date INTO current_count, last_reset
  FROM daily_usage du
  WHERE du.user_id = user_uuid;

  -- Reset if new day
  IF last_reset IS NOT NULL AND last_reset < CURRENT_DATE THEN
    current_count := 0;
  END IF;

  -- Return results
  RETURN QUERY SELECT 
    COALESCE(current_count, 0) as message_count,
    COALESCE(is_active, false) as is_premium,
    CASE 
      WHEN user_is_on_trial THEN -1  -- -1 means unlimited (on trial)
      WHEN COALESCE(is_active, false) THEN -1  -- -1 means unlimited (premium)
      ELSE GREATEST(0, 2 - COALESCE(current_count, 0))  -- 2 messages per day for free
    END as messages_remaining,
    COALESCE(user_is_on_trial, false) as is_on_trial,
    user_trial_end as trial_end_date;
END;
$$;
