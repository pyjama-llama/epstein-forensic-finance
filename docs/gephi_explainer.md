# Gephi Algorithms — Explainer & Forensic Insights

This document explains each Gephi algorithm we use, what setting to change, and most importantly — **what insight it reveals** about the Epstein financial network.

---

## Layout Algorithms (Node Positioning)

### ForceAtlas 2
**What it does:** Simulates a gravitational physics engine. Connected nodes attract each other; unconnected nodes repel. Heavier edges (more money) pull nodes closer.

**Recommended Settings:**
| Setting | Value | Why |
|---|---|---|
| Scaling | 10–50 | Lower = tighter clusters |
| LinLog mode | ✅ On | Uses logarithmic attraction — prevents mega-nodes from devouring small ones |
| Prevent Overlap | ✅ On | Stops nodes from sitting on top of each other |
| Gravity | 1.0 | Pulls everything gently toward center |
| Edge Weight Influence | 1.0 | Let our log-scaled weights work |

**Run:** Click Run, wait 30–60 seconds until the graph stops moving, then click Stop.

**🔍 The Insight:** Reveals **financial clusters** — entities that trade heavily with each other form tight islands. Shell companies that appear unrelated by name will cluster together if they share the same money pipeline.

---

### Yifan Hu
**What it does:** A faster, more spread-out alternative to ForceAtlas. Uses a multi-level approach that produces cleaner, more evenly spaced layouts.

**Settings:** Leave defaults. Set `Optimal Distance` to 100–200.

**🔍 The Insight:** Better for seeing the **overall topology** — is this network a star (one hub), a chain, or multiple distinct sub-networks? Yifan Hu will make the answer visually obvious.

---

### Fruchterman-Reingold
**What it does:** Classic force-directed layout. More uniform spacing than ForceAtlas.

**Settings:** Set `Area` to 10000, `Gravity` to 10.

**🔍 The Insight:** Good for publication-quality screenshots where you want even spacing.

---

## Statistical Algorithms (Analytical Metrics)

### Modularity (Community Detection)
**Where:** Statistics Panel → Network Overview → Modularity → Run

**What it does:** Mathematically partitions the network into "communities" — groups of nodes that transact more with each other than with outsiders.

**🔍 The So What:** This is the single most powerful forensic tool. It **defeats the shell company strategy**. Even if Epstein named 10 companies completely random things (Jeepers Inc., Gratitude America, The Haze Trust), Modularity will color them all the same if they function as a single financial circulatory system. It tells investigators exactly which entities act as a coordinated unit — regardless of their legal names.

**How to apply it:**
1. Run Modularity in Statistics
2. Go to Appearance → Nodes → Color → Partition → `modularity_class`
3. Click Apply

---

### PageRank
**Where:** Statistics Panel → Network Overview → PageRank → Run

**What it does:** The same algorithm Google uses to rank web pages. It measures recursive influence — a node is important if it receives money from other important nodes.

**🔍 The So What:** Reveals the **true power centers** of the network. A node might only have 3 connections, but if those 3 connections are to the biggest hubs in the network, it has enormous PageRank. This often reveals hidden intermediaries that appear minor but are structurally critical.

**How to apply it:**
1. Run PageRank in Statistics
2. Go to Appearance → Nodes → Size → Ranking → `pageranks`
3. Set Min: 10, Max: 100 → Apply

---

### Betweenness Centrality
**Where:** Statistics Panel → Network Overview → Avg. Path Length → Run (this calculates Betweenness automatically)

**What it does:** Measures how many shortest paths between all node pairs pass through a given node.

**🔍 The So What:** Identifies **chokepoints** — the accounts that act as bridges between otherwise disconnected parts of the network. If law enforcement froze the highest Betweenness node, money could no longer flow between the billionaire donors and the shell corporations. These are the nodes that, if removed, would shatter the network into disconnected pieces.

**How to apply it:**
1. Run Avg. Path Length in Statistics
2. Go to Appearance → Nodes → Size → Ranking → `betweenesscentrality`
3. Set Min: 10, Max: 100 → Apply

---

### Eigenvector Centrality
**Where:** Statistics Panel → Network Overview → Eigenvector Centrality → Run

**What it does:** Similar to PageRank but undirected. Measures how connected a node is to other highly-connected nodes.

**🔍 The So What:** Reveals the **inner circle** — the small group of entities that form the dense core of the financial network. High eigenvector centrality = you are deeply embedded in the club.

---

## Essential Gephi UI Steps

### Show Node Labels
1. At the bottom of the Graph window, find the tiny toolbar
2. Click the **T** icon (Show Node Labels)
3. Use the **A** slider next to it to resize labels
4. In the dropdown, select **Node Size** so bigger nodes get bigger labels

### Size Nodes by Money Flow
1. Go to **Appearance** panel (top-left)
2. Click **Nodes** → **Size** icon (circles) → **Ranking**
3. Choose `totalIn` or `totalOut` from the dropdown
4. Set Min Size: 10, Max Size: 100
5. Click **Apply**

### Color Nodes by Community
1. Run **Modularity** first (Statistics panel)
2. Go to **Appearance** → **Nodes** → **Color** icon (palette) → **Partition**
3. Choose `modularity_class`
4. Click **Apply**

### Export Layout for Web App
1. Once you are happy with the layout, go to **File → Export → Graph file**
2. Choose `.gexf` format
3. Name it descriptively (e.g., `layout_forceatlas2.gexf`)
4. Drop it into `src/data/layouts/` in the web project
