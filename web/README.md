# Sneuz web portal

Manual sleep tracking portal for the app.

## Setup

See the dev setup section in the [root README](../README.md). In short: copy
`.env.example` to `.env`, fill in the Neon and Google values, then `pnpm install`,
`pnpm db:migrate` and `pnpm dev`.

## Scripts

- `pnpm dev`: Start the dev server
- `pnpm validate`: Build, lint, test, react-doctor
- `pnpm lint` / `pnpm lint:fix`: Biome check
- `pnpm test` / `pnpm test:watch`: Vitest
- `pnpm db:generate`: Generate a migration from `lib/db/schema.ts`
- `pnpm db:migrate`: Apply pending migrations to the database in `DATABASE_URL`
