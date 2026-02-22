# Chain-Hop Anatomy

**How money moved through the 4-tier trust network — and how I caught $311 million in inflation from counting the same dollar twice.**

*All amounts are (Unverified) automated extractions from DOJ EFTA documents. Appearance in this analysis does not imply wrongdoing. See [COMPLIANCE.md](../COMPLIANCE.md) for professional standards framework.*

---

## Summary

The Epstein financial network was built on a layered trust structure. Money entered through external sources (Leon Black, Benjamin de Rothschild, Tudor Futures Fund, Narrow Holdings, auction houses), passed through intermediate shells (The Haze Trust, Southern Trust Company, Southern Financial LLC), and ultimately reached operational entities or personal accounts. I mapped 67 wire transfers totaling $312,796,381 (Unverified) moving through this network.

The same structure that makes this network worth studying also makes it dangerous to count. A single $10 million wire that moves from an external source → Southern Trust → Southern Financial → Haze Trust → personal account is one $10 million transfer — but a naive extraction pipeline would count it as four separate $10 million transfers, inflating the total to $40 million. This is the chain-hop problem, and it is the single most important methodological challenge in this entire analysis.

## The 4-Tier Structure

Based on the flow patterns visible in the wire data:

**Tier 1 — Accumulation Layer**: Southern Trust Company Inc. received the largest inflows from external sources. 17 inbound wires totaling $151.5M (Unverified) from Black Family Partners, Leon & Debra Black, Narrow Holdings, Benjamin de Rothschild, Tudor Futures Fund, and Edmond de Rothschild (Suisse) SA.

**Tier 2 — Distribution Layer**: Southern Financial LLC received $32M (Unverified) from The Haze Trust and $14M from other sources. It also disbursed $4.1M across 9 outbound wires including payments to Joichi Ito, Coatue Enterprises, and Neoteny 3 LP.

**Tier 3 — Transit Layer**: The Haze Trust received art market proceeds and Deutsche Bank transfers, then moved money downstream to Southern Financial and Southern Trust. $49.7M out (Unverified), plus $3.7M to an entity classified as FINANCIAL_TRUST.

**Tier 4 — Operational Layer**: Entities like Butterfly Trust, Gratitude America, and personal accounts that received disbursements from the upper tiers.

## The Chain-Hop Problem

In Phase 22 of the extraction pipeline, I identified and removed $311 million in chain-hop inflation. Here is a simplified example of what that looks like:

```
External Source sends $10,000,000 → Southern Trust
Southern Trust sends $10,000,000 → Southern Financial  
Southern Financial sends $10,000,000 → Haze Trust
```

If I count every row, I get $30 million. But only $10 million actually entered the network. The other $20 million is the same dollar being moved between internal accounts.

I solved this by classifying every entity as EPSTEIN_ENTITY, EXTERNAL_PARTY, or BANK/CUSTODIAN, then filtering for transfers that crossed the boundary between external and internal. Shell-to-shell transfers (43 identified in the master ledger) are tracked separately and flagged with `is_shell_to_shell` — they are visible in the data but not double-counted in the headline total.

## Key Flow Paths

**The Black → Southern Trust → Disbursement path:**
$106.5M entered Southern Trust from Black-affiliated entities (Exhibit A). Southern Trust then disbursed to ITO ($10.3M across 5 wires), Leon Black ($8M), Debra Black ($8.5M), and others.

**The Auction → Haze Trust → Southern Financial path:**
$18.9M entered Haze Trust from Sotheby's and Christie's (Exhibit D). Haze Trust then sent $49.7M to Southern Financial and Southern Trust — meaning the Haze Trust also received funding from sources beyond the auction houses (primarily Deutsche Bank transfers).

**The Rothschild → Southern Trust path:**
Benjamin Edmond de Rothschild sent $15M (Exhibit A), and Edmond de Rothschild (Suisse) SA sent $10M (Exhibit A), both to Southern Trust Company.

**The Narrow Holdings path:**
Narrow Holdings LLC c/o Elysium Management sent $20M to Southern Trust (Exhibit A) — the single largest individual wire in this subset.

## Matching-Amount Detection

One method I used to identify potential chain-hops was looking for identical dollar amounts appearing across multiple entity pairs within the shell network. If $5,000,000 appears as Southern Trust → Southern Financial and also as Haze Trust → Southern Financial, it may be the same $5M moving through the network.

I did not automatically remove these matches. Each was reviewed in the context of dates (when available), source documents, and entity classifications before determining whether it was a legitimate separate transfer or a chain-hop duplicate.

## What I Cannot Determine

- **Complete flow paths end-to-end.** I can see individual wire segments, but the EFTA corpus does not always provide enough date precision to chain segment A → B → C → D into a single traced path.
- **Whether all shell-to-shell transfers are internal movements.** Some may represent genuine economic transactions between related-but-distinct legal entities.
- **The net economic reality.** Wire transfers show gross flows. Offsetting positions, returns of capital, and loan repayments would reduce the net amount but are not distinguishable from one-way transfers in the wire data alone.

---

*Source: DOJ EFTA Document Release, Deutsche Bank-SDNY Production, Exhibits A and D. Chain-hop removal methodology documented in [METHODOLOGY.md](../METHODOLOGY.md), Phase 22. Entity classifications and shell-to-shell flags are included in the [master wire ledger](../data/master_wire_ledger_phase25.json).*
