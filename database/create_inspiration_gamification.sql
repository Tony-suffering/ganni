-- インスピレーション機能ゲーミフィケーション システム
-- Phase 1: ポイント・バッジシステム実装

-- ========================================
-- 1. ユーザーポイントシステム
-- ========================================

-- ユーザーポイントテーブル
CREATE TABLE IF NOT EXISTS user_points (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    learning_points INTEGER DEFAULT 0, -- 学習ポイント (LP)
    influence_points INTEGER DEFAULT 0, -- 影響力ポイント (IP)
    total_points INTEGER DEFAULT 0, -- 総合ポイント
    level INTEGER DEFAULT 1, -- ユーザーレベル
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);

-- ポイント履歴テーブル
CREATE TABLE IF NOT EXISTS point_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    point_type VARCHAR(20) NOT NULL CHECK (point_type IN ('learning', 'influence')),
    points INTEGER NOT NULL,
    action_type VARCHAR(50) NOT NULL, -- 'inspiration_created', 'inspiration_received', 'chain_bonus'
    related_post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
    related_inspiration_id UUID REFERENCES inspirations(id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ========================================
-- 2. バッジシステム
-- ========================================

-- バッジ定義テーブル
CREATE TABLE IF NOT EXISTS badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(10) NOT NULL, -- emoji
    category VARCHAR(50) NOT NULL CHECK (category IN ('learner', 'mentor', 'special')),
    requirement_type VARCHAR(50) NOT NULL, -- 'inspiration_count', 'inspired_count', 'chain_level'
    requirement_value INTEGER NOT NULL,
    rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    color VARCHAR(20) DEFAULT 'gray',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ユーザーバッジテーブル
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_displayed BOOLEAN DEFAULT true, -- プロフィールに表示するか
    UNIQUE(user_id, badge_id)
);

-- ========================================
-- 3. 統計・ランキングシステム
-- ========================================

-- ユーザー統計テーブル (既存のinspiration_statsを拡張)
CREATE TABLE IF NOT EXISTS user_inspiration_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    inspiration_given_count INTEGER DEFAULT 0, -- 与えたインスピレーション数
    inspiration_received_count INTEGER DEFAULT 0, -- 受けたインスピレーション数
    max_chain_level INTEGER DEFAULT 0, -- 最大チェーンレベル
    different_types_used INTEGER DEFAULT 0, -- 使用した異なるタイプ数
    weekly_inspiration_count INTEGER DEFAULT 0, -- 今週のインスピレーション数
    monthly_inspiration_count INTEGER DEFAULT 0, -- 今月のインスピレーション数
    last_inspiration_date DATE,
    streak_days INTEGER DEFAULT 0, -- 連続インスピレーション日数
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);

-- ========================================
-- 4. 基本バッジデータ挿入
-- ========================================

INSERT INTO badges (name, display_name, description, icon, category, requirement_type, requirement_value, rarity, color) VALUES
-- 学習者バッジ
('photography_newbie', 'フォトグラフィー新人', '5回インスピレーションを受けて投稿した新人クリエイター', '🔰', 'learner', 'inspiration_count', 5, 'common', 'green'),
('active_learner', '積極的学習者', '20回インスピレーションを受けて継続学習している', '📸', 'learner', 'inspiration_count', 20, 'rare', 'blue'),
('diversity_explorer', '多様性探究者', '6つ全タイプでインスピレーションを受けた探究者', '🎨', 'learner', 'different_types_used', 6, 'epic', 'purple'),

-- メンターバッジ
('inspiration_starter', 'インスピレーション・スターター', '10回他の人にインスピレーションを与えた', '💡', 'mentor', 'inspired_count', 10, 'common', 'yellow'),
('community_mentor', 'コミュニティ・メンター', '50回他の人にインスピレーションを与えたメンター', '👑', 'mentor', 'inspired_count', 50, 'epic', 'gold'),
('legend_creator', 'レジェンド・クリエイター', '100回他の人にインスピレーションを与えた伝説的存在', '🌟', 'mentor', 'inspired_count', 100, 'legendary', 'rainbow'),

