import {
  runShellCommand,
  type RunnerResult,
  type SddManifest,
} from "@sdd-dev-kit/core";

export interface RunOptions {
  projectRoot: string;
  manifest: SddManifest;
  which?: "pytest" | "all";
  env?: NodeJS.ProcessEnv;
}

export async function runVerify(options: RunOptions): Promise<RunnerResult> {
  const which = options.which ?? "all";
  const command =
    which === "pytest"
      ? (options.manifest.runners.pytest ?? options.manifest.runners.all)
      : options.manifest.runners.all;

  const result = await runShellCommand(command, options.projectRoot, options.env);
  return {
    name: which,
    exitCode: result.exitCode,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}
