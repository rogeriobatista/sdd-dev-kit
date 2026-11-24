import type { CanonicalScenario, ScenarioTag } from "./types.js";

/** `@api` → Cucumber/API track; `@ui`/`@e2e` → Playwright/UI. Untagged → API. */
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

/** Stable filesystem slug from a source file basename or title. */
export function slugifyScenarioBase(text: string): string {
  return (
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "scenario"
  );
}
