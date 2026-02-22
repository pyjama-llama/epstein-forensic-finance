# Data Narratives

**The financial data tells stories that numbers alone cannot convey.**

These narratives trace fund flow patterns, entity relationships, temporal correlations, and forensic accounting anomalies identified across the 1.48 million documents in the DOJ EFTA release. Early narratives are grounded in wire-level data from the [master wire ledger](../data/master_wire_ledger_phase25.json). Later narratives draw on the full corpus: 11.4 million entity extractions, 734,122 unique persons, 2.4 million dates, and 321 aircraft flight records. Each finding is extracted through the [25-phase pipeline](../docs/METHODOLOGY.md) and cross-referenced against court exhibits where available.

All amounts are **(Unverified)** automated extractions. These are not audit findings — they are data observations. See [COMPLIANCE.md](../docs/COMPLIANCE.md) for the professional standards framework governing this analysis.

---

## Published Narratives

| # | Title | Key Finding | Data Scope |
|---|-------|-------------|------------|
| 1 | [The Jeepers Pipeline](01_jeepers_pipeline.md) | $57.9M brokerage shell → personal checking, all dated, all on Exhibit C | 24 wires · $57,876,640 |
| 2 | [Art Market as Liquidity Channel](02_art_market.md) | Sotheby's + Christie's proceeds entered the shell network through Haze Trust | 20 wires · $103,786,473 |
| 3 | [The Plan D Question](03_plan_d_question.md) | $18M out to Leon Black, near-zero inflow — where did Plan D get its money? | 34 wires · $163,097,604 |
| 4 | [Chain-Hop Anatomy](04_chain_hop_anatomy.md) | 4-tier shell network mapped — and $311M in double-counting removed | 67 wires · $312,796,381 |
| 5 | [Deutsche Bank's Role](05_deutsche_bank.md) | 38 wires across every major Epstein entity, 75% of volume in last 6 months | 38 wires · $56,792,936 |
| 6 | [Gratitude America](06_gratitude_america.md) | 88% of outflows to investment accounts, 7% to charitable purposes | 20 wires · $13,080,518 |
| 7 | [Follow the Money, Follow the Plane](07_follow_the_money_follow_the_plane.md) | Wire-flight temporal correlation at 4.3× random chance; $169M near St. Thomas flights | 185 wires · 321 flights · $575M |
| 8 | [The Infrastructure of Access](08_infrastructure_of_access.md) | The people who moved the money are the same people victims named — Maxwell in 204 financial docs and 1,312 victim docs | 11.4M entities · 1.48M files |
| 9 | [734,122 Names](09_734122_names.md) | Asked every person in 1.48M files who bridges financial and victim docs. 57 real names. 10 operational staff. No one hiding who hasn't been found | 734,122 persons · 57 bridgers |
| 10 | [The Round Number Problem](10_the_round_number_problem.md) | Benford's Law fails: digits 2 and 5 at 29.7% and 18.4%. 84.3% of wires are exact round numbers. One decision-maker, not a market | 185 wires · $557M |
| 11 | [The Shell Map](11_the_shell_map.md) | Wire ledger captured 7 entities. The corpus contains 14 — with 178,000 money references. Four shells with 23,922 money mentions never appeared in a single wire | 14 shells · 178K money refs |

---


## Interactive Visualizations

| Visualization | Description |
|--------------|-------------|
| <a href="https://randallscott25-star.github.io/epstein-forensic-finance/visualizations/shell_network.html" target="_blank">Shell Network — Full Architecture</a> | Interactive map of all 14 shell entities and 12 banking institutions. Click nodes for detail. Filter by co-occurrence, bank relationships, or wire ledger. |

---

## How to Read These

Each narrative follows the same structure:

- **Summary** — what I found, in plain language
- **The Data** — tables, counts, and measurements drawn from the source material
- **What the Pattern Shows** — the story the data tells
- **What I Cannot Determine** — the limits of what this analysis can prove

The first six narratives trace wire transfer patterns through Epstein's shell network. Narratives 7–10 expand the aperture: flight correlations, entity co-occurrence across 11.4 million records, full-corpus person scans, and forensic accounting tests. The methodology scales with the questions.

The source workbook containing all exhibits referenced in these narratives is available here: **<a href="https://docs.google.com/spreadsheets/d/11lw0QjMZ-rYIjWesv5VG1YKts57ahPEm/edit?usp=sharing&ouid=103970896670138914877&rtpof=true&sd=true" target="_blank">Forensic Workbook (Google Sheets)</a>** (view-only).

I report what the data shows. Interpretation of intent, legality, or business purpose is left to qualified investigators, regulators, and readers.

---

*Randall Scott Taylor — Director of Finance Administration, BS Network & Cyber Security (Wilmington University), MS Applied Data Science (Syracuse University). February 2026.*
