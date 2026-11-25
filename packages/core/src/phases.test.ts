import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ALL_PHASES,
  AUTO_LOOP_PHASES,
  DEFAULT_MAX_DIAGNOSE_ITERATIONS,
  FROM_TICKET_PHASE,
  HUMAN_ITERATIVE_PHASES,
  PHASES,
  SPECS_PHASE,
  isAnyPhaseName,
  isAutoLoopPhase,
  isHumanIterativePhase,
  isPhaseName,
} from "./phases.js";

describe("phases — human gate vs auto-loop", () => {
  it("marks specs as human-iterative and run phases as auto-loop", () => {
    assert.equal(SPECS_PHASE, "specs");
    assert.deepEqual([...HUMAN_ITERATIVE_PHASES], ["specs", "from-ticket"]);
    assert.equal(FROM_TICKET_PHASE, "from-ticket");
    assert.ok(isHumanIterativePhase("specs"));
    assert.ok(isHumanIterativePhase("from-ticket"));
    assert.equal(isHumanIterativePhase("implement"), false);
  });

  it("AUTO_LOOP_PHASES aliases PHASES for /sdd run", () => {
    assert.deepEqual([...AUTO_LOOP_PHASES], [...PHASES]);
    assert.deepEqual([...PHASES], [
      "normalize",
      "executable",
      "research",
      "plan",
      "implement",
      "verify",
      "diagnose",
      "report",
    ]);
    assert.ok(isAutoLoopPhase("verify"));
    assert.equal(isAutoLoopPhase("specs"), false);
    assert.equal(DEFAULT_MAX_DIAGNOSE_ITERATIONS, 3);
  });

  it("ALL_PHASES includes specs gate before from-ticket and auto-loop", () => {
    assert.equal(ALL_PHASES[0], "specs");
    assert.ok(ALL_PHASES.includes("from-ticket"));
    assert.ok(ALL_PHASES.includes("demo"));
    assert.ok(isPhaseName("plan"));
    assert.ok(isAnyPhaseName("specs"));
    assert.ok(isAnyPhaseName("demo"));
    assert.equal(isPhaseName("specs"), false);
  });
});
