/*
  # Fix RLS Performance and Security Issues

  ## Changes
  
  ### 1. RLS Performance Optimization
  Recreate policies to use `(select auth.uid())` instead of `auth.uid()` to prevent 
  re-evaluation for each row at scale:
  - user_subscriptions: "Users can create own subscription"
  - user_translation_preferences: All 5 policies (select, insert, update, delete, view)
  
  ### 2. Remove Unused Indexes
  Drop indexes that are not being used to improve write performance:
  - message_bookmarks: conversation_id_fk and user_id_fk indexes
  - bible_bookmarks: user_id_fk index
  - conversation_folder_items: conversation_id_fk index
  - bible_annotations: user_id_fk index
  - conversation_folders: user_id_fk index
  - user_profiles: onboarding_completed and intake_completed indexes
  - user_translation_preferences: user_id index
  
  ### 3. Fix Function Search Path Security
  Set immutable search_path on functions to prevent security issues:
  - check_translation_limit
  - initialize_default_translations
  
  ### 4. Manual Configuration Required
  The following issues require dashboard configuration:
  - Auth DB Connection Strategy: Change from fixed (10) to percentage-based
  - Leaked Password Protection: Enable HaveIBeenPwned integration in Auth settings
*/

-- ============================================================================
-- 1. FIX RLS PERFORMANCE ISSUES
-- ============================================================================

-- Fix user_subscriptions policies
DROP POLICY IF EXISTS "Users can create own subscription" ON user_subscriptions;
CREATE POLICY "Users can create own subscription"
  ON user_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- Fix user_translation_preferences policies
DROP POLICY IF EXISTS "Users can view own translation preferences" ON user_translation_preferences;
CREATE POLICY "Users can view own translation preferences"
  ON user_translation_preferences FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own translation preferences" ON user_translation_preferences;
CREATE POLICY "Users can insert own translation preferences"
  ON user_translation_preferences FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own translation preferences" ON user_translation_preferences;
CREATE POLICY "Users can update own translation preferences"
  ON user_translation_preferences FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own translation preferences" ON user_translation_preferences;
CREATE POLICY "Users can delete own translation preferences"
  ON user_translation_preferences FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- 2. DROP UNUSED INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_message_bookmarks_conversation_id_fk;
DROP INDEX IF EXISTS idx_message_bookmarks_user_id_fk;
DROP INDEX IF EXISTS idx_bible_bookmarks_user_id_fk;
DROP INDEX IF EXISTS idx_conversation_folder_items_conversation_id_fk;
DROP INDEX IF EXISTS idx_bible_annotations_user_id_fk;
DROP INDEX IF EXISTS idx_conversation_folders_user_id_fk;
DROP INDEX IF EXISTS idx_user_profiles_onboarding_completed;
DROP INDEX IF EXISTS idx_user_profiles_intake_completed;
DROP INDEX IF EXISTS idx_user_translation_preferences_user_id;

-- ============================================================================
-- 3. FIX FUNCTION SEARCH PATH SECURITY
-- ============================================================================

-- Recreate check_translation_limit with fixed search_path
CREATE OR REPLACE FUNCTION public.check_translation_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  translation_count INT;
  max_translations INT := 3;
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
$$;

-- Recreate initialize_default_translations with fixed search_path
CREATE OR REPLACE FUNCTION public.initialize_default_translations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO user_translation_preferences (user_id, translation_id, display_order)
  VALUES 
    (NEW.id, 'nkjv', 1),
    (NEW.id, 'niv', 2),
    (NEW.id, 'esv', 3)
  ON CONFLICT (user_id, translation_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;