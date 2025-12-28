-- Enable RLS on profiles table
alter table profiles enable row level security;

-- Policy: Users can view their own profile
create policy "Users can view own profile" 
on profiles for select 
using (auth.uid() = id);

-- Policy: Users can update their own profile
create policy "Users can update own profile" 
on profiles for update 
using (auth.uid() = id);

-- Policy: Users can insert their own profile
create policy "Users can insert own profile" 
on profiles for insert 
with check (auth.uid() = id);