-- 特別バッジ
('chain_builder', 'チェーン・ビルダー', 'レベル5以上のインスピレーション・チェーンを作成', '🔗', 'special', 'chain_level', 5, 'rare', 'orange'),
('weekly_champion', '週間チャンピオン', '1週間で10回以上インスピレーションを与えた', '🏆', 'special', 'weekly_inspiration_count', 10, 'epic', 'red')
ON CONFLICT (name) DO NOTHING;

-- ========================================
-- 5. 自動更新トリガー・関数
-- ========================================

-- ポイント計算関数
CREATE OR REPLACE FUNCTION calculate_user_level(total_points INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN CASE 
        WHEN total_points < 100 THEN 1
        WHEN total_points < 250 THEN 2
        WHEN total_points < 500 THEN 3
        WHEN total_points < 1000 THEN 4
        WHEN total_points < 2000 THEN 5
        WHEN total_points < 4000 THEN 6
        WHEN total_points < 8000 THEN 7
        WHEN total_points < 15000 THEN 8
        WHEN total_points < 25000 THEN 9
        ELSE 10
    END;
END;
$$ LANGUAGE plpgsql;

-- ポイント更新関数
CREATE OR REPLACE FUNCTION update_user_points(
    p_user_id UUID,
    p_point_type VARCHAR(20),
    p_points INTEGER,
    p_action_type VARCHAR(50),
    p_related_post_id UUID DEFAULT NULL,
    p_related_inspiration_id UUID DEFAULT NULL,
    p_description TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_new_total INTEGER;
BEGIN
    -- ポイント履歴を記録
    INSERT INTO point_history (user_id, point_type, points, action_type, related_post_id, related_inspiration_id, description)
    VALUES (p_user_id, p_point_type, p_points, p_action_type, p_related_post_id, p_related_inspiration_id, p_description);
    
    -- ユーザーポイントを更新（存在しない場合は作成）
    INSERT INTO user_points (user_id, learning_points, influence_points, total_points, level)
    VALUES (
        p_user_id,
        CASE WHEN p_point_type = 'learning' THEN p_points ELSE 0 END,
        CASE WHEN p_point_type = 'influence' THEN p_points ELSE 0 END,
        p_points,
        calculate_user_level(p_points)
    )
    ON CONFLICT (user_id) DO UPDATE SET
        learning_points = user_points.learning_points + CASE WHEN p_point_type = 'learning' THEN p_points ELSE 0 END,
        influence_points = user_points.influence_points + CASE WHEN p_point_type = 'influence' THEN p_points ELSE 0 END,
        total_points = user_points.total_points + p_points,
        level = calculate_user_level(user_points.total_points + p_points),
        updated_at = now();
        
    -- 新しい総ポイントを取得
    SELECT total_points INTO v_new_total FROM user_points WHERE user_id = p_user_id;
    
    -- バッジチェック関数を呼び出し
    PERFORM check_and_award_badges(p_user_id);
END;
$$ LANGUAGE plpgsql;

-- バッジチェック・授与関数
CREATE OR REPLACE FUNCTION check_and_award_badges(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    r_badge RECORD;
    v_user_stats RECORD;
BEGIN
    -- ユーザー統計を取得
    SELECT 
        COALESCE(inspiration_given_count, 0) as inspiration_count,
        COALESCE(inspiration_received_count, 0) as inspired_count,
        COALESCE(max_chain_level, 0) as chain_level,
        COALESCE(different_types_used, 0) as different_types_used,
        COALESCE(weekly_inspiration_count, 0) as weekly_inspiration_count
    INTO v_user_stats
    FROM user_inspiration_stats 
    WHERE user_id = p_user_id;
    
    -- 統計が存在しない場合は作成
    IF NOT FOUND THEN
        INSERT INTO user_inspiration_stats (user_id) VALUES (p_user_id);
        RETURN;
    END IF;
    
    -- 各バッジの条件をチェック
    FOR r_badge IN 
        SELECT * FROM badges 
        WHERE is_active = true 
        AND id NOT IN (SELECT badge_id FROM user_badges WHERE user_id = p_user_id)
    LOOP
        CASE r_badge.requirement_type
            WHEN 'inspiration_count' THEN
                IF v_user_stats.inspiration_count >= r_badge.requirement_value THEN
                    INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, r_badge.id);
                END IF;
            WHEN 'inspired_count' THEN
                IF v_user_stats.inspired_count >= r_badge.requirement_value THEN
                    INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, r_badge.id);
                END IF;
            WHEN 'chain_level' THEN
                IF v_user_stats.chain_level >= r_badge.requirement_value THEN
                    INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, r_badge.id);
                END IF;
            WHEN 'different_types_used' THEN
                IF v_user_stats.different_types_used >= r_badge.requirement_value THEN
                    INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, r_badge.id);
                END IF;
            WHEN 'weekly_inspiration_count' THEN
                IF v_user_stats.weekly_inspiration_count >= r_badge.requirement_value THEN
                    INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, r_badge.id);
                END IF;
        END CASE;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- インスピレーション作成時のトリガー関数
