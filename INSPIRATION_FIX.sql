-- =============================================
-- インスピレーション機能修正版（既存環境対応）
-- 作成日: 2025-07-02
-- 概要: 既存のテーブル構造を確認して不足分のみ追加
-- =============================================

-- 1. 既存テーブルの確認と必要に応じた修正
DO $$
BEGIN
    -- inspirations テーブルが存在するかチェック
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'inspirations') THEN
        RAISE NOTICE '✅ inspirations テーブルは既に存在します';
        
        -- 不足しているカラムがあれば追加
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'inspirations' AND column_name = 'chain_level'
        ) THEN
            ALTER TABLE inspirations ADD COLUMN chain_level INTEGER DEFAULT 1;
            RAISE NOTICE '✅ chain_level カラムを追加しました';
        END IF;
        
    ELSE
        -- テーブルが存在しない場合は作成
        CREATE TABLE inspirations (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            source_post_id UUID NOT NULL,
            inspired_post_id UUID,
            creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            inspiration_type VARCHAR(50) NOT NULL CHECK (inspiration_type IN ('direct', 'style', 'concept', 'technique', 'composition', 'mood')),
            inspiration_note TEXT,
            chain_level INTEGER DEFAULT 1,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        CREATE INDEX idx_inspirations_source_post ON inspirations(source_post_id);
        CREATE INDEX idx_inspirations_inspired_post ON inspirations(inspired_post_id);
        CREATE INDEX idx_inspirations_creator ON inspirations(creator_id);
        
        ALTER TABLE inspirations ENABLE ROW LEVEL SECURITY;
        
        RAISE NOTICE '✅ inspirations テーブルを作成しました';
    END IF;
END $$;

-- 2. inspiration_stats テーブルの確認と作成
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'inspiration_stats') THEN
        CREATE TABLE inspiration_stats (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            post_id UUID NOT NULL UNIQUE,
            inspiration_given_count INTEGER DEFAULT 0,
            inspiration_received_count INTEGER DEFAULT 0,
            chain_depth INTEGER DEFAULT 0,
            last_inspiration_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        CREATE INDEX idx_inspiration_stats_post_id ON inspiration_stats(post_id);
        
        ALTER TABLE inspiration_stats ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Anyone can view inspiration stats" ON inspiration_stats
            FOR SELECT USING (true);
            
        RAISE NOTICE '✅ inspiration_stats テーブルを作成しました';
    ELSE
        RAISE NOTICE '✅ inspiration_stats テーブルは既に存在します';
    END IF;
END $$;

-- 3. user_inspiration_stats テーブルの確認（既に作成済みの場合はスキップ）
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_inspiration_stats') THEN
        CREATE TABLE user_inspiration_stats (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
            inspiration_given_count INTEGER DEFAULT 0,
            inspiration_received_count INTEGER DEFAULT 0,
            max_chain_level INTEGER DEFAULT 0,
            streak_days INTEGER DEFAULT 0,
            last_inspiration_date DATE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        CREATE INDEX idx_user_inspiration_stats_user_id ON user_inspiration_stats(user_id);
        ALTER TABLE user_inspiration_stats ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can view own inspiration stats" ON user_inspiration_stats
            FOR SELECT USING (auth.uid() = user_id);
            
        RAISE NOTICE '✅ user_inspiration_stats テーブルを作成しました';
    ELSE
        RAISE NOTICE '✅ user_inspiration_stats テーブルは既に存在します';
    END IF;
END $$;

-- 4. 不足しているポリシーのみ作成
DO $$
BEGIN
    -- inspirations テーブルのポリシーチェック
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'inspirations' AND policyname = 'Authenticated users can create inspirations'
    ) THEN
        CREATE POLICY "Authenticated users can create inspirations" ON inspirations
            FOR INSERT WITH CHECK (auth.uid() = creator_id);
        RAISE NOTICE '✅ インスピレーション作成ポリシーを追加しました';
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'inspirations' AND policyname = 'Users can update own inspirations'
    ) THEN
        CREATE POLICY "Users can update own inspirations" ON inspirations
            FOR UPDATE USING (auth.uid() = creator_id);
        RAISE NOTICE '✅ インスピレーション更新ポリシーを追加しました';
    END IF;
END $$;

-- 5. インスピレーション作成関数（REPLACE）
CREATE OR REPLACE FUNCTION create_inspiration(
    p_source_post_id UUID,
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
        creator_id,
        inspiration_type,
        inspiration_note,
        chain_level
    ) VALUES (
        p_source_post_id,
        p_creator_id,
        p_inspiration_type,
        p_inspiration_note,
        v_chain_level
    ) RETURNING id INTO v_inspiration_id;
    
    -- 投稿統計を更新
    INSERT INTO inspiration_stats (post_id, inspiration_given_count, last_inspiration_at)
    VALUES (p_source_post_id, 1, now())
    ON CONFLICT (post_id) 
    DO UPDATE SET
        inspiration_given_count = inspiration_stats.inspiration_given_count + 1,
        last_inspiration_at = now(),
        updated_at = now();
    
    -- 元投稿の作成者を取得
    SELECT user_id INTO v_source_user_id FROM posts WHERE id = p_source_post_id;
    
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
        
        -- ポイント付与（インスピレーションを受けた人）
        PERFORM award_inspiration_points(v_source_user_id, 'inspiration_received', 5);
    END IF;
    
    -- ユーザー統計を更新（インスピレーションを与えた人）
    INSERT INTO user_inspiration_stats (user_id, inspiration_given_count, last_inspiration_date)
    VALUES (p_creator_id, 1, CURRENT_DATE)
    ON CONFLICT (user_id) 
    DO UPDATE SET
        inspiration_given_count = user_inspiration_stats.inspiration_given_count + 1,
        last_inspiration_date = CURRENT_DATE,
        updated_at = now();
    
    -- ポイント付与（インスピレーションを与えた人）
    PERFORM award_inspiration_points(p_creator_id, 'inspiration_given', 10);
    
    RETURN v_inspiration_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. インスピレーションポイント付与関数（REPLACE）
