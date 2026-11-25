export const CLI_VERSION = "0.1.3";

export function printRootHelp(): void {
  console.log(`sdd — SDD Protocol Kit CLI (v${CLI_VERSION})

Uso / Usage:
  sdd <comando> [opções]
  sdd init [--host cursor|claude|copilot|all] [--stack <id>] [--cwd <dir>]
  sdd from-ticket <id> [--run] [--cwd <dir>]
  sdd run [--cwd <dir>]
  sdd verify [runner] [--cwd <dir>]
  sdd demo [runId] [--id <key>] [--cwd <dir>]
  sdd status [--cwd <dir>]

Comandos:
  init          Scaffold host adapters + sdd.yaml + premises + stack
  from-ticket   Bootstrap specs/ from Linear or Jira (env vars)
  run           Status + canonical steps 1–10 guidance (LLM host-driven)
  verify        Run sdd.yaml runners (spec/unit/integration/e2e/all)
  demo          Build PO/BO/QA evidence pack
  status        Report stack, runs, ticket, evidence

Research (best practices) is host-driven step 11 (continuous): /sdd research · SDD: research
  (catalog: packages/adapter-shared/content/best-practices-catalog.md)

Stacks: typescript | python | react-vite | node-graphql | terraform
Hosts:  cursor | claude | copilot | all

Ticketing env (never on argv):
  LINEAR_API_KEY
  JIRA_BASE_URL  JIRA_API_TOKEN  [JIRA_EMAIL]

Registry (GitHub Packages):
  @rogeriobatista:registry=https://npm.pkg.github.com

Ajuda por comando: sdd <comando> --help
`);
}

export function printCommandHelp(command: string): void {
  switch (command) {
    case "init":
      console.log(`sdd init — scaffold SDD no projeto

  sdd init [--host cursor|claude|copilot|all] [--stack <id>] [--cwd <dir>] [--dry-run]

  --host     Copiar adapters de host (default: cursor)
  --stack    typescript | python | react-vite | node-graphql | terraform
  --cwd      Raiz do projeto (default: cwd)
  --dry-run  Mostrar o que seria feito, sem escrever
`);
      break;
    case "from-ticket":
      console.log(`sdd from-ticket <id> — draft specs/ from Linear/Jira

  sdd from-ticket ENG-42
  sdd from-ticket linear:ENG-42
  sdd from-ticket jira:SHOP-7 --run

  Default: draft specs/ then pause for human spec iteration (only human gate / step 1).
  --run: enter steps 2–10 only if specs are already complete/testable.
  Requires env vars (see sdd --help). Does not invent acceptance criteria.
`);
      break;
    case "run":
      console.log(`sdd run — orchestration / status (host-driven canonical flow)

  Canonical steps (LOCK THIS):
    1. Human: NL + BDD in specs/
    2. Kit: executable Spec Tests (tests/spec or tests/features)
    3. Kit: Dev Spec (.sdd/dev-spec.md)
    4. Kit: Dev Implementation Plan (.sdd/implementation-plan.md)
    5. Kit: Design & Approach (.sdd/design-approach.md)
    6. Kit: unit tests (tests/unit/)
    7. Kit: integration tests (tests/integration/)
    8. Kit: e2e tests (tests/e2e/)
    9. Kit: implement + verify all layers until green (loop + cap)
   10. Kit: evidence (.sdd/evidence/<key>/latest/)
   11. Continuous: market best practices (.sdd/research/<key>/) — not a separate stop

  Step 1 is the only human gate. Steps 2–10 run via /sdd run / SDD: run after specs
  are accepted. Do not stop mid-loop to ask the human to fix code. If specs are
  wrong/ambiguous, exit and ask the human to edit specs/.

  This CLI command prints stack detection + status + the above guidance.
  LLM work stays on the host adapter. Use sdd verify / sdd demo for local evidence.
`);
      break;
    case "verify":
      console.log(`sdd verify [runner] — run sdd.yaml runners

  sdd verify              # runners.all (all test levels when wired)
  sdd verify spec         # Spec Tests layer (when present)
  sdd verify unit         # unit layer
  sdd verify integration  # integration layer
  sdd verify e2e          # e2e layer
  sdd verify cucumber     # stack-specific alias (when present)
`);
      break;
    case "demo":
      console.log(`sdd demo [runId] [--id <evidenceKey>]

  Builds .sdd/evidence/<key>/latest/demo/ via @rogeriobatista/core buildDemo.
`);
      break;
    case "status":
      console.log(`sdd status — stack, last runs, ticket, evidence paths
`);
      break;
    default:
      printRootHelp();
  }
}
