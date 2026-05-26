import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { hashApiKey } from "./keys";

function createServiceClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export function createClientFromToken(token: string): SupabaseClient {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      cookies: { getAll: () => [], setAll: () => {} },
    },
  );
}

type AuthResult =
  | { user: User; supabase: SupabaseClient; response: null }
  | { user: null; supabase: null; response: Response };

const unauthorized = () => ({
  user: null as null,
  supabase: null as null,
  response: new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  }),
});

async function authFromApiKey(key: string): Promise<AuthResult> {
  const serviceClient = createServiceClient();
  const hash = hashApiKey(key);

  const { data, error } = await serviceClient
    .from("api_keys")
    .select("id, user_id")
    .eq("key_hash", hash)
    .single();

  if (error || !data) return unauthorized();

  const {
    data: { user },
    error: userError,
  } = await serviceClient.auth.admin.getUserById(data.user_id);

  if (userError || !user) return unauthorized();

  // fire-and-forget — don't block the request
  serviceClient
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id)
    .then(() => {});

  return { user, supabase: serviceClient, response: null };
}

async function authFromBearer(token: string): Promise<AuthResult> {
  const supabase = createClientFromToken(token);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) return unauthorized();

  return { user, supabase, response: null };
}

export async function requireAuthFromHeader(
  request: Request,
): Promise<AuthResult> {
  const authHeader = request.headers.get("Authorization");

  if (authHeader?.startsWith("ApiKey ")) {
    return authFromApiKey(authHeader.slice(7));
  }

  if (authHeader?.startsWith("Bearer ")) {
    return authFromBearer(authHeader.slice(7));
  }

  return unauthorized();
}
