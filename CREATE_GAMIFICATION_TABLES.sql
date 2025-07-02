-- ========================================
-- ゲーミフィケーション・ポイントシステム
-- ========================================

-- 1. ユーザーポイントテーブル
CREATE TABLE IF NOT EXISTS user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  learning_points INTEGER DEFAULT 0 CHECK (learning_points >= 0),
  influence_points INTEGER DEFAULT 0 CHECK (influence_points >= 0),
  total_points INTEGER DEFAULT 0 CHECK (total_points >= 0),
  level INTEGER DEFAULT 1 CHECK (level >= 1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- 2. ポイント履歴テーブル
CREATE TABLE IF NOT EXISTS point_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  point_type VARCHAR(20) NOT NULL CHECK (point_type IN ('learning', 'influence')),
  points INTEGER NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  related_post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  related_inspiration_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. バッジ定義テーブル
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(10) NOT NULL, -- emoji
  category VARCHAR(20) NOT NULL CHECK (category IN ('learner', 'mentor', 'special')),
  requirement_type VARCHAR(50) NOT NULL,
  requirement_value INTEGER NOT NULL CHECK (requirement_value >= 0),
  rarity VARCHAR(20) NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  color VARCHAR(20) NOT NULL DEFAULT '#6B7280',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ユーザーバッジテーブル
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  is_displayed BOOLEAN DEFAULT true,
  
  UNIQUE(user_id, badge_id)
);

