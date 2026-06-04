# Lemma: TTO Commercialization Software — Market & Competitor Research

> **Generated:** 2026-06-05 via a deep-research workflow (5 search angles, 23 sources fetched, 101 claims extracted, 25 adversarially fact-checked → 19 confirmed, 6 refuted).
> **Method:** Each claim was verified by a 3-vote adversarial check (a claim is killed if ≥2 of 3 reviewers refute it). Confidence is stated per finding.
> **Scope:** Competitive landscape and market for university technology-transfer (TTO) / IP-commercialization software, framed for positioning Lemma (grounded-AI platform: paper → TRL/IRL + TAM/SAM/SOM + feasibility → investor deck, all source-cited).

---

## Bottom line

The market is owned by **IP-lifecycle-management incumbents** (Wellspring, Inteum) that handle disclosures, docketing, licensing, agreements, and compliance, and are now *bolting on* assistive AI. A separate category handles **partner/deal matching** (IN-PART, Tradespace). **None of them** does what Lemma does: source-grounded **paper → TRL/IRL + TAM/SAM/SOM + feasibility → investor deck**. That whitespace is real and verified by absence across every vendor surveyed.

Two caveats that matter for strategy:
1. The gap is **time-sensitive** — every incumbent is actively adding AI (Wellspring Evolve launched at AUTM 2025; Inteum shipped AI summaries in 2025).
2. The parts of the question about **TTO budgets and buying process were not answerable** from public sources and remain the highest-value unknown.

---

## 1. Incumbents — what they actually do (confidence: HIGH)

| Vendor | What it is | Scale (self-reported) | AI today |
|---|---|---|---|
| **Wellspring (Evolve, ex-Sophia)** | End-to-end TTO/IP suite, 30+ modules: invention disclosures, docketing, renewals, licensing, marketing, agreements, financials. Founded 2003. Ranked among top-10 IP-software vendors alongside Clarivate (~18% share) and LexisNexis (~14%). | "500+ orgs", "20+ years" | Agreement-term extraction, document summarization; marketed as "far ahead of anything else on the market" (unaudited vendor claim). |
| **Inteum (Minuet)** | The other major incumbent. Core advantage: **native U.S. federal compliance** — direct iEdison upload / Bayh-Dole reporting. Founded 1992. Joined Merit Holdings in 2025. | "400+ research institutions, 30 countries" | Right-click "AI Summary" (structured summaries via an OpenAI model on Azure, 2025); intake / review / approval assist. |

Both incumbents center on **IP lifecycle management**, not on readiness scoring, market sizing, or pitch generation.

---

## 2. The adjacent "matching" category (confidence: HIGH)

- **IN-PART Connect** — human-curated university↔industry matchmaking; in-house STEM experts hand-pick relevant technologies. Network: "250+ institutions, 6,000+ companies". Explicitly an *introduction* tool, **not** an assessment tool ("we play no further involvement in the conversation").
- **Tradespace** — the most AI-forward player surveyed. ML identifies a portfolio's best commercialization candidates (by IP quality + market demand) and discovers interested companies (by products, news, evidence of use). Marketed scale: "20M licensing contacts", "$100M IP deals". Still has **no** TRL/IRL, TAM/SAM/SOM, pitch decks, or source grounding.

---

## 3. The differentiation gap — Lemma's moat (confidence: HIGH)

Across **every** tool surveyed, including the most AI-forward (Tradespace), there is:
- **No** explicit TRL/IRL readiness scoring
- **No** TAM/SAM/SOM market sizing
- **No** investor-ready pitch-deck generation
- **No** source-cited grounding

Incumbents = IP lifecycle + matching + agreements. The **paper → readiness → market → feasibility → pitch** workflow is open whitespace. (Verified by absence; targeted searches for these terms returned zero vendor-specific results.)

