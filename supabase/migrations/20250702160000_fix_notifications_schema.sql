-- 通知テーブルのスキーマを新しい構造に更新

-- 古いnotificationsテーブルが存在する場合は削除
DROP TABLE IF EXISTS public.notifications CASCADE;

-- 新しい通知テーブルを作成（20250628000002_notification_system.sqlから）
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid default gen_random_uuid() primary key,
  recipient_id uuid references auth.users(id) on delete cascade not null,
  sender_id uuid references auth.users(id) on delete cascade,
  notification_type text check (notification_type in (
    'inspiration_received', 
    'inspiration_given',
    'like', 
    'comment', 
    'follow', 
    'mention',
    'challenge_invitation',
    'achievement_unlocked',
    'system_announcement'
  )) not null,
  title text not null,
  message text not null,
  related_post_id uuid references public.posts(id) on delete cascade,
  related_inspiration_id uuid references public.inspirations(id) on delete cascade,
  related_user_id uuid references auth.users(id) on delete cascade,
  metadata jsonb default '{}',
  is_read boolean default false,
  is_archived boolean default false,
  priority text check (priority in ('low', 'normal', 'high', 'urgent')) default 'normal',
  scheduled_at timestamp with time zone,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS設定
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLSポリシー
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications" ON public.notifications 
FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications 
FOR UPDATE USING (auth.uid() = recipient_id);

CREATE POLICY "System can create notifications" ON public.notifications 
FOR INSERT WITH CHECK (true);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sender ON public.notifications(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- 通知設定テーブル
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  inspiration_notifications boolean default true,
  like_notifications boolean default true,
  comment_notifications boolean default true,
  follow_notifications boolean default true,
  mention_notifications boolean default true,
  challenge_notifications boolean default true,
  achievement_notifications boolean default true,
  system_notifications boolean default true,
  email_notifications boolean default false,
  push_notifications boolean default true,
  notification_frequency text check (notification_frequency in ('immediate', 'hourly', 'daily', 'weekly')) default 'immediate',
  quiet_hours_start time,
  quiet_hours_end time,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can update their own notification settings" ON public.notification_settings;

CREATE POLICY "Users can view their own notification settings" ON public.notification_settings 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings" ON public.notification_settings 
FOR ALL USING (auth.uid() = user_id);

-- 通知テンプレートテーブル
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id uuid default gen_random_uuid() primary key,
  template_key text not null unique,
  notification_type text not null,
  title_template text not null,
  message_template text not null,
  default_metadata jsonb default '{}',
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view notification templates" ON public.notification_templates;

CREATE POLICY "Anyone can view notification templates" ON public.notification_templates 
FOR SELECT USING (is_active = true);

-- 基本的な通知テンプレートを挿入
INSERT INTO public.notification_templates (template_key, notification_type, title_template, message_template) VALUES
('like_received', 'like', '{{sender_name}}さんがあなたの写真にいいねしました', '{{sender_name}}さんがあなたの写真を気に入ってくれました'),
('comment_received', 'comment', '{{sender_name}}さんがコメントしました', '{{sender_name}}さんがあなたの写真にコメントしました')
ON CONFLICT (template_key) DO NOTHING;

-- 更新日時の自動更新用トリガー関数
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- 更新日時自動更新トリガー
DROP TRIGGER IF EXISTS update_notifications_updated_at ON public.notifications;
DROP TRIGGER IF EXISTS update_notification_settings_updated_at ON public.notification_settings;
DROP TRIGGER IF EXISTS update_notification_templates_updated_at ON public.notification_templates;

CREATE TRIGGER update_notifications_updated_at 
BEFORE UPDATE ON public.notifications 
FOR EACH ROW 
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at 
BEFORE UPDATE ON public.notification_settings 
FOR EACH ROW 
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at 
BEFORE UPDATE ON public.notification_templates 
FOR EACH ROW 
EXECUTE FUNCTION public.update_updated_at_column();

-- create_notification関数（簡略版）
CREATE OR REPLACE FUNCTION public.create_notification(
  p_recipient_id uuid,
  p_sender_id uuid,
  p_notification_type text,
  p_template_key text,
  p_related_post_id uuid default null,
  p_related_inspiration_id uuid default null,
  p_related_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_template record;
  v_notification_id uuid;
  v_sender_name text;
  v_title text;
  v_message text;
BEGIN
  -- テンプレートを取得
  SELECT * INTO v_template 
  FROM public.notification_templates 
  WHERE template_key = p_template_key AND is_active = true;
  
  IF v_template IS NULL THEN
    -- テンプレートがない場合はデフォルトタイトル・メッセージを使用
    v_title := CASE p_notification_type
      WHEN 'like' THEN 'いいね！'
      WHEN 'comment' THEN 'コメント'
      ELSE '通知'
    END;
    v_message := CASE p_notification_type
      WHEN 'like' THEN 'あなたの投稿にいいねしました'
      WHEN 'comment' THEN 'あなたの投稿にコメントしました'
      ELSE '新しい通知があります'
    END;
  ELSE
    -- 送信者の名前を取得
    SELECT COALESCE(name, 'ユーザー') INTO v_sender_name
    FROM auth.users
    WHERE id = p_sender_id;
    
    IF v_sender_name IS NULL THEN
      v_sender_name := 'システム';
    END IF;
    
    -- テンプレートから実際のメッセージを生成
    v_title := REPLACE(v_template.title_template, '{{sender_name}}', v_sender_name);
    v_message := REPLACE(v_template.message_template, '{{sender_name}}', v_sender_name);
  END IF;
  
  -- 通知を作成
  INSERT INTO public.notifications (
    recipient_id,
    sender_id,
    notification_type,
    title,
    message,
    related_post_id,
    related_inspiration_id,
    related_user_id,
    metadata
  ) VALUES (
    p_recipient_id,
    p_sender_id,
    p_notification_type,
    v_title,
    v_message,
    p_related_post_id,
    p_related_inspiration_id,
    p_related_user_id,
    p_metadata
  ) RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;