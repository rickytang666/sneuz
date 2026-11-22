import type { Session, Settings, SneuzApi } from "./api";

// the api caps one page of sessions at this many
const PAGE_SIZE = 1000;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export function createHttpApi(
  baseUrl: string,
  apiKey: string,
): SneuzApi & {
  getProfile(): Promise<{ email: string }>;
} {
  async function request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    let res: Response;
    try {
      res = await fetch(new URL(path, baseUrl), {
        method,
        headers: {
          Authorization: `ApiKey ${apiKey}`,
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (cause) {
      throw new ApiError(
        `can't reach ${baseUrl} (${(cause as Error).message})`,
        0,
      );
    }
    if (res.status === 204) return undefined as T;

    const payload = (await res.json().catch(() => ({}))) as {
      data?: T;
      error?: string;
    };
    if (!res.ok) {
      const reason =
        res.status === 401
          ? "the api key was rejected; run `sneuz login`"
          : (payload.error ?? `request failed with ${res.status}`);
      throw new ApiError(reason, res.status);
    }
    // a 2xx without the envelope means SNEUZ_API_URL points at something that isn't sneuz
    if (
      typeof payload !== "object" ||
      payload === null ||
      !("data" in payload)
    ) {
      throw new ApiError(`unexpected response from ${baseUrl}`, res.status);
    }
    return payload.data as T;
  }

  const times = (bedtime: Date, wake: Date) => ({
    bedtime: bedtime.toISOString(),
    wake_time: wake.toISOString(),
  });

  return {
    async listSessions() {
      const sessions: Session[] = [];
      for (let offset = 0; ; offset += PAGE_SIZE) {
        const page = await request<Session[]>(
          "GET",
          `/api/v1/sessions?limit=${PAGE_SIZE}&offset=${offset}`,
        );
        sessions.push(...page);
        if (page.length < PAGE_SIZE) return sessions;
      }
    },
    createSession: (bedtime, wake) =>
      request<Session>("POST", "/api/v1/sessions", times(bedtime, wake)),
    updateSession: (id, bedtime, wake) =>
      request<Session>(
        "PATCH",
        `/api/v1/sessions/${encodeURIComponent(id)}`,
        times(bedtime, wake),
      ),
    deleteSession: (id) =>
      request<void>("DELETE", `/api/v1/sessions/${encodeURIComponent(id)}`),
    getSettings: () => request<Settings>("GET", "/api/v1/settings"),
    getProfile: () => request<{ email: string }>("GET", "/api/v1/profile"),
  };
}
