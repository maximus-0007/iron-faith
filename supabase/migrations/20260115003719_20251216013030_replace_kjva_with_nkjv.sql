/*
  # Replace KJVA with NKJV in Premium Translations
  
  1. Changes
    - Remove KJVA (King James Version with Apocrypha) from user preferences
    - NKJV (New King James Version) is now available as a premium translation
  
  2. Notes
    - KJVA was a premium translation that users could manually add
    - No users should have it by default since free translations are WEB, KJV, ASV
    - This migration removes any existing KJVA preferences
*/

-- Delete KJVA from user translation preferences
DELETE FROM user_translation_preferences 
WHERE translation_abbreviation = 'KJVA';