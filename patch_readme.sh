#!/bin/bash
# ================================================================
# Patch root README.md — published narratives, Phase 25, file tree
# Run from repo root: ~/epstein-forensic-finance
# ================================================================

set -e
FILE="README.md"

echo "Patching $FILE..."

# 1. Replace "Forthcoming" Data Narratives section with actual published links
python3 << 'PYEOF'
import re

with open('README.md', 'r') as f:
    content = f.read()

old_narratives = """## Data Narratives

The financial data tells stories that numbers alone cannot convey. As I complete deeper analysis of specific fund flow patterns, entity relationships, and temporal correlations, I will publish detailed narrative reports in this section — connecting the quantitative forensic findings to the broader picture of how this financial infrastructure operated.

**Forthcoming:**

* The Jeepers Pipeline: Tracing $51.9M through a brokerage shell to personal accounts
* Art Market Liquidity: How auction house proceeds moved through Haze Trust
* The Plan D Question: $18M out, near-zero in — where did the money come from?
* Chain-Hop Anatomy: How $10M becomes $50M across five entities
* Deutsche Bank's Role: 78 wires and the custodian question
* Gratitude America: When 7% goes to charity and 88% goes to investment accounts

*These narratives will be data-driven — every claim anchored to specific wire transfers, entity classifications, and court exhibit references from the master ledger.*"""

new_narratives = """## Data Narratives

**The financial data tells stories that numbers alone cannot convey.**

**→ [Read the Data Narratives](narratives/)**

| # | Title | Key Finding | Wires | Dollar Volume (Unverified) |
|---|-------|-------------|-------|---------|
| 1 | [The Jeepers Pipeline](narratives/01_jeepers_pipeline.md) | Brokerage shell capitalized Epstein's personal checking — 24 wires, all dated, all on one exhibit | 24 | $57,876,640 |
| 2 | [Art Market as Liquidity Channel](narratives/02_art_market.md) | Auction proceeds from Sotheby's and Christie's entered the trust network through The Haze Trust | 20 | $103,786,473 |
| 3 | [The Plan D Question](narratives/03_plan_d_question.md) | $18M disbursed to Leon Black with near-zero inflow to Plan D LLC | 34 | $163,097,604 |
| 4 | [Chain-Hop Anatomy](narratives/04_chain_hop_anatomy.md) | How money moved through the 4-tier shell network — and how I caught $311M in inflation | 67 | $312,796,381 |
| 5 | [Deutsche Bank's Role](narratives/05_deutsche_bank.md) | 38 wires across every major Epstein entity, 75% of volume in last 6 months | 38 | $56,792,936 |
| 6 | [Gratitude America](narratives/06_gratitude_america.md) | Charity sent 88% of outflows to investment accounts, 7% to charitable purposes | 20 | $13,080,518 |
| 7 | [Follow the Money, Follow the Plane](narratives/07_follow_the_money_follow_the_plane.md) | Wire transfers and Epstein aircraft flights overlap at 4.3× random chance; $169M within ±3 days of St. Thomas flights | 185 + 321 flights | $575,359,330 |

Every narrative is grounded in wire-level data from the [master wire ledger](data/master_wire_ledger_phase25.json) and follows the same structure: Summary → The Data → What the Pattern Shows → What I Cannot Determine. All amounts are (Unverified). See [COMPLIANCE.md](COMPLIANCE.md) for professional standards."""

content = content.replace(old_narratives, new_narratives)

# 2. Update file tree to include narratives/
old_tree = """├── README.md                              ← You are here
├── METHODOLOGY.md                         ← 24-phase pipeline, 9 bugs, 5-axis scoring, limitations
├── FINDINGS.md                            ← GAP analysis, 8 key discoveries, recommendations
├── COMPLIANCE.md                          ← Professional standards, GAAS conformance, legal disclaimers
├── SCHEMA.md                              ← Database architecture diagram
├── NETWORK.md                             ← Trust network flow diagram
├── data/
│   ├── master_wire_ledger_phase24.json    ← 382 wires (publication dataset)
│   └── entity_classification.json         ← Entity → type mapping (158 entities)
├── workbook/
│   ├── EPSTEIN_FORENSIC_WORKBOOK_v6.xlsx  ← 11-tab forensic workbook
│   └── forensic_workbook_v6.py            ← Python script to regenerate workbook
└── scripts/
    └── publish.sh                         ← Git push script"""

