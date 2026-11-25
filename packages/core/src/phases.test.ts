import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ALL_PHASES,
  AUTO_LOOP_PHASES,
  CANONICAL_FLOW_STEPS,
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

describe("phases — canonical 11-step flow", () => {
  it("marks specs as human-iterative and run phases as auto-loop", () => {
    assert.equal(SPECS_PHASE, "specs");
    assert.deepEqual(
      [...HUMAN_ITERATIVE_PHASES],
      ["specs", "from-ticket", "bug-report"],
    );
    assert.equal(FROM_TICKET_PHASE, "from-ticket");
    assert.ok(isHumanIterativePhase("specs"));
    assert.ok(isHumanIterativePhase("from-ticket"));
    assert.ok(isHumanIterativePhase("bug-report"));
    assert.equal(isHumanIterativePhase("implement"), false);
  });

  it("AUTO_LOOP_PHASES aliases PHASES for /sdd run steps 2–10", () => {
    assert.deepEqual([...AUTO_LOOP_PHASES], [...PHASES]);
    assert.deepEqual([...PHASES], [
      "spec-tests",
      "dev-spec",
      "implementation-plan",
      "design-approach",
      "unit-tests",
      "integration-tests",
      "e2e-tests",
      "implement",
      "verify",
      "diagnose",
      "evidence",
    ]);
    assert.ok(isAutoLoopPhase("verify"));
    assert.ok(isAutoLoopPhase("spec-tests"));
    assert.ok(isAutoLoopPhase("evidence"));
    assert.equal(isAutoLoopPhase("specs"), false);
    assert.equal(isAutoLoopPhase("research"), false);
    assert.equal(DEFAULT_MAX_DIAGNOSE_ITERATIONS, 3);
  });

  it("CANONICAL_FLOW_STEPS locks steps 1–11 with artifacts", () => {
    assert.equal(CANONICAL_FLOW_STEPS.length, 11);
    assert.equal(CANONICAL_FLOW_STEPS[0].actor, "human");
    assert.equal(CANONICAL_FLOW_STEPS[0].artifact, "specs/");
    assert.equal(CANONICAL_FLOW_STEPS[9].id, "evidence");
    assert.equal(CANONICAL_FLOW_STEPS[10].id, "research");
    for (let i = 1; i < 11; i++) {
      assert.equal(CANONICAL_FLOW_STEPS[i].actor, "kit");
    }
  });

  it("ALL_PHASES includes specs gate, auto-loop, research, demo, docs, and bugfix", () => {
    assert.equal(ALL_PHASES[0], "specs");
    assert.ok(ALL_PHASES.includes("from-ticket"));
    assert.ok(ALL_PHASES.includes("research"));
    assert.ok(ALL_PHASES.includes("demo"));
    assert.ok(ALL_PHASES.includes("docs"));
    assert.ok(ALL_PHASES.includes("bug-report"));
    assert.ok(isPhaseName("dev-spec"));
    assert.ok(isPhaseName("unit-tests"));
    assert.ok(isAnyPhaseName("specs"));
    assert.ok(isAnyPhaseName("demo"));
    assert.ok(isAnyPhaseName("research"));
    assert.ok(isAnyPhaseName("docs"));
    assert.equal(isPhaseName("specs"), false);
    assert.equal(isPhaseName("research"), false);
    assert.equal(isPhaseName("docs"), false);
  });
});