-- 5. ユーザーインスピレーション統計テーブル
CREATE TABLE IF NOT EXISTS user_inspiration_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  inspiration_given_count INTEGER DEFAULT 0 CHECK (inspiration_given_count >= 0),
  inspiration_received_count INTEGER DEFAULT 0 CHECK (inspiration_received_count >= 0),
  max_chain_level INTEGER DEFAULT 0 CHECK (max_chain_level >= 0),
  different_types_used INTEGER DEFAULT 0 CHECK (different_types_used >= 0),
  weekly_inspiration_count INTEGER DEFAULT 0 CHECK (weekly_inspiration_count >= 0),
  monthly_inspiration_count INTEGER DEFAULT 0 CHECK (monthly_inspiration_count >= 0),
  last_inspiration_date TIMESTAMPTZ,
  streak_days INTEGER DEFAULT 0 CHECK (streak_days >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- ========================================
-- インデックス作成
-- ========================================

-- ユーザーポイント用インデックス
CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_total_points ON user_points(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_points_level ON user_points(level DESC);

-- ポイント履歴用インデックス
CREATE INDEX IF NOT EXISTS idx_point_history_user_id ON point_history(user_id);
CREATE INDEX IF NOT EXISTS idx_point_history_created_at ON point_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_point_history_action_type ON point_history(action_type);

-- バッジ用インデックス
CREATE INDEX IF NOT EXISTS idx_badges_category ON badges(category);
CREATE INDEX IF NOT EXISTS idx_badges_rarity ON badges(rarity);
CREATE INDEX IF NOT EXISTS idx_badges_is_active ON badges(is_active);

-- ユーザーバッジ用インデックス
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_earned_at ON user_badges(earned_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_badges_is_displayed ON user_badges(is_displayed);

-- ユーザー統計用インデックス
CREATE INDEX IF NOT EXISTS idx_user_inspiration_stats_user_id ON user_inspiration_stats(user_id);

-- ========================================
-- RLSポリシー設定
-- ========================================

-- RLSを有効化
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inspiration_stats ENABLE ROW LEVEL SECURITY;

-- user_points のポリシー
CREATE POLICY "Users can view their own points" ON user_points
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own points" ON user_points
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own points" ON user_points
  FOR UPDATE USING (auth.uid() = user_id);

-- point_history のポリシー
CREATE POLICY "Users can view their own point history" ON point_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert point history" ON point_history
  FOR INSERT WITH CHECK (true);

-- badges のポリシー（全ユーザーが閲覧可能）
CREATE POLICY "Anyone can view active badges" ON badges
  FOR SELECT USING (is_active = true);

-- user_badges のポリシー
CREATE POLICY "Users can view their own badges" ON user_badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badges" ON user_badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own badges" ON user_badges
  FOR UPDATE USING (auth.uid() = user_id);

-- user_inspiration_stats のポリシー
CREATE POLICY "Users can view their own inspiration stats" ON user_inspiration_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inspiration stats" ON user_inspiration_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inspiration stats" ON user_inspiration_stats
  FOR UPDATE USING (auth.uid() = user_id);

-- ========================================
-- 初期バッジデータ
-- ========================================

INSERT INTO badges (name, display_name, description, icon, category, requirement_type, requirement_value, rarity, color) VALUES
-- 学習者バッジ
('first_inspiration', '初めてのインスピレーション', '初回インスピレーションを作成', '✨', 'learner', 'inspiration_count', 1, 'common', '#10B981'),
('inspiration_seeker', 'インスピレーション探求者', '10回のインスピレーションを作成', '🔍', 'learner', 'inspiration_count', 10, 'common', '#3B82F6'),
('creative_mind', 'クリエイティブマインド', '25回のインスピレーションを作成', '🎨', 'learner', 'inspiration_count', 25, 'rare', '#8B5CF6'),
('inspiration_master', 'インスピレーションマスター', '50回のインスピレーションを作成', '🏆', 'learner', 'inspiration_count', 50, 'epic', '#F59E0B'),

-- メンター バッジ
('first_mentor', '初メンター', '他のユーザーからインスピレーションを受ける', '🌟', 'mentor', 'inspired_count', 1, 'common', '#10B981'),
('inspiring_creator', 'インスパイアリング・クリエイター', '10回インスピレーションを与える', '💡', 'mentor', 'inspired_count', 10, 'rare', '#3B82F6'),
('creative_catalyst', 'クリエイティブ・カタリスト', '25回インスピレーションを与える', '🚀', 'mentor', 'inspired_count', 25, 'epic', '#8B5CF6'),
('legendary_mentor', '伝説のメンター', '50回インスピレーションを与える', '👑', 'mentor', 'inspired_count', 50, 'legendary', '#EF4444'),

-- 特別バッジ
('chain_builder', 'チェーンビルダー', 'インスピレーションチェーンレベル5到達', '🔗', 'special', 'chain_level', 5, 'rare', '#8B5CF6'),
('chain_master', 'チェーンマスター', 'インスピレーションチェーンレベル10到達', '⛓️', 'special', 'chain_level', 10, 'epic', '#F59E0B'),
('versatile_creator', 'バーサタイル・クリエイター', '5種類の異なるインスピレーションタイプを使用', '🎭', 'special', 'different_types_used', 5, 'rare', '#EC4899'),
('daily_inspiration', 'デイリー・インスピレーション', '7日連続でインスピレーションを作成', '📅', 'special', 'streak_days', 7, 'epic', '#10B981')

ON CONFLICT (name) DO NOTHING;

-- ========================================
-- 更新時刻自動更新のトリガー
-- ========================================

-- updated_at 自動更新関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- user_points テーブル用トリガー
CREATE TRIGGER update_user_points_updated_at
  BEFORE UPDATE ON user_points
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- user_inspiration_stats テーブル用トリガー
CREATE TRIGGER update_user_inspiration_stats_updated_at
  BEFORE UPDATE ON user_inspiration_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- ポイント計算関数
-- ========================================

-- ユーザーポイント初期化関数
CREATE OR REPLACE FUNCTION initialize_user_points(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_points (user_id, learning_points, influence_points, total_points, level)
  VALUES (p_user_id, 0, 0, 0, 1)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- インスピレーション統計初期化関数
CREATE OR REPLACE FUNCTION initialize_user_inspiration_stats(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_inspiration_stats (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 実行確認
-- ========================================

-- テーブル作成確認
SELECT schemaname, tablename 
FROM pg_tables 
WHERE tablename IN (
  'user_points', 
  'point_history', 
  'badges', 
  'user_badges', 
  'user_inspiration_stats'
) 
ORDER BY tablename;

-- バッジ数確認
SELECT category, COUNT(*) as badge_count 
FROM badges 
WHERE is_active = true 
GROUP BY category;

COMMIT;