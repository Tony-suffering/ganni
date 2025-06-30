-- AIコメンテーター本番環境用データベース初期化スクリプト
-- Supabase SQL Editorで実行してください

-- 1. Users table
create table if not exists public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  name text,
  avatar_url text,
  bio text,
  role text default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.users enable row level security;

create policy "Users can view all profiles" on public.users
  for select using (true);

create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

-- 2. Posts table
create table if not exists public.posts (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  image_url text not null,
  ai_description text,
  user_comment text,
  author_id uuid references public.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.posts enable row level security;

create policy "Posts are viewable by everyone" on public.posts
  for select using (true);

create policy "Users can create posts" on public.posts
  for insert with check (auth.uid() = author_id);

create policy "Users can update own posts" on public.posts
  for update using (auth.uid() = author_id);

create policy "Users can delete own posts" on public.posts
  for delete using (auth.uid() = author_id);

-- 3. Comments table
create table if not exists public.comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.comments enable row level security;

create policy "Comments are viewable by everyone" on public.comments
  for select using (true);

create policy "Authenticated users can create comments" on public.comments
  for insert with check (auth.uid() = user_id);

create policy "Users can update own comments" on public.comments
  for update using (auth.uid() = user_id);

create policy "Users can delete own comments" on public.comments
  for delete using (auth.uid() = user_id);

-- 4. Likes table
create table if not exists public.likes (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(post_id, user_id)
);

alter table public.likes enable row level security;

create policy "Likes are viewable by everyone" on public.likes
  for select using (true);

create policy "Authenticated users can create likes" on public.likes
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own likes" on public.likes
  for delete using (auth.uid() = user_id);

-- 5. Notifications table
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  recipient_id uuid references public.users(id) on delete cascade not null,
  sender_id uuid references public.users(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  type text not null check (type in ('like', 'comment', 'follow', 'ai_comment')),
  message text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.notifications enable row level security;

create policy "Users can view own notifications" on public.notifications
  for select using (auth.uid() = recipient_id);

create policy "Users can update own notifications" on public.notifications
  for update using (auth.uid() = recipient_id);

-- 6. AI Comments table
create table if not exists public.ai_comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  type text not null check (type in ('comment', 'question', 'observation')),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.ai_comments enable row level security;

create policy "AI comments are viewable by everyone" on public.ai_comments
  for select using (true);

create policy "Only authenticated users can create AI comments" on public.ai_comments
  for insert with check (auth.uid() is not null);

-- 7. Push subscriptions table
create table if not exists public.push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  endpoint text not null,
  p256dh_key text not null,
  auth_key text not null,
  device_type text check (device_type in ('desktop', 'mobile')) default 'desktop',
  user_agent text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, endpoint)
);

alter table public.push_subscriptions enable row level security;

create policy "Users can view own push subscriptions" on public.push_subscriptions
  for select using (auth.uid() = user_id);

create policy "Users can insert own push subscriptions" on public.push_subscriptions
  for insert with check (auth.uid() = user_id);

create policy "Users can update own push subscriptions" on public.push_subscriptions
  for update using (auth.uid() = user_id);

create policy "Users can delete own push subscriptions" on public.push_subscriptions
  for delete using (auth.uid() = user_id);

-- 8. Bookmarks table
create table if not exists public.bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, post_id)
);

alter table public.bookmarks enable row level security;

create policy "Users can view own bookmarks" on public.bookmarks
  for select using (auth.uid() = user_id);

create policy "Users can create own bookmarks" on public.bookmarks
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own bookmarks" on public.bookmarks
  for delete using (auth.uid() = user_id);

-- インデックス作成（パフォーマンス向上）
create index if not exists idx_posts_author_id on public.posts(author_id);
create index if not exists idx_posts_created_at on public.posts(created_at desc);
create index if not exists idx_comments_post_id on public.comments(post_id);
create index if not exists idx_likes_post_id on public.likes(post_id);
create index if not exists idx_likes_user_id on public.likes(user_id);
create index if not exists idx_notifications_recipient_id on public.notifications(recipient_id);
create index if not exists idx_notifications_unread on public.notifications(recipient_id, is_read) where is_read = false;
create index if not exists idx_ai_comments_post_id on public.ai_comments(post_id);
create index if not exists idx_push_subscriptions_user_id on public.push_subscriptions(user_id);
create index if not exists idx_push_subscriptions_active on public.push_subscriptions(is_active) where is_active = true;
create index if not exists idx_bookmarks_user_id on public.bookmarks(user_id);
create index if not exists idx_bookmarks_post_id on public.bookmarks(post_id);
create index if not exists idx_bookmarks_created_at on public.bookmarks(created_at desc);

-- 成功メッセージ
select 'データベース初期化が完了しました！🎉' as status;