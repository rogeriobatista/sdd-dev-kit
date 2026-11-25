import {
  runShellCommand,
  type RunnerResult,
  type SddManifest,
} from "@rogeriobatista/core";

export interface RunOptions {
  projectRoot: string;
  manifest: SddManifest;
  /** Which runner to execute. Default: all */
  which?: "cucumber" | "playwright" | "all";
  env?: NodeJS.ProcessEnv;
}

export async function runVerify(options: RunOptions): Promise<RunnerResult> {
  const which = options.which ?? "all";
  const command =
    which === "cucumber"
      ? options.manifest.runners.cucumber
      : which === "playwright"
        ? options.manifest.runners.playwright
        : options.manifest.runners.all;

  const result = await runShellCommand(command, options.projectRoot, options.env);
  return {
    name: which,
    exitCode: result.exitCode,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}
