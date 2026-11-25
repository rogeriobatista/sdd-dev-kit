import { DEFAULT_PATHS } from "../paths.js";

/** Relative root of the professional docs pack. */
export const DOCS_PACK_REL = DEFAULT_PATHS.docs;

export const DOCS_FILES = {
  readme: "README.md",
  product: "PRODUCT.md",
  technical: "TECHNICAL.md",
  changelog: "CHANGELOG.md",
  handoff: "HANDOFF.md",
  api: "API.md",
  adrDir: "ADR",
  adrIndex: "ADR/README.md",
} as const;

export type DocsFileKey = keyof typeof DOCS_FILES;

/** Relative POSIX path to the docs pack root (`docs/sdd`). */
export function docsPackRelPath(): string {
  return DOCS_PACK_REL;
}

/** Relative POSIX path to a file under `docs/sdd/`. */
export function docsFileRelPath(name: string): string {
  const clean = name.replace(/\\/g, "/").replace(/^\/+/, "");
  return `${DOCS_PACK_REL}/${clean}`;
}

/** Relative POSIX path for an ADR file (or the ADR directory). */
export function adrRelPath(slug?: string): string {
  if (!slug) return docsFileRelPath(DOCS_FILES.adrDir);
  const safe = slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return docsFileRelPath(`${DOCS_FILES.adrDir}/${safe || "untitled"}.md`);
}

/** Stakeholder demo relative path for a given encoded evidence key. */
export function evidenceDemoRelPath(encodedEvidenceKey: string): string {
  return `${DEFAULT_PATHS.evidence}/${encodedEvidenceKey}/latest/demo/`;
}
