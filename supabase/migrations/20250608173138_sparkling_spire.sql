/*
  # 記事-タグ中間テーブルの作成

  1. New Tables
    - `post_tags`
      - `id` (uuid, primary key) - 中間テーブルID
      - `post_id` (uuid) - 記事ID
      - `tag_id` (uuid) - タグID
      - `created_at` (timestamptz) - 作成日時

  2. Security
    - Enable RLS on `post_tags` table
    - Add policy for public to read post-tag relationships
    - Add policy for authors to manage their post tags
    - Add policy for admins to manage all post tags

  3. Foreign Keys
    - `post_id` references `posts(id)`
    - `tag_id` references `tags(id)`

  4. Constraints
    - Unique constraint on (post_id, tag_id) combination

  5. Notes
    - Many-to-many relationship between posts and tags
    - Authors can manage tags on their own posts
    - Admins can manage all post tags
*/

-- Create post_tags table
CREATE TABLE IF NOT EXISTS post_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  tag_id uuid REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, tag_id)
);

-- Enable RLS
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can read post-tag relationships"
  ON post_tags
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = post_tags.post_id 
      AND posts.published = true
    )
  );

CREATE POLICY "Authors can read their post tags"
  ON post_tags
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = post_tags.post_id 
      AND posts.author_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Authors can manage their post tags"
  ON post_tags
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = post_tags.post_id 
      AND posts.author_id::text = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = post_tags.post_id 
      AND posts.author_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Admins can manage all post tags"
  ON post_tags
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

-- Create indexes
CREATE INDEX IF NOT EXISTS post_tags_post_id_idx ON post_tags(post_id);
CREATE INDEX IF NOT EXISTS post_tags_tag_id_idx ON post_tags(tag_id);
CREATE INDEX IF NOT EXISTS post_tags_post_tag_idx ON post_tags(post_id, tag_id);