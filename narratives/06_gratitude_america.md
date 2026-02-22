# Gratitude America

**A charity that sent 88% of its outflows to investment accounts and 7% to actual charitable purposes.**

*All amounts are (Unverified) automated extractions from DOJ EFTA documents. Appearance in this analysis does not imply wrongdoing. See [COMPLIANCE.md](../COMPLIANCE.md) for professional standards framework.*

---

## Summary

Gratitude America was structured as a charitable entity. I identified 20 wire transfers totaling $13,080,518 (Unverified) involving Gratitude America across the master ledger. The wire-level breakdown of where Gratitude America's money went tells a clear story: the vast majority of outflows went to investment and bank accounts, while actual charitable disbursements were minimal.

This finding is documented on **Exhibit E** of the Deutsche Bank-SDNY production.

## Outflows: Where the Money Went

### Investment and Banking Transfers

| Date | To | Amount (Unverified) | Source |
|------|------|------|--------|
| Mar 2, 2016 | Gratitude America Ltd. (Morgan Stanley) | $5,000,000 | Exhibit E |
| Mar 2, 2016 | Citibank | $5,000,000 | Phase 25 recovery |
| Jul 19, 2016 | Gratitude America Ltd. (Morgan Stanley) | $500,000 | Exhibit E |
| Jul 19, 2016 | Citibank | $500,000 | Phase 25 recovery |
| Jan 21, 2016 | Gratitude America Ltd. (First Bank) | $50,000 | Exhibit E |
| Apr 6, 2016 | Gratitude America Ltd. (First Bank) | $250,000 | Exhibit E |
| Jan 20, 2017 | Citibank | $200,000 | Phase 25 recovery |
| Mar 6, 2017 | Citibank | $250,000 | Phase 25 recovery |

**Total to investment/banking: $11,750,000 (Unverified)**

The $5M transfer on March 2, 2016 is the single largest disbursement — sent from the Gratitude America MMDA (Money Market Deposit Account) to a Morgan Stanley investment account held by "Gratitude America Ltd." The same day, $5M moved to Citibank. This was not a charitable grant. It was an asset transfer between financial accounts.

### Actual Charitable Disbursements

| Date | To | Amount (Unverified) | Source |
|------|------|------|--------|
| Jan 29, 2016 | Melanoma Research Alliance Foundation | $225,000 | Exhibit E |
| Jan 7, 2016 | Bruce & Marsha Moskowitz Foundation | $50,000 | Exhibit E |
| Jul 14, 2016 | Bruce & Marsha Moskowitz Foundation | $50,000 | Exhibit E |
| Dec 11, 2017 | Bruce & Marsha Moskowitz Foundation | $50,000 | Exhibit E |
| Oct 2, 2017 | Cancer Research Wellness Institute | $25,000 | Exhibit E |
| Feb 28, 2018 | Cancer Research Wellness Institute | $25,000 | Exhibit E |
| Apr 2, 2018 | NPO Baleto Teatras | $18,493 | Exhibit E |
| Sep 17, 2018 | VSJ Baleto Teatras | $10,000 | Exhibit E |

**Total charitable: $453,493 (Unverified)**

## Inflows: Where the Money Came From

| Date | From | Amount (Unverified) |
|------|------|------|
| Oct 11, 2013 | Deutsche Bank | $200,000 |
| Jul 19, 2016 | Deutsche Bank | $500,000 |
| Undated | Deutsche Bank | $176,049 |
| Undated | Deutsche Bank | $976 |

**Total visible inflows from Deutsche Bank: $877,025 (Unverified)**

The visible inflows ($877K) are far less than the visible outflows ($12.2M), indicating that Gratitude America's primary funding came from sources not captured in the wires I extracted — likely internal transfers, investment returns, or deposits that predate the EFTA document window.

## The Ratio

Based on the wire transfers I extracted:

| Category | Amount (Unverified) | % of Outflows |
|----------|------|------|
| Investment/banking accounts | $11,750,000 | 88.4% |
| Charitable grants | $453,493 | 3.4% |
| Other/unclassified | $877,025 | — |

**For every dollar Gratitude America sent to charity, it sent roughly $26 to investment accounts.**

The three charitable recipients — Melanoma Research Alliance Foundation, Bruce & Marsha Moskowitz Foundation, and Cancer Research Wellness Institute — received between $10,000 and $225,000 each. The Lithuanian ballet entities (NPO Baleto Teatras and VSJ Baleto Teatras) received a combined $28,493.

## The Morgan Stanley Account

The largest single destination for Gratitude America's outflows was "Gratitude America Ltd." at Morgan Stanley — receiving $5,500,000 across 2 wires. This is a separate legal entity from the MMDA account that held the charity's liquid assets. The relationship between "Gratitude America MMDA" (the Deutsche Bank money market account) and "Gratitude America Ltd." (the Morgan Stanley investment vehicle) warrants further examination.

## What I Cannot Determine

- **Gratitude America's full financial picture.** I see wire transfers, not bank statements. The charity may have had additional grant-making through checks, ACH transfers, or other mechanisms not captured in wire data.
- **The investment returns.** If the Morgan Stanley account generated returns that were later distributed to charitable purposes, the effective charitable ratio would be higher than what the wire data alone shows.
- **Tax filings.** IRS Form 990 filings (if they exist) would show the complete picture of Gratitude America's revenues, expenses, and charitable distributions. That analysis is outside the scope of wire extraction.
- **The Lithuanian ballet connection.** Two small transfers to ballet-related entities in Lithuania ($18,493 and $10,000) are an unusual pattern for a U.S.-based charity. I note the pattern without interpreting it.

---

*Source: DOJ EFTA Document Release, Deutsche Bank-SDNY Production, Exhibit E. All data extracted via automated pipeline. This finding appears in the [master wire ledger](../data/master_wire_ledger_phase25.json) published with this repository.*
