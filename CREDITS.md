# Credits & Attribution

## Data Source & Analysis

**Author**: R.S. Taylor

**Citation**:
> Taylor, R.S. (2026). *Epstein Financial Forensics: Automated forensic financial reconstruction from 1.48 million DOJ EFTA documents.* GitHub. https://github.com/randallscott25-star/epstein-forensic-finance

**Repository**: https://github.com/randallscott25-star/epstein-forensic-finance

**License**: [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/)

Under CC BY 4.0, you are free to share and adapt this material for any purpose, provided appropriate credit is given. This visualization project satisfies that requirement through this file, the README, and the in-app About panel.

---

## Visualization

**Author**: pyjama-llama
**Repository**: https://github.com/pyjama-llama/epstein-forensic-finance
**License**: MIT (covers visualization code only — not the underlying data)

---

## Visualization Tools

| Tool | Author | License |
|---|---|---|
| [D3.js](https://d3js.org) | Mike Bostock & Observable | BSD-3-Clause |
| [Fuse.js](https://fusejs.io) | Kiro Risk | Apache-2.0 |
| [Vite](https://vitejs.dev) | Evan You & Vite contributors | MIT |
| [Inter](https://rsms.me/inter/) | Rasmus Andersson | SIL Open Font License |
| [IBM Plex Mono](https://www.ibm.com/plex/) | IBM | SIL Open Font License |

---

## Methodology Note

Wire transfers are categorized into four confidence tiers:

- **`verified_wires`** — Directly sourced from official court exhibits (Exhibits A–E). Highest confidence.
- **`audited_PROVEN`** — Forensically audited with multiple corroborating sources. High confidence.
- **`audited_STRONG`** — Supported by strong evidence but some inference involved. Medium-high confidence.
- **`audited_MODERATE`** — Moderate confidence. Included for completeness; treat with appropriate skepticism.

The visualization makes this distinction visible through edge styling (solid/dashed/dotted lines and color coding).

---

## Disclaimer

This project is for informational and educational purposes only.
It visualizes documented financial transactions sourced from public records and forensic audits.
No legal conclusions are drawn, stated, or implied.
