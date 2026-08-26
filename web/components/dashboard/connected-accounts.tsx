"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { IconBrandGoogleFilled, IconMail } from "@tabler/icons-react";
import { linkGoogle, unlinkIdentity } from "@/lib/actions/identities";
import { LinkedIdentity } from "@/lib/types";

interface Props {
  initialIdentities: LinkedIdentity[];
}

export function ConnectedAccounts({ initialIdentities }: Props) {
  const [identities, setIdentities] = useState(initialIdentities);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const google = identities.find((i) => i.provider === "google");
  const email = identities.find((i) => i.provider === "email");
  const canDisconnect = identities.length > 1;

  async function handleConnect() {
    setPending("google");
    setError(null);

    // on success this redirects to google, so nothing after it runs
    const result = await linkGoogle();

    if (result?.error) {
      setError(result.error);
      setPending(null);
    }
  }

  async function handleDisconnect(id: string) {
    setPending(id);
    setError(null);

    const result = await unlinkIdentity(id);

    if (result.error) {
      setError(result.error);
    } else {
      setIdentities((prev) => prev.filter((i) => i.id !== id));
    }

    setPending(null);
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-md divide-y">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <IconMail className="h-4 w-4 text-muted-foreground" />
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Email</p>
              <p className="text-xs text-muted-foreground">
                {email ? (email.email ?? "Connected") : "Not connected"}
              </p>
            </div>
          </div>
          {email && canDisconnect && (
            <Button
              variant="outline"
              size="sm"
              disabled={pending === email.id}
              onClick={() => handleDisconnect(email.id)}
            >
              {pending === email.id ? "Disconnecting..." : "Disconnect"}
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <IconBrandGoogleFilled className="h-4 w-4 text-muted-foreground" />
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Google</p>
              <p className="text-xs text-muted-foreground">
                {google ? (google.email ?? "Connected") : "Not connected"}
              </p>
            </div>
          </div>
          {google ? (
            canDisconnect && (
              <Button
                variant="outline"
                size="sm"
                disabled={pending === google.id}
                onClick={() => handleDisconnect(google.id)}
              >
                {pending === google.id ? "Disconnecting..." : "Disconnect"}
              </Button>
            )
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled={pending === "google"}
              onClick={handleConnect}
            >
              {pending === "google" ? "Redirecting..." : "Connect"}
            </Button>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!canDisconnect && (
        <p className="text-sm text-muted-foreground">
          Connect a second method before disconnecting this one.
        </p>
      )}
    </div>
  );
}
