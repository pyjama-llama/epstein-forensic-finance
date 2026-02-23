/**
 * Arrow Dot Plot (Dumbbell Chart)
 * Compares Total In vs Total Out for the top 15 entities.
 * Features a staggered "falling" D3 animation.
 * Adheres to neutral styling and typography rules.
 */
import * as d3 from 'd3';
import { fmtAmount, createChartSvg } from './chartUtils.js';

export function renderArrowDotPlot(selector, nodes) {
    const container = document.querySelector(selector);
    if (!container) return;

    // Filter and sort top 15 entities by totalFlow to keep it clean
    const data = nodes
        .map(n => ({
            label: n.label,
            totalIn: n.totalIn || 0,
            totalOut: n.totalOut || 0,
            totalFlow: (n.totalIn || 0) + (n.totalOut || 0)
        }))
        .sort((a, b) => b.totalFlow - a.totalFlow)
        .slice(0, 15);

    const margin = { top: 30, right: 60, bottom: 40, left: 220 };
    const rowHeight = 36;
    const totalHeight = data.length * rowHeight + margin.top + margin.bottom;

    const chart = createChartSvg(selector, { top: 0, right: 0, bottom: 0, left: 0 }, totalHeight);
    if (!chart) return;
    const { svg, width } = chart;

    // Find the max value between In and Out for the X domain
    const maxVal = d3.max(data, d => Math.max(d.totalIn, d.totalOut));

    // Linear scale on X axis
    const x = d3.scaleLinear()
        .domain([0, maxVal])
        .range([margin.left, width - margin.right]);

    const y = d3.scalePoint()
        .domain(data.map(d => d.label))
        .range([margin.top, totalHeight - margin.bottom])
        .padding(0.5);

    // Tooltip
    let tooltip = d3.select(container).select('.chart-tooltip');
    if (tooltip.empty()) {
        tooltip = d3.select(container).append('div').attr('class', 'chart-tooltip');
    }

    // Draw Y axis labels
    svg.selectAll('.y-label')
        .data(data)
        .join('text')
        .attr('class', 'y-label')
        .attr('x', margin.left - 16)
        .attr('y', d => y(d.label))
        .attr('dy', '0.32em')
        .attr('text-anchor', 'end')
        .attr('fill', 'var(--text-primary)')
        .attr('font-size', 13)
        .text(d => d.label.length > 28 ? d.label.slice(0, 26) + '…' : d.label);

    // Draw X axis
    svg.append('g')
        .attr('transform', `translate(0,${totalHeight - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(6).tickFormat(d => `$${d / 1e6}M`))
        .call(g => g.select('.domain').remove())
        .call(g => g.selectAll('line').attr('stroke', 'var(--border)'))
        .call(g => g.selectAll('text').attr('fill', 'var(--text-muted)').attr('font-size', 13));

    // Legend
    const legend = svg.append('g')
        .attr('transform', `translate(${margin.left}, 0)`);

    // In
    legend.append('circle').attr('cx', 0).attr('cy', 8).attr('r', 5).attr('fill', 'var(--text-primary)');
    legend.append('text').attr('x', 14).attr('y', 12).text('Total In').attr('fill', 'var(--text-secondary)').attr('font-size', 13);

    // Out
    legend.append('circle').attr('cx', 90).attr('cy', 8).attr('r', 5).attr('fill', 'var(--bg-base)').attr('stroke', 'var(--text-muted)').attr('stroke-width', 1.5);
    legend.append('text').attr('x', 104).attr('y', 12).text('Total Out').attr('fill', 'var(--text-secondary)').attr('font-size', 13);

    // Group for the animated elements
    const plotArea = svg.append('g');

    // Create a group for each entity to handle hover easily
    const rows = plotArea.selectAll('.row')
        .data(data)
        .join('g')
        .attr('class', 'row')
        .style('cursor', 'pointer')
        .on('mouseenter', (event, d) => {
            d3.select(event.currentTarget).select('.hover-bg').attr('opacity', 1);
            tooltip.classed('visible', true).html(`
                <div class="tt-label">${d.label}</div>
                <div class="tt-detail">Total In: <span style="color:var(--text-bright)">${fmtAmount(d.totalIn)}</span></div>
                <div class="tt-detail">Total Out: <span style="color:var(--text-bright)">${fmtAmount(d.totalOut)}</span></div>
                <div class="tt-detail">Net Flow: <span style="color:var(--text-muted)">${fmtAmount(Math.abs(d.totalIn - d.totalOut))} ${d.totalIn > d.totalOut ? 'Inbound' : 'Outbound'}</span></div>
            `)
                .style('left', (event.offsetX + 16) + 'px')
                .style('top', (event.offsetY - 10) + 'px');
        })
        .on('mouseleave', (event) => {
            d3.select(event.currentTarget).select('.hover-bg').attr('opacity', 0);
            tooltip.classed('visible', false);
        });

    // Invisible hover background for easy interaction
    rows.append('rect')
        .attr('class', 'hover-bg')
        .attr('x', margin.left)
        .attr('y', d => y(d.label) - rowHeight / 2)
        .attr('width', width - margin.left - margin.right)
        .attr('height', rowHeight)
        .attr('fill', 'var(--bg-elevated)')
        .attr('opacity', 0);

    // D3 Transition for the falling animation requested by user
    const t = svg.transition().duration(900).ease(d3.easeCubicOut);

    // Connecting Lines
    rows.append('line')
        .attr('x1', d => x(d.totalOut))
        .attr('x2', d => x(d.totalIn))
        .attr('y1', 0)
        .attr('y2', 0)
        .attr('stroke', 'var(--border-light)')
        .attr('stroke-width', 2)
        .attr('opacity', 0)
        .transition(t)
        .delay((d, i) => i * 40)
        .attr('y1', d => y(d.label))
        .attr('y2', d => y(d.label))
        .attr('opacity', 1);

    // OUT Dots (Hollow, represented with stroke)
    rows.append('circle')
        .attr('cx', d => x(d.totalOut))
        .attr('cy', 0)
        .attr('r', 5)
        .attr('fill', 'var(--bg-base)')
        .attr('stroke', 'var(--text-muted)')
        .attr('stroke-width', 1.5)
        .attr('opacity', 0)
        .transition(t)
        .delay((d, i) => i * 40)
        .attr('cy', d => y(d.label))
        .attr('opacity', 1);

    // IN Dots (Solid)
    rows.append('circle')
        .attr('cx', d => x(d.totalIn))
        .attr('cy', 0)
        .attr('r', 5)
        .attr('fill', 'var(--text-primary)')
        .attr('opacity', 0)
        .transition(t)
        .delay((d, i) => i * 40)
        .attr('cy', d => y(d.label))
        .attr('opacity', 1);
}
