/*
# PostFlow — Initial schema

1. Purpose
   Multi-user SaaS demo for managing social posts across platforms.
   Each user only sees their own data (RLS enforced).

2. New Tables
   - profiles: user display info keyed to auth.users
   - social_accounts: connected (simulated) social accounts per user
   - posts: user posts (draft/scheduled/published/failed)
   - post_platforms: per-platform records for a post
   - scheduled_posts: scheduling records linking a post to a date
   - repurpose_sessions: AI repurpose session inputs + generated content
   - ai_usage: monthly AI generation counter per user

3. Security
   - RLS enabled on every table.
   - Owner-scoped CRUD (4 policies per table) using auth.uid().
   - user_id columns default to auth.uid() so inserts succeed even when omitted.
   - Storage bucket "media" created with policies for authenticated users to
     manage only their own files under user-id-prefixed paths.

4. Notes
   - No real platform APIs are used; status fields drive demo publishing.
   - All id columns use gen_random_uuid().
*/

-- ---------- profiles ----------
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profiles" ON profiles;
CREATE POLICY "select_own_profiles" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "insert_own_profiles" ON profiles;
CREATE POLICY "insert_own_profiles" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "update_own_profiles" ON profiles;
CREATE POLICY "update_own_profiles" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "delete_own_profiles" ON profiles;
CREATE POLICY "delete_own_profiles" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- ---------- social_accounts ----------
CREATE TABLE IF NOT EXISTS social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL,
  account_name text NOT NULL,
  account_username text,
  account_id text,
  status text NOT NULL DEFAULT 'connected',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_social_accounts" ON social_accounts;
CREATE POLICY "select_own_social_accounts" ON social_accounts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_social_accounts" ON social_accounts;
CREATE POLICY "insert_own_social_accounts" ON social_accounts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_social_accounts" ON social_accounts;
CREATE POLICY "update_own_social_accounts" ON social_accounts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_social_accounts" ON social_accounts;
CREATE POLICY "delete_own_social_accounts" ON social_accounts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ---------- posts ----------
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  caption text NOT NULL DEFAULT '',
  media_url text,
  media_type text,
  status text NOT NULL DEFAULT 'draft',
  scheduled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_posts" ON posts;
CREATE POLICY "select_own_posts" ON posts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_posts" ON posts;
CREATE POLICY "insert_own_posts" ON posts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_posts" ON posts;
CREATE POLICY "update_own_posts" ON posts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_posts" ON posts;
CREATE POLICY "delete_own_posts" ON posts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ---------- post_platforms ----------
CREATE TABLE IF NOT EXISTS post_platforms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  platform text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  published_url text,
  published_at timestamptz
);
ALTER TABLE post_platforms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_post_platforms" ON post_platforms;
CREATE POLICY "select_own_post_platforms" ON post_platforms FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM posts p WHERE p.id = post_platforms.post_id AND p.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "insert_own_post_platforms" ON post_platforms;
CREATE POLICY "insert_own_post_platforms" ON post_platforms FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM posts p WHERE p.id = post_platforms.post_id AND p.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "update_own_post_platforms" ON post_platforms;
CREATE POLICY "update_own_post_platforms" ON post_platforms FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM posts p WHERE p.id = post_platforms.post_id AND p.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM posts p WHERE p.id = post_platforms.post_id AND p.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "delete_own_post_platforms" ON post_platforms;
CREATE POLICY "delete_own_post_platforms" ON post_platforms FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM posts p WHERE p.id = post_platforms.post_id AND p.user_id = auth.uid())
  );

-- ---------- scheduled_posts ----------
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled',
  published_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_scheduled_posts" ON scheduled_posts;
CREATE POLICY "select_own_scheduled_posts" ON scheduled_posts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_scheduled_posts" ON scheduled_posts;
CREATE POLICY "insert_own_scheduled_posts" ON scheduled_posts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_scheduled_posts" ON scheduled_posts;
CREATE POLICY "update_own_scheduled_posts" ON scheduled_posts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_scheduled_posts" ON scheduled_posts;
CREATE POLICY "delete_own_scheduled_posts" ON scheduled_posts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ---------- repurpose_sessions ----------
CREATE TABLE IF NOT EXISTS repurpose_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  source_media_url text,
  source_text text,
  source_type text NOT NULL DEFAULT 'text',
  platforms jsonb NOT NULL DEFAULT '[]'::jsonb,
  tone text,
  goal text,
  language text,
  brand_voice text,
  generated_content jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE repurpose_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_repurpose_sessions" ON repurpose_sessions;
CREATE POLICY "select_own_repurpose_sessions" ON repurpose_sessions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_repurpose_sessions" ON repurpose_sessions;
CREATE POLICY "insert_own_repurpose_sessions" ON repurpose_sessions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_repurpose_sessions" ON repurpose_sessions;
CREATE POLICY "update_own_repurpose_sessions" ON repurpose_sessions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_repurpose_sessions" ON repurpose_sessions;
CREATE POLICY "delete_own_repurpose_sessions" ON repurpose_sessions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ---------- ai_usage ----------
CREATE TABLE IF NOT EXISTS ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  month text NOT NULL,
  generations_used integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, month)
);
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_ai_usage" ON ai_usage;
CREATE POLICY "select_own_ai_usage" ON ai_usage FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_ai_usage" ON ai_usage;
CREATE POLICY "insert_own_ai_usage" ON ai_usage FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_ai_usage" ON ai_usage;
CREATE POLICY "update_own_ai_usage" ON ai_usage FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_ai_usage" ON ai_usage;
CREATE POLICY "delete_own_ai_usage" ON ai_usage FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ---------- updated_at trigger ----------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS posts_updated_at ON posts;
CREATE TRIGGER posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS repurpose_sessions_updated_at ON repurpose_sessions;
CREATE TRIGGER repurpose_sessions_updated_at BEFORE UPDATE ON repurpose_sessions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS ai_usage_updated_at ON ai_usage;
CREATE TRIGGER ai_usage_updated_at BEFORE UPDATE ON ai_usage
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------- storage bucket ----------
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: authenticated users manage only their own path (media/{user_id}/...)
DROP POLICY IF EXISTS "media_select_own" ON storage.objects;
CREATE POLICY "media_select_own" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "media_insert_own" ON storage.objects;
CREATE POLICY "media_insert_own" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "media_update_own" ON storage.objects;
CREATE POLICY "media_update_own" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "media_delete_own" ON storage.objects;
CREATE POLICY "media_delete_own" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- indexes ----------
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_at ON posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_post_platforms_post_id ON post_platforms(post_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_id ON scheduled_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_at ON scheduled_posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_social_accounts_user_id ON social_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_repurpose_sessions_user_id ON repurpose_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_month ON ai_usage(user_id, month);
