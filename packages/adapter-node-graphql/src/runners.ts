import {
  runShellCommand,
  type RunnerResult,
  type SddManifest,
} from "@sdd-dev-kit/core";

export interface RunOptions {
  projectRoot: string;
  manifest: SddManifest;
  which?: "cucumber" | "vitest" | "all";
  env?: NodeJS.ProcessEnv;
}

export async function runVerify(options: RunOptions): Promise<RunnerResult> {
  const which = options.which ?? "all";
  const { runners } = options.manifest;
  const command =
    which === "cucumber"
      ? runners.cucumber
      : which === "vitest"
        ? (runners.vitest ?? runners.all)
        : runners.all;

  const result = await runShellCommand(command, options.projectRoot, options.env);
  return {
    name: which,
    exitCode: result.exitCode,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}
