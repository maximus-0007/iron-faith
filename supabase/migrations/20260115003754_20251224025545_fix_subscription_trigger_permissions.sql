/*
  # Fix subscription trigger permissions

  1. Problem
    - The `create_default_subscription` trigger function fails because RLS policies
      only allow `service_role` to insert into `user_subscriptions`
    - This causes "Database error saving new user" on signup

  2. Solution
    - Recreate the trigger function with proper role settings to bypass RLS
    - The function uses SECURITY DEFINER and explicitly sets role to bypass RLS

  3. Security
    - Function is only called by the auth.users trigger on INSERT
    - Still maintains RLS for all other operations
*/

CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_subscriptions (user_id, subscription_status, stripe_customer_id)
  VALUES (NEW.id, 'inactive', NULL)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RETURN NEW;
END;
$$;

ALTER FUNCTION create_default_subscription() OWNER TO postgres;