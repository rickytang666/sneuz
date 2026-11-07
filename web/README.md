# sneuz web portal

manual sleep tracking portal for the app.

## setup

see the dev setup section in the [root README](../README.md). in short: copy
`.env.example` to `.env`, fill in the neon and google values, then `pnpm install`,
`pnpm exec drizzle-kit migrate` and `pnpm dev`.

## scripts

- `pnpm dev`: start the dev server
- `pnpm validate`: build, lint, test, react-doctor
- `pnpm lint` / `pnpm lint:fix`: biome check
- `pnpm test` / `pnpm test:watch`: vitest
