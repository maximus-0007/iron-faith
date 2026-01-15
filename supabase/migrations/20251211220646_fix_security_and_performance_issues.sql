/*
  # Fix Security and Performance Issues

  ## Overview
  This migration addresses critical security and performance issues:
  - Optimizes RLS policies to prevent per-row auth function evaluation
  - Removes unused indexes
  - Removes duplicate indexes
  - Fixes function search paths

  ## Performance Impact
  - Significantly improves query performance for tables with many rows
  - Reduces storage usage
  - Enhances security posture
*/

-- ============================================================================
-- DROP UNUSED INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_message_bookmarks_user_id;
DROP INDEX IF EXISTS idx_message_bookmarks_conversation_id;
DROP INDEX IF EXISTS idx_message_bookmarks_user_conversation;
DROP INDEX IF EXISTS idx_bible_bookmarks_user_id;
DROP INDEX IF EXISTS idx_bible_bookmarks_verse_reference;
DROP INDEX IF EXISTS idx_conversations_search_vector;
DROP INDEX IF EXISTS idx_conversations_user_id;
DROP INDEX IF EXISTS idx_messages_search_vector;
DROP INDEX IF EXISTS idx_conversation_folder_items_folder_id;
DROP INDEX IF EXISTS idx_conversation_folder_items_conversation_id;
DROP INDEX IF EXISTS idx_bible_annotations_user_id;
DROP INDEX IF EXISTS idx_bible_annotations_verse_reference;
DROP INDEX IF EXISTS idx_conversation_folders_user_id;
DROP INDEX IF EXISTS idx_conversation_folders_sort_order;
DROP INDEX IF EXISTS idx_user_subscriptions_stripe_customer_id;
DROP INDEX IF EXISTS idx_daily_usage_reset_date;

-- ============================================================================
-- DROP DUPLICATE INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_bible_annotations_reference;
DROP INDEX IF EXISTS idx_bible_bookmarks_reference;

-- ============================================================================
-- OPTIMIZE RLS POLICIES - MESSAGE_BOOKMARKS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own bookmarks" ON message_bookmarks;
DROP POLICY IF EXISTS "Users can create own bookmarks" ON message_bookmarks;
DROP POLICY IF EXISTS "Users can update own bookmarks" ON message_bookmarks;
DROP POLICY IF EXISTS "Users can delete own bookmarks" ON message_bookmarks;

CREATE POLICY "Users can view own bookmarks"
  ON message_bookmarks FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create own bookmarks"
  ON message_bookmarks FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own bookmarks"
  ON message_bookmarks FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON message_bookmarks FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- OPTIMIZE RLS POLICIES - CONVERSATION_FOLDERS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own folders" ON conversation_folders;
DROP POLICY IF EXISTS "Users can create own folders" ON conversation_folders;
DROP POLICY IF EXISTS "Users can update own folders" ON conversation_folders;
DROP POLICY IF EXISTS "Users can delete own folders" ON conversation_folders;

CREATE POLICY "Users can view own folders"
  ON conversation_folders FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create own folders"
  ON conversation_folders FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own folders"
  ON conversation_folders FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own folders"
  ON conversation_folders FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- OPTIMIZE RLS POLICIES - CONVERSATION_FOLDER_ITEMS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own folder items" ON conversation_folder_items;
DROP POLICY IF EXISTS "Users can create own folder items" ON conversation_folder_items;
DROP POLICY IF EXISTS "Users can delete own folder items" ON conversation_folder_items;

CREATE POLICY "Users can view own folder items"
  ON conversation_folder_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_folders
      WHERE conversation_folders.id = conversation_folder_items.folder_id
      AND conversation_folders.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create own folder items"
  ON conversation_folder_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversation_folders
      WHERE conversation_folders.id = conversation_folder_items.folder_id
      AND conversation_folders.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete own folder items"
  ON conversation_folder_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_folders
      WHERE conversation_folders.id = conversation_folder_items.folder_id
      AND conversation_folders.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- OPTIMIZE RLS POLICIES - USER_SUBSCRIPTIONS
-- ============================================================================

DROP POLICY IF EXISTS "Users can read own subscription" ON user_subscriptions;

CREATE POLICY "Users can read own subscription"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- OPTIMIZE RLS POLICIES - DAILY_USAGE
-- ============================================================================

DROP POLICY IF EXISTS "Users can read own usage" ON daily_usage;

CREATE POLICY "Users can read own usage"
  ON daily_usage FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- OPTIMIZE RLS POLICIES - CONVERSATIONS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON conversations;

CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create own conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own conversations"
  ON conversations FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- OPTIMIZE RLS POLICIES - MESSAGES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Users can create messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Users can update messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Users can delete messages in own conversations" ON messages;

CREATE POLICY "Users can view messages in own conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create messages in own conversations"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update messages in own conversations"
  ON messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete messages in own conversations"
  ON messages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- OPTIMIZE RLS POLICIES - USER_PROFILES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON user_profiles;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own profile"
  ON user_profiles FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- OPTIMIZE RLS POLICIES - BIBLE_BOOKMARKS
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can view own bookmarks" ON bible_bookmarks;
DROP POLICY IF EXISTS "Authenticated users can create own bookmarks" ON bible_bookmarks;
DROP POLICY IF EXISTS "Authenticated users can update own bookmarks" ON bible_bookmarks;
DROP POLICY IF EXISTS "Authenticated users can delete own bookmarks" ON bible_bookmarks;

