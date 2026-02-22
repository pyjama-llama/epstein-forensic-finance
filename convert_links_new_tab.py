#!/usr/bin/env python3
"""
convert_links_new_tab.py
━━━━━━━━━━━━━━━━━━━━━━━
Converts markdown external links to HTML <a target="_blank"> tags
so they open in a new browser tab instead of navigating away.

Converts:
  [EFTA00027019](https://www.justice.gov/...) 
    → <a href="https://www.justice.gov/..." target="_blank">EFTA00027019</a>

  [📊 Open Tab](https://docs.google.com/...)
    → <a href="https://docs.google.com/..." target="_blank">📊 Open Tab</a>

  [8](https://www.justice.gov/epstein/doj-disclosures/...)
    → <a href="https://www.justice.gov/..." target="_blank">8</a>

Skips:
  - Internal/relative links: [METHODOLOGY.md](METHODOLOGY.md)
  - Anchor links: [section](#section)
  - Links already using <a> tags
  - Links inside code blocks

Usage:
    python3 convert_links_new_tab.py --dir ./narratives --recursive
    python3 convert_links_new_tab.py --dir . --recursive --dry-run
"""

import re
import argparse
from pathlib import Path

# Match markdown links: [text](url)
# But only external ones (http:// or https://)
# EXCLUDES image syntax: ![alt](url) and badge links: [![badge](img)](url)
MD_LINK_RE = re.compile(
    r'(?<!!)\[([^\]]+)\]\((https?://[^)]+)\)'
)


def convert_external_links(text: str) -> tuple[str, int]:
    """
    Convert markdown [text](https://...) to <a href="..." target="_blank">text</a>.
    Returns (modified_text, count).
    """
    count = 0
    
    # Track code blocks to skip them
    in_code_block = False
    lines = text.split('\n')
    result_lines = []
    
    for line in lines:
        # Toggle code block state
        if line.strip().startswith('```'):
            in_code_block = not in_code_block
            result_lines.append(line)
            continue
        
        if in_code_block:
            result_lines.append(line)
            continue
        
        # Skip lines that are already HTML <a> tags
        if '<a href=' in line and 'target="_blank"' in line:
            result_lines.append(line)
            continue
        
        # Find and replace markdown external links
        def replace_link(match):
            nonlocal count
            display_text = match.group(1)
            url = match.group(2)
            
            # Build HTML link with target="_blank"
            count += 1
            return f'<a href="{url}" target="_blank">{display_text}</a>'
        
        converted_line = MD_LINK_RE.sub(replace_link, line)
        result_lines.append(converted_line)
    
    return '\n'.join(result_lines), count


def process_file(file_path: Path, dry_run: bool = False) -> int:
    """Process a single .md file. Returns count of conversions."""
    with open(file_path, 'r', encoding='utf-8') as f:
        original = f.read()
    
    modified, count = convert_external_links(original)
    
    if count > 0 and not dry_run:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(modified)
    
    return count


def main():
    parser = argparse.ArgumentParser(
        description='Convert external markdown links to HTML <a target="_blank"> tags'
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--dir', help='Directory of .md files')
    group.add_argument('--file', help='Single .md file')
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--recursive', '-r', action='store_true')
    args = parser.parse_args()

    files = []
    if args.file:
        files = [Path(args.file)]
    else:
        p = Path(args.dir)
        files = sorted(p.rglob('*.md') if args.recursive else p.glob('*.md'))

    mode = 'DRY RUN' if args.dry_run else 'LIVE'
    print(f"━━━ LINK CONVERTER → target=\"_blank\" ({mode}) ━━━")
    print(f"  Files: {len(files)}")
    print(f"{'━' * 55}\n")

    total = 0
    for f in files:
        n = process_file(f, args.dry_run)
        if n > 0:
            verb = "Would convert" if args.dry_run else "Converted"
            print(f"  🔗 {f.name}: {verb} {n} links → target=\"_blank\"")
            total += n
        else:
            print(f"  ✅ {f.name}: No external links to convert")

    print(f"\n{'━' * 55}")
    print(f"  Total: {total} links {'would be' if args.dry_run else ''} converted")
    if args.dry_run and total > 0:
        print(f"  Run without --dry-run to apply.")
    print(f"━━━ COMPLETE ━━━")


if __name__ == '__main__':
    main()
