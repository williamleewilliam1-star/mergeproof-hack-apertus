# MergeProof architecture

MergeProof separates factual evidence collection from model synthesis.

1. Validate a public GitHub pull-request URL against a strict allowlist.
2. Collect merge state, changed files, linked issues, and release references from GitHub REST.
3. Compact the evidence into a bounded JSON packet.
4. Send only that packet plus the requested language to Apertus.
5. Validate model JSON field-by-field against evidence references.
6. Overwrite merge state from GitHub source truth.
7. Remove or replace unsupported model statements with evidence-backed fallback text.

## Track 2B target architecture

**Option a: On-premise.** The Docker application can run on organisation-controlled infrastructure. Apertus can run on the same infrastructure through an OpenAI-compatible endpoint. GitHub REST is the only required external runtime data source in this prototype.

Official Hack Apertus runtime variables are supported directly:
- `LLM_NAME`
- `LLM_BASE_URL`
- `LLM_API_KEY`

Legacy `APERTUS_*` aliases remain supported to reproduce the committed evaluation.
