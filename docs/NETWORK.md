# Epstein Financial Shell Network

**14 entities · 8+ banks · 178,592 money references · 1.48M documents**

---

## [![Open Interactive Visualization](https://img.shields.io/badge/🔍_Explore_the_Network-Interactive_Visualization-d4a853?style=for-the-badge)](https://randallscott25-star.github.io/epstein-forensic-finance/visualizations/shell_network.html)

> **Drag** nodes to rearrange · **Scroll** to zoom · **Click** any node for full detail panel · **Search** by name · **Filter** by connection type
>
> The visualization is force-directed — entities cluster by their actual document co-occurrence. The closer two nodes sit, the more documents they share. Node size is proportional to corpus footprint.

---

## How to Read the Network

| Color | Meaning |
|-------|---------|
| 🟡 **Gold** | Shell entity — appears in Deutsche Bank wire ledger |
| 🔴 **Red** | Shell entity — ❌ NOT in wire ledger. Hundreds of financial docs, zero verified wires. Banked elsewhere. |
| 🟣 **Purple** | Communication hub — HBRK Associates routes 13,146 emails across the network |
| 🔵 **Blue** | Banking institution |
| 🟢 **Green** | External source or outflow recipient |
| **Solid line** | Wire transfer (dollar amount) or document co-occurrence (shared file count) |
| **Dashed line** | Banking relationship |

---

## Entity Reference

| Entity | Total Files | Financial Docs | Money Refs | Wire Ledger | Primary Bank |
|--------|-----------|----------------|------------|-------------|-------------|
| Southern Trust Co. | 883 | 178 | 78,569 | ✅ $244M | Deutsche Bank |
| Southern Financial LLC | 628 | 118 | 57,208 | ✅ $139M | Deutsche Bank |
| Financial Trust Co. | 1,014 | 325 | — | ❌ | Bear Stearns |
| Epstein & Co Inc. | 400 | 174 | 10,482 | ❌ | Bear Stearns |
| HBRK Associates | 13,389 | 95 | — | ❌ | — (email hub) |
| Gratitude America | 209 | 89 | 10,407 | ✅ $45M | Deutsche Bank + Morgan Stanley |
| Haze Trust | 186 | 12 | 8,486 | ✅ $126M | Deutsche Bank + HSBC |
| Outgoing Money Trust | 195 | 180 | 2,338 | ❌ | 7 banks |
| Butterfly Trust | 219 | 73 | 3,302 | ❌ | Deutsche Bank |
| Insurance Trust | 71 | 49 | 7,800 | ❌ | Deutsche Bank |
| Jeepers Inc. | 270 | 19 | — | ✅ $58M | Deutsche Bank |
| Epstein Interests | 116 | 28 | — | ❌ | — |
| Nautilus Inc. | 149 | 13 | — | ❌ | — (aircraft) |
| Plan D LLC | 55 | 8 | — | ✅ $41M | Deutsche Bank |

## Banking Institutions by Volume

| Bank | Money Mentions | Financial Files | Key Connection |
|------|---------------|-----------------|----------------|
| **Bear Stearns** | **2,381,211** | 191 | Financial Trust Co (66 shared files, 6,910 mentions) |
| **JPMorgan/Chase** | **744,536** | 615 | Outgoing Money Trust, Financial Trust Co |
| **Deutsche Bank** | **415,287** | 1,564 | All wire-ledger shells — source of Exhibits A–E |
| Citibank | 78,176 | 39 | Gratitude America |
| Goldman Sachs | 14,999 | 25 | TBD |
| HSBC | 13,389 | 44 | Haze Trust (Bermuda) |
| Morgan Stanley | 13,255 | 82 | Gratitude America |
| Bank of Hawaii | — | 734 | USVI operations (2,431 total files) |

---

*All amounts are automated extractions from DOJ EFTA documents. Appearance does not imply wrongdoing. See [Narrative 11: The Shell Map](../narratives/11_the_shell_map.md) for the complete analysis. Supporting data: <a href="https://docs.google.com/spreadsheets/d/11lw0QjMZ-rYIjWesv5VG1YKts57ahPEm/edit?usp=sharing&ouid=103970896670138914877&rtpof=true&sd=true" target="_blank">Forensic Workbook (view-only)</a> · [Master Wire Ledger](../data/master_wire_ledger_phase25.json).*

*For the girls.*
