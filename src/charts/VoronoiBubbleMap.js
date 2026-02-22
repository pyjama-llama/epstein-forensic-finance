/**
 * Voronoi Bubble Map
 * Packed circle layout where each circle represents an entity sized by
 * their total financial volume. A Voronoi tessellation overlays the
 * circles to map financial "islands" and reveal proportional dominance.
 */
import * as d3 from 'd3';

const TIER_COLORS = {
    verified_wires: '#56b4e9',
    audited_PROVEN: '#009e73',
    audited_STRONG: '#e69f00',
    audited_MODERATE: '#cc79a7',
};

export function renderVoronoiBubbleMap(selector, nodes) {
    const container = document.querySelector(selector);
    if (!container) return;

    // Prepare data — filter out zero-flow entities
    const data = nodes
        .filter(n => (n.totalIn || 0) + (n.totalOut || 0) > 0)
        .map(n => ({
            id: n.id,
            label: n.label,
            totalFlow: (n.totalIn || 0) + (n.totalOut || 0),
            dominantTier: n.sourceTiers?.[0] || 'verified_wires',
        }));

    // Dimensions
    const width = container.clientWidth || 500;
    const height = 400;

    container.style.minHeight = height + 'px';

    const svg = d3.select(selector)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`);

    // Create hierarchy for pack layout
    const root = d3.hierarchy({ children: data })
        .sum(d => d.totalFlow)
        .sort((a, b) => b.value - a.value);

    const pack = d3.pack()
        .size([width - 4, height - 4])
        .padding(3);

    pack(root);

    // Draw circles
    const leaf = svg.selectAll('g.bubble')
        .data(root.leaves())
        .join('g')
        .attr('class', 'bubble')
        .attr('transform', d => `translate(${d.x + 2},${d.y + 2})`);

    leaf.append('circle')
        .attr('r', d => d.r)
        .attr('fill', d => TIER_COLORS[d.data.dominantTier] || '#56b4e9')
        .attr('fill-opacity', 0.25)
        .attr('stroke', d => TIER_COLORS[d.data.dominantTier] || '#56b4e9')
        .attr('stroke-width', 1.5)
        .attr('stroke-opacity', 0.7);

    // Labels (only for circles large enough)
    leaf.filter(d => d.r > 20)
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '-0.2em')
        .attr('fill', 'var(--text-primary)')
        .attr('font-size', d => Math.min(d.r / 3, 13))
        .attr('font-family', 'var(--font-ui)')
        .attr('font-weight', 500)
        .text(d => {
            const maxLen = Math.floor(d.r / 4);
            return d.data.label.length > maxLen
                ? d.data.label.slice(0, maxLen - 1) + '…'
                : d.data.label;
        });

    // Amount labels for large circles
    leaf.filter(d => d.r > 30)
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '1em')
        .attr('fill', 'var(--text-muted)')
        .attr('font-size', d => Math.min(d.r / 4, 11))
        .attr('font-family', 'var(--font-mono)')
        .text(d => {
            const v = d.data.totalFlow;
            if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
            if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
            return `$${(v / 1e3).toFixed(0)}K`;
        });

    // Voronoi tessellation overlay
    const points = root.leaves().map(d => [d.x + 2, d.y + 2]);
    const delaunay = d3.Delaunay.from(points);
    const voronoi = delaunay.voronoi([0, 0, width, height]);

    svg.append('g')
        .attr('class', 'voronoi-overlay')
        .selectAll('path')
        .data(root.leaves())
        .join('path')
        .attr('d', (_, i) => voronoi.renderCell(i))
        .attr('fill', 'none')
        .attr('stroke', 'var(--border)')
        .attr('stroke-opacity', 0.3)
        .attr('stroke-width', 0.5);
}
