# MergeProof

MergeProof turns a public GitHub pull request into an evidence-linked contributor dossier.

The trust boundary is explicit:

- GitHub supplies merge state, diff statistics, changed files, linked issues and release-note references.
- Apertus supplies multilingual synthesis.
- Every generated claim must retain evidence references.
- Model-written technical summaries and portfolio statements need their own supporting evidence refs or are replaced.
- Missing evidence stays unknown instead of becoming a confident story.

## Why this exists

A GitHub achievement or merged PR is useful reputation, but non-technical reviewers often cannot tell what the contribution actually proves. MergeProof converts public repository evidence into a portable, multilingual proof-of-work summary without inventing payment, impact, security severity or release inclusion.

## Apertus role

Set an OpenAI-compatible Apertus endpoint. The hackathon-ready example uses the official CSCS managed inference service:

```bash
APERTUS_BASE_URL=https://api.inference.cscs.ch/v1
APERTUS_MODEL=swiss-ai/Apertus-v1.5-8B
APERTUS_API_KEY=your_server_side_key
```

The same adapter can point at Public AI or a local/sovereign OpenAI-compatible Apertus deployment without code changes. See `docs/DEPLOYMENT.md`.

When the endpoint is unavailable, MergeProof still returns a deterministic evidence-only fallback. That fallback is intentionally limited and is not presented as model output.

## Measured evidence pipeline

A reproducible 5-run benchmark against the real BossConsole PR #1681 is committed at `artifacts/benchmark-bossconsole-1681.json`.

The recorded run produced stable facts in all five collections, a 1,060-byte compact evidence packet, and median public GitHub collection latency of 1,127.70 ms. Full methodology and limitations are in `docs/TECHNICAL_REPORT.md`.

A second real compatibility benchmark ran Apertus 1.5 8B locally through MLX on the same PR in English, German, French and Russian. The successful run held `MERGED` stable in 4/4 languages with zero invalid evidence refs after sanitization. This is explicitly a local community-quantized Apertus compatibility result, not a CSCS performance claim.

## Local run

```bash
npm test
npm run dev
```

Open http://127.0.0.1:8789

Sample:

```
https://github.com/risa-labs-inc/BossConsole/pull/1681
```

## API

`POST /api/analyze`

```json
{
  "url": "https://github.com/risa-labs-inc/BossConsole/pull/1681",
  "language": "English"
}
```

## Hack Apertus

Track: Apertus Adoption / Own Project.

Built during the active online hackathon period, 1–16 October 2026.

The planned Apertus-specific evaluation asks whether multilingual synthesis preserves the same evidence refs across English, German, French and Russian instead of silently strengthening claims.

## License

- Source code: Apache License 2.0 (`Apache-2.0`).
- Documentation, designs, and other non-code hackathon materials: Creative Commons Attribution 4.0 (`CC-BY-4.0`).
