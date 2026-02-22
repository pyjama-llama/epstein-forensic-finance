#!/usr/bin/env python3
"""
inject_efta_source_table.py
━━━━━━━━━━━━━━━━━━━━━━━━━━
Adds a clickable '📄 EFTA Source Documents' table to each narrative's
Source Documents section — so readers can click straight to the DOJ PDFs
and Dataset browse pages that underlie each narrative.

Two link patterns (from Phase 5E Redaction Map v18 notebook):
  PDF:    justice.gov/epstein/files/DataSet%20{ds}/EFTA{serial}.pdf
  Browse: justice.gov/epstein/doj-disclosures/data-set-{ds}-files

Injection point: right before '### 📊 Verify in Forensic Workbook'
Idempotent: skips if '📄 EFTA Source Documents' already present.

Usage:
    python3 inject_efta_source_table.py --dir ./narratives
    python3 inject_efta_source_table.py --dir ./narratives --dry-run
"""

import re
import argparse
from pathlib import Path

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# URL BUILDERS — Phase 5E notebook logic
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DATASET_RANGES = [
    (1,1,3158),(2,3159,3857),(3,3858,5586),(4,5705,8320),
    (5,8409,8528),(6,8529,8998),(7,9016,9664),(8,9676,39023),
    (9,39025,1262781),(10,1262782,2205654),(11,2205655,2730264),
    (12,2730265,2731783),
]

def efta_to_dataset(num):
    for ds, s, e in DATASET_RANGES:
        if s <= num <= e:
            return ds
    return None

def pdf_link(efta_id):
    """<a href> to DOJ PDF, opens new tab."""
    num = int(efta_id.replace("EFTA",""))
    ds = efta_to_dataset(num)
    if ds is None: return efta_id
    url = f"https://www.justice.gov/epstein/files/DataSet%20{ds}/EFTA{num:08d}.pdf"
    return f'<a href="{url}" target="_blank">{efta_id}</a>'

def browse_link(ds, label=None):
    """<a href> to DOJ Dataset browse page, opens new tab."""
    label = label or f"Dataset {ds}"
    url = f"https://www.justice.gov/epstein/doj-disclosures/data-set-{ds}-files"
    return f'<a href="{url}" target="_blank">{label}</a>'

def ext_link(url, label):
    """External reference link."""
    return f'<a href="{url}" target="_blank">{label}</a>'


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# NARRATIVE-SPECIFIC SOURCE DOCUMENT TABLES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Primary Deutsche Bank production document
DB_PROD = pdf_link("EFTA00027019")
DB_DESC = "Deutsche Bank-SDNY Production"

# Dataset browse links
DS8_BROWSE = browse_link(8)
DS9_BROWSE = browse_link(9)
DS11_BROWSE = browse_link(11)

# All 12 dataset browse links for corpus-wide narratives
ALL_DS = ", ".join(browse_link(d, str(d)) for d in range(1, 13))

# External references
FAA_LINK = ext_link("https://registry.faa.gov/AircraftInquiry", "FAA Aircraft Registry")
DFS_LINK = ext_link("https://www.dfs.ny.gov/reports_and_publications/press_releases/pr202007061", "NYDFS Consent Order (2020)")
DECHERT_LINK = ext_link("https://www.apollo.com/~/media/Files/A/Apollo-V3/documents/dechert-report.pdf", "Dechert LLP Independent Review (2021)")
SEC_LINK = ext_link("https://efts.sec.gov/LATEST/search-index?q=%22financial+trust+company%22&dateRange=custom&startdt=2019-01-01&enddt=2020-12-31", "SEC EDGAR — Financial Trust Co. filings")

