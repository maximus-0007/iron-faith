/*
  # Create Verse Cache Table for Bible Verse Caching

  ## Overview
  This migration creates a comprehensive verse caching system to store fetched Bible verses
  and avoid repeated API calls. Verses are cached per translation and expire after 90 days.

  ## New Tables
  
  ### `verse_cache`
  Stores fetched Bible verses with their translations for quick retrieval.
  
  **Columns:**
  - `id` (uuid, primary key) - Unique identifier for cache entry
  - `user_id` (uuid, foreign key) - User who cached the verse (allows user-specific caching)
  - `verse_reference` (text, not null) - Full verse reference (e.g., "John 3:16")
  - `translation_id` (text, not null) - Bible translation ID (e.g., "de4e12af7f28f599-02" for WEB)
  - `verse_text` (text, not null) - The actual verse content
  - `book_name` (text, not null) - Book name (e.g., "John", "Genesis")
  - `chapter` (integer, not null) - Chapter number
  - `verse_number` (integer, not null) - Starting verse number
  - `verse_end` (integer, nullable) - Ending verse number for ranges
  - `cached_at` (timestamptz, not null) - When the verse was cached
  - `expires_at` (timestamptz, not null) - When the cache expires (default: 90 days from cached_at)
  - `created_at` (timestamptz, default now()) - Record creation timestamp
  
  ## Indexes
  - Primary index on `id`
  - Composite index on `(verse_reference, translation_id)` for fast lookups
  - Index on `user_id` for user-specific queries
  - Index on `expires_at` for cleanup operations
  
  ## Security
  - Enable RLS on `verse_cache` table
  - Policy: Authenticated users can read all cached verses (verses are public data)
  - Policy: Authenticated users can insert their own cached verses
  - Policy: Users can update their own cached verses (for refreshing expired cache)
  - Policy: Users can delete their own expired cache entries
  
  ## Functions
  - `cleanup_expired_verse_cache()` - Removes expired cache entries
  - Can be called manually or via scheduled job
  
  ## Notes
  - 90-day expiration because Bible verses are static content
  - Translation-specific caching ensures accuracy across different Bible versions
  - User-specific caching allows for personalized cache management
  - Composite index ensures O(1) lookup time for cache hits
*/

-- Create verse_cache table
CREATE TABLE IF NOT EXISTS verse_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  verse_reference text NOT NULL,
  translation_id text NOT NULL,
  verse_text text NOT NULL,
  book_name text NOT NULL,
  chapter integer NOT NULL,
  verse_number integer NOT NULL,
  verse_end integer,
  cached_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '90 days'),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_verse_cache_lookup 
  ON verse_cache(verse_reference, translation_id);

CREATE INDEX IF NOT EXISTS idx_verse_cache_user 
  ON verse_cache(user_id);

CREATE INDEX IF NOT EXISTS idx_verse_cache_expires 
  ON verse_cache(expires_at);

-- Enable Row Level Security
ALTER TABLE verse_cache ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read all cached verses (Bible verses are public data)
CREATE POLICY "Users can read all cached verses"
  ON verse_cache
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can insert cached verses
CREATE POLICY "Users can insert cached verses"
  ON verse_cache
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own cached verses
CREATE POLICY "Users can update own cached verses"
  ON verse_cache
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own cached verses
CREATE POLICY "Users can delete own cached verses"
  ON verse_cache
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to cleanup expired verse cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_verse_cache()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM verse_cache
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION cleanup_expired_verse_cache() TO authenticated;