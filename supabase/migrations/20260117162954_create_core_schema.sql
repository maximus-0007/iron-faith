/*
  # Iron Faith Core Database Schema
  
  This migration creates all essential tables for the Iron Faith app:
  - conversations: User chat conversations
  - messages: Chat messages
  - user_profiles: User profile data with intake information
  - user_subscriptions: Subscription status and trial tracking
  - user_translation_preferences: Bible translation preferences
  - message_feedback: Thumbs up/down feedback on AI responses
  - user_memories: Persistent context about users
  - verse_cache: Cached Bible verses
  - bookmarks: Message bookmarks
  
  Security: All tables have RLS enabled with proper policies
*/

-- ============================================================================
-- CONVERSATIONS & MESSAGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text DEFAULT 'New Conversation',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_pinned boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(user_id, updated_at DESC);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations" ON conversations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own conversations" ON conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON conversations FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own conversations" ON conversations FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can view messages in own conversations" ON messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM conversations WHERE conversations.id = messages.conversation_id AND conversations.user_id = auth.uid()));
CREATE POLICY "Users can create messages in own conversations" ON messages FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM conversations WHERE conversations.id = messages.conversation_id AND conversations.user_id = auth.uid()));
CREATE POLICY "Users can update messages in own conversations" ON messages FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM conversations WHERE conversations.id = messages.conversation_id AND conversations.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM conversations WHERE conversations.id = messages.conversation_id AND conversations.user_id = auth.uid()));
CREATE POLICY "Users can delete messages in own conversations" ON messages FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM conversations WHERE conversations.id = messages.conversation_id AND conversations.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations SET updated_at = NEW.created_at WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON messages;
CREATE TRIGGER trigger_update_conversation_timestamp AFTER INSERT ON messages FOR EACH ROW EXECUTE FUNCTION update_conversation_timestamp();

