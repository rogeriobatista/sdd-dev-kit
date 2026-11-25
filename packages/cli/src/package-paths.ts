import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

/** Absolute package root for an installed `@sdd-dev-kit/*` dependency. */
export function resolvePackageRoot(packageName: string): string {
  const pkgJson = require.resolve(`${packageName}/package.json`);
  return path.dirname(pkgJson);
}

export function cliPackageRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

export type HostId = "cursor" | "claude" | "copilot";

const HOST_PACKAGES: Record<HostId, string> = {
  cursor: "@sdd-dev-kit/adapter-cursor",
  claude: "@sdd-dev-kit/adapter-claude",
  copilot: "@sdd-dev-kit/adapter-vscode-copilot",
};

export function hostPackageRoot(host: HostId): string {
  return resolvePackageRoot(HOST_PACKAGES[host]);
}

export function sharedPackageRoot(): string {
  return resolvePackageRoot("@sdd-dev-kit/adapter-shared");
}

export type StackId =
  | "typescript"
  | "python"
  | "react-vite"
  | "node-graphql"
  | "terraform";

const STACK_PACKAGES: Record<StackId, string> = {
  typescript: "@sdd-dev-kit/adapter-ts",
  python: "@sdd-dev-kit/adapter-python",
  "react-vite": "@sdd-dev-kit/adapter-react-vite",
  "node-graphql": "@sdd-dev-kit/adapter-node-graphql",
  terraform: "@sdd-dev-kit/adapter-terraform",
};

export function stackPackageRoot(stack: StackId): string {
  return resolvePackageRoot(STACK_PACKAGES[stack]);
}

export function stackPackageName(stack: StackId): string {
  return STACK_PACKAGES[stack];
}
