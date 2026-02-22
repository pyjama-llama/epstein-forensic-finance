// src/main.js
// App bootstrap — loads graph data, instantiates all modules, wires them together

import { store, computeVisibleGraph } from './state/store.js';
import { ForceGraph } from './graph/ForceGraph.js';
import { SearchBar } from './ui/SearchBar.js';
import { NodePanel } from './ui/NodePanel.js';
import { KPIBar } from './ui/KPIBar.js';
import { FilterPanel } from './ui/FilterPanel.js';
import { initLayoutSwitcher } from './ui/LayoutSwitcher.js';

async function main() {
    // ── 1. Load processed graph data ─────────────────────────────────────────
    let graph;
    try {
        const res = await fetch(new URL('./data/graph.json', import.meta.url));
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        graph = await res.json();
    } catch (e) {
        document.getElementById('graph-loading').innerHTML = `
      <div style="color:var(--tier-moderate);text-align:center">
        <div style="font-size:24px;margin-bottom:8px">⚠</div>
        <div>graph.json not found.</div>
        <div style="font-size:11px;margin-top:8px;color:var(--text-muted)">Run: <code>npm run preprocess</code></div>
      </div>
    `;
        return;
    }

    // ── 2. Hydrate store ──────────────────────────────────────────────────────
    const initial = computeVisibleGraph({ ...store.get(), graph });
    store.set({ graph, ...initial });

    // ── 3. Instantiate modules ────────────────────────────────────────────────
    const nodePanel = new NodePanel();
    const kpiBar = new KPIBar();
    const searchBar = new SearchBar({
        onSelect: (node) => {
            forceGraph.selectNode(node.id, true);
        },
        onClear: () => {
            forceGraph.clearSelection();
        },
    });
    searchBar.load(graph.nodes);

    const filterPanel = new FilterPanel(graph);

    const forceGraph = new ForceGraph(document.getElementById('graph-svg'), {
        onNodeClick: (node) => {
            // Single click: just highlight — detail panel stays closed
            // (NodePanel.show is called on double-click below)
            if (!node) {
                nodePanel.close();
            }
        },
        onNodeDblClick: (node) => {
            // Double-click: open full detail panel
            nodePanel.show(node, graph);
        },
        onEdgeClick: (edge) => {
            // Edge click: show a lightweight edge tooltip (future Phase 4: edge panel)
        },
    });

    forceGraph.load(graph);

    // ── Layout Switcher ──────────────────────────────────────────────────────
    initLayoutSwitcher('#topbar-right', forceGraph);

    // ── 4. Toolbar buttons ────────────────────────────────────────────────────
    document.getElementById('btn-fit').addEventListener('click', () => forceGraph.fitToView());
    document.getElementById('btn-reset').addEventListener('click', () => {
        forceGraph.resetView();
        forceGraph.clearSelection();
        nodePanel.close();
        document.getElementById('filter-clear').click();
    });

    // ── Info modal (About / attribution) ──────────────────────────────────────
    const infoModal = document.getElementById('info-modal');
    const openModal = () => infoModal.classList.remove('hidden');
    const closeModal = () => infoModal.classList.add('hidden');
    document.getElementById('btn-info').addEventListener('click', openModal);
    document.getElementById('info-close').addEventListener('click', closeModal);
    infoModal.addEventListener('click', (e) => { if (e.target === infoModal) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !infoModal.classList.contains('hidden')) closeModal(); });

    // ── 5. Subscribe to store — sync graph visibility to filters ─────────────
    store.subscribe((state) => {
        const { graph, visibleNodeIds, visibleEdgeIds } = state;
        if (!graph) return;

        // Update graph visibility
        forceGraph.updateVisibility(visibleNodeIds, visibleEdgeIds);

        // Update KPI counters
        kpiBar.update(graph, visibleNodeIds, visibleEdgeIds);
    });

    // Initial KPI render
    kpiBar.update(graph, initial.visibleNodeIds, initial.visibleEdgeIds);
}

main();
