// TrialAugur home: example case, stat strip, leaderboard, paper box.

(async function () {
  const S = window.SITE;
  document.getElementById("paper-cite").textContent = S.paper.citation;
  if (S.paper.status === "published") {
    document.getElementById("paper-tag").remove();
    document.getElementById("paper-note").innerHTML = S.paper.url
      ? `<a href="${S.paper.url}" target="_blank" rel="noopener">${S.paper.url}</a>` : "";
  }

  const [st, ev, res] = await Promise.all([
    loadJSON("data/stats.json"), loadJSON("data/evaluation.json"), loadJSON("data/results.json"),
  ]);

  document.getElementById("s-cohort").textContent = st.n_cohort.toLocaleString();
  document.getElementById("s-eval").textContent = st.n_eval;
  document.getElementById("s-eval-l").textContent =
    `readouts after 29 Jul 2026 adjudicated: ${st.n_success} successes, ${st.n_fail} failures`;
  document.getElementById("s-prauc").textContent = f3(st.ens_prauc);
  document.getElementById("s-prauc-l").textContent =
    `PR AUC of the simple rank ensemble (95% CI ${ciText(st.ens_prauc_ci)})`;

  // worked example from the paper: XPORT-EC-042
  const c = res.find((r) => r.nct === "NCT05611931");
  if (c) {
    const call = (v) => (v >= 0.5 ? "success" : "failure");
    const line = (name, v) => {
      const ok = (v >= 0.5) === (c.outcome === "success");
      return `<div><span>${name}</span><b class="${ok ? "ok" : "bad"}">${f3(v)} · ${call(v)} ${ok ? "✓" : "✗"}</b></div>`;
    };
    document.getElementById("case").innerHTML = `
      <div class="cardlabel">Example readout</div>
      <div class="trialid">${c.nct} · ${c.phase} · read out ${fmtDate(c.date)}</div>
      <div class="trialname">XPORT-EC-042, selinexor maintenance in TP53 wild type endometrial cancer</div>
      ${pill("Failure · primary PFS endpoint missed", "fail")}
      <div class="calls" style="margin-top:16px">
        ${line("Simple rank ensemble", c.ens)}${line("GPT-5 reasoning expert", c.gpt5)}
        ${line("Claude Opus 5 zero shot", c.opus5)}${line("GPT-5.6 zero shot", c.gpt56)}
      </div>
      <div class="foot">Karyopharm share price: ${pct(c.move)} from the 29 July close to the mean close over the readout day
        and the next two trading days.</div>`;
  }

  // leaderboard
  const w = ev.window;
  document.getElementById("lb-sub").textContent =
    `${w.n} trials read out after 29 July 2026 (${w.success} successes, ${w.fail} failures). ` +
    `PR AUC with 95% bootstrap intervals; dotted line marks the success rate.`;
  dotPlot(document.getElementById("lb-chart"),
    ev.models.map((m) => ({ name: m.name, kind: m.kind, v: m.prauc, lo: m.prauc_ci[0], hi: m.prauc_ci[1], metric: "PR AUC" })),
    { base: w.success / w.n });
  document.getElementById("lb-table").innerHTML =
    `<thead><tr><th>System</th><th class="num">PR AUC</th><th class="num">Failures caught</th><th class="num">False alarms</th></tr></thead><tbody>` +
    ev.models.map((m) => `<tr><td class="name"><span class="dot ${m.kind === "TrialAugur" ? "o" : "c"}"></span>${m.name}</td>
      <td class="num">${f3(m.prauc)}</td><td class="num">${m.fail_caught}/${m.nF}</td><td class="num">${m.false_fail}/${m.nS}</td></tr>`).join("") +
    `</tbody>`;
})();
