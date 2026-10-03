const $ = id => document.getElementById(id);
const esc = v => String(v ?? "");

function render(data) {
  const e = data.evidence;
  const a = data.analysis;
  $("result").classList.remove("hidden");
  $("status").innerHTML = `<strong>${data.mode}</strong> · ${esc(data.model || "no model configured")}`;
  $("title").textContent = e.pr.title;
  $("facts").innerHTML = [
    ["Merged", e.pr.merged ? "yes" : "no"],
    ["Merged at", e.pr.merged_at || "—"],
    ["Files", e.pr.changed_files],
    ["Diff", `+${e.pr.additions} / -${e.pr.deletions}`]
  ].map(([k,v]) => `<div><span>${k}</span><strong>${esc(v)}</strong></div>`).join("");
  $("portfolio").textContent = a.portfolio_statement;
  $("summary").textContent = a.technical_summary;
  $("claims").innerHTML = (a.claims || []).map(c =>
    `<article class="claim"><p>${esc(c.claim)}</p><small>${(c.evidence_refs || []).join(" · ")}</small></article>`
  ).join("");
  $("files").innerHTML = e.files.map(f =>
    `<div class="row"><code>${esc(f.filename)}</code><span>+${f.additions} / -${f.deletions}</span></div>`
  ).join("");
  $("issues").innerHTML = e.linked_issues.length
    ? e.linked_issues.map(i => `<div class="row"><a href="${i.url}" target="_blank">#${i.number} ${esc(i.title)}</a><span>${i.state}</span></div>`).join("")
    : '<p class="fine">No linked issue reference found.</p>';
  $("releases").innerHTML = e.release_matches.length
    ? e.release_matches.map(r => `<div class="row"><a href="${r.url}" target="_blank">${esc(r.tag)}</a><span>${esc(r.published_at)}</span></div>`).join("")
    : '<p class="fine">No fetched release explicitly references this PR.</p>';
}

$("form").addEventListener("submit", async event => {
  event.preventDefault();
  $("run").disabled = true;
  $("status").textContent = "Collecting GitHub evidence…";
  $("result").classList.add("hidden");
  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: $("url").value, language: $("language").value })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Analysis failed.");
    render(data);
  } catch (error) {
    $("status").textContent = error.message;
  } finally {
    $("run").disabled = false;
  }
});
