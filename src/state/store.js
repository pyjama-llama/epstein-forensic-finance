// src/state/store.js
// Lightweight reactive state — no framework required
// All UI state lives here; components subscribe and re-render on change.

const DEFAULT_STATE = {
    // Graph data (set once after graph.json loads)
    graph: null,        // { nodes, edges, meta }

    // Filters
    tiers: new Set(['verified_wires', 'audited_PROVEN', 'audited_STRONG', 'audited_MODERATE']),
    exhibits: new Set(['A', 'B', 'C', 'D', 'E']),
    amountMin: 0,       // percentile 0–100 of log scale
    amountMax: 100,
    dateFrom: null,     // 'YYYY' string or null
    dateTo: null,
    bankFilter: 'all',  // 'all' | 'yes' | 'no'

    // Interaction
    selectedNodeId: null,     // currently clicked node
    highlightedNodeId: null,  // from search hover
    searchQuery: '',

    // Derived (computed from filters + interaction)
    visibleNodeIds: null,     // Set<string>
    visibleEdgeIds: null,     // Set<string>
};

let _state = { ...DEFAULT_STATE };
const _listeners = new Set();

export const store = {
    get: () => _state,

    set(partial) {
        _state = { ..._state, ...partial };
        this._notify();
    },

    subscribe(fn) {
        _listeners.add(fn);
        return () => _listeners.delete(fn); // returns unsubscribe fn
    },

    _notify() {
        _listeners.forEach(fn => fn(_state));
    },
};

// ── Derived state computation ────────────────────────────────────────────────

export function computeVisibleGraph(state) {
    const { graph, tiers, exhibits, amountMin, amountMax, dateFrom, dateTo, bankFilter } = state;
    if (!graph) return { visibleEdgeIds: new Set(), visibleNodeIds: new Set() };

    const { nodes, edges, meta } = graph;

    // Convert percentile sliders to actual log-scale amounts
    const logMin = Math.log10(Math.max(meta.minEdgeAmount, 1));
    const logMax = Math.log10(meta.maxEdgeAmount);
    const logRange = logMax - logMin;
    const amountThresholdMin = Math.pow(10, logMin + (amountMin / 100) * logRange);
    const amountThresholdMax = Math.pow(10, logMin + (amountMax / 100) * logRange);

    const fromYear = dateFrom ? parseInt(dateFrom) : null;
    const toYear = dateTo ? parseInt(dateTo) : null;

    const visibleEdgeIds = new Set();

    edges.forEach(edge => {
        // Tier filter — edge passes if ANY of its source tiers is in the active set
        const tierPass = edge.sourceTiers.some(t => tiers.has(t));
        if (!tierPass) return;

        // Exhibit filter — edge passes if exhibits is empty OR any exhibit matches
        const exhibitPass = edge.exhibits.length === 0 || edge.exhibits.some(e => exhibits.has(e));
        if (!exhibitPass) return;

        // Amount filter
        if (edge.totalAmount < amountThresholdMin) return;
        if (edge.totalAmount > amountThresholdMax && amountMax < 100) return;

        // Date filter — check if any transaction falls within range
        if (fromYear || toYear) {
            const hasDateInRange = edge.transactions.some(tx => {
                if (!tx.date) return false;
                const year = parseInt(tx.date.slice(0, 4));
                if (fromYear && year < fromYear) return false;
                if (toYear && year > toYear) return false;
                return true;
            });
            if (!hasDateInRange) return;
        }

        // Bank filter
        if (bankFilter === 'yes' && !edge.bankInvolved) return;
        if (bankFilter === 'no' && edge.bankInvolved) return;

        visibleEdgeIds.add(edge.id);
    });

    // A node is visible if it has at least one visible edge
    const visibleNodeIds = new Set();
    edges.forEach(edge => {
        if (visibleEdgeIds.has(edge.id)) {
            visibleNodeIds.add(edge.source);
            visibleNodeIds.add(edge.target);
        }
    });

    return { visibleEdgeIds, visibleNodeIds };
}
