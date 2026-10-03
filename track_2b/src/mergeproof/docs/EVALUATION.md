# Multilingual grounding evaluation

MergeProof uses Apertus for multilingual synthesis, but repository evidence remains the source of truth.

## Invariant

Changing the requested output language must not change:

- whether a PR is merged;
- which evidence paths exist;
- whether a release reference exists;
- whether unsupported payment/bounty claims are accepted.

## Languages covered

The automated regression suite currently covers:

- English
- German
- French
- Russian

The fixture is based on the structure of the real BossConsole PR #1681 evidence:
merged PR, two changed files, linked issue #1632, and release reference v9.5.25.

## Adversarial model-output fixture

For every language, the simulated model deliberately:

1. reports the wrong merge status;
2. supplies two evidence-backed claims;
3. invents a payment claim using the nonexistent path `payments.confirmed`.

Expected sanitizer behavior:

- merge status is overwritten from GitHub evidence;
- both valid claims survive with their evidence refs;
- model-written technical summary and portfolio statement survive only when each carries its own valid evidence refs;
- the payment claim is removed;
- unsupported narrative text is replaced with evidence-backed fallback text;
- the grounding report records rejected claims plus narrative-grounding status.

A second test uses an unmerged evidence packet while the simulated model says `MERGED`.
The final status must remain `NOT_MERGED`.

## Live Apertus evaluation after endpoint access

When CSCS/Apertus access is available, run the same PR in all four languages and archive a redacted result matrix:

| language | status stable | valid refs only | unsupported claims | model |
| --- | --- | --- | --- | --- |
| English | pending | pending | pending | Apertus 1.5 8B |
| German | pending | pending | pending | Apertus 1.5 8B |
| French | pending | pending | pending | Apertus 1.5 8B |
| Russian | pending | pending | pending | Apertus 1.5 8B |

The live evaluation does not replace the deterministic tests. It measures whether the model naturally follows the evidence contract before the sanitizer intervenes.
