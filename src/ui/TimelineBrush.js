import * as d3 from 'd3';

export class TimelineBrush {
    constructor(containerId, data, onFiltered) {
        this.container = d3.select(`#${containerId}`);
        if (this.container.empty()) return;

        this.data = data;
        this.onFiltered = onFiltered; // Callback when brushing occurs

        // Extract all years from data to build histogram
        this.years = [];

        // Match how chartUtils extracts dates: Look at edges with date fields
        data.edges.forEach(e => {
            if (e.date) {
                const yearMatch = e.date.match(/\\d{4}/);
                if (yearMatch) {
                    this.years.push(parseInt(yearMatch[0], 10));
                }
            }
        });

        // If no year data, hide component
        if (this.years.length === 0) {
            this.container.style('display', 'none');
            return;
        }

        // Get bounds
        this.minYear = d3.min(this.years);
        this.maxYear = d3.max(this.years);

        // Bin the data by year
        this.bins = d3.bin()
            .domain([this.minYear, this.maxYear + 1])
            .thresholds(d3.range(this.minYear, this.maxYear + 2))(this.years);

        this.init();
    }

    init() {
        const rect = this.container.node().getBoundingClientRect();
        this.width = rect.width || 260;
        this.height = rect.height || 50;
        this.margin = { top: 0, right: 10, bottom: 20, left: 10 };
        this.innerWidth = this.width - this.margin.left - this.margin.right;
        this.innerHeight = this.height - this.margin.top - this.margin.bottom;

        // Clear existing
        this.container.selectAll('*').remove();

        const svg = this.container.append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', `0 0 ${this.width} ${this.height}`)
            .style('display', 'block');

        this.g = svg.append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

        // Scales
        this.x = d3.scaleLinear()
            .domain([this.minYear, this.maxYear + 1])
            .range([0, this.innerWidth]);

        const yMax = d3.max(this.bins, d => d.length);
        this.y = d3.scaleLinear()
            .domain([0, yMax])
            .range([this.innerHeight, 0]);

        // Draw background bars (muted)
        const barWidth = Math.max(1, (this.innerWidth / (this.maxYear - this.minYear + 1)) - 1);

        this.g.selectAll('.bg-bar')
            .data(this.bins)
            .enter().append('rect')
            .attr('class', 'bg-bar')
            .attr('x', d => this.x(d.x0))
            .attr('y', d => this.y(d.length))
            .attr('width', barWidth)
            .attr('height', d => this.innerHeight - this.y(d.length))
            .attr('fill', 'var(--border)')
            .attr('rx', 2);

        // Draw active bars (will be clipped)
        this.activeBars = this.g.append('g').attr('class', 'active-bars');
        this.activeBars.selectAll('.fg-bar')
            .data(this.bins)
            .enter().append('rect')
            .attr('class', 'fg-bar')
            .attr('x', d => this.x(d.x0))
            .attr('y', d => this.y(d.length))
            .attr('width', barWidth)
            .attr('height', d => this.innerHeight - this.y(d.length))
            .attr('fill', 'var(--text-primary)')
            .attr('rx', 2);

        // Add X axis
        const xAxis = d3.axisBottom(this.x)
            .ticks(5)
            .tickFormat(d3.format('d'))
            .tickSize(4);

        this.g.append('g')
            .attr('transform', `translate(0,${this.innerHeight})`)
            .call(xAxis)
            .call(g => g.select('.domain').remove())
            .call(g => g.selectAll('line').attr('stroke', 'var(--border)'))
            .call(g => g.selectAll('text')
                .attr('fill', 'var(--text-muted)')
                .style('font-family', 'var(--font-mono)')
                .style('font-size', '10px')
            );

        // Setup Brush
        this.brush = d3.brushX()
            .extent([[0, 0], [this.innerWidth, this.innerHeight]])
            .on('brush end', (e) => this.brushed(e));

        this.brushGroup = this.g.append('g')
            .attr('class', 'brush')
            .call(this.brush);

        // Style brush overlay directly via d3 since it's dynamic
        this.brushGroup.select('.selection')
            .attr('fill', 'var(--bg-elevated)')
            .attr('fill-opacity', 0.5)
            .attr('stroke', 'var(--border-light)')
            .attr('stroke-width', 1);

        // Ensure active bars are only visible within the brushed area
        this.clipId = `clip-${Math.random().toString(36).substr(2, 9)}`;
        svg.append('clipPath')
            .attr('id', this.clipId)
            .append('rect')
            .attr('class', 'clip-rect')
            .attr('width', this.innerWidth)
            .attr('height', this.innerHeight);

        this.activeBars.attr('clip-path', `url(#${this.clipId})`);

        // Hide clip rect initially (shows all bars if no brush)
        d3.select(`#${this.clipId} rect`)
            .attr('width', this.innerWidth)
            .attr('x', 0);
    }

    brushed(event) {
        const selection = event.selection;
        const clipRect = d3.select(`#${this.clipId} rect`);

        if (!selection) {
            // Brush cleared - reset clip path to show full active bars
            clipRect.attr('x', 0).attr('width', this.innerWidth);
            if (this.onFiltered) this.onFiltered(null, null);
            return;
        }

        // Update clip path to only show active bars within selection
        clipRect
            .attr('x', selection[0])
            .attr('width', selection[1] - selection[0]);

        // Calculate selected domain
        const d0 = this.x.invert(selection[0]);
        const d1 = this.x.invert(selection[1]);

        if (this.onFiltered) {
            // Round to nearest years
            const fromYear = Math.round(d0);
            // the upper bound of the bin is essentially the start of the next year, 
            // so we subtract 1 from the rounded upper bound to get the inclusive end year.
            let toYear = Math.round(d1);
            if (d1 % 1 < 0.5) toYear -= 1; // if dragged midway through a bin

            // Constrain
            const finalFrom = Math.max(this.minYear, fromYear);
            const finalTo = Math.min(this.maxYear, toYear);

            this.onFiltered(finalFrom, finalTo);
        }
    }

    // Method to programmatically set the brush (e.g. from clear all button)
    reset() {
        this.brushGroup.call(this.brush.move, null);
    }
}
