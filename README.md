# Epstein Financial Network — Forensic Visualization

An interactive, searchable network graph of documented wire transfers in the Jeffrey Epstein financial network. Built for forensic analysis and public transparency.

> **Live site**: [pyjama-llama.github.io/epstein-forensic-finance](https://pyjama-llama.github.io/epstein-forensic-finance/)

![Network visualization screenshot](https://raw.githubusercontent.com/pyjama-llama/epstein-forensic-finance/main/docs/preview.png)

---

## What This Shows

This visualization maps **$557,952,981** in documented wire transfers across **141 entities** and **382 transactions** from approximately 2009–2019. Entities include individuals, shell companies, law firms, trusts, and financial institutions connected to Jeffrey Epstein.

The data has been categorized by confidence level:

| Color | Source Tier | What it means |
|---|---|---|
| **Solid cyan** | `verified_wires` | Directly from official court exhibits (Exhibits A–E) |
| **Dashed green** | `audited_PROVEN` | Forensically audited — high confidence |
| **Dashed gold** | `audited_STRONG` | Strong supporting evidence |
| **Dotted orange** | `audited_MODERATE` | Moderate confidence, flagged for further review |

---

## How to Use the Visualization

| Action | Result |
|---|---|
| `⌘K` or click search bar | Search any entity by name |
| **Single click** a node | Highlight all direct connections |
| **Double-click** a node | Open full detail panel (inflow, outflow, transactions) |
| **Scroll** | Zoom in/out — more labels appear at higher zoom |
| **Drag** | Pan around the graph |
| **Filter panel** (left) | Filter by tier, exhibit, amount range, date range, bank involvement |
| **Reset** button | Clear all filters |

### Reading the graph
- **Node size** = total money flow through that entity (bigger = more money)
- **Edge thickness** = transaction amount (log scale)
- **Arrow direction** = money flows FROM → TO
- **Edge style** = data confidence tier (see table above)
- Multiple transactions between the same two entities are collapsed into one edge — click it to see individual transactions

---

## Data Attribution

This visualization is built on data from the **[pyjama-llama/epstein-wire-data](https://github.com/pyjama-llama)** dataset.

See [CREDITS.md](CREDITS.md) for full attribution details.

---

## Tech Stack

| Tool | Purpose |
|---|---|
| [D3.js v7](https://d3js.org) | Force-directed graph engine, zoom, SVG rendering |
| [Fuse.js](https://fusejs.io) | Client-side fuzzy search |
| [Vite](https://vitejs.dev) | Build tooling and dev server |
| Vanilla JS + CSS | No framework — the viz is the product |

---

## Running Locally

```bash
# Clone the repo
git clone https://github.com/pyjama-llama/epstein-forensic-finance.git
cd epstein-forensic-finance

# Install dependencies
npm install

# Generate the graph data from raw JSON
npm run preprocess

# Start the dev server
npm run dev
# → http://localhost:5173/epstein-forensic-finance/
```

### Build for production

```bash
npm run build
# Output in /dist — ready to deploy to any static host
```

---

## Project Structure

```
epstein-forensic-finance/
├── data/                    # Raw wire transfer data (JSON)
├── scripts/
│   ├── aliases.js           # Entity name canonicalization map
│   └── preprocess.js        # Data pipeline → src/data/graph.json
├── src/
│   ├── graph/ForceGraph.js  # D3 force simulation + render engine
│   ├── ui/                  # Search, filters, detail panels, KPI bar
│   ├── state/store.js       # Reactive state (no framework)
│   └── styles/main.css      # Dark forensic design system
└── index.html
```

---

## Disclaimer

This project visualizes documented financial transactions from court records and forensic audits. Data accuracy varies by source tier (shown visually). No legal conclusions are drawn or implied. All transactions shown are sourced from public records or independently audited datasets.

---

## License

This visualization code is released under the **MIT License**. See [LICENSE](LICENSE) for details.

Data is subject to the original dataset's license — see [CREDITS.md](CREDITS.md).
