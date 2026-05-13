create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_id text not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique(user_id, local_id)
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  local_id text not null,
  local_class_id text not null,
  first_name text not null,
  last_name text not null,
  ticks integer not null default 0,
  crosses integer not null default 0,
  merits integer not null default 0,
  detentions integer not null default 0,
  current_term integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique(user_id, local_id)
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  student_id uuid references public.students(id) on delete set null,
  local_id text not null,
  local_student_id text not null,
  type text not null check (type in ('tick', 'croix')),
  reason text,
  term integer not null,
  previous_ticks integer not null,
  previous_crosses integer not null,
  new_ticks integer not null,
  new_crosses integer not null,
  cancelled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique(user_id, local_id)
);

create table if not exists public.term_archives (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  student_id uuid references public.students(id) on delete set null,
  local_id text not null,
  local_student_id text not null,
  term integer not null,
  merits integer not null,
  detentions integer not null,
  total_ticks integer not null,
  total_crosses integer not null,
  archived_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique(user_id, local_id)
);

create table if not exists public.sync_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id text not null,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, device_id)
);

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.events enable row level security;
alter table public.term_archives enable row level security;
alter table public.sync_state enable row level security;

create policy "profiles own rows" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "classes own rows" on public.classes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "students own rows" on public.students for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "events own rows" on public.events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "term_archives own rows" on public.term_archives for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "sync_state own rows" on public.sync_state for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

