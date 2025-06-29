-- 改良版インスピレーション・ラボ機能
-- より包括的で柔軟なインスピレーション管理システム

-- 1. 専用のインスピレーション記録テーブル
create table if not exists public.inspirations (
  id uuid default gen_random_uuid() primary key,
  source_post_id uuid references public.posts(id) on delete cascade not null,
  inspired_post_id uuid references public.posts(id) on delete cascade not null,
  creator_id uuid references auth.users(id) on delete cascade not null,
  inspiration_type text check (inspiration_type in ('direct', 'style', 'concept', 'technique', 'composition', 'mood')) default 'direct',
  inspiration_note text, -- インスピレーションの詳細説明
  chain_level integer default 1 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(source_post_id, inspired_post_id)
);

-- 2. インスピレーション・タグシステム
create table if not exists public.inspiration_tags (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  description text,
  color text default '#6366f1', -- UI表示用の色
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. インスピレーションとタグのリレーション
create table if not exists public.inspiration_tag_relations (
  id uuid default gen_random_uuid() primary key,
  inspiration_id uuid references public.inspirations(id) on delete cascade not null,
  tag_id uuid references public.inspiration_tags(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(inspiration_id, tag_id)
);

-- 4. インスピレーション・チャレンジ機能
create table if not exists public.inspiration_challenges (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  theme text not null,
  creator_id uuid references auth.users(id) on delete cascade not null,
  source_post_id uuid references public.posts(id) on delete set null,
  start_date timestamp with time zone not null,
  end_date timestamp with time zone not null,
  max_participants integer default 100,
  status text check (status in ('draft', 'active', 'completed', 'cancelled')) default 'draft',
  prize_info jsonb, -- 賞品や表彰の情報
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. チャレンジ参加記録
create table if not exists public.challenge_participations (
  id uuid default gen_random_uuid() primary key,
  challenge_id uuid references public.inspiration_challenges(id) on delete cascade not null,
  participant_id uuid references auth.users(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  submission_note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(challenge_id, participant_id, post_id)
);

-- 6. インスピレーション・ストーリー（連続性）
create table if not exists public.inspiration_stories (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  creator_id uuid references auth.users(id) on delete cascade not null,
  root_post_id uuid references public.posts(id) on delete cascade not null,
  is_public boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. ストーリーに属するインスピレーション
create table if not exists public.story_inspirations (
  id uuid default gen_random_uuid() primary key,
  story_id uuid references public.inspiration_stories(id) on delete cascade not null,
  inspiration_id uuid references public.inspirations(id) on delete cascade not null,
  sequence_order integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(story_id, inspiration_id),
  unique(story_id, sequence_order)
);

-- 8. インスピレーション統計
create table if not exists public.inspiration_stats (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null unique,
  inspiration_given_count integer default 0,
  inspiration_received_count integer default 0,
  chain_depth integer default 0, -- この投稿から派生した最大の深度
  last_updated timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. ユーザー間のインスピレーション・コラボレーション
create table if not exists public.inspiration_collaborations (
  id uuid default gen_random_uuid() primary key,
  inspiration_id uuid references public.inspirations(id) on delete cascade not null,
  collaborator_id uuid references auth.users(id) on delete cascade not null,
  role text check (role in ('mentor', 'peer', 'student')) default 'peer',
  message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. AIインスピレーション提案
create table if not exists public.ai_inspiration_suggestions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  suggested_post_id uuid references public.posts(id) on delete cascade not null,
  suggestion_reason text not null,
  similarity_score float check (similarity_score >= 0 and similarity_score <= 1),
  suggestion_type text check (suggestion_type in ('style_match', 'color_palette', 'composition', 'subject_matter', 'mood')) not null,
  is_viewed boolean default false,
  is_acted_upon boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS (Row Level Security) 設定
alter table public.inspirations enable row level security;
alter table public.inspiration_tags enable row level security;
alter table public.inspiration_tag_relations enable row level security;
alter table public.inspiration_challenges enable row level security;
alter table public.challenge_participations enable row level security;
alter table public.inspiration_stories enable row level security;
alter table public.story_inspirations enable row level security;
alter table public.inspiration_stats enable row level security;
alter table public.inspiration_collaborations enable row level security;
alter table public.ai_inspiration_suggestions enable row level security;

-- RLS ポリシー設定

-- inspirations テーブル
create policy "Anyone can view inspirations" on public.inspirations for select using (true);
create policy "Users can create inspirations for their posts" on public.inspirations 
for insert with check (auth.uid() = creator_id);
create policy "Users can update their inspirations" on public.inspirations 
for update using (auth.uid() = creator_id);

-- inspiration_tags テーブル
create policy "Anyone can view inspiration tags" on public.inspiration_tags for select using (true);
create policy "Authenticated users can create tags" on public.inspiration_tags 
for insert with check (auth.uid() is not null);

-- inspiration_tag_relations テーブル
create policy "Anyone can view tag relations" on public.inspiration_tag_relations for select using (true);
create policy "Users can create tag relations for their inspirations" on public.inspiration_tag_relations 
for insert with check (
  exists(select 1 from public.inspirations where id = inspiration_id and creator_id = auth.uid())
);

-- inspiration_challenges テーブル
create policy "Anyone can view active challenges" on public.inspiration_challenges 
for select using (status = 'active' or creator_id = auth.uid());
create policy "Users can create challenges" on public.inspiration_challenges 
for insert with check (auth.uid() = creator_id);
create policy "Users can update their challenges" on public.inspiration_challenges 
for update using (auth.uid() = creator_id);

-- challenge_participations テーブル
create policy "Anyone can view participations" on public.challenge_participations for select using (true);
create policy "Users can participate in challenges" on public.challenge_participations 
for insert with check (auth.uid() = participant_id);

-- inspiration_stories テーブル
create policy "Anyone can view public stories" on public.inspiration_stories 
for select using (is_public = true or creator_id = auth.uid());
create policy "Users can create stories" on public.inspiration_stories 
for insert with check (auth.uid() = creator_id);
create policy "Users can update their stories" on public.inspiration_stories 
for update using (auth.uid() = creator_id);

-- story_inspirations テーブル
create policy "Anyone can view story inspirations for public stories" on public.story_inspirations 
for select using (
  exists(select 1 from public.inspiration_stories where id = story_id and (is_public = true or creator_id = auth.uid()))
);

-- inspiration_stats テーブル
create policy "Anyone can view inspiration stats" on public.inspiration_stats for select using (true);

-- inspiration_collaborations テーブル
create policy "Anyone can view collaborations" on public.inspiration_collaborations for select using (true);
create policy "Users can create collaborations" on public.inspiration_collaborations 
for insert with check (auth.uid() = collaborator_id);

-- ai_inspiration_suggestions テーブル
create policy "Users can view their suggestions" on public.ai_inspiration_suggestions 
for select using (auth.uid() = user_id);
create policy "System can create suggestions" on public.ai_inspiration_suggestions 
for insert with check (true); -- システムによる自動生成のため

-- 便利な関数の作成

-- 1. インスピレーション・チェーンの深度計算
create or replace function public.get_inspiration_chain_depth(post_id uuid)
returns integer
language sql
security definer
as $$
  with recursive chain_depth as (
    select source_post_id, inspired_post_id, 1 as depth
    from public.inspirations
    where source_post_id = post_id
    
    union all
    
    select i.source_post_id, i.inspired_post_id, cd.depth + 1
    from public.inspirations i
    join chain_depth cd on i.source_post_id = cd.inspired_post_id
    where cd.depth < 10 -- 無限ループ防止
  )
  select coalesce(max(depth), 0) from chain_depth;
$$;

-- 2. ユーザーのインスピレーション影響力スコア計算
create or replace function public.calculate_inspiration_influence_score(user_id uuid)
returns float
language sql
security definer
as $$
  select 
    coalesce(
      (sum(
        case 
          when i.chain_level = 1 then 10.0
          when i.chain_level = 2 then 5.0
          when i.chain_level = 3 then 2.0
          else 1.0
        end
      ) / nullif(count(*), 0)), 
      0.0
    )
  from public.inspirations i
  join public.posts p on p.id = i.source_post_id
  where p.author_id = user_id;
$$;

-- 3. 人気のインスピレーション元を取得
create or replace function public.get_trending_inspiration_sources(limit_count integer default 10)
returns table (
  post_id uuid,
  inspiration_count bigint,
  recent_inspiration_count bigint
)
language sql
security definer
as $$
  select 
    i.source_post_id as post_id,
    count(*) as inspiration_count,
    count(*) filter (where i.created_at >= now() - interval '7 days') as recent_inspiration_count
  from public.inspirations i
  group by i.source_post_id
  order by recent_inspiration_count desc, inspiration_count desc
  limit limit_count;
$$;

-- 4. インスピレーション統計の更新
create or replace function public.update_inspiration_stats()
returns trigger
language plpgsql
security definer
as $$
begin
  -- 元投稿の統計を更新
  insert into public.inspiration_stats (post_id, inspiration_given_count, chain_depth)
  values (
    NEW.source_post_id, 
    1, 
    public.get_inspiration_chain_depth(NEW.source_post_id)
  )
  on conflict (post_id) do update set
    inspiration_given_count = inspiration_stats.inspiration_given_count + 1,
    chain_depth = public.get_inspiration_chain_depth(NEW.source_post_id),
    last_updated = now();
  
  -- インスパイアされた投稿の統計を更新
  insert into public.inspiration_stats (post_id, inspiration_received_count)
  values (NEW.inspired_post_id, 1)
  on conflict (post_id) do update set
    inspiration_received_count = inspiration_stats.inspiration_received_count + 1,
    last_updated = now();
  
  return NEW;
end;
$$;

-- トリガーの設定
create trigger update_inspiration_stats_trigger
  after insert on public.inspirations
  for each row
  execute function public.update_inspiration_stats();

-- インデックスの作成（パフォーマンス向上）
create index if not exists idx_inspirations_source_post on public.inspirations(source_post_id);
create index if not exists idx_inspirations_inspired_post on public.inspirations(inspired_post_id);
create index if not exists idx_inspirations_creator on public.inspirations(creator_id);
create index if not exists idx_inspirations_type on public.inspirations(inspiration_type);
create index if not exists idx_inspirations_chain_level on public.inspirations(chain_level);
create index if not exists idx_inspirations_created_at on public.inspirations(created_at);

create index if not exists idx_inspiration_tags_name on public.inspiration_tags(name);
create index if not exists idx_inspiration_tag_relations_inspiration on public.inspiration_tag_relations(inspiration_id);
create index if not exists idx_inspiration_tag_relations_tag on public.inspiration_tag_relations(tag_id);

create index if not exists idx_inspiration_challenges_status on public.inspiration_challenges(status);
create index if not exists idx_inspiration_challenges_dates on public.inspiration_challenges(start_date, end_date);
create index if not exists idx_inspiration_challenges_creator on public.inspiration_challenges(creator_id);

create index if not exists idx_challenge_participations_challenge on public.challenge_participations(challenge_id);
create index if not exists idx_challenge_participations_participant on public.challenge_participations(participant_id);

create index if not exists idx_inspiration_stories_creator on public.inspiration_stories(creator_id);
create index if not exists idx_inspiration_stories_public on public.inspiration_stories(is_public);

create index if not exists idx_inspiration_stats_post on public.inspiration_stats(post_id);
create index if not exists idx_inspiration_stats_given_count on public.inspiration_stats(inspiration_given_count);

create index if not exists idx_ai_suggestions_user on public.ai_inspiration_suggestions(user_id);
create index if not exists idx_ai_suggestions_viewed on public.ai_inspiration_suggestions(is_viewed);
create index if not exists idx_ai_suggestions_type on public.ai_inspiration_suggestions(suggestion_type);

-- 初期データの挿入
insert into public.inspiration_tags (name, description, color) values
('写真術', '撮影技術やカメラワークに関するインスピレーション', '#3b82f6'),
('構図', '画面構成や被写体の配置に関するインスピレーション', '#10b981'),
('色彩', '色使いやトーンに関するインスピレーション', '#f59e0b'),
('ムード', '雰囲気や感情表現に関するインスピレーション', '#ef4444'),
('被写体', '撮影対象やテーマに関するインスピレーション', '#8b5cf6'),
('ライティング', '光の使い方や演出に関するインスピレーション', '#f97316'),
('ポストプロセス', '編集や加工技術に関するインスピレーション', '#06b6d4'),
('ストーリー', '物語性や表現力に関するインスピレーション', '#ec4899');

-- コメント追加
comment on table public.inspirations is 'インスピレーション記録の管理';
comment on table public.inspiration_tags is 'インスピレーション分類用のタグ';
comment on table public.inspiration_challenges is 'インスピレーション・チャレンジイベント';
comment on table public.inspiration_stories is 'インスピレーション・ストーリー（連続性）';
comment on table public.inspiration_stats is 'インスピレーション統計情報';
comment on table public.ai_inspiration_suggestions is 'AIによるインスピレーション提案';