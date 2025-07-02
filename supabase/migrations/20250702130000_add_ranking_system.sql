-- =============================================
-- ランキングシステム実装
-- 作成日: 2025-07-02
-- 概要: ユーザーランキング機能とキャッシュシステムを追加
-- =============================================

-- 1. ランキングキャッシュテーブル
CREATE TABLE ranking_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- ランキング種別
    ranking_type VARCHAR(50) NOT NULL, -- 'total_points', 'learning_points', 'influence_points', 'photo_quality', 'post_count'
    
    -- 期間設定
    period VARCHAR(20) NOT NULL, -- 'all_time', 'monthly', 'weekly', 'daily'
    
    -- ランキング情報
    rank_position INTEGER NOT NULL,
    score DECIMAL(10,2) NOT NULL,
    
    -- メタデータ
    metadata JSONB, -- 追加情報（平均スコア、投稿数など）
    
    -- タイムスタンプ
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- ユニーク制約
    UNIQUE(user_id, ranking_type, period)
);

-- インデックス作成
CREATE INDEX idx_ranking_cache_type_period ON ranking_cache(ranking_type, period);
CREATE INDEX idx_ranking_cache_position ON ranking_cache(ranking_type, period, rank_position);
CREATE INDEX idx_ranking_cache_user_id ON ranking_cache(user_id);
CREATE INDEX idx_ranking_cache_calculated_at ON ranking_cache(calculated_at);

-- RLS設定
ALTER TABLE ranking_cache ENABLE ROW LEVEL SECURITY;

-- 全ユーザーがランキング情報を閲覧可能
CREATE POLICY "Anyone can view rankings" ON ranking_cache
    FOR SELECT USING (true);

-- 2. ランキング履歴テーブル
CREATE TABLE ranking_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ranking_type VARCHAR(50) NOT NULL,
    period VARCHAR(20) NOT NULL,
    rank_date DATE NOT NULL,
    rank_position INTEGER NOT NULL,
    score DECIMAL(10,2) NOT NULL,
    rank_change INTEGER DEFAULT 0, -- 前回からの順位変動
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- インデックス作成
CREATE INDEX idx_ranking_history_user_date ON ranking_history(user_id, rank_date);
CREATE INDEX idx_ranking_history_type_date ON ranking_history(ranking_type, period, rank_date);

-- RLS設定
ALTER TABLE ranking_history ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の履歴のみ閲覧可能
CREATE POLICY "Users can view own ranking history" ON ranking_history
    FOR SELECT USING (auth.uid() = user_id);

-- 3. 総合ポイントランキング更新関数
CREATE OR REPLACE FUNCTION update_total_points_ranking(p_period TEXT DEFAULT 'all_time')
RETURNS VOID AS $$
DECLARE
    r RECORD;
    rank_pos INTEGER := 1;
BEGIN
    -- 既存ランキングを削除
    DELETE FROM ranking_cache 
    WHERE ranking_type = 'total_points' AND period = p_period;
    
    -- 総合ポイントでランキング作成
    FOR r IN (
        SELECT 
            up.user_id,
            up.total_points as score,
            jsonb_build_object(
                'learning_points', up.learning_points,
                'influence_points', up.influence_points,
                'level', up.level
            ) as metadata
        FROM user_points up
        ORDER BY up.total_points DESC
    ) LOOP
        INSERT INTO ranking_cache (
            user_id, 
            ranking_type, 
            period, 
            rank_position, 
            score, 
            metadata
        ) VALUES (
            r.user_id, 
            'total_points', 
            p_period, 
            rank_pos, 
            r.score, 
            r.metadata
        );
        
        rank_pos := rank_pos + 1;
    END LOOP;
    
    RAISE NOTICE '✅ Total points ranking updated for period: %', p_period;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 写真品質ランキング更新関数
CREATE OR REPLACE FUNCTION update_photo_quality_ranking(p_period TEXT DEFAULT 'all_time')
RETURNS VOID AS $$
DECLARE
    r RECORD;
    rank_pos INTEGER := 1;
BEGIN
    -- 既存ランキングを削除
    DELETE FROM ranking_cache 
    WHERE ranking_type = 'photo_quality' AND period = p_period;
    
    -- 写真品質でランキング作成（平均スコア＋投稿数の重み付け）
    FOR r IN (
        SELECT 
            ups.user_id,
            (ups.average_photo_score * LOG(GREATEST(ups.total_posts, 1) + 1)) as score,
            jsonb_build_object(
                'average_score', ups.average_photo_score,
                'highest_score', ups.highest_photo_score,
                'total_posts', ups.total_posts
            ) as metadata
        FROM user_post_stats ups
        WHERE ups.total_posts > 0 AND ups.average_photo_score > 0
        ORDER BY (ups.average_photo_score * LOG(GREATEST(ups.total_posts, 1) + 1)) DESC
    ) LOOP
        INSERT INTO ranking_cache (
            user_id, 
            ranking_type, 
            period, 
            rank_position, 
            score, 
            metadata
        ) VALUES (
            r.user_id, 
            'photo_quality', 
            p_period, 
            rank_pos, 
            r.score, 
            r.metadata
        );
        
        rank_pos := rank_pos + 1;
    END LOOP;
    
    RAISE NOTICE '✅ Photo quality ranking updated for period: %', p_period;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 投稿数ランキング更新関数
