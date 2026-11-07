-- ported from supabase/migrations, plain postgres with no supabase dependencies
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
--> statement-breakpoint
create trigger set_updated_at
  before update on user_settings
  for each row
  execute function handle_updated_at();
--> statement-breakpoint
-- insert stamps a finished session with its end_time, an active one with now(); update always uses now()
create or replace function handle_sleep_session_updated_at()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    if new.end_time is not null then
      new.updated_at = new.end_time;
    else
      new.updated_at = now();
    end if;
  elsif tg_op = 'UPDATE' then
    new.updated_at = now();
  end if;
  return new;
end;
$$ language plpgsql;
--> statement-breakpoint
create trigger set_sleep_session_updated_at
  before insert or update on sleep_sessions
  for each row
  execute function handle_sleep_session_updated_at();
