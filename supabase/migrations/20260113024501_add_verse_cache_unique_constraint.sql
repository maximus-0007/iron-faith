/*
  # Add Unique Constraint for Verse Cache Upsert

  ## Overview
  Adds a unique constraint to the verse_cache table to enable efficient upsert operations.
  This ensures each combination of (user_id, verse_reference, translation_id) is unique.

  ## Changes
  - Add unique constraint on (user_id, verse_reference, translation_id)
  - This allows upsert operations to update existing cache entries efficiently
*/

-- Add unique constraint to support upsert operations
ALTER TABLE verse_cache
ADD CONSTRAINT verse_cache_user_reference_translation_key
UNIQUE (user_id, verse_reference, translation_id);