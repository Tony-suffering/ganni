-- ゲーミフィケーション・システム完全実装
-- インスピレーション機能と連動するポイント・バッジシステム

-- 1. ユーザーポイントテーブル
CREATE TABLE IF NOT EXISTS public.user_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  learning_points INTEGER DEFAULT 0 NOT NULL, -- LP: インスピレーションを受け取った時のポイント
  influence_points INTEGER DEFAULT 0 NOT NULL, -- IP: インスピレーションを与えた時のポイント
  total_points INTEGER GENERATED ALWAYS AS (learning_points + influence_points) STORED,
  level INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. ポイント履歴テーブル
CREATE TABLE IF NOT EXISTS public.point_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  point_type TEXT CHECK (point_type IN ('learning', 'influence')) NOT NULL,
  points INTEGER NOT NULL,
  source_type TEXT CHECK (source_type IN ('inspiration_given', 'inspiration_received', 'chain_bonus', 'weekly_bonus')) NOT NULL,
  source_id UUID, -- 関連するinspiration_idなど
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. バッジ定義テーブル
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT DEFAULT '🏆' NOT NULL,
  category TEXT CHECK (category IN ('learner', 'mentor', 'special', 'achievement')) NOT NULL,
  requirement_type TEXT CHECK (requirement_type IN ('inspiration_count', 'chain_level', 'diversity', 'weekly_activity', 'total_points')) NOT NULL,
  requirement_value INTEGER NOT NULL,
  rarity TEXT CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')) DEFAULT 'common' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. ユーザーバッジテーブル
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, badge_id)
);

-- 5. ユーザーインスピレーション統計テーブル
CREATE TABLE IF NOT EXISTS public.user_inspiration_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  inspiration_given_count INTEGER DEFAULT 0 NOT NULL,
  inspiration_received_count INTEGER DEFAULT 0 NOT NULL,
  max_chain_level INTEGER DEFAULT 0 NOT NULL,
  different_types_used INTEGER DEFAULT 0 NOT NULL,
  weekly_inspiration_count INTEGER DEFAULT 0 NOT NULL,
  monthly_inspiration_count INTEGER DEFAULT 0 NOT NULL,
  streak_days INTEGER DEFAULT 0 NOT NULL,
  last_inspiration_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. インデックス作成
CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON public.user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_point_history_user_id ON public.point_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_inspiration_stats_user_id ON public.user_inspiration_stats(user_id);

-- 7. RLS (Row Level Security) ポリシー
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_inspiration_stats ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のデータのみ閲覧・更新可能
CREATE POLICY "Users can view own points" ON public.user_points
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own point history" ON public.point_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view badges" ON public.badges
  FOR SELECT USING (true);

CREATE POLICY "Users can view own badges" ON public.user_badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own stats" ON public.user_inspiration_stats
  FOR SELECT USING (auth.uid() = user_id);

-- 8. 必要なSQL関数を作成

-- インスピレーションチェーンの深度を取得
CREATE OR REPLACE FUNCTION get_inspiration_chain_depth(post_id UUID)
RETURNS INTEGER AS $$
DECLARE
  depth INTEGER := 0;
  current_post_id UUID := post_id;
  source_post_id UUID;
BEGIN
  LOOP
    SELECT i.source_post_id INTO source_post_id
    FROM inspirations i
    WHERE i.inspired_post_id = current_post_id
    LIMIT 1;
    
    IF source_post_id IS NULL THEN
      EXIT;
    END IF;
    
    depth := depth + 1;
    current_post_id := source_post_id;
    
    -- 無限ループ防止
    IF depth > 100 THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN depth;
END;
$$ LANGUAGE plpgsql;

-- ユーザーレベル計算
CREATE OR REPLACE FUNCTION calculate_user_level(total_points INTEGER)
RETURNS INTEGER AS $$
DECLARE
  level_thresholds INTEGER[] := ARRAY[0, 100, 250, 500, 1000, 2000, 4000, 8000, 15000, 25000, 50000];
  level INTEGER := 1;
  i INTEGER;
BEGIN
  FOR i IN REVERSE array_length(level_thresholds, 1)..1 LOOP
    IF total_points >= level_thresholds[i] THEN
      level := i;
      EXIT;
    END IF;
  END LOOP;
  
  RETURN level;
END;
$$ LANGUAGE plpgsql;

