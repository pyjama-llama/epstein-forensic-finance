# Financial Classification System

## Overview

The financial classification engine scans extracted text for dollar amounts and classifies each into one of 18 categories using keyword proximity matching. A three-tier confidence model separates court-confirmed amounts from inferred values, and deduplication logic prevents double-counting.

## Classification Categories

| # | Category | Example Keywords |
|---|----------|-----------------|
| 1 | Wire Transfer | wire, transfer, remittance, SWIFT, routing |
| 2 | Shell Corporation | offshore, nominee, bearer shares, registered agent |
| 3 | Real Estate | property, deed, mortgage, closing, title |
| 4 | Aviation | aircraft, charter, tail number, FBO, hangar |
| 5 | Legal Fees | retainer, attorney fees, legal services, settlement |
| 6 | Trust/Estate | trust, beneficiary, estate, fiduciary, probate |
| 7 | Insurance | premium, policy, underwriting, Lloyd's |
| 8 | Investment | portfolio, securities, hedge fund, dividend |
| 9 | Banking | account, deposit, withdrawal, statement, balance |
| 10 | Payroll | salary, compensation, paycheck, W-2 |
| 11 | Donation/Grant | donation, philanthropy, foundation, grant |
| 12 | Travel/Hospitality | hotel, travel, booking, charter, resort |
| 13 | Art/Luxury | auction, gallery, jewelry, yacht, collectible |
| 14 | Medical | medical, physician, treatment, hospital |
| 15 | Education | tuition, university, scholarship, school |
| 16 | Government/Tax | IRS, tax, levy, assessment, penalty |
| 17 | Victim/Trafficking | victim, minor, payment to, settlement, NDA |
| 18 | Other/Unclassified | Amounts not matching any category keywords |

The full keyword set contains 885 terms developed iteratively through corpus analysis. Keywords are matched within a proximity window around each detected dollar amount.

## Dollar Detection

Dollar amounts are extracted via regex pattern matching:

- Standard formats: `$1,000.00`, `$1000`, `$1,000`
- Written amounts: `one million dollars`, `$1M`, `$500K`
- Range filtering: amounts below $100 or above $50,000,000 are excluded as likely OCR errors or non-financial references

## Confidence Tiers

Each classified transaction receives a confidence tier:

**Tier 1 — Court-Confirmed**
Amounts appearing in DB-SDNY (Southern District of New York) court filings, plea agreements, or sentencing documents. These have been verified through judicial proceedings.

**Tier 2 — Dataset-Sourced**
Amounts found in primary source documents (financial records, bank statements, invoices, contracts) with supporting contextual evidence in the surrounding text.

**Tier 3 — Entity-Matched**
Amounts attributed through entity co-occurrence — a known person's name appears near a dollar amount in a document, but the document itself is not a primary financial record (e.g., deposition testimony, correspondence referencing payments).

## Deduplication

The same dollar amount may appear in multiple documents (e.g., a wire transfer referenced in both the bank statement and a court filing). The deduplication logic:

1. Groups transactions by amount, entity pair, and date (when available)
2. Within each group, retains the highest-confidence tier
3. Removes lower-tier duplicates

This prevents a single $500,000 wire transfer from being counted three times across a bank record (T2), a deposition (T3), and a court filing (T1). Only the T1 entry survives.

## SAR Coverage Analysis

Classified transactions are cross-referenced against known Suspicious Activity Report (SAR) filings:

- JPMorgan Chase: $1.1B in SARs filed
- Deutsche Bank: $400M in SARs filed  
- Bank of New York Mellon: $378M in SARs filed

Coverage is calculated as the percentage of classified transactions that fall within documented SAR filing ranges. The gap between total classified value and SAR coverage represents potentially unreported suspicious activity.

Current metrics: 59.2% SAR coverage, $322M unclassified gap.

## False Positive Filtering

Multiple layers prevent contamination:

- **OCR artifact exclusion** — malformed dollar amounts from poor scan quality
- **News article filtering** — dollar amounts in media coverage are downweighted
- **Boilerplate exclusion** — standard legal fee schedules, filing fees, bond amounts
- **Account mask detection** — bank statement XXXXX patterns separated from redaction markers
- **Geographic false positives** — dollar amounts that are actually addresses, phone numbers, or case numbers

## Output

The financial classification produces:

- Transaction-level table with amount, category, confidence tier, source file, and surrounding text context
- Category summary with tier breakdown and SAR coverage percentages
- Entity-level aggregation showing total classified value per person/organization
- Fund flow records linking payer to payee with directional amounts

Total: 24,623 classified transactions, $1,102,152,148 across all tiers.
