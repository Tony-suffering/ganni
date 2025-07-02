-- =============================================
-- インスピレーション機能デバッグSQL
-- 作成日: 2025-07-02
-- 概要: 現在の状態を確認して問題を特定する
-- =============================================

-- 1. 現在のテーブル構造確認
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('inspirations', 'point_history', 'user_points', 'user_inspiration_stats')
ORDER BY table_name, ordinal_position;

-- 2. 既存のインスピレーションデータ確認
SELECT 
    i.*,
    p_source.title as source_title,
    p_inspired.title as inspired_title
FROM inspirations i
LEFT JOIN posts p_source ON p_source.id = i.source_post_id
LEFT JOIN posts p_inspired ON p_inspired.id = i.inspired_post_id
ORDER BY i.created_at DESC
LIMIT 10;

-- 3. ポイント履歴確認（最新10件）
SELECT 
    ph.*,
    up.learning_points,
    up.influence_points,
    up.total_points
FROM point_history ph
LEFT JOIN user_points up ON up.user_id = ph.user_id
WHERE ph.source_type LIKE '%inspiration%'
ORDER BY ph.created_at DESC
LIMIT 10;

-- 4. ユーザーポイント状況確認
SELECT 
    up.*,
    uis.inspiration_given_count,
    uis.inspiration_received_count
FROM user_points up
FULL OUTER JOIN user_inspiration_stats uis ON uis.user_id = up.user_id
ORDER BY up.total_points DESC NULLS LAST
LIMIT 10;

-- 5. 関数の存在確認
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name LIKE '%inspiration%'
ORDER BY routine_name;

-- 6. 最新の投稿でインスピレーション情報があるもの
SELECT 
    p.id,
    p.title,
    p.created_at,
    i.inspiration_type,
    i.inspiration_note,
    i.chain_level
FROM posts p
LEFT JOIN inspirations i ON i.inspired_post_id = p.id
WHERE i.id IS NOT NULL
ORDER BY p.created_at DESC
LIMIT 5;

-- 7. RLS（Row Level Security）ポリシー確認
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('inspirations', 'point_history', 'user_points')
ORDER BY tablename, policyname;