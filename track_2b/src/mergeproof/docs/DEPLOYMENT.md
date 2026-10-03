# Sovereign deployment

MergeProof intentionally keeps model hosting behind an OpenAI-compatible boundary.

## Option A — CSCS managed Apertus

Recommended for Hack Apertus when access is available.

```bash
APERTUS_BASE_URL=https://api.inference.cscs.ch/v1
APERTUS_MODEL=swiss-ai/Apertus-v1.5-8B
APERTUS_API_KEY=<server-side secret>
```

The API key must remain server-side. MergeProof never sends it to the browser.

Health check:

```bash
npm run verify:apertus
```

The preflight accepts `APERTUS_API_KEY`, the official CSCS variable `CSCS_INFERENCE_API_KEY`, or `PUBLICAI_API_KEY`. It checks `/v1/models` and fails if the configured model is unavailable.

The configured model should appear in the returned model list before enabling the demo.

## Option B — Public AI (fast demo path)

Public AI exposes an OpenAI-compatible Apertus endpoint and is useful for a lightweight hackathon demo:

```bash
APERTUS_BASE_URL=https://api.publicai.co/v1
APERTUS_MODEL=swiss-ai/apertus-v1.5-8b
PUBLICAI_API_KEY=<server-side secret>
npm run verify:apertus
```

Public AI requires a User-Agent header; MergeProof sends one automatically. The key remains server-side.

## Option C — local / sovereign Apertus

Any OpenAI-compatible Apertus endpoint can be used without changing application code:

```bash
APERTUS_BASE_URL=http://127.0.0.1:8000/v1
APERTUS_MODEL=swiss-ai/Apertus-v1.5-8B
APERTUS_API_KEY=
# Only when the selected server/model defaults to deliberation:
APERTUS_ENABLE_THINKING=false
```

The optional thinking flag is omitted by default and therefore does not alter CSCS/Public AI requests. It was added after a local MLX Apertus 1.5 build spent its completion budget on reasoning before finishing JSON.

This keeps GitHub evidence collection and model serving independently deployable.

## Evidence-first failure behavior

If no Apertus endpoint is configured, MergeProof does not simulate model output.
It returns the deterministic evidence-only fallback and reports that model synthesis is unavailable.

If an endpoint is configured but fails, the request fails explicitly rather than silently switching to another proprietary model.

## Production checklist

1. Run `npm test`.
2. Verify the GitHub evidence collector against a public PR.
3. Verify `/v1/models` with the intended Apertus provider.
4. Run the same PR in at least two languages.
5. Confirm every generated claim has valid `evidence_refs`.
6. Confirm the UI never exposes `APERTUS_API_KEY` or `GITHUB_TOKEN`.
7. Record model ID, endpoint class, test time, and latency in the demo evidence.
