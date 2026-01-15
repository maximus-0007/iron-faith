/*
  # Fix Bible Translation IDs for API.Bible Access (v3)

  ## Overview
  Updates the Bible translation IDs to versions that have proper API access.
  The previous IDs were returning "not authorized" errors from API.Bible.

  ## Changes
  1. Temporarily disables the translation limit trigger
  2. Updates existing user_translation_preferences records with new IDs
  3. Re-enables the trigger
  4. Updates the trigger function to use correct IDs for new users

  ## Notes
  - The -01 and -02 suffixes represent different versions of the same translation
  - These specific versions have broader API access permissions
*/

-- Temporarily disable the translation limit trigger
ALTER TABLE user_translation_preferences DISABLE TRIGGER trigger_check_translation_limit;

-- Update existing WEB translations to new ID
UPDATE user_translation_preferences
SET translation_id = '9879dbb7cfe39e4d-01'
WHERE translation_id = '9879dbb7cfe39e4d-04';

-- Update existing KJV translations to new ID
UPDATE user_translation_preferences
SET translation_id = 'de4e12af7f28f599-02'
WHERE translation_id = 'de4e12af7f28f599-01';

-- Re-enable the trigger
ALTER TABLE user_translation_preferences ENABLE TRIGGER trigger_check_translation_limit;

-- Update the trigger function to use correct IDs for new users
CREATE OR REPLACE FUNCTION create_default_translations_for_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_translation_preferences (user_id, translation_id, translation_name, translation_abbreviation, is_enabled, sort_order)
  VALUES
    (NEW.user_id, '9879dbb7cfe39e4d-01', 'World English Bible', 'WEB', true, 0),
    (NEW.user_id, 'de4e12af7f28f599-02', 'King James Version (1769)', 'KJV', true, 1),
    (NEW.user_id, '63097d2a0a2f7db3-01', 'New King James Version', 'NKJV', true, 2),
    (NEW.user_id, 'b8ee27bcd1cae43a-01', 'New American Standard Bible (1995)', 'NASB', true, 3),
    (NEW.user_id, 'a556c5305ee15c3f-01', 'Christian Standard Bible', 'CSB', true, 4)
  ON CONFLICT (user_id, translation_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;