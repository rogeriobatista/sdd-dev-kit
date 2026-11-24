export type { TicketProvider, FetchLike, HttpClientOptions } from "./provider.js";
export {
  resolveFetch,
  requireEnv,
  optionalEnv,
} from "./provider.js";

export {
  parseTicketId,
  parseTicketRef,
  detectProvider,
  type DetectedTicketId,
} from "./detect.js";

export {
  mapTicketToSpecMarkdown,
  draftSpecFileName,
  extractAcceptanceCriteriaFromText,
  type MapTicketToSpecOptions,
} from "./map-to-spec.js";

export { LinearProvider, type LinearProviderOptions } from "./linear.js";
export {
  JiraProvider,
  adfOrStringToText,
  type JiraProviderOptions,
} from "./jira.js";

export {
  fromTicket,
  type FromTicketOptions,
  type FromTicketResult,
} from "./from-ticket.js";
