-- =============================================
-- いいねテーブルの作成
-- 作成日: 2025-07-02
-- 概要: いいね機能のデータベーステーブルを作成
-- =============================================

-- 1. いいねテーブルの作成
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    -- 同じユーザーが同じ投稿に複数回いいねできないようにする
    UNIQUE(user_id, post_id)
);

-- 2. ブックマークテーブルも確認・作成
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    -- 同じユーザーが同じ投稿に複数回ブックマークできないようにする
    UNIQUE(user_id, post_id)
);

-- 3. インデックスの作成（パフォーマンス最適化）
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON public.likes(created_at);
CREATE INDEX IF NOT EXISTS idx_likes_user_post ON public.likes(user_id, post_id);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_post_id ON public.bookmarks(post_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON public.bookmarks(created_at);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_post ON public.bookmarks(user_id, post_id);

-- 4. RLS (Row Level Security) ポリシーの設定

-- likesテーブルのRLS有効化
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- すべてのユーザーが自分のいいねを作成・削除・閲覧可能
CREATE POLICY "Users can manage their own likes"
ON public.likes
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- すべてのユーザーがすべてのいいねを閲覧可能
CREATE POLICY "Anyone can view all likes"
ON public.likes
FOR SELECT
USING (true);

-- bookmarksテーブルのRLS設定
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- すべてのユーザーが自分のブックマークを管理可能
CREATE POLICY "Users can manage their own bookmarks"
ON public.bookmarks
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. 更新日時自動更新のトリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- likesテーブル用トリガー
DROP TRIGGER IF EXISTS update_likes_updated_at ON public.likes;
CREATE TRIGGER update_likes_updated_at
    BEFORE UPDATE ON public.likes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- bookmarksテーブル用トリガー
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

-- 8. 既存データの整合性確認
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

RAISE NOTICE '✅ いいねテーブルとブックマークテーブルの作成が完了しました';
RAISE NOTICE '🔧 必要な関数とインデックスも設定されました';
RAISE NOTICE '🔒 RLSポリシーによりセキュリティも確保されています';