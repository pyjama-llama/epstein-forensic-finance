#!/usr/bin/env python3
"""
linkify_efta.py — DOJ EFTA Document Hyperlinker
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Converts plain-text EFTA document IDs and Dataset references in .md files
into clickable markdown hyperlinks pointing to DOJ PDFs and browse pages.

URL LOGIC (from Phase 5E Redaction Map v18 notebook):
  doj_url_files(serial, ds)      → Direct PDF on justice.gov
  doj_url_dataset_page(ds)       → Dataset browse page on DOJ

DUAL LINKING:
  EFTA00027019  → [EFTA00027019](https://www.justice.gov/epstein/files/DataSet%208/EFTA00027019.pdf)
  Dataset 9     → [Dataset 9](https://www.justice.gov/epstein/doj-disclosures/data-set-9-files)
  DS8           → [DS8](https://www.justice.gov/epstein/doj-disclosures/data-set-8-files)

DATASET RANGES (from Phase 5E production database scan):
  DS1:  EFTA00000001 – EFTA00003158
  DS2:  EFTA00003159 – EFTA00003857
  DS3:  EFTA00003858 – EFTA00005586
  DS4:  EFTA00005705 – EFTA00008320
  DS5:  EFTA00008409 – EFTA00008528
  DS6:  EFTA00008529 – EFTA00008998
  DS7:  EFTA00009016 – EFTA00009664
  DS8:  EFTA00009676 – EFTA00039023
  DS9:  EFTA00039025 – EFTA01262781
  DS10: EFTA01262782 – EFTA02205654
  DS11: EFTA02205655 – EFTA02730264
  DS12: EFTA02730265 – EFTA02731783

Usage:
    python3 linkify_efta.py --dir ./narratives
    python3 linkify_efta.py --dir ./narratives --dry-run
    python3 linkify_efta.py --file ./narratives/01_jeepers_pipeline.md
    python3 linkify_efta.py --dir . --recursive
"""

import re
import sys
import argparse
from pathlib import Path

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# DATASET RANGES — from Phase 5E production scan
# Same ranges used in the Redaction Map v18 notebook
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DATASET_RANGES = [
    # (dataset_number, efta_start, efta_end)
    (1,  1,        3158),
    (2,  3159,     3857),
    (3,  3858,     5586),
    (4,  5705,     8320),
    (5,  8409,     8528),
    (6,  8529,     8998),
    (7,  9016,     9664),
    (8,  9676,     39023),
    (9,  39025,    1262781),
    (10, 1262782,  2205654),
    (11, 2205655,  2730264),
    (12, 2730265,  2731783),
]


def efta_to_dataset(efta_num: int) -> int | None:
    """Map EFTA serial number to DOJ Dataset number."""
    for ds, start, end in DATASET_RANGES:
        if start <= efta_num <= end:
            return ds
    return None  # Falls in inter-dataset gap


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# URL BUILDERS — exact logic from Phase 5E notebook
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def doj_url_files(serial, ds):
    """Direct PDF link on DOJ (confirmed working).
    From Phase 5E Redaction Map v18 notebook."""
    if serial is None or ds is None:
        return None
    return f"https://www.justice.gov/epstein/files/DataSet%20{ds}/EFTA{int(serial):08d}.pdf"


def doj_url_dataset_page(ds):
    """Dataset browse page on DOJ — readers can see neighboring files.
    From Phase 5E Redaction Map v18 notebook."""
    if ds is None:
        return None
    return f"https://www.justice.gov/epstein/doj-disclosures/data-set-{ds}-files"


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# MARKDOWN LINK BUILDERS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def efta_to_md_link(efta_id: str) -> str | None:
    """Convert 'EFTA00027019' → '<a href="https://...pdf" target="_blank">EFTA00027019</a>'"""
    num_str = efta_id.replace("EFTA", "")
    num = int(num_str)
    ds = efta_to_dataset(num)
    url = doj_url_files(num, ds)
    if url is None:
        return None
    return f'<a href="{url}" target="_blank">{efta_id}</a>'


