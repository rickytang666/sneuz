"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

// throwaway page to exercise better auth before the real login is ported
export default function SpikePage() {
  const { data: session, isPending } = authClient.useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function signUp(event: React.FormEvent) {
    event.preventDefault();
    const { error } = await authClient.signUp.email({
      email,
      password,
      name: email.split("@")[0],
    });
    setError(error?.message ?? null);
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-8">
      <h1 className="font-semibold text-xl">better auth spike</h1>
      <pre className="overflow-x-auto rounded bg-muted p-3 text-xs">
        {isPending ? "loading" : JSON.stringify(session?.user ?? null, null, 2)}
      </pre>
      <button
        type="button"
        className="rounded border p-2"
        onClick={() =>
          authClient.signIn.social({
            provider: "google",
            callbackURL: "/spike",
          })
        }
      >
        sign in with google
      </button>
      <form onSubmit={signUp} className="flex flex-col gap-2">
        <input
          className="rounded border p-2"
          type="email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="rounded border p-2"
          type="password"
          placeholder="password (8+ chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="rounded border p-2">
          sign up with email
        </button>
      </form>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {session && (
        <button
          type="button"
          className="rounded border p-2"
          onClick={() => authClient.signOut()}
        >
          sign out
        </button>
      )}
    </main>
  );
}
