# Hack Apertus Track 2B — judging alignment

MergeProof is submitted to **Apertus Adoption / Own Project (2B)**.

This document maps the project to the five published Track 2B criteria and points to reproducible evidence in the repository.

## Purposeful use of AI

Apertus is not used as a decorative text generator. It performs the multilingual synthesis step that turns a compact public GitHub evidence packet into a contributor dossier.

The deterministic layer owns source truth: merge state, changed files, linked issues and release references. Apertus must cite those fields through evidence refs. Unsupported model statements are removed rather than displayed.

Evidence:
- `api/analyze.js`
- `src/core.js`
- `artifacts/live-eval-local-apertus-mxfp4-20261003.json`
## Technical rigour

The model boundary is adversarially constrained:
- repository strings are marked as untrusted data;
- merge state cannot be changed by model output;
- high-risk payment/release claims are semantically gated;
- claims and narrative fields require resolvable evidence refs;
- malformed JSON gets at most one same-model structure-only repair;
- the repair path is forbidden from introducing new facts or refs.

Verification:
- `npm test`
- GitHub Actions CI
- `artifacts/benchmark-bossconsole-1681.json`
- four-language live Apertus evaluation artifact
## Value, cost & scalability

MergeProof does not ingest an entire repository into the model.

The demonstrated PR produces a compact evidence packet of 1,060 bytes. Input growth is bounded to:
- PR metadata;
- up to 40 changed-file summaries;
- up to 10 linked issues;
- up to 10 release matches.

There is no application database and no user-profile store. Public GitHub access is sufficient for a low-volume demo, while an optional server token can raise rate limits.

This architecture keeps token use and data movement bounded independently of repository size.
## Sovereign deployability

The model adapter is OpenAI-compatible and is not tied to a proprietary fallback.

Supported paths include:
- official/managed Apertus infrastructure when credentials are available;
- local or sovereign Apertus serving;
- compatible hosted Apertus providers for testing.

A real local Apple Silicon run used `m1rkocasu/Apertus-v1.5-8B-text-MLX-mxfp4` through `mlx_lm.server` on loopback. No proprietary model was substituted.

See `docs/DEPLOYMENT.md`.
## Implementation feasibility

The end-to-end evidence path has been exercised against a real merged external contribution:

`https://github.com/risa-labs-inc/BossConsole/pull/1681`

The collector found the merge state, linked issue and release reference. A real Apertus 1.5 model then synthesized English, German, French and Russian outputs under the same grounding policy.

The fresh recorded run keeps status stable in all four languages with zero invalid accepted evidence refs and grounded narrative fields in all four runs.

## Dataset relevance

MergeProof does **not** create or submit a training dataset.

It processes user-selected public GitHub metadata on demand. The JSON files in `artifacts/` are reproducibility/evaluation evidence for this project, not a dataset offered for downstream training.

## Remaining limitation

The committed live evaluation proves local Apertus compatibility and sovereign deployability. A final organizer-facing run on the intended hosted/official Apertus endpoint should be repeated if credentials become available before submission.
