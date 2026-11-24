import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const pkgJson = require.resolve("@cucumber/cucumber/package.json");
const cucumberBin = path.join(path.dirname(pkgJson), "bin", "cucumber.js");
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const child = spawn(process.execPath, ["--import", "tsx", cucumberBin, ...process.argv.slice(2)], {
  stdio: "inherit",
  cwd: projectRoot,
  shell: false,
  windowsHide: true,
});

child.on("exit", (code) => process.exit(code ?? 1));
