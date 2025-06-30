-- ユーザー通知設定テーブル
CREATE TABLE IF NOT EXISTS user_notification_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    likes BOOLEAN DEFAULT true,
    comments BOOLEAN DEFAULT true,
    newPosts BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);

-- お問い合わせメッセージテーブル
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 通知テーブル（既存のnotificationsテーブルを更新）
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('like', 'comment', 'new_post')),
    content TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS (Row Level Security) ポリシーの設定

-- user_notification_settings テーブルのRLS
ALTER TABLE user_notification_settings ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の通知設定のみ閲覧・更新可能
CREATE POLICY "Users can view own notification settings" ON user_notification_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification settings" ON user_notification_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification settings" ON user_notification_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notification settings" ON user_notification_settings
    FOR DELETE USING (auth.uid() = user_id);

-- contact_messages テーブルのRLS
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- ログインユーザーはお問い合わせを送信可能
CREATE POLICY "Authenticated users can insert contact messages" ON contact_messages
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ユーザーは自分が送信したお問い合わせのみ閲覧可能
CREATE POLICY "Users can view own contact messages" ON contact_messages
    FOR SELECT USING (auth.uid() = user_id);

-- notifications テーブルのRLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分宛ての通知のみ閲覧可能
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = recipient_id);

-- ユーザーは自分宛ての通知を更新可能（既読状態の変更）
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = recipient_id);

-- 認証されたユーザーは通知を作成可能
CREATE POLICY "Authenticated users can create notifications" ON notifications
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- インデックスの作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_user_notification_settings_user_id ON user_notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_messages_user_id ON contact_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- 更新時刻を自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- user_notification_settings テーブルに更新時刻トリガーを設定
CREATE TRIGGER update_user_notification_settings_updated_at
    BEFORE UPDATE ON user_notification_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();