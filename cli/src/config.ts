import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

export const DEFAULT_API_URL = "https://sneuz.rickytang.dev";

type StoredConfig = { apiKey?: string };

export function configPath(): string {
  const base = process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
  return join(base, "sneuz", "config.json");
}

async function readStored(): Promise<StoredConfig> {
  try {
    return JSON.parse(await readFile(configPath(), "utf8")) as StoredConfig;
  } catch {
    return {};
  }
}

// SNEUZ_API_KEY wins over the saved key, for one-off runs; SNEUZ_API_URL points at a local server
export async function loadConfig(): Promise<{
  apiKey: string | null;
  apiUrl: string;
}> {
  const stored = await readStored();
  return {
    apiKey: process.env.SNEUZ_API_KEY || stored.apiKey || null,
    apiUrl: process.env.SNEUZ_API_URL || DEFAULT_API_URL,
  };
}

export async function saveApiKey(apiKey: string): Promise<void> {
  const path = configPath();
  await mkdir(join(path, ".."), { recursive: true, mode: 0o700 });
  await writeFile(path, `${JSON.stringify({ apiKey }, null, 2)}\n`, {
    mode: 0o600,
  });
  // writeFile keeps an existing file's mode, so tighten it explicitly
  await chmod(path, 0o600);
}
