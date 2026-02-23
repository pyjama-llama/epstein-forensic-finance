import * as d3 from 'd3';
import { createChartSvg, fmtAmount } from './chartUtils.js';

/**
 * Chart 3: Flow by Year
 * A stacked bar chart showing transaction volume over time, colored by source entity tier.
 */
export function renderFlowByYear(selector, data) {
    const container = document.querySelector(selector);
    if (!container) return;

    // 1. Process Data
    // We need to group transaction amounts by Year, then stack by Tier
    const yearMap = new Map();
    const tiers = ['Verified', 'Proven', 'Strong', 'Moderate'];

    // Initialize the tier colors from CSS variables
    const tierColors = {
        'Verified': 'var(--tier-verified)',
        'Proven': 'var(--tier-proven)',
        'Strong': 'var(--tier-strong)',
        'Moderate': 'var(--tier-moderate)'
    };

    let minYear = Infinity;
    let maxYear = -Infinity;

    // Find nodes by ID to map them to their tiers later
    const nodeTiers = new Map();
    data.nodes.forEach(n => nodeTiers.set(n.id, n.tier));

    // Extract all transactions from edges
    data.edges.forEach(edge => {
        if (!edge.transactions) return;

        const sourceTier = nodeTiers.get(edge.source) || 'Moderate';

        edge.transactions.forEach(tx => {
            if (!tx.date || !tx.amount) return;
            const yearMatch = tx.date.match(/\d{4}/);
            if (!yearMatch) return;

            const year = parseInt(yearMatch[0], 10);
            const amount = parseFloat(tx.amount);

            if (year < 1990 || year > 2030) return; // Sanity check

            minYear = Math.min(minYear, year);
            maxYear = Math.max(maxYear, year);

            if (!yearMap.has(year)) {
                const initialObj = { year, total: 0 };
                tiers.forEach(t => initialObj[t] = 0);
                yearMap.set(year, initialObj);
            }

            const yearData = yearMap.get(year);
            yearData[sourceTier] += amount;
            yearData.total += amount;
        });
    });

    if (yearMap.size === 0) {
        container.innerHTML = `<div class="p-8 text-center" style="color:var(--text-muted)">No timeline data available</div>`;
        return;
    }

    // Ensure we have a continuous block of years even for empty ones
    const finalData = [];
    for (let y = minYear; y <= maxYear; y++) {
        if (yearMap.has(y)) {
            finalData.push(yearMap.get(y));
        } else {
            const emptyObj = { year: y, total: 0 };
            tiers.forEach(t => emptyObj[t] = 0);
            finalData.push(emptyObj);
        }
    }

    // 2. Setup SVG
    const width = container.clientWidth;
    const height = container.clientHeight || 460;
    const margin = { top: 30, right: 30, bottom: 40, left: 60 };

    const { svg } = createChartSvg(selector, margin, height);
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // 3. Setup Scales
    const x = d3.scaleBand()
        .domain(finalData.map(d => d.year))
        .range([0, innerWidth])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, d3.max(finalData, d => d.total)])
        .range([innerHeight, 0])
        .nice();

    // 4. Setup Stack
    const stack = d3.stack()
        .keys(tiers)
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);

    const series = stack(finalData);

    // 5. Draw Axes
    // X-axis
    svg.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x).tickValues(x.domain().filter(d => d % 2 === 0))) // Show every 2nd year
        .call(g => g.select('.domain').remove())
        .call(g => g.selectAll('line').attr('stroke', 'var(--border)'))
        .call(g => g.selectAll('text').style('fill', 'var(--text-secondary)').attr('font-size', 13));

    // Y-axis
    svg.append('g')
        .call(d3.axisLeft(y).ticks(5).tickFormat(d => `$${d / 1e6}M`))
        .call(g => g.select('.domain').remove())
        .call(g => g.selectAll('line')
            .attr('x2', innerWidth)
            .attr('stroke', 'var(--border)')
            .attr('stroke-dasharray', '2,2')
        )
        .call(g => g.selectAll('text').style('fill', 'var(--text-secondary)').attr('font-size', 13));

    // 6. Tooltip and Hover interactions
    const tooltip = d3.select(selector).append('div')
        .attr('class', 'chart-tooltip');

    const plotArea = svg.append('g');

    // 7. Draw Stacked Bars with Animation
    const groups = plotArea.selectAll('g.layer')
        .data(series)
        .join('g')
        .attr('class', 'layer')
        .attr('fill', d => tierColors[d.key]);

    // Initial state: Rectangles start at Y=innerHeight with 0 height
    const rects = groups.selectAll('rect')
        .data(d => d.map(item => {
            item.key = d.key; // pass down the tier name to the rect data
            return item;
        }))
        .join('rect')
        .attr('x', d => x(d.data.year))
        .attr('y', innerHeight)
        .attr('height', 0)
        .attr('width', x.bandwidth())
        .attr('rx', 2)
        .style('cursor', 'pointer')
        .on('mouseenter', (event, d) => {
            // Drop opacity of all OTHER bars in the chart to highlight this column
            plotArea.selectAll('rect').attr('opacity', 0.3);

            // Re-highlight the hovered YEAR column across all tiers
            plotArea.selectAll('rect')
                .filter(r => r.data.year === d.data.year)
                .attr('opacity', 1);

            const val = d[1] - d[0];

            tooltip.classed('visible', true).html(`
                <div class="tt-label">${d.data.year} Transaction Volume</div>
                <div class="tt-value">${fmtAmount(d.data.total)}</div>
                <div class="tt-detail">
                    <span style="color:${tierColors[d.key]}">●</span> ${d.key} Tier: ${fmtAmount(val)} 
                    <br/>
                    <span style="color:var(--text-muted); font-size: 11px">(${Math.round((val / d.data.total) * 100)}% of year)</span>
                </div>
            `)
                .style('left', (event.offsetX + 16) + 'px')
                .style('top', (event.offsetY - 20) + 'px');
        })
        .on('mouseleave', () => {
            plotArea.selectAll('rect').attr('opacity', 1);
            tooltip.classed('visible', false);
        });

    // 8. Animation Sequence
    const playAnimation = () => {
        // Sweep animation: grows upwards, staggered chronologically from left to right
        const t = svg.transition()
            .duration(800)
            .ease(d3.easeCubicOut);

        rects.transition(t)
            // Delay based on index in array (which is sorted chronologically)
            .delay((d, i) => i * 40)
            .attr('y', d => y(d[1]))
            .attr('height', d => Math.max(0, y(d[0]) - y(d[1])));
    };

    // 9. Intersection Observer Setup
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    playAnimation();
                    observer.disconnect();
                }
            });
        }, { threshold: 0.25 });

        observer.observe(container);
    } else {
        playAnimation();
    }
}
