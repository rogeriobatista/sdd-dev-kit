import {
  runShellCommand,
  type RunnerResult,
  type SddManifest,
} from "@rogeriobatista/core";
import { loadManifest, resolveProjectRoot } from "../project.js";

export type VerifyOptions = {
  projectRoot?: string;
  /** Runner key from sdd.yaml (default: all). */
  which?: string;
};

export type VerifyCommandResult = {
  projectRoot: string;
  which: string;
  command: string;
  result: RunnerResult;
};

function resolveRunnerCommand(
  manifest: SddManifest,
  which: string,
): string {
  const runners = manifest.runners as Record<string, string | undefined>;
  const command = runners[which];
  if (!command) {
    const keys = Object.keys(runners).join(", ");
    throw new Error(
      `Runner "${which}" not found in sdd.yaml. Available: ${keys || "(none)"}`,
    );
  }
  return command;
}

export async function runVerifyCommand(
  options: VerifyOptions = {},
): Promise<VerifyCommandResult> {
  const projectRoot = resolveProjectRoot(options.projectRoot);
  const manifest = await loadManifest(projectRoot);
  if (!manifest) {
    throw new Error(
      `No sdd.yaml in ${projectRoot}. Run \`sdd init\` first.`,
    );
  }

  const which = options.which?.trim() || "all";
  const command = resolveRunnerCommand(manifest, which);
  const shell = await runShellCommand(command, projectRoot);
  const result: RunnerResult = {
    name: which,
    exitCode: shell.exitCode,
    stdout: shell.stdout,
    stderr: shell.stderr,
  };

  return { projectRoot, which, command, result };
}

export function formatVerifyReport(r: VerifyCommandResult): string {
  const lines = [
    `sdd verify → ${r.which}`,
    `command: ${r.command}`,
    `exit: ${r.result.exitCode}`,
  ];
  const stdout = r.result.stdout ?? "";
  const stderr = r.result.stderr ?? "";
  if (stdout.trim()) {
    lines.push("", "--- stdout ---", stdout.trimEnd());
  }
  if (stderr.trim()) {
    lines.push("", "--- stderr ---", stderr.trimEnd());
  }
  return lines.join("\n");
}
