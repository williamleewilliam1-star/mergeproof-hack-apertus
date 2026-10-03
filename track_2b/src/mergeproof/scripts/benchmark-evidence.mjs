#!/usr/bin/env node
import fs from "node:fs/promises";
import { collectEvidence } from "../api/analyze.js";
import { compactEvidence, parsePullRequestUrl } from "../src/core.js";

const prUrl = process.argv[2] || "https://github.com/risa-labs-inc/BossConsole/pull/1681";
const outputPath = process.argv[3] || "";
const requestedRuns = Number(process.env.BENCH_RUNS || 5);
const runs = Math.max(1, Math.min(10, Number.isFinite(requestedRuns) ? requestedRuns : 5));

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return null;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * p)));
  return sorted[index];
}

function summary(values) {
  return {
    min: Math.min(...values),
    median: percentile(values, 0.5),
    p90: percentile(values, 0.9),
    max: Math.max(...values)
  };
}
const ref = parsePullRequestUrl(prUrl);
const observations = [];

for (let index = 0; index < runs; index += 1) {
  const started = performance.now();
  const evidence = await collectEvidence(ref);
  const durationMs = Math.round((performance.now() - started) * 100) / 100;
  const compact = compactEvidence(evidence);
  const compactBytes = Buffer.byteLength(JSON.stringify(compact), "utf8");

  observations.push({
    run: index + 1,
    duration_ms: durationMs,
    compact_evidence_bytes: compactBytes,
    merged: evidence.pr.merged,
    changed_files: evidence.pr.changed_files,
    linked_issue_count: evidence.linked_issues.length,
    release_match_count: evidence.release_matches.length
  });
}

const durations = observations.map(x => x.duration_ms);
const bytes = observations.map(x => x.compact_evidence_bytes);
const stable = observations.every(x =>
  x.merged === observations[0].merged &&
  x.changed_files === observations[0].changed_files &&
  x.linked_issue_count === observations[0].linked_issue_count &&
  x.release_match_count === observations[0].release_match_count
);
const report = {
  schema: "mergeproof.evidence_benchmark.v1",
  generated_at: new Date().toISOString(),
  source: {
    pr_url: prUrl,
    owner: ref.owner,
    repo: ref.repo,
    pull_request: ref.number
  },
  run_count: observations.length,
  stability: {
    stable,
    merged: observations[0].merged,
    changed_files: observations[0].changed_files,
    linked_issue_count: observations[0].linked_issue_count,
    release_match_count: observations[0].release_match_count
  },
  latency_ms: summary(durations),
  compact_evidence_bytes: summary(bytes),
  observations
};

const rendered = JSON.stringify(report, null, 2) + "\n";
if (outputPath) {
  await fs.writeFile(outputPath, rendered, { encoding: "utf8", flag: "wx" });
  console.error("Wrote evidence benchmark to " + outputPath);
}
process.stdout.write(rendered);

if (!stable) process.exitCode = 3;
