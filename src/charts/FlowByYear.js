/**
 * Flow By Year — Stacked Bar Chart
 * Vertical stacked bars showing total flow per year, colored by source tier.
 */
import * as d3 from 'd3';

const TIER_COLORS = {
    verified_wires: '#56b4e9',
    audited_PROVEN: '#009e73',
    audited_STRONG: '#e69f00',
    audited_MODERATE: '#cc79a7',
};

export function renderFlowByYear(selector, edges) {
    const container = document.querySelector(selector);
    if (!container) return;

    // Aggregate transactions by year × tier
    const yearTierMap = new Map();

    edges.forEach(edge => {
        (edge.transactions || []).forEach(tx => {
            if (!tx.date) return;
            const year = tx.date.slice(0, 4);
            const tier = tx.source || 'unknown';
            const key = `${year}|${tier}`;
            yearTierMap.set(key, (yearTierMap.get(key) || 0) + (tx.amount || 0));
        });
    });

    // Build structured data
    const tiers = Object.keys(TIER_COLORS);
    const yearsSet = new Set();
    yearTierMap.forEach((_, key) => yearsSet.add(key.split('|')[0]));
    const years = [...yearsSet].sort();

    const tableData = years.map(year => {
        const row = { year };
        tiers.forEach(t => {
            row[t] = yearTierMap.get(`${year}|${t}`) || 0;
        });
        return row;
    });

    // Stack
    const stack = d3.stack().keys(tiers);
    const series = stack(tableData);

    // Dimensions
    const margin = { top: 8, right: 16, bottom: 36, left: 70 };
    const width = container.clientWidth || 500;
    const height = 350;

    const svg = d3.select(selector)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`);

    const x = d3.scaleBand()
        .domain(years)
        .range([margin.left, width - margin.right])
        .padding(0.3);

    const yMax = d3.max(series, s => d3.max(s, d => d[1]));
    const y = d3.scaleLinear()
        .domain([0, yMax])
        .nice()
        .range([height - margin.bottom, margin.top]);

    // Bars
    svg.selectAll('g.series')
        .data(series)
        .join('g')
        .attr('class', 'series')
        .attr('fill', d => TIER_COLORS[d.key] || '#666')
        .attr('opacity', 0.85)
        .selectAll('rect')
        .data(d => d)
        .join('rect')
        .attr('x', d => x(d.data.year))
        .attr('y', d => y(d[1]))
        .attr('height', d => y(d[0]) - y(d[1]))
        .attr('width', x.bandwidth())
        .attr('rx', 2);

    // X Axis
    svg.append('g')
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x))
        .call(g => g.select('.domain').remove());

    // Y Axis
    svg.append('g')
        .attr('transform', `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(5).tickFormat(d => `$${d / 1e6}M`))
        .call(g => g.select('.domain').remove());

    // Tier Legend
    const legend = svg.append('g')
        .attr('transform', `translate(${margin.left + 8}, ${margin.top + 4})`);

    const tierLabels = {
        verified_wires: 'Verified',
        audited_PROVEN: 'Proven',
        audited_STRONG: 'Strong',
        audited_MODERATE: 'Moderate',
    };

    tiers.forEach((tier, i) => {
        const g = legend.append('g')
            .attr('transform', `translate(${i * 100}, 0)`);
        g.append('rect')
            .attr('width', 10).attr('height', 10)
            .attr('rx', 2)
            .attr('fill', TIER_COLORS[tier]);
        g.append('text')
            .attr('x', 14).attr('y', 9)
            .attr('fill', 'var(--text-secondary)')
            .attr('font-size', 11)
            .text(tierLabels[tier] || tier);
    });
}