-- ============================================================================
-- USER PROFILES
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text DEFAULT '',
  about text DEFAULT '',
  relationship_status text,
  has_children boolean,
  career_stage text,
  spiritual_struggles text[],
  onboarding_completed boolean DEFAULT false,
  onboarding_completed_at timestamptz,
  first_message_sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own profile" ON user_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own profile" ON user_profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id) VALUES (new.id) ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- SUBSCRIPTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_status text DEFAULT 'free' CHECK (subscription_status IN ('free', 'premium', 'trial')),
  is_on_trial boolean DEFAULT false,
  trial_start_date timestamptz,
  trial_end_date timestamptz,
  daily_message_count integer DEFAULT 0,
  last_message_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON user_subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscription" ON user_subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscription" ON user_subscriptions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION create_user_subscription()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, subscription_status, is_on_trial, trial_start_date, trial_end_date)
  VALUES (
    NEW.id,
    'trial',
    true,
    now(),
    now() + interval '3 days'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_created_create_subscription ON auth.users;
CREATE TRIGGER on_user_created_create_subscription AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION create_user_subscription();

-- ============================================================================
-- MESSAGE LIMITS
-- ============================================================================

CREATE OR REPLACE FUNCTION check_message_limit(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub_record RECORD;
  today date;
BEGIN
  today := CURRENT_DATE;
  
  SELECT * INTO sub_record FROM user_subscriptions WHERE user_id = user_uuid;
  
  IF NOT FOUND THEN
    INSERT INTO user_subscriptions (user_id) VALUES (user_uuid) RETURNING * INTO sub_record;
  END IF;
  
  IF sub_record.subscription_status = 'premium' THEN
    RETURN true;
  END IF;
  
  IF sub_record.is_on_trial AND sub_record.trial_end_date > now() THEN
    RETURN true;
  END IF;
  
  IF sub_record.last_message_date IS NULL OR sub_record.last_message_date < today THEN
    RETURN true;
  END IF;
  
  IF sub_record.daily_message_count < 5 THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION increment_message_count(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  today date;
  sub_record RECORD;
BEGIN
  today := CURRENT_DATE;
  
  SELECT * INTO sub_record FROM user_subscriptions WHERE user_id = user_uuid FOR UPDATE;
  
  IF NOT FOUND THEN
    INSERT INTO user_subscriptions (user_id, daily_message_count, last_message_date) 
    VALUES (user_uuid, 1, today);
    RETURN;
  END IF;
  
  IF sub_record.last_message_date IS NULL OR sub_record.last_message_date < today THEN
    UPDATE user_subscriptions 
    SET daily_message_count = 1, last_message_date = today 
    WHERE user_id = user_uuid;
  ELSE
    UPDATE user_subscriptions 
    SET daily_message_count = daily_message_count + 1 
    WHERE user_id = user_uuid;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION get_user_usage(user_uuid uuid)
RETURNS TABLE (
  is_premium boolean,
  is_on_trial boolean,
  trial_end_date timestamptz,
  daily_message_count integer,
  messages_remaining integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub_record RECORD;
  today date;
BEGIN
  today := CURRENT_DATE;
  
  SELECT * INTO sub_record FROM user_subscriptions WHERE user_id = user_uuid;
  
  IF NOT FOUND THEN
    INSERT INTO user_subscriptions (user_id) VALUES (user_uuid) RETURNING * INTO sub_record;
  END IF;
  
  RETURN QUERY SELECT
    (sub_record.subscription_status = 'premium')::boolean,
    (sub_record.is_on_trial AND sub_record.trial_end_date > now())::boolean,
    sub_record.trial_end_date,
    CASE 
      WHEN sub_record.last_message_date IS NULL OR sub_record.last_message_date < today THEN 0
      ELSE sub_record.daily_message_count
    END,
    CASE
      WHEN sub_record.subscription_status = 'premium' THEN 999999
      WHEN sub_record.is_on_trial AND sub_record.trial_end_date > now() THEN 999999
      WHEN sub_record.last_message_date IS NULL OR sub_record.last_message_date < today THEN 5
      ELSE GREATEST(0, 5 - sub_record.daily_message_count)
    END;
END;
$$;

-- ============================================================================
-- TRANSLATION PREFERENCES
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_translation_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  translation_id text NOT NULL,
  translation_name text NOT NULL,
  sort_order integer NOT NULL,
  is_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, translation_id)
);

CREATE INDEX IF NOT EXISTS idx_user_translation_preferences_user_id ON user_translation_preferences(user_id);

ALTER TABLE user_translation_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own translation preferences" ON user_translation_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own translation preferences" ON user_translation_preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own translation preferences" ON user_translation_preferences FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own translation preferences" ON user_translation_preferences FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION create_default_translation_preferences()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_translation_preferences (user_id, translation_id, translation_name, sort_order, is_enabled)
  VALUES
    (NEW.id, '9879dbb7cfe39e4d-01', 'World English Bible (WEB)', 1, true),
    (NEW.id, 'de4e12af7f28f599-02', 'King James Version (KJV)', 2, true)
  ON CONFLICT (user_id, translation_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_created_add_default_translations ON auth.users;
CREATE TRIGGER on_user_created_add_default_translations AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION create_default_translation_preferences();

-- ============================================================================
-- MESSAGE FEEDBACK
-- ============================================================================

CREATE TABLE IF NOT EXISTS message_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  feedback_type text NOT NULL CHECK (feedback_type IN ('thumbs_up', 'thumbs_down')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_message_feedback_message_id ON message_feedback(message_id);
CREATE INDEX IF NOT EXISTS idx_message_feedback_user_id ON message_feedback(user_id);

ALTER TABLE message_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feedback" ON message_feedback FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own feedback" ON message_feedback FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own feedback" ON message_feedback FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own feedback" ON message_feedback FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================================
-- USER MEMORIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_type text NOT NULL CHECK (memory_type IN ('life_event', 'relationship', 'struggle', 'preference', 'achievement', 'belief', 'context')),
  content text NOT NULL,
  source_conversation_id uuid REFERENCES conversations(id) ON DELETE SET NULL,
  confidence numeric(3,2) DEFAULT 0.8 CHECK (confidence >= 0 AND confidence <= 1),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_memories_user_id ON user_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memories_type ON user_memories(user_id, memory_type);

ALTER TABLE user_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own memories" ON user_memories FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own memories" ON user_memories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own memories" ON user_memories FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own memories" ON user_memories FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================================
-- VERSE CACHE
-- ============================================================================

CREATE TABLE IF NOT EXISTS verse_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  translation_id text NOT NULL,
  book text NOT NULL,
  chapter integer NOT NULL,
  verse integer NOT NULL,
  verse_text text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, translation_id, book, chapter, verse)
);

CREATE INDEX IF NOT EXISTS idx_verse_cache_lookup ON verse_cache(user_id, translation_id, book, chapter, verse);

ALTER TABLE verse_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own verse cache" ON verse_cache FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own verse cache" ON verse_cache FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- BOOKMARKS
-- ============================================================================

CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  note text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, message_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id, created_at DESC);

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookmarks" ON bookmarks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own bookmarks" ON bookmarks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bookmarks" ON bookmarks FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own bookmarks" ON bookmarks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================================
-- ACCOUNT DELETION
-- ============================================================================

CREATE OR REPLACE FUNCTION delete_user_account(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM auth.users WHERE id = user_uuid;
END;
$$;