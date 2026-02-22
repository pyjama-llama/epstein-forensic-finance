# The Infrastructure of Access

**The people who moved the money are the same people victims named.**

*This analysis documents entity co-occurrence across 1.48 million DOJ EFTA files. It does not reproduce victim testimony, identify survivors, or attribute guilt. All findings are automated extractions. See [COMPLIANCE.md](../COMPLIANCE.md) for professional standards framework.*

---

## Summary

I searched 11.4 million entity records across 1.48 million DOJ documents for people who appear in three distinct document categories: financial records (wire transfers, bank statements, account documents), victim-related documents (court filings naming Jane Doe plaintiffs, FBI trafficking investigations, victim impact statements), and travel records (flight logs, itineraries, passenger manifests).

Ten names were tested. Every one of them appeared in victim-related documents. Several appeared in all three categories simultaneously. The financial infrastructure and the abuse infrastructure were not separate systems. They shared personnel.

## The Data

Entity co-occurrence was measured by counting the number of unique files in which each name appears, filtered by document type and content classification. The underlying data is the `entities` table (11.4 million rows) joined against the `files` table (1.48 million rows) with document type and summary text filtering.

**Document categories:**
- **Financial**: doc_type = financial, spreadsheet, bank_statement; or summary contains wire, payment, account, check, invoice
- **Victim-related**: doc_type = police_report, court_filing; or summary contains victim, abuse, minor, massage, trafficking, Jane Doe
- **Travel**: doc_type = flight_log

## The Table

| Name | Role (Public Record) | Financial Docs | Victim Docs | Flight Docs | Total Corpus Files |
|------|---------------------|---------------|-------------|-------------|-------------------|
| **Ghislaine Maxwell** | Co-conspirator (convicted) | **204** | **1,312** | **53** | 6,145 |
| **Darren Indyke** | Estate attorney | **196** | **204** | **176** | 8,381 |
| **Lesley Groff** | Executive assistant | **134** | **153** | **20** | 73,144 |
| **Sarah Kellen** | Assistant / scheduler | 5 | **132** | 4 | 247 |
| **Alfredo Rodriguez** | Household staff (testified) | 6 | **128** | 1 | 253 |
| **Jean-Luc Brunel** | MC2 modeling agency | 14 | **120** | 4 | 1,896 |
| **Larry Visoski** | Pilot | **99** | 76 | **249** | 11,035 |
| **Juan Alessi** | Household staff (testified) | 0 | **61** | 2 | 125 |
| **Nadia Marcinkova** | Named by victims | 0 | **35** | 0 | 66 |
| **George Nader** | Convicted (child exploitation) | 11 | 11 | 0 | 68 |

## What the Numbers Mean

**Ghislaine Maxwell** appears in 204 financial documents and 1,312 victim-related documents. She is the only person in this analysis who occupies the center of all three document universes at scale — financial (204), victim (1,312), and travel (53). She was convicted in 2021 on five federal charges including sex trafficking of a minor.

**Darren K. Indyke** appears in 196 financial documents, 204 victim-related documents, and 176 flight documents. He is the estate attorney who signed wire transfers on behalf of Epstein's trust entities. He appears on 5 verified wire transfers in the master ledger totaling $7.6 million. His name appears in victim-related documents because he is named in civil proceedings filed by Jane Doe plaintiffs against the Epstein estate — proceedings in which Southern Trust Company, which received $151.5 million in wire transfers (Exhibit A), is a named defendant.

**Lesley Groff** appears in 134 financial documents and 153 victim-related documents. She was Epstein's executive assistant who managed scheduling. Documents in the EFTA corpus place her name alongside victim references including "Jane Doe" (EFTA00446172), "Victim Payouts" (EFTA00371439), and "the Federal Crime Victims Rights Act" (EFTA00429909).

**Sarah Kellen** appears in 132 victim-related documents. Victims identified her as a scheduler who arranged their visits. Her financial footprint is small (5 documents), consistent with an operational role rather than a financial one.

**Larry Visoski** appears in 249 flight documents and 99 financial documents. He was Epstein's primary pilot. His victim-document presence (76 files) reflects his naming in depositions and legal proceedings where victims described travel to Epstein properties.

## The Co-Occurrence Documents

When a single document contains BOTH an operational name AND victim/trafficking language, that is a co-occurrence. These are not separate references in separate files — they are the same document discussing the same subject.

Selected examples from 50 co-occurrence documents identified:

