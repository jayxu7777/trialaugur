// TrialAugur: shared helpers, chart helpers, header and footer. Loaded at the end of <body>.

const MARK = `<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z" fill="#C96442"/></svg>`;

// ---------- data + formatting helpers ----------
async function loadJSON(path) {
  const r = await fetch(path);
  if (!r.ok) throw new Error(path + " " + r.status);
  return r.json();
}
const f3 = (v) => (v == null ? "" : Number(v).toFixed(3));
const minus = (s) => String(s).replace(/^-/, "−");
// v is a percentage already (e.g. -38.4)
const pctv = (v, d = 1) => {
  if (v == null) return "";
  const a = Math.abs(v).toFixed(d);
  return Number(a) === 0 ? `${a}%` : `${v > 0 ? "+" : "−"}${a}%`;
};
const ciText = (c) => (c ? `${minus(f3(c[0]))} to ${minus(f3(c[1]))}` : "");
const nOf = (a) => `${a[0]}/${a[1]}`;
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fmtDate(s, year = true) {
  const [y, m, d] = String(s).slice(0, 10).split("-").map(Number);
  return `${d} ${MON[m - 1]}${year ? " " + y : ""}`;
}
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
    show(html, ev) { if (!el.isConnected) document.body.appendChild(el); el.innerHTML = html; el.style.display = "block"; this.move(ev); },
    move(ev) {
      const w = el.offsetWidth, x = ev.clientX + 14;
      el.style.left = (x + w > window.innerWidth - 8 ? ev.clientX - w - 14 : x) + "px";
      el.style.top = ev.clientY + 14 + "px";
    },
    hide() { el.style.display = "none"; },
  };
})();
function bindTips(root) {
  root.querySelectorAll("[data-tip]").forEach((n) => {
    n.addEventListener("mouseenter", (e) => TIP.show(n.dataset.tip, e));
    n.addEventListener("mousemove", (e) => TIP.move(e));
    n.addEventListener("mouseleave", () => TIP.hide());
  });
}

// One colour per method, the same on every chart (validated for colour vision deficiency on the card surface).
const MCOL = { reasoning: "#883318", embedding: "#D3A11C", ens: "#C55A30", opus5: "#4A8FD6", gpt56: "#2B5C9E", xbi: "#87867F" };
const COL = { axis: "#87867F", text: "#3D3D3A", grid: "#E3E0D5", base: "#5E5D59", other: "#B9B4A6", surface: "#FAF9F5" };

// Drawing width of a chart: its container width, so text renders at its true size, within [min, base].
function fitW(el, base, min = 340) { const w = el.clientWidth || base; return Math.max(min, Math.min(base, Math.round(w))); }

