-- =============================================
-- 投稿ボーナスシステム実装
-- 作成日: 2025-07-02
-- 概要: 投稿に対するボーナスポイントシステムを追加
-- =============================================

-- 1. point_history テーブルの source_type を拡張
ALTER TABLE point_history 
DROP CONSTRAINT IF EXISTS point_history_source_type_check;

ALTER TABLE point_history 
ADD CONSTRAINT point_history_source_type_check 
CHECK (source_type IN (
  'inspiration_given', 
  'inspiration_received', 
  'chain_bonus', 
  'weekly_bonus',
  'post_created',           -- 基本投稿ボーナス
  'post_quality_bonus',     -- 品質ボーナス (AI写真スコア基準)
  'post_engagement_bonus',  -- エンゲージメントボーナス (いいね・コメント)
  'streak_bonus',           -- 連続投稿ボーナス
  'milestone_bonus'         -- マイルストーンボーナス (投稿数記念)
));

-- 2. 投稿ボーナス記録テーブル
CREATE TABLE post_bonuses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- ボーナス種別
    base_bonus INTEGER DEFAULT 5,           -- 基本投稿ボーナス
    quality_bonus INTEGER DEFAULT 0,       -- 品質ボーナス (AI写真スコア基準)
    engagement_bonus INTEGER DEFAULT 0,    -- エンゲージメントボーナス
    streak_bonus INTEGER DEFAULT 0,        -- 連続投稿ボーナス
    milestone_bonus INTEGER DEFAULT 0,     -- マイルストーンボーナス
    
    -- 合計ボーナス
    total_bonus INTEGER GENERATED ALWAYS AS (
        base_bonus + quality_bonus + engagement_bonus + streak_bonus + milestone_bonus
    ) STORED,
    
    -- メタデータ
    photo_score INTEGER,                    -- 投稿時のAI写真スコア
    post_count_at_time INTEGER,            -- 投稿時点での総投稿数
    streak_days INTEGER DEFAULT 0,         -- 投稿時点での連続投稿日数
    
    -- タイムスタンプ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- インデックス作成
CREATE INDEX idx_post_bonuses_user_id ON post_bonuses(user_id);
CREATE INDEX idx_post_bonuses_post_id ON post_bonuses(post_id);
CREATE INDEX idx_post_bonuses_created_at ON post_bonuses(created_at);

-- RLS (Row Level Security) 設定
ALTER TABLE post_bonuses ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のボーナス記録のみ閲覧可能
CREATE POLICY "Users can view own post bonuses" ON post_bonuses
    FOR SELECT USING (auth.uid() = user_id);

-- ユーザーは自分のボーナス記録のみ更新可能（システムが自動更新）
CREATE POLICY "Users can update own post bonuses" ON post_bonuses
    FOR UPDATE USING (auth.uid() = user_id);

-- 3. ユーザー投稿統計テーブル (連続投稿追跡用)
CREATE TABLE user_post_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- 投稿統計
    total_posts INTEGER DEFAULT 0,
    posts_this_week INTEGER DEFAULT 0,
    posts_this_month INTEGER DEFAULT 0,
    
    -- 連続投稿統計
    current_streak_days INTEGER DEFAULT 0,
    longest_streak_days INTEGER DEFAULT 0,
    last_post_date DATE,
    
    -- 品質統計
    average_photo_score DECIMAL(5,2) DEFAULT 0,
    highest_photo_score INTEGER DEFAULT 0,
    
    -- エンゲージメント統計
    total_likes_received INTEGER DEFAULT 0,
    total_comments_received INTEGER DEFAULT 0,
    total_bookmarks_received INTEGER DEFAULT 0,
    
    -- タイムスタンプ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- インデックス作成
CREATE INDEX idx_user_post_stats_user_id ON user_post_stats(user_id);

-- RLS設定
ALTER TABLE user_post_stats ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の統計のみ閲覧可能
CREATE POLICY "Users can view own post stats" ON user_post_stats
    FOR SELECT USING (auth.uid() = user_id);

