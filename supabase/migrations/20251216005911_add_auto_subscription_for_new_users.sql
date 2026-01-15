/*
  # Auto-create subscription for new users

  1. Changes
    - Creates a trigger function that automatically creates a subscription record when a new user signs up
    - Sets up a trigger on auth.users table to call this function
    - Ensures all new users start with an 'inactive' (free tier) subscription status
  
  2. Benefits
    - Eliminates the need for manual subscription record creation
    - Ensures subscription badge displays correctly from the start
    - Message limits work properly for new users immediately
  
  3. Security
    - Function uses SECURITY DEFINER to create records on behalf of users
    - Uses ON CONFLICT DO NOTHING to prevent duplicate records
*/

-- Create function to auto-create subscription record
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_subscriptions (user_id, subscription_status, stripe_customer_id)
  VALUES (NEW.id, 'inactive', NULL)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_subscription();

-- Backfill existing users who don't have a subscription record
INSERT INTO user_subscriptions (user_id, subscription_status, stripe_customer_id)
SELECT id, 'inactive', NULL
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM user_subscriptions WHERE user_subscriptions.user_id = auth.users.id
)
ON CONFLICT (user_id) DO NOTHING;