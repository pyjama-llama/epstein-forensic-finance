/**
 * Arrow Dot Plot — Net Flow
 * Diverging horizontal dot plot with directional arrows showing
 * whether each entity is a net source (money out) or net sink (money in).
 */
import * as d3 from 'd3';

export function renderArrowDotPlot(selector, nodes) {
    const container = document.querySelector(selector);
    if (!container) return;

    // Compute net flow: positive = net receiver, negative = net sender
    const data = nodes
        .map(n => ({
            label: n.label,
            totalIn: n.totalIn || 0,
            totalOut: n.totalOut || 0,
            netFlow: (n.totalIn || 0) - (n.totalOut || 0),
        }))
        .filter(d => Math.abs(d.netFlow) > 1000) // Filter out tiny entities
        .sort((a, b) => b.netFlow - a.netFlow)
        .slice(0, 30); // Top 30 by magnitude

    // Dimensions
    const margin = { top: 8, right: 80, bottom: 24, left: 220 };
    const width = container.clientWidth || 900;
    const rowHeight = 24;
    const height = data.length * rowHeight + margin.top + margin.bottom;

    container.style.minHeight = height + 'px';

    const svg = d3.select(selector)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`);

    // Scale — diverging centered at 0
    const maxAbs = d3.max(data, d => Math.abs(d.netFlow));
    const x = d3.scaleLinear()
        .domain([-maxAbs, maxAbs])
        .range([margin.left, width - margin.right]);

    const y = d3.scaleBand()
        .domain(data.map(d => d.label))
        .range([margin.top, height - margin.bottom])
        .padding(0.3);

    const centerX = x(0);

    // Zero line
    svg.append('line')
        .attr('x1', centerX)
        .attr('x2', centerX)
        .attr('y1', margin.top)
        .attr('y2', height - margin.bottom)
        .attr('stroke', 'var(--border-light)')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,4');

    // Arrow lines (from center to dot)
    svg.selectAll('.arrow-line')
        .data(data)
        .join('line')
        .attr('class', 'arrow-line')
        .attr('x1', centerX)
        .attr('x2', d => x(d.netFlow))
        .attr('y1', d => y(d.label) + y.bandwidth() / 2)
        .attr('y2', d => y(d.label) + y.bandwidth() / 2)
        .attr('stroke', d => d.netFlow >= 0 ? 'var(--tier-proven)' : 'var(--tier-moderate)')
        .attr('stroke-width', 2)
        .attr('opacity', 0.7);

    // Dots at the end of each arrow
    svg.selectAll('.dot')
        .data(data)
        .join('circle')
        .attr('cx', d => x(d.netFlow))
        .attr('cy', d => y(d.label) + y.bandwidth() / 2)
        .attr('r', 5)
        .attr('fill', d => d.netFlow >= 0 ? 'var(--tier-proven)' : 'var(--tier-moderate)');

    // Entity labels (left)
    svg.selectAll('.dot-label')
        .data(data)
        .join('text')
        .attr('class', 'dot-label')
        .attr('x', margin.left - 8)
        .attr('y', d => y(d.label) + y.bandwidth() / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'end')
        .attr('fill', 'var(--text-secondary)')
        .text(d => d.label.length > 28 ? d.label.slice(0, 26) + '…' : d.label);

    // Value labels
    const fmtM = (n) => {
        const abs = Math.abs(n);
        const sign = n >= 0 ? '+' : '-';
        if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
        if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`;
        return `${sign}$${(abs / 1e3).toFixed(0)}K`;
    };

    svg.selectAll('.dot-value')
        .data(data)
        .join('text')
        .attr('class', 'bar-value')
        .attr('x', d => x(d.netFlow) + (d.netFlow >= 0 ? 10 : -10))
        .attr('y', d => y(d.label) + y.bandwidth() / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', d => d.netFlow >= 0 ? 'start' : 'end')
        .text(d => fmtM(d.netFlow));

    // Axis labels
    svg.append('text')
        .attr('x', margin.left)
        .attr('y', height - 4)
        .attr('fill', 'var(--text-muted)')
        .attr('font-size', 11)
        .text('← Net Sender');

    svg.append('text')
        .attr('x', width - margin.right)
        .attr('y', height - 4)
        .attr('fill', 'var(--text-muted)')
        .attr('font-size', 11)
        .attr('text-anchor', 'end')
        .text('Net Receiver →');
}
