-- Run this SQL in your Supabase SQL editor
-- Go to: supabase.com → your project → SQL Editor → New Query → paste this → Run

create table if not exists sessions (
  id uuid default gen_random_uuid() primary key,
  label text not null,
  created_at timestamp with time zone default now()
);

create table if not exists matches (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references sessions(id) on delete cascade,
  pair1 text[] not null,
  pair2 text[] not null,
  score1 integer not null,
  score2 integer not null,
  created_at timestamp with time zone default now()
);

create table if not exists members (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  created_at timestamp with time zone default now()
);

create table if not exists casual_players (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references sessions(id) on delete cascade,
  name text not null,
  paid boolean default false,
  created_at timestamp with time zone default now()
);

create table if not exists fnb_orders (
  id uuid default gen_random_uuid() primary key,
  player_name text not null,
  item text not null,
  quantity integer not null default 1,
  total_price integer not null,
  created_at timestamp with time zone default now()
);

-- Seed initial members
insert into members (name) values
  ('Khoa Đoàn'), ('Khoa BP'), ('Phát Kendo'), ('Hưng An Giang'),
  ('Nam Đa Khoa'), ('Dũng Gay'), ('Thông Data'), ('Bảnh KH Bao')
on conflict (name) do nothing;

-- Row level security
alter table sessions enable row level security;
alter table matches enable row level security;
alter table members enable row level security;
alter table casual_players enable row level security;
alter table fnb_orders enable row level security;

drop policy if exists "Allow all" on sessions;
drop policy if exists "Allow all" on matches;
drop policy if exists "Allow all" on members;
drop policy if exists "Allow all" on casual_players;
drop policy if exists "Allow all" on fnb_orders;

create policy "Allow all" on sessions for all using (true) with check (true);
create policy "Allow all" on matches for all using (true) with check (true);
create policy "Allow all" on members for all using (true) with check (true);
create policy "Allow all" on casual_players for all using (true) with check (true);
create policy "Allow all" on fnb_orders for all using (true) with check (true);
