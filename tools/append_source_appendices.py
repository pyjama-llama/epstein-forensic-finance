#!/usr/bin/env python3
"""
append_source_appendices.py
Appends deep-linked Source Documents & Exhibits sections to each narrative .md file.

Usage:
    python3 append_source_appendices.py --narratives-dir ./narratives --appendices ./source_appendices_deeplinked.md

The script:
1. Parses the combined appendices file into per-narrative sections
2. Matches each section to its narrative .md file (by N1-N16 prefix)
3. Checks if appendix already exists (idempotent — won't double-append)
4. Appends the source appendix section to the bottom of each narrative
5. Reports results
"""

import argparse
import re
import os
import sys
from pathlib import Path


def parse_appendices(appendices_path: str) -> dict:
    """Parse combined appendices file into {narrative_key: appendix_text} dict."""
    with open(appendices_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split on narrative headers: "# N1 — ...", "# N2 — ...", etc.
    sections = re.split(r'\n---\n\n(?=# N\d+)', content)
    
    appendices = {}
    for section in sections:
        section = section.strip()
        if not section:
            continue
        # Extract narrative number
        match = re.match(r'# N(\d+)\s*—', section)
        if match:
            n_num = int(match.group(1))
            key = f"N{n_num}"
            # Remove the narrative title header (first line) — we only want the appendix content
            lines = section.split('\n')
            # Find where "## Source Documents & Exhibits" starts
            appendix_start = None
            for i, line in enumerate(lines):
                if line.strip().startswith('## Source Documents & Exhibits'):
                    appendix_start = i
                    break
            
            if appendix_start is not None:
                appendix_text = '\n'.join(lines[appendix_start:])
            else:
                # Fallback: use everything after the first line
                appendix_text = '\n'.join(lines[1:])
            
            appendices[key] = appendix_text.strip()
    
    return appendices


def find_narrative_files(narratives_dir: str) -> dict:
    """Find narrative .md files and map them to narrative keys (N1-N16)."""
    narrative_files = {}
    dir_path = Path(narratives_dir)
    
    for md_file in sorted(dir_path.glob('*.md')):
        filename = md_file.name.lower()
        # Match patterns like: 01_*, 02_*, n1_*, n01_*, narrative_1_*, N1-*, etc.
        match = re.match(r'0?(\d{1,2})[_\-]', filename)
        if not match:
            match = re.search(r'n[_-]?0?(\d{1,2})', filename)
        if match:
            n_num = int(match.group(1))
            key = f"N{n_num}"
            narrative_files[key] = md_file
    
    return narrative_files


def already_has_appendix(file_path: Path) -> bool:
    """Check if file already contains a source appendix (idempotent check)."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    return '## Source Documents & Exhibits' in content or '📊 Verify in Forensic Workbook' in content


def append_appendix(file_path: Path, appendix_text: str) -> bool:
    """Append source appendix to narrative file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Ensure clean separation
    separator = '\n\n---\n\n'
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content.rstrip() + separator + appendix_text + '\n')
    
    return True


def main():
    parser = argparse.ArgumentParser(description='Append source appendices to narrative .md files')
    parser.add_argument('--narratives-dir', required=True, help='Directory containing narrative .md files')
    parser.add_argument('--appendices', required=True, help='Path to source_appendices_deeplinked.md')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be done without modifying files')
    parser.add_argument('--force', action='store_true', help='Overwrite existing appendices')
    args = parser.parse_args()

    # Parse appendices
    print(f"📄 Parsing appendices from: {args.appendices}")
    appendices = parse_appendices(args.appendices)
    print(f"   Found {len(appendices)} appendix sections: {', '.join(sorted(appendices.keys(), key=lambda x: int(x[1:])))}")

    # Find narrative files
    print(f"\n📁 Scanning narratives in: {args.narratives_dir}")
    narrative_files = find_narrative_files(args.narratives_dir)
    print(f"   Found {len(narrative_files)} narrative files: {', '.join(sorted(narrative_files.keys(), key=lambda x: int(x[1:])))}")

    # Match and append
    print(f"\n{'=' * 60}")
    print(f"{'DRY RUN — no files modified' if args.dry_run else 'APPENDING SOURCE APPENDICES'}")
    print(f"{'=' * 60}\n")

    results = {'appended': [], 'skipped_exists': [], 'skipped_no_file': [], 'skipped_no_appendix': []}

    for n_key in sorted(set(list(appendices.keys()) + list(narrative_files.keys())), key=lambda x: int(x[1:])):
        if n_key not in appendices:
            results['skipped_no_appendix'].append(n_key)
            print(f"  ⚠️  {n_key}: No appendix section found")
            continue
        
        if n_key not in narrative_files:
            results['skipped_no_file'].append(n_key)
            print(f"  ⚠️  {n_key}: No .md file found in narratives directory")
            continue
        
        file_path = narrative_files[n_key]
        
        if already_has_appendix(file_path) and not args.force:
            results['skipped_exists'].append(n_key)
            print(f"  ⏭️  {n_key}: Already has appendix ({file_path.name}) — use --force to overwrite")
            continue
        
        if args.dry_run:
            results['appended'].append(n_key)
            print(f"  ✅ {n_key}: Would append to {file_path.name}")
        else:
            append_appendix(file_path, appendices[n_key])
            results['appended'].append(n_key)
            print(f"  ✅ {n_key}: Appended to {file_path.name}")

    # Summary
    print(f"\n{'=' * 60}")
    print(f"SUMMARY")
    print(f"{'=' * 60}")
    print(f"  ✅ Appended:           {len(results['appended'])}")
    print(f"  ⏭️  Already had appendix: {len(results['skipped_exists'])}")
    print(f"  ⚠️  No .md file found:   {len(results['skipped_no_file'])}")
    print(f"  ⚠️  No appendix found:   {len(results['skipped_no_appendix'])}")

    if results['skipped_no_file']:
        print(f"\n  Missing files for: {', '.join(results['skipped_no_file'])}")
        print(f"  Expected filename pattern: n1_*.md, n2_*.md, etc.")

    if not args.dry_run and results['appended']:
        print(f"\n  🎯 Done! {len(results['appended'])} narratives now have deep-linked source appendices.")


if __name__ == '__main__':
    main()
