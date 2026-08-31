// TrialAugur — locked baseline predictions.

(async function () {
  document.getElementById("snap").textContent = window.SITE.snapshotDate;

  // On-chain proof block (shared renderer in common.js; data in config.js → SITE.notary)
  renderNotarization("notarization");

  const rows = await loadJSON("data/predictions.json");

  function statusFormatter(cell) {
    const r = cell.getRow().getData();
    if (r.status === "reported") return badge("Reported", "reported");
    return badge("Pending", "pending") +
      (r.interim ? ' <span class="muted" style="font-size:11px">interim</span>' : "");
  }

  const table = new Tabulator("#grid", {
    data: rows,
    layout: "fitColumns",
    height: "72vh",
    initialSort: [{ column: "score", dir: "desc" }],
    columns: [
      { title: "NCT", field: "nct", width: 130, frozen: true, formatter: nctFormatter },
      { title: "Drug / intervention", field: "drug", widthGrow: 2.2, minWidth: 240, cssClass: "wrap" },
      { title: "Sponsor", field: "sponsor", widthGrow: 1.6, minWidth: 200, cssClass: "wrap" },
      { title: "Phase", field: "phase", width: 110 },
      { title: "Condition", field: "cond", widthGrow: 2, minWidth: 240, cssClass: "wrap" },
      { title: "Expected readout*", field: "date", width: 130 },
      { title: "p(success)", field: "score", width: 110, hozAlign: "right", formatter: scoreFormatter, sorter: "number" },
      { title: "Call @0.5", field: "call", width: 105, formatter: callFormatter, hozAlign: "center" },
      { title: "Status", field: "status", width: 140, formatter: statusFormatter },
    ],
  });

  table.on("tableBuilt", () => {
    fillSelect(document.getElementById("f-phase"), rows.map((r) => r.phase));
    document.getElementById("count").textContent = rows.length + " trials";
    wireFilters(
      table,
      document.getElementById("q"),
      ["nct", "drug", "sponsor", "cond"],
      {
        phase: document.getElementById("f-phase"),
        status: document.getElementById("f-status"),
        call: document.getElementById("f-call"),
      },
      document.getElementById("count")
    );
  });

  // * footnote under the grid
  document.getElementById("grid").insertAdjacentHTML("afterend",
    '<p class="muted" style="font-size:12px;margin-top:8px">* registry primary-completion / expected-readout date at snapshot time; sponsors shift these.</p>');
})();