// Dot plot with interval whiskers. rows: [{name, key|color, v, lo, hi}]
function dotPlot(el, rows, { min = 0.5, max = 1.0, base = null, ticks = null, metric = "", left = 200, sep = [] } = {}) {
  ticks = ticks || [min, (min + max) / 2, max].map((t) => Math.round(t * 100) / 100);
  const W = fitW(el, 540), rowh = 42, right = 58, top = 14, fs = W < 440 ? 12 : 13;
  left = Math.min(left, Math.round(W * 0.52));
  const H = top + rowh * rows.length + 34;
  const sx = (v) => left + ((v - min) / (max - min)) * (W - left - right);
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${esc(metric)} by method">`;
  for (const t of ticks) {
    s += `<line x1="${sx(t)}" x2="${sx(t)}" y1="${top - 6}" y2="${H - 30}" stroke="${COL.grid}"/>`;
    s += `<text x="${sx(t)}" y="${H - 10}" fill="${COL.axis}" font-size="12" text-anchor="middle">${t}</text>`;
  }
  for (const i of sep) {
    const y = top + rowh * (i + 1);
    s += `<line x1="${left}" x2="${W - right}" y1="${y}" y2="${y}" stroke="${COL.grid}"/>`;
  }
  if (base != null) {
    s += `<line x1="${sx(base)}" x2="${sx(base)}" y1="${top - 6}" y2="${H - 30}" stroke="${COL.base}" stroke-dasharray="2 4" stroke-width="1.2"/>`;
  }
  rows.forEach((r, i) => {
    const y = top + rowh * i + rowh / 2, c = r.color || MCOL[r.key] || COL.axis;
    const tip = `<b>${esc(r.name)}</b><br>${esc(metric)} ${f3(r.v)}` + (r.lo != null ? ` (95% CI ${f3(r.lo)} to ${f3(r.hi)})` : "");
    s += `<g data-tip="${esc(tip)}" style="cursor:default">`;
    s += `<rect x="0" y="${y - rowh / 2}" width="${W}" height="${rowh}" fill="transparent"/>`;
    s += `<text x="${left - 12}" y="${y + 4}" fill="${COL.text}" font-size="${fs}" text-anchor="end">${esc(r.name)}</text>`;
    if (r.lo != null) s += `<line x1="${sx(r.lo)}" x2="${sx(r.hi)}" y1="${y}" y2="${y}" stroke="${c}" stroke-width="2" stroke-linecap="round"/>`;
    s += `<circle cx="${sx(r.v)}" cy="${y}" r="6" fill="${c}" stroke="${COL.surface}" stroke-width="2"/>`;
    s += `<text x="${sx(r.hi ?? r.v) + 10}" y="${y + 4}" fill="${COL.text}" font-size="12">${f3(r.v)}</text></g>`;
  });
  el.innerHTML = s + "</svg>";
  bindTips(el);
}