| Document | Type | Operational Names | Victim References |
|----------|------|-------------------|-------------------|
| EFTA00023049 | document | Maxwell | Minor, Minor Victim-3 |
| EFTA00065479 | email | Ghislaine Maxwell, Groff | Trafficking Victims Protection Act |
| EFTA00073465 | court filing | Ghislaine Maxwell | Crime Victims' Rights Act, Victim Notification System |
| EFTA00173201 | document | Leslie Groff, Ghislaine Maxwell | Jeffrey Epstein-Victim, Sex Trafficking |
| EFTA00371439 | email | Groff | Victim Payouts |
| EFTA00429909 | email | Lesley Groff | Federal Crime Victims Rights Act |
| EFTA00446172 | email | Lesley Groff | Jane Doe |
| EFTA00067267 | subpoena | Sarah Kellen | Victim |
| EFTA00261508 | document | Maxwell | VICTIM |
| EFTA00313632 | court filing | Ghislaine Maxwell | Plaintiff Jane Doe |

These documents span the investigative lifecycle: FBI emails referencing "Crimes Against Children/Human Trafficking" alongside Maxwell's name, court filings where Jane Doe plaintiffs name operational staff, and victim impact statements that reference the same individuals who appear on financial records.

## The Financial Thread

The operational staff did not merely appear alongside victim references in legal proceedings. Several of them are directly connected to the wire transfer infrastructure documented in the [master wire ledger](../data/master_wire_ledger_phase25.json):

**Darren Indyke** — Named on 5 verified wire transfers:
- Received $5.8 million from Deutsche Bank (5 wires, Exhibit C)
- Co-signed $1.2 million in transfers with Michelle Saipher to Epstein's NOW/SuperNow account
- Named as estate attorney on Southern Trust Company — the entity that received $151.5 million (Exhibit A)

**Ghislaine Maxwell** — NES LLC, an entity linked to Maxwell, received $554,000 through the shell network (Narrative 4: Chain-Hop Anatomy). Maxwell appears in 204 financial documents spanning bank records, trust administration, and property transactions.

**Lesley Groff** — Appears in 134 financial documents. While not directly on wire transfers, her presence in financial records alongside her 153 victim-document appearances places her at the intersection of the money and the harm.

**Richard Kahn** — The attorney appears in 110 financial documents and 28 flight documents. He received $9.3 million through the wire transfer network for disbursement to third parties including Paul Morris.

## The Three-Circle Pattern

The EFTA corpus is not one collection of documents. It is at minimum three overlapping collections:

1. **Financial records**: Bank statements, wire confirmations, trust documents, account records
2. **Victim records**: Police reports, court filings, FBI investigations, victim impact statements, Jane Doe lawsuits
3. **Travel records**: Flight logs, itineraries, APIS passenger manifests, aircraft purchase agreements

Most people in the corpus appear in one circle. Victims appear in victim records. Bankers appear in financial records. Pilots appear in travel records.

The operational staff — Maxwell, Indyke, Groff, Kellen, Visoski — appear in all three. They are the connective tissue. The same names managing the money appear in the documents where victims describe what happened to them.

This is not a finding about guilt. It is a finding about structure. The financial infrastructure documented in Narratives 1–7 was not a separate system from the abuse infrastructure documented in victim testimony. They shared the same people.

## What I Cannot Determine

- **Whether any specific wire transfer funded any specific act of abuse.** The temporal and personnel overlap is documented. The causal chain is not.
- **What victims experienced.** This analysis does not access, reproduce, or summarize victim testimony. It measures entity co-occurrence at the document level only.
- **Whether operational staff knew the purpose of the financial transfers they facilitated.** Indyke signing a wire transfer is a legal act. Whether he knew where the money ultimately went is a question for investigators, not forensic accountants.
- **Whether all co-occurrences are meaningful.** Maxwell appearing in a court filing alongside "Jane Doe" may reflect a lawsuit naming both — it does not necessarily mean a direct interaction. The co-occurrence is structural, not necessarily evidentiary.
- **The full scope of the operational network.** This analysis tested 10 names. The EFTA corpus contains 734,122 unique persons. The operational network may be larger than what is measured here.

---

*Source: DOJ EFTA Document Release — 11.4 million entity records across 1.48 million files. Entity co-occurrence measured by unique file count per document category. Wire transfer data from Deutsche Bank-SDNY Production (Exhibits A–E), 185 verified wires. Document type classifications from automated pipeline with manual validation. This analysis is published as part of the [Epstein Financial Forensics](https://github.com/randallscott25-star/epstein-forensic-finance) repository.*

*For the girls.*
