CREATE OR REPLACE FUNCTION public.handle_sleep_session_updated_at()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- If end_time is provided (legacy behavior), use it.
    -- If end_time is NULL (active session), use current time.
    IF NEW.end_time IS NOT NULL THEN
      NEW.updated_at = NEW.end_time;
    ELSE
      NEW.updated_at = NOW();
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
