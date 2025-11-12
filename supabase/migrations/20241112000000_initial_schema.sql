-- Initial schema for Sleep Tracker
-- Creates profiles, sleep_sessions, and user_settings tables with RLS policies

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
-- Extends auth.users with app-specific profile data
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- RLS Policies for profiles
create policy "Users can view their own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles
  for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

-- ============================================================================
-- SLEEP SESSIONS TABLE
-- ============================================================================
create table public.sleep_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  source text not null default 'manual',
  updated_at timestamptz not null,
  
  -- Constraints
  constraint valid_end_time check (end_time >= start_time),
  constraint valid_source check (source in ('manual', 'widget', 'shortcut'))
);

-- Enable RLS
alter table public.sleep_sessions enable row level security;

-- RLS Policies for sleep_sessions
create policy "Users can view their own sleep sessions"
  on public.sleep_sessions
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own sleep sessions"
  on public.sleep_sessions
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own sleep sessions"
  on public.sleep_sessions
  for update
  using (auth.uid() = user_id);

create policy "Users can delete their own sleep sessions"
  on public.sleep_sessions
  for delete
  using (auth.uid() = user_id);

-- Indexes for performance
create index sleep_sessions_user_id_idx on public.sleep_sessions(user_id);
create index sleep_sessions_start_time_idx on public.sleep_sessions(start_time desc);
create index sleep_sessions_user_start_idx on public.sleep_sessions(user_id, start_time desc);

-- ============================================================================
-- USER SETTINGS TABLE
-- ============================================================================
create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  target_hours decimal(3,1) not null default 8.0,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- Constraints
  constraint valid_target_hours check (target_hours > 0 and target_hours <= 24)
);

-- Enable RLS
alter table public.user_settings enable row level security;

-- RLS Policies for user_settings
create policy "Users can view their own settings"
  on public.user_settings
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own settings"
  on public.user_settings
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own settings"
  on public.user_settings
  for update
  using (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to automatically update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at (profiles and user_settings)
create trigger set_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.user_settings
  for each row
  execute function public.handle_updated_at();

-- Special function for sleep_sessions: set updated_at to end_time on insert, now() on update
create or replace function public.handle_sleep_session_updated_at()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    new.updated_at = new.end_time;
  elsif TG_OP = 'UPDATE' then
    new.updated_at = now();
  end if;
  return new;
end;
$$ language plpgsql;

-- Trigger for sleep_sessions updated_at
create trigger set_sleep_session_updated_at
  before insert or update on public.sleep_sessions
  for each row
  execute function public.handle_sleep_session_updated_at();

-- Function to create profile and settings on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  
  insert into public.user_settings (user_id)
  values (new.id);
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to auto-create profile and settings when user signs up
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ============================================================================
-- COMMENTS (for documentation)
-- ============================================================================

comment on table public.profiles is 'User profiles extending auth.users';
comment on table public.sleep_sessions is 'Sleep tracking sessions with start and end times';
comment on table public.user_settings is 'User preferences and settings';

comment on column public.sleep_sessions.source is 'How the session was created: manual, widget, or shortcut';
comment on column public.user_settings.target_hours is 'Target sleep hours per night (for future sleep debt calculation)';
comment on column public.user_settings.timezone is 'User timezone for display purposes';