-- ユーザーポイント更新
CREATE OR REPLACE FUNCTION update_user_points(
  user_id UUID,
  point_type TEXT,
  points INTEGER,
  source_type TEXT,
  source_id UUID DEFAULT NULL,
  description TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- ユーザーポイントテーブルを更新
  INSERT INTO user_points (user_id, learning_points, influence_points)
  VALUES (
    user_id,
    CASE WHEN point_type = 'learning' THEN points ELSE 0 END,
    CASE WHEN point_type = 'influence' THEN points ELSE 0 END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    learning_points = user_points.learning_points + CASE WHEN point_type = 'learning' THEN points ELSE 0 END,
    influence_points = user_points.influence_points + CASE WHEN point_type = 'influence' THEN points ELSE 0 END,
    level = calculate_user_level(user_points.total_points + points),
    updated_at = now();
  
  -- ポイント履歴を記録
  INSERT INTO point_history (user_id, point_type, points, source_type, source_id, description)
  VALUES (user_id, point_type, points, source_type, source_id, description);
END;
$$ LANGUAGE plpgsql;

-- バッジチェックと付与
CREATE OR REPLACE FUNCTION check_and_award_badges(user_id UUID)
RETURNS VOID AS $$
DECLARE
  badge_record RECORD;
  user_stats RECORD;
  user_points_record RECORD;
BEGIN
  -- ユーザー統計を取得
  SELECT * INTO user_stats FROM user_inspiration_stats WHERE user_inspiration_stats.user_id = check_and_award_badges.user_id;
  SELECT * INTO user_points_record FROM user_points WHERE user_points.user_id = check_and_award_badges.user_id;
  
  -- 各バッジの条件をチェック
  FOR badge_record IN SELECT * FROM badges LOOP
    -- すでに持っているバッジはスキップ
    IF EXISTS (SELECT 1 FROM user_badges WHERE user_badges.user_id = check_and_award_badges.user_id AND badge_id = badge_record.id) THEN
      CONTINUE;
    END IF;
    
    -- バッジの条件をチェック
    CASE badge_record.requirement_type
      WHEN 'inspiration_count' THEN
        IF (badge_record.category = 'learner' AND user_stats.inspiration_received_count >= badge_record.requirement_value) OR
           (badge_record.category = 'mentor' AND user_stats.inspiration_given_count >= badge_record.requirement_value) THEN
          INSERT INTO user_badges (user_id, badge_id) VALUES (check_and_award_badges.user_id, badge_record.id);
        END IF;
      WHEN 'chain_level' THEN
        IF user_stats.max_chain_level >= badge_record.requirement_value THEN
          INSERT INTO user_badges (user_id, badge_id) VALUES (check_and_award_badges.user_id, badge_record.id);
        END IF;
      WHEN 'diversity' THEN
        IF user_stats.different_types_used >= badge_record.requirement_value THEN
          INSERT INTO user_badges (user_id, badge_id) VALUES (check_and_award_badges.user_id, badge_record.id);
        END IF;
      WHEN 'weekly_activity' THEN
        IF user_stats.weekly_inspiration_count >= badge_record.requirement_value THEN
          INSERT INTO user_badges (user_id, badge_id) VALUES (check_and_award_badges.user_id, badge_record.id);
        END IF;
      WHEN 'total_points' THEN
        IF user_points_record.total_points >= badge_record.requirement_value THEN
          INSERT INTO user_badges (user_id, badge_id) VALUES (check_and_award_badges.user_id, badge_record.id);
        END IF;
    END CASE;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- インスピレーション統計更新
CREATE OR REPLACE FUNCTION update_inspiration_stats(
  giver_user_id UUID,
  receiver_user_id UUID,
  inspiration_type TEXT,
  chain_level INTEGER
)
RETURNS VOID AS $$
BEGIN
  -- インスピレーション提供者の統計を更新
  INSERT INTO user_inspiration_stats (user_id, inspiration_given_count, max_chain_level, different_types_used, weekly_inspiration_count, monthly_inspiration_count)
  VALUES (giver_user_id, 1, chain_level, 1, 1, 1)
  ON CONFLICT (user_id) DO UPDATE SET
    inspiration_given_count = user_inspiration_stats.inspiration_given_count + 1,
    max_chain_level = GREATEST(user_inspiration_stats.max_chain_level, chain_level),
    different_types_used = (
      SELECT COUNT(DISTINCT inspiration_type) 
      FROM inspirations 
      WHERE creator_id = giver_user_id
    ),
    weekly_inspiration_count = user_inspiration_stats.weekly_inspiration_count + 1,
    monthly_inspiration_count = user_inspiration_stats.monthly_inspiration_count + 1,
    last_inspiration_date = CURRENT_DATE,
    updated_at = now();
  
  -- インスピレーション受領者の統計を更新
  INSERT INTO user_inspiration_stats (user_id, inspiration_received_count)
  VALUES (receiver_user_id, 1)
  ON CONFLICT (user_id) DO UPDATE SET
    inspiration_received_count = user_inspiration_stats.inspiration_received_count + 1,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- 9. トリガー関数: インスピレーション作成時の処理
CREATE OR REPLACE FUNCTION on_inspiration_created()
RETURNS TRIGGER AS $$
DECLARE
  source_post_author_id UUID;
BEGIN
  -- ソース投稿の作者IDを取得
  SELECT author_id INTO source_post_author_id
  FROM posts
  WHERE id = NEW.source_post_id;
  
  -- ポイント付与
  -- インスピレーション受領者（ソース投稿者）に学習ポイント付与
  PERFORM update_user_points(
    source_post_author_id,
    'learning',
    10,
    'inspiration_received',
    NEW.id,
    'インスピレーションを受け取りました'
  );
  
  -- インスピレーション提供者に影響ポイント付与
  PERFORM update_user_points(
    NEW.creator_id,
    'influence',
    20,
    'inspiration_given',
    NEW.id,
    'インスピレーションを提供しました'
  );
  
  -- チェーンボーナス（レベル3以上）
  IF NEW.chain_level >= 3 THEN
    PERFORM update_user_points(
      NEW.creator_id,
      'influence',
      NEW.chain_level * 5,
      'chain_bonus',
      NEW.id,
      'チェーンボーナス (レベル ' || NEW.chain_level || ')'
    );
  END IF;
  
  -- 統計更新
  PERFORM update_inspiration_stats(
    NEW.creator_id,
    source_post_author_id,
    NEW.inspiration_type,
    NEW.chain_level
  );
  
  -- バッジチェック
  PERFORM check_and_award_badges(NEW.creator_id);
  PERFORM check_and_award_badges(source_post_author_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. トリガー作成
DROP TRIGGER IF EXISTS trigger_on_inspiration_created ON public.inspirations;
CREATE TRIGGER trigger_on_inspiration_created
  AFTER INSERT ON public.inspirations
  FOR EACH ROW
  EXECUTE FUNCTION on_inspiration_created();

-- 11. 初期バッジデータ挿入
INSERT INTO badges (name, display_name, description, icon, category, requirement_type, requirement_value, rarity) VALUES
-- 学習者バッジ
('photography_newbie', '写真初心者', '初めてインスピレーションを受け取りました', '🌱', 'learner', 'inspiration_count', 1, 'common'),
('learning_enthusiast', '学習熱心', '5回インスピレーションを受け取りました', '📚', 'learner', 'inspiration_count', 5, 'common'),
('active_learner', '積極的な学習者', '20回インスピレーションを受け取りました', '🎯', 'learner', 'inspiration_count', 20, 'rare'),
('knowledge_seeker', '知識探求者', '50回インスピレーションを受け取りました', '🔍', 'learner', 'inspiration_count', 50, 'epic'),

-- メンター・バッジ
('inspiration_starter', 'インスピレーション・スターター', '初めてインスピレーションを与えました', '💡', 'mentor', 'inspiration_count', 1, 'common'),
('helpful_mentor', '親切なメンター', '10回インスピレーションを与えました', '🤝', 'mentor', 'inspiration_count', 10, 'common'),
('community_mentor', 'コミュニティ・メンター', '50回インスピレーションを与えました', '👨‍🏫', 'mentor', 'inspiration_count', 50, 'rare'),
('legend_creator', '伝説のクリエイター', '100回インスピレーションを与えました', '👑', 'mentor', 'inspiration_count', 100, 'legendary'),

-- 特別バッジ
('diversity_explorer', '多様性の探求者', '6つの異なるタイプを使用しました', '🎨', 'special', 'diversity', 6, 'rare'),
('chain_builder', 'チェーン・ビルダー', 'レベル5以上のチェーンを作成しました', '⛓️', 'special', 'chain_level', 5, 'epic'),
('weekly_champion', '週間チャンピオン', '1週間で10回以上のインスピレーション', '🏆', 'special', 'weekly_activity', 10, 'rare'),

-- 達成バッジ
('point_collector', 'ポイント・コレクター', '1000ポイントを獲得しました', '💎', 'achievement', 'total_points', 1000, 'rare'),
('elite_member', 'エリート・メンバー', '5000ポイントを獲得しました', '⭐', 'achievement', 'total_points', 5000, 'epic'),
('grand_master', 'グランドマスター', '10000ポイントを獲得しました', '🌟', 'achievement', 'total_points', 10000, 'legendary')

ON CONFLICT (name) DO NOTHING;