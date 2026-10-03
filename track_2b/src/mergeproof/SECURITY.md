# Security and grounding

MergeProof treats both user input and model output as untrusted.

## Input boundary

- Only `https://github.com/<owner>/<repo>/pull/<number>` inputs are accepted.
- Other hosts and malformed paths are rejected.
- The server constructs GitHub API paths itself; callers cannot supply arbitrary API URLs.

## GitHub access

- Only public repository evidence is required.
- `GITHUB_TOKEN` is optional and server-side only.
- When configured, it is sent only to `api.github.com`.
- Requests use the pinned GitHub REST API version and a 12-second timeout.

## Apertus access

- `APERTUS_API_KEY` is server-side only.
- The model receives a compact evidence packet, not credentials or local files.
- The Apertus base URL and model name are configuration, allowing sovereign/local deployment.

## Model-output grounding

Model output cannot decide whether a PR was merged.

After generation, MergeProof:

1. forces `status` from GitHub `pr.merged`;
2. validates every `evidence_ref`;
3. drops claims with no valid evidence reference;
4. records accepted/rejected claim counts;
5. falls back to deterministic statements when model output is absent or unusable.

A model claim such as `"Paid $500"` with `payments.confirmed` is rejected because that evidence path does not exist.

## Data retention

The MVP has no database and does not persist analyzed PRs or generated dossiers after the request completes.