CREATE OR REPLACE FUNCTION on_inspiration_created()
RETURNS TRIGGER AS $$
DECLARE
    v_source_author_id UUID;
BEGIN
    -- 元投稿の作者IDを取得
    SELECT author_id INTO v_source_author_id FROM posts WHERE id = NEW.source_post_id;
    
    -- インスピレーションを受けた側（作成者）にポイント付与
    PERFORM update_user_points(
        NEW.creator_id,
        'learning',
        10,
        'inspiration_created',
        NEW.inspired_post_id,
        NEW.id,
        'インスピレーションを受けて投稿を作成'
    );
    
    -- インスピレーションを与えた側（元作者）にポイント付与
    IF v_source_author_id IS NOT NULL THEN
        PERFORM update_user_points(
            v_source_author_id,
            'influence',
            20,
            'inspiration_received',
            NEW.source_post_id,
            NEW.id,
            'あなたの投稿が他の人にインスピレーションを与えました'
        );
    END IF;
    
    -- 統計を更新
    PERFORM update_inspiration_stats(NEW.creator_id, NEW.source_post_id, NEW.inspiration_type, NEW.chain_level);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 統計更新関数
CREATE OR REPLACE FUNCTION update_inspiration_stats(
    p_creator_id UUID,
    p_source_post_id UUID,
    p_inspiration_type VARCHAR(50),
    p_chain_level INTEGER
)
RETURNS VOID AS $$
DECLARE
    v_source_author_id UUID;
    v_type_count INTEGER;
BEGIN
    -- 元投稿の作者IDを取得
    SELECT author_id INTO v_source_author_id FROM posts WHERE id = p_source_post_id;
    
    -- インスピレーションを受けた側の統計更新
    INSERT INTO user_inspiration_stats (
        user_id, inspiration_given_count, max_chain_level, different_types_used,
        weekly_inspiration_count, monthly_inspiration_count, last_inspiration_date, streak_days
    )
    VALUES (p_creator_id, 1, p_chain_level, 1, 1, 1, CURRENT_DATE, 1)
    ON CONFLICT (user_id) DO UPDATE SET
        inspiration_given_count = user_inspiration_stats.inspiration_given_count + 1,
        max_chain_level = GREATEST(user_inspiration_stats.max_chain_level, p_chain_level),
        weekly_inspiration_count = user_inspiration_stats.weekly_inspiration_count + 1,
        monthly_inspiration_count = user_inspiration_stats.monthly_inspiration_count + 1,
        last_inspiration_date = CURRENT_DATE,
        updated_at = now();
    
    -- 使用したタイプ数を更新
    SELECT COUNT(DISTINCT inspiration_type) INTO v_type_count
    FROM inspirations 
    WHERE creator_id = p_creator_id;
    
    UPDATE user_inspiration_stats 
    SET different_types_used = v_type_count
    WHERE user_id = p_creator_id;
    
    -- インスピレーションを与えた側の統計更新
    IF v_source_author_id IS NOT NULL THEN
        INSERT INTO user_inspiration_stats (user_id, inspiration_received_count)
        VALUES (v_source_author_id, 1)
        ON CONFLICT (user_id) DO UPDATE SET
            inspiration_received_count = user_inspiration_stats.inspiration_received_count + 1,
            updated_at = now();
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 6. トリガー設定
-- ========================================

