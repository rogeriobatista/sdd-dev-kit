/** Patterns that look like secrets — scrubbed from demo narrative / stdout snippets. */
const SECRET_PATTERNS: RegExp[] = [
  /\b(api[_-]?key|token|secret|password|passwd|authorization|bearer)\s*[:=]\s*['"]?[^\s'"]+/gi,
  /\bBearer\s+[A-Za-z0-9\-._~+/]+=*/gi,
  /\b(LINEAR_API_KEY|JIRA_API_TOKEN|JIRA_EMAIL|AWS_SECRET_ACCESS_KEY|GITHUB_TOKEN)\b\s*[:=]?\s*\S+/gi,
  /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
  /\b[A-Za-z0-9+/]{40,}={0,2}\b/g,
];

/**
 * Redact likely secrets from text before embedding in stakeholder demos.
 * Prefer over-redacting; demo packs must never leak credentials.
 */
export function scrubSecrets(text: string, maxLen = 2000): string {
  let out = text;
  for (const re of SECRET_PATTERNS) {
    out = out.replace(re, "[REDACTED]");
  }
  if (out.length > maxLen) {
    out = `${out.slice(0, maxLen)}…`;
  }
  return out;
}
