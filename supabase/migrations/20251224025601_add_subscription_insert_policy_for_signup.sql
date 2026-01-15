/*
  # Add subscription insert policy for user signup

  1. Problem
    - The trigger that creates default subscriptions still fails due to RLS
    - Need to allow the postgres role (function owner) to insert

  2. Solution
    - Add a policy that allows authenticated users to insert their own subscription record
    - This enables the signup flow while maintaining security

  3. Security
    - Users can only insert records where user_id matches their auth.uid()
    - Prevents users from creating subscriptions for other users
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_subscriptions' 
    AND policyname = 'Users can create own subscription'
  ) THEN
    CREATE POLICY "Users can create own subscription"
      ON user_subscriptions FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;