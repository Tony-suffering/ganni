-- =============================================
-- ブックマークテーブル修正
-- 作成日: 2025-07-02
-- 概要: bookmarksテーブルでauth.usersを参照するように修正
-- =============================================

-- 1. 既存の外部キー制約を削除
ALTER TABLE public.bookmarks 
DROP CONSTRAINT IF EXISTS bookmarks_user_id_fkey;

-- 2. 新しい外部キー制約を追加（auth.usersを参照）
ALTER TABLE public.bookmarks
ADD CONSTRAINT bookmarks_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. RLSポリシーを更新（念のため）
DROP POLICY IF EXISTS "Users can view own bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Users can create own bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Users can delete own bookmarks" ON public.bookmarks;

-- 新しいポリシー作成
CREATE POLICY "Users can view own bookmarks" ON public.bookmarks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookmarks" ON public.bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks" ON public.bookmarks
  FOR DELETE USING (auth.uid() = user_id);

RAISE NOTICE '✅ bookmarksテーブルがauth.usersを参照するように修正されました';