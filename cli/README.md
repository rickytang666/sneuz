# Sneuz CLI

Keyboard-first calendar for backfilling and fixing sleep sessions over `/api/v1`.

## Install

```bash
pnpm install
pnpm build
pnpm add -g "link:$PWD"   # links the sneuz command to this folder, so a rebuild is all an update needs
sneuz login               # paste a key from Settings > API Keys
```

The key is saved to `~/.config/sneuz/config.json`, readable only by you. `SNEUZ_API_KEY` overrides it, and `SNEUZ_API_URL` points the CLI at another server, such as `http://localhost:3000`.

## Use

```bash
sneuz                      # the calendar; ? lists the keys
sneuz add 11-14 2330 0710  # the night you woke up on Nov 14
sneuz add 2330 0710        # no date means you woke up today
sneuz ls                   # the last 14 nights
sneuz ls --days 30         # the last 30 nights
sneuz ls --from 09-01 --to 09-30
sneuz ls --json            # sessions as json, newest first, for scripts and agents
```

A night belongs to the day you woke up. A bedtime from 15:00 on is the evening before, and an impossible morning bedtime like `1155` before a `0720` wake is read as 23:55.

## Develop

```bash
pnpm dev                       # builds, then opens the calendar on fake data
SNEUZ_DEMO_FAIL=1 pnpm dev     # every save fails, to see the rollback
```

- `src/core/`: date, time and night rules, no UI
- `src/tui/`: the Ink calendar; `nav.ts` and `editor.ts` hold its state as pure functions
- `src/commands.ts`: `login`, `add` and `ls`
- `src/http-api.ts` and `src/demo-api.ts`: the real API client and an in-memory stand-in

`pnpm test`, `pnpm typecheck` and `pnpm lint` check it.
