-- Fix comments table RLS policies for easier access

-- まず既存のポリシーを削除
DROP POLICY IF EXISTS "Public can read published comments on published posts" ON comments;
DROP POLICY IF EXISTS "Authors can read their own comments" ON comments;
DROP POLICY IF EXISTS "Authors can create comments" ON comments;
DROP POLICY IF EXISTS "Authors can update their own comments" ON comments;
DROP POLICY IF EXISTS "Authors can delete their own comments" ON comments;
DROP POLICY IF EXISTS "Post authors can moderate comments on their posts" ON comments;
DROP POLICY IF EXISTS "Admins can manage all comments" ON comments;

-- より簡単なポリシーを作成
CREATE POLICY "Anyone can read published comments"
  ON comments
  FOR SELECT
  TO public
  USING (published = true);

CREATE POLICY "Authenticated users can create comments"
  ON comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = author_id::text);

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