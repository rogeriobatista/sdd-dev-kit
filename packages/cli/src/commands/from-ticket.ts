import {
  fromTicket,
  type FromTicketResult,
} from "@rogeriobatista/core";
import { loadManifest, resolveProjectRoot } from "../project.js";

export type FromTicketOptions = {
  projectRoot?: string;
  ticketId: string;
  /** After draft, remind / continue note for host pipeline (CLI does not LLM-run). */
  continueRun?: boolean;
};

export type FromTicketCommandResult = {
  result: FromTicketResult;
  continueRun: boolean;
  projectRoot: string;
};

export async function runFromTicketCommand(
  options: FromTicketOptions,
): Promise<FromTicketCommandResult> {
  const projectRoot = resolveProjectRoot(options.projectRoot);
  const ticketId = options.ticketId?.trim();
  if (!ticketId) {
    throw new Error(
      "Missing ticket id. Example: sdd from-ticket linear:ENG-42",
    );
  }

  const manifest = (await loadManifest(projectRoot)) ?? undefined;
  const result = await fromTicket({
    projectRoot,
    ticketId,
    manifest,
  });

  return {
    result,
    continueRun: Boolean(options.continueRun),
    projectRoot,
  };
}

export function formatFromTicketReport(r: FromTicketCommandResult): string {
  const { result, continueRun } = r;
  const lines = [
    `sdd from-ticket → ${result.ref.provider}:${result.ref.id}`,
    `draft: ${result.draftSpecPath}`,
    `provenance: ${result.provenancePath}`,
    `title: ${result.ticket.title}`,
    "",
    "Human gate: review/edit the draft in specs/ (only iteration surface).",
    "Do not invent acceptance criteria missing from the ticket.",
  ];
  if (continueRun) {
    lines.push(
      "",
      "Flag --run set: if specs are complete/testable, enter the host auto-loop",
      "(`/sdd run` / `SDD: run`). Otherwise still pause for human enrichment first.",
      "CLI does not execute LLM phases; use sdd verify after the host implements.",
    );
  }
  return lines.join("\n");
}