-- インスピレーション作成時のトリガー
DROP TRIGGER IF EXISTS trigger_inspiration_created ON inspirations;
CREATE TRIGGER trigger_inspiration_created
    AFTER INSERT ON inspirations
    FOR EACH ROW
    EXECUTE FUNCTION on_inspiration_created();

-- ========================================
-- 7. RLS (Row Level Security) 設定
-- ========================================

-- user_points テーブル
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own points" ON user_points FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own points" ON user_points FOR UPDATE USING (auth.uid() = user_id);

-- point_history テーブル
ALTER TABLE point_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own point history" ON point_history FOR SELECT USING (auth.uid() = user_id);

-- badges テーブル（全員が閲覧可能）
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view badges" ON badges FOR SELECT USING (true);

-- user_badges テーブル
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own badges" ON user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own badge display" ON user_badges FOR UPDATE USING (auth.uid() = user_id);

-- user_inspiration_stats テーブル
ALTER TABLE user_inspiration_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own stats" ON user_inspiration_stats FOR SELECT USING (auth.uid() = user_id);

-- ========================================
-- 8. インデックス作成
-- ========================================

CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_total_points ON user_points(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_point_history_user_id ON point_history(user_id);
CREATE INDEX IF NOT EXISTS idx_point_history_created_at ON point_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_inspiration_stats_user_id ON user_inspiration_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_inspiration_stats_received_count ON user_inspiration_stats(inspiration_received_count DESC);
CREATE INDEX IF NOT EXISTS idx_user_inspiration_stats_given_count ON user_inspiration_stats(inspiration_given_count DESC);

-- ========================================
-- 9. 初期化関数（既存ユーザー用）
-- ========================================

-- 既存ユーザーの統計とポイントを初期化する関数
CREATE OR REPLACE FUNCTION initialize_existing_users()
RETURNS VOID AS $$
DECLARE
    r_user RECORD;
    v_inspiration_count INTEGER;
    v_inspired_count INTEGER;
BEGIN
    -- 既存の全ユーザーに対して処理
    FOR r_user IN 
        SELECT DISTINCT author_id as user_id FROM posts 
        UNION 
        SELECT DISTINCT creator_id as user_id FROM inspirations
    LOOP
        -- インスピレーション数を計算
        SELECT COUNT(*) INTO v_inspiration_count 
        FROM inspirations 
        WHERE creator_id = r_user.user_id;
        
        -- インスパイアされた数を計算
        SELECT COUNT(*) INTO v_inspired_count
        FROM inspirations i
        JOIN posts p ON i.source_post_id = p.id
        WHERE p.author_id = r_user.user_id;
        
        -- ポイントとして記録
        IF v_inspiration_count > 0 THEN
            PERFORM update_user_points(
                r_user.user_id,
                'learning',
                v_inspiration_count * 10,
                'initial_calculation',
                NULL,
                NULL,
                '既存データからの初期ポイント計算'
            );
        END IF;
        
        IF v_inspired_count > 0 THEN
            PERFORM update_user_points(
                r_user.user_id,
                'influence',
                v_inspired_count * 20,
                'initial_calculation',
                NULL,
                NULL,
                '既存データからの初期ポイント計算'
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 初期化実行（コメントアウト - 手動実行用）
-- SELECT initialize_existing_users();