import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

/** Absolute package root for an installed `@rogeriobatista/*` dependency. */
export function resolvePackageRoot(packageName: string): string {
  const pkgJson = require.resolve(`${packageName}/package.json`);
  return path.dirname(pkgJson);
}

export function cliPackageRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

export type HostId = "cursor" | "claude" | "copilot";

const HOST_PACKAGES: Record<HostId, string> = {
  cursor: "@rogeriobatista/adapter-cursor",
  claude: "@rogeriobatista/adapter-claude",
  copilot: "@rogeriobatista/adapter-vscode-copilot",
};

export function hostPackageRoot(host: HostId): string {
  return resolvePackageRoot(HOST_PACKAGES[host]);
}

export function sharedPackageRoot(): string {
  return resolvePackageRoot("@rogeriobatista/adapter-shared");
}

export type StackId =
  | "typescript"
  | "python"
  | "react-vite"
  | "node-graphql"
  | "terraform";

const STACK_PACKAGES: Record<StackId, string> = {
  typescript: "@rogeriobatista/adapter-ts",
  python: "@rogeriobatista/adapter-python",
  "react-vite": "@rogeriobatista/adapter-react-vite",
  "node-graphql": "@rogeriobatista/adapter-node-graphql",
  terraform: "@rogeriobatista/adapter-terraform",
};

export function stackPackageRoot(stack: StackId): string {
  return resolvePackageRoot(STACK_PACKAGES[stack]);
}

export function stackPackageName(stack: StackId): string {
  return STACK_PACKAGES[stack];
}
