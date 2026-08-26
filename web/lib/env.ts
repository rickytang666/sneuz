// fails loudly and by name, a missing supabase variable used to surface as an
// opaque "URL and Key are required" error from the client constructor
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. See web/.env.example.`,
    );
  }
  return value;
}

export const SUPABASE_URL = () => requireEnv("NEXT_PUBLIC_SUPABASE_URL");
export const SUPABASE_ANON_KEY = () =>
  requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
export const SUPABASE_SERVICE_ROLE_KEY = () =>
  requireEnv("SUPABASE_SERVICE_ROLE_KEY");
