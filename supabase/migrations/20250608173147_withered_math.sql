/*
  # コメントテーブルの作成

  1. New Tables
    - `comments`
      - `id` (uuid, primary key) - コメントID
      - `content` (text) - コメント内容
      - `type` (text) - コメントタイプ (user, ai_comment, ai_question, ai_observation)
      - `author_id` (uuid) - 投稿者ID
      - `post_id` (uuid) - 記事ID
      - `parent_id` (uuid) - 親コメントID (返信用)
      - `published` (boolean) - 公開状態
      - `created_at` (timestamptz) - 作成日時
      - `updated_at` (timestamptz) - 更新日時

  2. Security
    - Enable RLS on `comments` table
    - Add policy for public to read published comments
    - Add policy for authors to manage their comments
    - Add policy for admins to manage all comments

  3. Foreign Keys
    - `author_id` references `users(id)`
    - `post_id` references `posts(id)`
    - `parent_id` references `comments(id)`

  4. Notes
    - Supports nested comments (replies)
    - Includes AI-generated comments
    - Only published comments are publicly visible
*/

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL DEFAULT '',
  type text DEFAULT 'user' CHECK (type IN ('user', 'ai_comment', 'ai_question', 'ai_observation')),
  author_id uuid REFERENCES users(id) ON DELETE CASCADE,
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can read published comments on published posts"
  ON comments
  FOR SELECT
  TO public
  USING (
    published = true AND
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = comments.post_id 
      AND posts.published = true
    )
  );

CREATE POLICY "Authors can read their own comments"
  ON comments
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = author_id::text);

CREATE POLICY "Authors can create comments"
  ON comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid()::text = author_id::text AND
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = comments.post_id 
      AND posts.published = true
    )
  );

CREATE POLICY "Authors can update their own comments"
  ON comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = author_id::text)
  WITH CHECK (auth.uid()::text = author_id::text);

CREATE POLICY "Authors can delete their own comments"
  ON comments
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = author_id::text);

CREATE POLICY "Post authors can moderate comments on their posts"
  ON comments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = comments.post_id 
      AND posts.author_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Admins can manage all comments"
  ON comments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text 
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text 
      AND users.role = 'admin'
    )
  );

-- Create updated_at trigger
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX IF NOT EXISTS comments_post_id_idx ON comments(post_id);
CREATE INDEX IF NOT EXISTS comments_author_id_idx ON comments(author_id);
CREATE INDEX IF NOT EXISTS comments_parent_id_idx ON comments(parent_id);
CREATE INDEX IF NOT EXISTS comments_published_idx ON comments(published);
CREATE INDEX IF NOT EXISTS comments_type_idx ON comments(type);
CREATE INDEX IF NOT EXISTS comments_post_published_created_idx ON comments(post_id, published, created_at DESC);