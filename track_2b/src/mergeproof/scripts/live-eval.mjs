#!/usr/bin/env node
import fs from "node:fs/promises";
import { apertureAnalyze, collectEvidence } from "../api/analyze.js";
import { evidenceRefExists, parsePullRequestUrl } from "../src/core.js";

const prUrl = process.argv[2] || "https://github.com/risa-labs-inc/BossConsole/pull/1681";
const outputPath = process.argv[3] || "";
const languages = ["English", "German", "French", "Russian"];

if (!process.env.APERTUS_BASE_URL) {
  console.error("APERTUS_BASE_URL is required for a live evaluation.");
  process.exit(2);
}

const ref = parsePullRequestUrl(prUrl);
const evidence = await collectEvidence(ref);
const rows = [];

for (const language of languages) {
  const started = Date.now();
  const result = await apertureAnalyze(evidence, language);
  const analysis = result.analysis || {};
  const claims = Array.isArray(analysis.claims) ? analysis.claims : [];
  const invalidRefs = claims.flatMap(claim =>
    Array.isArray(claim.evidence_refs)
      ? claim.evidence_refs.filter(ref => !evidenceRefExists(ref, evidence))
      : ["<missing evidence_refs>"]
  );
  const invalid = claims.filter(claim =>
    !Array.isArray(claim.evidence_refs) ||
    claim.evidence_refs.length === 0 ||
    claim.evidence_refs.some(ref => !evidenceRefExists(ref, evidence))
  );
  const narratives = [
    {
      field: "technical_summary",
      text: analysis.technical_summary,
      refs: analysis.technical_summary_refs
    },
    {
      field: "portfolio_statement",
      text: analysis.portfolio_statement,
      refs: analysis.portfolio_statement_refs
    }
  ];
  const invalidNarratives = narratives.filter(item =>
    !item.text ||
    !Array.isArray(item.refs) ||
    item.refs.length === 0 ||
    item.refs.some(ref => !evidenceRefExists(ref, evidence))
  );

  rows.push({
    language,
    mode: result.mode,
    model: result.model,
    format_repair: Boolean(result.format_repair),
    duration_ms: Date.now() - started,
    status: analysis.status,
    claim_count: claims.length,
    unsupported_claims_after_sanitizer: invalid.length,
    invalid_evidence_refs: invalidRefs,
    unsupported_narratives_after_sanitizer: invalidNarratives.map(item => item.field),
    grounding: analysis.grounding || null,
    evidence_refs: claims.map(claim => claim.evidence_refs || []),
    narrative_refs: Object.fromEntries(narratives.map(item => [item.field, item.refs || []]))
  });
}

const expectedStatus = evidence.pr.merged ? "MERGED" : "NOT_MERGED";
const endpointHost = new URL(process.env.APERTUS_BASE_URL).hostname;
const endpointClass = ["127.0.0.1", "localhost", "::1"].includes(endpointHost)
  ? "local-loopback"
  : "hosted";
const thinkingValue = String(process.env.APERTUS_ENABLE_THINKING || "").toLowerCase();
const report = {
  schema: "mergeproof.live_eval.v2",
  generated_at: new Date().toISOString(),
  runtime: {
    endpoint_class: endpointClass,
    model: rows[0]?.model || process.env.APERTUS_MODEL || null,
    thinking_enabled: ["true", "1", "yes"].includes(thinkingValue)
  },
  pr: {
    url: evidence.pr.url,
    merged: evidence.pr.merged,
    merged_at: evidence.pr.merged_at,
    changed_files: evidence.pr.changed_files,
    linked_issue_count: evidence.linked_issues.length,
    release_match_count: evidence.release_matches.length
  },
  invariant: {
    expected_status: expectedStatus,
    all_languages_status_stable: rows.every(row => row.status === expectedStatus),
    all_claims_have_refs: rows.every(row => row.unsupported_claims_after_sanitizer === 0),
    all_narratives_have_refs: rows.every(row => row.unsupported_narratives_after_sanitizer.length === 0)
  },
  runs: rows
};

const rendered = JSON.stringify(report, null, 2) + "\n";
if (outputPath) {
  await fs.writeFile(outputPath, rendered, { encoding: "utf8", flag: "wx" });
  console.error(`Wrote redacted live evaluation to ${outputPath}`);
}
process.stdout.write(rendered);

if (
  !report.invariant.all_languages_status_stable ||
  !report.invariant.all_claims_have_refs ||
  !report.invariant.all_narratives_have_refs
) {
  process.exitCode = 3;
}