def dataset_to_md_link(display_text: str, ds_num: int) -> str:
    """Convert 'Dataset 9' → '<a href="https://...browse-page" target="_blank">Dataset 9</a>'"""
    url = doj_url_dataset_page(ds_num)
    return f'<a href="{url}" target="_blank">{display_text}</a>'


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CONTEXT CHECKERS — skip already-linked content
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def is_already_linked(text: str, start: int, end: int) -> bool:
    """Check if the match at [start:end] is already inside a markdown link or HTML a-tag."""
    # Look back for context
    before = text[max(0, start - 200):start]
    after = text[end:min(len(text), end + 200)]

    # Pattern 0: Inside an HTML <a> tag
    # Check if we're between <a ...> and </a>
    last_a_open = before.rfind('<a ')
    last_a_close = before.rfind('</a>')
    if last_a_open > last_a_close:
        # We're inside an <a> tag
        return True
    # Check if href="...EFTA..." (we're inside an href value)
    if 'href="' in before[-80:] and '"' not in before[before.rfind('href="') + 6:]:
        return True

    # Pattern 1: [EFTA...](url) — we're the link text
    if before.endswith('[') and after.startswith(']('):
        return True

    # Pattern 2: [...](url containing EFTA...) — we're inside a URL
    paren_before = before.rfind('](')
    paren_close = after.find(')')
    if paren_before != -1 and paren_close != -1:
        between = before[paren_before:]
        if ')' not in between:
            return True

    # Pattern 3: Already a full markdown link [EFTA...](...)
    bracket_open = before.rfind('[')
    bracket_close_after = after.find(')')
    if bracket_open != -1 and bracket_close_after != -1:
        between_bracket = before[bracket_open + 1:]
        if '](' not in between_bracket and after.startswith(']('):
            return True

    # Pattern 4: Inside a URL (http context)
    url_check = before[-60:] if len(before) >= 60 else before
    if 'http' in url_check and ')' not in url_check.split('http')[-1]:
        return True

    # Pattern 5: Inside backticks (code)
    backtick_count = before.count('`')
    if backtick_count % 2 == 1:
        return True

    return False


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CORE LINKIFY ENGINE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# EFTA pattern: EFTA followed by 7-8 digits
EFTA_RE = re.compile(r'EFTA\d{7,8}')

# Dataset patterns: "Dataset 9", "Datasets 8, 9, and 11", "DS8", "Data Set 10"
# We match individual dataset refs, not the compound "Datasets X, Y, and Z"
DATASET_SINGLE_RE = re.compile(
    r'(?:Dataset|Data\s+Set)\s+(\d{1,2})',
    re.IGNORECASE
)
DS_SHORT_RE = re.compile(r'\bDS(\d{1,2})\b')


def linkify_efta_ids(text: str) -> tuple[str, int]:
    """Replace plain EFTA IDs with markdown PDF links. Returns (text, count)."""
    count = 0
    matches = list(EFTA_RE.finditer(text))

    for match in reversed(matches):
        efta_id = match.group()
        start, end = match.start(), match.end()

        if is_already_linked(text, start, end):
            continue

        md_link = efta_to_md_link(efta_id)
        if md_link is None:
            continue  # Falls in inter-dataset gap

        text = text[:start] + md_link + text[end:]
        count += 1

    return text, count


def linkify_dataset_refs(text: str) -> tuple[str, int]:
    """Replace plain 'Dataset N', 'DS N', and compound 'Datasets X, Y, and Z'
    with browse-page links. Returns (text, count)."""
    count = 0

    # ── Pass 1: Compound "Datasets 8, 9, and 11" or "Datasets 8, 9, 11" ──
    # Match the full compound reference, then linkify each number inside it
    DATASETS_COMPOUND_RE = re.compile(
        r'(Datasets?\s+)(\d{1,2}(?:\s*,\s*(?:and\s+)?\d{1,2})*(?:\s*,?\s*and\s+\d{1,2})?)',
        re.IGNORECASE
    )

    compound_matches = list(DATASETS_COMPOUND_RE.finditer(text))
    for match in reversed(compound_matches):
        start, end = match.start(), match.end()
        if is_already_linked(text, start, end):
            continue

        prefix = match.group(1)  # "Datasets " or "Dataset "
        nums_part = match.group(2)  # "8, 9, and 11"

        # Extract all dataset numbers
        ds_nums = [int(n) for n in re.findall(r'\d+', nums_part)]

        # Skip if any number is outside DOJ range (like "19 datasets")
        if not all(1 <= n <= 12 for n in ds_nums):
            continue

        # If single number, fall through to Pass 2
        if len(ds_nums) <= 1:
            continue

        # Build replacement: linkify each number in place
        def replace_num(m):
            n = int(m.group())
            if 1 <= n <= 12:
                url = doj_url_dataset_page(n)
                return f'<a href="{url}" target="_blank">{n}</a>'
            return m.group()

        linked_nums = re.sub(r'\d+', replace_num, nums_part)
        replacement = prefix + linked_nums
        text = text[:start] + replacement + text[end:]
        count += len(ds_nums)

    # ── Pass 2: Single "Dataset N" / "Data Set N" patterns ──
    for pattern in [DATASET_SINGLE_RE, DS_SHORT_RE]:
        matches = list(pattern.finditer(text))
        for match in reversed(matches):
            display = match.group()
            ds_num = int(match.group(1))

            if ds_num < 1 or ds_num > 12:
                continue  # Not a valid DOJ dataset

            start, end = match.start(), match.end()

            if is_already_linked(text, start, end):
                continue

            md_link = dataset_to_md_link(display, ds_num)
            text = text[:start] + md_link + text[end:]
            count += 1

    return text, count


