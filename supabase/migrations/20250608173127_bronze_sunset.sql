/*
  # ブログ記事テーブルの作成

  1. New Tables
    - `posts`
      - `id` (uuid, primary key) - 記事ID
      - `title` (text) - 記事タイトル
      - `content` (text) - 記事本文
      - `excerpt` (text) - 記事抜粋
      - `image_url` (text) - メイン画像URL
      - `ai_description` (text) - AI生成説明
      - `user_comment` (text) - ユーザーコメント
      - `published` (boolean) - 公開状態
      - `slug` (text, unique) - URL用スラッグ
      - `author_id` (uuid) - 著者ID
      - `category_id` (uuid) - カテゴリーID
      - `view_count` (integer) - 閲覧数
      - `created_at` (timestamptz) - 作成日時
      - `updated_at` (timestamptz) - 更新日時

  2. Security
    - Enable RLS on `posts` table
    - Add policy for public to read published posts
    - Add policy for authors to manage their posts
    - Add policy for admins to manage all posts

  3. Foreign Keys
    - `author_id` references `users(id)`
    - `category_id` references `categories(id)`

  4. Notes
    - Only published posts are publicly visible
    - Authors can manage their own posts
    - Admins can manage all posts
*/

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  content text DEFAULT '',
  excerpt text DEFAULT '',
  image_url text DEFAULT '',
  ai_description text DEFAULT '',
  user_comment text DEFAULT '',
  published boolean DEFAULT false,
  slug text UNIQUE NOT NULL,
  author_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can read published posts"
  ON posts
  FOR SELECT
  TO public
  USING (published = true);

CREATE POLICY "Authors can read their own posts"
  ON posts
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = author_id::text);

CREATE POLICY "Authors can create posts"
  ON posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = author_id::text);

CREATE POLICY "Authors can update their own posts"
  ON posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = author_id::text)
  WITH CHECK (auth.uid()::text = author_id::text);

CREATE POLICY "Authors can delete their own posts"
  ON posts
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = author_id::text);

CREATE POLICY "Admins can manage all posts"
  ON posts
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
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX IF NOT EXISTS posts_author_id_idx ON posts(author_id);
CREATE INDEX IF NOT EXISTS posts_category_id_idx ON posts(category_id);
CREATE INDEX IF NOT EXISTS posts_published_idx ON posts(published);
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS posts_slug_idx ON posts(slug);
CREATE INDEX IF NOT EXISTS posts_published_created_at_idx ON posts(published, created_at DESC);