CREATE OR REPLACE FUNCTION update_post_count_ranking(p_period TEXT DEFAULT 'all_time')
RETURNS VOID AS $$
DECLARE
    r RECORD;
    rank_pos INTEGER := 1;
    date_filter TEXT;
BEGIN
    -- 期間に応じた日付フィルター
    CASE p_period
        WHEN 'weekly' THEN date_filter := 'AND p.created_at >= CURRENT_DATE - INTERVAL ''7 days''';
        WHEN 'monthly' THEN date_filter := 'AND p.created_at >= DATE_TRUNC(''month'', CURRENT_DATE)';
        ELSE date_filter := '';
    END CASE;
    
    -- 既存ランキングを削除
    DELETE FROM ranking_cache 
    WHERE ranking_type = 'post_count' AND period = p_period;
    
    -- 動的クエリで投稿数ランキング作成
    FOR r IN EXECUTE format('
        SELECT 
            p.user_id,
            COUNT(*) as score,
            jsonb_build_object(
                ''post_count'', COUNT(*),
                ''avg_photo_score'', COALESCE(AVG(p.photo_score), 0),
                ''total_likes'', COALESCE(SUM(p.likes_count), 0)
            ) as metadata
        FROM posts p
        WHERE 1=1 %s
        GROUP BY p.user_id
        HAVING COUNT(*) > 0
        ORDER BY COUNT(*) DESC
    ', date_filter) LOOP
        INSERT INTO ranking_cache (
            user_id, 
            ranking_type, 
            period, 
            rank_position, 
            score, 
            metadata
        ) VALUES (
            r.user_id, 
            'post_count', 
            p_period, 
            rank_pos, 
            r.score, 
            r.metadata
        );
        
        rank_pos := rank_pos + 1;
    END LOOP;
    
    RAISE NOTICE '✅ Post count ranking updated for period: %', p_period;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. インスピレーション影響力ランキング更新関数
CREATE OR REPLACE FUNCTION update_inspiration_ranking(p_period TEXT DEFAULT 'all_time')
RETURNS VOID AS $$
DECLARE
    r RECORD;
    rank_pos INTEGER := 1;
BEGIN
    -- 既存ランキングを削除
    DELETE FROM ranking_cache 
    WHERE ranking_type = 'inspiration_influence' AND period = p_period;
    
    -- インスピレーション影響力でランキング作成
    FOR r IN (
        SELECT 
            uis.user_id,
            (uis.inspiration_given_count * 2 + uis.inspiration_received_count + uis.max_chain_level * 5) as score,
            jsonb_build_object(
                'inspiration_given', uis.inspiration_given_count,
                'inspiration_received', uis.inspiration_received_count,
                'max_chain_level', uis.max_chain_level,
                'streak_days', uis.streak_days
            ) as metadata
        FROM user_inspiration_stats uis
        WHERE uis.inspiration_given_count > 0 OR uis.inspiration_received_count > 0
        ORDER BY (uis.inspiration_given_count * 2 + uis.inspiration_received_count + uis.max_chain_level * 5) DESC
    ) LOOP
        INSERT INTO ranking_cache (
            user_id, 
            ranking_type, 
            period, 
            rank_position, 
            score, 
            metadata
        ) VALUES (
            r.user_id, 
            'inspiration_influence', 
            p_period, 
            rank_pos, 
            r.score, 
            r.metadata
        );
        
        rank_pos := rank_pos + 1;
    END LOOP;
    
    RAISE NOTICE '✅ Inspiration influence ranking updated for period: %', p_period;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 全ランキング更新関数
CREATE OR REPLACE FUNCTION update_all_rankings()
RETURNS VOID AS $$
BEGIN
    -- 全期間ランキング
    PERFORM update_total_points_ranking('all_time');
    PERFORM update_photo_quality_ranking('all_time');
    PERFORM update_post_count_ranking('all_time');
    PERFORM update_inspiration_ranking('all_time');
    
    -- 月間ランキング
    PERFORM update_post_count_ranking('monthly');
    
    -- 週間ランキング
    PERFORM update_post_count_ranking('weekly');
    
    RAISE NOTICE '🏆 All rankings updated successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. ユーザーランキング情報取得関数
CREATE OR REPLACE FUNCTION get_user_ranking_info(p_user_id UUID)
RETURNS TABLE(
    ranking_type TEXT,
    period TEXT,
    rank_position INTEGER,
    score DECIMAL(10,2),
    total_users INTEGER,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rc.ranking_type::TEXT,
        rc.period::TEXT,
        rc.rank_position,
        rc.score,
        (SELECT COUNT(*) FROM ranking_cache rc2 
         WHERE rc2.ranking_type = rc.ranking_type 
         AND rc2.period = rc.period)::INTEGER as total_users,
        rc.metadata
    FROM ranking_cache rc
    WHERE rc.user_id = p_user_id
    ORDER BY 
        CASE rc.ranking_type 
            WHEN 'total_points' THEN 1
            WHEN 'photo_quality' THEN 2  
            WHEN 'post_count' THEN 3
            WHEN 'inspiration_influence' THEN 4
        END,
        CASE rc.period
            WHEN 'all_time' THEN 1
            WHEN 'monthly' THEN 2
            WHEN 'weekly' THEN 3
        END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. トップランカー取得関数
CREATE OR REPLACE FUNCTION get_top_rankers(
    p_ranking_type TEXT DEFAULT 'total_points',
    p_period TEXT DEFAULT 'all_time',
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
    rank_position INTEGER,
    user_id UUID,
    score DECIMAL(10,2),
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rc.rank_position,
        rc.user_id,
        rc.score,
        rc.metadata
    FROM ranking_cache rc
    WHERE rc.ranking_type = p_ranking_type 
    AND rc.period = p_period
    ORDER BY rc.rank_position
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. ランキング履歴記録関数
CREATE OR REPLACE FUNCTION record_ranking_history()
RETURNS VOID AS $$
DECLARE
    r RECORD;
    prev_rank INTEGER;
    rank_change INTEGER;
BEGIN
    -- 今日の日付
    FOR r IN (
        SELECT 
            user_id,
            ranking_type,
            period,
            rank_position,
            score
        FROM ranking_cache
        WHERE ranking_type = 'total_points' AND period = 'all_time'
    ) LOOP
        -- 前回の順位を取得
        SELECT rank_position INTO prev_rank
        FROM ranking_history
        WHERE user_id = r.user_id 
        AND ranking_type = r.ranking_type 
        AND period = r.period
        ORDER BY rank_date DESC
        LIMIT 1;
        
        -- 順位変動を計算
        rank_change := COALESCE(prev_rank - r.rank_position, 0);
        
        -- 履歴に記録
        INSERT INTO ranking_history (
            user_id,
            ranking_type,
            period,
            rank_date,
            rank_position,
            score,
            rank_change
        ) VALUES (
            r.user_id,
            r.ranking_type,
            r.period,
            CURRENT_DATE,
            r.rank_position,
            r.score,
            rank_change
        ) ON CONFLICT (user_id, ranking_type, period, rank_date) 
        DO UPDATE SET
            rank_position = EXCLUDED.rank_position,
            score = EXCLUDED.score,
            rank_change = EXCLUDED.rank_change;
    END LOOP;
    
    RAISE NOTICE '📊 Ranking history recorded for date: %', CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. 初期ランキング計算実行
SELECT update_all_rankings();

-- 12. 定期実行用のCRON設定（手動でも実行可能）
-- 注意: Supabaseでは手動でCRON jobを設定する必要があります
-- 以下は参考例です（実際の環境では適切な方法で設定してください）

-- 日次実行用コメント:
-- SELECT cron.schedule('daily-ranking-update', '0 2 * * *', 'SELECT update_all_rankings();');
-- SELECT cron.schedule('daily-ranking-history', '0 3 * * *', 'SELECT record_ranking_history();');

-- マイグレーション完了メッセージ
DO $$
BEGIN
    RAISE NOTICE '🏆 ランキングシステムのマイグレーションが完了しました';
    RAISE NOTICE '📊 実装されたランキング:';
    RAISE NOTICE '   - 総合ポイントランキング';
    RAISE NOTICE '   - 写真品質ランキング（平均スコア×投稿数重み）';
    RAISE NOTICE '   - 投稿数ランキング（全期間/月間/週間）';
    RAISE NOTICE '   - インスピレーション影響力ランキング';
    RAISE NOTICE '🔄 ランキングは以下の関数で更新可能:';
    RAISE NOTICE '   - SELECT update_all_rankings(); -- 全ランキング更新';
    RAISE NOTICE '   - SELECT get_user_ranking_info(''ユーザーID''); -- 個人ランキング取得';
    RAISE NOTICE '   - SELECT get_top_rankers(''total_points'', ''all_time'', 10); -- トップ10取得';
END $$;