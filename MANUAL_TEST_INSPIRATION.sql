-- =============================================
-- 手動インスピレーションテスト
-- 作成日: 2025-07-02
-- 概要: 手動でインスピレーション機能をテストする
-- =============================================

-- 1. 実際のユーザーIDと投稿IDを取得
SELECT 
    'ユーザー一覧' as type,
    au.id as user_id,
    au.email,
    up.total_points
FROM auth.users au
LEFT JOIN user_points up ON up.user_id = au.id
ORDER BY au.created_at DESC
LIMIT 5;

SELECT 
    '投稿一覧' as type,
    p.id as post_id,
    p.title,
    p.user_id as author_id,
    p.created_at
FROM posts p
ORDER BY p.created_at DESC
LIMIT 5;

-- 2. 手動インスピレーション作成テスト（実際のIDに置き換えて実行）
-- 例: 
-- SELECT create_inspiration_simple(
--     '元投稿のID',        -- p_source_post_id
--     '新投稿のID',        -- p_inspired_post_id  
--     'ユーザーID',        -- p_creator_id
--     'direct',           -- p_inspiration_type
--     '手動テストです'     -- p_inspiration_note
-- );

-- 3. ポイント確認テスト（実際のユーザーIDに置き換えて実行）
-- SELECT * FROM check_inspiration_points('ユーザーID');

-- 4. 投稿のインスピレーション情報確認（実際の投稿IDに置き換えて実行）
-- SELECT * FROM get_inspiration_data('投稿ID');

-- ===== 実行例（コメントアウトを外して実際のIDを入れてください） =====

-- -- Step 1: 実際のIDを確認してからコメントアウトを外す
-- DO $$
-- DECLARE
--     test_user_id UUID;
--     source_post_id UUID;
--     inspired_post_id UUID;
--     inspiration_id UUID;
-- BEGIN
--     -- 実際のユーザーIDを設定（上記のクエリ結果から取得）
--     test_user_id := 'ここに実際のユーザーIDを入力';
--     
--     -- 実際の投稿IDを設定（上記のクエリ結果から取得）
--     source_post_id := 'ここに元投稿IDを入力';
--     inspired_post_id := 'ここに新投稿IDを入力';
--     
--     -- インスピレーション作成
--     SELECT create_inspiration_simple(
--         source_post_id,
--         inspired_post_id,
--         test_user_id,
--         'direct',
--         '手動テスト用インスピレーション'
--     ) INTO inspiration_id;
--     
--     RAISE NOTICE '✅ インスピレーション作成完了: %', inspiration_id;
--     
--     -- 結果確認
--     RAISE NOTICE '📊 ポイント確認:';
--     PERFORM check_inspiration_points(test_user_id);
--     
--     RAISE NOTICE '🎨 インスピレーション情報確認:';
--     PERFORM get_inspiration_data(inspired_post_id);
-- END $$;