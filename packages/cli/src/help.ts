export const CLI_VERSION = "0.1.0";

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
  run           Status + pipeline guidance (LLM stays host-driven)
  verify        Run sdd.yaml runners (via @sdd-dev-kit/core)
  demo          Build PO/BO/QA evidence pack
  status        Report stack, runs, ticket, evidence

Stacks: typescript | python | react-vite | node-graphql | terraform
Hosts:  cursor | claude | copilot | all

Ticketing env (never on argv):
  LINEAR_API_KEY
  JIRA_BASE_URL  JIRA_API_TOKEN  [JIRA_EMAIL]

Registry (GitHub Packages):
  @sdd-dev-kit:registry=https://npm.pkg.github.com

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

  Requires env vars (see sdd --help). Does not invent acceptance criteria.
`);
      break;
    case "run":
      console.log(`sdd run — orchestration / status (LLM phases are host-driven)

  Prints stack detection + status and reminds you to use Cursor/Claude/Copilot
  for normalize → implement. Use sdd verify / sdd demo for local test evidence.
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

  Builds .sdd/evidence/<key>/latest/demo/ via @sdd-dev-kit/core buildDemo.
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
