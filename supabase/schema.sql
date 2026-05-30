create extension if not exists "uuid-ossp";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists public.tokens (
  id uuid primary key default uuid_generate_v4(),
  address text not null unique,
  name text not null,
  symbol text not null,
  score integer not null check (score >= 0 and score <= 100),
  confidence text not null check (confidence in ('Low', 'Medium', 'High')),
  created_at timestamptz not null default now()
);

create table if not exists public.watchlists (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_id uuid not null references public.tokens(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, token_id)
);

create table if not exists public.feedback (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.tokens enable row level security;
alter table public.watchlists enable row level security;
alter table public.feedback enable row level security;

drop policy if exists "Users can view own profile" on public.users;
create policy "Users can view own profile"
  on public.users
  for select
  using (auth.uid() = id);

drop policy if exists "Users can upsert own profile" on public.users;
create policy "Users can upsert own profile"
  on public.users
  for insert
  with check (auth.uid() = id);

drop policy if exists "Authenticated users can read tokens" on public.tokens;
create policy "Authenticated users can read tokens"
  on public.tokens
  for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can upsert tokens" on public.tokens;
create policy "Authenticated users can upsert tokens"
  on public.tokens
  for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated users can update tokens" on public.tokens;
create policy "Authenticated users can update tokens"
  on public.tokens
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Users can view own watchlist" on public.watchlists;
create policy "Users can view own watchlist"
  on public.watchlists
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own watchlist" on public.watchlists;
create policy "Users can insert own watchlist"
  on public.watchlists
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own watchlist" on public.watchlists;
create policy "Users can delete own watchlist"
  on public.watchlists
  for delete
  using (auth.uid() = user_id);

drop policy if exists "Authenticated users can submit feedback" on public.feedback;
create policy "Authenticated users can submit feedback"
  on public.feedback
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Anonymous users can submit feedback" on public.feedback;
create policy "Anonymous users can submit feedback"
  on public.feedback
  for insert
  to anon
  with check (user_id is null);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();