-- 4. 投稿ボーナス計算関数
CREATE OR REPLACE FUNCTION calculate_post_bonus(
    p_post_id UUID,
    p_user_id UUID,
    p_photo_score INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_base_bonus INTEGER := 5;
    v_quality_bonus INTEGER := 0;
    v_streak_bonus INTEGER := 0;
    v_milestone_bonus INTEGER := 0;
    v_total_bonus INTEGER;
    v_post_count INTEGER;
    v_streak_days INTEGER;
    v_last_post_date DATE;
    v_today DATE := CURRENT_DATE;
BEGIN
    -- ユーザーの投稿統計を取得または初期化
    INSERT INTO user_post_stats (user_id) 
    VALUES (p_user_id) 
    ON CONFLICT (user_id) DO NOTHING;
    
    SELECT total_posts, current_streak_days, last_post_date
    INTO v_post_count, v_streak_days, v_last_post_date
    FROM user_post_stats 
    WHERE user_id = p_user_id;
    
    -- 投稿数を更新
    v_post_count := v_post_count + 1;
    
    -- 連続投稿日数の更新
    IF v_last_post_date IS NULL THEN
        v_streak_days := 1;
    ELSIF v_last_post_date = v_today THEN
        -- 同日投稿の場合、ストリークは維持
        v_streak_days := v_streak_days;
    ELSIF v_last_post_date = v_today - INTERVAL '1 day' THEN
        -- 前日に投稿していた場合、ストリーク継続
        v_streak_days := v_streak_days + 1;
    ELSE
        -- ストリーク切れ
        v_streak_days := 1;
    END IF;
    
    -- 品質ボーナス計算 (AI写真スコア基準)
    IF p_photo_score IS NOT NULL THEN
        CASE 
            WHEN p_photo_score >= 90 THEN v_quality_bonus := 30;
            WHEN p_photo_score >= 80 THEN v_quality_bonus := 20;
            WHEN p_photo_score >= 70 THEN v_quality_bonus := 10;
            WHEN p_photo_score >= 60 THEN v_quality_bonus := 5;
            ELSE v_quality_bonus := 0;
        END CASE;
    END IF;
    
    -- 連続投稿ボーナス計算
    CASE 
        WHEN v_streak_days >= 30 THEN v_streak_bonus := 50;
        WHEN v_streak_days >= 14 THEN v_streak_bonus := 25;
        WHEN v_streak_days >= 7 THEN v_streak_bonus := 15;
        WHEN v_streak_days >= 3 THEN v_streak_bonus := 10;
        ELSE v_streak_bonus := 0;
    END CASE;
    
    -- マイルストーンボーナス計算
    CASE v_post_count
        WHEN 1 THEN v_milestone_bonus := 20;      -- 初投稿
        WHEN 10 THEN v_milestone_bonus := 25;     -- 10投稿記念
        WHEN 50 THEN v_milestone_bonus := 50;     -- 50投稿記念
        WHEN 100 THEN v_milestone_bonus := 100;   -- 100投稿記念
        WHEN 500 THEN v_milestone_bonus := 200;   -- 500投稿記念
        ELSE v_milestone_bonus := 0;
    END CASE;
    
    -- 合計ボーナス計算
    v_total_bonus := v_base_bonus + v_quality_bonus + v_streak_bonus + v_milestone_bonus;
    
    -- post_bonuses テーブルに記録
    INSERT INTO post_bonuses (
        post_id, 
        user_id, 
        base_bonus, 
        quality_bonus, 
        streak_bonus, 
        milestone_bonus,
        photo_score,
        post_count_at_time,
        streak_days
    ) VALUES (
        p_post_id, 
        p_user_id, 
        v_base_bonus, 
        v_quality_bonus, 
        v_streak_bonus, 
        v_milestone_bonus,
        p_photo_score,
        v_post_count,
        v_streak_days
    );
    
    -- user_post_stats を更新
    UPDATE user_post_stats SET
        total_posts = v_post_count,
        current_streak_days = v_streak_days,
        longest_streak_days = GREATEST(longest_streak_days, v_streak_days),
        last_post_date = v_today,
        posts_this_week = posts_this_week + 1,
        posts_this_month = posts_this_month + 1,
        average_photo_score = CASE 
            WHEN p_photo_score IS NOT NULL THEN 
                (average_photo_score * (v_post_count - 1) + p_photo_score) / v_post_count
            ELSE average_photo_score
        END,
        highest_photo_score = CASE 
            WHEN p_photo_score IS NOT NULL THEN 
                GREATEST(highest_photo_score, p_photo_score)
            ELSE highest_photo_score
        END,
        updated_at = now()
    WHERE user_id = p_user_id;
    
    RETURN v_total_bonus;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 投稿ボーナスポイント付与関数
CREATE OR REPLACE FUNCTION award_post_bonus(
    p_user_id UUID,
    p_post_id UUID,
    p_bonus_points INTEGER,
    p_bonus_type TEXT
)
RETURNS VOID AS $$
BEGIN
    -- ポイント履歴に記録
    INSERT INTO point_history (
        user_id,
        point_type,
        points,
        source_type,
        source_id,
        description
    ) VALUES (
        p_user_id,
        'learning',  -- 投稿ボーナスは学習ポイントとして付与
        p_bonus_points,
        p_bonus_type,
        p_post_id,
        CASE p_bonus_type
            WHEN 'post_created' THEN '投稿作成ボーナス'
            WHEN 'post_quality_bonus' THEN '写真品質ボーナス'
            WHEN 'streak_bonus' THEN '連続投稿ボーナス'
            WHEN 'milestone_bonus' THEN 'マイルストーンボーナス'
            ELSE '投稿ボーナス'
        END
    );
    
    -- ユーザーポイントを更新
    INSERT INTO user_points (user_id, learning_points, total_points)
    VALUES (p_user_id, p_bonus_points, p_bonus_points)
    ON CONFLICT (user_id) 
    DO UPDATE SET
        learning_points = user_points.learning_points + p_bonus_points,
        total_points = user_points.total_points + p_bonus_points,
        updated_at = now();
        
    -- レベル再計算
    PERFORM calculate_user_level(p_user_id);
    
    -- バッジチェック
    PERFORM check_and_award_badges(p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 投稿作成時トリガー関数
CREATE OR REPLACE FUNCTION on_post_created_bonus()
RETURNS TRIGGER AS $$
DECLARE
    v_bonus_points INTEGER;
    v_photo_score INTEGER;
BEGIN
    -- AI写真スコアを取得（存在する場合）
    SELECT photo_score INTO v_photo_score FROM posts WHERE id = NEW.id;
    
    -- ボーナス計算
    v_bonus_points := calculate_post_bonus(NEW.id, NEW.user_id, v_photo_score);
    
    -- ボーナス付与
    PERFORM award_post_bonus(NEW.user_id, NEW.id, v_bonus_points, 'post_created');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. トリガー作成
CREATE TRIGGER trigger_post_created_bonus
    AFTER INSERT ON posts
    FOR EACH ROW
    EXECUTE FUNCTION on_post_created_bonus();

-- 8. 週次・月次統計リセット関数
CREATE OR REPLACE FUNCTION reset_weekly_monthly_stats()
RETURNS VOID AS $$
BEGIN
    -- 週次統計リセット（毎週月曜日）
    IF EXTRACT(DOW FROM CURRENT_DATE) = 1 THEN
        UPDATE user_post_stats SET posts_this_week = 0;
    END IF;
    
    -- 月次統計リセット（毎月1日）
    IF EXTRACT(DAY FROM CURRENT_DATE) = 1 THEN
        UPDATE user_post_stats SET posts_this_month = 0;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. エンゲージメントボーナス更新関数（いいね・コメント・ブックマーク時に呼び出し）
CREATE OR REPLACE FUNCTION update_engagement_bonus(
    p_post_id UUID,
    p_engagement_type TEXT,
    p_increment INTEGER DEFAULT 1
)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_bonus_points INTEGER := 0;
    v_current_bonus INTEGER := 0;
BEGIN
    -- 投稿者のユーザーIDを取得
    SELECT user_id INTO v_user_id FROM posts WHERE id = p_post_id;
    
    IF v_user_id IS NULL THEN
        RETURN;
    END IF;
    
    -- エンゲージメント種別によるボーナス計算
    CASE p_engagement_type
        WHEN 'like' THEN v_bonus_points := 2 * p_increment;
        WHEN 'comment' THEN v_bonus_points := 5 * p_increment;
        WHEN 'bookmark' THEN v_bonus_points := 3 * p_increment;
        ELSE v_bonus_points := 0;
    END CASE;
    
    IF v_bonus_points > 0 THEN
        -- post_bonuses テーブルの engagement_bonus を更新
        UPDATE post_bonuses 
        SET engagement_bonus = engagement_bonus + v_bonus_points,
            updated_at = now()
        WHERE post_id = p_post_id;
        
        -- ポイント付与
        PERFORM award_post_bonus(v_user_id, p_post_id, v_bonus_points, 'post_engagement_bonus');
        
        -- user_post_stats 更新
        UPDATE user_post_stats SET
            total_likes_received = CASE WHEN p_engagement_type = 'like' THEN total_likes_received + p_increment ELSE total_likes_received END,
            total_comments_received = CASE WHEN p_engagement_type = 'comment' THEN total_comments_received + p_increment ELSE total_comments_received END,
            total_bookmarks_received = CASE WHEN p_engagement_type = 'bookmark' THEN total_bookmarks_received + p_increment ELSE total_bookmarks_received END,
            updated_at = now()
        WHERE user_id = v_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. 初期データ作成（既存ユーザー用）
INSERT INTO user_post_stats (user_id, total_posts, average_photo_score, highest_photo_score)
SELECT 
    p.user_id,
    COUNT(*) as total_posts,
    COALESCE(AVG(p.photo_score), 0) as average_photo_score,
    COALESCE(MAX(p.photo_score), 0) as highest_photo_score
FROM posts p
GROUP BY p.user_id
ON CONFLICT (user_id) DO NOTHING;

-- マイグレーション完了メッセージ
DO $$
BEGIN
    RAISE NOTICE '✅ 投稿ボーナスシステムのマイグレーションが完了しました';
    RAISE NOTICE '📊 新機能:';
    RAISE NOTICE '   - 基本投稿ボーナス: 5ポイント';
    RAISE NOTICE '   - 品質ボーナス: 写真スコアに応じて最大30ポイント';
    RAISE NOTICE '   - 連続投稿ボーナス: 最大50ポイント';
    RAISE NOTICE '   - マイルストーンボーナス: 節目の投稿で特別ボーナス';
    RAISE NOTICE '   - エンゲージメントボーナス: いいね・コメント・ブックマークで追加ポイント';
END $$;