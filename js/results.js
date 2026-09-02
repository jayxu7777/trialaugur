// TrialAugur — adjudicated readouts + model evaluation (paper prospective section).

(async function () {
  const rows = await loadJSON("data/results.json");

  // On-chain proof block (shared renderer in common.js)
  renderNotarization("notarization");

  // ---------------- model evaluation module ----------------
  try {
    const ev = await loadJSON("data/evaluation.json");
    const block = document.getElementById("eval-block");
    block.hidden = false;

    function metricsTable(title, sub, rows4) {
      const tr = rows4
        .map(
          (r) =>
            `<tr><td>${r[0]}</td><td class="mono">${r[2]}</td>` +
            `<td class="mono">${r[3]}</td><td class="mono">${r[4]}</td><td class="mono">${r[5]}</td></tr>`
        )
        .join("");
      return (
        `<h3>${title}</h3><p class="eval-sub">${sub}</p>` +
        `<div class="eval-scroll"><table class="eval-table"><thead><tr>` +
        `<th>Model</th><th>ROC-AUC (95% CI)</th><th>PR-AUC (95% CI)</th><th>Brier</th><th>Acc @0.5</th>` +
        `</tr></thead><tbody>${tr}</tbody></table></div>`
      );
    }

    const wF = ev.windows.full, wS = ev.windows.strict;

    const dauc = ev.strict_dauc
      .map((d) => `${d[0]}: ΔAUC ${d[1]} (paired bootstrap P = ${d[2]})`)
      .join(" · ");

    document.getElementById("eval-tables").innerHTML =
      metricsTable(
        `Full prospective window (n = ${wF.n})`,
        `${wF.label}. Locked pipeline forecasts only — frontier baselines were generated mid-window and are not comparable here.`,
        ev.table_full37
      ) +
      metricsTable(
        `Strict head-to-head window (n = ${wS.n})`,
        `${wS.label} — the only window in which zero-shot baselines are leakage-free. ${dauc}.`,
        ev.table_strict23
      );
  } catch (e) {
    console.error("evaluation module:", e);
  }

  // ---------------- readout ledger ----------------
  function correctFormatter(cell) {
    const v = cell.getValue();
    if (v === true) return '<span class="tick-good">✓</span>';
    if (v === false) return '<span class="tick-bad">✗</span>';
    return '<span class="muted">—</span>';
  }

  function windowFormatter(cell) {
    const v = cell.getValue() || "";
    if (v === "post-lock") return badge("post-lock", "call-s");
    if (v === "pre-baseline-lock") return badge("pre-lock", "unclear");
    if (v === "pre-July catch") return badge("pre-July", "fail");
    return "—";
  }

  const table = new Tabulator("#grid", {
    data: rows,
    layout: "fitColumns",
    height: "68vh",
    initialSort: [{ column: "date", dir: "desc" }],
    columns: [
      { title: "NCT", field: "nct", width: 128, frozen: true, formatter: nctFormatter },
      { title: "Drug / intervention", field: "drug", widthGrow: 1.8, minWidth: 220, cssClass: "wrap" },
      { title: "Phase", field: "phase", width: 110 },
      { title: "Condition", field: "cond", widthGrow: 1.6, minWidth: 220, cssClass: "wrap" },
      { title: "Readout", field: "date", width: 105 },
      { title: "Window", field: "window", width: 108, formatter: windowFormatter, hozAlign: "center",
        headerTooltip: "Evaluation window: post-lock = disclosed after the 29 Jul baseline generation (strict head-to-head); pre-lock = disclosed 1-29 Jul; pre-July = late-caught readout excluded from prospective windows" },
      { title: "Outcome", field: "outcome", width: 118, formatter: outcomeFormatter, hozAlign: "center" },
      { title: "p(success)", field: "score", width: 100, hozAlign: "right", formatter: scoreFormatter, sorter: "number" },
      { title: "Call @0.5", field: "call", width: 100, formatter: callFormatter, hozAlign: "center" },
      { title: "✓", field: "correct", width: 52, formatter: correctFormatter, hozAlign: "center", headerTooltip: "Was the locked baseline call correct?" },
      { title: "Evidence", field: "url", width: 150, formatter: evidenceFormatter, headerSort: false },
      { title: "Adjudication note", field: "note", widthGrow: 2.6, minWidth: 320, cssClass: "wrap", headerSort: false },
    ],
  });

  // ---------------- market reaction module ----------------
  try {
    const mkt = await loadJSON("data/market.json");
    document.getElementById("mkt-block").hidden = false;
    const priced = mkt.filter((m) => m.r0 != null);
    const med = (arr) => {
      const s = [...arr].sort((a, b) => a - b);
      return s.length ? s[Math.floor(s.length / 2)] : null;
    };
    const pctf = (v) => (v == null ? "—"
      : `<span class="mono ${v >= 0 ? "pos" : "neg"}">${v >= 0 ? "+" : ""}${(v * 100).toFixed(1)}%</span>`);
    const medS = med(priced.filter((m) => m.outcome === "success").map((m) => m.r1 ?? m.r0));
    const medF = med(priced.filter((m) => m.outcome === "fail").map((m) => m.r1 ?? m.r0));
    document.getElementById("mkt-intro").innerHTML =
      `Share-price reaction of the most exposed listed company around each of the ${mkt.length} ` +
      `prospective readouts (${priced.length} with an exposed listing). Cumulative return vs the ` +
      `last close before the announcement. Median D+1 move: ` +
      `<b>${pctf(medS)}</b> after success readouts vs <b>${pctf(medF)}</b> after fail readouts.`;
    const rowsHtml = mkt.map((m) => `<tr>
        <td class="mono">${m.date}</td>
        <td><a class="mono nct" href="https://clinicaltrials.gov/study/${m.nct}" target="_blank" rel="noopener">${m.nct}</a></td>
        <td>${m.company || "—"}${m.ticker ? ` <span class="mono">(${m.ticker})</span>` : ""}</td>
        <td>${m.outcome === "success" ? badge("Success", "success") : badge("Fail", "fail")}</td>
        <td>${m.call === "success" ? badge("Success", "call-s") : badge("Fail", "call-f")}</td>
        <td>${m.correct === true ? '<span class="tick-good">✓</span>' : m.correct === false ? '<span class="tick-bad">✗</span>' : "—"}</td>
        <td>${pctf(m.r0)}</td><td>${pctf(m.r1)}</td><td>${pctf(m.r2)}</td>
        <td class="mkt-note">${m.note || ""}</td>
      </tr>`).join("");
    document.getElementById("mkt-table").innerHTML =
      `<div class="eval-scroll"><table class="eval-table"><thead><tr>` +
      `<th>Readout</th><th>NCT</th><th>Company</th><th>Outcome</th><th>Locked call</th><th>✓</th>` +
      `<th>D0</th><th>D+1</th><th>D+2</th><th>Note</th>` +
      `</tr></thead><tbody>${rowsHtml}</tbody></table></div>`;
  } catch (e) {
    console.error("market module:", e);
  }

  // ---------------- prediction portfolio backtest ----------------
  try {
    const pf = await loadJSON("data/portfolio.json");
    const pctf2 = (v) => (v == null ? "—"
      : `<span class="mono ${v >= 0 ? "pos" : "neg"}">${v >= 0 ? "+" : ""}${(v * 100).toFixed(1)}%</span>`);
    document.getElementById("pf-intro").innerHTML =
      `A hypothetical book split on <b>1 July 2026</b> into ${pf.n} equal slices, one per eventual ` +
      `prospective readout: locked call <i>success</i> → long the exposed listing (${pf.n_long} slices), ` +
      `locked call <i>fail</i> → short it (${pf.n_short}), no exposed listing → cash (${pf.n_cash}). ` +
      `Each slice exits at the mean of the three closes from the readout day (D0-D+2). ` +
      `Result: <b>${pctf2(pf.total_return)}</b> over the period` +
      (pf.xbi_same_period != null ? ` vs <b>${pctf2(pf.xbi_same_period)}</b> for XBI (biotech ETF)` : "") +
      `. Long slices averaged ${pctf2(pf.long_avg)}, short slices ${pctf2(pf.short_avg)}.`;
    const rowsHtml = pf.positions.map((p) => `<tr>
        <td><a class="mono nct" href="https://clinicaltrials.gov/study/${p.nct}" target="_blank" rel="noopener">${p.nct}</a></td>
        <td>${p.company || "—"}${p.ticker ? ` <span class="mono">(${p.ticker})</span>` : ""}</td>
        <td>${p.side}</td>
        <td class="mono">${p.entry_date || "—"}</td>
        <td class="mono">${p.date}</td>
        <td>${p.outcome === "success" ? badge("Success", "success") : badge("Fail", "fail")}</td>
        <td>${pctf2(p.side === "cash" ? null : p.ret)}</td>
      </tr>`).join("");
    document.getElementById("pf-table").innerHTML =
      `<div class="eval-scroll"><table class="eval-table"><thead><tr>` +
      `<th>NCT</th><th>Company</th><th>Side</th><th>Entry</th><th>Readout</th><th>Outcome</th><th>Slice return</th>` +
      `</tr></thead><tbody>${rowsHtml}</tbody></table></div>`;
    document.getElementById("pf-note").textContent =
      "Hypothetical and frictionless: no trading costs, borrow fees, slippage or market adjustment; " +
      "shorts assumed fully collateralized and available to borrow (often unrealistic for micro-caps); " +
      "overlapping names (two AZN, two GSK, long+short SION) are held as separate slices. " +
      "As of " + pf.as_of + ". Research illustration only — not investment advice.";
    document.getElementById("mkt-block").hidden = false;
  } catch (e) {
    console.error("portfolio module:", e);
  }

  table.on("tableBuilt", () => {
    fillSelect(document.getElementById("f-phase"), rows.map((r) => r.phase));
    document.getElementById("count").textContent = rows.length + " readouts";
    wireFilters(
      table,
      document.getElementById("q"),
      ["nct", "drug", "sponsor", "cond", "note"],
      {
        phase: document.getElementById("f-phase"),
        outcome: document.getElementById("f-outcome"),
        window: document.getElementById("f-window"),
      },
      document.getElementById("count")
    );
  });
})();
