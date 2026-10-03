import process from "node:process";

const base = String(process.env.APERTUS_BASE_URL || "").replace(/\/$/, "");
const model = String(process.env.APERTUS_MODEL || "swiss-ai/Apertus-v1.5-8B");
const key = String(
  process.env.APERTUS_API_KEY ||
  process.env.CSCS_INFERENCE_API_KEY ||
  process.env.PUBLICAI_API_KEY ||
  ""
).trim();

if (!base) {
  console.error("APERTUS_BASE_URL is required.");
  process.exit(2);
}
if (!key) {
  console.error("APERTUS_API_KEY, CSCS_INFERENCE_API_KEY, or PUBLICAI_API_KEY is required.");
  process.exit(2);
}

const response = await fetch(base + "/models", {
  headers: {
    authorization: "Bearer " + key,
    accept: "application/json",
    "user-agent": "BABYDOV-MergeProof/0.2"
  },
  signal: AbortSignal.timeout(15000)
});
const raw = await response.text();
if (!response.ok) throw new Error("Apertus model preflight failed: HTTP " + response.status);
const payload = JSON.parse(raw);
const ids = Array.isArray(payload?.data) ? payload.data.map(item => item?.id).filter(Boolean) : [];
if (!ids.includes(model)) {
  throw new Error("Configured Apertus model is not available: " + model);
}
console.log(JSON.stringify({ ok: true, base_url: base, model, available_model_count: ids.length }, null, 2));
