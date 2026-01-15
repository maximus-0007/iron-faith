/*
  # Add Full-Text Search Capabilities

  ## Overview
  This migration adds full-text search functionality to enable users to search
  across their conversations and messages efficiently.

  ## Changes

  ### 1. Search Vector Columns
  Add tsvector columns to store searchable content:
  - `conversations.search_vector`: Searchable content from conversation title
  - `messages.search_vector`: Searchable content from message content

  ### 2. Search Functions
  Create functions to automatically update search vectors:
  - `update_conversation_search_vector()`: Updates conversation search vector on insert/update
  - `update_message_search_vector()`: Updates message search vector on insert/update

  ### 3. Indexes
  Create GIN indexes for efficient full-text search:
  - Index on conversations.search_vector
  - Index on messages.search_vector

  ### 4. Triggers
  Automatically update search vectors when data changes:
  - Trigger on conversations table
  - Trigger on messages table

  ## Usage
  Once this migration is applied, you can search using:
  ```sql
  SELECT * FROM conversations
  WHERE search_vector @@ to_tsquery('english', 'search terms');
  ```

  ## Performance
  - GIN indexes provide fast full-text search
  - Search vectors are automatically maintained
  - Supports English language stemming and stop words
*/

-- Add search_vector column to conversations table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'search_vector'
  ) THEN
    ALTER TABLE conversations ADD COLUMN search_vector tsvector;
  END IF;
END $$;

-- Add search_vector column to messages table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'search_vector'
  ) THEN
    ALTER TABLE messages ADD COLUMN search_vector tsvector;
  END IF;
END $$;

-- Function to update conversation search vector
CREATE OR REPLACE FUNCTION update_conversation_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.title, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update message search vector
CREATE OR REPLACE FUNCTION update_message_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for conversations
DROP TRIGGER IF EXISTS conversations_search_vector_update ON conversations;
CREATE TRIGGER conversations_search_vector_update
  BEFORE INSERT OR UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_search_vector();

-- Create triggers for messages
DROP TRIGGER IF EXISTS messages_search_vector_update ON messages;
CREATE TRIGGER messages_search_vector_update
  BEFORE INSERT OR UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_message_search_vector();

-- Create GIN indexes for full-text search
CREATE INDEX IF NOT EXISTS idx_conversations_search_vector
  ON conversations USING gin(search_vector);

CREATE INDEX IF NOT EXISTS idx_messages_search_vector
  ON messages USING gin(search_vector);

-- Update existing records to populate search vectors
UPDATE conversations SET search_vector = to_tsvector('english', COALESCE(title, ''))
WHERE search_vector IS NULL;

UPDATE messages SET search_vector = to_tsvector('english', COALESCE(content, ''))
WHERE search_vector IS NULL;
