# Pipeline Architecture

## Overview

The pipeline processes raw government PDFs from the DOJ EFTA corpus through seven phases: ingestion, download, extraction, entity recognition, financial classification, cross-referencing, and redaction analysis. All data persists in a single SQLite database with WAL mode enabling concurrent reads and writes.

## Phase 1 — Corpus Assembly

The DOJ published EFTA files across 12 datasets on justice.gov. Phase 1 indexes every file URL, EFTA serial number, dataset assignment, and file extension into the database.

Three supplementary ingestion passes fill gaps not captured by the primary index:

- **Phase 1C** integrates community-sourced torrent manifests and local disk files, registering serials not present on the DOJ website
- **Phase 1C-DS10** ingests the Volume 10 evidence photo/video load file (941K media serials)
- **Phase 1D** registers files from DS1-8 ZIP archives that were bundled but not individually listed on DOJ pages

Final corpus: 1,830,154 files across 14 datasets (DS1-DS11 plus DS98 FBI Vault FOIA and DS99 House Oversight estate documents).

## Phase 2 — Bulk Download

Parallel HTTP downloader with retry logic, rate limiting, and checksum verification. Files are stored locally with database tracking of download status, file size, and local path.

## Phase 3 — Text Extraction and Classification

Each file undergoes:

1. **Magic byte detection** — reads first 16 bytes to identify true file type regardless of extension
2. **Text extraction** — PyMuPDF native text layer for PDFs, Tesseract OCR fallback for scanned/image-only documents
3. **Document classification** — categorizes as flight log, court filing, deposition, financial record, correspondence, etc.
4. **Date extraction** — normalizes all date formats found in text, stores earliest and latest per document
5. **Metadata capture** — PDF creator, producer, author, creation/modification dates

Extraction rate: 99.998% success across the corpus.

## Phase 3B — Entity Extraction

Standalone background process using spaCy NLP. Extracts PERSON, ORG, GPE, MONEY, DATE, and other entity types from all extracted text. Runs concurrently with other phases via WAL mode.

Output: 11.4M+ entities, 734K unique persons.

## Phase 4 — Export

Packages selected datasets into portable SQLite files for delivery. Optional — used when producing self-contained deliverables.

## Phase 7 — Redaction Analysis

Identifies documents containing redaction markers and analyzes the relationship between redacted content and financial data. Stores results in the `redaction_recovery` and `redaction_summary` tables.

## Phase 7B — Disclosure Tier Classification

Classifies all recovered fragments into three publication tiers before any data enters the reporting pipeline:

| Tier | Label | Rule |
|------|-------|------|
| 1 | PUBLISH | Financial/institutional data with no unvetted person names |
| 2 | CONDITIONAL | Person names already publicly connected to the case |
| 3 | WITHHELD | Unknown person names — suppressed in all deliverables |

The whitelist for Tier 2 draws from three sources: known names from DOJ public disclosures, high-scoring persons of interest, and high-frequency entities appearing across multiple datasets. Tier 3 fragments display `[NAME WITHHELD]` in all outputs while raw data is preserved in the database for authorized review.

## Phase 5A — Person-of-Interest Network

Cross-references every PERSON entity against financial transactions, redaction proximity, flight/travel references, and file co-occurrence. Applies news/media filtering to prevent journalist and article byline contamination. Requires ≥2 non-news file appearances to qualify.

Scoring model weights: file count, dataset breadth, financial proximity, redaction proximity, flight references, and known-person flags. Output: ranked table of 2,000 persons with composite scores.

Only Tier 1 and Tier 2 fragments from Phase 7B enter the POI pipeline. Tier 3 content is excluded.

## Phase 5B — Operational Cost Model

Scans all extracted text for dollar amounts using regex pattern matching. Classifies each amount into one of 18 financial categories using an 885-keyword system. Applies a three-tier confidence model:

- **Tier 1** — Court-confirmed amounts from DB-SDNY filings
- **Tier 2** — Dataset-sourced with supporting document context
- **Tier 3** — Entity-matched through co-occurrence analysis

Deduplication prevents double-counting across confidence tiers.

## Phase 5C — Entity-to-Entity Fund Flow

Detects payer-to-payee patterns in extracted text using Aho-Corasick multi-pattern matching. Builds directional fund flow records linking source entities to destination entities with amounts, dates, and source documents.

## Phase 5D — Payment-Travel-Victim Temporal Correlation

Cross-references three event timelines: financial transactions, flight/travel records, and victim-related documents. Identifies temporal clusters where payments, travel, and victim references co-occur within defined windows.

## Phase 5E — Redaction Map

Scans all extracted text for redaction markers (explicit labels, FOIA exemptions, visual patterns, metadata flags). For each marker, searches within a 500-character proximity window for dollar amounts. Classifies findings by confidence tier based on document type, redaction type, and amount.

Output: navigational tool showing every document where financial data appears near redacted content, sorted by priority.

## Phase 6 — DOJ 303 Cross-Reference

Matches names from the DOJ's publicly released list of 303 persons against the entire EFTA corpus. For each match, provides signal-level scoring, file counts, dataset distribution, and hyperlinked source documents. Matched: 296 of 303 (97.7%).
