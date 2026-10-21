// TrialAugur predictions: the 706 locked forecasts with readout status at the data cut.

(async function () {
  renderNotarization("notarization");
  const rows = await loadJSON("data/predictions.json");
  rows.forEach((r) => { r.call = r.ens >= 0.5 ? "success" : "fail"; });

  const STATUS = {
    evaluated: ["In evaluation", "success", "read out after 29 Jul and adjudicated"],
    unresolved: ["Unresolved", "neutral", "read out after 29 Jul, evidence insufficient for a label"],
    early: ["Read out early", "neutral", "read out by 29 Jul, before the comparator locks"],
    pending: ["Pending", "cmp", "no primary readout yet"],
  };
  const count = (k) => rows.filter((r) => r.status === k).length;
  document.getElementById("status-strip").innerHTML = ["pending", "evaluated", "unresolved", "early"].map((k) =>
    `<div class="stat"><div class="v">${count(k)}</div><div class="l"><b>${STATUS[k][0]}</b>: ${STATUS[k][2]}</div></div>`).join("");

  const sc = (c) => `<span class="mono">${f3(c.getValue())}</span>`;
  const table = new Tabulator("#grid", {
    data: rows,
    layout: "fitDataStretch",
    columnDefaults: { headerWordWrap: true },
    height: "72vh",
    initialSort: [{ column: "ens", dir: "desc" }],
    columns: [
      { title: "NCT", field: "nct", width: 128, frozen: true, formatter: (c) => nctLink(c.getValue()) },
      { title: "Drug", field: "drug", width: 200, cssClass: "wrap" },
      { title: "Sponsor", field: "sponsor", width: 160, cssClass: "wrap" },
      { title: "Phase", field: "phase", width: 92 },
      { title: "Condition", field: "cond", width: 180, cssClass: "wrap" },
      { title: "Expected readout", field: "date", width: 116, formatter: (c) => `<span class="mono">${c.getValue() || ""}</span>` },
      { title: "Ensemble", field: "ens", width: 96, hozAlign: "right", sorter: "number",
        formatter: (c) => `<b class="mono">${f3(c.getValue())}</b>` },
      { title: "Call", field: "call", width: 96, hozAlign: "center",
        formatter: (c) => (c.getValue() === "success" ? pill("Success", "success") : pill("Failure", "fail")) },
      { title: "GPT-5 reasoning", field: "gpt5", width: 104, hozAlign: "right", sorter: "number", formatter: sc },
      { title: "Embedding", field: "tabpfn", width: 98, hozAlign: "right", sorter: "number", formatter: sc,
        headerTooltip: "Embedding expert (TabPFN-3)" },
      { title: "SFT", field: "sft", width: 80, hozAlign: "right", sorter: "number", formatter: sc,
        headerTooltip: "SFT expert (Qwen3-235B)" },
      { title: "Status", field: "status", width: 136,
        formatter: (c) => { const s = STATUS[c.getValue()]; return pill(s[0], s[1]); } },
    ],
  });

  table.on("tableBuilt", () => {
    const ph = document.getElementById("f-phase"), st = document.getElementById("f-status"),
      cl = document.getElementById("f-call"), q = document.getElementById("q"), cnt = document.getElementById("count");
    [...new Set(rows.map((r) => r.phase))].filter(Boolean).sort().forEach((v) => ph.insertAdjacentHTML("beforeend", `<option>${v}</option>`));
    Object.entries(STATUS).forEach(([k, s]) => st.insertAdjacentHTML("beforeend", `<option value="${k}">${s[0]}</option>`));
    const apply = () => {
      const s = q.value.trim().toLowerCase();
      table.setFilter((r) => (!ph.value || r.phase === ph.value) && (!st.value || r.status === st.value) &&
        (!cl.value || r.call === cl.value) && (!s || [r.nct, r.drug, r.sponsor, r.cond].join(" ").toLowerCase().includes(s)));
    };
    q.addEventListener("input", apply);
    [ph, st, cl].forEach((e) => e.addEventListener("change", apply));
    table.on("dataFiltered", (f, rs) => { cnt.textContent = `${rs.length} trials`; });
    cnt.textContent = `${rows.length} trials`;
  });
})();
