/*
  # Fix Translation Limit to 5

  1. Changes
    - Updates the translation limit from 3 to 5 as intended
    - Matches the UI which shows 5 as the maximum

  2. Notes
    - The original migration was intended for 5 translations
    - This fixes the constraint to allow users to add up to 5 translations
*/

CREATE OR REPLACE FUNCTION check_translation_limit()
RETURNS TRIGGER AS $$
DECLARE
  translation_count INT;
  max_translations INT := 5;
BEGIN
  SELECT COUNT(*)
  INTO translation_count
  FROM user_translation_preferences
  WHERE user_id = NEW.user_id;

  IF translation_count >= max_translations THEN
    RAISE EXCEPTION 'Maximum of % translations allowed per user', max_translations;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
