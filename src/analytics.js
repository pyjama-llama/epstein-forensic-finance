/**
 * Analytics Dashboard — Entry Point
 * Loads graph.json and initializes all chart modules.
 */
import * as d3 from 'd3';
import { renderTopEntitiesBar } from './charts/TopEntitiesBar.js';
import { renderArrowDotPlot } from './charts/ArrowDotPlot.js';
import { renderFlowByYear } from './charts/FlowByYear.js';
import { renderVoronoiBubbleMap } from './charts/VoronoiBubbleMap.js';

const DATA_URL = import.meta.env.BASE_URL + 'src/data/graph.json';

async function init() {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error(`Failed to load graph data: ${res.status}`);
    const data = await res.json();

    const { nodes, edges, meta } = data;

    // ── Populate Summary KPIs ───────────────────────────────────────────
    const fmtM = (n) => n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : `$${(n / 1e6).toFixed(1)}M`;

    document.getElementById('kpi-total-flow').textContent = fmtM(meta.totalFlow);
    document.getElementById('kpi-entities').textContent = meta.totalNodes.toLocaleString();
    document.getElementById('kpi-transactions').textContent = meta.totalTransactions.toLocaleString();
    document.getElementById('kpi-date-range').textContent =
        `${meta.dateRange.min.slice(0, 4)}–${meta.dateRange.max.slice(0, 4)}`;

    // ── Render Charts ───────────────────────────────────────────────────
    renderTopEntitiesBar('#chart-top-entities', nodes);
    renderArrowDotPlot('#chart-net-flow', nodes);
    renderFlowByYear('#chart-flow-year', edges);
    renderVoronoiBubbleMap('#chart-voronoi', nodes);
}

init().catch(err => {
    console.error('[Analytics]', err);
    document.getElementById('analytics-main').innerHTML =
        `<div style="color:var(--tier-moderate);text-align:center;padding:80px">
            <p style="font-size:18px;font-weight:600">Failed to load data</p>
            <p style="font-size:14px;margin-top:8px;color:var(--text-muted)">${err.message}</p>
        </div>`;
});
