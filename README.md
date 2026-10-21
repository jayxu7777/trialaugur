# TrialAugur

A prospective benchmark for clinical trial readout prediction.

- **706 ongoing trials** with forecasts committed to a public blockchain (Arbitrum One, 20 July 2026) before readout.
- **70 adjudicated readouts** after 29 July 2026 at the current data cut (20 October 2026): 40 successes, 30 failures.
- **Prespecified adjudication**: a trial is a success when the disclosure states that the primary endpoint was met or
  that the next phase will start, and a failure when it reports a missed primary endpoint, unacceptable safety or
  discontinuation. Everything else stays unresolved. Every label links its primary source.
- **Open contribution**: submit forecasts for pending trials (see the Contribute page); they are scored on the same labels.

The site publishes results only: locked forecasts, adjudicated outcomes, evaluation metrics, share price reactions and a
hypothetical portfolio. Evidence dossiers and feature data are not published.

## Repository layout

This repository contains only the static website (GitHub Pages, `main` branch root).

```
index.html / results.html / predictions.html / contribute.html
css/          styling
js/config.js  deployment config: site name, domain, repo, notary, paper (edit here only)
js/           page logic
data/         compact JSON consumed by the pages
downloads/    per trial outcomes and committed scores for the evaluated readouts
submissions/  community forecast CSVs (via pull request)
```

## Citation

The accompanying manuscript is in preparation; a citation and link will appear here and on the site once public.

## Disclaimer

Research resource only. Not medical, clinical or investment advice. Adjudicated labels may be revised as further
evidence emerges; revisions are recorded.
