-- Carnet Rose Supabase schema.
-- Copy this file into Supabase SQL Editor and run it manually.
-- Safe to run multiple times. It does not delete tables or data.
-- Do not commit real credentials.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_id text not null,
  name text not null,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (user_id, local_id)
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  local_id text not null,
  class_local_id text,
  first_name text not null,
  last_name text not null,
  merits integer not null default 0,
  detentions integer not null default 0,
  current_term integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (user_id, local_id)
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  student_id uuid references public.students(id) on delete set null,
  local_id text not null,
  student_local_id text,
  event_type text not null,
  reason text,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (user_id, local_id)
);

create table if not exists public.term_archives (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_id text not null,
  term integer not null,
  total_students integer not null default 0,
  total_merits integer not null default 0,
  total_detentions integer not null default 0,
  payload jsonb not null default '{}'::jsonb,
  archived_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (user_id, local_id)
);

create table if not exists public.sync_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_id text not null,
  device_id text,
  entity_name text not null,
  last_pulled_at timestamptz,
  last_pushed_at timestamptz,
  cursor_value text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (user_id, local_id)
);

alter table public.sync_state
  add column if not exists last_used_at timestamptz;

alter table public.classes
  add column if not exists last_used_at timestamptz;

alter table public.students
  add column if not exists ticks integer not null default 0,
  add column if not exists crosses integer not null default 0,
  add column if not exists term integer not null default 1;

alter table public.events
  add column if not exists term integer not null default 1;

alter table public.term_archives
  add column if not exists total_ticks integer not null default 0,
  add column if not exists total_crosses integer not null default 0;

create index if not exists classes_user_id_idx on public.classes(user_id);
create index if not exists students_user_id_idx on public.students(user_id);
create index if not exists students_class_id_idx on public.students(class_id);
create index if not exists events_user_id_idx on public.events(user_id);
create index if not exists events_student_id_idx on public.events(student_id);
create index if not exists term_archives_user_id_idx on public.term_archives(user_id);
create index if not exists sync_state_user_id_idx on public.sync_state(user_id);

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.events enable row level security;
alter table public.term_archives enable row level security;
alter table public.sync_state enable row level security;

drop policy if exists "profiles select own" on public.profiles;
drop policy if exists "profiles insert own" on public.profiles;
drop policy if exists "profiles update own" on public.profiles;
drop policy if exists "profiles delete own" on public.profiles;

drop policy if exists "classes select own" on public.classes;
drop policy if exists "classes insert own" on public.classes;
drop policy if exists "classes update own" on public.classes;
drop policy if exists "classes delete own" on public.classes;

drop policy if exists "students select own" on public.students;
drop policy if exists "students insert own" on public.students;
drop policy if exists "students update own" on public.students;
drop policy if exists "students delete own" on public.students;

drop policy if exists "events select own" on public.events;
drop policy if exists "events insert own" on public.events;
drop policy if exists "events update own" on public.events;
drop policy if exists "events delete own" on public.events;

drop policy if exists "term_archives select own" on public.term_archives;
drop policy if exists "term_archives insert own" on public.term_archives;
drop policy if exists "term_archives update own" on public.term_archives;
drop policy if exists "term_archives delete own" on public.term_archives;

drop policy if exists "sync_state select own" on public.sync_state;
drop policy if exists "sync_state insert own" on public.sync_state;
drop policy if exists "sync_state update own" on public.sync_state;
drop policy if exists "sync_state delete own" on public.sync_state;

create policy "profiles select own" on public.profiles for select using (auth.uid() = id);
create policy "profiles insert own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles update own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles delete own" on public.profiles for delete using (auth.uid() = id);

create policy "classes select own" on public.classes for select using (auth.uid() = user_id);
create policy "classes insert own" on public.classes for insert with check (auth.uid() = user_id);
create policy "classes update own" on public.classes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "classes delete own" on public.classes for delete using (auth.uid() = user_id);

create policy "students select own" on public.students for select using (auth.uid() = user_id);
create policy "students insert own" on public.students for insert with check (auth.uid() = user_id);
create policy "students update own" on public.students for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "students delete own" on public.students for delete using (auth.uid() = user_id);

create policy "events select own" on public.events for select using (auth.uid() = user_id);
create policy "events insert own" on public.events for insert with check (auth.uid() = user_id);
create policy "events update own" on public.events for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "events delete own" on public.events for delete using (auth.uid() = user_id);

create policy "term_archives select own" on public.term_archives for select using (auth.uid() = user_id);
create policy "term_archives insert own" on public.term_archives for insert with check (auth.uid() = user_id);
create policy "term_archives update own" on public.term_archives for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "term_archives delete own" on public.term_archives for delete using (auth.uid() = user_id);

create policy "sync_state select own" on public.sync_state for select using (auth.uid() = user_id);
create policy "sync_state insert own" on public.sync_state for insert with check (auth.uid() = user_id);
create policy "sync_state update own" on public.sync_state for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "sync_state delete own" on public.sync_state for delete using (auth.uid() = user_id);
