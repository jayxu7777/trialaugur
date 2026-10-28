// ============================================================================
// TrialAugur — site configuration
// Everything that identifies this deployment lives HERE and only here.
//
// To change the domain later:
//   1. Edit baseUrl below.
//   2. Add a CNAME file (containing the bare domain) to the repo root and
//      point DNS at GitHub Pages. The old github.io URL will 301-redirect.
// Nothing else in the site references an absolute URL.
// ============================================================================
window.SITE = {
  name: "TrialAugur",
  tagline: "Prospective benchmark for clinical trial outcome forecasts",

  // Public origin of this deployment (no trailing slash). Used only for the
  // citation box and canonical links — all internal links are relative.
  baseUrl: "https://jayxu7777.github.io/trialaugur",

  // GitHub repository of this site (submissions and issues go here).
  repoUrl: "https://github.com/jayxu7777/trialaugur",

  // Optional contact e-mail shown on the Contribute page. Leave "" to hide.
  contactEmail: "",

  // Data cut of the results shown on the site (the paper's data cut).
  snapshotDate: "2026-10-20",

  // -------- Paper (PLACEHOLDER — replace when public) --------
  paper: {
    status: "placeholder", // set to "published" once citation/url are real
    citation: "TrialCurator and TrialAugur: evidence dossiers and forecasts of clinical trial outcomes. " +
              "Manuscript in preparation, 2026.",
    url: "" // DOI or preprint link once available
  }
};
