-- Force allow all operations on comments table

-- First ensure RLS is enabled
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can read comments" ON comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;
DROP POLICY IF EXISTS "Allow all for testing" ON comments;

-- Create a completely permissive policy
CREATE POLICY "Allow all operations for everyone"
  ON comments
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Alternative: You can also try disabling RLS entirely
-- ALTER TABLE comments DISABLE ROW LEVEL SECURITY;