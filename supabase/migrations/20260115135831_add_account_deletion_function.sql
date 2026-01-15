/*
  # Account Deletion Function

  1. New Functions
    - `delete_user_account(user_uuid)` - Safely deletes all user data
      - Deletes user memories
      - Deletes message feedback
      - Deletes message bookmarks
      - Deletes conversation folder items
      - Deletes conversation folders
      - Deletes messages (cascade from conversations)
      - Deletes conversations
      - Deletes verse cache
      - Deletes translation preferences
      - Deletes daily usage records
      - Deletes user subscriptions
      - Deletes todos
      - Deletes user profile
      - Finally deletes the auth user

  2. Security
    - Function runs with SECURITY DEFINER (elevated privileges)
    - Only callable by the user themselves (checks auth.uid())
    - All deletions happen in a transaction for safety
    - Returns success status

  3. Important Notes
    - This operation is IRREVERSIBLE
    - All user data will be permanently deleted
    - Complies with GDPR "right to be forgotten"
    - Required for App Store compliance
*/

CREATE OR REPLACE FUNCTION delete_user_account(user_uuid uuid)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count integer;
BEGIN
  IF auth.uid() != user_uuid THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized: You can only delete your own account'
    );
  END IF;

  deleted_count := 0;

  DELETE FROM user_memories WHERE user_id = user_uuid;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  DELETE FROM message_feedback WHERE user_id = user_uuid;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  DELETE FROM verse_cache WHERE user_id = user_uuid;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  DELETE FROM message_bookmarks WHERE user_id = user_uuid;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  DELETE FROM conversation_folder_items 
  WHERE folder_id IN (
    SELECT id FROM conversation_folders WHERE user_id = user_uuid
  );
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  DELETE FROM conversation_folders WHERE user_id = user_uuid;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  DELETE FROM messages 
  WHERE conversation_id IN (
    SELECT id FROM conversations WHERE user_id = user_uuid
  );
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  DELETE FROM conversations WHERE user_id = user_uuid;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  DELETE FROM user_translation_preferences WHERE user_id = user_uuid;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  DELETE FROM daily_usage WHERE user_id = user_uuid;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  DELETE FROM user_subscriptions WHERE user_id = user_uuid;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  DELETE FROM todos WHERE user_id = user_uuid;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  DELETE FROM user_profiles WHERE user_id = user_uuid;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  DELETE FROM auth.users WHERE id = user_uuid;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  IF deleted_count = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Account successfully deleted'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

COMMENT ON FUNCTION delete_user_account IS 'Permanently deletes a user account and all associated data. Only callable by the user themselves. IRREVERSIBLE.';
