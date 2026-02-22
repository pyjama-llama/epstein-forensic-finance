# Credits & Attribution

## Data Source

The wire transfer data used in this visualization is sourced from the forensic financial investigation dataset:

**Repository**: [Link to original repo — update this]
**Author**: [Original author name — update this]
**License**: [License name — check the original repo's LICENSE file]

This project is a derivative visualization built on top of that dataset.
If you are the original data author and would like different attribution or have concerns,
please open an issue or contact the maintainer.

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
