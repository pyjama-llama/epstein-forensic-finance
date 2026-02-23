/**
 * Top Entities Bar Chart
 * Horizontal bar chart ranking the top 20 entities by total financial flow.
 * Hover tooltips with breakdown. FONT RULE: minimum 13px.
 */
import * as d3 from 'd3';
import { fmtAmount, createChartSvg } from './chartUtils.js';

export function renderTopEntitiesBar(selector, nodes) {
    const container = document.querySelector(selector);
    if (!container) return;

    const data = nodes
        .map(n => ({
            label: n.label,
            totalIn: n.totalIn || 0,
            totalOut: n.totalOut || 0,
            totalFlow: (n.totalIn || 0) + (n.totalOut || 0),
            degree: n.degree || 0,
        }))
        .sort((a, b) => b.totalFlow - a.totalFlow)
        .slice(0, 20);

    const margin = { top: 8, right: 90, bottom: 24, left: 220 };
    const barHeight = 28;
    const totalHeight = data.length * barHeight + margin.top + margin.bottom;

    const chart = createChartSvg(selector, { top: 0, right: 0, bottom: 0, left: 0 }, totalHeight);
    if (!chart) return;
    const { svg, width } = chart;

    const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.totalFlow)])
        .range([margin.left, width - margin.right]);

    const y = d3.scaleBand()
        .domain(data.map(d => d.label))
        .range([margin.top, totalHeight - margin.bottom])
        .padding(0.25);

    // Tooltip
    let tooltip = d3.select(container).select('.chart-tooltip');
    if (tooltip.empty()) {
        tooltip = d3.select(container).append('div').attr('class', 'chart-tooltip');
    }

    // Bars
    svg.selectAll('.bar')
        .data(data)
        .join('rect')
        .attr('class', 'bar')
        .attr('x', margin.left)
        .attr('y', d => y(d.label))
        .attr('width', d => Math.max(0, x(d.totalFlow) - margin.left))
        .attr('height', y.bandwidth())
        .attr('fill', 'var(--tier-verified)')
        .attr('opacity', 0.8)
        .attr('rx', 2)
        .style('cursor', 'pointer')
        .on('mouseenter', (event, d) => {
            d3.select(event.currentTarget).attr('opacity', 1);
            tooltip.classed('visible', true).html(`
                <div class="tt-label">${d.label}</div>
                <div class="tt-value">${fmtAmount(d.totalFlow)}</div>
                <div class="tt-detail">In: ${fmtAmount(d.totalIn)} · Out: ${fmtAmount(d.totalOut)} · ${d.degree} connections</div>
            `)
                .style('left', (event.offsetX + 16) + 'px')
                .style('top', (event.offsetY - 10) + 'px');
        })
        .on('mouseleave', (event) => {
            d3.select(event.currentTarget).attr('opacity', 0.8);
            tooltip.classed('visible', false);
        });

    // Entity name labels (left) — 13px
    svg.selectAll('.bar-label')
        .data(data)
        .join('text')
        .attr('class', 'bar-label')
        .attr('x', margin.left - 8)
        .attr('y', d => y(d.label) + y.bandwidth() / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'end')
        .attr('fill', 'var(--text-primary)')
        .attr('font-size', 13)
        .text(d => d.label.length > 28 ? d.label.slice(0, 26) + '…' : d.label);

    // Value labels (right of bar) — 13px
    svg.selectAll('.bar-value')
        .data(data)
        .join('text')
        .attr('class', 'bar-value')
        .attr('x', d => x(d.totalFlow) + 6)
        .attr('y', d => y(d.label) + y.bandwidth() / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'start')
        .attr('fill', 'var(--text-muted)')
        .attr('font-family', 'var(--font-mono)')
        .attr('font-size', 13)
        .text(d => fmtAmount(d.totalFlow));

    // X axis (bottom) — 13px
    svg.append('g')
        .attr('transform', `translate(0,${totalHeight - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(5).tickFormat(d => `$${d / 1e6}M`))
        .call(g => g.select('.domain').remove());
}
