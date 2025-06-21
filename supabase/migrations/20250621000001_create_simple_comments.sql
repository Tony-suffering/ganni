-- Create simple comments table if it doesn't exist or recreate with correct structure

-- Drop existing table if exists (be careful in production!)
DROP TABLE IF EXISTS comments CASCADE;

-- Create simple comments table
CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  type text DEFAULT 'user' CHECK (type IN ('user', 'ai_comment', 'ai_question', 'ai_observation')),
  user_id uuid NOT NULL,
  post_id uuid NOT NULL,
  published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Foreign key constraints (optional, depends on your table structure)
  CONSTRAINT fk_comments_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Create simple RLS policies
CREATE POLICY "Anyone can read published comments"
  ON comments
  FOR SELECT
  TO public
  USING (published = true);

CREATE POLICY "Authenticated users can create comments"
  ON comments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own comments"
  ON comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own comments"
  ON comments
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id::text);

-- Create indexes
CREATE INDEX comments_post_id_idx ON comments(post_id);
CREATE INDEX comments_user_id_idx ON comments(user_id);
CREATE INDEX comments_created_at_idx ON comments(created_at DESC);

-- Create updated_at trigger
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();