// ---------- shared chart builders ----------
const pct1 = (a, b) => `${((100 * a) / b).toFixed(1)}%`;
// ---------- small chart helpers ----------
// horizontal bar, rounded only at the data end
function hbarPath(x0, x1, y, h, r = 4) {
  const w = Math.abs(x1 - x0); r = Math.min(r, w, h / 2);
  if (w < 0.5) return "";
  const d = x1 >= x0 ? 1 : -1;
  return `M${x0},${y}H${x1 - d * r}Q${x1},${y} ${x1},${y + r}V${y + h - r}Q${x1},${y + h} ${x1 - d * r},${y + h}H${x0}Z`;
}
function vbarPath(x, y0, y1, w, r = 3) {
  const h = Math.abs(y1 - y0); r = Math.min(r, h, w / 2);
  if (h < 0.5) return "";
  const d = y1 <= y0 ? 1 : -1; // up when y1 < y0
  return `M${x},${y0}V${y1 + d * r}Q${x},${y1} ${x + r},${y1}H${x + w - r}Q${x + w},${y1} ${x + w},${y1 + d * r}V${y0}Z`;
}
// rows: [{label, v, color, text, tip}] from zero; supports negative values
function hbars(el, rows, { min = 0, max, ticks = [], left = 180, right = 70, rowh = 36, barh = 18, W = 540, base = null, baseLabel = "", extra = null, aria = "" }) {
  W = fitW(el, W);
  const narrow = W < 460;
  if (narrow) { left = 8; right = Math.max(44, right * 0.7); rowh = rowh + 18; }
  const top = 8, H = top + rowh * rows.length + 30;
  const sx = (v) => left + ((v - min) / (max - min)) * (W - left - right);
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${esc(aria)}">`;
  for (const t of ticks) {
    s += `<line x1="${sx(t)}" x2="${sx(t)}" y1="${top - 4}" y2="${H - 26}" stroke="${t === 0 ? COL.axis : COL.grid}"/>`;
    s += `<text x="${sx(t)}" y="${H - 8}" font-size="12" fill="${COL.axis}" text-anchor="middle">${minus(t)}</text>`;
  }
  if (base != null) {
    s += `<line x1="${sx(base)}" x2="${sx(base)}" y1="${top - 4}" y2="${H - 26}" stroke="${COL.base}" stroke-dasharray="2 4" stroke-width="1.2"/>`;
    s += `<text x="${sx(base) + 5}" y="${H - 30}" font-size="11.5" fill="${COL.axis}">${baseLabel}</text>`;
  }
  rows.forEach((r, i) => {
    const y = top + rowh * i + (rowh - barh) / 2 + (narrow ? 9 : 0), x0 = sx(Math.max(min, 0)), x1 = sx(r.v);
    s += `<g data-tip="${esc(r.tip || `<b>${r.label}</b><br>${r.text}`)}">`;
    s += `<rect x="0" y="${top + rowh * i}" width="${W}" height="${rowh}" fill="transparent"/>`;
    s += narrow ? `<text x="${left}" y="${y - 6}" font-size="12.5" fill="${COL.text}">${esc(r.label)}</text>`
      : `<text x="${left - 12}" y="${y + barh / 2 + 4.5}" font-size="13" fill="${COL.text}" text-anchor="end">${esc(r.label)}</text>`;
    s += `<path d="${hbarPath(x0, x1, y, barh)}" fill="${r.color}"/>`;
    const out = r.v >= 0 ? x1 + 7 : x1 - 7;
    s += `<text x="${out}" y="${y + barh / 2 + 4.5}" font-size="12" fill="${COL.text}" text-anchor="${r.v >= 0 ? "start" : "end"}">${r.text}</text>`;
    if (extra) s += `<text x="${W - 4}" y="${y + barh / 2 + 4.5}" font-size="12" fill="${COL.axis}" text-anchor="end">${extra(r)}</text>`;
    s += `</g>`;
  });
  el.innerHTML = s + "</svg>";
  bindTips(el);
}
// one stacked bar with a 2px surface gap between segments: parts [{label, n, color, ink}]
function stackBar(el, parts, { W = 540, h = 34, aria = "" } = {}) {
  W = fitW(el, W);
  const total = parts.reduce((a, p) => a + p.n, 0), pad = 2;
  let x = 0, s = `<svg viewBox="0 0 ${W} ${h + 4}" width="100%" role="img" aria-label="${esc(aria)}">`;
  parts.forEach((p, i) => {
    const w = (p.n / total) * W - (i < parts.length - 1 ? pad : 0);
    s += `<g data-tip="${esc(`<b>${p.label}</b><br>${p.n} of ${total} (${pct1(p.n, total)})`)}">`;
    s += `<rect x="${x}" y="2" width="${Math.max(1, w)}" height="${h}" rx="3" fill="${p.color}"/>`;
    if (w > 26) s += `<text x="${x + w / 2}" y="${h / 2 + 6.5}" font-size="13" fill="${p.ink || COL.text}" text-anchor="middle">${p.n}</text>`;
    s += `</g>`;
    x += w + pad;
  });
  el.innerHTML = s + "</svg>" +
    `<div class="legend">${parts.map((p) => `<span><i class="sq" style="background:${p.color}"></i>${p.label} ${p.n}</span>`).join("")}</div>`;
  bindTips(el);
}

