"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocalTime } from "@/components/ui/local-time";
import { createApiKey, deleteApiKey } from "@/lib/actions/api-keys";

interface ApiKey {
  id: string;
  name: string;
  created_at: string;
  last_used_at: string | null;
}

interface Props {
  initialKeys: ApiKey[];
}

export function ApiKeysManager({ initialKeys }: Props) {
  const [keys, setKeys] = useState(initialKeys);
  const [name, setName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!name.trim()) return;
    setCreating(true);
    setError(null);

    const result = await createApiKey(name.trim());

    if ("error" in result && result.error) {
      setError(result.error);
    } else if (result.data) {
      const created = result.data;
      setKeys((prev) => [{ ...created, last_used_at: null }, ...prev]);
      setNewKey(created.key);
      setName("");
    }

    setCreating(false);
  }

  async function handleDelete(id: string) {
    const result = await deleteApiKey(id);
    if (result.error) {
      setError(result.error);
    } else {
      setKeys((prev) => prev.filter((k) => k.id !== id));
    }
  }

  async function handleCopy() {
    if (!newKey) return;
    await navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1 grid gap-1.5">
          <Label htmlFor="key-name">Key name</Label>
          <Input
            id="key-name"
            placeholder="e.g. home server"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
        </div>
        <div className="flex items-end">
          <Button onClick={handleCreate} disabled={creating || !name.trim()}>
            {creating ? "Generating..." : "Generate Key"}
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {keys.length > 0 && (
        <div className="border rounded-md divide-y">
          {keys.map((key) => (
            <div
              key={key.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{key.name}</p>
                <p className="text-xs text-muted-foreground">
                  Created <LocalTime iso={key.created_at} mode="date" />
                  {key.last_used_at && (
                    <>
                      {" · Last used "}
                      <LocalTime iso={key.last_used_at} mode="date" />
                    </>
                  )}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-destructive text-destructive hover:bg-destructive hover:text-white"
                onClick={() => handleDelete(key.id)}
              >
                Revoke
              </Button>
            </div>
          ))}
        </div>
      )}

      {keys.length === 0 && (
        <p className="text-sm text-muted-foreground">No API keys yet.</p>
      )}

      <Dialog
        open={!!newKey}
        onOpenChange={(open) => {
          if (!open) setNewKey(null);
          setCopied(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your new API key</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Copy this key now — it won&apos;t be shown again.
            </p>
            <div className="flex gap-2">
              <Input
                readOnly
                value={newKey ?? ""}
                className="font-mono text-xs"
              />
              <Button variant="outline" onClick={handleCopy}>
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
            <Button className="w-full" onClick={() => setNewKey(null)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
