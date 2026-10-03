import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeAnalysis } from "../src/core.js";

const evidence = {
  pr: {
    merged: true,
    merged_at: "2026-09-25T06:11:47Z",
    owner: "risa-labs-inc",
    repo: "BossConsole",
    title: "fix(terminal): reject non-positive queue timeout and alias protobuf Any",
    changed_files: 2,
    additions: 27,
    deletions: 5
  },
  files: [
    { filename: "modules/boss-app-terminal/src/main/kotlin/ai/rever/boss/app/terminal/TerminalSession.kt" },
    { filename: "modules/boss-app-terminal/src/test/kotlin/ai/rever/boss/app/terminal/TerminalSessionTest.kt" }
  ],
  linked_issues: [
    { number: 1632, title: "follow-up(#1527): reject non-positive inputQueueTimeoutMillis; alias the protobuf Any import" }
  ],
  release_matches: [
    { tag: "v9.5.25", name: "Release BOSS 9.5.25" }
  ]
};

const cases = [
  ["English", "Merged contribution fixing terminal timeout validation.", "The PR shipped in release v9.5.25."],
  ["German", "Zusammengeführter Beitrag zur Terminal-Timeout-Validierung.", "Der PR wurde in Version v9.5.25 veröffentlicht."],
  ["French", "Contribution fusionnée corrigeant la validation du délai du terminal.", "La PR figure dans la version v9.5.25."],
  ["Russian", "Смерженный вклад с исправлением проверки тайм-аута терминала.", "PR указан в релизе v9.5.25."]
];

for (const [language, mergedClaim, releaseClaim] of cases) {
  test(`grounding is language-invariant: ${language}`, () => {
    const analysis = sanitizeAnalysis({
      status: "NOT_MERGED",
      language,
      technical_summary: mergedClaim,
      technical_summary_refs: ["pr.merged", "pr.merged_at"],
      portfolio_statement: mergedClaim,
      portfolio_statement_refs: ["pr.merged", "pr.merged_at"],
      claims: [
        { claim: mergedClaim, evidence_refs: ["pr.merged", "pr.merged_at"] },
        { claim: releaseClaim, evidence_refs: ["release_matches[0]"] },
        { claim: "Paid bounty confirmed", evidence_refs: ["payments.confirmed"] }
      ],
      caveats: []
    }, evidence, language);

    assert.equal(analysis.status, "MERGED");
    assert.equal(analysis.language, language);
    assert.equal(analysis.technical_summary, mergedClaim);
    assert.equal(analysis.portfolio_statement, mergedClaim);
    assert.equal(analysis.grounding.technical_summary_grounded, true);
    assert.equal(analysis.grounding.portfolio_statement_grounded, true);
    assert.equal(analysis.claims.length, 2);
    assert.deepEqual(
      analysis.claims.map(x => x.evidence_refs),
      [["pr.merged", "pr.merged_at"], ["release_matches[0]"]]
    );
    assert.equal(analysis.grounding.input_claims, 3);
    assert.equal(analysis.grounding.accepted_claims, 2);
    assert.equal(analysis.grounding.rejected_claims, 1);
    assert.match(analysis.caveats.join(" "), /removed/i);
  });
}

test("unmerged evidence cannot be promoted by any language output", () => {
  const unmerged = {
    ...evidence,
    pr: { ...evidence.pr, merged: false, merged_at: null },
    release_matches: []
  };

  for (const language of ["English", "German", "French", "Russian"]) {
    const analysis = sanitizeAnalysis({
      status: "MERGED",
      language,
      technical_summary: "Model says accepted",
      portfolio_statement: "Model says merged",
      claims: [
        { claim: "Merged", evidence_refs: ["pr.merged"] },
        { claim: "Released", evidence_refs: ["release_matches[0]"] }
      ],
      caveats: []
    }, unmerged, language);

    assert.equal(analysis.status, "NOT_MERGED");
    assert.equal(analysis.claims.length, 2);
    assert.match(analysis.claims[0].claim, /not been merged/i);
    assert.deepEqual(analysis.claims[0].evidence_refs, ["pr.merged", "pr.merged_at"]);
    assert.equal(analysis.grounding.accepted_claims, 0);
    assert.equal(analysis.grounding.rejected_claims, 2);
    assert.equal(analysis.grounding.technical_summary_grounded, false);
    assert.equal(analysis.grounding.portfolio_statement_grounded, false);
  }
});
