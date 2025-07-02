-- =============================================
-- インスピレーション機能完全修正版
-- 作成日: 2025-07-02
-- 概要: ポイント付与とUI表示を完全に動作させる
-- =============================================

-- 1. 必要なテーブルとカラムの確認・作成
DO $$
BEGIN
    -- point_historyテーブルの構造確認とaction_type/source_type統一
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'point_history' AND column_name = 'action_type'
    ) AND NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'point_history' AND column_name = 'source_type'
    ) THEN
        -- action_typeをsource_typeにリネーム
        ALTER TABLE point_history RENAME COLUMN action_type TO source_type;
        RAISE NOTICE '✅ point_history.action_type を source_type にリネームしました';
    END IF;
    
    -- source_typeカラムが存在しない場合は追加
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'point_history' AND column_name = 'source_type'
    ) THEN
        ALTER TABLE point_history ADD COLUMN source_type VARCHAR(50);
        RAISE NOTICE '✅ point_history.source_type カラムを追加しました';
    END IF;
    
    -- source_typeの制約を更新
    ALTER TABLE point_history 
    DROP CONSTRAINT IF EXISTS point_history_source_type_check;
    
    ALTER TABLE point_history 
    ADD CONSTRAINT point_history_source_type_check 
    CHECK (source_type IN (
        'inspiration_given', 
        'inspiration_received', 
        'chain_bonus', 
        'weekly_bonus',
        'post_created',
        'post_quality_bonus',
        'post_engagement_bonus',
        'streak_bonus',
        'milestone_bonus'
    ));
END $$;

