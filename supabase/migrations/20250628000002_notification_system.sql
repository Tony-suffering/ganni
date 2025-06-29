-- 通知システムの実装
-- インスピレーション通知を含む包括的な通知システム

-- 1. 通知テーブル
create table if not exists public.notifications (
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
  metadata jsonb default '{}', -- 追加のメタデータ（画像URL、アクション情報等）
  is_read boolean default false,
  is_archived boolean default false,
  priority text check (priority in ('low', 'normal', 'high', 'urgent')) default 'normal',
  scheduled_at timestamp with time zone, -- 予約送信用
  expires_at timestamp with time zone, -- 通知の有効期限
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. 通知設定テーブル
create table if not exists public.notification_settings (
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

-- 3. 通知テンプレート
create table if not exists public.notification_templates (
  id uuid default gen_random_uuid() primary key,
  template_key text not null unique,
  notification_type text not null,
  title_template text not null, -- テンプレート文字列（例: "{{sender_name}}さんがあなたの写真からインスパイアされました"）
  message_template text not null,
  default_metadata jsonb default '{}',
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. 通知統計
create table if not exists public.notification_stats (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  notifications_sent integer default 0,
  notifications_read integer default 0,
  notifications_clicked integer default 0,
  inspiration_notifications_count integer default 0,
  like_notifications_count integer default 0,
  comment_notifications_count integer default 0,
  follow_notifications_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, date)
);

-- RLS設定
alter table public.notifications enable row level security;
alter table public.notification_settings enable row level security;
alter table public.notification_templates enable row level security;
alter table public.notification_stats enable row level security;

-- 通知のRLSポリシー
create policy "Users can view their own notifications" on public.notifications 
for select using (auth.uid() = recipient_id);

create policy "Users can update their own notifications" on public.notifications 
for update using (auth.uid() = recipient_id);

create policy "System can create notifications" on public.notifications 
for insert with check (true);

-- 通知設定のRLSポリシー
create policy "Users can view their own notification settings" on public.notification_settings 
for select using (auth.uid() = user_id);

create policy "Users can update their own notification settings" on public.notification_settings 
for all using (auth.uid() = user_id);

-- 通知テンプレートのRLSポリシー
create policy "Anyone can view notification templates" on public.notification_templates 
for select using (is_active = true);

-- 通知統計のRLSポリシー
create policy "Users can view their own notification stats" on public.notification_stats 
for select using (auth.uid() = user_id);

-- 関数：通知作成
create or replace function public.create_notification(
  p_recipient_id uuid,
  p_sender_id uuid,
  p_notification_type text,
  p_template_key text,
  p_related_post_id uuid default null,
  p_related_inspiration_id uuid default null,
  p_related_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_template record;
  v_notification_id uuid;
  v_sender_name text;
  v_title text;
  v_message text;
  v_settings record;
begin
  -- 受信者の通知設定を確認
  select * into v_settings 
  from public.notification_settings 
  where user_id = p_recipient_id;
  
  -- 設定が存在しない場合はデフォルト設定を作成
  if v_settings is null then
    insert into public.notification_settings (user_id) 
    values (p_recipient_id)
    returning * into v_settings;
  end if;
  
  -- 通知タイプが無効化されている場合は処理を停止
  if (p_notification_type = 'inspiration_received' and not v_settings.inspiration_notifications) or
     (p_notification_type = 'like' and not v_settings.like_notifications) or
     (p_notification_type = 'comment' and not v_settings.comment_notifications) or
     (p_notification_type = 'follow' and not v_settings.follow_notifications) or
     (p_notification_type = 'mention' and not v_settings.mention_notifications) or
     (p_notification_type = 'challenge_invitation' and not v_settings.challenge_notifications) or
     (p_notification_type = 'achievement_unlocked' and not v_settings.achievement_notifications) or
     (p_notification_type = 'system_announcement' and not v_settings.system_notifications) then
    return null;
  end if;
  
  -- テンプレートを取得
  select * into v_template 
  from public.notification_templates 
  where template_key = p_template_key and is_active = true;
  
  if v_template is null then
    raise exception 'Notification template not found: %', p_template_key;
  end if;
  
  -- 送信者の名前を取得
  if p_sender_id is not null then
    select coalesce(name, 'Unknown User') into v_sender_name
    from auth.users
    where id = p_sender_id;
    
    if v_sender_name is null then
      select coalesce(name, 'Unknown User') into v_sender_name
      from public.users
      where id = p_sender_id;
    end if;
  else
    v_sender_name := 'システム';
  end if;
  
  -- テンプレートから実際のメッセージを生成
  v_title := replace(v_template.title_template, '{{sender_name}}', v_sender_name);
  v_message := replace(v_template.message_template, '{{sender_name}}', v_sender_name);
  
  -- メタデータにsender_nameを追加
  p_metadata := p_metadata || jsonb_build_object('sender_name', v_sender_name);
  
  -- 通知を作成
  insert into public.notifications (
    recipient_id,
    sender_id,
    notification_type,
    title,
    message,
    related_post_id,
    related_inspiration_id,
    related_user_id,
    metadata
  ) values (
    p_recipient_id,
    p_sender_id,
    p_notification_type,
    v_title,
    v_message,
    p_related_post_id,
    p_related_inspiration_id,
    p_related_user_id,
    p_metadata
  ) returning id into v_notification_id;
  
  -- 統計を更新
  insert into public.notification_stats (user_id, date, notifications_sent)
  values (p_recipient_id, current_date, 1)
  on conflict (user_id, date) do update set
    notifications_sent = notification_stats.notifications_sent + 1,
    updated_at = now();
  
  return v_notification_id;
end;
$$;

-- 関数：インスピレーション通知の自動作成
create or replace function public.notify_inspiration_created()
returns trigger
language plpgsql
security definer
as $$
declare
  v_source_post record;
  v_source_author_id uuid;
begin
  -- ソース投稿の情報を取得
  select * into v_source_post
  from public.posts
  where id = NEW.source_post_id;
  
  if v_source_post is null then
    return NEW;
  end if;
  
  v_source_author_id := v_source_post.author_id;
  
  -- 自分自身の投稿からのインスピレーションの場合は通知しない
  if v_source_author_id = NEW.creator_id then
    return NEW;
  end if;
  
  -- インスピレーション受信通知を作成
  perform public.create_notification(
    p_recipient_id := v_source_author_id,
    p_sender_id := NEW.creator_id,
    p_notification_type := 'inspiration_received',
    p_template_key := 'inspiration_received_basic',
    p_related_post_id := NEW.source_post_id,
    p_related_inspiration_id := NEW.id,
    p_related_user_id := NEW.creator_id,
    p_metadata := jsonb_build_object(
      'inspiration_type', NEW.inspiration_type,
      'inspiration_note', NEW.inspiration_note,
      'chain_level', NEW.chain_level
    )
  );
  
  return NEW;
end;
$$;

-- インスピレーション作成時の通知トリガー
create trigger inspiration_notification_trigger
  after insert on public.inspirations
  for each row
  execute function public.notify_inspiration_created();

-- インデックス作成
create index if not exists idx_notifications_recipient on public.notifications(recipient_id);
create index if not exists idx_notifications_sender on public.notifications(sender_id);
create index if not exists idx_notifications_type on public.notifications(notification_type);
create index if not exists idx_notifications_read on public.notifications(is_read);
create index if not exists idx_notifications_created_at on public.notifications(created_at);
create index if not exists idx_notification_settings_user on public.notification_settings(user_id);
create index if not exists idx_notification_stats_user_date on public.notification_stats(user_id, date);

-- 基本的な通知テンプレートを挿入
insert into public.notification_templates (template_key, notification_type, title_template, message_template) values
('inspiration_received_basic', 'inspiration_received', '{{sender_name}}さんがあなたの写真からインスパイアされました', '{{sender_name}}さんがあなたの写真からインスピレーションを受けて新しい作品を投稿しました'),
('inspiration_received_with_note', 'inspiration_received', '{{sender_name}}さんがあなたの写真からインスパイアされました', '{{sender_name}}さんがあなたの写真からインスピレーションを受けました：「{{inspiration_note}}」'),
('like_received', 'like', '{{sender_name}}さんがあなたの写真にいいねしました', '{{sender_name}}さんがあなたの写真を気に入ってくれました'),
('comment_received', 'comment', '{{sender_name}}さんがコメントしました', '{{sender_name}}さんがあなたの写真にコメントしました'),
('follow_received', 'follow', '{{sender_name}}さんがフォローしました', '{{sender_name}}さんがあなたをフォローしました'),
('achievement_photo_master', 'achievement_unlocked', '称号獲得：写真マスター', 'おめでとうございます！100枚の写真投稿を達成しました'),
('achievement_inspiration_giver', 'achievement_unlocked', '称号獲得：インスピレーション・ギバー', 'おめでとうございます！10人からインスピレーションを与えました');

-- 更新日時の自動更新用トリガー関数
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  NEW.updated_at = timezone('utc'::text, now());
  return NEW;
end;
$$;

-- 更新日時自動更新トリガー
create trigger update_notifications_updated_at before update on public.notifications for each row execute function public.update_updated_at_column();
create trigger update_notification_settings_updated_at before update on public.notification_settings for each row execute function public.update_updated_at_column();
create trigger update_notification_templates_updated_at before update on public.notification_templates for each row execute function public.update_updated_at_column();
create trigger update_notification_stats_updated_at before update on public.notification_stats for each row execute function public.update_updated_at_column();

-- コメント追加
comment on table public.notifications is '通知管理テーブル';
comment on table public.notification_settings is 'ユーザー別通知設定';
comment on table public.notification_templates is '通知テンプレート管理';
comment on table public.notification_stats is '通知送信統計';
comment on function public.create_notification is 'カスタム通知作成関数';
comment on function public.notify_inspiration_created is 'インスピレーション作成時の自動通知関数';