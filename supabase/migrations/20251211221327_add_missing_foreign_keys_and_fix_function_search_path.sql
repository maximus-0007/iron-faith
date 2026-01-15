/*
  # Add Missing Foreign Keys and Fix Function Search Path

  ## Overview
  This migration addresses the root cause of "unused index" warnings and fixes
  the remaining function search path issue.

  ## Changes

  ### 1. Add Missing Foreign Key Constraints
  Several tables have user_id columns that should reference auth.users but don't have
  foreign key constraints. Adding these constraints will:
  - Ensure referential integrity
  - Make the existing indexes useful for foreign key checks
  - Improve query performance for JOINs with auth.users

  Tables affected:
  - bible_annotations.user_id → auth.users.id
  - bible_bookmarks.user_id → auth.users.id
  - conversation_folders.user_id → auth.users.id
  - message_bookmarks.user_id → auth.users.id

  ### 2. Fix Function Search Path
  The overloaded version of check_conversation_ownership(uuid, uuid) needs
  an explicit search_path to prevent security issues.

  ## Security Notes
  - Foreign keys to auth.users use ON DELETE CASCADE to automatically clean up
    user data when a user is deleted
  - This ensures no orphaned records remain after user deletion
*/

-- ============================================================================
-- ADD MISSING FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Add foreign key for bible_annotations.user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'bible_annotations_user_id_fkey'
    AND table_name = 'bible_annotations'
  ) THEN
    ALTER TABLE bible_annotations
      ADD CONSTRAINT bible_annotations_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES auth.users(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key for bible_bookmarks.user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'bible_bookmarks_user_id_fkey'
    AND table_name = 'bible_bookmarks'
  ) THEN
    ALTER TABLE bible_bookmarks
      ADD CONSTRAINT bible_bookmarks_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES auth.users(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key for conversation_folders.user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'conversation_folders_user_id_fkey'
    AND table_name = 'conversation_folders'
  ) THEN
    ALTER TABLE conversation_folders
      ADD CONSTRAINT conversation_folders_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES auth.users(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key for message_bookmarks.user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'message_bookmarks_user_id_fkey'
    AND table_name = 'message_bookmarks'
  ) THEN
    ALTER TABLE message_bookmarks
      ADD CONSTRAINT message_bookmarks_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES auth.users(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================================
-- FIX FUNCTION SEARCH PATH
-- ============================================================================

-- Fix the overloaded check_conversation_ownership function
CREATE OR REPLACE FUNCTION public.check_conversation_ownership(
  p_conversation_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM conversations
    WHERE id = p_conversation_id
    AND user_id = p_user_id
  );
END;
$$;