create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  key_hash text not null unique,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

alter table public.api_keys enable row level security;

create policy "Users can manage their own api keys"
  on public.api_keys
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index api_keys_user_id_idx on public.api_keys(user_id);
create index api_keys_key_hash_idx on public.api_keys(key_hash);

comment on table public.api_keys is 'Static API keys for external service authentication. Only the sha256 hash of the key is stored.';
comment on column public.api_keys.key_hash is 'sha256 hex digest of the raw key. Raw key is shown once at creation and never stored.';
comment on column public.api_keys.last_used_at is 'Updated on each successful authentication. Useful for identifying stale keys.';
