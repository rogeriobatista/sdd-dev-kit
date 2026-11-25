export const CLI_VERSION = "0.1.1";

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
  run           Status + auto-loop guidance (human gate = specs/; LLM host-driven)
  verify        Run sdd.yaml runners (via @rogeriobatista/core)
  demo          Build PO/BO/QA evidence pack
  status        Report stack, runs, ticket, evidence

Research (best practices) is host-driven: /sdd research · SDD: research
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

  Default: draft specs/ then pause for human spec iteration (only human gate).
  --run: enter the auto-loop only if specs are already complete/testable.
  Requires env vars (see sdd --help). Does not invent acceptance criteria.
`);
      break;
    case "run":
      console.log(`sdd run — orchestration / status (host-driven auto-loop)

  Human iteration surface (ONLY): specs/ (create/adjust NL scenarios + acceptance).
  After specs are accepted, /sdd run / SDD: run is an automated loop:
    detect stack → normalize → executable → research → plan → implement → verify
      → (diagnose → implement)* until green or loop.maxDiagnoseIterations.

  Do not stop mid-loop to ask the human to fix code. If specs are wrong/ambiguous,
  exit and ask the human to edit specs/. demo/evidence after green or loop report.

  This CLI command prints stack detection + status + the above guidance.
  LLM work stays on the host adapter. Use sdd verify / sdd demo for local evidence.
  Standalone research: /sdd research (host).
`);
      break;
    case "verify":
      console.log(`sdd verify [runner] — run sdd.yaml runners

  sdd verify           # runners.all
  sdd verify cucumber  # runners.cucumber (when present)
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
