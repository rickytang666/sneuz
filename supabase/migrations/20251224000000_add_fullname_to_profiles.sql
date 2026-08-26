alter table public.profiles
add column if not exists full_name text;

comment on column public.profiles.full_name is 'User full name displayed in profile';
