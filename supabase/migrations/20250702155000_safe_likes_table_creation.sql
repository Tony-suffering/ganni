-- =============================================
-- 安全なlikesテーブル作成（既存要素を考慮）
-- 作成日: 2025-07-02
-- 概要: 既存のテーブル・ポリシーがある場合も安全に実行
-- =============================================

-- 1. likesテーブルが存在しない場合のみ作成
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'likes') THEN
    CREATE TABLE public.likes (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
        
        -- 同じユーザーが同じ投稿に複数回いいねできないようにする
        UNIQUE(user_id, post_id)
    );
    
    RAISE NOTICE 'likesテーブルを作成しました';
  ELSE
    RAISE NOTICE 'likesテーブルは既に存在します';
  END IF;
END $$;

-- 2. bookmarksテーブルが存在しない場合のみ作成
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'bookmarks') THEN
    CREATE TABLE public.bookmarks (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
        
        -- 同じユーザーが同じ投稿に複数回ブックマークできないようにする
        UNIQUE(user_id, post_id)
    );
    
    RAISE NOTICE 'bookmarksテーブルを作成しました';
  ELSE
    RAISE NOTICE 'bookmarksテーブルは既に存在します';
  END IF;
END $$;

-- 3. インデックスの作成（IF NOT EXISTS使用）
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON public.likes(created_at);
CREATE INDEX IF NOT EXISTS idx_likes_user_post ON public.likes(user_id, post_id);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_post_id ON public.bookmarks(post_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON public.bookmarks(created_at);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_post ON public.bookmarks(user_id, post_id);

-- 4. RLS (Row Level Security) ポリシーの安全な設定

-- likesテーブルのRLS有効化
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除してから再作成
DROP POLICY IF EXISTS "Users can manage their own likes" ON public.likes;
DROP POLICY IF EXISTS "Anyone can view all likes" ON public.likes;

-- ポリシーの再作成
CREATE POLICY "Users can manage their own likes"
ON public.likes
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view all likes"
ON public.likes
FOR SELECT
USING (true);

-- bookmarksテーブルのRLS設定
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除してから再作成
DROP POLICY IF EXISTS "Users can manage their own bookmarks" ON public.bookmarks;

CREATE POLICY "Users can manage their own bookmarks"
ON public.bookmarks
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. 更新日時自動更新のトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 既存のトリガーを削除してから再作成
DROP TRIGGER IF EXISTS update_likes_updated_at ON public.likes;
CREATE TRIGGER update_likes_updated_at
    BEFORE UPDATE ON public.likes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookmarks_updated_at ON public.bookmarks;
CREATE TRIGGER update_bookmarks_updated_at
    BEFORE UPDATE ON public.bookmarks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. 便利な関数の作成

-- 投稿のいいね数を取得する関数
CREATE OR REPLACE FUNCTION get_post_like_count(post_id_param UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM public.likes
        WHERE post_id = post_id_param
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ユーザーが投稿にいいねしているかチェックする関数
CREATE OR REPLACE FUNCTION check_user_liked_post(user_id_param UUID, post_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.likes
        WHERE user_id = user_id_param AND post_id = post_id_param
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 投稿のブックマーク数を取得する関数
CREATE OR REPLACE FUNCTION get_post_bookmark_count(post_id_param UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM public.bookmarks
        WHERE post_id = post_id_param
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ユーザーが投稿をブックマークしているかチェックする関数
CREATE OR REPLACE FUNCTION check_user_bookmarked_post(user_id_param UUID, post_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.bookmarks
        WHERE user_id = user_id_param AND post_id = post_id_param
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 権限設定
GRANT ALL ON public.likes TO authenticated;
GRANT ALL ON public.bookmarks TO authenticated;
GRANT EXECUTE ON FUNCTION get_post_like_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_liked_post(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_post_bookmark_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_bookmarked_post(UUID, UUID) TO authenticated;

-- 8. 既存データの整合性確認（オプション）
-- 注意: 投稿テーブルのlike_countとbookmark_countを更新したい場合は以下のコメントを外してください

/*
-- 投稿テーブルのいいね数とブックマーク数を実際の値に同期
UPDATE public.posts 
SET 
    like_count = (
        SELECT COUNT(*) 
        FROM public.likes 
        WHERE likes.post_id = posts.id
    ),
    bookmark_count = (
        SELECT COUNT(*) 
        FROM public.bookmarks 
        WHERE bookmarks.post_id = posts.id
    )
WHERE id IN (
    SELECT DISTINCT post_id 
    FROM public.likes 
    UNION 
    SELECT DISTINCT post_id 
    FROM public.bookmarks
);
*/

RAISE NOTICE '✅ いいねテーブルとブックマークテーブルの安全な作成/更新が完了しました';
RAISE NOTICE '🔧 必要な関数とインデックスも設定されました';
RAISE NOTICE '🔒 RLSポリシーが安全に再設定されました';