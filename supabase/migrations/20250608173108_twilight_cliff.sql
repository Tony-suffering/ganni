/*
  # ユーザーテーブルの作成

  1. New Tables
    - `users`
      - `id` (uuid, primary key) - ユーザーID
      - `email` (text, unique) - メールアドレス
      - `name` (text) - 表示名
      - `avatar_url` (text) - プロフィール画像URL
      - `bio` (text) - プロフィール説明
      - `role` (text) - ユーザー役割 (admin, editor, user)
      - `created_at` (timestamptz) - 作成日時
      - `updated_at` (timestamptz) - 更新日時

  2. Security
    - Enable RLS on `users` table
    - Add policy for users to read their own data
    - Add policy for users to update their own data
    - Add policy for public to read basic user info

  3. Notes
    - Uses Supabase auth.users() for authentication
    - Triggers for updated_at timestamp
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL DEFAULT '',
  avatar_url text DEFAULT '',
  bio text DEFAULT '',
  role text DEFAULT 'user' CHECK (role IN ('admin', 'editor', 'user')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Public can read basic user info"
  ON users
  FOR SELECT
  TO public
  USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for email lookup
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);