**Academic tailwind:** traditional TRLs were designed for hardware and are inadequate for AI. An AI system "might achieve TRL 7 yet still fail when facing inputs outside its training distribution" (arXiv 2506.11001v1, 2025). Corroborated by the MLTRL framework (Nature Communications, Lavin et al. 2022), proposed precisely because standard TRLs miss ML maturity, data quality, transparency, and trust. An **AI-aware readiness rubric** is therefore a credible, defensible differentiator.

---

## 4. Market size & growth (confidence: MEDIUM — directional only)

IP-management software market ≈ **USD 15B in 2026**, growing at roughly **11.5–13.2% CAGR**:
- Mordor Intelligence: USD 15.19B (2026) → USD 26.19B (2031), 11.51% CAGR
- Straits Research: 13.22% CAGR (2026–2034)
- Corroborated cluster: Fortune Business Insights 13.09%, Research Nester ~13.2%, KBV Research 12.6%, Verified Market Research 13.07%

**Why only medium confidence:**
- All figures are paywalled syndicated market-research forecasts with non-transparent methodology.
- The 2026 base estimate spreads ~USD 13.5–16.5B across firms.
- "IP management software" is **broader** than the university-TTO niche Lemma targets, so figures over-scope the precise market.
- **6 market-size claims were refuted in verification** (see Appendix B), including Coherent's 15.3% CAGR and Technavio's 19.7%. Treat any single number as one estimate, not ground truth.

---

## 5. What the research could NOT confirm (open questions)

1. **TTO budgets & buying process** — no surviving evidence on pricing, contract size, or procurement cycles. Highest-value unknown; needs primary research (AUTM data, direct TTO interviews).
2. **Several named incumbents uncharacterized** — IRIS / Bayh-Dole Central, TechTracS/KCA, Flintbox, Tenderwell, and Konfer returned no verified claims.
3. The "no one does paper-to-deck" conclusion rests on a finite vendor sample; a stealth startup could exist outside it.
4. No primary survey data on which features TTOs most *value and purchase* (vs. what vendors market).

---

## 6. What this means for Lemma (repo-grounded actions)

Mapping the findings onto what the codebase actually has today (`lib/agents/`: paper → critique → trl-irl → market-scout → feasibility → pitch-builder; `lib/deck-render/`: PDF/PPTX/DOCX export with source citations; Prisma/Neon, Clerk, Inngest, R2).

1. **Lean into the moat you already have.** The grounded `paper → … → deck` pipeline with source URLs on every market claim ("no source, no claim"), the skeptical/traceability critiques, and citations rendered onto the exported deck *are* the verified whitespace. Make grounding/traceability the headline, not an implementation detail.

2. **Position as the assessment/triage layer, not an IP-management replacement.** Do not try to out-build Wellspring's 30 modules or Inteum's iEdison integration. Sit upstream: score and prioritize disclosures, then hand off. The missing intake side (an **invention-disclosure intake form**) is a small addition to the existing `new-project-form` + project model and is the on-ramp TTOs expect.

3. **Adopt an AI-aware readiness rubric (cheap, high-credibility).** The `trl-irl-agent` already has domain rubrics; extend it with MLTRL dimensions (data quality, robustness/out-of-distribution, transparency) for AI-domain papers. Directly answers the "TRLs are inadequate for AI" critique.

4. **Credibility is the whole product → invest in evals.** Incumbents can ship sloppy assistive AI because IP management is their core; for Lemma the assessment *is* the product, so a wrong TAM or ungrounded TRL is fatal. The grounding guardrails exist; the missing piece is a **regression eval harness** (golden papers → expected output ranges) so quality does not silently drift.

5. **Two gaps to close before selling to U.S. TTOs:** (a) **Bayh-Dole / iEdison compliance** is table-stakes that Inteum owns natively — decide to integrate/export or explicitly scope out; (b) **multi-user committee workflow** — `ReviewNote` / committee roles exist in the schema but the Review stage is thin. The export → Review flow already wired is the right spine; build approval/sign-off on top.

6. **Optional expansion into the matching category.** Market Scout already surfaces real companies with sources; a grounded "who might license/partner" output steps toward Tradespace/IN-PART territory while keeping the citation differentiator intact.

