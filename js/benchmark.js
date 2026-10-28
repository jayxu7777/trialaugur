// TrialAugur benchmark: the NCT IDs of the prospective benchmark cohort, searchable.

(async function () {
  const B = await loadJSON("data/benchmark.json");
  document.getElementById("b-n").textContent = B.n.toLocaleString();
  const box = document.getElementById("ncts"), cnt = document.getElementById("count"), q = document.getElementById("q");
  const link = (id) => `<a href="https://clinicaltrials.gov/study/${id}" target="_blank" rel="noopener">${id}</a>`;
  function render() {
    const s = q.value.trim().toUpperCase().replace(/\s+/g, "");
    const hit = s ? B.ids.filter((id) => id.includes(s)) : B.ids;
    box.innerHTML = hit.length ? hit.map(link).join("") : `<p class="muted">No trial in the benchmark matches “${esc(q.value)}”.</p>`;
    cnt.textContent = `${hit.length.toLocaleString()} of ${B.n.toLocaleString()} trials`;
  }
  let timer;
  q.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(render, 120); });
  render();
})();
