import type { CanonicalScenario, ScenarioTag } from "@sdd-dev-kit/core";

/** `@api` → Cucumber; `@ui`/`@e2e` → Playwright. Untagged defaults to Cucumber. */
export function usesCucumber(scenario: CanonicalScenario): boolean {
  if (scenario.tags.length === 0) return true;
  return scenario.tags.includes("api");
}

export function usesPlaywright(scenario: CanonicalScenario): boolean {
  return scenario.tags.includes("ui") || scenario.tags.includes("e2e");
}

export function formatGherkinTags(tags: ScenarioTag[]): string {
  if (tags.length === 0) return "";
  return tags.map((t) => `@${t}`).join(" ");
}
