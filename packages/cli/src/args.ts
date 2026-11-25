export type ParsedArgs = {
  command: string | null;
  positional: string[];
  flags: Record<string, string | boolean>;
  help: boolean;
  version: boolean;
};

/** Minimal argv parser: `sdd <command> [args] [--flag value] [--bool]`. */
export function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2);
  const flags: Record<string, string | boolean> = {};
  const positional: string[] = [];
  let help = false;
  let version = false;

  for (let i = 0; i < args.length; i++) {
    const token = args[i]!;
    if (token === "-h" || token === "--help") {
      help = true;
      continue;
    }
    if (token === "-V" || token === "--version") {
      version = true;
      continue;
    }
    if (token.startsWith("--")) {
      const eq = token.indexOf("=");
      if (eq !== -1) {
        flags[token.slice(2, eq)] = token.slice(eq + 1);
        continue;
      }
      const key = token.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith("-")) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
      continue;
    }
    if (token.startsWith("-") && token.length === 2) {
      const key = token.slice(1);
      const next = args[i + 1];
      if (next && !next.startsWith("-")) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
      continue;
    }
    positional.push(token);
  }

  return {
    command: positional[0] ?? null,
    positional: positional.slice(1),
    flags,
    help,
    version,
  };
}

export function flagString(
  flags: Record<string, string | boolean>,
  ...names: string[]
): string | undefined {
  for (const name of names) {
    const v = flags[name];
    if (typeof v === "string") return v;
  }
  return undefined;
}

export function flagBool(
  flags: Record<string, string | boolean>,
  ...names: string[]
): boolean {
  for (const name of names) {
    const v = flags[name];
    if (v === true || v === "true" || v === "1") return true;
  }
  return false;
}
