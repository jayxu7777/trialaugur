// TrialAugur — home page: fill stat tiles + paper box.

(async function () {
  const S = window.SITE;

  const tag = document.getElementById("paper-tag");
  const cite = document.getElementById("paper-cite");
  cite.textContent = S.paper.citation;
  if (S.paper.status === "published") {
    tag.remove();
    document.getElementById("paper-note").innerHTML = S.paper.url
      ? `<a href="${S.paper.url}" target="_blank" rel="noopener">${S.paper.url}</a>` : "";
  }

  try {
    const st = await loadJSON("data/stats.json");
    const set = (id, v) => { document.getElementById(id).textContent = v; };
    set("stat-cohort", st.n_cohort.toLocaleString());
    set("stat-pending", st.n_pending.toLocaleString());
    set("stat-reported", st.n_reported_new);
    document.getElementById("stat-reported-detail").textContent =
      `since July 2026 · ${st.n_adjudicated} adjudicated`;
    if (st.accuracy != null) {
      set("stat-acc", Math.round(st.accuracy * 100) + "%");
      document.getElementById("stat-acc-detail").textContent =
        `${st.n_correct}/${st.n_adjudicated} prospective readouts (binary, post-July)`;
    }
    document.getElementById("stats-footnote").textContent =
      `A further ${st.n_reported_pre} cohort trials had readouts disclosed before the ` +
      `${st.snapshot} snapshot; those are consolidated in the paper's prospective ` +
      `evaluation and will be folded into the Results page in a future update.`;
  } catch (e) {
    console.error(e);
  }
})();
