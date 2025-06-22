-- プッシュ通知送信用の関数
create or replace function public.send_push_notification(
  target_user_id uuid,
  notification_title text,
  notification_body text,
  notification_type text default 'general',
  notification_url text default '/',
  additional_data jsonb default '{}'::jsonb
)
returns boolean as $$
declare
  function_url text;
  payload jsonb;
  response record;
begin
  -- Edge Function のURL（本番環境では適切なURLに変更）
  function_url := 'https://your-project.supabase.co/functions/v1/sendPushNotification';
  
  -- ペイロードの作成
  payload := jsonb_build_object(
    'user_id', target_user_id,
    'notification', jsonb_build_object(
      'title', notification_title,
      'body', notification_body,
      'url', notification_url,
      'data', additional_data
    ),
    'type', notification_type
  );

  -- Edge Functionを呼び出し（HTTP拡張が必要）
  -- 実際の実装では、キューシステムやバックグラウンドジョブを使用することを推奨
  -- ここでは簡単な例として記載
  
  return true;
end;
$$ language plpgsql security definer;

-- ライクが追加された時のトリガー関数
create or replace function public.handle_like_notification()
returns trigger as $$
declare
  post_owner_id uuid;
  post_title text;
  liker_name text;
begin
  -- 投稿の所有者を取得
  select author_id, title into post_owner_id, post_title
  from public.posts 
  where id = NEW.post_id;
  
  -- ライクした人の名前を取得
  select name into liker_name
  from public.users 
  where id = NEW.user_id;
  
  -- 自分の投稿に自分でライクした場合は通知しない
  if post_owner_id != NEW.user_id then
    -- 通知テーブルに挿入
    insert into public.notifications (
      recipient_id,
      sender_id,
      post_id,
      type,
      message,
      is_read
    ) values (
      post_owner_id,
      NEW.user_id,
      NEW.post_id,
      'like',
      liker_name || 'さんがあなたの投稿「' || post_title || '」にライクしました',
      false
    );
    
    -- プッシュ通知を送信
    perform public.send_push_notification(
      post_owner_id,
      '新しいライク！',
      liker_name || 'さんがあなたの投稿にライクしました',
      'like',
      '/posts/' || NEW.post_id,
      jsonb_build_object('post_id', NEW.post_id, 'liker_id', NEW.user_id)
    );
  end if;
  
  return NEW;
end;
$$ language plpgsql security definer;

-- コメントが追加された時のトリガー関数
create or replace function public.handle_comment_notification()
returns trigger as $$
declare
  post_owner_id uuid;
  post_title text;
  commenter_name text;
begin
  -- 投稿の所有者を取得
  select author_id, title into post_owner_id, post_title
  from public.posts 
  where id = NEW.post_id;
  
  -- コメントした人の名前を取得
  select name into commenter_name
  from public.users 
  where id = NEW.user_id;
  
  -- 自分の投稿に自分でコメントした場合は通知しない
  if post_owner_id != NEW.user_id then
    -- 通知テーブルに挿入
    insert into public.notifications (
      recipient_id,
      sender_id,
      post_id,
      type,
      message,
      is_read
    ) values (
      post_owner_id,
      NEW.user_id,
      NEW.post_id,
      'comment',
      commenter_name || 'さんがあなたの投稿「' || post_title || '」にコメントしました',
      false
    );
    
    -- プッシュ通知を送信
    perform public.send_push_notification(
      post_owner_id,
      '新しいコメント！',
      commenter_name || 'さんがあなたの投稿にコメントしました',
      'comment',
      '/posts/' || NEW.post_id,
      jsonb_build_object('post_id', NEW.post_id, 'commenter_id', NEW.user_id)
    );
  end if;
  
  return NEW;
end;
$$ language plpgsql security definer;

-- AIコメントが追加された時のトリガー関数
create or replace function public.handle_ai_comment_notification()
returns trigger as $$
declare
  post_owner_id uuid;
  post_title text;
begin
  -- AIコメントの場合のみ処理
  if NEW.type in ('comment', 'question', 'observation') then
    -- 投稿の所有者を取得
    select author_id, title into post_owner_id, post_title
    from public.posts 
    where id = NEW.post_id;
    
    -- AIコメント通知を送信
    perform public.send_push_notification(
      post_owner_id,
      'AIからの新しい反応！',
      'あなたの投稿「' || post_title || '」にAIが' || 
      case NEW.type 
        when 'comment' then 'コメント'
        when 'question' then '質問'
        when 'observation' then '観察'
      end || 'しました',
      'ai_comment',
      '/posts/' || NEW.post_id,
      jsonb_build_object('post_id', NEW.post_id, 'ai_comment_type', NEW.type)
    );
  end if;
  
  return NEW;
end;
$$ language plpgsql security definer;

-- トリガーの作成
create trigger on_like_created
  after insert on public.likes
  for each row execute function public.handle_like_notification();

create trigger on_comment_created
  after insert on public.comments
  for each row execute function public.handle_comment_notification();

create trigger on_ai_comment_created
  after insert on public.ai_comments
  for each row execute function public.handle_ai_comment_notification();