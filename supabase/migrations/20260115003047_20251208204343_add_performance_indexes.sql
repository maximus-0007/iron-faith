/*
  # Add Performance Indexes for Production

  ## Overview
  Adds database indexes to optimize query performance for common access patterns.
  All queries filter by user_id via RLS policies, so these indexes are critical
  for production performance.

  ## Indexes Added
  
  ### Conversations Table
  - Index on user_id for fast user conversation lookups
  - Index on updated_at for sorting recent conversations
  
  ### Messages Table  
  - Index on conversation_id for fast message retrieval
  - Composite index on (conversation_id, created_at) for ordered message queries
  
  ### User Profiles Table
  - Index on user_id (primary access pattern)
  
  ## Performance Impact
  - Dramatically improves query speed as user data grows
  - Essential for production with multiple users
  - Minimal storage overhead
*/

-- Conversations: Index on user_id for RLS policy performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id 
  ON conversations(user_id);

-- Conversations: Index on updated_at for sorting recent conversations
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at 
  ON conversations(updated_at DESC);

-- Messages: Index on conversation_id for fast message retrieval
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id 
  ON messages(conversation_id);

-- Messages: Composite index for ordered message queries
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
  ON messages(conversation_id, created_at DESC);

-- User Profiles: Index on user_id (already has unique constraint but explicit index helps)
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id 
  ON user_profiles(user_id);