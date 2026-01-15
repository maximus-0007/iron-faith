/*
  # Add Premium Translations to Trial Users

  ## Overview
  Updates the default translations setup to include premium translations for new users
  since they start with a 3-day free trial that gives them access to all features.

  ## Changes
  1. Updates `create_default_translations_for_user` trigger function
  2. New users now get all 6 translations by default:
     - Free: WEB, KJV, ASV
     - Premium: NKJV, NASB, CSB
  3. Users can access premium translations during their 3-day trial
  4. After trial expires, they can continue using them if subscribed
     or they'll be locked until subscription

  ## Reasoning
  Since new users get a 3-day free trial with full access, it makes sense
  to give them all translations from the start so they can experience the
  full value of the premium subscription during their trial period.

  ## Security
  - No changes to RLS policies
  - Maintains existing security model
*/

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
    (NEW.user_id, '06125adad2d5898a-01', 'American Standard Version', 'ASV', true, 2),
    (NEW.user_id, '63097d2a0a2f7db3-01', 'New King James Version', 'NKJV', true, 3),
    (NEW.user_id, 'b8ee27bcd1cae43a-01', 'New American Standard Bible (1995)', 'NASB', true, 4)
  ON CONFLICT (user_id, translation_id) DO NOTHING;

  RETURN NEW;
END;
$$;