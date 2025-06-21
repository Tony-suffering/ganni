-- Create the final comments table structure that matches the actual schema

-- Drop and recreate the table with the correct structure
DROP TABLE IF EXISTS comments CASCADE;

-- Create table with only the fields that actually exist
CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  user_id uuid NOT NULL,
  post_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Disable RLS entirely for now
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX comments_post_id_idx ON comments(post_id);
CREATE INDEX comments_user_id_idx ON comments(user_id);
CREATE INDEX comments_created_at_idx ON comments(created_at DESC);