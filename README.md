# TrialAugur

A prospective, spin-aware benchmark for clinical-trial readout prediction.

- **706 unresolved trials**, each with a frozen 53-variable evidence dossier
  assembled before readout.
- **Locked baseline predictions** for every trial, timestamped before outcomes exist.
- **Biweekly adjudication** of new readouts by evidence-based review — every label
  links its primary source and carries an adjudication note.
- **Open contribution**: submit your model's predictions while trials are pending
  (see the Contribute page); scoring uses the same adjudicated labels and rules as
  our baseline.

Because every question is a future event, answers cannot appear in any model's
training data — contamination is impossible by design.

## Repository layout

This repository contains only the static website (GitHub Pages, `main` branch root).

```
index.html / predictions.html / results.html / contribute.html
css/          styling
js/config.js  deployment config — site name, domain, repo (edit here only)
js/           page logic
data/         compact JSON consumed by the pages
downloads/    released artifacts (per-model score matrix)
submissions/  community prediction CSVs (via pull request)
```

## Citation

The accompanying manuscript is in preparation; a citation and link will appear
here and on the site once public.

## Disclaimer

Research resource only — not medical, clinical, or investment advice. Adjudicated
labels may be revised as further evidence emerges; revisions are recorded.
