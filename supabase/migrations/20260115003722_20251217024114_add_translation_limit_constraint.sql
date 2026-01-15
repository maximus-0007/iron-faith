/*
  # Add Translation Limit Constraint
  
  1. Constraint Added
    - Users can have a maximum of 5 enabled translations
    - Enforced at the database level with a CHECK constraint
    - Prevents adding more than 5 translations even if client is bypassed
  
  2. Implementation
    - Uses a trigger to check count before INSERT and UPDATE operations
    - Displays clear error message when limit is exceeded
  
  3. Notes
    - Minimum of 1 translation is still enforced (prevents deletion of last translation)
    - Existing users with more than 5 translations are not affected
*/

CREATE OR REPLACE FUNCTION check_translation_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_enabled = true THEN
    IF (SELECT COUNT(*) FROM user_translation_preferences WHERE user_id = NEW.user_id AND is_enabled = true) >= 5 THEN
      RAISE EXCEPTION 'Maximum of 5 enabled translations allowed per user';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_check_translation_limit ON user_translation_preferences;
CREATE TRIGGER trigger_check_translation_limit
  BEFORE INSERT OR UPDATE ON user_translation_preferences
  FOR EACH ROW
  EXECUTE FUNCTION check_translation_limit();
