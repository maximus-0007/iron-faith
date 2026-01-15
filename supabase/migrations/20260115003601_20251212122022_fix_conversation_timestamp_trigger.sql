/*
  # Fix Conversation Timestamp Trigger

  ## Problem
  The `update_conversation_timestamp()` function was incorrectly trying to modify
  the NEW record in an AFTER INSERT trigger, which is not allowed. This caused
  the error: "record 'new' has no field 'updated_at'"

  ## Solution
  Update the function to correctly update the conversations table's updated_at
  timestamp when a new message is inserted.

  ## Changes
  - Drop and recreate the trigger function to update the conversations table
  - The trigger remains as AFTER INSERT on messages table
  - When a message is inserted, it updates the parent conversation's timestamp
*/

-- Drop the existing function
DROP FUNCTION IF EXISTS update_conversation_timestamp() CASCADE;

-- Recreate the function with correct logic
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  -- Update the conversations table's updated_at timestamp
  UPDATE conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER trigger_update_conversation_timestamp
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();