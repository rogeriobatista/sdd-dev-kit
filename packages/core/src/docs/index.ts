export {
  DOCS_PACK_REL,
  DOCS_FILES,
  docsPackRelPath,
  docsFileRelPath,
  adrRelPath,
  evidenceDemoRelPath,
  type DocsFileKey,
} from "./paths.js";

export {
  fillTemplate,
  EMBEDDED_TEMPLATES,
  missingMarker,
} from "./templates.js";

export { buildDocs } from "./build-docs.js";

export type {
  DocsMode,
  BuildDocsOptions,
  BuildDocsResult,
  DocsTemplateVars,
} from "./types.js";

export {
  parseSpecSections,
  collectSpecs,
  collectApiStub,
  collectAdrCandidates,
  formatChangelogEntries,
} from "./collect.js";