// Classification at 0.5 by adjudicated outcome: failures to the left, successes to the right, on one count scale.
// Filled segments are correct predictions, open segments incorrect ones. P: the prospective block of results.json.
function drawClassification(el, P, models = P.models) {
  const W = fitW(el, 1000), narrow = W < 640, left = narrow ? 124 : 210, lab = narrow ? 40 : 58, rowh = 40, barh = 24, top = 8, n = P.nF + P.nS;
  const unit = (W - left - 2 * lab - 8) / n, cx = left + lab + P.nF * unit, H = top + rowh * models.length + 46;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Classification at 0.5">`;
  models.forEach((m, i) => {
    const y = top + rowh * i + (rowh - barh) / 2, c = MCOL[m.key];
    s += `<text x="${left - 10}" y="${y + barh / 2 + 4.5}" font-size="${narrow ? 12 : 13}" fill="${COL.text}" text-anchor="end">${esc(narrow ? m.short : m.name)}</text>`;
    const seg = (x0, x1, filled, tip) => {
      const a = Math.min(x0, x1), w = Math.abs(x1 - x0);
      if (w < 0.5) return "";
      return `<rect x="${a}" y="${y}" width="${w}" height="${barh}" rx="3" fill="${filled ? c : COL.surface}" stroke="${c}" stroke-width="${filled ? 0 : 1.6}" data-tip="${esc(tip)}"/>`;
    };
    const fc = cx - m.f_correct * unit;
    s += seg(cx - 1, fc, true, `<b>${m.name}</b><br>${m.f_correct} of ${P.nF} failures classified as failures`);
    s += seg(fc - 2, fc - 2 - m.f_incorrect * unit + 1, false, `<b>${m.name}</b><br>${m.f_incorrect} of ${P.nF} failures classified as successes`);
    const sc = cx + m.s_correct * unit;
    s += seg(cx + 1, sc, true, `<b>${m.name}</b><br>${m.s_correct} of ${P.nS} successes classified as successes`);
    s += seg(sc + 2, sc + 2 + m.s_incorrect * unit - 1, false, `<b>${m.name}</b><br>${m.s_incorrect} of ${P.nS} successes classified as failures`);
    s += `<text x="${cx - P.nF * unit - 8}" y="${y + barh / 2 + 4.5}" font-size="12.5" fill="${COL.text}" text-anchor="end">${m.f_correct}/${P.nF}</text>`;
    s += `<text x="${cx + P.nS * unit + 8}" y="${y + barh / 2 + 4.5}" font-size="12.5" fill="${COL.text}">${m.s_correct}/${P.nS}</text>`;
  });
  const yb = top + rowh * models.length;
  s += `<line x1="${cx}" x2="${cx}" y1="${top - 4}" y2="${yb + 4}" stroke="${COL.text}" stroke-width="1.2"/>`;
  s += `<text x="${cx - 8}" y="${yb + 24}" font-size="12.5" fill="${COL.axis}" text-anchor="end">← Failures (n = ${P.nF})</text>`;
  s += `<text x="${cx + 8}" y="${yb + 24}" font-size="12.5" fill="${COL.axis}">Successes (n = ${P.nS}) →</text>`;
  el.innerHTML = s + "</svg>";
  bindTips(el);
}

// Cumulative abnormal returns of the unsuccessful trials by forecast agreement (groups A to D), medians as lines.
function drawCarGroups(el, G) {
  const W = fitW(el, 480), H = 440, l = 48, r = 8, t = 14, b = 104, ymin = -80, ymax = 10, wrap = W < 440 ? 10 : 13;
  const bw = (W - l - r) / G.length;
  const sy = (v) => t + ((ymax - v) / (ymax - ymin)) * (H - t - b);
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Abnormal returns of unsuccessful trials by group">`;
  [-80, -60, -40, -20, 0].forEach((g) => {
    s += `<line x1="${l}" x2="${W - r}" y1="${sy(g)}" y2="${sy(g)}" stroke="${g === 0 ? COL.axis : COL.grid}"/>`;
    s += `<text x="${l - 8}" y="${sy(g) + 4}" font-size="12" fill="${COL.axis}" text-anchor="end">${minus(g)}%</text>`;
  });
  G.forEach((g, gi) => {
    const cx = l + bw * gi + bw / 2;
    const ev = [...g.events].sort((a, b) => a.car - b.car);
    ev.forEach((e, j) => {
      const off = g.g === "D" ? -bw * 0.18 : ((j % 3) - 1) * 12;
      const tip = `<b>${e.nct}</b> · ${esc(e.company)} (${esc(e.ticker)})<br>${esc(e.evidence)}<br>CAR ${pctv(e.car)}`;
      s += `<circle cx="${cx + off}" cy="${sy(e.car)}" r="5.5" fill="#A8432A" stroke="${COL.surface}" stroke-width="2" data-tip="${esc(tip)}"/>`;
      if (e.name) s += `<text x="${cx + off + 10}" y="${sy(e.car) + 4}" font-size="12" fill="${COL.text}">${esc(e.name)}</text>`;
    });
    if (g.g !== "D") {
      s += `<line x1="${cx - bw * 0.3}" x2="${cx + bw * 0.3}" y1="${sy(g.median)}" y2="${sy(g.median)}" stroke="${COL.text}" stroke-width="2.2"/>`;
      s += `<text x="${cx + bw * 0.3 + 4}" y="${sy(g.median) + 4}" font-size="12" fill="${COL.text}">${pctv(g.median)}</text>`;
    }
    const words = g.label.split(" "), lines = [];
    let cur = "";
    for (const w of words) { if ((cur + " " + w).trim().length > wrap) { lines.push(cur.trim()); cur = w; } else cur += " " + w; }
    lines.push(cur.trim());
    s += `<text x="${cx}" y="${H - b + 22}" font-size="14" font-weight="600" fill="${COL.text}" text-anchor="middle">${g.g}</text>`;
    lines.concat([`(n = ${g.n})`]).forEach((ln, k) => {
      s += `<text x="${cx}" y="${H - b + 40 + k * 15}" font-size="12.5" fill="${COL.axis}" text-anchor="middle">${esc(ln)}</text>`;
    });
  });
  el.innerHTML = s + "</svg>";
  bindTips(el);
}

