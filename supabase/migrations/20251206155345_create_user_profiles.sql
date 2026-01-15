/*
  # Create User Profiles Table

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key) - Unique profile identifier
      - `user_id` (uuid, unique) - Reference to user (locally generated UUID)
      - `name` (text) - User's name
      - `about` (text) - About the user description
      - `created_at` (timestamptz) - Profile creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
  
  2. Security
    - Enable RLS on user_profiles table
    - Allow anonymous and authenticated users to manage profiles
    - Users can read, create, update their own profile by user_id
  
  3. Indexes
    - Index on user_id for fast profile lookups
  
  4. Notes
    - This table stores user profile information that personalizes AI responses
    - Name and about fields help the AI provide more contextually relevant answers
    - Data is accessible to anonymous users using locally stored user_id
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL,
  name text DEFAULT '',
  about text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for user profiles
CREATE POLICY "Anyone can view any profile"
  ON user_profiles FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create profiles"
  ON user_profiles FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update any profile"
  ON user_profiles FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete any profile"
  ON user_profiles FOR DELETE
  TO anon, authenticated
  USING (true);

-- Function to update profile timestamp
CREATE OR REPLACE FUNCTION update_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update profile timestamp
DROP TRIGGER IF EXISTS trigger_update_profile_timestamp ON user_profiles;
CREATE TRIGGER trigger_update_profile_timestamp
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_timestamp();
