import { spawn } from "node:child_process";
import type { RunnerResult, SddManifest } from "@sdd-dev-kit/core";

export interface RunOptions {
  projectRoot: string;
  manifest: SddManifest;
  /** Which runner to execute. Default: all */
  which?: "cucumber" | "playwright" | "all";
  env?: NodeJS.ProcessEnv;
}

function runShell(
  command: string,
  cwd: string,
  env?: NodeJS.ProcessEnv,
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(command, {
      cwd,
      env: { ...process.env, ...env },
      shell: true,
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on("close", (code) => {
      resolve({ exitCode: code ?? 1, stdout, stderr });
    });
    child.on("error", (err) => {
      resolve({ exitCode: 1, stdout, stderr: `${stderr}\n${err.message}` });
    });
  });
}

export async function runVerify(options: RunOptions): Promise<RunnerResult> {
  const which = options.which ?? "all";
  const command =
    which === "cucumber"
      ? options.manifest.runners.cucumber
      : which === "playwright"
        ? options.manifest.runners.playwright
        : options.manifest.runners.all;

  const result = await runShell(command, options.projectRoot, options.env);
  return {
    name: which,
    exitCode: result.exitCode,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}
