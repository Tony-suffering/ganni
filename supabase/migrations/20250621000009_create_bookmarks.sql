-- ブックマーク機能用テーブル作成
create table if not exists public.bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- 同一ユーザー・同一投稿の重複ブックマークを防ぐ
  unique(user_id, post_id)
);

-- RLS (Row Level Security) を有効化
alter table public.bookmarks enable row level security;

-- ユーザーは自分のブックマークのみアクセス可能
create policy "Users can view own bookmarks" on public.bookmarks
  for select using (auth.uid() = user_id);

create policy "Users can create own bookmarks" on public.bookmarks
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own bookmarks" on public.bookmarks
  for delete using (auth.uid() = user_id);

-- インデックスの作成（パフォーマンス向上）
create index idx_bookmarks_user_id on public.bookmarks(user_id);
create index idx_bookmarks_post_id on public.bookmarks(post_id);
create index idx_bookmarks_created_at on public.bookmarks(created_at desc);