// TrialAugur: shared header, footer, on chain proof and chart helpers. Loaded at the end of <body>.

const MARK = `<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z" fill="#C96442"/></svg>`;

(function () {
  const S = window.SITE;
  const page = document.body.dataset.page || "";
  const NAV = [
    ["index.html", "home", "Overview"],
    ["results.html", "results", "Results"],
    ["predictions.html", "predictions", "Predictions"],
    ["contribute.html", "contribute", "Contribute"],
  ];

  const header = document.getElementById("site-header");
  if (header) {
    header.innerHTML = `
      <header class="nav"><div class="wrap navin">
        <a class="logo" href="index.html">${MARK}${S.name}</a>
        <nav id="mainnav">
          ${NAV.map(([href, id, label]) =>
            `<a href="${href}" class="${id === page ? "active" : ""}">${label}</a>`).join("")}
          <a href="${S.repoUrl}" target="_blank" rel="noopener">GitHub</a>
        </nav>
        <a class="cta" href="contribute.html">Submit forecasts</a>
        <button class="menu-btn" aria-label="Menu" onclick="document.getElementById('mainnav').classList.toggle('open')">&#9776;</button>
      </div></header>`;
    const nav = header.querySelector(".nav");
    const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 4);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  const footer = document.getElementById("site-footer");
  if (footer) {
    footer.innerHTML = `
      <footer class="foot"><div class="wrap">
        <div class="row">
          <div>${S.name} · data cut <span class="mono">${S.snapshotDate}</span> · forecasts committed on chain before readout
            ${S.notary ? `(<a href="predictions.html#notarization">proof</a>)` : ""}</div>
          <div>Research resource only. Not medical, clinical or investment advice.</div>
        </div>
      </div></footer>`;
  }

  document.querySelectorAll("a[data-site-link]").forEach((a) => {
    const kind = a.dataset.siteLink;
    if (kind === "repo") a.href = S.repoUrl;
    if (kind === "issues") a.href = S.repoUrl.replace(/\/$/, "") + "/issues";
    if (kind === "base") a.href = S.baseUrl;
  });
})();

// ---------- on chain proof block (config.js: SITE.notary) ----------
function renderNotarization(elId) {
  const N = window.SITE.notary;
  const el = document.getElementById(elId);
  if (!N || !el) return;
  const short = (h) => h.slice(0, 10) + "…" + h.slice(-6);
  el.innerHTML = `
    <details class="proof">
      <summary><span class="pill neutral">On chain proof</span>
        Expert forecasts for all 706 trials were committed to ${N.chain} on <span class="mono">${N.date}</span>, before any readout in the evaluation window.</summary>
      <div class="body">
        <p>Payload: ${N.payload}. Stored through the notary contract <span class="mono">${short(N.contract)}</span>.
          Any later change to a forecast would change the content hashes below. The two zero shot comparators were
          committed the same way on 27 July (Claude Opus 5) and 29 July 2026 (GPT-5.6).</p>
        <div class="scroll"><table class="t">
          <tr><th>Part</th><th class="num">Rows</th><th>Transaction</th><th class="num">Block</th><th>Content keccak256</th></tr>
          ${N.txs.map((t) => `<tr>
            <td>${t.part}</td><td class="num">${t.rows}</td>
            <td><a class="mono" href="${N.dappUrl}?tx=${t.hash}" target="_blank" rel="noopener">${short(t.hash)} ↗</a>
              · <a href="${N.explorerTx}${t.hash}" target="_blank" rel="noopener">Arbiscan</a></td>
            <td class="num">${t.block}</td>
            <td class="mono">${short(t.keccak256)}</td></tr>`).join("")}
        </table></div>
        <p>Transaction links open <a href="${N.dappUrl}" target="_blank" rel="noopener">our notary dApp</a> with the hash
          filled in; it reads the chain and decodes the stored content.</p>
      </div>
    </details>`;
  if (location.hash === "#notarization") el.querySelector("details").open = true;
}

