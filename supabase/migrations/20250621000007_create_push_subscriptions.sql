-- プッシュ通知購読情報を保存するテーブル
create table public.push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  endpoint text not null,
  p256dh_key text not null,
  auth_key text not null,
  device_type text check (device_type in ('desktop', 'mobile')) default 'desktop',
  user_agent text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- 同一ユーザー・同一エンドポイントの重複を防ぐ
  unique(user_id, endpoint)
);

-- RLS (Row Level Security) を有効化
alter table public.push_subscriptions enable row level security;

-- ユーザーは自分の購読情報のみアクセス可能
create policy "Users can view own push subscriptions" on public.push_subscriptions
  for select using (auth.uid() = user_id);

create policy "Users can insert own push subscriptions" on public.push_subscriptions
  for insert with check (auth.uid() = user_id);

create policy "Users can update own push subscriptions" on public.push_subscriptions
  for update using (auth.uid() = user_id);

create policy "Users can delete own push subscriptions" on public.push_subscriptions
  for delete using (auth.uid() = user_id);

-- インデックスの作成
create index idx_push_subscriptions_user_id on public.push_subscriptions(user_id);
create index idx_push_subscriptions_active on public.push_subscriptions(is_active) where is_active = true;
create index idx_push_subscriptions_endpoint on public.push_subscriptions(endpoint);

-- updated_at の自動更新
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_push_subscriptions_updated_at
  before update on public.push_subscriptions
  for each row execute function public.update_updated_at_column();