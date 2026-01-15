/*
  # Update Default Translations to Free Versions Only

  ## Overview
  Changes the default translations for new users to only include free translations:
  - World English Bible (WEB)
  - King James Version (KJV)
  - American Standard Version (ASV)

  ## Changes
  1. Updates the `create_default_translations_for_user` trigger function
  2. Only free translations are added by default
  3. Premium translations (NKJV, NASB, CSB) are available as upgrades

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
    (NEW.user_id, '06125adad2d5898a-01', 'American Standard Version', 'ASV', true, 2)
  ON CONFLICT (user_id, translation_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;
