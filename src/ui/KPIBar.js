// src/ui/KPIBar.js
// Updates the top KPI numbers based on current visible graph state

function fmtFlow(n) {
    if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n.toFixed(0)}`;
}

export class KPIBar {
    constructor() {
        this._nodes = document.getElementById('kpi-nodes');
        this._edges = document.getElementById('kpi-edges');
        this._flow = document.getElementById('kpi-flow');
        this._dates = document.getElementById('kpi-dates');
    }

    update(graph, visibleNodeIds, visibleEdgeIds) {
        const { nodes, edges, meta } = graph;

        const visibleNodes = visibleNodeIds
            ? nodes.filter(n => visibleNodeIds.has(n.id)).length
            : nodes.length;

        const visibleEdges = visibleEdgeIds
            ? edges.filter(e => visibleEdgeIds.has(e.id))
            : edges;

        const totalTxns = (Array.isArray(visibleEdges) ? visibleEdges : edges)
            .reduce((s, e) => s + e.transactionCount, 0);

        const totalFlow = (Array.isArray(visibleEdges) ? visibleEdges : edges)
            .reduce((s, e) => s + e.totalAmount, 0);

        const allNodes = visibleNodeIds ? nodes.length : null;
        const allEdgeCount = meta.totalTransactions;

        this._nodes.textContent = visibleNodeIds && visibleNodeIds.size < nodes.length
            ? `${visibleNodes}/${nodes.length}`
            : `${nodes.length}`;

        this._edges.textContent = visibleEdgeIds && visibleEdgeIds.size < edges.length
            ? `${totalTxns}/${allEdgeCount}`
            : `${meta.totalTransactions}`;

        this._flow.textContent = fmtFlow(totalFlow);

        this._dates.textContent = meta.dateRange.min && meta.dateRange.max
            ? `${meta.dateRange.min.slice(0, 4)}–${meta.dateRange.max.slice(0, 4)}`
            : '—';
    }
}
