-- Add bedtime and wake_time columns, drop target_hours
ALTER TABLE public.user_settings 
ADD COLUMN target_bedtime time DEFAULT '23:00' NOT NULL,
ADD COLUMN target_wake_time time DEFAULT '07:00' NOT NULL;

-- Only drop target_hours after we are sure, but for this task we will just ignore it in code or drop it.
-- Let's drop it to be clean as requested.
ALTER TABLE public.user_settings
DROP COLUMN target_hours;

-- Update comments
COMMENT ON COLUMN public.user_settings.target_bedtime IS 'Target bedtime for sleep goal calculation';
COMMENT ON COLUMN public.user_settings.target_wake_time IS 'Target wake time for sleep goal calculation';
