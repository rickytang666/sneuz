import { mkdtemp, readFile, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { configPath, DEFAULT_API_URL, loadConfig, saveApiKey } from "./config";

const saved = { ...process.env };

beforeEach(async () => {
  process.env.XDG_CONFIG_HOME = await mkdtemp(join(tmpdir(), "sneuz-"));
  delete process.env.SNEUZ_API_KEY;
  delete process.env.SNEUZ_API_URL;
});

afterEach(() => {
  process.env = { ...saved };
});

describe("config", () => {
  it("has no key before login", async () => {
    expect(await loadConfig()).toEqual({
      apiKey: null,
      apiUrl: DEFAULT_API_URL,
    });
  });

  it("saves the key readable by the owner only", async () => {
    await saveApiKey("snz_saved");
    expect((await loadConfig()).apiKey).toBe("snz_saved");
    expect((await stat(configPath())).mode & 0o777).toBe(0o600);
  });

  it("tightens a file that was looser before", async () => {
    await saveApiKey("snz_one");
    await writeFile(configPath(), "{}", { mode: 0o644 });
    await saveApiKey("snz_two");
    expect((await stat(configPath())).mode & 0o777).toBe(0o600);
    expect(JSON.parse(await readFile(configPath(), "utf8")).apiKey).toBe(
      "snz_two",
    );
  });

  it("lets SNEUZ_API_KEY and SNEUZ_API_URL win", async () => {
    await saveApiKey("snz_saved");
    process.env.SNEUZ_API_KEY = "snz_env";
    process.env.SNEUZ_API_URL = "http://localhost:3000";
    expect(await loadConfig()).toEqual({
      apiKey: "snz_env",
      apiUrl: "http://localhost:3000",
    });
  });
});
