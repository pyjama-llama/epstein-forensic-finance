/**
 * Top Entities Bar Chart
 * Horizontal bar chart ranking the top 20 entities by total financial flow.
 */
import * as d3 from 'd3';

export function renderTopEntitiesBar(selector, nodes) {
    const container = document.querySelector(selector);
    if (!container) return;

    // Compute total flow per entity and sort
    const data = nodes
        .map(n => ({
            label: n.label,
            totalFlow: (n.totalIn || 0) + (n.totalOut || 0),
        }))
        .sort((a, b) => b.totalFlow - a.totalFlow)
        .slice(0, 20);

    // Dimensions
    const margin = { top: 8, right: 80, bottom: 24, left: 220 };
    const width = container.clientWidth || 900;
    const barHeight = 26;
    const height = data.length * barHeight + margin.top + margin.bottom;

    container.style.minHeight = height + 'px';

    const svg = d3.select(selector)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`);

    // Scales
    const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.totalFlow)])
        .range([margin.left, width - margin.right]);

    const y = d3.scaleBand()
        .domain(data.map(d => d.label))
        .range([margin.top, height - margin.bottom])
        .padding(0.25);

    // Bars
    svg.selectAll('.bar')
        .data(data)
        .join('rect')
        .attr('class', 'bar')
        .attr('x', margin.left)
        .attr('y', d => y(d.label))
        .attr('width', d => x(d.totalFlow) - margin.left)
        .attr('height', y.bandwidth())
        .attr('fill', 'var(--tier-verified)')
        .attr('opacity', 0.8)
        .attr('rx', 2);

    // Entity name labels (left)
    svg.selectAll('.bar-label')
        .data(data)
        .join('text')
        .attr('class', 'bar-label')
        .attr('x', margin.left - 8)
        .attr('y', d => y(d.label) + y.bandwidth() / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'end')
        .text(d => d.label.length > 28 ? d.label.slice(0, 26) + '…' : d.label);

    // Value labels (right of bar)
    const fmtM = (n) => n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${(n / 1e3).toFixed(0)}K`;

    svg.selectAll('.bar-value')
        .data(data)
        .join('text')
        .attr('class', 'bar-value')
        .attr('x', d => x(d.totalFlow) + 6)
        .attr('y', d => y(d.label) + y.bandwidth() / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'start')
        .text(d => fmtM(d.totalFlow));

    // X axis
    svg.append('g')
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(5).tickFormat(d => `$${d / 1e6}M`))
        .call(g => g.select('.domain').remove());
}
