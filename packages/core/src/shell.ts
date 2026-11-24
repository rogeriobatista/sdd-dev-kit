import { spawn } from "node:child_process";

export interface ShellResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

/** Shared shell runner for stack-adapter verify commands. */
export function runShellCommand(
  command: string,
  cwd: string,
  env?: NodeJS.ProcessEnv,
): Promise<ShellResult> {
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