7. **Do the primary research the web could not give.** Pricing, procurement, and which features TTOs actually buy are unknown. Before heavy roadmap investment, talk to 5–10 TTOs and pull AUTM adoption data.

**Net:** the build targets a genuine, verified gap, and grounding is the right moat. Strategic risks: (a) the gap narrows as incumbents add AI, so speed and depth of grounding matter; (b) the boring table-stakes (intake, compliance, committee workflow) are what make a TTO actually deploy. The credibility/eval layer is what keeps the moat from eroding.

---

## Appendix A — Verified findings & sources

| # | Finding | Confidence | Vote | Key sources |
|---|---|---|---|---|
| 1 | Wellspring is the dominant incumbent; Evolve (ex-Sophia) is a 30+ module end-to-end TTO/IP suite; founded 2003; top-10 IP-software vendor. | HIGH | 3-0 | wellspring.com/evolve, /products/technology-transfer; SourceForge; Capterra; Fortune Business Insights |
| 2 | Evolve includes AI/automation (agreement-term extraction), marketed as "far ahead of anything else." | HIGH | 3-0 | wellspring.com/evolve, /products/technology-transfer |
| 3 | Inteum (Minuet): 400+ institutions; native iEdison/Bayh-Dole compliance; added assistive AI for document summaries. | HIGH | 3-0 | inteum.com, /minuet/, /news/new-feature-ai-document-summaries-in-minuet/ |
| 4 | IN-PART Connect: human-curated matchmaking (250+ institutions, 6,000+ companies); an introduction tool, not assessment. | HIGH | 3-0 | in-part.com/connect, /faq |
| 5 | Tradespace: leading AI/ML commercialization tool (candidate identification, partner discovery); 20M contacts, $100M deals marketed. | HIGH | 3-0 | tradespace.io/platform, /commercialize |
| 6 | **DIFFERENTIATION GAP:** no surveyed tool offers TRL/IRL scoring, TAM/SAM/SOM, pitch-deck generation, or source grounding. | HIGH | 3-0 | tradespace.io; wellspring.com; in-part.com (absence across all) |
| 7 | Traditional TRLs are inadequate for AI; a model can reach TRL 7 yet fail on out-of-distribution inputs. | HIGH | 3-0 | arxiv.org/html/2506.11001v1; nature.com/articles/s41467-022-33128-9 |
| 8 | IP-management software market ≈ USD 15B (2026), ~11.5–13.2% CAGR. | MEDIUM | 3-0 | mordorintelligence.com; straitsresearch.com (+ corroborating firms) |

## Appendix B — Refuted claims (killed in verification, do NOT cite)

- "Wellspring is used by over 200 leading universities/research organizations" — **0-3 refuted** (SourceForge).
- "Wellspring/Sophia used by over 200 leading research organizations" — **0-3 refuted** (Capterra).
- "IP management software was USD 11.41B in 2025 → USD 34.88B by 2034" — **0-3 refuted** (Straits).
- "IP software USD 14.06B (2025) → USD 42.53B (2034), 13.09% CAGR" — **1-2 refuted** (Fortune Business Insights).
- "IP software USD 16.53B (2026) → USD 44.79B (2033), 15.3% CAGR" — **0-3 refuted** (Coherent Market Insights).
- "IP software market USD 9.33B over 2026–2030, 19.7% CAGR" — **0-3 refuted** (Technavio).

## Appendix C — Confidence summary

- **HIGH:** product capabilities and the differentiation gap (primary vendor pages + academic sources, mostly unanimous 3-0 votes).
- **MEDIUM:** market size / CAGR (secondary syndicated forecasts, paywalled methodology, wide base-year spread, 6 sibling claims refuted).
- **UNKNOWN:** TTO budgets and buying process; capabilities of IRIS/Bayh-Dole Central, TechTracS, Flintbox, Tenderwell, Konfer.

The differentiation gap is an absence-of-feature finding based on 2025–2026 public product pages; vendors are actively adding AI, so it is time-sensitive and could narrow.