-- 2. インスピレーション完全処理関数（ポイント付与含む）
CREATE OR REPLACE FUNCTION process_inspiration_with_points(
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
    v_source_user_id UUID;
    v_given_points INTEGER := 10; -- インスピレーションを与えたときのポイント
    v_received_points INTEGER := 5; -- インスピレーションを受けたときのポイント
BEGIN
    -- 元投稿のチェーンレベルを取得
    SELECT COALESCE(MAX(chain_level), 0) INTO v_source_chain
    FROM inspirations 
    WHERE inspired_post_id = p_source_post_id;
    
    -- チェーンレベルを計算
    v_chain_level := v_source_chain + 1;
    
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
    
    -- 元投稿の作成者を取得
    SELECT user_id INTO v_source_user_id FROM posts WHERE id = p_source_post_id;
    
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
    
    -- user_pointsを更新（インスピレーションを与えた人）
    INSERT INTO user_points (user_id, influence_points)
    VALUES (p_creator_id, v_given_points)
    ON CONFLICT (user_id) 
    DO UPDATE SET
        influence_points = user_points.influence_points + v_given_points,
        updated_at = now();
    
    -- 2. インスピレーションを受けた人（元投稿者）に学習ポイント付与
    IF v_source_user_id IS NOT NULL AND v_source_user_id != p_creator_id THEN
        INSERT INTO point_history (
            user_id,
            point_type,
            points,
            source_type,
            source_id,
            description
        ) VALUES (
            v_source_user_id,
            'learning',
            v_received_points,
            'inspiration_received',
            v_inspiration_id,
            'あなたの投稿がインスピレーションを与えました'
        );
        
        -- user_pointsを更新（インスピレーションを受けた人）
        INSERT INTO user_points (user_id, learning_points)
        VALUES (v_source_user_id, v_received_points)
        ON CONFLICT (user_id) 
        DO UPDATE SET
            learning_points = user_points.learning_points + v_received_points,
            updated_at = now();
    END IF;
    
    -- ===== 統計情報の更新 =====
    
    -- 投稿統計を更新
    INSERT INTO inspiration_stats (post_id, inspiration_given_count, last_inspiration_at)
    VALUES (p_source_post_id, 1, now())
    ON CONFLICT (post_id) 
    DO UPDATE SET
        inspiration_given_count = inspiration_stats.inspiration_given_count + 1,
        last_inspiration_at = now(),
        updated_at = now();
    
    INSERT INTO inspiration_stats (post_id, inspiration_received_count)
    VALUES (p_inspired_post_id, 1)
    ON CONFLICT (post_id) 
    DO UPDATE SET
        inspiration_received_count = inspiration_stats.inspiration_received_count + 1,
        updated_at = now();
    
    -- ユーザー統計を更新（インスピレーションを受けた人）
    IF v_source_user_id IS NOT NULL THEN
        INSERT INTO user_inspiration_stats (user_id, inspiration_received_count, max_chain_level, last_inspiration_date)
        VALUES (v_source_user_id, 1, v_chain_level, CURRENT_DATE)
        ON CONFLICT (user_id) 
        DO UPDATE SET
            inspiration_received_count = user_inspiration_stats.inspiration_received_count + 1,
            max_chain_level = GREATEST(user_inspiration_stats.max_chain_level, v_chain_level),
            last_inspiration_date = CURRENT_DATE,
            updated_at = now();
    END IF;
    
    -- ユーザー統計を更新（インスピレーションを与えた人）
    INSERT INTO user_inspiration_stats (user_id, inspiration_given_count, last_inspiration_date)
    VALUES (p_creator_id, 1, CURRENT_DATE)
    ON CONFLICT (user_id) 
    DO UPDATE SET
        inspiration_given_count = user_inspiration_stats.inspiration_given_count + 1,
        last_inspiration_date = CURRENT_DATE,
        updated_at = now();
    
    -- レベル再計算（関数が存在する場合のみ）
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_user_level') THEN
        PERFORM calculate_user_level(p_creator_id);
        IF v_source_user_id IS NOT NULL AND v_source_user_id != p_creator_id THEN
            PERFORM calculate_user_level(v_source_user_id);
        END IF;
    END IF;
    
    RAISE NOTICE '✅ インスピレーション処理完了: ID=%, ポイント付与: 与えた=%, 受けた=%', 
        v_inspiration_id, v_given_points, v_received_points;
    
    RETURN v_inspiration_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 簡易インスピレーション作成関数（usePosts.tsから呼び出し用）
CREATE OR REPLACE FUNCTION create_inspiration_simple(
    p_source_post_id UUID,
    p_inspired_post_id UUID,
    p_creator_id UUID,
    p_inspiration_type TEXT,
    p_inspiration_note TEXT DEFAULT NULL
)
RETURNS UUID AS $$
BEGIN
    RETURN process_inspiration_with_points(
        p_source_post_id,
        p_inspired_post_id,
        p_creator_id,
        p_inspiration_type,
        p_inspiration_note
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. インスピレーション情報取得関数（最適化版）
CREATE OR REPLACE FUNCTION get_inspiration_data(p_post_id UUID)
RETURNS TABLE(
    source_post_id UUID,
    inspiration_type TEXT,
    inspiration_note TEXT,
    chain_level INTEGER,
    source_title TEXT,
    source_image_url TEXT,
    source_author_id UUID,
    source_author_name TEXT,
    source_author_avatar TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.source_post_id,
        i.inspiration_type,
        i.inspiration_note,
        i.chain_level,
        p.title as source_title,
        p.image_url as source_image_url,
        p.user_id as source_author_id,
        COALESCE(pr.display_name, 'ユーザー') as source_author_name,
        pr.avatar_url as source_author_avatar
    FROM inspirations i
    LEFT JOIN posts p ON p.id = i.source_post_id
    LEFT JOIN profiles pr ON pr.user_id = p.user_id
    WHERE i.inspired_post_id = p_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. ポイント確認用関数
CREATE OR REPLACE FUNCTION check_inspiration_points(p_user_id UUID)
RETURNS TABLE(
    total_learning_points INTEGER,
    total_influence_points INTEGER,
    inspiration_given_count INTEGER,
    inspiration_received_count INTEGER,
    recent_inspiration_points INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(up.learning_points, 0) as total_learning_points,
        COALESCE(up.influence_points, 0) as total_influence_points,
        COALESCE(uis.inspiration_given_count, 0) as inspiration_given_count,
        COALESCE(uis.inspiration_received_count, 0) as inspiration_received_count,
        COALESCE(
            (SELECT SUM(points) FROM point_history 
             WHERE user_id = p_user_id 
             AND source_type LIKE 'inspiration%' 
             AND created_at > now() - INTERVAL '1 day'), 
            0
        )::INTEGER as recent_inspiration_points
    FROM user_points up
    FULL OUTER JOIN user_inspiration_stats uis ON uis.user_id = up.user_id
    WHERE up.user_id = p_user_id OR uis.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. デバッグ用テスト関数
CREATE OR REPLACE FUNCTION test_inspiration_flow(
    p_source_post_id UUID,
    p_creator_id UUID
)
RETURNS TEXT AS $$
DECLARE
    v_test_post_id UUID;
    v_inspiration_id UUID;
    v_result TEXT;
BEGIN
    -- テスト用投稿を作成
    INSERT INTO posts (title, image_url, user_comment, ai_description, user_id)
    VALUES ('テスト投稿', 'https://example.com/test.jpg', 'テスト', 'AI分析', p_creator_id)
    RETURNING id INTO v_test_post_id;
    
    -- インスピレーション処理を実行
    SELECT process_inspiration_with_points(
        p_source_post_id,
        v_test_post_id,
        p_creator_id,
        'direct',
        'テスト用インスピレーション'
    ) INTO v_inspiration_id;
    
    -- 結果を確認
    SELECT format(
        'テスト完了: 投稿ID=%s, インスピレーションID=%s, ポイント履歴件数=%s',
        v_test_post_id,
        v_inspiration_id,
        (SELECT COUNT(*) FROM point_history WHERE source_id = v_inspiration_id)
    ) INTO v_result;
    
    -- テストデータを削除
    DELETE FROM inspirations WHERE id = v_inspiration_id;
    DELETE FROM posts WHERE id = v_test_post_id;
    DELETE FROM point_history WHERE source_id = v_inspiration_id;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. ランキング更新（インスピレーション含む）
SELECT update_all_rankings();

-- 完了メッセージとテスト手順
DO $$
BEGIN
    RAISE NOTICE '🎉 インスピレーション機能完全修正版が完了しました！';
    RAISE NOTICE '';
    RAISE NOTICE '📋 **次の手順で修正してください:**';
    RAISE NOTICE '1. usePosts.tsのaddPost関数を修正（下記のコード使用）';
    RAISE NOTICE '2. PostCardコンポーネントの表示確認';
    RAISE NOTICE '3. ポイント確認: SELECT * FROM check_inspiration_points(''ユーザーID'');';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 **テスト方法:**';
    RAISE NOTICE '   SELECT test_inspiration_flow(''元投稿ID'', ''ユーザーID'');';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 **修正が必要なusePosts.ts箇所:**';
    RAISE NOTICE '   - 行439-458: inspirationsテーブルの直接INSERTを関数呼び出しに変更';
END $$;