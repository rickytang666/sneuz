-- Create a unique partial index to ensure only one active sleep session (end_time is null) per user
CREATE UNIQUE INDEX one_active_session_per_user 
ON public.sleep_sessions (user_id) 
WHERE end_time IS NULL;