NARRATIVE_SOURCES = {
    "01": {
        "rows": [
            (DB_PROD, "DS8", f"{DB_DESC}: Exhibit C — Capitalization of Epstein's NOW/SuperNow Accounts"),
            (DS8_BROWSE, "DS8", "Browse neighboring documents in Dataset 8"),
        ]
    },
    "02": {
        "rows": [
            (DB_PROD, "DS8", f"{DB_DESC}: Exhibit D — Art Market Proceeds (Sotheby's, Christie's → Haze Trust)"),
            (DS8_BROWSE, "DS8", "Browse neighboring documents in Dataset 8"),
        ]
    },
    "03": {
        "rows": [
            (DB_PROD, "DS8", f"{DB_DESC}: Exhibit A — Southern Trust Company Capitalization (Leon Black transfers)"),
            (f"Full EFTA Corpus", "DS1–12", "Expansion wires extracted from broader corpus financial documents referencing Plan D LLC"),
            (DS8_BROWSE, "DS8", "Browse neighboring documents in Dataset 8"),
        ]
    },
    "04": {
        "rows": [
            (DB_PROD, "DS8", f"{DB_DESC}: Exhibits A–E (all 5 exhibits, 382 wires, $1.964B)"),
            (DS8_BROWSE, "DS8", "Browse neighboring documents in Dataset 8"),
        ]
    },
    "05": {
        "rows": [
            (DB_PROD, "DS8", f"{DB_DESC}: Exhibits C, D, E — 38 Deutsche Bank wires"),
            (DFS_LINK, "External", "NYDFS $150M consent order re: Deutsche Bank Epstein accounts"),
            (DS8_BROWSE, "DS8", "Browse neighboring documents in Dataset 8"),
        ]
    },
    "06": {
        "rows": [
            (DB_PROD, "DS8", f"{DB_DESC}: Exhibit E — Gratitude America Ltd. wire activity"),
            (DS8_BROWSE, "DS8", "Browse neighboring documents in Dataset 8"),
        ]
    },
    "07": {
        "rows": [
            (DB_PROD, "DS8", f"{DB_DESC}: Exhibits A–E (160 dated wire transfers)"),
            (DS8_BROWSE, "DS8", "APIS/CBP passenger manifests — aircraft N212JE, N908JE"),
            (DS9_BROWSE, "DS9", "APIS/CBP passenger manifests — additional flight records"),
            (DS11_BROWSE, "DS11", "APIS/CBP passenger manifests — additional flight records"),
            (FAA_LINK, "External", "FAA Aircraft Registry — tail number N212JE (Gulfstream), N908JE (Boeing 727)"),
        ]
    },
    "08": {
        "rows": [
            (pdf_link("EFTA00023049"), "DS8", "Maxwell — Minor, Minor Victim-3 document"),
            (pdf_link("EFTA00065479"), "DS9", "Maxwell/Groff email — Trafficking Victims Protection Act"),
            (pdf_link("EFTA00073465"), "DS9", "Maxwell court filing — Crime Victims' Rights Act"),
            (pdf_link("EFTA00173201"), "DS9", "Groff/Maxwell — Jeffrey Epstein-Victim, Sex Trafficking"),
            (pdf_link("EFTA00371439"), "DS9", "Groff email — Victim Payouts"),
            (pdf_link("EFTA00429909"), "DS9", "Lesley Groff — Federal Crime Victims Rights Act"),
            (pdf_link("EFTA00446172"), "DS9", "Lesley Groff — Jane Doe reference"),
            (pdf_link("EFTA00067267"), "DS9", "Sarah Kellen subpoena — Victim"),
            (pdf_link("EFTA00261508"), "DS9", "Maxwell document — VICTIM"),
            (pdf_link("EFTA00313632"), "DS9", "Maxwell court filing — Plaintiff Jane Doe"),
            (DB_PROD, "DS8", f"{DB_DESC}: Exhibits A–E (185 verified wires for staff cross-reference)"),
            (f"Full EFTA Corpus", "DS1–12", "11.4M entity records across 1,476,377 files — person × document co-occurrence"),
        ]
    },
    "09": {
        "rows": [
            (pdf_link("EFTA00018778"), "DS8", "Sample financial document — entity co-occurrence source"),
            (pdf_link("EFTA00371439"), "DS9", "Groff email — Victim Payouts (cross-reference validation)"),
            (pdf_link("EFTA00429909"), "DS9", "Lesley Groff — Federal Crime Victims Rights Act"),
            (pdf_link("EFTA00446172"), "DS9", "Lesley Groff — Jane Doe reference"),
            (f"Full EFTA Corpus", "DS1–12", "734,122 unique person entities queried for financial × victim document co-occurrence"),
        ]
    },
    "10": {
        "rows": [
            (DB_PROD, "DS8", f"{DB_DESC}: Exhibits A–E — 185 wire transfers tested against Benford's Law"),
            (DS8_BROWSE, "DS8", "Browse neighboring documents in Dataset 8"),
        ],
        "note": "Statistical framework (Benford's Law) is an analytical tool applied to EFTA data, not itself sourced from the corpus."
    },
    "11": {
        "rows": [
            (DB_PROD, "DS8", f"{DB_DESC}: Exhibits A–E — 7 shell entities from wire production"),
            (f"Full EFTA Corpus", "DS1–12", "14 shell entities mapped via entity co-occurrence across 1,476,377 files"),
            (DS8_BROWSE, "DS8", "Browse Dataset 8 — Deutsche Bank production"),
            (DS9_BROWSE, "DS9", "Browse Dataset 9 — largest dataset (1.2M+ files)"),
        ]
    },
    "12": {
        "rows": [
            (f"Full EFTA Corpus", "DS1–12", "Bear Stearns: 191 financial files, 2,381,211 money-entity mentions"),
            (f"Full EFTA Corpus", "DS1–12", "Financial Trust Company: 1,014 total files across all document types"),
            (DS8_BROWSE, "DS8", "Browse Dataset 8"),
            (DS9_BROWSE, "DS9", "Browse Dataset 9 — primary Bear Stearns/FTC document location"),
            (SEC_LINK, "External", "SEC EDGAR — Financial Trust Co. investigation reference (HO-13814)"),
        ]
    },
    "13": {
        "rows": [
            (f"Full EFTA Corpus", "DS1–12", "Outgoing Money Trust: 195 documents (180 financial), 7 banking relationships"),
            (DB_PROD, "DS8", f"{DB_DESC}: Exhibits A–E (trust network wires for cross-reference)"),
            (DS8_BROWSE, "DS8", "Browse Dataset 8"),
            (DS9_BROWSE, "DS9", "Browse Dataset 9 — multi-bank financial records"),
        ]
    },
    "14": {
        "rows": [
            (DB_PROD, "DS8", f"{DB_DESC}: Exhibit A — 12 Black-entity transfers to Southern Trust ($60.5M verified)"),
            (f"Full EFTA Corpus", "DS1–12", "Leon Black: 1,600 file matches across all datasets"),
            (DECHERT_LINK, "External", "Dechert LLP independent review — $158–170M total Black-to-Epstein payments"),
            (DS8_BROWSE, "DS8", "Browse Dataset 8"),
            (DS9_BROWSE, "DS9", "Browse Dataset 9"),
        ]
    },
    "15": {
        "rows": [
            (DB_PROD, "DS8", f"{DB_DESC}: Exhibit E — Gratitude America wire activity ($45M verified)"),
            (pdf_link("EFTA00009962"), "DS8", "Gratitude America financial document — fund co-occurrence"),
            (f"Full EFTA Corpus", "DS1–12", "Gratitude America: 209 documents (89 financial) — hedge fund co-occurrence"),
            (DS8_BROWSE, "DS8", "Browse Dataset 8"),
        ]
    },
    "16": {
        "rows": [
            (f"Full EFTA Corpus", "DS1–12", "HBRK Associates / Richard Kahn: 11,153 files (18,833 emails)"),
            (f"Full EFTA Corpus", "DS1–12", "Shell entity co-occurrence: Southern Financial (89), Southern Trust (96), Haze Trust (22)"),
            (DS8_BROWSE, "DS8", "Browse Dataset 8"),
            (DS9_BROWSE, "DS9", "Browse Dataset 9 — primary email archive location"),
        ],
        "note": "Kahn's document footprint spans all 12 datasets. Email volume (18,833) exceeds all other entity types combined."
    },
}


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# TABLE BUILDER
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def build_source_table(narrative_num: str) -> str:
    """Build the 📄 EFTA Source Documents section for a narrative."""
    config = NARRATIVE_SOURCES.get(narrative_num)
    if not config:
        return ""
    
    lines = []
    lines.append("### 📄 EFTA Source Documents\n")
    lines.append("*Click any document ID to open the DOJ PDF in a new tab. Click a Dataset number to browse neighboring files.*\n")
    lines.append("| Document | Source | Description |")
    lines.append("|----------|--------|-------------|")
    
    for doc, source, desc in config["rows"]:
        lines.append(f"| {doc} | {source} | {desc} |")
    
    if "note" in config:
        lines.append(f"\n> **Note:** {config['note']}")
    
    # Add corpus-wide dataset directory for narratives using full corpus
    has_full_corpus = any("Full EFTA Corpus" in row[0] for row in config["rows"])
    if has_full_corpus:
        lines.append(f"\n**All 12 DOJ Datasets:** {ALL_DS}")
    
    lines.append("")
    return "\n".join(lines)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# INJECTION ENGINE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MARKER = "📄 EFTA Source Documents"
