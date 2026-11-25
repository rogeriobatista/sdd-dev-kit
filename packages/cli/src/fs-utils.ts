import {
  access,
  copyFile,
  mkdir,
  readdir,
  readFile,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

export async function pathExists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

export async function writeIfMissing(
  filePath: string,
  contents: string,
): Promise<boolean> {
  if (await pathExists(filePath)) return false;
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, contents, "utf8");
  return true;
}

export async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

/** Copy a file only when destination is missing. Returns true if written. */
export async function copyFileIfMissing(
  src: string,
  dest: string,
): Promise<boolean> {
  if (await pathExists(dest)) return false;
  await mkdir(path.dirname(dest), { recursive: true });
  await copyFile(src, dest);
  return true;
}

/**
 * Recursively copy `srcDir` → `destDir`, skipping existing files
 * (never overwrite human-owned content).
 */
export async function copyDirIfMissing(
  srcDir: string,
  destDir: string,
): Promise<string[]> {
  const written: string[] = [];
  if (!(await pathExists(srcDir))) return written;

  const entries = await readdir(srcDir, { withFileTypes: true });
  await ensureDir(destDir);

  for (const entry of entries) {
    const from = path.join(srcDir, entry.name);
    const to = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      written.push(...(await copyDirIfMissing(from, to)));
    } else if (entry.isFile()) {
      if (await copyFileIfMissing(from, to)) {
        written.push(to);
      }
    }
  }
  return written;
}

export async function readText(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

export async function isDirectory(p: string): Promise<boolean> {
  try {
    return (await stat(p)).isDirectory();
  } catch {
    return false;
  }
}
