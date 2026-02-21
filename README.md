# Epstein Financial Forensics

**Automated forensic financial reconstruction from 1.48 million DOJ EFTA documents + 503K cataloged media items**

[![License: CC BY 4.0](https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)

---

## What This Is

This repository contains the methodology, findings, and documentation for a computational forensic analysis of the U.S. Department of Justice's Epstein Files Transparency Act (EFTA) corpus — the largest such analysis by file volume and analytical depth in the public domain.

The project applies professional financial auditing methodology to reconstruct fund flows, map entity networks, and quantify what the DOJ's document release reveals (and conceals) about the financial infrastructure surrounding Jeffrey Epstein.

---

## The Database

| Metric | This Project | Largest Narrative Repo | Largest Search Platform | Others |
|--------|:------------:|:----------------------:|:----------------------:|:------:|
| **Total files indexed** | **1,476,377** + 503K media | 1,380,937 | 1,120,000 | < 20,000 |
| **Datasets covered** | **19** (DS1-12 + DS98-104) | 12 | 12 | 1-3 |
| **Extracted text records** | **1.48M+** | 993,406 pages | — | — |
| **Entity extraction (NLP)** | **11.4M entities** | ~4,000 curated | 1,589 manual | < 500 |
| **Unique persons identified** | **734,122** | 1,536 registry | 1,589 | — |
| **Financial transactions modeled** | **81,451** (5B) + **23,832** (5C directional) | ~1,489 narrative | 0 | 0 |
| **Directional fund flows (A→B)** | **23,832** | qualitative | 0 | 0 |
| **Relational database tables** | **28+** | 3-4 | — | — |
| **Confidence-tiered scoring** | ✅ 5-axis | — | — | — |
| **Redaction proximity analysis** | ✅ | ✅ (different method) | — | — |
| **SAR cross-validation** | ✅ | — | — | — |
| **Senate-ready output format** | ✅ SSFS-aligned | — | — | — |

> **Note:** The largest narrative repo's 1,380,937 figure counts individual *pages* as records; their unique PDF file count is ~519,548. Our 1,476,377 are unique files each with a distinct DOJ URL or registered serial, plus 503,154 separately cataloged media items from DS10 evidence photos and videos. Multiple projects in this space are doing valuable, complementary work — narrative forensic reporting, searchable archives, community preservation. This project's lane is systematic financial reconstruction at scale.

---

## Database Schema (28+ Tables)

This is not a search index. This is a relational forensic database.

**Financial Analysis**
- `fund_flows` — 23,832 directional money movements (entity_from → entity_to, amount, date, confidence)
- `fincen_transactions` — FinCEN SAR data cross-referenced against corpus
- `fincen_bank_connections` — Bank relationship mapping from regulatory filings
- `financial_hits` — Raw financial content extraction markers
- `financial_redactions` — Redacted financial content specifically tracked

**Entity Intelligence**
- `entities` — 11.4M extracted entities with NLP classification (PERSON, ORG, GPE)
- `poi_rankings` — Persons of interest scored by multi-axis corpus frequency
- `evidence_index` — Evidentiary chain linking across documents

**Redaction Analysis**
- `redaction_recovery` — Content recovered from under redaction overlays
- `redaction_markers` — Systematic redaction position tracking
- `redaction_summary` — Aggregated redaction analysis per document

**Corpus Infrastructure**
- `files` — 1,476,377 file records with metadata, classification, dates
- `dates_found` — Temporal mapping across entire corpus
- `media_evidence` — DS10 image/video catalog (503K images + 874 videos)

**External Cross-Reference**
- `faa_master`, `faa_engine`, `faa_acftref` — FAA aircraft registry for flight tracking
- `icij_entities`, `icij_officers`, `icij_relationships` — ICIJ Offshore Leaks for shell company cross-referencing

---

## Pipeline Architecture

```
Phase 1    DOJ EFTA Scraper + Community Gap-Fill → 1.48M files + 503K media registered
Phase 2    Download & Verify → local corpus with integrity checks
Phase 3    Extract, Classify & Enrich → text, doc types, dates
Phase 3B   Entity Extraction (spaCy NLP) → 11.4M entities, 734K persons
Phase 5A   Person-of-Interest Network → news-filtered, multi-source scoring
Phase 5B   Operational Cost Model → confidence-tiered financial extraction
Phase 5C   Entity-to-Entity Fund Flows → directional A→B with 5-axis scoring
Phase 5D   Payment-Travel-Victim Correlation → temporal pattern analysis
Phase 5E   Redaction Map → congressional navigation tool
Phase 6    DOJ 303 Names Cross-Reference → scoring politically exposed persons
Phase 7    Redaction Inference Engine → cross-corpus context recovery
```

---

## Financial Methodology: 5-Axis Forensic Scoring

Every financial record is independently scored across five axes:

| Axis | Weight | What It Measures |
|------|:------:|-----------------|
| Context Language | ×3 | Transaction vocabulary (wire, routing, SWIFT) vs. noise (lawsuit, net worth) |
| Amount Specificity | ×1 | $2,473,891.55 scores high; $10,000,000.00 exactly scores low |
| Date Presence | ×1 | Full date > year only > no date |
| Entity Quality | ×2 | 28 known banks, 64 financial actors, 71+ garbage entity exclusions |
| Source Document Type | ×1 | Financial/spreadsheet > email > general document |

**Classification Tiers:**
- **PROVEN** (≥12): Bank statement language, multi-axis confirmation, ctx_txn ≥ 2
- **STRONG** (8-11): Good signals, minor gaps
- **MODERATE** (5-7): Mixed signals
- **WEAK** / **VERY_WEAK** / **REJECT**: Insufficient evidence or known noise

**Validation:** v6.2 spot-check achieved 93% accuracy on top-30 PROVEN transactions (28/30), with 0% balance contamination (down from 47% in v5). v6.2 adds OCR fuzzy balance detection and securities table exclusion.

---

## Key Findings

> ⚠️ **All findings are navigational tools derived from automated extraction. They have not been independently verified and should not be treated as established fact. (Unverified) tags apply throughout. See [METHODOLOGY.md](methodology/METHODOLOGY.md) for full disclaimers.**

### Finding 001: Fund Flow Network Topology

**Preliminary indicators from v6.2 fund flow audit (February 20, 2026):**
- PROVEN-tier transactions: 322 deduped / **$257,975,202**
- STRONG-tier transactions: 2,851 deduped / **$1,168,468,518**
- Combined bank-backed (P+S): **$733,202,104** — representing **39.0%** of $1.878B SAR benchmark
- Internal network flows (trust-to-trust, beyond SARs): **$612,320,339**
- Combined forensic total (P+S): **$1,426,443,720**

**SAR Benchmark** (public record, independently verified):
| Bank | Reported SARs |
|------|:------------:|
| JPMorgan Chase | ~$1.1B (4,700+ transactions) |
| Deutsche Bank | ~$400M |
| Bank of New York Mellon | ~$378M |
| **Total known SARs** | **$1.878B** |

*Sources: U.S. Senate Permanent Subcommittee on Investigations; NYDFS Consent Order (2020); JPMorgan USVI Settlement (2023)*

---

## What Makes This Different

**We didn't read the documents. We audited the money.**

Other projects in this space build search engines, write narrative reports, or create browsable archives. All valuable work. This project applies the same methodology used in professional public-sector financial auditing — multi-affiliate reconciliation, exception reporting, variance analysis, confidence tiering — to computationally reconstruct the financial infrastructure visible in the EFTA corpus.

The question we answer isn't "what do the documents say?" It's: **"Where did the money go, who moved it, and what did the DOJ redact around it?"**

---

## Author

**Randall Scott Taylor**
Director of Finance Administration, large municipal government agency
BS Network & Cyber Security, Wilmington University
MS Applied Data Science, Syracuse University

Professional background in multi-affiliate financial reconciliation, budget auditing, and large-scale fiscal operations. Builds automated classification and exception reporting systems for institutional financial data. This project applies the same methodology used in professional public-sector financial auditing to the EFTA corpus.

---

## Ethical Standards

- **Victim protection**: No victim names, identifying details, or testimony content is stored, published, or extractable from any output. Victim-adjacent redactions are noted by proximity only.
- **SSFS alignment**: All outputs include frozen Row 1 caveats, (Unverified) column tags, and navigational-tool disclaimers consistent with professional auditing standards.
- **No attribution of guilt**: Financial flows are documented as they appear in DOJ documents. Appearance in this database does not imply wrongdoing.
- **Open methodology**: Every extraction rule, scoring weight, and classification threshold is documented and reproducible.

---

## Citation

```
Taylor, R.S. (2026). Epstein Financial Forensics: Automated forensic financial
reconstruction from 1.48 million DOJ EFTA documents. GitHub.
https://github.com/randallscott25-star/epstein-forensic-finance
```

---

## License

This work is licensed under [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/).

The underlying DOJ documents are U.S. government publications in the public domain. This repository contains only metadata, extracted analysis, and methodology — no copyrighted source material is reproduced.

---

## Project Timeline

| Date | Milestone |
|------|-----------|
| Feb 7, 2026 | Project started — DOJ scraper built, first dataset indexed |
| Feb 8 | DS11 (76,969 financial ledgers) fully scraped |
| Feb 10 | 633,842 files indexed — published to GitHub and Archive.org |
| Feb 12 | Phase 3 text extraction complete (513K files) |
| Feb 14 | Entity extraction (3B) launched — 565K files queued |
| Feb 15 | Corpus expanded to 1.48M files + 503K media with DS10 + community gap-fill |
| Feb 16 | Phase 5 financial analysis chain operational |
| Feb 18 | Barton letter sent to U.S. Senate |
| Feb 18 | 19 datasets online (DS1-12 + DS98-DS104) |
| Feb 20 | Fund flows audit v6.2: $1.43B in P+S transactions, 39% SAR coverage confirmed |
| Ongoing | Full pipeline re-run with expanded corpus and refined scoring |

---

*200+ paired hours. 70+ sessions. Built from scratch.*
*For the girls.*