def linkify_all(text: str) -> tuple[str, int, int]:
    """Run both EFTA and Dataset linkification. Returns (text, efta_count, ds_count)."""
    text, efta_count = linkify_efta_ids(text)
    text, ds_count = linkify_dataset_refs(text)
    return text, efta_count, ds_count


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# FILE PROCESSING
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def process_file(file_path: Path, dry_run: bool = False) -> tuple[int, int]:
    """Process a single .md file. Returns (efta_links, ds_links)."""
    with open(file_path, 'r', encoding='utf-8') as f:
        original = f.read()

    modified, efta_count, ds_count = linkify_all(original)

    if (efta_count > 0 or ds_count > 0) and not dry_run:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(modified)

    return efta_count, ds_count


def main():
    parser = argparse.ArgumentParser(
        description='DOJ EFTA Document Hyperlinker — Phase 5E notebook logic'
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--dir', help='Directory of .md files to process')
    group.add_argument('--file', help='Single .md file to process')
    parser.add_argument('--dry-run', action='store_true',
                        help='Show changes without modifying files')
    parser.add_argument('--recursive', '-r', action='store_true',
                        help='Process subdirectories too')
    args = parser.parse_args()

    files = []
    if args.file:
        files = [Path(args.file)]
    else:
        dir_path = Path(args.dir)
        if args.recursive:
            files = sorted(dir_path.rglob('*.md'))
        else:
            files = sorted(dir_path.glob('*.md'))

    mode = 'DRY RUN' if args.dry_run else 'LIVE'
    print(f"━━━ EFTA LINKIFIER ({mode}) ━━━")
    print(f"  URL logic: Phase 5E Redaction Map v18 notebook")
    print(f"  PDF link:  justice.gov/epstein/files/DataSet%20{{ds}}/EFTA{{serial}}.pdf")
    print(f"  Browse:    justice.gov/epstein/doj-disclosures/data-set-{{ds}}-files")
    print(f"  Files:     {len(files)}")
    print(f"{'━' * 60}\n")

    total_efta = 0
    total_ds = 0

    for f in files:
        efta_count, ds_count = process_file(f, args.dry_run)
        if efta_count > 0 or ds_count > 0:
            action = "Would linkify" if args.dry_run else "Linkified"
            parts = []
            if efta_count > 0:
                parts.append(f"{efta_count} EFTA→PDF")
            if ds_count > 0:
                parts.append(f"{ds_count} Dataset→browse")
            print(f"  🔗 {f.name}: {action} {', '.join(parts)}")
            total_efta += efta_count
            total_ds += ds_count
        else:
            print(f"  ✅ {f.name}: All references already linked")

    print(f"\n{'━' * 60}")
    verb = 'would be' if args.dry_run else ''
    print(f"  EFTA→PDF links:       {total_efta} {verb} created")
    print(f"  Dataset→browse links: {total_ds} {verb} created")
    print(f"  Total:                {total_efta + total_ds}")

    if args.dry_run and (total_efta + total_ds) > 0:
        print(f"\n  Run without --dry-run to apply changes.")
    print(f"\n━━━ LINKIFIER COMPLETE ━━━")


if __name__ == '__main__':
    main()
