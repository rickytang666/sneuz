export interface UserProfile {
  id: string;
  email: string | undefined;
  full_name: string;
  avatar_url: string;
}

export interface LinkedIdentity {
  id: string;
  provider: string;
  email?: string;
}

export interface SleepSession {
  id: string;
  bedtime: string;
  wake_time: string | null;
  duration_minutes: number | null;
  created_at: string;
}

export interface UserSettings {
  target_bedtime: string;
  target_wake_time: string;
  // IANA zone. the column defaults to "UTC", which means nobody picked one
  timezone: string;
}
