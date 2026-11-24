import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cucumberBin = path.join(
  root,
  "node_modules",
  "@cucumber",
  "cucumber",
  "bin",
  "cucumber.js",
);

const child = spawn(
  process.execPath,
  ["--import", "tsx", cucumberBin],
  { cwd: root, stdio: "inherit", shell: false },
);
child.on("exit", (code) => process.exit(code ?? 1));
