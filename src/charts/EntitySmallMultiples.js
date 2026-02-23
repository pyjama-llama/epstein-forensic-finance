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

    // 1. Data Processing - Exact Transaction Level
    const entityVolumeMap = new Map();

    data.edges.forEach(edge => {
        if (!edge.transactions) return;

        edge.transactions.forEach(tx => {
            if (!tx.date || !tx.amount) return;
            const amount = parseFloat(tx.amount);
            const txDate = new Date(tx.date);
            if (isNaN(txDate)) return;

            const year = txDate.getFullYear();
            if (year < 1990 || year > 2030) return;

            const initEntity = (id) => {
                if (!entityVolumeMap.has(id)) {
                    entityVolumeMap.set(id, { label: id, grossVolume: 0, transactions: [] });
                }
            };

            const source = edge.source;
            const target = edge.target;

            initEntity(source);
            initEntity(target);

            // Source is sending money out: negative flow
            const sData = entityVolumeMap.get(source);
            sData.grossVolume += amount;
            sData.transactions.push({ date: txDate, amount: -amount });

            // Target is receiving money in: positive flow
            const tData = entityVolumeMap.get(target);
            tData.grossVolume += amount;
            tData.transactions.push({ date: txDate, amount: amount });
        });
    });

    if (entityVolumeMap.size === 0) {
        container.innerHTML = `<div class="p-8 text-center" style="color:var(--text-muted)">No timeline data available</div>`;
        return;
    }

    // Sort entities by gross volume and take the top 12
    const topEntities = Array.from(entityVolumeMap.values())
        .sort((a, b) => b.grossVolume - a.grossVolume)
        .slice(0, 12);

    // Find precise global date bounds across the exact transactions of the top 12
    let globalDomainMinDate = new Date('2030-01-01');
    let globalDomainMaxDate = new Date('1990-01-01');

    topEntities.forEach(entity => {
        entity.transactions.forEach(tx => {
            if (tx.date < globalDomainMinDate) globalDomainMinDate = tx.date;
            if (tx.date > globalDomainMaxDate) globalDomainMaxDate = tx.date;
        });
    });

    const startYear = globalDomainMinDate.getFullYear();
    const endYear = globalDomainMaxDate.getFullYear();

    // Format data for D3: calculate running balances chronologically
    let globalMaxBalance = -Infinity;
    let globalMinBalance = Infinity;

    const multiplesData = topEntities.map(entity => {
        // Sort chronologically. If identical date, put positive amounts (inflows) first to ensure the peak renders before the drop.
        entity.transactions.sort((a, b) => {
            const dateDiff = a.date - b.date;
            if (dateDiff !== 0) return dateDiff;
            return b.amount - a.amount;
        });

        let runningBalance = 0;
        let localMaxBalance = -Infinity;
        let localMinBalance = Infinity;

        const timeline = [];

        // Prepend starting point so graph extends to left bound
        timeline.push({ date: globalDomainMinDate, originalDate: globalDomainMinDate, balance: 0, volume: 0 });

        entity.transactions.forEach(tx => {
            runningBalance += tx.amount;

            globalMaxBalance = Math.max(globalMaxBalance, runningBalance);
            globalMinBalance = Math.min(globalMinBalance, runningBalance);
            localMaxBalance = Math.max(localMaxBalance, runningBalance);
            localMinBalance = Math.min(localMinBalance, runningBalance);

            timeline.push({
                date: tx.date,
                originalDate: tx.date,
                balance: runningBalance,
                volume: tx.amount
            });
        });

        // Append ending point so graph extends to right bound
        timeline.push({ date: globalDomainMaxDate, originalDate: globalDomainMaxDate, balance: runningBalance, volume: 0 });

        if (localMinBalance === Infinity) localMinBalance = 0;
        if (localMaxBalance === -Infinity) localMaxBalance = 0;

        return {
            label: entity.label,
            grossVolume: entity.grossVolume,
            localMinBalance,
            localMaxBalance,
            timeline
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

    const xDomainStart = globalDomainMinDate;
    const xDomainEnd = globalDomainMaxDate;

    const x = d3.scaleTime()
        .domain([xDomainStart, xDomainEnd])
        .range([0, innerWidth]);

    const isIndependent = options.independentY === true;

    // Generators
    const activeCurve = d3.curveStepAfter;

    // 4. Draw Individual Charts
    const svgs = multiplesContainers.append('svg')
        .attr('width', '100%')
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('overflow', 'visible'); // Allow tooltips/y-axis to spill safely

    // Loop through each small multiple container to render its unique local data mapping
    svgs.each(function (activeData, i) {
        const svg = d3.select(this);
        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Local Y-Scale Resolution
        let yDomainMin = globalMinBalance;
        let yDomainMax = globalMaxBalance;

        if (isIndependent) {
            yDomainMin = activeData.localMinBalance;
            yDomainMax = activeData.localMaxBalance;
        }

        const yPad = (yDomainMax - yDomainMin) * 0.1;
        // ensure 0 is solidly in the domain
        const yMin = Math.min(0, yDomainMin - yPad);
        const yMax = Math.max(0, yDomainMax + yPad);

        const y = d3.scaleLinear()
            .domain([yMin, yMax])
            .range([innerHeight, 0])
            .nice();

        // Local Area and Line Generators bound to this specific y scale
        const area = d3.area()
            .x(d => x(d.date))
            .y0(y(0))
            .y1(d => y(d.balance))
            .curve(activeCurve);

        const line = d3.line()
            .x(d => x(d.date))
            .y(d => y(d.balance))
            .curve(activeCurve);

        // Draw Title (Entity Name) & Total Volume
        svg.append('text')
            .attr('x', margin.left)
            .attr('y', 14)
            .attr('fill', 'var(--text-bright)')
            .attr('font-size', '13px')
            .attr('font-weight', '600')
            .text(d => d.label.length > 28 ? d.label.slice(0, 26) + '…' : d.label);

        svg.append('text')
            .attr('x', width - margin.right)
            .attr('y', 14)
            .attr('text-anchor', 'end')
            .attr('fill', 'var(--text-secondary)')
            .attr('font-size', '12px')
            .attr('font-family', 'var(--font-mono)')
            .text(d => `Gross Flow: ${fmtAmount(d.grossVolume)}`);

        // Draw Axes
        // X-axis: Dynamic formatting. Outer bounds get 4 digits (e.g. 2012), internal ticks get 2 digits (e.g. '14)
        g.append('g')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x)
                .ticks(d3.timeYear.every(1)) // explicitly tick every year
                .tickFormat(d => {
                    const year = d.getFullYear();
                    if (year === startYear || year === endYear) {
                        return d3.timeFormat('%Y')(d);
                    }
                    return d3.timeFormat("'%y")(d);
                })
            )
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
        const clipId = `clip-sweep-${i}`;
        g.append('clipPath')
            .attr('id', clipId)
            .append('rect')
            .attr('width', 0) // Start closed
            .attr('height', innerHeight)
            .attr('x', 0)
            .attr('y', 0);

        // Calculate the exact pixel horizontal line representing $0
        const y0Clip = Math.max(0, Math.min(innerHeight, y(0)));

        // Clip Above (Positive)
        const clipAboveId = `clip-above-${i}`;
        g.append('clipPath')
            .attr('id', clipAboveId)
            .append('rect')
            .attr('width', innerWidth)
            .attr('height', y0Clip)
            .attr('x', 0)
            .attr('y', 0);

        // Clip Below (Negative)
        const clipBelowId = `clip-below-${i}`;
        g.append('clipPath')
            .attr('id', clipBelowId)
            .append('rect')
            .attr('width', innerWidth)
            // The height of the below-box is everything from y0Clip to the bottom
            .attr('height', innerHeight - y0Clip)
            .attr('x', 0)
            .attr('y', y0Clip);

        // Draw Zero-Line Reference
        g.append('line')
            .attr('x1', 0)
            .attr('x2', innerWidth)
            .attr('y1', y(0))
            .attr('y2', y(0))
            .attr('stroke', 'var(--text-muted)')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '4,4')
            .attr('opacity', 0.5);

        // Wrap both regions in the sweeping animation clip
        const gSweep = g.append('g').attr('clip-path', `url(#${clipId})`);

        // Region: Above Zero (Positive)
        const gAbove = gSweep.append('g').attr('clip-path', `url(#${clipAboveId})`);

        gAbove.append('path') // Area
            .attr('d', area(activeData.timeline))
            .attr('fill', 'var(--text-muted)')
            .attr('opacity', 0.1); // Reduced from 0.2 for combination chart

        gAbove.append('path') // Line
            .attr('d', line(activeData.timeline))
            .attr('fill', 'none')
            .attr('stroke', 'var(--text-bright)')
            .attr('stroke-width', 1.5)
            .attr('opacity', 0.4);

        // Region: Below Zero (Negative)
        const gBelow = gSweep.append('g').attr('clip-path', `url(#${clipBelowId})`);

        gBelow.append('path') // Area
            .attr('d', area(activeData.timeline))
            .attr('fill', '#f44336') // Material Red
            .attr('opacity', 0.1);

        gBelow.append('path') // Line
            .attr('d', line(activeData.timeline))
            .attr('fill', 'none')
            .attr('stroke', '#f44336')
            .attr('stroke-width', 1.5)
            .attr('opacity', 0.4);

        // Foreground Action: Volume Spikes (Lollipops)
        const volumeSpikes = gSweep.append('g').attr('class', 'volume-spikes');
        volumeSpikes.selectAll('line')
            .data(activeData.timeline.filter(d => d.volume !== 0))
            .join('line')
            .attr('x1', d => x(d.date))
            .attr('x2', d => x(d.date))
            .attr('y1', y(0))
            .attr('y2', d => y(d.volume))
            .attr('stroke', d => d.volume > 0 ? '#4CAF50' : '#FF9800') // Green for inflows, Orange for outflows
            .attr('stroke-width', 2)
            .attr('opacity', 0.8);

        // 5. Hover Interactions (Crosshair / Point highlighting)

        // Add a clipPath constraint for the interactive hover elements to prevent bleeding into Chart 3
        const hoverClipId = `clip-hover-${i}`;
        g.append('clipPath')
            .attr('id', hoverClipId)
            .append('rect')
            .attr('width', innerWidth)
            .attr('height', innerHeight + 40)
            .attr('x', 0)
            .attr('y', -20);

        const hoverGroup = g.append('g').attr('clip-path', `url(#${hoverClipId})`);

        hoverGroup.append('line')
            .attr('class', 'hover-line')
            .attr('y1', 0)
            .attr('y2', innerHeight)
            .attr('stroke', 'var(--text-secondary)')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '3,3')
            .style('opacity', 0)
            .style('pointer-events', 'none');

        hoverGroup.append('circle')
            .attr('class', 'hover-dot')
            .attr('r', 4)
            .attr('fill', 'var(--bg-base)')
            .attr('stroke', 'var(--text-bright)')
            .attr('stroke-width', 2)
            .style('opacity', 0)
            .style('pointer-events', 'none');

        hoverGroup.append('text')
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
            .on('click', function (event) {
                onEntityClick(activeData.label);
            })
            .on('mousemove', function (event) {
                // Find closest date
                const [mouseX] = d3.pointer(event);
                const activeDate = x.invert(mouseX);

                // Snap to closest point in our exact transaction timeline
                const bisectDate = d3.bisector(d => d.date).left;

                // Fire event globally across all SVG siblings to sync crosshairs
                svgs.each(function (parentD) {
                    const siblingG = d3.select(this).select('g');

                    // Recompute sibling's local Y-scale to place dot correctly
                    let sibYDomainMin = globalMinBalance;
                    let sibYDomainMax = globalMaxBalance;
                    if (isIndependent) {
                        sibYDomainMin = parentD.localMinBalance;
                        sibYDomainMax = parentD.localMaxBalance;
                    }

                    const sibYPad = (sibYDomainMax - sibYDomainMin) * 0.1;
                    const sibYMin = Math.min(0, sibYDomainMin - sibYPad);
                    const sibYMax = Math.max(0, sibYDomainMax + sibYPad);

                    const sibY = d3.scaleLinear()
                        .domain([sibYMin, sibYMax])
                        .range([innerHeight, 0])
                        .nice();

                    const idx = bisectDate(parentD.timeline, activeDate, 1);
                    const d0 = parentD.timeline[idx - 1];
                    const d1 = parentD.timeline[idx];
                    let activePoint = d0;
                    if (d1 && (activeDate - d0.date > d1.date - activeDate)) {
                        activePoint = d1;
                    }

                    const snapDate = activePoint.date;
                    const snapStr = d3.timeFormat('%Y-%m-%d')(snapDate);
                    const runningBal = activePoint.balance;
                    const vol = activePoint.volume;

                    const currentSvgNode = this;
                    const isHoveredSvg = (currentSvgNode === event.currentTarget.parentNode.parentNode);

                    // Handle Crosshair positioning
                    d3.select(this).selectAll('line.hover-line')
                        .attr('x1', x(snapDate))
                        .attr('x2', x(snapDate))
                        .style('opacity', 0.6);

                    d3.select(this).selectAll('circle.hover-dot')
                        .attr('cx', x(snapDate))
                        .attr('cy', sibY(runningBal))
                        .style('stroke', runningBal < 0 ? '#F44336' : 'var(--text-bright)')
                        .style('opacity', 1);

                    const labelText = vol !== 0
                        ? `${snapStr} | Bal: ${fmtAmount(runningBal)} | Tx: ${fmtAmount(vol)}`
                        : `${snapStr} | Bal: ${fmtAmount(runningBal)}`;

                    d3.select(this).selectAll('text.hover-label')
                        .text(labelText)
                        .attr('x', x(snapDate))
                        .attr('y', sibY(runningBal) - 10)
                        .attr('text-anchor', snapDate.getFullYear() > maxYear - 2 ? 'end' : 'start')
                        .style('fill', runningBal < 0 ? '#F44336' : 'var(--text-bright)')
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
                .delay((_, i) => i * 100)
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
    });
}
