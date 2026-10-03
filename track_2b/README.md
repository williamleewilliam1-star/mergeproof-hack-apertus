# Track 2 B: Own Project — MergeProof

MergeProof turns a public GitHub pull request into an evidence-linked multilingual contribution dossier. GitHub supplies the facts; Apertus explains them without becoming the source of truth.

## Why Apertus

Apertus is the multilingual synthesis layer. Every accepted model claim must retain evidence references. Merge state, linked issues, changed files, and release references are sourced from GitHub and validated independently of the model.

## Run

From this `track_2b/` directory:

```bash
LLM_NAME=swiss-ai/Apertus-v1.5-8B \
LLM_BASE_URL=https://your-openai-compatible-apertus-endpoint/v1 \
LLM_API_KEY=your_key \
make run
```

Open `http://127.0.0.1:8789`. The API key stays server-side inside the container.

## Test

```bash
make test
```

## Target architecture

Track 2B option **a) On-premise**. The application container and Apertus endpoint can run under the organisation's own administration. See `docs/ARCHITECTURE.md`.

## Data

No proprietary dataset is required. Runtime evidence comes from public GitHub pull requests. Reproducible benchmark and evaluation artifacts are committed under `src/mergeproof/artifacts/`. The `data/` directory is intentionally empty.

## Submission assets

- `technical_report.md` — report source.
- `MergeProof_Report.pdf` — max-six-page report, added before final submission.
- `docs/ARCHITECTURE.md` — trust boundary and deployment model.
- `src/mergeproof/` — application, tests, evaluation artifacts, and original project documentation.

## License

Software: Apache-2.0. Submission documentation: CC-BY-4.0 as required by Hack Apertus.
