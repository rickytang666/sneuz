// fails loudly and by name instead of as an opaque error deep inside a client
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. See web/.env.example.`,
    );
  }
  return value;
}

export const DATABASE_URL = () => requireEnv("DATABASE_URL");
export const GOOGLE_CLIENT_ID = () => requireEnv("GOOGLE_CLIENT_ID");
export const GOOGLE_CLIENT_SECRET = () => requireEnv("GOOGLE_CLIENT_SECRET");
