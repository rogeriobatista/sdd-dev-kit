export type DocsMode = "all" | "changelog" | "api" | "handoff";

export type BuildDocsOptions = {
  projectRoot: string;
  /** Subcommand mode. Default: `all`. */
  mode?: DocsMode;
  /** Override evidence key (same as demo `--id`). */
  evidenceKey?: string;
  /** Also write/update root `CHANGELOG.md` pointer. Default: true for all/changelog. */
  writeRootChangelog?: boolean;
  /** Locale for stakeholder copy. Default: pt-BR. */
  locale?: string;
};

export type BuildDocsResult = {
  mode: DocsMode;
  docsDir: string;
  /** Relative POSIX path: `docs/sdd` */
  docsPath: string;
  evidenceKey: string;
  evidenceDemoPath: string;
  written: string[];
  gaps: string[];
  stack: string | null;
};

export type DocsTemplateVars = Record<string, string>;