new_tree = """├── README.md                              ← You are here
├── METHODOLOGY.md                         ← 25-phase pipeline, 9 bugs, 5-axis scoring, limitations
├── FINDINGS.md                            ← GAP analysis, 8 key discoveries, recommendations
├── COMPLIANCE.md                          ← Professional standards, GAAS conformance, legal disclaimers
├── SCHEMA.md                              ← Database architecture diagram
├── NETWORK.md                             ← Trust network flow diagram
├── narratives/                            ← 7 Data Narratives — start here
│   ├── README.md                          ← Narrative index with summary table
│   ├── 01_jeepers_pipeline.md             ← $57.9M brokerage shell pipeline
│   ├── 02_art_market.md                   ← $103.8M auction proceeds through Haze Trust
│   ├── 03_plan_d_question.md              ← $18M to Leon Black, near-zero inflow
│   ├── 04_chain_hop_anatomy.md            ← $312.8M shell network + $311M inflation removed
│   ├── 05_deutsche_bank.md                ← $56.8M across every Epstein entity
│   ├── 06_gratitude_america.md            ← 88% to investments, 7% to charity
│   └── 07_follow_the_money_follow_the_plane.md ← Wire-flight temporal correlation (4.3×)
├── data/
│   ├── master_wire_ledger_phase25.json    ← 382 wires (publication dataset)
│   └── entity_classification.json         ← Entity → type mapping (158 entities)
├── workbook/
│   ├── EPSTEIN_FORENSIC_WORKBOOK_v6.xlsx  ← 11-tab forensic workbook
│   └── forensic_workbook_v6.py            ← Python script to regenerate workbook
└── scripts/
    └── publish.sh                         ← Git push script"""

content = content.replace(old_tree, new_tree)

# 3. Phase 24 → 25 in Extraction Phases count
content = content.replace('| **Extraction Phases** | 24 |', '| **Extraction Phases** | 25 |')

# 4. Update wire ledger phase ref in Headline Results
content = content.replace('| **Wire Transfers in Master Ledger** | 382 |', '| **Wire Transfers in Master Ledger** | 382 (Phase 25 audited) |')

# 5. Phase 24 audited → Phase 25 in comparison table
content = content.replace('**382** (Phase 24 audited)', '**382** (Phase 25 audited)')

# 6. Pipeline architecture phases
content = content.replace('Phases 14-24  Wire Transfer Extraction Pipeline', 'Phases 14-25  Wire Transfer Extraction Pipeline')

# 7. Wire Transfer Extraction Pipeline header
content = content.replace('### Wire Transfer Extraction Pipeline (Phases 14-24)', '### Wire Transfer Extraction Pipeline (Phases 14-25)')

# 8. Add Phase 25 to pipeline table (after Phase 24 row)
old_pipeline_end = '| 24 | Above-cap verified wires + bank custodian audit | +$121M / -$113M |'
new_pipeline_end = '| 24 | Above-cap verified wires + bank custodian audit | +$121M / -$113M |\n| 25 | Date recovery from source context fields | +75 dates (31.9%→51.6%), 0 collisions |'
content = content.replace(old_pipeline_end, new_pipeline_end)

# 9. Update session/hour counts
content = content.replace('200+ hours. 70+ sessions.', '200+ hours. 75+ sessions.')
content = content.replace('200+ hours across 70+ sessions', '200+ hours across 75+ sessions')

# 10. Update timeline - add Phase 25 and narratives entries
old_timeline_end = '| Ongoing | Data narratives and follow-on analysis |'
new_timeline_end = """| Feb 21 | Phase 25: Date recovery from context fields — 75 dates (31.9%→51.6%), 0 collisions (credit: u/miraculum_one) |
| Feb 21 | Repository made public. 7 Data Narratives published |
| Feb 22 | Narrative 7: Follow the Money, Follow the Plane — wire-flight temporal correlation (4.3× random chance) |
| Ongoing | Additional data narratives and follow-on analysis |"""
content = content.replace(old_timeline_end, new_timeline_end)

# 11. master_wire_ledger phase refs
content = content.replace('master_wire_ledger_phase24.json', 'master_wire_ledger_phase25.json')

# 12. "24-phase pipeline" in METHODOLOGY link description
content = content.replace('24-phase pipeline, 9 bugs', '25-phase pipeline, 9 bugs')

with open('README.md', 'w') as f:
    f.write(content)

print("✅ README.md patched successfully")
PYEOF

echo ""
echo "Verifying changes..."
grep -n "narratives/" README.md | head -20
echo ""
grep -n "Phase 25" README.md | head -10
echo ""
echo "Done. Review with: git diff README.md"
echo ""
echo "To commit:"
echo "  git add README.md"
echo '  git commit -m "README: Published Data Narratives (7 reports), Phase 25 updates, narratives/ directory"'
echo "  git push"