CREATE POLICY "Authenticated users can view own bookmarks"
  ON bible_bookmarks FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Authenticated users can create own bookmarks"
  ON bible_bookmarks FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Authenticated users can update own bookmarks"
  ON bible_bookmarks FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Authenticated users can delete own bookmarks"
  ON bible_bookmarks FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- OPTIMIZE RLS POLICIES - BIBLE_ANNOTATIONS
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can view own annotations" ON bible_annotations;
DROP POLICY IF EXISTS "Authenticated users can create own annotations" ON bible_annotations;
DROP POLICY IF EXISTS "Authenticated users can update own annotations" ON bible_annotations;
DROP POLICY IF EXISTS "Authenticated users can delete own annotations" ON bible_annotations;

CREATE POLICY "Authenticated users can view own annotations"
  ON bible_annotations FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Authenticated users can create own annotations"
  ON bible_annotations FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Authenticated users can update own annotations"
  ON bible_annotations FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Authenticated users can delete own annotations"
  ON bible_annotations FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- OPTIMIZE RLS POLICIES - BIBLE_READING_HISTORY
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can view own reading history" ON bible_reading_history;
DROP POLICY IF EXISTS "Authenticated users can create own reading history" ON bible_reading_history;
DROP POLICY IF EXISTS "Authenticated users can delete own reading history" ON bible_reading_history;

CREATE POLICY "Authenticated users can view own reading history"
  ON bible_reading_history FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Authenticated users can create own reading history"
  ON bible_reading_history FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Authenticated users can delete own reading history"
  ON bible_reading_history FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- OPTIMIZE RLS POLICIES - USER_BIBLE_PREFERENCES
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can view own preferences" ON user_bible_preferences;
DROP POLICY IF EXISTS "Authenticated users can create own preferences" ON user_bible_preferences;
DROP POLICY IF EXISTS "Authenticated users can update own preferences" ON user_bible_preferences;
DROP POLICY IF EXISTS "Authenticated users can delete own preferences" ON user_bible_preferences;

CREATE POLICY "Authenticated users can view own preferences"
  ON user_bible_preferences FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Authenticated users can create own preferences"
  ON user_bible_preferences FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Authenticated users can update own preferences"
  ON user_bible_preferences FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Authenticated users can delete own preferences"
  ON user_bible_preferences FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- OPTIMIZE RLS POLICIES - STRIPE_CUSTOMERS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own customer data" ON stripe_customers;

CREATE POLICY "Users can view their own customer data"
  ON stripe_customers FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- FIX FUNCTION SEARCH PATHS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_conversation_search_vector()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.title, ''));
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_message_search_vector()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.content, ''));
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id)
  VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_message_limit(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  is_premium boolean;
  current_count integer;
  last_reset date;
BEGIN
  SELECT subscription_status = 'active' INTO is_premium
  FROM user_subscriptions
  WHERE user_id = user_uuid;

  IF is_premium THEN
    RETURN true;
  END IF;

  SELECT message_count, last_reset_date INTO current_count, last_reset
  FROM daily_usage
  WHERE user_id = user_uuid;

  IF current_count IS NULL THEN
    INSERT INTO daily_usage (user_id, message_count, last_reset_date)
    VALUES (user_uuid, 0, CURRENT_DATE)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN true;
  END IF;

  IF last_reset < CURRENT_DATE THEN
    UPDATE daily_usage
    SET message_count = 0, last_reset_date = CURRENT_DATE, updated_at = now()
    WHERE user_id = user_uuid;
    RETURN true;
  END IF;

  RETURN current_count < 5;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_active_subscriber_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  subscriber_count integer;
BEGIN
  SELECT COUNT(*) INTO subscriber_count
  FROM user_subscriptions
  WHERE subscription_status = 'active' AND stripe_subscription_id IS NOT NULL;

  RETURN COALESCE(subscriber_count, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_message_count(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO daily_usage (user_id, message_count, last_reset_date)
  VALUES (user_uuid, 1, CURRENT_DATE)
  ON CONFLICT (user_id)
  DO UPDATE SET
    message_count = CASE
      WHEN daily_usage.last_reset_date < CURRENT_DATE THEN 1
      ELSE daily_usage.message_count + 1
    END,
    last_reset_date = CURRENT_DATE,
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_usage(user_uuid uuid)
RETURNS TABLE (
  message_count integer,
  is_premium boolean,
  messages_remaining integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  current_count integer;
  last_reset date;
  is_active boolean;
BEGIN
  SELECT subscription_status = 'active' INTO is_active
  FROM user_subscriptions
  WHERE user_id = user_uuid;

  SELECT du.message_count, du.last_reset_date INTO current_count, last_reset
  FROM daily_usage du
  WHERE du.user_id = user_uuid;

  IF last_reset IS NOT NULL AND last_reset < CURRENT_DATE THEN
    current_count := 0;
  END IF;

  RETURN QUERY SELECT
    COALESCE(current_count, 0) as message_count,
    COALESCE(is_active, false) as is_premium,
    CASE
      WHEN COALESCE(is_active, false) THEN -1
      ELSE GREATEST(0, 5 - COALESCE(current_count, 0))
    END as messages_remaining;
END;
$$;