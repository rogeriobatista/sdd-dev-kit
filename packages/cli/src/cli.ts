import { CLI_VERSION, printCommandHelp, printRootHelp } from "./help.js";
import { flagBool, flagString, parseArgs } from "./args.js";
import { formatInitReport, runInit } from "./commands/init.js";
import { formatVerifyReport, runVerifyCommand } from "./commands/verify.js";
import { formatDemoReport, runDemoCommand } from "./commands/demo.js";
import {
  formatDocsReport,
  parseDocsMode,
  runDocsCommand,
} from "./commands/docs.js";
import {
  formatFromTicketReport,
  runFromTicketCommand,
} from "./commands/from-ticket.js";
import { formatStatusReport, runStatus } from "./commands/status.js";
import { runPipelineCommand } from "./commands/run.js";
import {
  formatBugReportCli,
  formatGuidanceResult,
  runBugReportCommand,
  runDebugCommand,
  runFixCommand,
  runQaCommand,
  runReproduceCommand,
} from "./commands/bugfix.js";

export type CliResult = { exitCode: number };

/**
 * Programmatic entry for the `sdd` CLI.
 * Returns an exit code instead of calling process.exit (tests).
 */
export async function runCli(argv: string[] = process.argv): Promise<CliResult> {
  const parsed = parseArgs(argv);

  if (parsed.version) {
    console.log(CLI_VERSION);
    return { exitCode: 0 };
  }

  if (!parsed.command || (parsed.help && !parsed.command)) {
    printRootHelp();
    return { exitCode: parsed.help ? 0 : 1 };
  }

  if (parsed.help) {
    printCommandHelp(parsed.command);
    return { exitCode: 0 };
  }

  const cwd = flagString(parsed.flags, "cwd");

  try {
    switch (parsed.command) {
      case "init": {
        const result = await runInit({
          projectRoot: cwd,
          host: flagString(parsed.flags, "host"),
          stack: flagString(parsed.flags, "stack"),
          dryRun: flagBool(parsed.flags, "dry-run", "dryRun"),
        });
        console.log(formatInitReport(result));
        return { exitCode: result.needsClarification ? 2 : 0 };
      }
      case "verify": {
        const which = parsed.positional[0];
        const result = await runVerifyCommand({
          projectRoot: cwd,
          which,
        });
        console.log(formatVerifyReport(result));
        return { exitCode: result.result.exitCode };
      }
      case "demo": {
        const runId = parsed.positional[0];
        const result = await runDemoCommand({
          projectRoot: cwd,
          runId,
          evidenceKey: flagString(parsed.flags, "id"),
        });
        console.log(formatDemoReport(result));
        return { exitCode: 0 };
      }
      case "docs": {
        const mode = parseDocsMode(parsed.positional[0]);
        const result = await runDocsCommand({
          projectRoot: cwd,
          mode,
          evidenceKey: flagString(parsed.flags, "id"),
          writeRootChangelog: !flagBool(parsed.flags, "no-root-changelog"),
        });
        console.log(formatDocsReport(result));
        return { exitCode: 0 };
      }
      case "from-ticket": {
        const ticketId = parsed.positional[0];
        if (!ticketId) {
          console.error("Missing ticket id. Example: sdd from-ticket linear:ENG-42");
          printCommandHelp("from-ticket");
          return { exitCode: 1 };
        }
        const result = await runFromTicketCommand({
          projectRoot: cwd,
          ticketId,
          continueRun: flagBool(parsed.flags, "run"),
        });
        console.log(formatFromTicketReport(result));
        return { exitCode: 0 };
      }
      case "status": {
        const status = await runStatus({ projectRoot: cwd });
        console.log(formatStatusReport(status));
        return { exitCode: status.stack.needsClarification ? 2 : 0 };
      }
      case "run": {
        const { statusText, guidance, exitCode } = await runPipelineCommand({
          projectRoot: cwd,
        });
        console.log(statusText);
        console.log(guidance);
        return { exitCode };
      }
      case "bug-report":
      case "bug": {
        // Support `sdd bug report` → command bug, positional "report"
        let bugId = parsed.positional[0];
        if (parsed.command === "bug" && bugId?.toLowerCase() === "report") {
          bugId = parsed.positional[1];
        } else if (parsed.command === "bug" && bugId) {
          // `sdd bug linear:ENG-42` treated as bug-report with id
        } else if (parsed.command === "bug" && !bugId) {
          bugId = undefined;
        }
        const result = await runBugReportCommand({
          projectRoot: cwd,
          bugId,
          title: flagString(parsed.flags, "title"),
        });
        console.log(formatBugReportCli(result));
        return { exitCode: 0 };
      }
      case "reproduce": {
        const bugId = parsed.positional[0];
        if (!bugId) {
          console.error("Missing bug id. Example: sdd reproduce linear:ENG-42");
          printCommandHelp("reproduce");
          return { exitCode: 1 };
        }
        const result = await runReproduceCommand({ projectRoot: cwd, bugId });
        console.log(formatGuidanceResult(result));
        return { exitCode: 0 };
      }
      case "debug": {
        const bugId = parsed.positional[0];
        if (!bugId) {
          console.error("Missing bug id. Example: sdd debug linear:ENG-42");
          printCommandHelp("debug");
          return { exitCode: 1 };
        }
        const result = await runDebugCommand({ projectRoot: cwd, bugId });
        console.log(formatGuidanceResult(result));
        return { exitCode: 0 };
      }
      case "qa": {
        const bugId = parsed.positional[0];
        if (!bugId) {
          console.error("Missing bug id. Example: sdd qa linear:ENG-42");
          printCommandHelp("qa");
          return { exitCode: 1 };
        }
        const result = await runQaCommand({ projectRoot: cwd, bugId });
        console.log(formatGuidanceResult(result));
        return { exitCode: 0 };
      }
      case "fix": {
        const bugId = parsed.positional[0];
        if (!bugId) {
          console.error("Missing bug id. Example: sdd fix linear:ENG-42");
          printCommandHelp("fix");
          return { exitCode: 1 };
        }
        const result = await runFixCommand({ projectRoot: cwd, bugId });
        console.log(formatGuidanceResult(result));
        return { exitCode: result.blocked ? 2 : 0 };
      }
      case "help": {
        printRootHelp();
        return { exitCode: 0 };
      }
      default: {
        console.error(`Unknown command: ${parsed.command}`);
        printRootHelp();
        return { exitCode: 1 };
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`sdd error: ${message}`);
    return { exitCode: 1 };
  }
}

export { CLI_VERSION };