INJECTION_POINT = "### 📊 Verify in Forensic Workbook"


def inject_source_table(file_path: Path, dry_run: bool = False) -> bool:
    """Inject source table into a narrative. Returns True if modified."""
    text = file_path.read_text(encoding='utf-8')
    
    # Already injected?
    if MARKER in text:
        return False
    
    # Extract narrative number from filename
    match = re.match(r'(\d{1,2})', file_path.name)
    if not match:
        return False
    num = match.group(1).zfill(2)
    
    # Build the table
    table = build_source_table(num)
    if not table:
        return False
    
    # Find injection point: right before the workbook table
    if INJECTION_POINT in text:
        text = text.replace(INJECTION_POINT, table + "\n" + INJECTION_POINT)
    else:
        # Fallback: inject before "### How to Verify"
        fallback = "### How to Verify"
        if fallback in text:
            text = text.replace(fallback, table + "\n" + fallback)
        else:
            # Last resort: append at end
            text = text.rstrip() + "\n\n" + table + "\n"
    
    if not dry_run:
        file_path.write_text(text, encoding='utf-8')
    
    return True


def main():
    parser = argparse.ArgumentParser(
        description='Inject EFTA source document tables into narratives'
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--dir', help='Directory of narrative .md files')
    group.add_argument('--file', help='Single .md file')
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()

    files = []
    if args.file:
        files = [Path(args.file)]
    else:
        files = sorted(Path(args.dir).glob('[0-1]*.md'))

    mode = 'DRY RUN' if args.dry_run else 'LIVE'
    print(f"━━━ EFTA SOURCE TABLE INJECTOR ({mode}) ━━━")
    print(f"  Files: {len(files)}")
    print(f"{'━' * 55}\n")

    count = 0
    for f in files:
        modified = inject_source_table(f, args.dry_run)
        if modified:
            verb = "Would inject" if args.dry_run else "Injected"
            print(f"  📄 {f.name}: {verb} EFTA source table")
            count += 1
        else:
            print(f"  ✅ {f.name}: Already has source table or no config")

    print(f"\n{'━' * 55}")
    print(f"  {count} narratives {'would be' if args.dry_run else ''} updated")
    if args.dry_run and count > 0:
        print(f"  Run without --dry-run to apply.")
    print(f"━━━ COMPLETE ━━━")


if __name__ == '__main__':
    main()