// Share of failures identified at 0.5, by whether a direct public negative signal preceded the forecasts.
function drawSignals(el, S, names) {
  const W = fitW(el, 540), narrow = W < 460, left = narrow ? 112 : 170, right = 58, top = 4, head = 30, rowh = 28, barh = 16;
  const H = top + S.groups.length * (head + rowh * S.keys.length) + 10 * (S.groups.length - 1) + 34;
  const sx = (v) => left + v * (W - left - right);
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Failures identified by public signal status">`;
  const yEnd = H - 26;
  [0, 0.5, 1].forEach((t) => {
    s += `<line x1="${sx(t)}" x2="${sx(t)}" y1="${top + head - 6}" y2="${yEnd}" stroke="${t === 0 ? COL.axis : COL.grid}"/>`;
    s += `<text x="${sx(t)}" y="${H - 8}" font-size="12" fill="${COL.axis}" text-anchor="middle">${t * 100}%</text>`;
  });
  let y = top;
  S.groups.forEach((g, gi) => {
    if (gi) y += 10;
    s += `<text x="0" y="${y + 18}" font-size="13" font-weight="600" fill="${COL.text}">${esc(g.label)} (n = ${g.n})</text>`;
    y += head;
    S.keys.forEach((k) => {
      const v = g.counts[k], yy = y + (rowh - barh) / 2;
      s += `<g data-tip="${esc(`<b>${names[k]}</b><br>${v} of ${g.n} failures with ${g.label.toLowerCase()} identified`)}">`;
      s += `<rect x="0" y="${y}" width="${W}" height="${rowh}" fill="transparent"/>`;
      s += `<text x="${left - 10}" y="${yy + barh / 2 + 4.5}" font-size="${narrow ? 12 : 13}" fill="${COL.text}" text-anchor="end">${esc(names[k])}</text>`;
      s += `<path d="${hbarPath(sx(0), sx(v / g.n), yy, barh)}" fill="${MCOL[k]}"/>`;
      s += `<text x="${sx(v / g.n) + 7}" y="${yy + barh / 2 + 4.5}" font-size="12" fill="${COL.text}">${v}/${g.n}</text></g>`;
      y += rowh;
    });
  });
  el.innerHTML = s + "</svg>";
  bindTips(el);
}

// ---------- header and footer (after the helpers they use) ----------
(function () {
  const S = window.SITE;
  const page = document.body.dataset.page || "";
  const NAV = [
    ["index.html", "home", "Overview"],
    ["results.html", "results", "Results"],
    ["benchmark.html", "benchmark", "Benchmark"],
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
          <div>${S.name} · data cut ${fmtDate(S.snapshotDate)} · forecasts recorded before outcome disclosure</div>
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
