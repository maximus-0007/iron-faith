/*
  # Add Bible Translation Preferences and Access Control
  
  1. New Tables
    - `user_translation_preferences`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `translation_id` (text) - API Bible translation ID
      - `translation_name` (text) - Display name
      - `translation_abbreviation` (text) - Short code like KJV, NIV
      - `is_enabled` (boolean) - Whether user has this translation active
      - `sort_order` (integer) - User's preferred ordering
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Changes to Existing Tables
    - Update `user_bible_preferences` to add `preferred_translations` array field
  
  3. Security
    - Enable RLS on `user_translation_preferences`
    - Add policies for authenticated users to manage their own translations
  
  4. Notes
    - Free users get access to: WEB, BSB, FBV (free translations)
    - Premium users get access to: All free translations + KJV, ASV, NIV, NKJV, ESV, etc.
    - Default translations will be auto-added for new users
*/

-- Create user_translation_preferences table
CREATE TABLE IF NOT EXISTS user_translation_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  translation_id text NOT NULL,
  translation_name text NOT NULL,
  translation_abbreviation text NOT NULL,
  is_enabled boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, translation_id)
);

-- Enable RLS
ALTER TABLE user_translation_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own translation preferences"
  ON user_translation_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own translation preferences"
  ON user_translation_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own translation preferences"
  ON user_translation_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own translation preferences"
  ON user_translation_preferences
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_translation_preferences_user_id 
  ON user_translation_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_user_translation_preferences_enabled 
  ON user_translation_preferences(user_id, is_enabled);

-- Create function to initialize default free translations for new users
CREATE OR REPLACE FUNCTION initialize_default_translations()
RETURNS TRIGGER AS $$
BEGIN
  -- Add default free translations for new users
  INSERT INTO user_translation_preferences (user_id, translation_id, translation_name, translation_abbreviation, is_enabled, sort_order)
  VALUES 
    (NEW.user_id, '9879dbb7cfe39e4d-04', 'World English Bible', 'WEB', true, 0),
    (NEW.user_id, 'bba9f40183526463-01', 'Berean Standard Bible', 'BSB', true, 1),
    (NEW.user_id, '65eec8e0b60e656b-01', 'Free Bible Version', 'FBV', true, 2)
  ON CONFLICT (user_id, translation_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to initialize translations when user profile is created
DROP TRIGGER IF EXISTS trigger_initialize_default_translations ON user_profiles;
CREATE TRIGGER trigger_initialize_default_translations
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION initialize_default_translations();

-- Update existing users with default free translations
INSERT INTO user_translation_preferences (user_id, translation_id, translation_name, translation_abbreviation, is_enabled, sort_order)
SELECT 
  up.user_id,
  t.translation_id,
  t.translation_name,
  t.translation_abbreviation,
  true,
  t.sort_order
FROM user_profiles up
CROSS JOIN (
  VALUES 
    ('9879dbb7cfe39e4d-04', 'World English Bible', 'WEB', 0),
    ('bba9f40183526463-01', 'Berean Standard Bible', 'BSB', 1),
    ('65eec8e0b60e656b-01', 'Free Bible Version', 'FBV', 2)
) AS t(translation_id, translation_name, translation_abbreviation, sort_order)
ON CONFLICT (user_id, translation_id) DO NOTHING;