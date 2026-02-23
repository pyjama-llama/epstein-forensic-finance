import * as d3 from 'd3';

export class AmountBrush {
    constructor(containerId, data, onFiltered) {
        this.container = d3.select(`#${containerId}`);
        if (this.container.empty()) return;

        this.data = data;
        this.onFiltered = onFiltered;

        // Extract all edge amounts > 0
        this.amounts = [];
        data.edges.forEach(e => {
            if (e.totalAmount > 0) {
                this.amounts.push(parseFloat(e.totalAmount));
            }
        });

        if (this.amounts.length === 0) {
            this.container.style('display', 'none');
            return;
        }

        // Get bounds (use log10 for bins since data is heavily skewed)
        this.minLog = Math.log10(d3.min(this.amounts));
        this.maxLog = Math.log10(d3.max(this.amounts));

        // Create log-spaced bins
        const numBins = 40;
        this.logBins = d3.range(numBins + 1).map(i =>
            this.minLog + (i / numBins) * (this.maxLog - this.minLog)
        );

        this.bins = d3.histogram()
            .value(d => Math.log10(d))
            .domain([this.minLog, this.maxLog])
            .thresholds(this.logBins)(this.amounts);

        this.init();
    }

    init() {
        const rect = this.container.node().getBoundingClientRect();
        this.width = rect.width || 260;
        this.height = rect.height || 50;
        this.margin = { top: 0, right: 10, bottom: 20, left: 10 };
        this.innerWidth = this.width - this.margin.left - this.margin.right;
        this.innerHeight = this.height - this.margin.top - this.margin.bottom;

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
            .domain([this.minLog, this.maxLog])
            .range([0, this.innerWidth]);

        const yMax = d3.max(this.bins, d => d.length);
        this.y = d3.scaleLinear()
            .domain([0, yMax])
            .range([this.innerHeight, 0]);

        // Draw background bars
        const barWidth = Math.max(1, (this.innerWidth / this.bins.length) - 1);

        this.g.selectAll('.bg-bar-amt')
            .data(this.bins)
            .enter().append('rect')
            .attr('class', 'bg-bar-amt')
            .attr('x', d => this.x(d.x0))
            .attr('y', d => this.y(d.length))
            .attr('width', barWidth)
            .attr('height', d => this.innerHeight - this.y(d.length))
            .attr('fill', 'var(--border)')
            .attr('rx', 1);

        // Draw active bars (will be clipped)
        this.activeBars = this.g.append('g').attr('class', 'active-bars-amt');
        this.activeBars.selectAll('.fg-bar-amt')
            .data(this.bins)
            .enter().append('rect')
            .attr('class', 'fg-bar-amt')
            .attr('x', d => this.x(d.x0))
            .attr('y', d => this.y(d.length))
            .attr('width', barWidth)
            .attr('height', d => this.innerHeight - this.y(d.length))
            .attr('fill', 'var(--text-primary)')
            .attr('rx', 1);

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
        this.clipId = `clip-amt-${Math.random().toString(36).substr(2, 9)}`;
        svg.append('clipPath')
            .attr('id', this.clipId)
            .append('rect')
            .attr('class', 'clip-rect')
            .attr('width', this.innerWidth)
            .attr('height', this.innerHeight);

        this.activeBars.attr('clip-path', `url(#${this.clipId})`);

        // Hide clip rect initially
        d3.select(`#${this.clipId} rect`)
            .attr('width', this.innerWidth)
            .attr('x', 0);
    }

    brushed(event) {
        const selection = event.selection;
        const clipRect = d3.select(`#${this.clipId} rect`);

        if (!selection) {
            clipRect.attr('x', 0).attr('width', this.innerWidth);
            if (this.onFiltered) this.onFiltered(0, 100); // 0-100%
            return;
        }

        clipRect
            .attr('x', selection[0])
            .attr('width', selection[1] - selection[0]);

        // Convert the selection coordinates back to 0-100% so we map directly to the store's logic
        if (this.onFiltered) {
            const pctMin = (selection[0] / this.innerWidth) * 100;
            const pctMax = (selection[1] / this.innerWidth) * 100;

            // Constrain 0-100
            const finalMin = Math.max(0, Math.min(100, pctMin));
            const finalMax = Math.max(0, Math.min(100, pctMax));

            this.onFiltered(finalMin, finalMax);
        }
    }

    reset() {
        this.brushGroup.call(this.brush.move, null);
    }
}
