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
  tagline: "A prospective, spin-aware benchmark for clinical-trial readout prediction",

  // Public origin of this deployment (no trailing slash). Used only for the
  // citation box and canonical links — all internal links are relative.
  baseUrl: "https://jayxu7777.github.io/trialaugur",

  // GitHub repository of this site (submissions and issues go here).
  repoUrl: "https://github.com/jayxu7777/trialaugur",

  // Optional contact e-mail shown on the Contribute page. Leave "" to hide.
  contactEmail: "",

  // Date of the current data snapshot / last adjudication round.
  snapshotDate: "2026-08-30",

  // -------- On-chain notarization of the locked predictions --------
  // The per-expert probabilities behind the baseline were timestamped on-chain
  // BEFORE readout. Shown as a collapsible proof block on the Predictions page
  // and a small footer link.
  notary: {
    chain: "Arbitrum One",
    date: "2026-07-20 UTC",
    contract: "0x1AEc15eE8404fDaB823a899B067cb91380DBa8E1",
    payload: "nctid,p_llm,p_tabpfn3,p_sft (4-decimal) for all 706 trials, split across 3 transactions",
    dappUrl: "https://jayxu7777.github.io/notary-dapp/", // our own notary dApp
    explorerTx: "https://arbiscan.io/tx/",
    txs: [
      { part: "1/3", rows: 236, hash: "0x1f5349257c70a39faed0e42a3b0013f01c50e5163238347f7db02764f160e21c", block: 485760812, keccak256: "0x12bd10bdc697a29129414886a859bddf41869f7937ddc9126a0f8ae5eca01e4d" },
      { part: "2/3", rows: 236, hash: "0x89a27985b71358de94b9fa684e6a60a5293a8888d90c320a479570deae0dd8cc", block: 485760831, keccak256: "0x2a8f185439af0bd622dccf81208dccd071cbdf6a94475cf6fdaec8d1cd1ffb49" },
      { part: "3/3", rows: 234, hash: "0xb3cd0190adedd11caa05a2d58ce492378622fc6803d24e4cd2e43371158775ea", block: 485760851, keccak256: "0x0e8ff7d3a26df6698832921608732ccfad928d3d7acfeca1807ebe1a76502b45" },
    ],
  },

  // -------- Paper (PLACEHOLDER — demo text, replace when public) --------
  paper: {
    status: "placeholder", // set to "published" once citation/url are real
    citation: "Anonymous et al. TrialAugur: prospective, spin-aware benchmarking " +
              "of clinical-trial outcome prediction. Manuscript in preparation, 2026.",
    url: "" // DOI or preprint link once available
  }
};
