// TrialAugur results: evidence construction, prospective evaluation,
// scores by trial, share price responses, portfolio and the readout ledger. Values are those of the paper's figures.

(async function () {
  const [R, rows] = await Promise.all([loadJSON("data/results.json"), loadJSON("data/readouts.json")]);
  const MODELS = R.models, NAME = Object.fromEntries(MODELS.map((m) => [m.key, m.name]));
  const E = R.evidence, P = R.prospective;
  const TC = MCOL.ens, GREY = COL.other;
  const dotName = (k) => `<span class="dot" style="background:${MCOL[k]}"></span>${NAME[k]}`;
  const ci3 = (v) => `<span class="ci">${ciText(v.slice(1))}</span>`;
  const num1 = (v) => minus(Number(v).toFixed(1));


  // ===================================================== evidence construction
  (function () {
    const H = E.human;
    document.getElementById("hc-sub").textContent =
      `Simple random sample of ${H.n} of the ${H.cohort.toLocaleString()} benchmark trials; annotations judged correct`;
    document.getElementById("hc-table").innerHTML =
      `<thead><tr><th>Field</th><th class="num">Human curator</th><th class="num">TrialCurator</th></tr></thead><tbody>` +
      H.rows.map((r) => `<tr><td>${r.field === "MOA" ? "Mechanism of action" : r.field}</td>
        <td class="num">${r.human}/${H.n} (${Math.round((100 * r.human) / H.n)}%)</td>
        <td class="num">${r.tc}/${H.n} (${Math.round((100 * r.tc) / H.n)}%)</td></tr>`).join("") + `</tbody>`;

    const C = E.cost;
    hbars(document.getElementById("cost-chart"), [
      { label: "Human curator", v: C.human, color: GREY, text: `US$${C.human.toFixed(2)}` },
      { label: "TrialCurator", v: C.tc, color: TC, text: `US$${C.tc.toFixed(2)}` },
    ], { max: 20, ticks: [0, 5, 10, 15, 20], left: 120, right: 70, aria: "Cost per trial" });
    document.getElementById("cost-note").textContent =
      `Manual curation took a mean of ${H.minutes} min per trial. At the July 2026 US average hourly earnings for private ` +
      `nonfarm employees (US$${C.wage}) this is US$${C.human.toFixed(2)} per trial, or about US$${C.human_694.toLocaleString()} ` +
      `(${C.hours_694} h) for the 694 trial cohort. TrialCurator's LLM token cost was about US$${C.tc.toFixed(2)} per trial, ` +
      `or US$${C.tc_694} for the cohort.`;

    const Ch = E.chembl;
    document.getElementById("ch-sub").textContent =
      `${Ch.records} drug records (${Ch.drugs} drugs) of ${Ch.trials} randomly sampled benchmark trials; percent of records annotated`;
    (function () {
      const el = document.getElementById("ch-chart");
      const W = fitW(el, 540), left = W < 440 ? 120 : 160, right = 50, top = 8, grp = 78, barh = 20, H = top + grp * Ch.rows.length + 30;
      const sx = (v) => left + (v / 100) * (W - left - right);
      let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Annotation coverage">`;
      [0, 25, 50, 75, 100].forEach((t) => {
        s += `<line x1="${sx(t)}" x2="${sx(t)}" y1="${top - 4}" y2="${H - 26}" stroke="${t === 0 ? COL.axis : COL.grid}"/>`;
        s += `<text x="${sx(t)}" y="${H - 8}" font-size="12" fill="${COL.axis}" text-anchor="middle">${t}%</text>`;
      });
      const cnt = [[Ch.counts.tc_moa, Ch.counts.chembl_moa], [Ch.counts.tc_genes, Ch.counts.chembl_genes]];
      Ch.rows.forEach((r, i) => {
        const y = top + grp * i + 10;
        s += `<text x="${left - 12}" y="${y + barh + 4}" font-size="${W < 440 ? 12 : 13}" fill="${COL.text}" text-anchor="end">${esc(W < 440 && r.field === "Mechanism of action" ? "MOA" : r.field)}</text>`;
        [[r.tc, TC, "TrialCurator", cnt[i][0]], [r.chembl, GREY, "ChEMBL", cnt[i][1]]].forEach(([v, c, who, n], j) => {
          const yy = y + j * (barh + 2);
          s += `<g data-tip="${esc(`<b>${who}</b> · ${r.field}<br>${n} of ${Ch.records} records (${v}%)`)}">`;
          s += `<path d="${hbarPath(sx(0), sx(v), yy, barh)}" fill="${c}"/>`;
          s += `<text x="${sx(v) + 7}" y="${yy + barh / 2 + 4.5}" font-size="12" fill="${COL.text}">${v.toFixed(1)}</text></g>`;
        });
      });
      el.innerHTML = s + "</svg>";
      bindTips(el);
    })();
    document.getElementById("ch-note").textContent =
      `Among ${Ch.h2h.pairs} trial and drug pairs (${Ch.h2h.drugs} drugs) with informative target annotations in both sources, ` +
      `target genes agreed directly in ${Ch.h2h.agree} (${pct1(Ch.h2h.agree, Ch.h2h.pairs)}). The differences concerned ` +
      `nomenclature, annotation conventions and the scope of the target sets; no contradictory mechanisms were found.`;

    document.getElementById("dg-table").innerHTML =
      `<thead><tr><th>Drug</th><th>ChEMBL</th><th>TrialCurator</th></tr></thead><tbody>` +
      E.diff_genes.map((d) => {
        const only = new Set(String(d.only_tc).split(/,\s*/));
        const tc = String(d.tc).split(/,\s*/).map((g) => (only.has(g) ? `<b class="hl">${g}</b>` : g)).join(", ");
        return `<tr><td><i>${d.drug}</i></td><td>${d.chembl}</td><td>${tc}</td></tr>`;
      }).join("") + `</tbody>`;
    document.getElementById("dg-table").insertAdjacentHTML("afterend",
      `<p class="note">Highlighted: genes recorded by TrialCurator and absent from ChEMBL.</p>`);

    const Me = E.mesh;
    document.getElementById("mesh-sub").textContent =
      `MeSH identifiers were identical in ${Me.identical} of ${Me.n} trials (${pct1(Me.identical, Me.n)}) whose registry record ` +
      `has a single MeSH term. Review of the ${Me.discordant} discordant pairs:`;
    stackBar(document.getElementById("mesh-chart"), [
      { label: "TrialCurator preferred", n: Me.tc_pref, color: TC, ink: "#FAF9F5" },
      { label: "ClinicalTrials.gov preferred", n: Me.ctgov_pref, color: GREY },
      { label: "Both acceptable", n: Me.both, color: "#DDD9CD" },
    ], { aria: "Review of discordant MeSH pairs" });

    const F = E.framing, nF = F.parts.reduce((a, d) => a + d.n, 0);
    document.getElementById("fr-sub").textContent =
      `${nF} unsuccessful trials with readouts between ${F.window}, by framing of the sponsor disclosure (left), and the ` +
      `dominant pattern among the positively framed disclosures (right)`;
    const FC = { Negative: ["#EBC3B4", COL.text], Neutral: ["#DDD9CD", COL.text], Positive: ["#9A3F22", "#FAF9F5"] };
    stackBar(document.getElementById("fr-stack"),
      F.parts.map((p) => ({ label: p.label === "Neutral" ? "Neutral or unclear" : p.label, n: p.n, color: FC[p.label][0], ink: FC[p.label][1] })),
      { aria: "Framing of unsuccessful trials" });
    hbars(document.getElementById("fr-patterns"),
      F.patterns.map((p) => ({ label: p.label, v: p.n, color: "#9A3F22", text: String(p.n) })),
      { max: 4, ticks: [0, 1, 2, 3, 4], left: 250, right: 30, rowh: 32, aria: "Patterns of positive framing" });
  })();

  // ===================================================== prospective evaluation
  const PM = Object.fromEntries(P.models.map((m) => [m.key, m]));
  (function () {
    document.getElementById("pro-h2").textContent = `${P.n} adjudicated readouts`;
    document.getElementById("pro-sub").textContent =
      `By 20 October 2026, ${P.read_out} of the ${P.cohort} trials had reported results or discontinuation. Comparisons ` +
      `include only outcomes first disclosed after 29 July 2026, when both comparator forecasts had been recorded: ` +
      `${P.after_cutoff} trials, of which ${P.nS} were adjudicated successes, ${P.nF} failures and ${P.unresolved} remained unresolved.`;
    const tlc = ["", "o", "c", ""];
    document.getElementById("timeline").innerHTML = P.timeline.map((e, i) =>
      `<div class="tl ${tlc[i]}"><div class="d">${esc(e.d.replace(/(\d)\s*to\s*/g, "$1 to "))}</div><div class="w">${esc(e.w)}</div></div>`).join("");

    const rowsOf = (key) => P.models.map((m) => ({ name: m.name, key: m.key, v: m[key][0], lo: m[key][1], hi: m[key][2] }));
    dotPlot(document.getElementById("pro-ap"), rowsOf("ap"), { min: 0.5, max: 1, ticks: [0.5, 0.75, 1], base: P.nS / P.n, metric: "AP", sep: [1, 2], left: 210 });
    dotPlot(document.getElementById("pro-roc"), rowsOf("roc"), { min: 0.5, max: 1, ticks: [0.5, 0.75, 1], base: 0.5, metric: "ROC AUC", sep: [1, 2], left: 210 });

    drawClassification(document.getElementById("cls-chart"), P);

    // all metrics (Extended Data Table 3)
    const groups = [["TrialAugur", "TrialAugur experts and rank ensemble"], ["Comparator", "LLM comparators (NCT ID, web search and tools)"]];
    const frc = (a) => `${a[0]}/${a[1]}<span class="ci">${pct1(a[0], a[1])}</span>`;
    let h = `<thead><tr><th>Method</th><th class="num">ROC AUC</th><th class="num">AP</th><th class="num">Balanced<br>accuracy</th>
      <th class="num">Accuracy</th><th class="num">Sensitivity</th><th class="num">Specificity</th><th class="num">PPV</th>
      <th class="num">NPV</th><th class="num">Brier</th><th class="num">ECE</th></tr></thead><tbody>`;
    for (const [k, label] of groups) {
      h += `<tr class="group"><td colspan="11">${label}</td></tr>`;
      for (const m of P.models.filter((x) => x.kind === k)) {
        h += `<tr><td class="name">${dotName(m.key)}</td><td class="num">${f3(m.roc[0])}${ci3(m.roc)}</td>
          <td class="num">${f3(m.ap[0])}${ci3(m.ap)}</td><td class="num">${f3(m.bacc[0])}${ci3(m.bacc)}</td>
          <td class="num">${frc(m.acc)}</td><td class="num">${frc(m.sens)}</td><td class="num">${frc(m.spec)}</td>
          <td class="num">${frc(m.ppv)}</td><td class="num">${frc(m.npv)}</td>
          <td class="num">${f3(m.brier[0])}${ci3(m.brier)}</td><td class="num">${f3(m.ece[0])}${ci3(m.ece)}</td></tr>`;
      }
    }
    document.getElementById("metrics").innerHTML = h + `</tbody>`;

    // by phase
    P.phase.forEach((g, i) => {
      document.getElementById(`ph-h${i}`).textContent = `${g.label} (n = ${g.n}, ${g.nS} successes)`;
      dotPlot(document.getElementById(`ph-${i}`), MODELS.map((m) => ({ name: m.name, key: m.key, v: g.models[m.key][0], lo: g.models[m.key][1], hi: g.models[m.key][2] })),
        { min: 0.4, max: 1, ticks: [0.4, 0.7, 1], base: 0.5, metric: `ROC AUC, ${g.label.toLowerCase()}`, sep: [1, 2], left: 210 });
    });
  })();

  // ===================================================== scores and CAR by trial
  (function () {
    const el = document.getElementById("heat");
    const fails = rows.filter((r) => r.outcome === "failure"), succ = rows.filter((r) => r.outcome === "success");
    const order = [...fails, ...succ];
    const W = 1180, left = 200, right = 60, gap = 12, top = 34, rowh = 28;
    const cw = (W - left - right - gap) / order.length;
    const xOf = (i) => left + i * cw + (i >= fails.length ? gap : 0);
    const BINS = [[0.3, "#8E3219", "0 to 0.3"], [0.4, "#C85B3C", "0.3 to 0.4"], [0.5, "#ECB8A5", "0.4 to 0.5"],
                  [0.6, "#C3D8E8", "0.5 to 0.6"], [0.7, "#6FA3CF", "0.6 to 0.7"], [1.01, "#2F6799", "0.7 to 1"]];
    const colOf = (v) => BINS.find((b) => v < b[0])[1];
    const carTop = top + rowh * MODELS.length + 26, carH = 132, carMid = carTop + carH / 2, k = (carH / 2) / 100;
    const H = carTop + carH + 10;
    let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Forecast scores and abnormal returns by trial">`;
    const xF = left + (fails.length * cw) / 2, xS = left + gap + fails.length * cw + (succ.length * cw) / 2;
    s += `<text x="${xF}" y="${top - 12}" font-size="13" fill="${COL.text}" text-anchor="middle">Failure (n = ${fails.length})</text>`;
    s += `<text x="${xS}" y="${top - 12}" font-size="13" fill="${COL.text}" text-anchor="middle">Success (n = ${succ.length})</text>`;
    s += `<text x="${W - right + 30}" y="${top - 12}" font-size="12" fill="${COL.axis}" text-anchor="middle">Errors</text>`;
    let outl = "";
    MODELS.forEach((m, j) => {
      const y = top + j * rowh;
      s += `<text x="${left - 12}" y="${y + rowh / 2 + 4.5}" font-size="13" fill="${COL.text}" text-anchor="end">${esc(m.name)}</text>`;
      let err = 0;
      order.forEach((r, i) => {
        const v = r.scores[m.key], ok = (v >= 0.5) === (r.outcome === "success");
        if (!ok) err++;
        const tip = `<b>${r.nct}</b> · ${r.outcome}<br>${esc(r.evidence)}<br>${m.name}: ${f3(v)}, predicted ${v >= 0.5 ? "success" : "failure"} ${ok ? "✓" : "✗"}`;
        s += `<rect x="${(xOf(i) + 0.6).toFixed(2)}" y="${y + 1}" width="${(cw - 1.2).toFixed(2)}" height="${rowh - 2}" fill="${colOf(v)}" data-tip="${esc(tip)}"/>`;
        if (!ok) outl += `<rect x="${(xOf(i) + 1.4).toFixed(2)}" y="${y + 1.8}" width="${(cw - 2.8).toFixed(2)}" height="${rowh - 3.6}" fill="none" stroke="#141413" stroke-width="1.6" pointer-events="none"/>`;
      });
      s += `<text x="${W - right + 30}" y="${y + rowh / 2 + 4.5}" font-size="13" fill="${COL.text}" text-anchor="middle">${err}</text>`;
    });
    s += outl;
    // CAR bars
    s += `<text x="${left - 12}" y="${carMid + 4.5}" font-size="13" fill="${COL.text}" text-anchor="end">CAR, sessions 0 to 2</text>`;
    [-80, -40, 0, 40, 80].forEach((t) => {
      const y = carMid - t * k;
      s += `<line x1="${left}" x2="${W - right}" y1="${y}" y2="${y}" stroke="${t === 0 ? COL.axis : COL.grid}"/>`;
      s += `<text x="${W - right + 8}" y="${y + 4}" font-size="11.5" fill="${COL.axis}">${t > 0 ? "+" : ""}${minus(t)}%</text>`;
    });
    const xsep = left + fails.length * cw + gap / 2;
    s += `<line x1="${xsep}" x2="${xsep}" y1="${carTop}" y2="${carTop + carH}" stroke="${COL.text}" stroke-width="1.2"/>`;
    order.forEach((r, i) => {
      if (r.car == null) return;
      const v = Math.max(-100, Math.min(100, r.car));
      const tip = `<b>${r.nct}</b> · ${r.outcome}<br>${esc(r.company || "")} (${esc(r.ticker || "")})<br>CAR ${pctv(r.car)}${Math.abs(r.car) > 100 ? ", drawn at 100%" : ""}`;
      s += `<g data-tip="${esc(tip)}"><rect x="${xOf(i)}" y="${carTop}" width="${cw}" height="${carH}" fill="transparent"/>`;
      s += `<path d="${vbarPath(xOf(i) + 1.5, carMid, carMid - v * k, cw - 3, 2)}" fill="#3D3D3A"/></g>`;
    });
    el.innerHTML = s + "</svg>";
    bindTips(el);
    document.getElementById("heat-legend").innerHTML = `<span>Score</span>` +
      BINS.map((b) => `<span><i class="sq" style="background:${b[1]}"></i>${b[2]}</span>`).join("") +
      `<span><i class="sq outline"></i>incorrect prediction</span>`;
  })();

  // ===================================================== share price responses
  (function () {
    const C = P.car;
    document.getElementById("mkt-sub").textContent =
      `Cumulative abnormal returns from an XBI adjusted single factor model over the first three trading sessions able to ` +
      `reflect the disclosure; event dates are the first disclosure supporting the adjudicated outcome. ${C.n} of the ${P.n} ` +
      `trials contributed eligible announcements (${C.nF} unsuccessful, ${C.nS} successful). Exploratory.`;
    const G = C.groups;
    drawCarGroups(document.getElementById("car-chart"), G);

    let h = `<thead><tr><th>Failure group</th><th class="num">n</th><th class="num">Sessions<br>0 to 2</th><th class="num">Sessions<br>0 to 1</th>
      <th class="num">Sessions<br>0 to 5</th><th class="num">0 to 2, no<br>concurrent news</th></tr></thead><tbody>`;
    for (const g of G) {
      h += `<tr><td><b>${g.g}</b> · ${g.label.toLowerCase()}</td>
        <td class="num">${g.n}</td><td class="num">${pctv(g.median)}</td><td class="num">${pctv(g.median_01)}</td>
        <td class="num">${pctv(g.median_05)}</td><td class="num">${pctv(g.median_nonews)}<span class="ci">n = ${g.n_nonews}</span></td></tr>`;
    }
    document.getElementById("car-table").innerHTML = h + `</tbody>`;
    document.getElementById("car-note").textContent =
      `Groups of the ${C.nF} unsuccessful trials: A, identified by the ensemble and missed by both LLM comparators; B, ` +
      `identified by the ensemble and one comparator; C, identified by all three methods; D, missed by the ensemble. ` +
      `In group D all three methods predicted success for ZEUS and SION-719, whereas both comparators predicted failure ` +
      `for SERENA-4. Among successful trials, those the ensemble classified as failures had a median CAR of ` +
      `${pctv(C.succ_ens_wrong_median)}, against ${pctv(C.succ_ens_right_median)} for those it classified as successes; ` +
      `${C.succ_negative} of the ${C.nS} successful trial announcements were followed by negative abnormal returns.`;
  })();

  // ===================================================== public negative signals
  (function () {
    const S = P.signals, CN = { ens: "Rank ensemble", opus5: "Claude Opus 5", gpt56: "GPT-5.6-Sol" };
    document.getElementById("sig-sub").textContent =
      `For all ${S.n} failures, Claude Opus 5.5 searched for public reports published before ${fmtDate(S.before)}; ` +
      `reviewers masked to model outputs and outcomes coded signals about primary endpoint attainment and the development ` +
      `milestone. Direct signals concern the trial or the same drug (sponsor action, regulatory feedback, earlier failures ` +
      `of the same drug, explicit negative analyst forecasts); indirect signals concern other drugs with the same ` +
      `mechanism or other programmes of the sponsor.`;
    drawSignals(document.getElementById("sig-chart"), S, CN);
    document.getElementById("sig-tab-sub").textContent =
      `Groups as in the share price analysis, here over all ${S.n} failures. A, identified by the ensemble only; B, by ` +
      `the ensemble and one comparator; C, by all three methods; D, missed by the ensemble.`;
    document.getElementById("sig-table").innerHTML =
      `<thead><tr><th>Group</th><th class="num">Failures</th><th class="num">Direct</th><th class="num">Borderline<br>direct</th>
        <th class="num">Indirect</th><th class="num">None<br>verified</th></tr></thead><tbody>` +
      S.by_group.map((g) => `<tr><td><b>${g.g}</b></td><td class="num">${g.n}</td><td class="num">${g.direct}</td>
        <td class="num">${g.borderline}</td><td class="num">${g.indirect}</td><td class="num">${g.none}</td></tr>`).join("") + `</tbody>`;
    const c = S.cites;
    document.getElementById("sig-cite").textContent =
      `The recorded rationales cited the corresponding signal in ${c.reasoning[0]} of ${c.reasoning[1]} correct failure ` +
      `forecasts of the reasoning expert, ${c.opus5[0]} of ${c.opus5[1]} of Claude Opus 5 and ${c.gpt56[0]} of ` +
      `${c.gpt56[1]} of GPT-5.6-Sol. The borderline direct signal (a sponsor action for one trial) is counted as not direct.`;
  })();

  // ===================================================== portfolio
  (function () {
    const F = P.portfolio, PMf = F.models;
    document.getElementById("pf-sub").textContent =
      `Equal capital positions in all ${F.companies} tradable companies with qualifying trials pending at the common entry ` +
      `time, including companies whose trials had no adjudicated outcome by the end of follow up. Each company was scored ` +
      `by the mean of its eligible trial forecasts and held long when its score was at least 0.5 and short otherwise, from ` +
      `the ${fmtDate(F.start)} close to the ${fmtDate(F.end)} close.`;
    document.getElementById("pf-bars-sub").textContent =
      `After costs of ${F.costs}; long and short positions at right; dotted line: XBI`;
    hbars(document.getElementById("pf-bars"), MODELS.map((m) => ({
      label: m.name, v: PMf[m.key].net, color: MCOL[m.key], text: pctv(PMf[m.key].net), key: m.key,
      tip: `<b>${m.name}</b><br>Net return ${pctv(PMf[m.key].net)}<br>${PMf[m.key].long} long, ${PMf[m.key].short} short`,
    })), { min: -10, max: 10, ticks: [-10, -5, 0, 5, 10], left: 200, right: 76, base: F.xbi, baseLabel: "XBI",
      extra: (r) => `${PMf[r.key].long} / ${PMf[r.key].short}`, aria: "Net portfolio returns" });

    const CN = { opus5: "Claude Opus 5", gpt56: "GPT-5.6-Sol" };
    const costs = [...new Set(F.paired.map((d) => d.cost))];
    const cellP = (vs, c) => { const d = F.paired.find((x) => x.vs === vs && x.cost === c);
      return `<td class="num">${num1(d.d)}<span class="ci">${num1(d.lo)} to ${num1(d.hi)}</span></td>`; };
    document.getElementById("pf-paired").innerHTML =
      `<thead><tr><th>Cost assumption</th><th class="num">Minus<br>${CN.opus5}</th><th class="num">Minus<br>${CN.gpt56}</th></tr></thead><tbody>` +
      costs.map((c) => `<tr><td>${c}</td>${cellP("opus5", c)}${cellP("gpt56", c)}</tr>`).join("") + `</tbody>`;

    document.getElementById("pf-curve-h").textContent =
      `Cumulative net returns, ${fmtDate(F.start).replace(/ \d{4}$/, "")} to ${fmtDate(F.end)}`;
    const series = MODELS.map((m) => ({ key: m.key, name: m.name, v: F.curves[m.key] }))
      .concat([{ key: "xbi", name: "XBI", v: F.curves.xbi }]);
    const shown = new Set(series.map((s) => s.key));
    const el = document.getElementById("pf-chart"), n = F.dates.length;
    function draw() {
      const W = 1000, H = 380, l = 50, r = 190, t = 14, b = 34;
      const vis = series.filter((s) => shown.has(s.key));
      const all = vis.flatMap((s) => s.v);
      const lo = Math.min(-5, ...all), hi = Math.max(5, ...all);
      const sx = (i) => l + (i / (n - 1)) * (W - l - r), sy = (v) => t + (1 - (v - lo) / (hi - lo)) * (H - t - b);
      let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Cumulative net portfolio returns">`;
      for (let g = Math.ceil(lo / 5) * 5; g <= hi + 1e-9; g += 5) {
        s += `<line x1="${l}" x2="${W - r}" y1="${sy(g)}" y2="${sy(g)}" stroke="${g === 0 ? COL.axis : COL.grid}"/>`;
        s += `<text x="${l - 8}" y="${sy(g) + 4}" font-size="12" fill="${COL.axis}" text-anchor="end">${g === 0 ? "0%" : pctv(g, 0)}</text>`;
      }
      F.dates.forEach((d, i) => {
        if (i > 0 && F.dates[i - 1].slice(5, 7) !== d.slice(5, 7)) {
          s += `<line x1="${sx(i)}" x2="${sx(i)}" y1="${H - b}" y2="${H - b + 5}" stroke="${COL.axis}"/>`;
          s += `<text x="${sx(i)}" y="${H - 10}" font-size="12" fill="${COL.axis}" text-anchor="middle">${MON[Number(d.slice(5, 7)) - 1]}</text>`;
        }
      });
      const ends = [];
      for (const se of vis) {
        const d = se.v.map((v, i) => `${i ? "L" : "M"}${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join("");
        s += `<path d="${d}" fill="none" stroke="${MCOL[se.key]}" stroke-width="${se.key === "ens" ? 2.6 : 2}"
          ${se.key === "xbi" ? `stroke-dasharray="2 4"` : ""} stroke-linejoin="round" stroke-linecap="round"/>`;
        ends.push({ y: sy(se.v[n - 1]), se });
      }
      ends.sort((a, b) => a.y - b.y);
      for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 15) ends[i].y = ends[i - 1].y + 15;
      for (const e of ends) {
        const nm = e.se.key === "xbi" ? "XBI" : (MODELS.find((m) => m.key === e.se.key) || {}).short;
        s += `<text x="${W - r + 8}" y="${e.y + 4}" font-size="12" fill="${COL.text}"><tspan font-weight="600">${pctv(e.se.v[n - 1])}</tspan> ${esc(nm)}</text>`;
      }
      s += `<rect x="${l}" y="${t}" width="${W - l - r}" height="${H - t - b}" fill="transparent" id="pf-hit"/>`;
      s += `<line id="pf-cross" x1="0" x2="0" y1="${t}" y2="${H - b}" stroke="${COL.axis}" stroke-dasharray="2 3" visibility="hidden"/>`;
      el.innerHTML = s + "</svg>";
      const svg = el.querySelector("svg"), hit = el.querySelector("#pf-hit"), cross = el.querySelector("#pf-cross");
      hit.addEventListener("mousemove", (e) => {
        const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
        const x = pt.matrixTransform(svg.getScreenCTM().inverse()).x;
        const i = Math.max(0, Math.min(n - 1, Math.round(((x - l) / (W - l - r)) * (n - 1))));
        cross.setAttribute("x1", sx(i)); cross.setAttribute("x2", sx(i)); cross.setAttribute("visibility", "visible");
        TIP.show(`<b>${fmtDate(F.dates[i])}</b><br>` + vis.map((se) => `${se.name}: ${pctv(se.v[i])}`).join("<br>"), e);
      });
      hit.addEventListener("mouseleave", () => { cross.setAttribute("visibility", "hidden"); TIP.hide(); });
    }
    document.getElementById("pf-legend").innerHTML = series.map((se) =>
      `<label><input type="checkbox" data-k="${se.key}" checked><i style="background:${MCOL[se.key]}"></i>${se.name}</label>`).join("");
    document.querySelectorAll("#pf-legend input").forEach((cb) => cb.addEventListener("change", () => {
      cb.checked ? shown.add(cb.dataset.k) : shown.delete(cb.dataset.k); draw();
    }));
    draw();

    let h = `<thead><tr><th>Method</th><th class="num">Long /<br>short</th><th class="num">Net return,<br>base costs</th>
      <th class="num">No costs</th><th class="num">Higher<br>costs</th><th class="num">Long<br>contribution</th>
      <th class="num">Short<br>contribution</th><th class="num">Companies with<br>a disclosure</th>
      <th class="num">Companies without<br>a disclosure</th><th class="num">Excluding<br>MRNA</th></tr></thead><tbody>`;
    for (const m of MODELS) {
      const q = PMf[m.key];
      h += `<tr><td class="name">${dotName(m.key)}</td><td class="num">${q.long} / ${q.short}</td>
        ${[q.net, q.none, q.high, q.long_c, q.short_c, q.disc, q.nodisc, q.excl].map((v) => `<td class="num">${num1(v)}</td>`).join("")}</tr>`;
    }
    h += `<tr><td class="name"><span class="dot x"></span>XBI, price return</td><td></td><td class="num">${num1(F.xbi)}</td><td colspan="7"></td></tr>`;
    document.getElementById("pf-table").innerHTML = h + `</tbody>`;
  })();

  // ===================================================== readout ledger
  (function () {
    const data = rows.map((r) => ({ ...r, ...Object.fromEntries(Object.entries(r.scores).map(([k, v]) => [`s_${k}`, v])) }));
    function scoreFmt(c) {
      const v = c.getValue(); if (v == null) return "";
      const ok = (v >= 0.5) === (c.getRow().getData().outcome === "success");
      return `<span class="sc ${ok ? "right" : "wrong"}">${f3(v)}</span>`;
    }
    const scoreCol = (k, w = 96) => ({ title: NAME[k], field: `s_${k}`, width: w, hozAlign: "right", formatter: scoreFmt, sorter: "number" });
    const table = new Tabulator("#grid", {
      data, layout: "fitDataStretch", columnDefaults: { headerWordWrap: true }, height: "640px",
      initialSort: [{ column: "date", dir: "desc" }],
      columns: [
        { title: "NCT ID", field: "nct", width: 128, frozen: true, formatter: (c) => nctLink(c.getValue()) },
        { title: "Readout", field: "date", width: 116, formatter: (c) => `<span class="mono">${fmtDate(c.getValue())}</span>` },
        { title: "Outcome", field: "outcome", width: 112, hozAlign: "center",
          formatter: (c) => (c.getValue() === "failure" ? pill("Failure", "fail") : pill("Success", "success")) },
        { title: "Phase", field: "phase", width: 76 },
        { title: "Adjudication evidence", field: "evidence", width: 340, cssClass: "wrap", headerSort: false },
        scoreCol("ens"), scoreCol("reasoning"), scoreCol("embedding"), scoreCol("opus5", 90), scoreCol("gpt56", 90),
        { title: "CAR, sessions 0 to 2", field: "car", width: 104, hozAlign: "right", sorter: "number",
          formatter: (c) => { const v = c.getValue(), r = c.getRow().getData();
            return v == null ? `<span class="muted">${r.ticker ? "not analysed" : "no listed exposure"}</span>`
              : `<span class="mono mv ${v >= 0 ? "pos" : "neg"}" title="${esc(r.company)} (${esc(r.ticker)})">${pctv(v)}</span>`; } },
        { title: "Source", field: "url", width: 150, headerSort: false,
          formatter: (c) => (c.getValue() ? `<a href="${esc(c.getValue())}" target="_blank" rel="noopener">${hostOf(c.getValue())} ↗</a>` : "") },
        { title: "Intervention (registry)", field: "intervention", width: 220, cssClass: "wrap" },
        { title: "Sponsor", field: "sponsor", width: 180, cssClass: "wrap" },
      ],
    });
    table.on("tableBuilt", () => {
      const ph = document.getElementById("f-phase");
      [...new Set(rows.map((r) => r.phase))].sort().forEach((v) => ph.insertAdjacentHTML("beforeend", `<option value="${v}">Phase ${v}</option>`));
      const q = document.getElementById("q"), out = document.getElementById("f-outcome"), cnt = document.getElementById("count");
      const apply = () => {
        const s = q.value.trim().toLowerCase();
        table.setFilter((r) => (!ph.value || r.phase === ph.value) && (!out.value || r.outcome === out.value) &&
          (!s || [r.nct, r.intervention, r.sponsor, r.evidence, r.company, r.ticker].join(" ").toLowerCase().includes(s)));
      };
      [q, ph, out].forEach((e) => e.addEventListener(e === q ? "input" : "change", apply));
      table.on("dataFiltered", (f, rs) => { cnt.textContent = `${rs.length} readouts`; });
      cnt.textContent = `${rows.length} readouts`;
    });
  })();
})();
