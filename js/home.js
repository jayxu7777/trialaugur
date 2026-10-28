// TrialAugur home: example readout, stat strip, leaderboard, framing callout, paper box.

(async function () {
  const S = window.SITE;
  document.getElementById("paper-cite").textContent = S.paper.citation;
  if (S.paper.status === "published") {
    document.getElementById("paper-tag").remove();
    document.getElementById("paper-note").innerHTML = S.paper.url
      ? `<a href="${S.paper.url}" target="_blank" rel="noopener">${S.paper.url}</a>` : "";
  }

  const [R, rows] = await Promise.all([loadJSON("data/results.json"), loadJSON("data/readouts.json")]);
  const P = R.prospective, M = Object.fromEntries(P.models.map((m) => [m.key, m]));

  document.getElementById("s-cohort").textContent = P.cohort.toLocaleString();
  document.getElementById("s-eval").textContent = P.n;
  document.getElementById("s-eval-l").textContent =
    `readouts after 29 Jul 2026 adjudicated: ${P.nS} successes, ${P.nF} failures`;
  document.getElementById("s-roc").textContent = f3(M.ens.roc[0]);
  document.getElementById("s-roc-l").textContent = `ROC AUC of the rank ensemble (95% CI ${ciText(M.ens.roc.slice(1))})`;

  // worked example: XPORT-EC-042, a failure identified by the ensemble and missed by both comparators
  const c = rows.find((r) => r.nct === "NCT05611931");
  if (c) {
    const line = (name, v) => {
      const ok = (v >= 0.5) === (c.outcome === "success");
      return `<div><span>${name}</span><b class="${ok ? "ok" : "bad"}">${f3(v)} · ${v >= 0.5 ? "success" : "failure"} ${ok ? "✓" : "✗"}</b></div>`;
    };
    document.getElementById("case").innerHTML = `
      <div class="cardlabel">Example readout</div>
      <div class="trialid">${c.nct} · phase ${c.phase} · read out ${fmtDate(c.date)}</div>
      <div class="trialname">XPORT-EC-042, selinexor maintenance in TP53 wild type endometrial cancer</div>
      ${pill("Failure · primary PFS endpoint missed", "fail")}
      <div class="calls" style="margin-top:16px">
        ${line("Rank ensemble", c.scores.ens)}${line("Reasoning expert (GPT-5)", c.scores.reasoning)}
        ${line("Claude Opus 5", c.scores.opus5)}${line("GPT-5.6-Sol", c.scores.gpt56)}
      </div>
      <div class="foot">Karyopharm (${c.ticker}): cumulative abnormal return of ${pctv(c.car)} over the first three trading
        sessions after the disclosure.</div>`;
  }

  // leaderboard
  document.getElementById("lb-sub").textContent =
    `${P.n} trials read out after 29 July 2026 (${P.nS} successes, ${P.nF} failures). ROC AUC with 95% bootstrap ` +
    `intervals; success is the positive class.`;
  dotPlot(document.getElementById("lb-chart"),
    P.models.map((m) => ({ name: m.name, key: m.key, v: m.roc[0], lo: m.roc[1], hi: m.roc[2] })),
    { min: 0.5, max: 1.0, ticks: [0.5, 0.75, 1], base: 0.5, metric: "ROC AUC", sep: [1, 2], left: 210 });
  document.getElementById("lb-legend").innerHTML =
    `<span>Top three rows: TrialAugur experts and rank ensemble. Bottom two: LLM comparators given the NCT ID and web search. ` +
    `Dotted line: 0.5.</span>`;
  document.getElementById("lb-table").innerHTML =
    `<thead><tr><th>Method</th><th class="num">ROC AUC</th><th class="num">AP</th><th class="num">Failures<br>identified</th>
      <th class="num">False<br>alarms</th></tr></thead><tbody>` +
    P.models.map((m) => `<tr><td class="name"><span class="dot" style="background:${MCOL[m.key]}"></span>${m.name}</td>
      <td class="num">${f3(m.roc[0])}</td><td class="num">${f3(m.ap[0])}</td>
      <td class="num">${m.f_correct}/${P.nF}</td><td class="num">${m.s_incorrect}/${P.nS}</td></tr>`).join("") +
    `</tbody>`;

  // prospective highlights (panels of the prospective figure)
  drawClassification(document.getElementById("hl-cls"), P);
  const cmpF = [M.opus5.f_correct, M.gpt56.f_correct], cmpS = [M.opus5.s_incorrect, M.gpt56.s_incorrect];
  document.getElementById("hl-cls-t").textContent =
    `The LLM comparators had the highest ROC AUC point estimates but identified fewer failures (${cmpF.join(" and ")} of ` +
    `${P.nF}) than the experts and the ensemble, while flagging only ${cmpS.join(" and ")} successful trials. The reasoning ` +
    `expert identified ${M.reasoning.f_correct} of ${P.nF} failures and flagged ${M.reasoning.s_incorrect} of ${P.nS} ` +
    `successes, so rankings and classification errors should be considered together.`;
  const SG = P.signals, g0 = SG.groups[0];
  document.getElementById("hl-sig-sub").textContent =
    `Share of the ${SG.n} failures classified as failures, by whether a direct public negative signal appeared before the forecasts`;
  drawSignals(document.getElementById("hl-sig"), SG, { ens: "Rank ensemble", opus5: "Claude Opus 5", gpt56: "GPT-5.6-Sol" });
  document.getElementById("hl-sig-t").textContent =
    `Of the ${g0.n} failures with no direct public signal, the ensemble identified ${g0.counts.ens}, Claude Opus 5 ` +
    `${g0.counts.opus5} and GPT-5.6-Sol ${g0.counts.gpt56}. Many correct comparator failure forecasts cited an earlier ` +
    `public signal in their rationales (${SG.cites.opus5[0]} of ${SG.cites.opus5[1]} and ${SG.cites.gpt56[0]} of ${SG.cites.gpt56[1]}).`;
  const G = P.car.groups;
  drawCarGroups(document.getElementById("hl-car"), G);
  document.getElementById("hl-car-t").textContent =
    `Failures identified by the ensemble and missed by both comparators (A) had the most negative median abnormal return ` +
    `(${pctv(G[0].median)}, n = ${G[0].n}), against ${pctv(G[2].median)} for failures identified by all three methods (C). ` +
    `Exploratory; ${P.car.n} announcements.`;

  // framing callout
  const F = R.evidence.framing, part = Object.fromEntries(F.parts.map((d) => [d.label, d.n]));
  const nF = F.parts.reduce((a, d) => a + d.n, 0);
  document.getElementById("fr-big").firstChild.textContent = `${((100 * part.Positive) / nF).toFixed(1)}%`;
  document.getElementById("fr-small").textContent =
    `of ${nF} unsuccessful trials were disclosed with a favorable dominant message`;
  const pat = F.patterns.map((d) => `${d.label.toLowerCase()} (${d.n})`);
  document.getElementById("fr-text").textContent =
    `We classified the sponsor disclosures of ${nF} unsuccessful trials that read out between ${F.window} by the dominant ` +
    `message of their title, subtitle and conclusion: ${part.Negative} were negative, ${part.Neutral} neutral or unclear and ` +
    `${part.Positive} positive. The positive ones showed these patterns: ${pat.join(", ")}.`;
})();
