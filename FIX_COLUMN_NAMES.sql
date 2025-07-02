-- =============================================
-- カラム名修正版
-- 作成日: 2025-07-02
-- 概要: 正しいカラム名でRLS無効化とテスト
-- =============================================

-- 1. まずテーブル構造を確認
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'posts'
ORDER BY ordinal_position;

-- 2. RLS一時無効化
ALTER TABLE inspirations DISABLE ROW LEVEL SECURITY;
ALTER TABLE point_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_points DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_inspiration_stats DISABLE ROW LEVEL SECURITY;

-- 3. 修正版テスト用データ取得（author_idを使用）
WITH recent_users AS (
    SELECT id as user_id, email 
    FROM auth.users 
    ORDER BY created_at DESC 
    LIMIT 3
),
recent_posts AS (
    SELECT id as post_id, title, author_id 
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

-- 4. 修正版テスト関数
CREATE OR REPLACE FUNCTION quick_inspiration_test()
RETURNS TABLE(
    result_type TEXT,
    message TEXT,
    data_value TEXT
) AS $$
DECLARE
    test_user_id UUID;
    source_post_id UUID;
    inspired_post_id UUID;
    inspiration_id UUID;
BEGIN
    -- 最新ユーザーを取得
    SELECT id INTO test_user_id 
    FROM auth.users 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- 最新2つの投稿を取得
    SELECT id INTO source_post_id 
    FROM posts 
    ORDER BY created_at DESC 
    OFFSET 1 LIMIT 1;
    
    SELECT id INTO inspired_post_id 
    FROM posts 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- 結果を返す
    RETURN QUERY VALUES 
        ('user_id', 'テストユーザーID', test_user_id::TEXT),
        ('source_post', '元投稿ID', source_post_id::TEXT),
        ('inspired_post', '新投稿ID', inspired_post_id::TEXT);
    
    -- インスピレーション作成テスト
    IF test_user_id IS NOT NULL AND source_post_id IS NOT NULL AND inspired_post_id IS NOT NULL THEN
        BEGIN
            SELECT create_inspiration_simple(
                source_post_id,
                inspired_post_id,
                test_user_id,
                'direct',
                'クイックテスト用'
            ) INTO inspiration_id;
            
            RETURN QUERY VALUES ('result', 'インスピレーション作成', '✅ 成功: ' || inspiration_id::TEXT);
            
            -- ポイント確認
            RETURN QUERY 
            SELECT 
                'points'::TEXT,
                'ポイント状況'::TEXT,
                format('学習: %s, 影響力: %s, 合計: %s', 
                    COALESCE(learning_points, 0),
                    COALESCE(influence_points, 0), 
                    COALESCE(total_points, 0)
                )
            FROM user_points 
            WHERE user_id = test_user_id;
            
        EXCEPTION WHEN OTHERS THEN
            RETURN QUERY VALUES ('error', 'インスピレーション作成エラー', SQLERRM);
        END;
    ELSE
        RETURN QUERY VALUES ('error', 'テストデータ不足', 'ユーザーまたは投稿が不足しています');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 実行
SELECT * FROM quick_inspiration_test();

-- 6. 安全なRLS再有効化関数
CREATE OR REPLACE FUNCTION re_enable_rls()
RETURNS TEXT AS $$
BEGIN
    ALTER TABLE inspirations ENABLE ROW LEVEL SECURITY;
    ALTER TABLE point_history ENABLE ROW LEVEL SECURITY;  
    ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
    ALTER TABLE user_inspiration_stats ENABLE ROW LEVEL SECURITY;
    
    RETURN '✅ RLS再有効化完了';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 完了メッセージ
DO $$
BEGIN
    RAISE NOTICE '🔧 カラム名修正版テスト準備完了';
    RAISE NOTICE '📊 上記のquick_inspiration_test()の結果を確認してください';
    RAISE NOTICE '⚠️  テスト完了後は SELECT re_enable_rls(); を実行してください';
END $$;