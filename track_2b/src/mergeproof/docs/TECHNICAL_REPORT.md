# MergeProof — technical report

## System claim

MergeProof separates repository facts from model synthesis.

The deterministic layer collects a public GitHub pull request, changed files, linked issues and release references. Apertus receives only a compact evidence packet. Model claims are accepted only when their `evidence_refs` resolve to real fields in that packet. The free-text `technical_summary` and `portfolio_statement` must also carry their own valid evidence refs; otherwise MergeProof replaces them with evidence-backed fallback text.

This design keeps merge state, release evidence, and the final grounding gate outside the language model.

## Real external benchmark

Benchmark target:

`https://github.com/risa-labs-inc/BossConsole/pull/1681`

Command:

```bash
BENCH_RUNS=5 npm run benchmark:evidence -- \
  "https://github.com/risa-labs-inc/BossConsole/pull/1681" \
  "artifacts/benchmark-bossconsole-1681.json"
```

No GitHub token was used for the recorded run.
### Observed result

Across 5 independent evidence collections:

- stable result: **yes**
- merged: **true**
- changed files: **2**
- linked issues: **1**
- matching release references: **1**
- compact evidence size: **1,060 bytes** in every run
- latency min: **990.58 ms**
- latency median: **1,127.70 ms**
- latency p90: **1,144.74 ms**
- latency max: **4,568.08 ms**

The slow maximum is retained rather than discarded. It reflects public-network/API variability and is why MergeProof uses explicit request timeouts.

Machine-readable evidence: `artifacts/benchmark-bossconsole-1681.json`.

## Grounding controls

The automated suite verifies that:

1. an unmerged PR cannot be promoted to MERGED by model output;
2. model claims without evidence refs are removed;
3. refs to nonexistent paths are removed;
4. a ref such as `files[0].nonexistent` is invalid even when `files[0]` exists;
5. model-written technical summaries without valid refs are replaced;
6. model-written portfolio statements without valid refs are replaced;
7. the same grounding rules hold for English, German, French and Russian.
## Apertus deployment

MergeProof supports three OpenAI-compatible Apertus paths without changing application logic:

- CSCS managed inference;
- Public AI for lightweight hosted testing;
- local or sovereign OpenAI-compatible Apertus serving.

`npm run verify:apertus` checks the provider's `/v1/models` response before a live demo. API keys remain server-side.

## Cost and scalability observations

The GitHub evidence collector needs no database and the measured evidence packet for the demonstrated PR is only 1,060 bytes.

The language model does not ingest a full repository. It receives a bounded packet of PR metadata, at most 40 changed-file summaries, at most 10 linked issues and at most 10 release matches. This bounds prompt growth independently of repository size.

Public GitHub access works without credentials for low-volume demos; an optional server token can raise API rate limits without changing browser code.

## Local Apertus 1.5 compatibility benchmark

On 2026-10-03, MergeProof was also exercised against a real local Apertus 1.5 model through an OpenAI-compatible MLX endpoint.

Model used:

`m1rkocasu/Apertus-v1.5-8B-text-MLX-mxfp4`

This is a community MLX quantization of Apertus 1.5 8B used for local compatibility testing. It is **not** the official CSCS managed endpoint, and the measurements below must not be presented as CSCS performance.

The local build defaults to deliberation. MergeProof therefore supports the optional server-side setting `APERTUS_ENABLE_THINKING=false`; hosted providers are unchanged when that variable is omitted.

Fresh reproducible BossConsole #1681 run on the current hardened code:

- runtime: `mlx-lm 0.31.3`, loopback OpenAI-compatible server, thinking disabled;
- languages: English, German, French, Russian;
- status invariant: **MERGED in 4/4 languages**;
- accepted claims with invalid refs after sanitizer: **0**;
- invalid evidence refs: **0**;
- unsupported narrative fields after sanitizer: **0**;
- grounded technical summary + portfolio statement: **4/4 languages**;
- format-repair usage: **0/4**;
- latency: English **17,498 ms**, German **13,373 ms**, French **12,807 ms**, Russian **20,286 ms**;
- median language latency: **15,435.5 ms**.

Machine-readable result: `artifacts/live-eval-local-apertus-mxfp4-20261003.json`.
Artifact SHA-256: `19f377882a0ddbc14176188de71dad0381690118029e34002d7f8ef8fdb65543`.

During compatibility work, an earlier Russian response produced malformed JSON. MergeProof now permits exactly one syntax/structure repair pass through the same Apertus model, after which the ordinary evidence sanitizer remains authoritative. A second malformed result still fails explicitly; the repair path is not a factual fallback.

## Remaining limitation

The local benchmark proves the model boundary and multilingual grounding behavior on Apple Silicon, but final organizer-facing deployment should still be repeated on the intended hosted/official Apertus provider when those credentials are available.
