// TrialAugur — shared header/footer and helpers. Loaded at the end of <body>.

(function () {
  const S = window.SITE;
  const page = document.body.dataset.page || "";

  const NAV = [
    ["index.html", "home", "Home"],
    ["predictions.html", "predictions", "Predictions"],
    ["results.html", "results", "Results"],
    ["contribute.html", "contribute", "Contribute"],
  ];

  const header = document.getElementById("site-header");
  if (header) {
    header.innerHTML = `
      <header class="topbar">
        <div class="brand"><a href="index.html">${S.name.toUpperCase()}</a>
          <span class="sub">${S.tagline}</span></div>
        <nav>
          ${NAV.map(([href, id, label]) =>
            `<a href="${href}" class="${id === page ? "active" : ""}">${label}</a>`).join("")}
          <a href="${S.repoUrl}" target="_blank" rel="noopener">GitHub</a>
        </nav>
      </header>`;
  }

  const footer = document.getElementById("site-footer");
  if (footer) {
    footer.innerHTML = `
      <footer>
        <div>${S.name} · data snapshot <span class="mono">${S.snapshotDate}</span> ·
          predictions frozen before readout${S.notary ?
            ` (⛓ <a href="predictions.html#notarization">on-chain proof</a>, ${S.notary.chain} ${S.notary.date.split(" ")[0]})` : ""} ·
          adjudicated labels may be revised as further evidence emerges.</div>
        <div>Research resource only — not medical, clinical, or investment advice.</div>
      </footer>`;
  }

  // Any <a data-site-link="repo|issues|base"> gets its href from config.
  document.querySelectorAll("a[data-site-link]").forEach((a) => {
    const kind = a.dataset.siteLink;
    if (kind === "repo") a.href = S.repoUrl;
    if (kind === "issues") a.href = S.repoUrl.replace(/\/$/, "") + "/issues";
    if (kind === "base") a.href = S.baseUrl;
  });
})();

// ---------- on-chain proof block (config.js → SITE.notary) ----------
function renderNotarization(elId) {
  const N = window.SITE.notary;
  const el = document.getElementById(elId);
  if (!N || !el) return;
  const short = (h) => h.slice(0, 10) + "…" + h.slice(-6);
  el.innerHTML = `
    <details class="chain-proof">
      <summary>⛓ On-chain proof — expert predictions notarized on ${N.chain},
        <span class="mono">${N.date}</span>, before readout</summary>
      <div class="chain-body">
        <p>The per-expert probabilities behind these ensemble scores —
          ${N.payload} — were timestamped via the Notary contract
          <span class="mono">${short(N.contract)}</span> (<span class="mono">store(string)</span>).
          Any later change to the predictions would change the content hashes below.</p>
        <table>
          <tr><th>Part</th><th>Rows</th><th>Transaction</th><th>Block</th><th>Content keccak256</th></tr>
          ${N.txs.map((t) => `<tr>
            <td>${t.part}</td><td>${t.rows}</td>
            <td><a class="mono" href="${N.dappUrl}?tx=${t.hash}" target="_blank" rel="noopener">${short(t.hash)} ↗</a>
              <a class="chain-alt" href="${N.explorerTx}${t.hash}" target="_blank" rel="noopener">raw</a></td>
            <td class="mono">${t.block}</td>
            <td class="mono">${short(t.keccak256)}</td>
          </tr>`).join("")}
        </table>
        <p>Transaction links open <a href="${N.dappUrl}" target="_blank" rel="noopener">our notary dApp</a>
          (also built by this project) with the hash pre-filled — it reads the chain and displays the
          decoded notarized content directly. The <i>raw</i> links show the underlying transaction on Arbiscan.</p>
      </div>
    </details>`;
  if (location.hash === "#notarization") {
    el.querySelector(".chain-proof").open = true;
  }
}

// ---------- helpers used by the table pages ----------
async function loadJSON(path) {
  const r = await fetch(path);
  if (!r.ok) throw new Error(path + " → " + r.status);
  return r.json();
}

function nctFormatter(cell) {
  const v = cell.getValue();
  return `<a class="mono nct" href="https://clinicaltrials.gov/study/${v}" target="_blank" rel="noopener">${v}</a>`;
}

function badge(text, klass) {
  return `<span class="badge b-${klass}">${text}</span>`;
}

function outcomeFormatter(cell) {
  const v = (cell.getValue() || "").toLowerCase();
  if (v === "success") return badge("Success", "success");
  if (v === "fail") return badge("Fail", "fail");
  return badge("Under review", "unclear");
}

function callFormatter(cell) {
  const v = (cell.getValue() || "").toLowerCase();
  if (v === "success") return badge("Success", "call-s");
  if (v === "fail") return badge("Fail", "call-f");
  return "—";
}

function scoreFormatter(cell) {
  const v = cell.getValue();
  return v == null ? "—" : `<span class="mono">${Number(v).toFixed(3)}</span>`;
}

function evidenceFormatter(cell) {
  const v = cell.getValue();
  if (!v) return "—";
  let host = "";
  try { host = new URL(v).hostname.replace(/^www\./, ""); } catch (e) { host = "link"; }
  return `<a href="${v}" target="_blank" rel="noopener">${host} ↗</a>`;
}

// Wire a search box + <select> filters to a Tabulator instance.
// selects: {fieldName: selectElement}; search matches the given fields.
function wireFilters(table, searchEl, searchFields, selects, countEl) {
  function apply() {
    const q = (searchEl?.value || "").trim().toLowerCase();
    table.setFilter((row) => {
      for (const [field, sel] of Object.entries(selects || {})) {
        if (sel.value && String(row[field]) !== sel.value) return false;
      }
      if (q) {
        const hay = searchFields.map((f) => row[f] || "").join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }
  searchEl?.addEventListener("input", apply);
  Object.values(selects || {}).forEach((s) => s.addEventListener("change", apply));
  if (countEl) {
    table.on("dataFiltered", (f, rows) => { countEl.textContent = rows.length + " trials"; });
  }
}

function fillSelect(sel, values) {
  [...new Set(values)].sort().forEach((v) => {
    if (!v) return;
    const o = document.createElement("option");
    o.value = v; o.textContent = v;
    sel.appendChild(o);
  });
}
