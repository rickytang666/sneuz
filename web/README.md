# Sneuz web portal

Manual sleep tracking portal for the app.

## Setup

See the dev setup section in the [root README](../README.md). In short: copy
`.env.example` to `.env`, fill in the Neon and Google values, then `pnpm install`,
`pnpm exec drizzle-kit migrate` and `pnpm dev`.

## Scripts

- `pnpm dev`: Start the dev server
- `pnpm validate`: Build, lint, test, react-doctor
- `pnpm lint` / `pnpm lint:fix`: Biome check
- `pnpm test` / `pnpm test:watch`: Vitest
