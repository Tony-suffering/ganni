-- Temporarily disable RLS for debugging

-- Drop all policies
DROP POLICY IF EXISTS "Anyone can read comments" ON comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;

-- Disable RLS temporarily
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;

-- Or alternatively, create a very permissive policy for testing
-- ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all for testing"
--   ON comments
--   FOR ALL
--   TO public
--   USING (true)
--   WITH CHECK (true);