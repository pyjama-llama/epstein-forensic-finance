# The Jeepers Pipeline

**$57,876,640 through a brokerage shell into personal checking — all documented, all dated, all on one exhibit.**

*All amounts are (Unverified) automated extractions from DOJ EFTA documents. Appearance in this analysis does not imply wrongdoing. See [COMPLIANCE.md](../COMPLIANCE.md) for professional standards framework.*

---

## Summary

Jeepers Inc. was a Deutsche Bank brokerage entity that functioned as the primary capitalization vehicle for Jeffrey Epstein's personal NOW and SuperNow checking accounts. Between October 2013 and February 2019, I identified 24 wire transfers totaling $57,876,640 (Unverified) flowing from Jeepers Inc. through its Deutsche Bank brokerage account into Epstein's personal checking.

Every single wire is documented on **Exhibit C** of the Deutsche Bank-SDNY production: "Capitalization of Jeffrey Epstein's NOW/SuperNow Accounts." Every single wire has a bates stamp. Every single wire has a date. This is the highest-confidence finding in the entire analysis.

## The Pipeline

The mechanism was consistent across all 24 transfers: Jeepers Inc. held assets in a Deutsche Bank brokerage account, and periodically transferred large sums into Epstein's personal NOW/SuperNow checking accounts at the same bank. Three of the transfers moved money first from Jeepers Inc. (the entity) into the Jeepers Inc. DB Brokerage Account before the onward transfer — an internal staging step.

| Date | Amount (Unverified) | Bates Reference |
|------|------|------|
| Oct 11, 2013 | $3,000,000 | DB-SDNY-0002926 |
| Nov 14, 2013 | $2,000,000 | DB-SDNY-0002994 |
| Dec 20, 2013 | $2,000,000 | DB-SDNY-0003427 |
| Jan 30, 2014 | $2,000,000 | DB-SDNY-0003538 |
| Feb 20, 2014 | $4,000,000 | DB-SDNY-0003640 |
| Apr 11, 2014 | $3,400,000 | DB-SDNY-0003769 |
| May 6, 2014 | $2,000,000 | DB-SDNY-0003832 |
| Jun 11, 2014 | $3,000,000 | DB-SDNY-0003896 |
| Jul 16, 2014 | $2,000,000 | DB-SDNY-0003960 |
| Aug 19, 2014 | $2,500,000 | DB-SDNY-0004022 |
| Oct 2, 2014 | $2,500,000 | DB-SDNY-0004126 |
| Jan 5, 2015 | $2,500,000 | DB-SDNY-0004296 |
| Mar 13, 2015 | $2,000,000 | DB-SDNY-0004431 |
| Mar 27, 2015 | $2,000,000 | DB-SDNY-0004432 |
| Apr 16, 2015 | $2,000,000 | DB-SDNY-0004509 |
| May 18, 2015 | $2,000,000 | DB-SDNY-0004587 |
| Jun 12, 2015 | $2,000,000 | DB-SDNY-0004665 |
| Jul 9, 2015 | $3,200,000 | DB-SDNY-0004736 |
| Aug 20, 2015 | $2,000,000 | DB-SDNY-0004807 |
| Oct 7, 2015 | $2,000,000 | DB-SDNY-0004937 |
| Oct 29, 2015 | $2,500,000 | DB-SDNY-0004938 |
| Sep 9, 2016 | $2,000,000 | DB-SDNY-0005683 |
| Oct 26, 2016 | $2,000,000 | DB-SDNY-0005748 |
| Feb 7, 2019 | $3,276,640 | DB-SDNY-0008016 |

**Total: $57,876,640 (Unverified) across 24 wires.**

## What the Pattern Shows

The cadence tells a story. From October 2013 through October 2015, transfers arrived like clockwork — monthly or near-monthly, in round amounts between $2M and $4M. This is consistent with systematic liquidation of brokerage positions to fund operating expenses through the checking accounts.

The bates numbers are sequential (DB-SDNY-0002926 through DB-SDNY-0008016), confirming these were produced as a coherent set from Deutsche Bank's records. The sequential bates stamps also confirm there are no gaps in the exhibit — I captured every wire on Exhibit C that involved Jeepers Inc.

After October 2015, the cadence slows dramatically. Two transfers in late 2016, then nothing until a single $3,276,640 transfer on February 7, 2019 — five months before Epstein's arrest on July 6, 2019.

## What I Cannot Determine

This analysis traces the pipeline — money flowing from Jeepers Inc. brokerage into Epstein's personal checking. What I cannot determine from the EFTA corpus:

- **What funded Jeepers Inc.** The brokerage account was the intermediary, not the origin. The upstream source of these assets is not visible in the documents I extracted.
- **What the NOW/SuperNow accounts paid for.** The outbound spending from Epstein's personal checking is a separate question requiring different document analysis.
- **Whether Jeepers Inc. had other functions.** I only see the wire transfers. Jeepers may have held other positions or served other purposes within the financial network.

## OCR Note

Several bates stamps show OCR artifacts in entity names: "Jee ers Inc." appears in place of "Jeepers Inc." at DB-SDNY-0003427, 0004431, 0004432, 0004509, 0004587, 0005683. Entity normalization resolved these to the correct name. The amounts and dates were unaffected.

---

*Source: DOJ EFTA Document Release, Deutsche Bank-SDNY Production, Exhibit C. All data extracted via automated pipeline; no manual adjustments to amounts or dates. 24/24 entries dated (100%). Supporting data: [Forensic Workbook (view-only)](https://docs.google.com/spreadsheets/d/11lw0QjMZ-rYIjWesv5VG1YKts57ahPEm/edit?usp=sharing&ouid=103970896670138914877&rtpof=true&sd=true). This finding appears in the [master wire ledger](../data/master_wire_ledger_phase25.json) published with this repository.*
