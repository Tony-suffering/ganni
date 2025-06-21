/*
  # タグテーブルの作成

  1. New Tables
    - `tags`
      - `id` (uuid, primary key) - タグID
      - `name` (text, unique) - タグ名
      - `color` (text) - タグカラー
      - `description` (text) - タグ説明
      - `slug` (text, unique) - URL用スラッグ
      - `created_at` (timestamptz) - 作成日時
      - `updated_at` (timestamptz) - 更新日時

  2. Security
    - Enable RLS on `tags` table
    - Add policy for public to read tags
    - Add policy for authenticated users to create tags
    - Add policy for creators to edit their tags

  3. Notes
    - Tags are publicly readable
    - Authenticated users can create tags
    - Tag creators can edit their own tags
*/

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  color text DEFAULT '#6366f1',
  description text DEFAULT '',
  slug text UNIQUE NOT NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read tags"
  ON tags
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create tags"
  ON tags
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = created_by::text);

CREATE POLICY "Creators can edit their tags"
  ON tags
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = created_by::text)
  WITH CHECK (auth.uid()::text = created_by::text);

CREATE POLICY "Admins can manage all tags"
  ON tags
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
CREATE TRIGGER update_tags_updated_at
  BEFORE UPDATE ON tags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX IF NOT EXISTS tags_slug_idx ON tags(slug);
CREATE INDEX IF NOT EXISTS tags_name_idx ON tags(name);
CREATE INDEX IF NOT EXISTS tags_created_by_idx ON tags(created_by);