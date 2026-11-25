import {
  buildDocs,
  type BuildDocsResult,
  type DocsMode,
} from "@rogeriobatista/core";
import { resolveProjectRoot } from "../project.js";

export type DocsOptions = {
  projectRoot?: string;
  mode?: DocsMode;
  evidenceKey?: string;
  writeRootChangelog?: boolean;
};

const MODES = new Set<DocsMode>(["all", "changelog", "api", "handoff"]);

export function parseDocsMode(raw?: string): DocsMode {
  if (!raw || raw === "all") return "all";
  if (MODES.has(raw as DocsMode)) return raw as DocsMode;
  throw new Error(
    `Unknown docs mode "${raw}". Use: all | changelog | api | handoff`,
  );
}

export async function runDocsCommand(
  options: DocsOptions = {},
): Promise<BuildDocsResult> {
  const projectRoot = resolveProjectRoot(options.projectRoot);
  return buildDocs({
    projectRoot,
    mode: options.mode ?? "all",
    evidenceKey: options.evidenceKey,
    writeRootChangelog: options.writeRootChangelog,
  });
}

export function formatDocsReport(result: BuildDocsResult): string {
  const lines = [
    `sdd docs → documentation pack (${result.mode})`,
    `docsPath: ${result.docsPath}`,
    `docsDir: ${result.docsDir}`,
    `evidenceKey: ${result.evidenceKey}`,
    `evidenceDemo: ${result.evidenceDemoPath}`,
    `stack: ${result.stack ?? "(none)"}`,
    "",
    "Written:",
    ...result.written.map((w) => `  - ${w}`),
  ];
  if (result.gaps.length) {
    lines.push("", "Gaps (not invented):", ...result.gaps.map((g) => `  - ${g}`));
  }
  return lines.join("\n");
}