CREATE OR REPLACE FUNCTION award_inspiration_points(
    p_user_id UUID,
    p_point_type TEXT,
    p_points INTEGER
)
RETURNS VOID AS $$
DECLARE
    v_point_category TEXT;
BEGIN
    -- ポイント種別を決定
    v_point_category := CASE 
        WHEN p_point_type = 'inspiration_given' THEN 'influence'
        WHEN p_point_type = 'inspiration_received' THEN 'learning'
        ELSE 'learning'
    END;
    
    -- ポイント履歴に記録
    INSERT INTO point_history (
        user_id,
        point_type,
        points,
        source_type,
        description
    ) VALUES (
        p_user_id,
        v_point_category,
        p_points,
        p_point_type,
        CASE p_point_type
            WHEN 'inspiration_given' THEN 'インスピレーションを与えました'
            WHEN 'inspiration_received' THEN 'インスピレーションを受けました'
            ELSE 'インスピレーション活動'
        END
    );
    
    -- ユーザーポイントを更新
    IF v_point_category = 'learning' THEN
        INSERT INTO user_points (user_id, learning_points)
        VALUES (p_user_id, p_points)
        ON CONFLICT (user_id) 
        DO UPDATE SET
            learning_points = user_points.learning_points + p_points,
            updated_at = now();
    ELSE
        INSERT INTO user_points (user_id, influence_points)
        VALUES (p_user_id, p_points)
        ON CONFLICT (user_id) 
        DO UPDATE SET
            influence_points = user_points.influence_points + p_points,
            updated_at = now();
    END IF;
    
    -- レベル再計算（関数が存在する場合のみ）
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_user_level') THEN
        PERFORM calculate_user_level(p_user_id);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. インスピレーション検索関数（REPLACE）
CREATE OR REPLACE FUNCTION get_post_inspirations(p_post_id UUID)
RETURNS TABLE(
    id UUID,
    source_post_id UUID,
    inspired_post_id UUID,
    creator_id UUID,
    inspiration_type TEXT,
    inspiration_note TEXT,
    chain_level INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    creator_name TEXT,
    creator_avatar TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.source_post_id,
        i.inspired_post_id,
        i.creator_id,
        i.inspiration_type,
        i.inspiration_note,
        i.chain_level,
        i.created_at,
        COALESCE(p.display_name, 'ユーザー') as creator_name,
        p.avatar_url as creator_avatar
    FROM inspirations i
    LEFT JOIN profiles p ON p.user_id = i.creator_id
    WHERE i.source_post_id = p_post_id
    ORDER BY i.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 投稿完了時の処理（REPLACE）
CREATE OR REPLACE FUNCTION complete_inspiration_with_post(
    p_inspiration_id UUID,
    p_inspired_post_id UUID
)
RETURNS VOID AS $$
BEGIN
    -- インスピレーション記録を更新
    UPDATE inspirations 
    SET 
        inspired_post_id = p_inspired_post_id,
        updated_at = now()
    WHERE id = p_inspiration_id;
    
    -- 投稿統計を更新
    INSERT INTO inspiration_stats (post_id, inspiration_received_count)
    VALUES (p_inspired_post_id, 1)
    ON CONFLICT (post_id) 
    DO UPDATE SET
        inspiration_received_count = inspiration_stats.inspiration_received_count + 1,
        updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. 簡易インスピレーションテスト関数
CREATE OR REPLACE FUNCTION test_inspiration_system()
RETURNS TEXT AS $$
BEGIN
    RETURN '🎯 インスピレーション機能のテスト用関数:
    
    1. インスピレーション作成:
       SELECT create_inspiration(''投稿ID'', ''ユーザーID'', ''direct'', ''テストメモ'');
    
    2. インスピレーション確認:
       SELECT * FROM get_post_inspirations(''投稿ID'');
    
    3. 統計確認:
       SELECT * FROM inspiration_stats WHERE post_id = ''投稿ID'';
       SELECT * FROM user_inspiration_stats WHERE user_id = ''ユーザーID'';
    
    4. ポイント確認:
       SELECT * FROM point_history WHERE user_id = ''ユーザーID'' AND source_type LIKE ''inspiration%'';';
END;
$$ LANGUAGE plpgsql;

-- 完了メッセージ
DO $$
BEGIN
    RAISE NOTICE '🎉 インスピレーション機能修正版のセットアップが完了しました';
    RAISE NOTICE '🧪 テスト用関数: SELECT test_inspiration_system();';
    RAISE NOTICE '💡 PostCardの💡ボタンから /inspiration/:postId にアクセス可能';
    RAISE NOTICE '📊 ランキング更新: SELECT update_all_rankings();';
END $$;