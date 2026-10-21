// TrialAugur results: metrics, error profile, phase table, readout ledger, market reaction, portfolio.

(async function () {
  renderNotarization("notarization");
  const [ev, rows, pf] = await Promise.all([
    loadJSON("data/evaluation.json"), loadJSON("data/results.json"), loadJSON("data/portfolio.json"),
  ]);
  const W = ev.window;
  const kindDot = (k) => `<span class="dot ${k === "TrialAugur" ? "o" : "c"}"></span>`;
  const cell = (v, c) => `<td class="num">${f3(v)}${c ? `<span class="ci">${ciText(c)}</span>` : ""}</td>`;

  document.getElementById("lede").innerHTML =
    `By ${fmtDate(W.end)}, ${W.n} trials had read out after 29 July 2026 and been adjudicated: ` +
    `${W.success} successes and ${W.fail} failures. Comparisons are restricted to this window, the later of the two ` +
    `comparator commitments, so every evaluated forecast preceded its readout.`;

  // ---------------- metrics table ----------------
  const groups = [["TrialAugur", "TrialAugur"], ["Comparator", "Zero shot comparators (NCT ID and web search only)"]];
  let h = `<thead><tr><th>System</th><th class="num">PR AUC</th><th class="num">ROC AUC</th>
    <th class="num">Specificity<br>(failures caught)</th><th class="num">NPV</th><th class="num">Balanced<br>accuracy</th>
    <th class="num">Brier</th></tr></thead><tbody>`;
  for (const [k, label] of groups) {
    h += `<tr class="group"><td colspan="7">${label}</td></tr>`;
    for (const m of ev.models.filter((x) => x.kind === k)) {
      h += `<tr><td class="name">${kindDot(m.kind)}${m.name}</td>${cell(m.prauc, m.prauc_ci)}${cell(m.rocauc, m.rocauc_ci)}
        <td class="num">${f3(m.spec)} · ${m.fail_caught}/${m.nF}<span class="ci">${ciText(m.spec_ci)}</span></td>
        ${cell(m.npv, m.npv_ci)}${cell(m.bacc, m.bacc_ci)}${cell(m.brier, m.brier_ci)}</tr>`;
    }
  }
  document.getElementById("metrics").innerHTML = h + "</tbody>";

  // ---------------- error profile chart ----------------
  (function () {
    const el = document.getElementById("err-chart");
    const Wd = 1100, rowh = 44, left = 230, top = 8, gap = 48;
    const half = (Wd - left - gap) / 2, H = top + rowh * ev.models.length + 30;
    const xa = (n, of) => left + (n / of) * half, xb = (n, of) => left + half + gap + (n / of) * half;
    let s = `<svg viewBox="0 0 ${Wd} ${H}" width="100%" role="img" aria-label="Failure calls by system">`;
    s += `<text x="${left}" y="${H - 6}" font-size="11.5" fill="${COL.axis}">failures caught</text>`;
    s += `<text x="${left + half + gap}" y="${H - 6}" font-size="11.5" fill="${COL.axis}">false failure calls</text>`;
    ev.models.forEach((m, i) => {
      const y = top + rowh * i + 10;
      s += `<text x="${left - 12}" y="${y + 15}" font-size="13" fill="${COL.text}" text-anchor="end">${esc(m.name)}</text>`;
      s += `<rect x="${left}" y="${y}" width="${half}" height="22" rx="4" fill="#EFECE3"/>`;
      s += `<rect x="${left}" y="${y}" width="${xa(m.fail_caught, m.nF) - left}" height="22" rx="4" fill="#141413"
        data-tip="${esc(`<b>${m.name}</b><br>${m.fail_caught} of ${m.nF} failures called failure`)}"/>`;
      s += `<text x="${left + 8}" y="${y + 15}" font-size="12" fill="#FAF9F5">${m.fail_caught}/${m.nF}</text>`;
      const x0 = left + half + gap;
      s += `<rect x="${x0}" y="${y}" width="${half}" height="22" rx="4" fill="#EFECE3"/>`;
      s += `<rect x="${x0}" y="${y}" width="${Math.max(2, xb(m.false_fail, m.nS) - x0)}" height="22" rx="4" fill="#A8432A"
        data-tip="${esc(`<b>${m.name}</b><br>${m.false_fail} of ${m.nS} successes called failure`)}"/>`;
      const lx = xb(m.false_fail, m.nS) + 8;
      s += `<text x="${m.false_fail / m.nS > 0.3 ? x0 + 8 : lx}" y="${y + 15}" font-size="12"
        fill="${m.false_fail / m.nS > 0.3 ? "#FAF9F5" : COL.text}">${m.false_fail}/${m.nS}</text>`;
    });
    el.innerHTML = s + "</svg>";
    bindTips(el);
  })();

  // ---------------- phase table ----------------
  (function () {
    const P = ev.phase, keys = ["early", "p3"];
    const hd = keys.map((k) => `${P[k].label}<br>n = ${P[k].n}`);
    let t = `<thead><tr><th>System</th><th class="num">PR AUC<br>${hd[0]}</th><th class="num">PR AUC<br>${hd[1]}</th>
      <th class="num">Balanced accuracy<br>${hd[0]}</th><th class="num">Balanced accuracy<br>${hd[1]}</th></tr></thead><tbody>`;
    ev.models.forEach((m, i) => {
      t += `<tr><td class="name">${kindDot(m.kind)}${m.name}</td>` +
        keys.map((k) => `<td class="num">${f3(P[k].models[i].prauc)}</td>`).join("") +
        keys.map((k) => `<td class="num">${f3(P[k].models[i].bacc)}</td>`).join("") + `</tr>`;
    });
    document.getElementById("phase").innerHTML = t + "</tbody>";
  })();

  // ---------------- readout ledger ----------------
  const isFail = (o) => o === "fail";
  function scoreFmt(cellObj) {
    const v = cellObj.getValue(); if (v == null) return "";
    const r = cellObj.getRow().getData();
    const ok = (v >= 0.5) === (r.outcome === "success");
    return `<span class="sc ${ok ? "right" : "wrong"}">${f3(v)}</span>`;
  }
  const scoreCol = (title, field, tip) => ({ title, field, width: 104, hozAlign: "right", formatter: scoreFmt, sorter: "number", headerTooltip: tip });
  const table = new Tabulator("#grid", {
    data: rows,
    layout: "fitDataStretch",
    columnDefaults: { headerWordWrap: true },
    height: "620px",
    initialSort: [{ column: "date", dir: "desc" }],
    columns: [
      { title: "NCT", field: "nct", width: 128, frozen: true, formatter: (c) => nctLink(c.getValue()) },
      { title: "Readout", field: "date", width: 116, formatter: (c) => `<span class="mono">${c.getValue()}</span>` },
      { title: "Outcome", field: "outcome", width: 120, hozAlign: "center",
        formatter: (c) => (isFail(c.getValue()) ? pill("Failure", "fail") : pill("Success", "success")) },
      { title: "Drug", field: "drug", width: 200, cssClass: "wrap" },
      scoreCol("Ensemble", "ens", "Simple rank ensemble (percentile rank within the 706 cohort)"),
      scoreCol("GPT-5 reasoning", "gpt5"),
      scoreCol("Embedding", "tabpfn", "Embedding expert (TabPFN-3)"),
      scoreCol("SFT", "sft", "SFT expert (Qwen3-235B)"),
      scoreCol("Opus 5 zero shot", "opus5"),
      scoreCol("GPT-5.6 zero shot", "gpt56"),
      { title: "Share move", field: "move", width: 112, hozAlign: "right", sorter: "number",
        headerTooltip: "29 July close to mean close of readout day and next two trading days",
        formatter: (c) => { const v = c.getValue(); const r = c.getRow().getData();
          return v == null ? `<span class="muted" title="${esc(r.company || "")}">not listed</span>`
            : `<span class="mono mv ${v >= 0 ? "pos" : "neg"}" title="${esc(r.company)} (${esc(r.ticker)})">${pct(v)}</span>`; } },
      { title: "Evidence", field: "url", width: 150, headerSort: false,
        formatter: (c) => (c.getValue() ? `<a href="${esc(c.getValue())}" target="_blank" rel="noopener">${hostOf(c.getValue())} ↗</a>` : "") },
      { title: "Adjudication note", field: "note", width: 360, cssClass: "wrap", headerSort: false,
        formatter: (c) => esc(c.getValue()) + (c.getRow().getData().strategic ? ` <span class="muted">(termination counted as failure)</span>` : "") },
      { title: "Sponsor", field: "sponsor", width: 180, cssClass: "wrap" },
      { title: "Phase", field: "phase", width: 96 },
      { title: "Condition", field: "cond", width: 200, cssClass: "wrap" },
    ],
  });
  table.on("tableBuilt", () => {
    const ph = document.getElementById("f-phase");
    [...new Set(rows.map((r) => r.phase))].sort().forEach((v) => ph.insertAdjacentHTML("beforeend", `<option>${v}</option>`));
    const q = document.getElementById("q"), out = document.getElementById("f-outcome"), cnt = document.getElementById("count");
    const apply = () => {
      const s = q.value.trim().toLowerCase();
      table.setFilter((r) => (!ph.value || r.phase === ph.value) && (!out.value || r.outcome === out.value) &&
        (!s || [r.nct, r.drug, r.sponsor, r.cond, r.note].join(" ").toLowerCase().includes(s)));
    };
    [q, ph, out].forEach((e) => e.addEventListener(e === q ? "input" : "change", apply));
    table.on("dataFiltered", (f, rs) => { cnt.textContent = `${rs.length} readouts`; });
    cnt.textContent = `${rows.length} readouts`;
  });

  // ---------------- market reaction ----------------
  (function () {
    const G = ev.market_groups;
    const k = (g, extra) => `<div class="card kpi"><div class="v">${pct(g.median_move)}</div>
      <div class="l">median move · ${g.label.toLowerCase()} (n = ${g.n}, ${g.n_listed} listed)</div><div class="s">${extra}</div></div>`;
    document.getElementById("kpis").innerHTML =
      k(G.A, `GPT-5 reasoning caught ${G.A.caught.gpt5} of ${G.A.n}; the rank ensemble caught ${G.A.caught.ens}.`) +
      k(G.C, `${G.C.n_up} of ${G.C.n_listed} listed companies rose after readout.`) +
      `<div class="card kpi"><div class="v">${ev.n_listed} of ${W.n}</div><div class="l">trials with a listed company exposed to the result</div>
        <div class="s">Private sponsors and one stock without a usable price series are excluded.</div></div>`;
    document.getElementById("mkt-sub").textContent =
      `${ev.n_listed} of ${W.n} trials had a listed company exposed to the result. Share price change from the 29 July close ` +
      `to the mean close on the readout day and the next two trading days. Exploratory.`;

    const el = document.getElementById("strip");
    const Wd = 900, left = 230, right = 30, rowh = 64, H = 2 * rowh + 40;
    const sx = (v) => left + ((Math.max(-1, Math.min(1, v)) + 1) / 2) * (Wd - left - right);
    const by = Object.fromEntries(rows.map((r) => [r.nct, r]));
    let s = `<svg viewBox="0 0 ${Wd} ${H}" width="100%" role="img" aria-label="Share price moves of failed trials">`;
    [-1, -0.5, 0, 0.5, 1].forEach((t) => {
      s += `<line x1="${sx(t)}" x2="${sx(t)}" y1="6" y2="${H - 30}" stroke="${t === 0 ? COL.axis : COL.grid}"/>`;
      s += `<text x="${sx(t)}" y="${H - 10}" font-size="12" fill="${COL.axis}" text-anchor="middle">${t === 0 ? "0%" : pct(t)}</text>`;
    });
    [["A", "Missed by at least one comparator", "#A8432A"], ["C", "Caught by both comparators", "#87867F"]].forEach(([g, lab, col], i) => {
      const y = 10 + rowh * i + rowh / 2;
      s += `<text x="${left - 16}" y="${y + 4}" font-size="13" fill="${COL.text}" text-anchor="end">${lab}</text>`;
      const pts = G[g].ncts.map((n) => by[n]).filter((r) => r && r.move != null).sort((a, b) => a.move - b.move);
      pts.forEach((r, j) => {
        const jit = ((j % 3) - 1) * 9;
        const tip = `<b>${r.nct}</b> · ${esc(r.company)} (${esc(r.ticker)})<br>${esc(r.note)}<br>Move ${pct(r.move)}`;
        s += `<circle cx="${sx(r.move)}" cy="${y + jit}" r="7" fill="${col}" fill-opacity=".85" stroke="#FAF9F5" data-tip="${esc(tip)}"/>`;
      });
      const md = G[g].median_move;
      s += `<line x1="${sx(md)}" x2="${sx(md)}" y1="${y - 22}" y2="${y + 22}" stroke="${COL.text}" stroke-width="2"/>`;
    });
    el.innerHTML = s + "</svg>";
    bindTips(el);
  })();

  // ---------------- portfolio ----------------
  (function () {
    const P = ev.portfolio;
    const ens = P.models.ens;
    document.getElementById("pf-sub").textContent =
      `${P.n} trials with a listed company; equal capital per trial from the 29 July close, long when a system called ` +
      `success and short when it called failure, to the ${fmtDate(P.end)} close. XBI shown for reference.`;
    const series = ev.models.map((m) => ({ key: m.key, name: m.name, kind: m.kind, v: pf.curves[m.key] }))
      .concat([{ key: "xbi", name: "XBI", kind: "xbi", v: pf.xbi }]);
    const color = { ens: "#C96442", gpt5: "#8A3B22", tabpfn: "#D9A38A", sft: "#B9B4A6", opus5: "#6A9BCC", gpt56: "#2F5F8F", xbi: "#141413" };
    const dash = { xbi: "4 4" };
    const shown = new Set(["ens", "gpt5", "opus5", "gpt56", "xbi"]);
    const el = document.getElementById("pf-chart");
    const n = pf.dates.length;
    function draw() {
      const Wd = 980, H = 360, l = 54, r = 120, t = 16, b = 34;
      const vis = series.filter((s) => shown.has(s.key));
      const all = vis.flatMap((s) => s.v);
      const lo = Math.min(-0.04, ...all), hi = Math.max(0.04, ...all);
      const sx = (i) => l + (i / (n - 1)) * (Wd - l - r), sy = (v) => t + (1 - (v - lo) / (hi - lo)) * (H - t - b);
      let s = `<svg viewBox="0 0 ${Wd} ${H}" width="100%" role="img" aria-label="Cumulative portfolio return">`;
      const step = 0.02; for (let g = Math.ceil(lo / step) * step; g <= hi + 1e-9; g += step) {
        s += `<line x1="${l}" x2="${Wd - r}" y1="${sy(g)}" y2="${sy(g)}" stroke="${Math.abs(g) < 1e-9 ? COL.axis : COL.grid}"/>`;
        s += `<text x="${l - 8}" y="${sy(g) + 4}" font-size="11.5" fill="${COL.axis}" text-anchor="end">${Math.abs(g) < 1e-9 ? "0%" : pct(g)}</text>`;
      }
      pf.dates.forEach((d, i) => {
        if (i > 4 && pf.dates[i - 1].slice(5, 7) !== d.slice(5, 7) || i === 0) {
          s += `<text x="${sx(i)}" y="${H - 10}" font-size="11.5" fill="${COL.axis}" text-anchor="middle">${fmtDate(d).replace(/ \d{4}$/, "")}</text>`;
        }
      });
      const ends = [];
      for (const se of vis) {
        const p = se.v.map((v, i) => `${i ? "L" : "M"}${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join("");
        s += `<path d="${p}" fill="none" stroke="${color[se.key]}" stroke-width="${se.key === "ens" ? 2.6 : 1.6}"
          ${dash[se.key] ? `stroke-dasharray="${dash[se.key]}"` : ""} stroke-linejoin="round"/>`;
        ends.push({ y: sy(se.v[n - 1]), se });
      }
      ends.sort((a, b) => a.y - b.y);
      for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 14) ends[i].y = ends[i - 1].y + 14;
      for (const e of ends) {
        s += `<text x="${Wd - r + 8}" y="${e.y + 4}" font-size="12" fill="${color[e.se.key]}">${pct(e.se.v[n - 1], 1)} ${e.se.key === "xbi" ? "XBI" : ""}</text>`;
      }
      s += `<rect x="${l}" y="${t}" width="${Wd - l - r}" height="${H - t - b}" fill="transparent" id="pf-hit"/>`;
      s += `<line id="pf-cross" x1="0" x2="0" y1="${t}" y2="${H - b}" stroke="${COL.axis}" stroke-dasharray="2 3" visibility="hidden"/>`;
      el.innerHTML = s + "</svg>";
      const svg = el.querySelector("svg"), hit = el.querySelector("#pf-hit"), cross = el.querySelector("#pf-cross");
      hit.addEventListener("mousemove", (e) => {
        const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
        const x = pt.matrixTransform(svg.getScreenCTM().inverse()).x;
        const i = Math.max(0, Math.min(n - 1, Math.round(((x - l) / (Wd - l - r)) * (n - 1))));
        cross.setAttribute("x1", sx(i)); cross.setAttribute("x2", sx(i)); cross.setAttribute("visibility", "visible");
        TIP.show(`<b>${fmtDate(pf.dates[i])}</b><br>` + vis.map((se) => `${se.name}: ${pct(se.v[i], 1)}`).join("<br>"), e);
      });
      hit.addEventListener("mouseleave", () => { cross.setAttribute("visibility", "hidden"); TIP.hide(); });
    }
    document.getElementById("pf-legend").innerHTML = series.map((se) =>
      `<label><input type="checkbox" data-k="${se.key}" ${shown.has(se.key) ? "checked" : ""}><i style="background:${color[se.key]}"></i>${se.name}</label>`).join("");
    document.querySelectorAll("#pf-legend input").forEach((cb) => cb.addEventListener("change", () => {
      cb.checked ? shown.add(cb.dataset.k) : shown.delete(cb.dataset.k); draw();
    }));
    draw();

    let t = `<thead><tr><th>System</th><th class="num">Long / short</th><th class="num">Return</th><th class="num">Jensen's alpha</th>
      <th class="num">Beta</th><th class="num">Newey West P</th></tr></thead><tbody>`;
    for (const m of ev.models) {
      const p = P.models[m.key];
      t += `<tr><td>${kindDot(m.kind)}${m.name}</td><td class="num">${p.n_long} / ${p.n_short}</td><td class="num">${pct(p.ret, 1)}</td>
        <td class="num">${pct(p.alpha, 1)}</td><td class="num">${p.beta.toFixed(2)}</td><td class="num">${p.p_nw.toFixed(2)}</td></tr>`;
    }
    t += `<tr><td><span class="dot x"></span>XBI</td><td class="num"></td><td class="num">${pct(P.xbi, 1)}</td><td></td><td></td><td></td></tr>`;
    document.getElementById("pf-table").innerHTML = t + "</tbody>";
  })();
})();
