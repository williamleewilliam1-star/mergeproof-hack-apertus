import test from "node:test";
import assert from "node:assert/strict";
import { apertureAnalyze, collectEvidence } from "../api/analyze.js";

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" }
  });
}

test("GitHub evidence + Apertus synthesis stays grounded", async () => {
  const oldFetch = globalThis.fetch;
  const oldGithub = process.env.GITHUB_TOKEN;
  const oldBase = process.env.APERTUS_BASE_URL;
  const oldModel = process.env.APERTUS_MODEL;
  const oldKey = process.env.APERTUS_API_KEY;
  const oldThinking = process.env.APERTUS_ENABLE_THINKING;

  process.env.GITHUB_TOKEN = "gh-test-token";
  process.env.APERTUS_BASE_URL = "https://apertus.test/v1";
  process.env.APERTUS_MODEL = "swiss-ai/Apertus-v1.5-8B";
  process.env.APERTUS_API_KEY = "apertus-test-key";
  process.env.APERTUS_ENABLE_THINKING = "false";

  const calls = [];
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    calls.push({ url, init });

    if (url.host === "api.github.com") {
      assert.equal(init.headers.authorization, "Bearer gh-test-token");
      assert.equal(init.headers["x-github-api-version"], "2022-11-28");

      if (url.pathname === "/repos/o/r/pulls/7") {
        return json({
          html_url: "https://github.com/o/r/pull/7",
          title: "fix: evidence pipeline",
          body: "Fixes #3",
          user: { login: "builder" },
          merged: true,
          merged_at: "2026-10-03T00:00:00Z",
          base: { ref: "main" },
          head: { ref: "fix" },
          merge_commit_sha: "abc123",
          additions: 20,
          deletions: 4,
          changed_files: 1
        });
      }
      if (url.pathname === "/repos/o/r/pulls/7/files") {
        return json([{
          filename: "src/evidence.js",
          status: "modified",
          additions: 20,
          deletions: 4,
          changes: 24
        }]);
      }
      if (url.pathname === "/repos/o/r/issues/3") {
        return json({
          title: "Evidence bug",
          state: "open",
          html_url: "https://github.com/o/r/issues/3"
        });
      }
      if (url.pathname === "/repos/o/r/releases") {
        return json([{
          tag_name: "v1.2.0",
          name: "Release 1.2.0",
          body: "Ships #7",
          published_at: "2026-10-03T01:00:00Z",
          html_url: "https://github.com/o/r/releases/tag/v1.2.0"
        }]);
      }
      throw new Error("Unexpected GitHub route: " + url.pathname);
    }

    if (url.host === "apertus.test") {
      assert.equal(url.pathname, "/v1/chat/completions");
      assert.equal(init.headers.authorization, "Bearer apertus-test-key");
      assert.deepEqual(JSON.parse(init.body).chat_template_kwargs, { enable_thinking: false });
      return json({
        model: "swiss-ai/Apertus-v1.5-8B",
        choices: [{
          message: {
            content: JSON.stringify({
              status: "NOT_MERGED",
              language: "German",
              technical_summary: "Apertus summary",
              technical_summary_refs: ["pr.merged", "files[0]"],
              portfolio_statement: "Apertus portfolio statement",
              portfolio_statement_refs: ["pr.merged", "pr.author"],
              claims: [
                { claim: "Merged contribution", evidence_refs: ["pr.merged"] },
                { claim: "Paid $500", evidence_refs: ["payments.confirmed"] }
              ],
              caveats: []
            })
          }
        }]
      });
    }

    throw new Error("Unexpected host: " + url.host);
  };
  try {
    const evidence = await collectEvidence({ owner: "o", repo: "r", number: 7 });
    assert.equal(evidence.pr.merged, true);
    assert.equal(evidence.linked_issues[0].number, 3);
    assert.equal(evidence.release_matches[0].tag, "v1.2.0");

    const result = await apertureAnalyze(evidence, "German");
    assert.equal(result.mode, "apertus");
    assert.equal(result.analysis.status, "MERGED");
    assert.equal(result.analysis.technical_summary, "Apertus summary");
    assert.equal(result.analysis.portfolio_statement, "Apertus portfolio statement");
    assert.equal(result.analysis.grounding.technical_summary_grounded, true);
    assert.equal(result.analysis.grounding.portfolio_statement_grounded, true);
    assert.equal(result.analysis.claims.length, 1);
    assert.equal(result.analysis.claims[0].claim, "Merged contribution");
    assert.equal(result.analysis.grounding.rejected_claims, 1);

    const githubCalls = calls.filter(x => x.url.host === "api.github.com");
    assert.equal(githubCalls.length, 4);
    assert.equal(calls.filter(x => x.url.host === "apertus.test").length, 1);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldGithub === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = oldGithub;
    if (oldBase === undefined) delete process.env.APERTUS_BASE_URL;
    else process.env.APERTUS_BASE_URL = oldBase;
    if (oldModel === undefined) delete process.env.APERTUS_MODEL;
    else process.env.APERTUS_MODEL = oldModel;
    if (oldKey === undefined) delete process.env.APERTUS_API_KEY;
    else process.env.APERTUS_API_KEY = oldKey;
    if (oldThinking === undefined) delete process.env.APERTUS_ENABLE_THINKING;
    else process.env.APERTUS_ENABLE_THINKING = oldThinking;
  }
});

