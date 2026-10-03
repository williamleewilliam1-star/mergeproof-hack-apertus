#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const checks = [];

async function text(file) {
  return fs.readFile(path.join(root, file), "utf8");
}

async function exists(file) {
  try {
    await fs.access(path.join(root, file));
    return true;
  } catch {
    return false;
  }
}

function check(id, ok, detail) {
  checks.push({ id, ok: Boolean(ok), detail });
}
const required = [
  "README.md",
  "SUBMISSION.md",
  "LICENSE",
  "NOTICE.md",
  "docs/TECHNICAL_REPORT.md",
  "docs/JUDGING_ALIGNMENT.md",
  ".github/workflows/ci.yml",
  "artifacts/benchmark-bossconsole-1681.json",
  "artifacts/live-eval-local-apertus-mxfp4-20261003.json"
];

for (const file of required) {
  check("file:" + file, await exists(file), "Required submission evidence: " + file);
}

const pkg = JSON.parse(await text("package.json"));
check("package_license", pkg.license === "Apache-2.0", "package.json declares Apache-2.0.");

const license = await text("LICENSE");
check("code_license", /Apache License\s+Version 2\.0/i.test(license), "Source license is Apache 2.0.");

const notice = await text("NOTICE.md");
check("docs_license", /CC-BY-4\.0|Creative Commons Attribution 4\.0/i.test(notice), "Non-code materials are CC-BY-4.0.");
const report = await text("docs/TECHNICAL_REPORT.md");
check("technical_report", /System claim/i.test(report) && /Grounding controls/i.test(report), "Technical report contains system claim and controls.");

const alignment = await text("docs/JUDGING_ALIGNMENT.md");
for (const phrase of [
  "Purposeful use of AI",
  "Technical rigour",
  "Value, cost & scalability",
  "Sovereign deployability",
  "Implementation feasibility"
]) {
  check("criterion:" + phrase, alignment.includes(phrase), "Track 2B criterion mapped: " + phrase);
}

const benchmark = JSON.parse(await text("artifacts/benchmark-bossconsole-1681.json"));
check("evidence_benchmark", Boolean(benchmark), "Public GitHub evidence benchmark parses as JSON.");
const live = JSON.parse(await text("artifacts/live-eval-local-apertus-mxfp4-20261003.json"));
const inv = live.invariant || {};
check("live_schema", live.schema === "mergeproof.live_eval.v2", "Live Apertus artifact uses v2 schema.");
check("live_status", inv.all_languages_status_stable === true, "MERGED status is stable across languages.");
check("live_claim_refs", inv.all_claims_have_refs === true, "All accepted claims have evidence refs.");
check("live_narrative_refs", inv.all_narratives_have_refs === true, "All accepted narrative fields have evidence refs.");

const languages = new Set((live.runs || []).map(row => row.language));
check(
  "live_languages",
  ["English", "German", "French", "Russian"].every(x => languages.has(x)),
  "Live evaluation includes English, German, French, and Russian."
);

check(
  "live_model",
  /Apertus/i.test(String(live.runtime?.model || "")),
  "Live evaluation records an Apertus model identifier."
);
const readme = await text("README.md");
check("readme_apertus", /Apertus/i.test(readme), "README explains the Apertus role.");
check("sovereign_path", /sovereign/i.test(readme) || /sovereign/i.test(await text("docs/DEPLOYMENT.md")), "A sovereign deployment path is documented.");

const failed = checks.filter(item => !item.ok);
const result = {
  schema: "mergeproof.submission_preflight.v1",
  generated_at: new Date().toISOString(),
  track: "Hack Apertus — Apertus Adoption / Own Project (2B)",
  ready: failed.length === 0,
  checks,
  blockers: failed.map(item => item.id)
};

console.log(JSON.stringify(result, null, 2));
if (failed.length) process.exitCode = 3;
