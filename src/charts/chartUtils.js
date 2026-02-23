/**
 * Chart Utilities — Shared module for all analytics charts.
 * Provides error boundaries, formatting, responsive SVG creation, and constants.
 */
import * as d3 from 'd3';

// ── Colorblind-safe tier palette (Wong) ──────────────────────────────────────
export const TIER_COLORS = {
    verified_wires: '#56b4e9',
    audited_PROVEN: '#009e73',
    audited_STRONG: '#e69f00',
    audited_MODERATE: '#cc79a7',
};

export const TIER_LABELS = {
    verified_wires: 'Verified',
    audited_PROVEN: 'Proven',
    audited_STRONG: 'Strong',
    audited_MODERATE: 'Moderate',
};

// ── Format helpers ───────────────────────────────────────────────────────────
export function fmtAmount(n) {
    const abs = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`;
    if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(0)}K`;
    return `${sign}$${abs.toFixed(0)}`;
}

// ── Safe Render (Error Boundary) ─────────────────────────────────────────────
/**
 * Wraps a chart render function in a try/catch.
 * If it throws, a graceful error message replaces the chart container.
 */
export function safeRender(renderFn, selector, ...args) {
    try {
        renderFn(selector, ...args);
    } catch (err) {
        console.error(`[Chart Error] ${selector}:`, err);
        const container = document.querySelector(selector);
        if (container) {
            container.innerHTML =
                '<div class="chart-error"><span class="chart-error-icon">⚠</span><span>Chart unavailable</span></div>';
        }
    }
}

// ── Responsive SVG creation ──────────────────────────────────────────────────
/**
 * Creates an SVG element properly sized to its container.
 * Returns { svg, g, width, height, innerWidth, innerHeight }.
 */
export function createChartSvg(selector, margin, minHeight) {
    const container = document.querySelector(selector);
    if (!container) return null;

    const rect = container.getBoundingClientRect();
    const width = Math.max(rect.width || 800, 300);
    const height = minHeight || Math.max(rect.height || 400, 200);

    container.innerHTML = '';
    container.style.minHeight = height + 'px';

    const svg = d3.select(selector)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('role', 'img');

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    return {
        svg, g, width, height,
        innerWidth: width - margin.left - margin.right,
        innerHeight: height - margin.top - margin.bottom,
    };
}

// ── Flatten all transactions with dates ──────────────────────────────────────
export function extractDatedTransactions(edges) {
    const dated = [];
    let nullCount = 0;
    let totalCount = 0;

    edges.forEach(edge => {
        (edge.transactions || []).forEach(tx => {
            totalCount++;
            if (tx.date) {
                dated.push({
                    date: new Date(tx.date),
                    amount: tx.amount || 0,
                    tier: tx.source || 'verified_wires',
                    source: edge.source,
                    target: edge.target,
                });
            } else {
                nullCount++;
            }
        });
    });

    dated.sort((a, b) => a.date - b.date);
    return { dated, nullCount, totalCount };
}