test("Public AI key alias sends auth and required User-Agent", async () => {
  const oldFetch = globalThis.fetch;
  const oldBase = process.env.APERTUS_BASE_URL;
  const oldModel = process.env.APERTUS_MODEL;
  const oldApertus = process.env.APERTUS_API_KEY;
  const oldCscs = process.env.CSCS_INFERENCE_API_KEY;
  const oldPublic = process.env.PUBLICAI_API_KEY;

  process.env.APERTUS_BASE_URL = "https://api.publicai.test/v1";
  process.env.APERTUS_MODEL = "swiss-ai/apertus-v1.5-8b";
  delete process.env.APERTUS_API_KEY;
  delete process.env.CSCS_INFERENCE_API_KEY;
  process.env.PUBLICAI_API_KEY = "publicai-test-key";

  const evidence = {
    pr: {
      merged: true, merged_at: "2026-10-03T00:00:00Z",
      owner: "o", repo: "r", title: "Merged PR",
      changed_files: 1, additions: 2, deletions: 0
    },
    files: [], linked_issues: [], release_matches: []
  };
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    assert.equal(url.host, "api.publicai.test");
    assert.equal(url.pathname, "/v1/chat/completions");
    assert.equal(init.headers.authorization, "Bearer publicai-test-key");
    assert.equal(init.headers["user-agent"], "BABYDOV-MergeProof/0.2");
    return json({
      model: "swiss-ai/apertus-v1.5-8b",
      choices: [{
        message: {
          content: JSON.stringify({
            status: "MERGED",
            language: "English",
            technical_summary: "Grounded summary",
            technical_summary_refs: ["pr.merged"],
            portfolio_statement: "Grounded portfolio statement",
            portfolio_statement_refs: ["pr.merged"],
            claims: [{ claim: "Merged", evidence_refs: ["pr.merged"] }],
            caveats: []
          })
        }
      }]
    });
  };

  try {
    const result = await apertureAnalyze(evidence, "English");
    assert.equal(result.mode, "apertus");
    assert.equal(result.model, "swiss-ai/apertus-v1.5-8b");
    assert.equal(result.analysis.status, "MERGED");
    assert.deepEqual(result.analysis.claims[0].evidence_refs, ["pr.merged"]);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldBase === undefined) delete process.env.APERTUS_BASE_URL;
    else process.env.APERTUS_BASE_URL = oldBase;
    if (oldModel === undefined) delete process.env.APERTUS_MODEL;
    else process.env.APERTUS_MODEL = oldModel;
    if (oldApertus === undefined) delete process.env.APERTUS_API_KEY;
    else process.env.APERTUS_API_KEY = oldApertus;
    if (oldCscs === undefined) delete process.env.CSCS_INFERENCE_API_KEY;
    else process.env.CSCS_INFERENCE_API_KEY = oldCscs;
    if (oldPublic === undefined) delete process.env.PUBLICAI_API_KEY;
    else process.env.PUBLICAI_API_KEY = oldPublic;
  }
});
test("malformed Apertus JSON gets exactly one same-model syntax repair", async () => {
  const oldFetch = globalThis.fetch;
  const oldBase = process.env.APERTUS_BASE_URL;
  const oldModel = process.env.APERTUS_MODEL;
  const oldKey = process.env.APERTUS_API_KEY;
  const oldThinking = process.env.APERTUS_ENABLE_THINKING;

  process.env.APERTUS_BASE_URL = "https://repair.test/v1";
  process.env.APERTUS_MODEL = "swiss-ai/Apertus-v1.5-8B";
  process.env.APERTUS_API_KEY = "repair-test-key";
  process.env.APERTUS_ENABLE_THINKING = "false";

  const evidence = {
    pr: {
      merged: true, merged_at: "2026-10-03T00:00:00Z",
      owner: "o", repo: "r", title: "Merged PR",
      changed_files: 1, additions: 2, deletions: 0
    },
    files: [{ filename: "src/a.js" }],
    linked_issues: [],
    release_matches: [{ tag: "v1.0.0" }]
  };

  let calls = 0;
  globalThis.fetch = async (_input, init = {}) => {
    calls += 1;
    const body = JSON.parse(init.body);
    assert.deepEqual(body.chat_template_kwargs, { enable_thinking: false });
    if (calls === 1) {
      return json({
        model: "swiss-ai/Apertus-v1.5-8B",
        choices: [{ message: {
          content: '{"status":"MERGED","language":"English","technical_summary":"x","portfolio_statement":"y","claims":[{"claim":"Merged","evidence_refs":[{"path":"pr.merged"}]}],"caveats":[]'
        }}]
      });
    }
    assert.equal(calls, 2);
    const repairPrompt = body.messages[1].content;
    assert.match(repairPrompt, /<untrusted_model_output>/);
    assert.match(body.messages[0].content, /Do not add facts/i);
    return json({
      model: "swiss-ai/Apertus-v1.5-8B",
      choices: [{ message: {
        content: JSON.stringify({
          status: "MERGED",
          language: "English",
          technical_summary: "x",
          portfolio_statement: "y",
          claims: [{ claim: "Merged", evidence_refs: ["pr.merged"] }],
          caveats: []
        })
      }}]
    });
  };

  try {
    const result = await apertureAnalyze(evidence, "English");
    assert.equal(calls, 2);
    assert.equal(result.format_repair, true);
    assert.equal(result.analysis.status, "MERGED");
    assert.deepEqual(result.analysis.claims[0].evidence_refs, ["pr.merged"]);
    assert.equal(result.analysis.grounding.rejected_claims, 0);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldBase === undefined) delete process.env.APERTUS_BASE_URL;
    else process.env.APERTUS_BASE_URL = oldBase;
    if (oldModel === undefined) delete process.env.APERTUS_MODEL;
    else process.env.APERTUS_MODEL = oldModel;
    if (oldKey === undefined) delete process.env.APERTUS_API_KEY;
    else process.env.APERTUS_API_KEY = oldKey;
    if (oldThinking === undefined) delete process.env.APERTUS_ENABLE_THINKING;
    else process.env.APERTUS_ENABLE_THINKING = oldThinking;
  }
});
test("official Hack Apertus LLM_* variables configure Apertus", async () => {
  const oldFetch = globalThis.fetch;
  const saved = Object.fromEntries(
    ["APERTUS_BASE_URL","APERTUS_MODEL","APERTUS_API_KEY","CSCS_INFERENCE_API_KEY","PUBLICAI_API_KEY","LLM_BASE_URL","LLM_NAME","LLM_API_KEY"]
      .map(k => [k, process.env[k]])
  );
  delete process.env.APERTUS_BASE_URL;
  delete process.env.APERTUS_MODEL;
  delete process.env.APERTUS_API_KEY;
  delete process.env.CSCS_INFERENCE_API_KEY;
  delete process.env.PUBLICAI_API_KEY;
  process.env.LLM_BASE_URL = "https://official-env.test/v1";
  process.env.LLM_NAME = "swiss-ai/Apertus-v1.5-8B";
  process.env.LLM_API_KEY = "official-env-test-key";

  const evidence = {
    pr: { merged: true, merged_at: "2026-10-03T00:00:00Z", owner: "o", repo: "r", title: "Merged PR", changed_files: 1, additions: 2, deletions: 0 },
    files: [], linked_issues: [], release_matches: []
  };
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    assert.equal(url.host, "official-env.test");
    assert.equal(init.headers.authorization, "Bearer official-env-test-key");
    const body = JSON.parse(init.body);
    assert.equal(body.model, "swiss-ai/Apertus-v1.5-8B");
    return json({
      model: body.model,
      choices: [{ message: { content: JSON.stringify({
        status: "MERGED", language: "English",
        technical_summary: "Grounded summary", technical_summary_refs: ["pr.merged"],
        portfolio_statement: "Grounded portfolio statement", portfolio_statement_refs: ["pr.merged"],
        claims: [{ claim: "Merged", evidence_refs: ["pr.merged"] }], caveats: []
      }) } }]
    });
  };
  try {
    const result = await apertureAnalyze(evidence, "English");
    assert.equal(result.mode, "apertus");
    assert.equal(result.analysis.status, "MERGED");
  } finally {
    globalThis.fetch = oldFetch;
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
