import * as d3 from 'd3';
import { fmtAmount } from './chartUtils.js';

/**
 * Chart 4: Entity Small Multiples (Shaded Area Charts)
 * Shows the individual volume timelines for the top 9 entities, revealing
 * how they build up and disperse funds without visual overlapping.
 */
export function renderEntitySmallMultiples(selector, data) {
    const container = document.querySelector(selector);
    if (!container) return;

    // 1. Data Processing
    const entityVolumeMap = new Map();
    const globalTimeline = new Map();
    let minYear = Infinity;
    let maxYear = -Infinity;

    // Extract all transactions and assign to source entity
    data.edges.forEach(edge => {
        if (!edge.transactions) return;

        edge.transactions.forEach(tx => {
            if (!tx.date || !tx.amount) return;
            const yearMatch = tx.date.match(/\d{4}/);
            if (!yearMatch) return;

            const year = parseInt(yearMatch[0], 10);
            const amount = parseFloat(tx.amount);
            if (year < 1990 || year > 2030) return;

            minYear = Math.min(minYear, year);
            maxYear = Math.max(maxYear, year);

            const source = edge.source;
            if (!entityVolumeMap.has(source)) {
                entityVolumeMap.set(source, { label: source, totalVolume: 0, years: new Map() });
            }

            const entityData = entityVolumeMap.get(source);
            entityData.totalVolume += amount;

            if (!entityData.years.has(year)) {
                entityData.years.set(year, 0);
            }
            entityData.years.set(year, entityData.years.get(year) + amount);
        });
    });

    if (entityVolumeMap.size === 0) {
        container.innerHTML = `<div class="p-8 text-center" style="color:var(--text-muted)">No timeline data available</div>`;
        return;
    }

    // Sort entities by total volume and take the top 9
    const topEntities = Array.from(entityVolumeMap.values())
        .sort((a, b) => b.totalVolume - a.totalVolume)
        .slice(0, 9);

    // Ensure our global scale covers 2008 (NPA event) if possible, but match FlowByYear bounds
    minYear = Math.min(minYear, 2008);

    // Define the full continuous timeline array for padding
    const timelineDomain = d3.range(minYear, maxYear + 1);

    // Format data for D3: pad missing years with 0
    let globalMaxYearVolume = 0;

    const multiplesData = topEntities.map(entity => {
        const paddedYears = timelineDomain.map(year => {
            const vol = entity.years.get(year) || 0;
            globalMaxYearVolume = Math.max(globalMaxYearVolume, vol);
            return { year, volume: vol };
        });
        return {
            label: entity.label,
            totalVolume: entity.totalVolume,
            timeline: paddedYears
        };
    });

    // 2. Clear Container and Setup Grid
    container.innerHTML = '';
    // Make sure container is a grid (should happen via CSS, but enforcing here)
    Object.assign(container.style, {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '32px 24px'
    });

    // We will append a wrapper div for each small multiple
    const multiplesContainers = d3.select(selector)
        .selectAll('.small-multiple')
        .data(multiplesData)
        .join('div')
        .attr('class', 'small-multiple')
        .style('position', 'relative')
        .style('min-height', '180px');

    // 3. Global Scales (Shared across all multiples to ensure fair visual comparison)
    // We get the width dynamically from the first rendered grid item
    const margin = { top: 30, right: 10, bottom: 20, left: 50 };
    // Hardcode height for small multiples to ensure uniformity
    const height = 180;
    const innerHeight = height - margin.top - margin.bottom;

    // Use a ResizeObserver in a real app, but for now we calculate width after mounting empty divs
    const firstNode = multiplesContainers.node();
    const width = firstNode ? firstNode.clientWidth : 300;
    const innerWidth = Math.max(width - margin.left - margin.right, 100);

    const x = d3.scaleLinear()
        .domain([minYear, maxYear])
        .range([0, innerWidth]);

    const y = d3.scaleLinear()
        // Domain uses global max so the Y axis is identical for all 9 charts
        .domain([0, globalMaxYearVolume])
        .range([innerHeight, 0])
        .nice();

    // Generators
    const area = d3.area()
        .x(d => x(d.year))
        .y0(innerHeight)
        .y1(d => y(d.volume))
        .curve(d3.curveMonotoneX); // Smooth interpolation

    const line = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.volume))
        .curve(d3.curveMonotoneX);

    // 4. Draw Individual Charts
    const svgs = multiplesContainers.append('svg')
        .attr('width', '100%')
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('overflow', 'visible'); // Allow tooltips/y-axis to spill safely

    const g = svgs.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Draw Title (Entity Name) & Total Volume
    svgs.append('text')
        .attr('x', 0)
        .attr('y', 14)
        .attr('fill', 'var(--text-bright)')
        .attr('font-size', '13px')
        .attr('font-weight', '600')
        .text(d => d.label.length > 28 ? d.label.slice(0, 26) + '…' : d.label);

    svgs.append('text')
        .attr('x', width)
        .attr('y', 14)
        .attr('text-anchor', 'end')
        .attr('fill', 'var(--text-secondary)')
        .attr('font-size', '12px')
        .attr('font-family', 'var(--font-mono)')
        .text(d => `Total: ${fmtAmount(d.totalVolume)}`);

    // Draw Axes
    // X-axis (only show min and max year to keep it clean)
    g.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x).tickValues([minYear, maxYear]).tickFormat(d3.format('d')))
        .call(axis => axis.select('.domain').attr('stroke', 'var(--border)'))
        .call(axis => axis.selectAll('line').remove()) // remove ticks
        .call(axis => axis.selectAll('text').style('fill', 'var(--text-secondary)').attr('font-size', 11));

    // Y-axis (only show 3 ticks max)
    g.append('g')
        .call(d3.axisLeft(y).ticks(3).tickFormat(d => `$${d / 1e6}M`))
        .call(axis => axis.select('.domain').remove())
        .call(axis => axis.selectAll('line')
            .attr('x2', innerWidth)
            .attr('stroke', 'var(--border)')
            .attr('stroke-dasharray', '2,2')
        )
        .call(axis => axis.selectAll('text')
            .style('fill', 'var(--text-secondary)')
            .attr('font-size', 11)
            .attr('font-family', 'var(--font-mono)')
        );

    // Setup an SVG clipPath for the sweeping animation
    const clipId = (d, i) => `clip-sweep-${i}`;
    g.append('clipPath')
        .attr('id', (d, i) => clipId(d, i))
        .append('rect')
        .attr('width', 0) // Start closed
        .attr('height', innerHeight)
        .attr('x', 0)
        .attr('y', 0);

    // Draw Area (Shaded Fill)
    g.append('path')
        .attr('d', d => area(d.timeline))
        .attr('fill', 'var(--text-muted)')
        .attr('opacity', 0.2)
        .attr('clip-path', (d, i) => `url(#${clipId(d, i)})`);

    // Draw Line (Bold Top Stroke)
    g.append('path')
        .attr('d', d => line(d.timeline))
        .attr('fill', 'none')
        .attr('stroke', 'var(--text-bright)')
        .attr('stroke-width', 2)
        .attr('clip-path', (d, i) => `url(#${clipId(d, i)})`);

    // 5. Hover Interactions (Crosshair / Point highlighting)
    const hoverLines = g.append('line')
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .attr('stroke', 'var(--text-secondary)')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3,3')
        .style('opacity', 0)
        .style('pointer-events', 'none');

    const hoverDots = g.append('circle')
        .attr('r', 4)
        .attr('fill', 'var(--bg-base)')
        .attr('stroke', 'var(--text-bright)')
        .attr('stroke-width', 2)
        .style('opacity', 0)
        .style('pointer-events', 'none');

    const hoverLabels = g.append('text')
        .attr('fill', 'var(--text-bright)')
        .attr('font-size', 12)
        .attr('font-family', 'var(--font-mono)')
        .attr('font-weight', 500)
        .style('opacity', 0)
        .style('pointer-events', 'none');

    // Invisible overlay for catching mouse events
    g.append('rect')
        .attr('class', 'overlay')
        .attr('width', innerWidth)
        .attr('height', innerHeight)
        .attr('fill', 'transparent')
        .on('mousemove', function (event, d) {
            // Find closest year
            const [mouseX] = d3.pointer(event);
            const rawYear = x.invert(mouseX);
            // Snap to closest integer year
            const activeYear = Math.round(rawYear);

            // Constrain bounds
            if (activeYear < minYear || activeYear > maxYear) return;

            // Update crosshair line
            // We use standard selection iteration because multiple svgs exist,
            // but we only want to update the crosshair inside the *hovered* multiple.
            // Actually, we can update ALL multiples simultaneously to show synchronous timelines!
            svgs.selectAll('line').filter((_, i, nodes) => nodes[i] === hoverLines.nodes()[0] || nodes[i].getAttribute('stroke-dasharray') === '3,3')
                .attr('x1', x(activeYear))
                .attr('x2', x(activeYear))
                .style('opacity', 0.6);

            hoverDots
                .attr('cx', x(activeYear))
                .attr('cy', parentD => {
                    const yearData = parentD.timeline.find(t => t.year === activeYear);
                    return y(yearData ? yearData.volume : 0);
                })
                .style('opacity', 1);

            hoverLabels
                .text(parentD => {
                    const yearData = parentD.timeline.find(t => t.year === activeYear);
                    return yearData && yearData.volume > 0 ? fmtAmount(yearData.volume) : '';
                })
                .attr('x', x(activeYear))
                .attr('y', parentD => {
                    const yearData = parentD.timeline.find(t => t.year === activeYear);
                    return y(yearData ? yearData.volume : 0) - 10;
                })
                .attr('text-anchor', activeYear > maxYear - 2 ? 'end' : 'start')
                .style('opacity', 1);

            // Dim everything except the currently hovered SVG
            // event.currentTarget is the `<rect class="overlay">`. We need its parent SVG
            const currentSvgNode = this.parentNode.parentNode;
            svgs.style('opacity', function () {
                return this === currentSvgNode ? 1 : 0.4;
            });
        })
        .on('mouseleave', function () {
            hoverLines.style('opacity', 0);
            hoverDots.style('opacity', 0);
            hoverLabels.style('opacity', 0);
            svgs.style('opacity', 1);
        });

    // 6. Animation Sequence Setup
    const playAnimation = () => {
        g.selectAll('clipPath rect')
            .transition()
            .duration(1200)
            .ease(d3.easeCubicOut)
            // Stagger multiple appearance slightly
            .delay((d, i) => i * 100)
            .attr('width', innerWidth);
    };

    // 7. Intersection Observer for Scroll Trigger
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    playAnimation();
                    observer.disconnect();
                }
            });
        }, { threshold: 0.15 }); // Trigger when 15% visible

        observer.observe(container);
    } else {
        playAnimation();
    }
}
