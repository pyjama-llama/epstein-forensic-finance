/**
 * Analytics Dashboard — Entry Point
 * Loads graph data, populates KPI cards, and initializes chart modules.
 * Each chart is wrapped in safeRender() so one failure does not break the page.
 *
 * Named analytics-init.js (not analytics.js) to avoid ad-blocker interference.
 */
import { safeRender } from './charts/chartUtils.js';
import { renderTopEntitiesBar } from './charts/TopEntitiesBar.js';
import { renderArrowDotPlot } from './charts/ArrowDotPlot.js';
import { renderFlowByYear } from './charts/FlowByYear.js';
import { renderEntitySmallMultiples } from './charts/EntitySmallMultiples.js';
import { renderEntityDetails } from './charts/EntityDetailsPane.js';

async function main() {
    console.log('[Analytics] main() started');

    // ── Load data using Vite's compile-time BASE_URL ────────────────────────
    let graph;
    try {
        const url = import.meta.env.BASE_URL + 'src/data/graph.json';
        console.log('[Analytics] Fetching:', url);
        const res = await fetch(url);
        console.log('[Analytics] Fetch status:', res.status);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        graph = await res.json();
        console.log('[Analytics] Data loaded — nodes:', graph.nodes.length, 'edges:', graph.edges.length);
    } catch (err) {
        console.error('[Analytics] Failed to load graph data:', err);
        const el = document.getElementById('analytics-main');
        if (el) {
            el.innerHTML = `
                <div style="text-align:center;padding:60px;color:var(--text-muted)">
                    <div style="font-size:28px;margin-bottom:12px">⚠</div>
                    <div>Could not load graph.json</div>
                    <div style="font-size:11px;margin-top:8px">Run: <code>npm run preprocess</code></div>
                </div>`;
        }
        return;
    }

    const { nodes, edges, meta } = graph;

    // ── KPI Cards ────────────────────────────────────────────────────────────
    const fmt = n => {
        if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
        if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
        if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
        return `$${n.toFixed(0)}`;
    };

    document.getElementById('kpi-total-flow').textContent = fmt(meta.totalFlow);
    document.getElementById('kpi-entities').textContent = meta.totalNodes;
    document.getElementById('kpi-transactions').textContent = meta.totalTransactions;
    document.getElementById('kpi-date-range').textContent =
        `${meta.dateRange.min.slice(0, 4)}–${meta.dateRange.max.slice(0, 4)}`;
    console.log('[Analytics] KPI cards populated');

    // ── Render Charts ────────────────────────────────────────────────────────
    safeRender(renderTopEntitiesBar, '#chart-top-entities', nodes);
    safeRender(renderArrowDotPlot, '#chart-arrow-dot', nodes);
    safeRender(renderFlowByYear, '#chart-flow-year', graph);

    // ── Chart 4 Orchestration (Toggle + Details Pane) ────────────────────────
    let smallMultiplesMode = 'month';
    let smallMultiplesYMode = 'shared'; // 'shared' or 'independent'

    const btnMonth = document.getElementById('btn-group-month');
    const btnYear = document.getElementById('btn-group-year');
    const btnSharedY = document.getElementById('btn-group-shared-y');
    const btnIndepY = document.getElementById('btn-group-indep-y');
    const detailsPane = document.getElementById('entity-details-pane');

    const renderMultiples = () => {
        safeRender(renderEntitySmallMultiples, '#chart-small-multiples', graph, {
            mode: smallMultiplesMode,
            independentY: smallMultiplesYMode === 'independent',
            onEntityClick: (entityName) => {
                detailsPane.style.display = 'block';
                safeRender(renderEntityDetails, '#entity-details-content', entityName, graph, () => {
                    detailsPane.style.display = 'none';
                });
            }
        });
    };

    renderMultiples();

    if (btnSharedY && btnIndepY) {
        btnSharedY.addEventListener('click', () => {
            if (smallMultiplesYMode === 'shared') return;
            smallMultiplesYMode = 'shared';
            btnSharedY.style.background = 'var(--border)';
            btnSharedY.style.color = 'var(--text-bright)';
            btnSharedY.style.fontWeight = '500';
            btnIndepY.style.background = 'transparent';
            btnIndepY.style.color = 'var(--text-secondary)';
            btnIndepY.style.fontWeight = '400';
            renderMultiples();
        });

        btnIndepY.addEventListener('click', () => {
            if (smallMultiplesYMode === 'independent') return;
            smallMultiplesYMode = 'independent';
            btnIndepY.style.background = 'var(--border)';
            btnIndepY.style.color = 'var(--text-bright)';
            btnIndepY.style.fontWeight = '500';
            btnSharedY.style.background = 'transparent';
            btnSharedY.style.color = 'var(--text-secondary)';
            btnSharedY.style.fontWeight = '400';
            renderMultiples();
        });
    }

    if (btnMonth && btnYear) {
        btnMonth.addEventListener('click', () => {
            if (smallMultiplesMode === 'month') return;
            smallMultiplesMode = 'month';
            btnMonth.style.background = 'var(--border)';
            btnMonth.style.color = 'var(--text-bright)';
            btnMonth.style.fontWeight = '500';
            btnYear.style.background = 'transparent';
            btnYear.style.color = 'var(--text-secondary)';
            btnYear.style.fontWeight = '400';
            renderMultiples();
        });

        btnYear.addEventListener('click', () => {
            if (smallMultiplesMode === 'year') return;
            smallMultiplesMode = 'year';
            btnYear.style.background = 'var(--border)';
            btnYear.style.color = 'var(--text-bright)';
            btnYear.style.fontWeight = '500';
            btnMonth.style.background = 'transparent';
            btnMonth.style.color = 'var(--text-secondary)';
            btnMonth.style.fontWeight = '400';
            renderMultiples();
        });
    }

    console.log('[Analytics] ✅ All charts rendered.');
}

main().catch(err => {
    console.error('[Analytics] Fatal:', err);
    const el = document.getElementById('analytics-main');
    if (el) {
        el.innerHTML =
            `<div style="color:var(--tier-moderate);text-align:center;padding:80px">
                <p style="font-size:18px;font-weight:600">Failed to load data</p>
                <p style="font-size:14px;margin-top:8px;color:var(--text-muted)">${err.message}</p>
            </div>`;
    }
});
