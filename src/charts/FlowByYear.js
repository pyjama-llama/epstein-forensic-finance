import * as d3 from 'd3';
import { createChartSvg, fmtAmount } from './chartUtils.js';

/**
 * Chart 3: Flow by Year (Annotated Timeline)
 * A clean, neutral bar chart representing total network volume over time,
 * overlaid with historical annotations to provide data journalism context.
 */
export function renderFlowByYear(selector, data) {
    const container = document.querySelector(selector);
    if (!container) return;

    // 1. Process Data
    const yearMap = new Map();
    let minYear = Infinity;
    let maxYear = -Infinity;

    // Extract all transactions from edges
    data.edges.forEach(edge => {
        if (!edge.transactions) return;

        edge.transactions.forEach(tx => {
            if (!tx.date || !tx.amount) return;
            const yearMatch = tx.date.match(/\d{4}/);
            if (!yearMatch) return;

            const year = parseInt(yearMatch[0], 10);
            const amount = parseFloat(tx.amount);

            if (year < 1990 || year > 2030) return; // Sanity check

            minYear = Math.min(minYear, year, 2008); // Ensure 2008 is plotted for annotations
            maxYear = Math.max(maxYear, year);

            if (!yearMap.has(year)) {
                yearMap.set(year, { year, total: 0 });
            }

            yearMap.get(year).total += amount;
        });
    });

    if (yearMap.size === 0) {
        container.innerHTML = `<div class="p-8 text-center" style="color:var(--text-muted)">No timeline data available</div>`;
        return;
    }

    // Ensure we have a continuous block of years
    const finalData = [];
    for (let y = minYear; y <= maxYear; y++) {
        if (yearMap.has(y)) {
            finalData.push(yearMap.get(y));
        } else {
            finalData.push({ year: y, total: 0 });
        }
    }

    // Historical Annotations defined by the user's dataset
    const annotations = [
        { year: 2008, text: "2008: Non-prosecution agreement" },
        { year: 2013, text: "2013: JPMorgan cuts ties" },
        { year: 2014, text: "2014: Deutsche Bank relationship begins" },
        { year: 2019, text: "2019: Arrest and death" }
    ];

    // 2. Setup SVG
    const width = container.clientWidth;
    const height = container.clientHeight || 460;
    const margin = { top: 60, right: 30, bottom: 40, left: 60 }; // extra top margin for annotations

    const { g: svg, innerWidth, innerHeight } = createChartSvg(selector, margin, height);

    // 3. Setup Scales
    const x = d3.scaleBand()
        .domain(finalData.map(d => d.year))
        .range([0, innerWidth])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, d3.max(finalData, d => d.total)])
        .range([innerHeight, 0])
        .nice();

    // 4. Draw Axes
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

    // 5. Tooltip
    const tooltip = d3.select(selector).append('div')
        .attr('class', 'chart-tooltip');

    const plotArea = svg.append('g');

    // 6. Draw Bars (Neutral styling)
    const rects = plotArea.selectAll('rect.vol-bar')
        .data(finalData)
        .join('rect')
        .attr('class', 'vol-bar')
        .attr('x', d => x(d.year))
        .attr('y', innerHeight)
        .attr('height', 0)
        .attr('width', x.bandwidth())
        .attr('rx', 2)
        .attr('fill', 'var(--text-muted)') // Neutral semantic coloring
        .attr('opacity', 0.6)
        .style('cursor', 'pointer')
        .on('mouseenter', (event, d) => {
            d3.select(event.currentTarget).attr('opacity', 1).attr('fill', 'var(--text-secondary)');

            tooltip.classed('visible', true).html(`
                <div class="tt-label">${d.year} Volume</div>
                <div class="tt-value">${fmtAmount(d.total)}</div>
            `)
                .style('left', (event.offsetX + 16) + 'px')
                .style('top', (event.offsetY - 20) + 'px');
        })
        .on('mouseleave', (event) => {
            d3.select(event.currentTarget).attr('opacity', 0.6).attr('fill', 'var(--text-muted)');
            tooltip.classed('visible', false);
        });

    // 7. Draw Annotations (Lines and Text)
    // We filter annotations to only those that fall within our active data timeline
    const activeAnnotations = annotations.filter(a => a.year >= minYear && a.year <= maxYear);

    const annoGroup = svg.append('g').attr('class', 'annotations').attr('opacity', 0); // Fade in later

    // Vertical dashed lines
    annoGroup.selectAll('.anno-line')
        .data(activeAnnotations)
        .join('line')
        .attr('class', 'anno-line')
        .attr('x1', d => x(d.year) + x.bandwidth() / 2)
        .attr('x2', d => x(d.year) + x.bandwidth() / 2)
        .attr('y1', -20) // Extend slightly above the chart
        .attr('y2', innerHeight)
        .attr('stroke', 'var(--text-secondary)')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4,4')
        .attr('opacity', 0.5);

    // Annotation text labels
    // We alternate Y positions slightly so close labels (like 2013 and 2014) don't overlap as easily
    annoGroup.selectAll('.anno-text')
        .data(activeAnnotations)
        .join('text')
        .attr('class', 'anno-text')
        .attr('x', d => {
            return d.year === maxYear ? x(d.year) + x.bandwidth() / 2 - 6 : x(d.year) + x.bandwidth() / 2 + 6;
        })
        .attr('y', (d, i) => -30 + (i % 2) * -16)
        .attr('text-anchor', d => d.year === maxYear ? 'end' : 'start')
        .attr('fill', 'var(--text-bright)')
        .attr('font-size', 12)
        .attr('font-weight', 500)
        .text(d => d.text);

    // 8. Animation Sequence
    const playAnimation = () => {
        // Bar sweep animation
        const t = svg.transition()
            .duration(800)
            .ease(d3.easeCubicOut);

        rects.transition(t)
            .delay((d, i) => i * 40)
            .attr('y', d => y(d.total))
            .attr('height', d => Math.max(0, innerHeight - y(d.total)));

        // Fade in annotations after bars grow
        annoGroup.transition().delay(800).duration(600).attr('opacity', 1);
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
