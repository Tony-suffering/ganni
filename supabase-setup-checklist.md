# 📋 Supabaseセットアップチェックリスト

## 1. プロジェクト情報
- [ ] プロジェクト作成完了
- [ ] プロジェクト名: ai-commentator-prod
- [ ] リージョン: Tokyo (ap-northeast-1)
- [ ] データベースパスワード保存済み

## 2. 接続情報取得
Settings > API から以下をコピー：

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## 3. データベーステーブル作成手順

### A. SQL Editorでマイグレーション実行

以下のSQLを順番に実行してください：

#### 1. ユーザーテーブル作成
```sql
-- Users table
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  name text,
  avatar_url text,
  bio text,
  role text default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS enable
alter table public.users enable row level security;

-- Policies
create policy "Users can view all profiles" on public.users
  for select using (true);

create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);
```

#### 2. 投稿テーブル作成
```sql
-- Posts table
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  image_url text not null,
  ai_description text,
  user_comment text,
  author_id uuid references public.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS enable
alter table public.posts enable row level security;

-- Policies
create policy "Posts are viewable by everyone" on public.posts
  for select using (true);

create policy "Users can create posts" on public.posts
  for insert with check (auth.uid() = author_id);

create policy "Users can update own posts" on public.posts
  for update using (auth.uid() = author_id);

create policy "Users can delete own posts" on public.posts
  for delete using (auth.uid() = author_id);
```

#### 3. コメントテーブル作成
```sql
-- Comments table
create table public.comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS enable
alter table public.comments enable row level security;

-- Policies
create policy "Comments are viewable by everyone" on public.comments
  for select using (true);

create policy "Authenticated users can create comments" on public.comments
  for insert with check (auth.uid() = user_id);

create policy "Users can update own comments" on public.comments
  for update using (auth.uid() = user_id);

create policy "Users can delete own comments" on public.comments
  for delete using (auth.uid() = user_id);
```

#### 4. ライクテーブル作成
```sql
-- Likes table
create table public.likes (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(post_id, user_id)
);

-- RLS enable
alter table public.likes enable row level security;

-- Policies
create policy "Likes are viewable by everyone" on public.likes
  for select using (true);

create policy "Authenticated users can create likes" on public.likes
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own likes" on public.likes
  for delete using (auth.uid() = user_id);
```

#### 5. 通知テーブル作成
```sql
-- Notifications table
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  recipient_id uuid references public.users(id) on delete cascade not null,
  sender_id uuid references public.users(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  type text not null check (type in ('like', 'comment', 'follow', 'ai_comment')),
  message text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS enable
alter table public.notifications enable row level security;

-- Policies
create policy "Users can view own notifications" on public.notifications
  for select using (auth.uid() = recipient_id);

create policy "Users can update own notifications" on public.notifications
  for update using (auth.uid() = recipient_id);
```

#### 6. AIコメントテーブル作成
```sql
-- AI Comments table
create table public.ai_comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  type text not null check (type in ('comment', 'question', 'observation')),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS enable
alter table public.ai_comments enable row level security;

-- Policies
create policy "AI comments are viewable by everyone" on public.ai_comments
  for select using (true);

create policy "Only authenticated users can create AI comments" on public.ai_comments
  for insert with check (auth.uid() is not null);
```

#### 7. プッシュ通知購読テーブル作成
```sql
-- Push subscriptions table
create table public.push_subscriptions (
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

-- RLS enable
alter table public.push_subscriptions enable row level security;

-- Policies
create policy "Users can view own push subscriptions" on public.push_subscriptions
  for select using (auth.uid() = user_id);

create policy "Users can insert own push subscriptions" on public.push_subscriptions
  for insert with check (auth.uid() = user_id);

create policy "Users can update own push subscriptions" on public.push_subscriptions
  for update using (auth.uid() = user_id);

create policy "Users can delete own push subscriptions" on public.push_subscriptions
  for delete using (auth.uid() = user_id);
```

## 4. Storage設定

### A. アバター画像用バケット作成
1. Storage > New bucket
2. バケット名: `avatars`
3. Public bucket: ✅ ON
4. File size limit: 5MB
5. Allowed MIME types: `image/*`

### B. 投稿画像用バケット作成
1. Storage > New bucket
2. バケット名: `posts`
3. Public bucket: ✅ ON
4. File size limit: 10MB
5. Allowed MIME types: `image/*`

## 5. 認証設定

### A. Email設定
1. Authentication > Settings
2. Site URL: あなたのドメイン（例: https://your-app.vercel.app）
3. Redirect URLs: 同上

### B. プロバイダー設定（オプション）
- Google OAuth
- GitHub OAuth
- その他のソーシャルログイン

## 6. セキュリティ確認

### A. RLS（Row Level Security）
- [ ] すべてのテーブルでRLS有効
- [ ] 適切なポリシー設定
- [ ] テストユーザーでアクセス確認

### B. API設定
- [ ] anon keyの取得
- [ ] service_role keyの安全な保管

## 7. 完了確認
- [ ] テーブル作成完了
- [ ] RLSポリシー設定完了
- [ ] Storage設定完了
- [ ] 接続情報取得完了

## 次のステップ
1. ローカル環境での接続テスト
2. Vercelでのデプロイ設定
3. Edge Functions設定