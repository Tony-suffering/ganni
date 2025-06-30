-- アクティビティスコアリング & 入れ替えアルゴリズム用テーブル

-- 1. ユーザーアクティビティ追跡テーブル
CREATE TABLE user_activity_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  
  -- 日次スコア (0-10)
  daily_post_score DECIMAL(3,1) DEFAULT 0.0,
  engagement_score DECIMAL(3,1) DEFAULT 0.0,
  community_contribution_score DECIMAL(3,1) DEFAULT 0.0,
  login_consistency_score DECIMAL(3,1) DEFAULT 0.0,
  
  -- 総合スコア (0-40)
  overall_health_score DECIMAL(4,1) DEFAULT 0.0,
  
  -- ティア分類 (active, watch, risk)
  tier TEXT DEFAULT 'active' CHECK (tier IN ('active', 'watch', 'risk')),
  tier_updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 統計データ
  total_posts INTEGER DEFAULT 0,
  weekly_posts INTEGER DEFAULT 0,
  monthly_posts INTEGER DEFAULT 0,
  last_post_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  consecutive_active_days INTEGER DEFAULT 0,
  
  -- 警告・通知
  warning_sent_at TIMESTAMPTZ,
  risk_tier_start_date TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 日次アクティビティログテーブル
CREATE TABLE daily_activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  activity_date DATE NOT NULL,
  
  -- 日次活動データ
  posts_count INTEGER DEFAULT 0,
  likes_given INTEGER DEFAULT 0,
  likes_received INTEGER DEFAULT 0,
  comments_made INTEGER DEFAULT 0,
  comments_received INTEGER DEFAULT 0,
  profile_views INTEGER DEFAULT 0,
  login_count INTEGER DEFAULT 0,
  active_minutes INTEGER DEFAULT 0,
  
  -- 計算済みスコア
  daily_score DECIMAL(3,1) DEFAULT 0.0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, activity_date)
);

-- 3. コミュニティ管理テーブル
CREATE TABLE community_management (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- コミュニティ全体統計
  total_active_users INTEGER DEFAULT 0,
  total_watch_users INTEGER DEFAULT 0,
  total_risk_users INTEGER DEFAULT 0,
  total_waitlist_users INTEGER DEFAULT 0,
  
  -- 制限値
  max_active_users INTEGER DEFAULT 1000,
  target_active_ratio DECIMAL(3,2) DEFAULT 0.80, -- 80%
  target_watch_ratio DECIMAL(3,2) DEFAULT 0.15,  -- 15%
  target_risk_ratio DECIMAL(3,2) DEFAULT 0.05,   -- 5%
  
  -- 最終更新
  last_evaluation_at TIMESTAMPTZ,
  next_evaluation_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 入れ替えログテーブル
CREATE TABLE user_rotation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  
  action_type TEXT NOT NULL CHECK (action_type IN ('tier_change', 'warning_sent', 'moved_to_waitlist', 'reactivated')),
  from_tier TEXT,
  to_tier TEXT,
  reason TEXT,
  score_at_action DECIMAL(4,1),
  
  -- 自動/手動
  is_automated BOOLEAN DEFAULT true,
  admin_id UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 待機リストテーブル
CREATE TABLE waitlist_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  
  -- 待機リスト情報
  reason_for_waitlist TEXT,
  score_when_moved DECIMAL(4,1),
  can_reapply_after TIMESTAMPTZ,
  priority_score INTEGER DEFAULT 0,
  
  -- 再申請情報
  reapplication_count INTEGER DEFAULT 0,
  last_reapplication_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_user_activity_stats_user_id ON user_activity_stats(user_id);
CREATE INDEX idx_user_activity_stats_tier ON user_activity_stats(tier);
CREATE INDEX idx_user_activity_stats_score ON user_activity_stats(overall_health_score DESC);
CREATE INDEX idx_daily_activity_logs_user_date ON daily_activity_logs(user_id, activity_date);
CREATE INDEX idx_daily_activity_logs_date ON daily_activity_logs(activity_date);
CREATE INDEX idx_user_rotation_logs_user_id ON user_rotation_logs(user_id);
CREATE INDEX idx_waitlist_users_user_id ON waitlist_users(user_id);

-- RLS (Row Level Security) ポリシー
ALTER TABLE user_activity_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rotation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist_users ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のアクティビティ統計のみ閲覧可能
CREATE POLICY "Users can view own activity stats" ON user_activity_stats
  FOR SELECT USING (auth.uid() = user_id);

-- ユーザーは自分の日次ログのみ閲覧可能
CREATE POLICY "Users can view own daily logs" ON daily_activity_logs
  FOR SELECT USING (auth.uid() = user_id);

-- コミュニティ管理は管理者のみ
CREATE POLICY "Only admins can manage community" ON community_management
  FOR ALL USING (auth.uid() IN (
    SELECT user_id FROM profiles WHERE role = 'admin'
  ));

-- ローテーションログは管理者と対象ユーザーが閲覧可能
CREATE POLICY "Users can view own rotation logs" ON user_rotation_logs
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() IN (SELECT user_id FROM profiles WHERE role = 'admin')
  );

-- 待機リストは管理者と対象ユーザーが閲覧可能
CREATE POLICY "Users can view own waitlist status" ON waitlist_users
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() IN (SELECT user_id FROM profiles WHERE role = 'admin')
  );

-- 自動更新トリガー用の関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- updated_at自動更新トリガー
CREATE TRIGGER update_user_activity_stats_updated_at 
  BEFORE UPDATE ON user_activity_stats 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_management_updated_at 
  BEFORE UPDATE ON community_management 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_waitlist_users_updated_at 
  BEFORE UPDATE ON waitlist_users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 初期データ挿入
INSERT INTO community_management (
  max_active_users,
  target_active_ratio,
  target_watch_ratio,
  target_risk_ratio,
  next_evaluation_at
) VALUES (
  1000,
  0.80,
  0.15,
  0.05,
  NOW() + INTERVAL '1 day'
);