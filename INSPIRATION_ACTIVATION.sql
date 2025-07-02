-- =============================================
-- インスピレーション機能完全有効化
-- 作成日: 2025-07-02
-- 概要: インスピレーション機能を完全に動作させるSQL
-- =============================================

-- 1. インスピレーションテーブルの作成
CREATE TABLE IF NOT EXISTS inspirations (
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

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_inspirations_source_post ON inspirations(source_post_id);
CREATE INDEX IF NOT EXISTS idx_inspirations_inspired_post ON inspirations(inspired_post_id);
CREATE INDEX IF NOT EXISTS idx_inspirations_creator ON inspirations(creator_id);
CREATE INDEX IF NOT EXISTS idx_inspirations_created_at ON inspirations(created_at);

-- RLS設定
ALTER TABLE inspirations ENABLE ROW LEVEL SECURITY;

-- 全ユーザーがインスピレーションを閲覧可能
CREATE POLICY "Anyone can view inspirations" ON inspirations
    FOR SELECT USING (true);

-- ログインユーザーがインスピレーションを作成可能
CREATE POLICY "Authenticated users can create inspirations" ON inspirations
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- 作成者が自分のインスピレーションを更新可能
CREATE POLICY "Users can update own inspirations" ON inspirations
    FOR UPDATE USING (auth.uid() = creator_id);

-- 2. インスピレーション統計テーブル
CREATE TABLE IF NOT EXISTS inspiration_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL UNIQUE,
    inspiration_given_count INTEGER DEFAULT 0,
    inspiration_received_count INTEGER DEFAULT 0,
    chain_depth INTEGER DEFAULT 0,
    last_inspiration_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_inspiration_stats_post_id ON inspiration_stats(post_id);

-- RLS設定
ALTER TABLE inspiration_stats ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが統計を閲覧可能
CREATE POLICY "Anyone can view inspiration stats" ON inspiration_stats
    FOR SELECT USING (true);

-- 3. ユーザーインスピレーション統計テーブル
CREATE TABLE IF NOT EXISTS user_inspiration_stats (
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

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_user_inspiration_stats_user_id ON user_inspiration_stats(user_id);

-- RLS設定
ALTER TABLE user_inspiration_stats ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の統計のみ閲覧可能
CREATE POLICY "Users can view own inspiration stats" ON user_inspiration_stats
    FOR SELECT USING (auth.uid() = user_id);

-- 4. インスピレーション作成関数
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
    
    -- ユーザー統計を更新（インスピレーションを受けた人）
    INSERT INTO user_inspiration_stats (user_id, inspiration_received_count, max_chain_level, last_inspiration_date)
    SELECT 
        posts.user_id,
        1,
        v_chain_level,
        CURRENT_DATE
    FROM posts 
    WHERE posts.id = p_source_post_id
    ON CONFLICT (user_id) 
    DO UPDATE SET
        inspiration_received_count = user_inspiration_stats.inspiration_received_count + 1,
        max_chain_level = GREATEST(user_inspiration_stats.max_chain_level, v_chain_level),
        last_inspiration_date = CURRENT_DATE,
        updated_at = now();
    
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
    
    -- ポイント付与（インスピレーションを受けた人）
    PERFORM award_inspiration_points(
        (SELECT user_id FROM posts WHERE id = p_source_post_id),
        'inspiration_received',
        5
    );
    
    RETURN v_inspiration_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. インスピレーションポイント付与関数
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
    
    -- レベル再計算
    PERFORM calculate_user_level(p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. インスピレーション投稿完了時の処理
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

-- 7. インスピレーション検索関数
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

-- 8. 初期化処理
DO $$
BEGIN
    -- 既存の投稿に対してinspiration_statsを初期化
    INSERT INTO inspiration_stats (post_id, inspiration_given_count, inspiration_received_count)
    SELECT 
        p.id,
        0,
        0
    FROM posts p
    WHERE NOT EXISTS (
        SELECT 1 FROM inspiration_stats WHERE post_id = p.id
    );
    
    -- 既存ユーザーに対してuser_inspiration_statsを初期化
    INSERT INTO user_inspiration_stats (user_id, inspiration_given_count, inspiration_received_count)
    SELECT 
        au.id,
        0,
        0
    FROM auth.users au
    WHERE NOT EXISTS (
        SELECT 1 FROM user_inspiration_stats WHERE user_id = au.id
    );
    
    RAISE NOTICE '✅ インスピレーション機能が完全に有効化されました';
    RAISE NOTICE '🎯 使用方法:';
    RAISE NOTICE '   - SELECT create_inspiration(''投稿ID'', ''ユーザーID'', ''direct'', ''メモ'');';
    RAISE NOTICE '   - SELECT get_post_inspirations(''投稿ID'');';
    RAISE NOTICE '💡 PostCardのインスピレーションボタンから /inspiration/:postId にアクセス可能';
END $$;