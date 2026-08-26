#!/usr/bin/env node
import { spawnSync } from "node:child_process";

// advisory steps report but never fail the run
const steps = [
  { name: "build", cmd: ["pnpm", "build"] },
  { name: "lint", cmd: ["pnpm", "lint"] },
  { name: "test", cmd: ["pnpm", "test"] },
  { name: "react-doctor", cmd: ["pnpm", "react-doctor"], advisory: true },
];

const advisoryFailures = [];

for (const { name, cmd, advisory } of steps) {
  console.log(`\n▸ ${name}${advisory ? " (advisory)" : ""}`);
  const [bin, ...args] = cmd;
  const { status } = spawnSync(bin, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (status !== 0) {
    if (advisory) {
      advisoryFailures.push(name);
      continue;
    }
    console.error(`\n✗ ${name} failed`);
    process.exit(status ?? 1);
  }
}

if (advisoryFailures.length) {
  console.log(
    `\n✓ checks passed, with findings from: ${advisoryFailures.join(", ")}`,
  );
} else {
  console.log("\n✓ all checks passed");
}
