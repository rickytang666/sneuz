-- Make end_time nullable to support active sleep sessions
alter table public.sleep_sessions alter column end_time drop not null;

-- Remove the constraint that forces end_time >= start_time (temporarily or modify it)
-- Since end_time can be null, the check (end_time >= start_time) would verify to UNKNOWN which passes, 
-- but it's safer to ensure we understand the behavior.
-- Postgres CHECK constraints pass on NULL. So existing constraint:
-- constraint valid_end_time check (end_time >= start_time)
-- should be fine for NULL end_time.