// ---------- data + formatting helpers ----------
async function loadJSON(path) {
  const r = await fetch(path);
  if (!r.ok) throw new Error(path + " " + r.status);
  return r.json();
}
const f3 = (v) => (v == null ? "" : Number(v).toFixed(3));
const pct = (v, d = 0) => {
  if (v == null) return "";
  const a = Math.abs(v * 100).toFixed(d);
  return Number(a) === 0 ? `${a}%` : `${v > 0 ? "+" : "−"}${a}%`;
};
const ciText = (c) => (c ? `${f3(c[0])} to ${f3(c[1])}` : "");
const fmtDate = (s) => {
  const d = new Date(s + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};
function pill(text, klass) { return `<span class="pill ${klass}">${text}</span>`; }
function nctLink(v) {
  return `<a class="mono" href="https://clinicaltrials.gov/study/${v}" target="_blank" rel="noopener">${v}</a>`;
}
function hostOf(u) {
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch (e) { return "source"; }
}
function esc(s) { return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

// Tooltip shared by the SVG charts
const TIP = (() => {
  const el = document.createElement("div");
  el.className = "tip";
  document.addEventListener("DOMContentLoaded", () => document.body.appendChild(el));
  return {
    show(html, ev) { el.innerHTML = html; el.style.display = "block"; this.move(ev); },
    move(ev) {
      const w = el.offsetWidth, x = ev.clientX + 14;
      el.style.left = (x + w > window.innerWidth - 8 ? ev.clientX - w - 14 : x) + "px";
      el.style.top = ev.clientY + 14 + "px";
    },
    hide() { el.style.display = "none"; },
  };
})();
function bindTips(svgEl) {
  svgEl.querySelectorAll("[data-tip]").forEach((n) => {
    n.addEventListener("mouseenter", (e) => TIP.show(n.dataset.tip, e));
    n.addEventListener("mousemove", (e) => TIP.move(e));
    n.addEventListener("mouseleave", () => TIP.hide());
  });
}

const COL = { TrialAugur: "#C96442", Comparator: "#6A9BCC", axis: "#87867F", text: "#3D3D3A", grid: "#E3E0D5", base: "#5E5D59" };

// Dot plot with interval whiskers. rows: [{name, kind, v, lo, hi}]
function dotPlot(el, rows, { min = 0.5, max = 1.0, base = null, baseLabel = "", ticks = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0] } = {}) {
  const W = 520, rowh = 42, left = 196, right = 50, top = 14;
  const H = top + rowh * rows.length + 34;
  const sx = (v) => left + ((v - min) / (max - min)) * (W - left - right);
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Dot plot">`;
  for (const t of ticks) {
    s += `<line x1="${sx(t)}" x2="${sx(t)}" y1="${top - 6}" y2="${H - 30}" stroke="${COL.grid}"/>`;
    s += `<text x="${sx(t)}" y="${H - 10}" fill="${COL.axis}" font-size="12" text-anchor="middle">${t.toFixed(1)}</text>`;
  }
  if (base != null) {
    s += `<line x1="${sx(base)}" x2="${sx(base)}" y1="${top - 6}" y2="${H - 30}" stroke="${COL.base}" stroke-dasharray="2 4" stroke-width="1.2"/>`;
  }
  rows.forEach((r, i) => {
    const y = top + rowh * i + rowh / 2, c = COL[r.kind] || COL.axis;
    const tip = `<b>${esc(r.name)}</b><br>${r.metric || ""} ${f3(r.v)} (95% CI ${f3(r.lo)} to ${f3(r.hi)})`;
    s += `<g data-tip="${esc(tip)}" style="cursor:default">`;
    s += `<rect x="0" y="${y - rowh / 2}" width="${W}" height="${rowh}" fill="transparent"/>`;
    s += `<text x="${left - 14}" y="${y + 4}" fill="${COL.text}" font-size="13" text-anchor="end">${esc(r.name)}</text>`;
    s += `<line x1="${sx(r.lo)}" x2="${sx(r.hi)}" y1="${y}" y2="${y}" stroke="${c}" stroke-width="2.4" stroke-linecap="round"/>`;
    s += `<circle cx="${sx(r.v)}" cy="${y}" r="6.5" fill="${c}"/>`;
    s += `<text x="${sx(r.hi) + 9}" y="${y + 4}" fill="${COL.axis}" font-size="12">${f3(r.v)}</text></g>`;
  });
  s += "</svg>";
  el.innerHTML = s;
  bindTips(el);
}
