import { build } from "esbuild";

// ink's dependency tree still calls require(), which an esm bundle can't resolve without this shim
const banner = [
  "#!/usr/bin/env node",
  'import { createRequire as __createRequire } from "node:module";',
  "const require = __createRequire(import.meta.url);",
].join("\n");

await build({
  entryPoints: ["src/sneuz.ts"],
  outdir: "dist",
  bundle: true,
  // keeps ink and react out of the chunk the one-liner commands load
  splitting: true,
  platform: "node",
  format: "esm",
  target: "node24",
  banner: { js: banner },
  // ink only imports its devtools when that package is installed, which it isn't
  external: ["react-devtools-core"],
});
