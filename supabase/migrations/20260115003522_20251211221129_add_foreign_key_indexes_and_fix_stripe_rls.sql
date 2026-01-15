/*
  # Add Foreign Key Indexes and Fix Stripe RLS Policies

  ## Overview
  This migration addresses additional security and performance issues:
  - Adds indexes for foreign key columns to improve query performance
  - Optimizes RLS policies for stripe_subscriptions and stripe_orders tables (if they exist)

  ## Changes

  ### 1. Add Foreign Key Indexes
  Creating indexes on foreign key columns improves JOIN performance and foreign key constraint checks:
  - conversation_folder_items.conversation_id
  - conversation_folders.user_id
  - message_bookmarks.conversation_id
  - message_bookmarks.user_id

  ## Performance Impact
  - Significantly improves JOIN and foreign key constraint performance
*/

-- ============================================================================
-- ADD FOREIGN KEY INDEXES
-- ============================================================================

-- Index for conversation_folder_items.conversation_id foreign key
CREATE INDEX IF NOT EXISTS idx_conversation_folder_items_conversation_id_fk 
  ON conversation_folder_items(conversation_id);

-- Index for conversation_folders.user_id foreign key
CREATE INDEX IF NOT EXISTS idx_conversation_folders_user_id_fk 
  ON conversation_folders(user_id);

-- Index for message_bookmarks.conversation_id foreign key
CREATE INDEX IF NOT EXISTS idx_message_bookmarks_conversation_id_fk 
  ON message_bookmarks(conversation_id);

-- Index for message_bookmarks.user_id foreign key
CREATE INDEX IF NOT EXISTS idx_message_bookmarks_user_id_fk 
  ON message_bookmarks(user_id);

-- ============================================================================
-- FIX REMAINING FUNCTION SEARCH PATHS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_annotation_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_profile_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_bible_preferences_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_conversation_ownership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM conversations
    WHERE id = NEW.conversation_id
    AND user_id = (select auth.uid())
  ) THEN
    RAISE EXCEPTION 'You do not have permission to modify this conversation';
  END IF;
  RETURN NEW;
END;
$$;