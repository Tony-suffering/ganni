-- インスピレーション・リレー機能のためのデータベース拡張

-- bookmarksテーブルにinspiration_source_idカラムを追加
alter table public.bookmarks 
add column inspiration_source_id uuid references public.posts(id) on delete set null;

-- インスピレーション・チェーンを管理するためのテーブル作成
create table if not exists public.inspiration_chains (
  id uuid default gen_random_uuid() primary key,
  original_post_id uuid references public.posts(id) on delete cascade not null,
  inspired_post_id uuid references public.posts(id) on delete cascade not null,
  chain_level integer default 1 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(original_post_id, inspired_post_id)
);

-- inspiration_chainsテーブルのRLS設定
alter table public.inspiration_chains enable row level security;

-- 誰でも読み取り可能
create policy "Anyone can view inspiration chains" on public.inspiration_chains for select using (true);

-- 認証済みユーザーが作成可能（自分の投稿に関連する場合のみ）
create policy "Users can create inspiration chains for their posts" on public.inspiration_chains 
for insert with check (
  auth.uid() is not null and (
    exists(select 1 from public.posts where id = inspired_post_id and author_id = auth.uid())
  )
);

-- インスピレーション・チェーンの深度を追跡するための関数
create or replace function public.calculate_inspiration_chain_level(source_post_id uuid)
returns integer
language sql
security definer
as $$
  select coalesce(
    (select max(chain_level) + 1 
     from public.inspiration_chains 
     where original_post_id = source_post_id), 
    1
  );
$$;

-- インスピレーション・チェーンを自動作成するトリガー関数
create or replace function public.create_inspiration_chain()
returns trigger
language plpgsql
security definer
as $$
begin
  -- NEW.inspiration_source_idが設定されている場合のみ処理
  if NEW.inspiration_source_id is not null then
    -- inspiration_chainsテーブルに新しいレコードを作成
    insert into public.inspiration_chains (
      original_post_id,
      inspired_post_id,
      chain_level
    ) values (
      NEW.inspiration_source_id,
      (select post_id from public.bookmarks where id = NEW.id),
      public.calculate_inspiration_chain_level(NEW.inspiration_source_id)
    );
  end if;
  
  return NEW;
end;
$$;

-- bookmarksテーブルにインスピレーション・チェーン作成トリガーを追加
create trigger inspiration_chain_trigger
  after insert on public.bookmarks
  for each row
  execute function public.create_inspiration_chain();

-- インデックスの作成（パフォーマンス向上のため）
create index if not exists idx_bookmarks_inspiration_source on public.bookmarks(inspiration_source_id);
create index if not exists idx_inspiration_chains_original on public.inspiration_chains(original_post_id);
create index if not exists idx_inspiration_chains_inspired on public.inspiration_chains(inspired_post_id);
create index if not exists idx_inspiration_chains_level on public.inspiration_chains(chain_level);

-- コメント追加
comment on column public.bookmarks.inspiration_source_id is 'インスピレーション元の投稿ID';
comment on table public.inspiration_chains is 'インスピレーション・チェーンの追跡';
comment on column public.inspiration_chains.chain_level is 'チェーンの深度（1が最初のインスピレーション）';