import { describe, expect, it, vi } from "vitest";
import { requireAuthFromHeader } from "./auth";

// mock supabase clients so we don't hit the network
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi
        .fn()
        .mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
    },
  })),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: "key-id", user_id: "user-1" },
        error: null,
      }),
      update: vi.fn().mockReturnThis(),
      // biome-ignore lint/suspicious/noThenProperty: the supabase query builder is thenable, the mock has to be too
      then: vi.fn(),
    })),
    auth: {
      admin: {
        getUserById: vi
          .fn()
          .mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
      },
    },
  })),
}));

function makeRequest(authHeader?: string): Request {
  const headers: HeadersInit = authHeader ? { Authorization: authHeader } : {};
  return new Request("http://localhost/api/v1/sessions", { headers });
}

describe("requireAuthFromHeader", () => {
  it("returns 401 when Authorization header is missing", async () => {
    const result = await requireAuthFromHeader(makeRequest());
    expect(result.response?.status).toBe(401);
    expect(result.user).toBeNull();
  });

  it("returns 401 for unrecognized scheme", async () => {
    const result = await requireAuthFromHeader(makeRequest("Basic abc123"));
    expect(result.response?.status).toBe(401);
  });

  it("routes Bearer token to jwt auth", async () => {
    const result = await requireAuthFromHeader(
      makeRequest("Bearer fake-jwt-token"),
    );
    expect(result.response).toBeNull();
    expect(result.user?.id).toBe("user-1");
  });

  it("routes ApiKey to api key auth", async () => {
    const result = await requireAuthFromHeader(
      makeRequest("ApiKey snz_abc123"),
    );
    expect(result.response).toBeNull();
    expect(result.user?.id).toBe("user-1");
  });

  it("401 response body contains error field", async () => {
    const result = await requireAuthFromHeader(makeRequest());
    const body = await result.response?.json();
    expect(body).toHaveProperty("error");
  });

  it("401 response has JSON content-type", async () => {
    const result = await requireAuthFromHeader(makeRequest());
    expect(result.response?.headers.get("Content-Type")).toBe(
      "application/json",
    );
  });
});
