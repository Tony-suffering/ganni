-- =============================================
-- 一時的RLS無効化（テスト用）
-- 作成日: 2025-07-02
-- 概要: RLSを無効化してインスピレーション機能をテスト
-- =============================================

-- ⚠️ 警告: これは一時的な対処です。本番環境では使用しないでください

-- 1. 関連テーブルのRLSを一時的に無効化
ALTER TABLE inspirations DISABLE ROW LEVEL SECURITY;
ALTER TABLE point_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_points DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_inspiration_stats DISABLE ROW LEVEL SECURITY;

-- 2. 認証なしテスト用の簡易関数
CREATE OR REPLACE FUNCTION test_inspiration_no_auth(
    p_source_post_id UUID,
    p_inspired_post_id UUID,
    p_creator_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_inspiration_id UUID;
BEGIN
    -- インスピレーション作成
    SELECT create_inspiration_simple(
        p_source_post_id,
        p_inspired_post_id,
        p_creator_id,
        'direct',
        'RLS無効化テスト'
    ) INTO v_inspiration_id;
    
    RAISE NOTICE '✅ インスピレーション作成成功: %', v_inspiration_id;
    
    -- ポイント確認
    RAISE NOTICE '💎 ポイント確認:';
    PERFORM check_inspiration_points(p_creator_id);
    
    RETURN v_inspiration_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 実際のデータでテスト用のクエリ
WITH recent_users AS (
    SELECT id as user_id, email 
    FROM auth.users 
    ORDER BY created_at DESC 
    LIMIT 3
),
recent_posts AS (
    SELECT id as post_id, title, user_id as author_id 
    FROM posts 
    ORDER BY created_at DESC 
    LIMIT 5
)
SELECT 
    'テスト用データ' as info,
    u.user_id,
    u.email,
    p1.post_id as source_post_id,
    p1.title as source_title,
    p2.post_id as inspired_post_id,
    p2.title as inspired_title
FROM recent_users u
CROSS JOIN recent_posts p1
CROSS JOIN recent_posts p2
WHERE p1.post_id != p2.post_id
LIMIT 1;

-- 4. 手動テスト手順
DO $$
BEGIN
    RAISE NOTICE '🔧 RLS一時無効化完了';
    RAISE NOTICE '';
    RAISE NOTICE '📋 テスト手順:';
    RAISE NOTICE '1. 上記のクエリで実際のIDを確認';
    RAISE NOTICE '2. 以下を実行してテスト:';
    RAISE NOTICE '   SELECT test_inspiration_no_auth(''元投稿ID'', ''新投稿ID'', ''ユーザーID'');';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  テスト完了後は必ずRLSを再有効化してください:';
    RAISE NOTICE '   ALTER TABLE inspirations ENABLE ROW LEVEL SECURITY;';
    RAISE NOTICE '   ALTER TABLE point_history ENABLE ROW LEVEL SECURITY;';
    RAISE NOTICE '   ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;';
    RAISE NOTICE '   ALTER TABLE user_inspiration_stats ENABLE ROW LEVEL SECURITY;';
END $$;