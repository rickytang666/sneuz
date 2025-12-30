-- Update the trigger function to capture full_name from metadata
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name'
  );
  
  insert into public.user_settings (user_id)
  values (new.id);
  
  return new;
end;
$$ language plpgsql security definer;

-- Optional: Backfill existing profiles that have NULL full_name
-- This depends on having access to auth.users which migration runners usually do
do $$
begin
  update public.profiles
  set full_name = (
    select raw_user_meta_data->>'full_name' 
    from auth.users 
    where auth.users.id = public.profiles.id
  )
  where full_name is null;
end $$;
