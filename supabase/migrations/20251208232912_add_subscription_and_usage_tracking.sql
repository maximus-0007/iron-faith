/*
  # Add Subscription and Usage Tracking System

  ## Overview
  This migration creates the foundation for a subscription-based pricing model with Stripe integration.
  It implements message limits for free users and unlimited access for premium subscribers.

  ## 1. New Tables

  ### `user_subscriptions`
  Stores subscription information for each user
  - `id` (uuid, primary key) - Unique subscription record identifier
  - `user_id` (uuid, foreign key) - References auth.users
  - `stripe_customer_id` (text) - Stripe customer ID for billing portal access
  - `stripe_subscription_id` (text) - Active Stripe subscription ID
  - `subscription_status` (text) - Status: 'active', 'inactive', 'canceled', 'past_due'
  - `price_locked_at` (numeric) - Locked price in cents (699 for founders, 899 for standard)
  - `is_founder` (boolean) - True if user is in first 500 subscribers
  - `created_at` (timestamptz) - When subscription was created
  - `updated_at` (timestamptz) - Last status update

  ### `daily_usage`
  Tracks daily message counts for free tier users
  - `id` (uuid, primary key) - Unique usage record identifier
  - `user_id` (uuid, foreign key) - References auth.users
  - `message_count` (integer) - Number of messages sent today
  - `last_reset_date` (date) - Date of last counter reset
  - `created_at` (timestamptz) - When tracking started
  - `updated_at` (timestamptz) - Last message timestamp

  ## 2. Database Functions

  ### `check_message_limit(user_uuid)`
  Returns whether user can send a message based on subscription status and daily limit
  - Premium users: always allowed
  - Free users: allowed if under 5 messages today

  ### `get_active_subscriber_count()`
  Returns count of active paying subscribers for founder pricing logic

  ### `increment_message_count(user_uuid)`
  Increments or resets daily message counter for a user

  ## 3. Security
  - Enable RLS on both tables
  - Users can read their own subscription data
  - Users can read their own usage data
  - Only authenticated service role can write to these tables (via Edge Functions)

  ## 4. Performance
  - Index on user_id for fast subscription lookups
  - Index on stripe_customer_id for webhook processing
  - Index on last_reset_date for efficient daily resets
*/

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text,
  subscription_status text DEFAULT 'inactive' NOT NULL,
  price_locked_at numeric,
  is_founder boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Create daily_usage table
CREATE TABLE IF NOT EXISTS daily_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message_count integer DEFAULT 0 NOT NULL,
  last_reset_date date DEFAULT CURRENT_DATE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer_id ON user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_daily_usage_user_id ON daily_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_usage_reset_date ON daily_usage(last_reset_date);

-- Enable RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can read own subscription"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert subscriptions"
  ON user_subscriptions FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update subscriptions"
  ON user_subscriptions FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for daily_usage
CREATE POLICY "Users can read own usage"
  ON daily_usage FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage usage"
  ON daily_usage FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to check if user can send a message
CREATE OR REPLACE FUNCTION check_message_limit(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_premium boolean;
  current_count integer;
  last_reset date;
BEGIN
  -- Check if user has active subscription
  SELECT subscription_status = 'active' INTO is_premium
  FROM user_subscriptions
  WHERE user_id = user_uuid;

  -- Premium users have unlimited messages
  IF is_premium THEN
    RETURN true;
  END IF;

  -- Check daily usage for free users
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

  -- Check if under limit (5 messages per day)
  RETURN current_count < 5;
END;
$$;

-- Function to get active subscriber count for founder pricing
CREATE OR REPLACE FUNCTION get_active_subscriber_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  subscriber_count integer;
BEGIN
  SELECT COUNT(*) INTO subscriber_count
  FROM user_subscriptions
  WHERE subscription_status = 'active' AND stripe_subscription_id IS NOT NULL;

  RETURN COALESCE(subscriber_count, 0);
END;
$$;

-- Function to increment message count
CREATE OR REPLACE FUNCTION increment_message_count(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO daily_usage (user_id, message_count, last_reset_date)
  VALUES (user_uuid, 1, CURRENT_DATE)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    message_count = CASE 
      WHEN daily_usage.last_reset_date < CURRENT_DATE THEN 1
      ELSE daily_usage.message_count + 1
    END,
    last_reset_date = CURRENT_DATE,
    updated_at = now();
END;
$$;

-- Function to get user's current usage
CREATE OR REPLACE FUNCTION get_user_usage(user_uuid uuid)
RETURNS TABLE (
  message_count integer,
  is_premium boolean,
  messages_remaining integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_count integer;
  last_reset date;
  is_active boolean;
BEGIN
  -- Check subscription status
  SELECT subscription_status = 'active' INTO is_active
  FROM user_subscriptions
  WHERE user_id = user_uuid;

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
      WHEN COALESCE(is_active, false) THEN -1  -- -1 means unlimited
      ELSE GREATEST(0, 5 - COALESCE(current_count, 0))
    END as messages_remaining;
END;
$$;