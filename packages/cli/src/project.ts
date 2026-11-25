import path from "node:path";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_PATHS,
  parseSddYaml,
  resolveSddPath,
  type SddManifest,
} from "@rogeriobatista/core";
import { pathExists } from "./fs-utils.js";

export function resolveProjectRoot(cwdFlag?: string): string {
  const raw = cwdFlag?.trim() || process.cwd();
  return path.resolve(raw);
}

export async function loadManifest(
  projectRoot: string,
): Promise<SddManifest | null> {
  const yamlPath = resolveSddPath(projectRoot, DEFAULT_PATHS.manifest);
  if (!(await pathExists(yamlPath))) return null;
  const text = await readFile(yamlPath, "utf8");
  return parseSddYaml(text);
}
