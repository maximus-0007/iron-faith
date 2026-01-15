/*
  # Add Bookmarks and Conversation Organization

  ## Overview
  This migration adds support for message bookmarks and conversation organization features
  to enhance user experience with their Bible study conversations.

  ## New Tables

  ### 1. `message_bookmarks`
  Stores bookmarked messages for quick reference
  - `id` (uuid, primary key): Unique identifier for the bookmark
  - `user_id` (uuid, references auth.users): Owner of the bookmark
  - `conversation_id` (uuid, references conversations): The conversation containing the message
  - `message_id` (text): ID of the bookmarked message
  - `note` (text, optional): User's note about why they bookmarked this message
  - `created_at` (timestamptz): When the bookmark was created
  - `updated_at` (timestamptz): When the bookmark was last updated

  ### 2. `conversation_folders`
  Allows users to organize conversations into folders/categories
  - `id` (uuid, primary key): Unique identifier for the folder
  - `user_id` (uuid, references auth.users): Owner of the folder
  - `name` (text): Name of the folder
  - `color` (text, optional): Color for visual identification
  - `icon` (text, optional): Icon name for visual identification
  - `sort_order` (integer): Order in which folders appear
  - `created_at` (timestamptz): When the folder was created
  - `updated_at` (timestamptz): When the folder was last updated

  ### 3. `conversation_folder_items`
  Links conversations to folders (many-to-many relationship)
  - `id` (uuid, primary key): Unique identifier
  - `folder_id` (uuid, references conversation_folders): The folder
  - `conversation_id` (uuid, references conversations): The conversation
  - `added_at` (timestamptz): When the conversation was added to the folder
  - Unique constraint on (folder_id, conversation_id) to prevent duplicates

  ## Security
  - All tables have RLS enabled
  - Users can only access their own bookmarks, folders, and folder items
  - Policies enforce user_id checks for all operations

  ## Performance
  - Indexes on user_id and conversation_id for fast lookups
  - Composite indexes for common query patterns
  - Index on sort_order for efficient folder ordering

  ## Notes
  - Folders support custom colors and icons for personalization
  - Bookmarks support optional notes for context
  - A conversation can be in multiple folders
*/

-- Create message_bookmarks table
CREATE TABLE IF NOT EXISTS message_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  message_id text NOT NULL,
  note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create conversation_folders table
CREATE TABLE IF NOT EXISTS conversation_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text DEFAULT '#1E2D3D',
  icon text DEFAULT 'folder',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create conversation_folder_items table (junction table)
CREATE TABLE IF NOT EXISTS conversation_folder_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id uuid NOT NULL REFERENCES conversation_folders(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  UNIQUE(folder_id, conversation_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_message_bookmarks_user_id 
  ON message_bookmarks(user_id);

CREATE INDEX IF NOT EXISTS idx_message_bookmarks_conversation_id 
  ON message_bookmarks(conversation_id);

CREATE INDEX IF NOT EXISTS idx_message_bookmarks_user_conversation 
  ON message_bookmarks(user_id, conversation_id);

CREATE INDEX IF NOT EXISTS idx_conversation_folders_user_id 
  ON conversation_folders(user_id);

CREATE INDEX IF NOT EXISTS idx_conversation_folders_sort_order 
  ON conversation_folders(user_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_conversation_folder_items_folder_id 
  ON conversation_folder_items(folder_id);

CREATE INDEX IF NOT EXISTS idx_conversation_folder_items_conversation_id 
  ON conversation_folder_items(conversation_id);

-- Enable Row Level Security
ALTER TABLE message_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_folder_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for message_bookmarks
CREATE POLICY "Users can view own bookmarks"
  ON message_bookmarks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookmarks"
  ON message_bookmarks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookmarks"
  ON message_bookmarks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON message_bookmarks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for conversation_folders
CREATE POLICY "Users can view own folders"
  ON conversation_folders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own folders"
  ON conversation_folders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders"
  ON conversation_folders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders"
  ON conversation_folders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for conversation_folder_items
CREATE POLICY "Users can view own folder items"
  ON conversation_folder_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_folders
      WHERE conversation_folders.id = conversation_folder_items.folder_id
      AND conversation_folders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own folder items"
  ON conversation_folder_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversation_folders
      WHERE conversation_folders.id = conversation_folder_items.folder_id
      AND conversation_folders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own folder items"
  ON conversation_folder_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_folders
      WHERE conversation_folders.id = conversation_folder_items.folder_id
      AND conversation_folders.user_id = auth.uid()
    )
  );

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_message_bookmarks_updated_at
  BEFORE UPDATE ON message_bookmarks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversation_folders_updated_at
  BEFORE UPDATE ON conversation_folders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
