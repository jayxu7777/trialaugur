# TrialAugur

A prospective benchmark for clinical trial outcome forecasts.

- **TrialCurator** turns a ClinicalTrials.gov identifier into a standardized evidence dossier; **TrialAugur** forecasts the
  trial outcome from it with a GPT-5 reasoning expert, an embedding expert (TabPFN-3) and their rank ensemble.
- **69 adjudicated readouts** of the initial prospective cohort of 694 trials, first disclosed after 29 July 2026 and
  adjudicated by 20 October 2026: 40 successes, 29 failures. Rank ensemble ROC AUC 0.834 (95% CI 0.731 to 0.919).
- **Prospective benchmark of 5,809 ongoing trials** of US listed companies, with forecasts recorded before outcome
  disclosure. The trial list is public; anyone can submit forecasts for pending trials (see the Contribute page).
- **Prespecified adjudication**: success requires an explicit report that the primary endpoint was met or an explicit
  announcement that the next phase has started; a missed primary endpoint without such an announcement, unacceptable
  safety or tolerability, or trial discontinuation is failure. Everything else stays unresolved. Every label links its
  primary source.

The site publishes results only: the values of the figures and tables of the manuscript, the 69 adjudicated readouts
with their evidence and recorded forecasts, and the NCT IDs of the benchmark. Evidence dossiers, model inputs and the
forecast values of the benchmark trials are not published.

## Repository layout

This repository contains only the static website (GitHub Pages, `main` branch root).

```
index.html / results.html / benchmark.html / contribute.html
predictions.html  redirect to benchmark.html (old link)
css/          styling
js/config.js  deployment config: site name, domain, repo, paper (edit here only)
js/           page logic
data/         compact JSON consumed by the pages
downloads/    the 69 adjudicated readouts (CSV) and the benchmark NCT IDs (CSV)
submissions/  community forecast CSVs (via pull request)
```

## Citation

The accompanying manuscript is in preparation; a citation and link will appear here and on the site once public.

## Disclaimer

Research resource only. Not medical, clinical or investment advice. Adjudicated labels may be revised as further
evidence emerges; revisions are recorded.
