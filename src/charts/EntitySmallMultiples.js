import * as d3 from 'd3';
import { fmtAmount } from './chartUtils.js';

/**
 * Chart 4: Entity Small Multiples (Shaded Area Charts)
 * Shows the individual volume timelines for the top network entities.
 */
export function renderEntitySmallMultiples(selector, data, options = {}) {
    const mode = options.mode || 'month';
    const onEntityClick = options.onEntityClick || (() => { });

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
            // Parse YYYY-MM
            const match = tx.date.match(/^(\d{4})-(\d{2})/);
            if (!match) return;

            const year = parseInt(match[1], 10);
            const monthStr = `${match[1]}-${match[2]}`; // e.g. "2008-05"
            const amount = parseFloat(tx.amount);
            if (year < 1990 || year > 2030) return;

            minYear = Math.min(minYear, year);
            maxYear = Math.max(maxYear, year);

            const source = edge.source;
            if (!entityVolumeMap.has(source)) {
                entityVolumeMap.set(source, { label: source, totalVolume: 0, months: new Map() });
            }

            const entityData = entityVolumeMap.get(source);
            entityData.totalVolume += amount;

            if (!entityData.months.has(monthStr)) {
                entityData.months.set(monthStr, 0);
            }
            entityData.months.set(monthStr, entityData.months.get(monthStr) + amount);
        });
    });

    if (entityVolumeMap.size === 0) {
        container.innerHTML = `<div class="p-8 text-center" style="color:var(--text-muted)">No timeline data available</div>`;
        return;
    }

    // Sort entities by total volume and take the top 12
    const topEntities = Array.from(entityVolumeMap.values())
        .sort((a, b) => b.totalVolume - a.totalVolume)
        .slice(0, 12);

    // Find precise bounds strictly based on top 12 entities' actual transactions
    // This removes the massive 2008 empty-space gap by snapping to the exact network activity.
    let minDate = new Date('2030-01-01');
    let maxDate = new Date('1990-01-01');

    topEntities.forEach(entity => {
        for (const monthStr of entity.months.keys()) {
            const [y, m] = monthStr.split('-');
            const d = new Date(parseInt(y), parseInt(m) - 1, 1);
            if (d < minDate) minDate = d;
            if (d > maxDate) maxDate = d;
        }
    });

    const startYear = minDate.getFullYear();
    const endYear = maxDate.getFullYear();

    // Define the full continuous timeline array for padding
    const timelineDomain = [];
    if (mode === 'month') {
        let current = new Date(startYear, minDate.getMonth(), 1);
        const end = new Date(endYear, maxDate.getMonth(), 1);
        while (current <= end) {
            const y = current.getFullYear();
            const m = current.getMonth() + 1;
            const mm = m < 10 ? `0${m}` : `${m}`;
            timelineDomain.push(`${y}-${mm}`);
            current.setMonth(current.getMonth() + 1);
        }
    } else {
        // year mode
        for (let y = startYear; y <= endYear; y++) {
            timelineDomain.push(y.toString()); // 'YYYY'
        }
    }

    // Format data for D3: pad missing periods with 0
    let globalMaxVolume = 0;

    const parseDateMonth = d3.timeParse('%Y-%m');
    const parseDateYear = d3.timeParse('%Y');

    const multiplesData = topEntities.map(entity => {
        const paddedTimeline = timelineDomain.map(timeStr => {
            let vol = 0;
            if (mode === 'month') {
                vol = entity.months.get(timeStr) || 0;
            } else {
                // In year mode, timeStr is 'YYYY'. We sum all 12 months in that year.
                for (let m = 1; m <= 12; m++) {
                    const mm = m < 10 ? `0${m}` : `${m}`;
                    vol += entity.months.get(`${timeStr}-${mm}`) || 0;
                }
            }
            globalMaxVolume = Math.max(globalMaxVolume, vol);
            return {
                dateStr: timeStr,
                date: mode === 'month' ? parseDateMonth(timeStr) : parseDateYear(timeStr),
                volume: vol
            };
        });
        return {
            label: entity.label,
            totalVolume: entity.totalVolume,
            timeline: paddedTimeline
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

    const xDomainStart = mode === 'month'
        ? new Date(startYear, minDate.getMonth(), 1)
        : new Date(startYear, 0, 1);

    const xDomainEnd = mode === 'month'
        ? new Date(endYear, maxDate.getMonth(), 1)
        : new Date(endYear, 0, 1);

    const x = d3.scaleTime()
        .domain([xDomainStart, xDomainEnd])
        .range([0, innerWidth]);

    const y = d3.scaleLinear()
        // Domain uses global max so the Y axis is identical for all 12 charts
        // Multiply max by 1.1 to give a 10% visual padding so sharp spikes don't clip the bounding box
        .domain([0, globalMaxVolume * 1.1])
        .range([innerHeight, 0])
        .nice();

    // Generators
    const activeCurve = mode === 'month' ? d3.curveStep : d3.curveMonotoneX;

    const area = d3.area()
        .x(d => x(d.date))
        .y0(innerHeight)
        .y1(d => y(d.volume))
        .curve(activeCurve);

    const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.volume))
        .curve(activeCurve);

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
    // X-axis (only show min and max bounds to keep it clean, but use scaleTime)
    g.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x).tickValues([xDomainStart, xDomainEnd]).tickFormat(d3.timeFormat('%Y')))
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
    g.append('line')
        .attr('class', 'hover-line')
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .attr('stroke', 'var(--text-secondary)')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3,3')
        .style('opacity', 0)
        .style('pointer-events', 'none');

    g.append('circle')
        .attr('class', 'hover-dot')
        .attr('r', 4)
        .attr('fill', 'var(--bg-base)')
        .attr('stroke', 'var(--text-bright)')
        .attr('stroke-width', 2)
        .style('opacity', 0)
        .style('pointer-events', 'none');

    g.append('text')
        .attr('class', 'hover-label')
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
        .style('cursor', 'pointer')
        .on('click', function (event, d) {
            onEntityClick(d.label);
        })
        .on('mousemove', function (event, d) {
            // Find closest date
            const [mouseX] = d3.pointer(event);
            const activeDate = x.invert(mouseX);

            // Snap to closest month in our timeline
            const bisectDate = d3.bisector(d => d.date).left;

            // Map the parsed Date to the closest 'YYYY-MM' matching object in `timeline`
            // d in this context is the overlay. We need the actual multiple data to find the nearest point
            svgs.each(function (parentD) {
                // The exact same operation handles the hover state globally to sync all SVGs
                const i = bisectDate(parentD.timeline, activeDate, 1);
                const d0 = parentD.timeline[i - 1];
                const d1 = parentD.timeline[i];
                let activeData = d0;
                if (d1 && (activeDate - d0.date > d1.date - activeDate)) {
                    activeData = d1;
                }

                const snapDate = activeData.date;
                const snapStr = activeData.dateStr; // For label YYYY-MM
                const vol = activeData.volume;

                const currentSvgNode = this;
                const isHoveredSvg = (currentSvgNode === event.currentTarget.parentNode.parentNode);

                // Handle Crosshair
                d3.select(this).selectAll('line.hover-line')
                    // Just selecting the existing hover line (which we need to add class 'hover-line' to below!)
                    .attr('x1', x(snapDate))
                    .attr('x2', x(snapDate))
                    .style('opacity', 0.6);

                d3.select(this).selectAll('circle.hover-dot')
                    .attr('cx', x(snapDate))
                    .attr('cy', y(vol))
                    .style('opacity', 1);

                d3.select(this).selectAll('text.hover-label')
                    .text(vol > 0 ? `${snapStr}: ${fmtAmount(vol)}` : '')
                    .attr('x', x(snapDate))
                    .attr('y', y(vol) - 10)
                    .attr('text-anchor', snapDate.getFullYear() > maxYear - 2 ? 'end' : 'start')
                    .style('opacity', 1);

                d3.select(this).style('opacity', isHoveredSvg ? 1 : 0.4);
            });
        })
        .on('mouseleave', function () {
            svgs.selectAll('.hover-line').style('opacity', 0);
            svgs.selectAll('.hover-dot').style('opacity', 0);
            svgs.selectAll('.hover-label').style('opacity', 0);
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
