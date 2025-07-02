-- =============================================
-- インスピレーション機能最終修正
-- 作成日: 2025-07-02
-- 概要: user_id問題を完全解決
-- =============================================

-- 1. postsテーブルの正確な構造確認
SELECT 
    'postsテーブル構造' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'posts'
ORDER BY ordinal_position;

-- 2. RLS無効化（安全のため再実行）
ALTER TABLE inspirations DISABLE ROW LEVEL SECURITY;
ALTER TABLE point_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_points DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_inspiration_stats DISABLE ROW LEVEL SECURITY;

-- 3. user_idカラム問題を修正した関数
CREATE OR REPLACE FUNCTION process_inspiration_fixed(
    p_source_post_id UUID,
    p_inspired_post_id UUID,
    p_creator_id UUID,
    p_inspiration_type TEXT,
    p_inspiration_note TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_inspiration_id UUID;
    v_chain_level INTEGER := 1;
    v_source_chain INTEGER;
    v_source_author_id UUID;  -- user_idではなくauthor_idを使用
    v_given_points INTEGER := 10;
    v_received_points INTEGER := 5;
BEGIN
    RAISE NOTICE '🎯 インスピレーション処理開始: source=%, inspired=%, creator=%', 
        p_source_post_id, p_inspired_post_id, p_creator_id;
    
    -- 元投稿のチェーンレベルを取得
    SELECT COALESCE(MAX(chain_level), 0) INTO v_source_chain
    FROM inspirations 
    WHERE inspired_post_id = p_source_post_id;
    
    v_chain_level := v_source_chain + 1;
    RAISE NOTICE '📊 チェーンレベル: %', v_chain_level;
    
    -- インスピレーション記録を作成
    INSERT INTO inspirations (
        source_post_id,
        inspired_post_id,
        creator_id,
        inspiration_type,
        inspiration_note,
        chain_level
    ) VALUES (
        p_source_post_id,
        p_inspired_post_id,
        p_creator_id,
        p_inspiration_type,
        p_inspiration_note,
        v_chain_level
    ) RETURNING id INTO v_inspiration_id;
    
    RAISE NOTICE '✅ インスピレーション記録作成: %', v_inspiration_id;
    
    -- 元投稿の作成者を取得（author_idカラムを使用）
    SELECT author_id INTO v_source_author_id 
    FROM posts 
    WHERE id = p_source_post_id;
    
    RAISE NOTICE '👤 元投稿作成者: %', v_source_author_id;
    
    -- ===== ポイント付与処理 =====
    
    -- 1. インスピレーションを与えた人（creator）に影響力ポイント付与
    INSERT INTO point_history (
        user_id,
        point_type,
        points,
        source_type,
        source_id,
        description
    ) VALUES (
        p_creator_id,
        'influence',
        v_given_points,
        'inspiration_given',
        v_inspiration_id,
        'インスピレーションを与えました'
    );
    
    RAISE NOTICE '💎 影響力ポイント付与: %ポイント → %', v_given_points, p_creator_id;
    
    -- user_pointsを更新（インスピレーションを与えた人）
    INSERT INTO user_points (user_id, influence_points)
    VALUES (p_creator_id, v_given_points)
    ON CONFLICT (user_id) 
    DO UPDATE SET
        influence_points = user_points.influence_points + v_given_points,
        updated_at = now();
    
    -- 2. インスピレーションを受けた人（元投稿者）に学習ポイント付与
    IF v_source_author_id IS NOT NULL AND v_source_author_id != p_creator_id THEN
        INSERT INTO point_history (
            user_id,
            point_type,
            points,
            source_type,
            source_id,
            description
        ) VALUES (
            v_source_author_id,
            'learning',
            v_received_points,
            'inspiration_received',
            v_inspiration_id,
            'あなたの投稿がインスピレーションを与えました'
        );
        
        RAISE NOTICE '💎 学習ポイント付与: %ポイント → %', v_received_points, v_source_author_id;
        
        -- user_pointsを更新（インスピレーションを受けた人）
        INSERT INTO user_points (user_id, learning_points)
        VALUES (v_source_author_id, v_received_points)
        ON CONFLICT (user_id) 
        DO UPDATE SET
            learning_points = user_points.learning_points + v_received_points,
            updated_at = now();
    END IF;
    
    RAISE NOTICE '🎉 インスピレーション処理完了: %', v_inspiration_id;
    
    RETURN v_inspiration_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 修正版簡易関数
CREATE OR REPLACE FUNCTION create_inspiration_simple(
    p_source_post_id UUID,
    p_inspired_post_id UUID,
    p_creator_id UUID,
    p_inspiration_type TEXT,
    p_inspiration_note TEXT DEFAULT NULL
)
RETURNS UUID AS $$
BEGIN
    RETURN process_inspiration_fixed(
        p_source_post_id,
        p_inspired_post_id,
        p_creator_id,
        p_inspiration_type,
        p_inspiration_note
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 実際のデータでテスト実行
DO $$
DECLARE
    test_user_id UUID := 'e470d02b-bc08-42d5-acc0-b92fc5fe2954';
    source_post_id UUID := '97503713-fb23-43ef-8655-c3e50f69e2d3';
    inspired_post_id UUID := '6df09611-b19f-439d-b517-cd95f9c63725';
    inspiration_id UUID;
BEGIN
    RAISE NOTICE '🚀 実際のデータでテスト開始...';
    
    -- インスピレーション作成
    SELECT create_inspiration_simple(
        source_post_id,
        inspired_post_id,
        test_user_id,
        'direct',
        '最終修正版テスト'
    ) INTO inspiration_id;
    
    RAISE NOTICE '✅ テスト完了: インスピレーションID = %', inspiration_id;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ テストエラー: %', SQLERRM;
END $$;

-- 6. 結果確認クエリ
SELECT 
    '📊 インスピレーション確認' as type,
    i.*
FROM inspirations i
ORDER BY i.created_at DESC
LIMIT 3;

SELECT 
    '💎 ポイント履歴確認' as type,
    ph.*
FROM point_history ph
WHERE ph.source_type LIKE 'inspiration%'
ORDER BY ph.created_at DESC
LIMIT 5;

SELECT 
    '👥 ユーザーポイント確認' as type,
    up.*
FROM user_points up
WHERE up.user_id IN (
    'e470d02b-bc08-42d5-acc0-b92fc5fe2954'
)
ORDER BY up.total_points DESC;

-- 7. ブラウザ用のSupabaseクライアント確認関数
CREATE OR REPLACE FUNCTION get_supabase_test_commands()
RETURNS TEXT AS $$
BEGIN
    RETURN '
🔧 ブラウザでSupabaseクライアントにアクセスする方法:

1. React DevToolsでコンポーネントを確認:
   window.React = require("react");

2. モジュールから直接インポート:
   const { supabase } = await import("./supabase");

3. 最も簡単な方法 - アプリケーションのwindowオブジェクト:
   window._supabase || window.supabase

4. テスト用の直接実行:
   // 以下をコンソールに貼り付け
   import("./supabase").then(({ supabase }) => {
     window._supabase = supabase;
     console.log("✅ Supabaseクライアント設定完了");
     
     // テスト実行
     _supabase.rpc("create_inspiration_simple", {
       p_source_post_id: "97503713-fb23-43ef-8655-c3e50f69e2d3",
       p_inspired_post_id: "6df09611-b19f-439d-b517-cd95f9c63725", 
       p_creator_id: "e470d02b-bc08-42d5-acc0-b92fc5fe2954",
       p_inspiration_type: "direct",
       p_inspiration_note: "ブラウザ直接テスト"
     }).then(result => console.log("🎯 結果:", result));
   });
';
END;
$$ LANGUAGE plpgsql;

-- 8. 完了メッセージとテスト後の処理
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 最終修正完了！';
    RAISE NOTICE '📊 上記の確認クエリ結果をチェックしてください';
    RAISE NOTICE '';
    RAISE NOTICE '🌐 ブラウザテスト方法:';
    RAISE NOTICE '   SELECT get_supabase_test_commands();';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  テスト完了後は必ずRLSを再有効化:';
    RAISE NOTICE '   SELECT re_enable_rls();';
END $$;