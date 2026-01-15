/*
  # Update Default Free Translations
  
  1. Changes
    - Remove BSB and FBV as default free translations (API compatibility issues)
    - Add KJV and ASV as free translations (confirmed working with API)
    - Update existing user preferences
  
  2. New Free Translations
    - WEB (World English Bible) - Already working
    - KJV (King James Version 1769) - Now free
    - ASV (American Standard Version) - Now free
  
  3. Notes
    - This ensures all users get 3 working translations
    - Premium users can still add BSB, FBV, and others
*/

-- Delete old default translations that have API issues
DELETE FROM user_translation_preferences 
WHERE translation_abbreviation IN ('BSB', 'FBV');

-- Add the new default free translations for all users
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
    ('de4e12af7f28f599-01', 'King James Version (1769)', 'KJV', 1),
    ('06125adad2d5898a-01', 'American Standard Version', 'ASV', 2)
) AS t(translation_id, translation_name, translation_abbreviation, sort_order)
ON CONFLICT (user_id, translation_id) DO NOTHING;

-- Update the trigger function to use new default translations
CREATE OR REPLACE FUNCTION initialize_default_translations()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_translation_preferences (user_id, translation_id, translation_name, translation_abbreviation, is_enabled, sort_order)
  VALUES 
    (NEW.user_id, '9879dbb7cfe39e4d-04', 'World English Bible', 'WEB', true, 0),
    (NEW.user_id, 'de4e12af7f28f599-01', 'King James Version (1769)', 'KJV', true, 1),
    (NEW.user_id, '06125adad2d5898a-01', 'American Standard Version', 'ASV', true, 2)
  ON CONFLICT (user_id, translation_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;