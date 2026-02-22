# Art Market as Liquidity Channel

**$18.9 million in auction proceeds entered the trust network through a single account — then dispersed across the shell structure.**

*All amounts are (Unverified) automated extractions from DOJ EFTA documents. Appearance in this analysis does not imply wrongdoing. See [COMPLIANCE.md](../COMPLIANCE.md) for professional standards framework.*

---

## Summary

The Haze Trust functioned as a collection point for art market proceeds before redistributing them through the broader Epstein shell network. I identified $18,974,417 (Unverified) in auction house proceeds flowing into The Haze Trust from Sotheby's and Christie's, followed by $49,727,941 (Unverified) in outflows from The Haze Trust to Southern Financial LLC and Southern Trust Company — the downstream entities in the 4-tier shell hierarchy.

This is documented on **Exhibit D** of the Deutsche Bank-SDNY production.

## Inflows: The Auction Houses

Two transactions brought art market proceeds into the Haze Trust:

| Date | From | Amount (Unverified) | Source |
|------|------|------|--------|
| Jun 19, 2017 | Christie's Inc. | $7,725,000 | Exhibit D |
| Oct 24, 2017 | Sotheby's | $11,249,417 | Exhibit D |

**Total auction inflows: $18,974,417 (Unverified)**

Both transactions deposited directly into The Haze Trust's checking account at Deutsche Bank. The timing — June and October 2017 — aligns with the major spring and fall auction seasons at both houses.

## Outflows: Into the Shell Network

Once inside the Haze Trust, money moved downstream to Southern Financial LLC and Southern Trust Company Inc. I identified 8 outbound transfers from The Haze Trust:

| Date | To | Amount (Unverified) | Source |
|------|------|------|--------|
| Jun 22, 2018 | Southern Financial LLC (Checking) | $9,000,000 | Exhibit D |
| Aug 20, 2018 | Southern Financial LLC (Checking) | $5,000,000 | Exhibit D |
| Sep 17, 2018 | Southern Financial LLC (DBAGNY) | $5,000,000 | Exhibit D |
| Sep 28, 2018 | Southern Financial LLC (Checking) | $8,000,000 | Exhibit D |
| Oct 1, 2018 | Southern Trust Company Inc. (Checking) | $10,000,000 | Exhibit D |
| Oct 24, 2018 | Southern Financial LLC (Checking) | $5,000,000 | Exhibit D |
| Dec 19, 2018 | Southern Financial LLC (Checking) | $5,000,000 | Exhibit D |
| Jan 10, 2019 | The Haze Trust (DBAGNY → Checking) | $2,727,941 | Exhibit D |

**Total outflows to Southern entities: $49,727,941 (Unverified)**

## Additional Haze Trust Inflows

Beyond the auction houses, the Haze Trust received transfers from Deutsche Bank that fed the same outflow pattern:

| Date | Amount (Unverified) | Source |
|------|------|--------|
| Jul 16, 2014 | $2,500,000 | Phase 25 recovery |
| Aug 20, 2018 | $5,000,000 | Phase 25 recovery |
| Sep 28, 2018 | $8,000,000 | Phase 25 recovery |
| Dec 13, 2018 | $58,328 | Phase 25 recovery |
| Jan 10, 2019 | $6,000,000 | Phase 25 recovery |
| Jan 10, 2019 | $2,727,941 | Phase 25 recovery |
| Feb 19, 2019 | $7,000,000 | Phase 25 recovery |

An additional $58,328 arrived from HSBC Bank Bermuda Limited on December 13, 2018 (Exhibit D) — the only non-Deutsche Bank source feeding the Haze Trust.

## What the Pattern Shows

The Haze Trust operated as a way-station. Art proceeds entered through an ostensibly legitimate channel — major auction houses with compliance departments — and then moved into the same Southern Trust / Southern Financial network that received money from every other major source in the Epstein financial structure.

The timing gap is notable: auction proceeds arrived in mid-to-late 2017, but the outflows to Southern entities didn't begin until June 2018. The money sat in the Haze Trust for approximately 8-12 months before redistribution.

The outflow amounts ($5M, $8M, $9M, $10M) are round numbers — consistent with deliberate transfer instructions rather than liquidation of specific positions.

## What I Cannot Determine

- **What art was sold.** The wire transfers identify amounts and auction houses but not specific lots, artists, or buyers.
- **Whether the art was legitimately acquired.** Provenance of the art itself is outside the scope of financial wire extraction.
- **Where the money went after Southern Financial / Southern Trust.** The downstream disbursements from these entities are tracked separately in the chain-hop analysis.
- **The $3,738,700 outflow to FINANCIAL_TRUST.** One additional Haze Trust outflow went to an entity classified as FINANCIAL_TRUST. I have limited context on this entity.

---

*Source: DOJ EFTA Document Release, Deutsche Bank-SDNY Production, Exhibit D. All data extracted via automated pipeline. Supporting data: [Forensic Workbook (view-only)](https://docs.google.com/spreadsheets/d/11lw0QjMZ-rYIjWesv5VG1YKts57ahPEm/edit?usp=sharing&ouid=103970896670138914877&rtpof=true&sd=true). This finding appears in the [master wire ledger](../data/master_wire_ledger_phase25.json) published with this repository.*
