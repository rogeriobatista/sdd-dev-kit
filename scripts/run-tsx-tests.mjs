#!/usr/bin/env node
// Cross-platform package test runner.
// Shell globs for nested ** patterns miss top-level src/*.test.ts on Linux
// (no globstar), which breaks CI for packages with only shallow tests.
import { spawnSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function collectTests(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...collectTests(p));
    else if (name.endsWith(".test.ts")) out.push(p);
  }
  return out;
}

const root = process.argv[2] ?? "src";
const files = collectTests(root);
if (files.length === 0) {
  console.error(`No *.test.ts files under ${root}`);
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  ["--import", "tsx", "--test", ...files],
  { stdio: "inherit" },
);
process.exit(result.status ?? 1);
