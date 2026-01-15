/*
  # Add Persistent User Memories

  This migration creates a system for storing and retrieving user-specific memories
  that persist across conversations, allowing the AI to remember important details
  about each user.

  1. New Tables
    - `user_memories`
      - `id` (uuid, primary key) - Unique memory identifier
      - `user_id` (uuid, not null) - Reference to the user who owns this memory
      - `memory_type` (text) - Category of memory (life_event, preference, relationship, struggle, achievement, etc.)
      - `content` (text) - The actual memory content
      - `source_conversation_id` (uuid, nullable) - Which conversation this was extracted from
      - `confidence` (float) - How confident the AI is in this memory (0.0 to 1.0)
      - `is_active` (boolean) - Whether this memory should be used (allows soft-delete)
      - `created_at` (timestamptz) - When the memory was created
      - `updated_at` (timestamptz) - When the memory was last updated

  2. Security
    - Enable RLS on user_memories table
    - Users can only view, create, update, and delete their own memories
    - Service role can manage all memories (for AI extraction)

  3. Indexes
    - Index on user_id for fast retrieval of user memories
    - Index on memory_type for filtering by category
    - Index on is_active for filtering active memories

  4. Important Notes
    - Memories are extracted by the AI during conversations
    - Each memory has a confidence score to prioritize reliable information
    - Memories can be deactivated rather than deleted to preserve history
*/

-- Create user_memories table
CREATE TABLE IF NOT EXISTS user_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_type text NOT NULL CHECK (memory_type IN (
    'life_event',      -- Major life changes (divorce, new job, birth, death)
    'relationship',    -- People in their life (spouse, children, friends, pastor)
    'struggle',        -- Ongoing challenges they face
    'preference',      -- How they like to receive guidance
    'achievement',     -- Positive milestones
    'belief',          -- Their theological views or convictions
    'context'          -- General background info
  )),
  content text NOT NULL,
  source_conversation_id uuid REFERENCES conversations(id) ON DELETE SET NULL,
  confidence float DEFAULT 0.8 CHECK (confidence >= 0.0 AND confidence <= 1.0),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_memories_user_id ON user_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memories_type ON user_memories(user_id, memory_type);
CREATE INDEX IF NOT EXISTS idx_user_memories_active ON user_memories(user_id, is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE user_memories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_memories
CREATE POLICY "Users can view own memories"
  ON user_memories FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own memories"
  ON user_memories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memories"
  ON user_memories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own memories"
  ON user_memories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_memory_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger to auto-update timestamp on memory updates
DROP TRIGGER IF EXISTS trigger_update_user_memory_timestamp ON user_memories;
CREATE TRIGGER trigger_update_user_memory_timestamp
  BEFORE UPDATE ON user_memories
  FOR EACH ROW
  EXECUTE FUNCTION update_user_memory_timestamp();

-- Function to get active memories for a user (limited to most relevant)
CREATE OR REPLACE FUNCTION get_user_memories(p_user_id uuid, p_limit int DEFAULT 20)
RETURNS TABLE (
  memory_type text,
  content text,
  confidence float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    um.memory_type,
    um.content,
    um.confidence
  FROM user_memories um
  WHERE um.user_id = p_user_id
    AND um.is_active = true
  ORDER BY um.confidence DESC, um.updated_at DESC
  LIMIT p_limit;
END;
$$;