// src/graph/ForceGraph.js
// D3 v7 force-directed graph renderer
// Handles: simulation, zoom/pan, node/edge rendering, highlight states, labels

import * as d3 from 'd3';

const TIER_COLORS = {
    verified_wires: '#56b4e9',
    audited_PROVEN: '#009e73',
    audited_STRONG: '#e69f00',
    audited_MODERATE: '#cc79a7',
};

const TIER_DASH = {
    verified_wires: 'none',
    audited_PROVEN: '6,3',
    audited_STRONG: '4,3',
    audited_MODERATE: '2,3',
};

// Nodes with degree >= this threshold always show their label
const ALWAYS_LABEL_THRESHOLD = 4;

// Number of top-degree nodes to always label
const ALWAYS_LABEL_COUNT = 15;

export class ForceGraph {
    constructor(svgEl, { onNodeClick, onNodeDblClick, onEdgeClick }) {
        this.svg = d3.select(svgEl);
        this.svgEl = svgEl;
        this.onNodeClick = onNodeClick;
        this.onNodeDblClick = onNodeDblClick;
        this.onEdgeClick = onEdgeClick;

        this._graph = null;
        this._simulation = null;
        this._nodePositions = new Map(); // id -> {x, y}
        this._selectedId = null;
        this._visibleNodeIds = null;
        this._visibleEdgeIds = null;
        this._zoom = null;

        this._init();
    }

    _init() {
        const svg = this.svg;
        svg.attr('width', '100%').attr('height', '100%');

        // Defs: glow filter for selected node
        const defs = svg.append('defs');

        // Glow filter for selected node
        const glow = defs.append('filter').attr('id', 'glow');
        glow.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'blur');
        const merge = glow.append('feMerge');
        merge.append('feMergeNode').attr('in', 'blur');
        merge.append('feMergeNode').attr('in', 'SourceGraphic');

        // Root group (zoom target)
        this._g = svg.append('g').attr('class', 'graph-root');
        this._gEdges = this._g.append('g').attr('class', 'edges');
        this._gArrows = this._g.append('g').attr('class', 'arrows'); // rendered on top of edges
        this._gNodes = this._g.append('g').attr('class', 'nodes');
        this._gLabels = this._g.append('g').attr('class', 'labels');

        // Tooltip
        this._tooltip = d3.select(document.body).append('div')
            .attr('id', 'graph-tooltip')
            .style('opacity', 0)
            .style('display', 'none');

        // Zoom
        this._zoom = d3.zoom()
            .scaleExtent([0.05, 8])
            .on('zoom', (event) => {
                this._g.attr('transform', event.transform);
                this._currentTransform = event.transform;
                this._updateLabelVisibility();
            });
        svg.call(this._zoom);
        svg.on('dblclick.zoom', null); // disable default dbl-zoom

        // Click on background to deselect
        svg.on('click', (event) => {
            if (event.target === this.svgEl || event.target.classList.contains('graph-root')) {
                this._clearHighlight();
            }
        });

        this._currentTransform = d3.zoomIdentity;
    }

    // ── Public API ────────────────────────────────────────────────────────────

    load(graph) {
        this._graph = graph;
        this._render();
    }

    updateVisibility(visibleNodeIds, visibleEdgeIds) {
        this._visibleNodeIds = visibleNodeIds;
        this._visibleEdgeIds = visibleEdgeIds;
        this._applyVisibility();
    }

    selectNode(nodeId, flyTo = true) {
        this._selectedId = nodeId;
        this._applyHighlight(nodeId);
        if (flyTo && this._nodePositions.has(nodeId)) {
            this._flyToNode(nodeId);
        }
    }

    clearSelection() {
        this._selectedId = null;
        this._clearHighlight();
    }

    fitToView() {
        const { width, height } = this.svgEl.getBoundingClientRect();
        this.svg.transition().duration(500)
            .call(this._zoom.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(0.8));
    }

    resetView() {
        const { width, height } = this.svgEl.getBoundingClientRect();
        this.svg.transition().duration(600)
            .call(this._zoom.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(0.7));
    }

    // ── Layout Transitions ───────────────────────────────────────────────────

    /**
     * Stop the live simulation and smoothly animate all nodes to
     * pre-computed static positions from a layout JSON file.
     * @param {Object} positions - { nodeId: { x, y }, ... }
     */
    transitionToLayout(positions) {
        if (!this._simulation || !this._simNodes) return;

        // Stop the live physics
        this._simulation.stop();
        this._isStaticLayout = true;

        const duration = 800;
        const t = d3.transition().duration(duration).ease(d3.easeCubicInOut);

        // Animate each node to its new position
        this._simNodes.forEach(n => {
            const target = positions[n.id];
            if (target) {
                n.fx = target.x;
                n.fy = target.y;
            }
        });

        // Animate node groups
        this._nodeSel.transition(t)
            .attr('transform', d => {
                const target = positions[d.id];
                if (target) {
                    d.x = target.x;
                    d.y = target.y;
                    this._nodePositions.set(d.id, { x: target.x, y: target.y });
                }
                return `translate(${d.x},${d.y})`;
            });

        // Animate labels
        this._labelSel.transition(t)
            .attr('x', d => positions[d.id]?.x ?? d.x)
            .attr('y', d => positions[d.id]?.y ?? d.y);

        // After transition, update edges
        setTimeout(() => {
            this._edgeSel.attr('d', d => this._linkArc(d));
            this._arrowSel.attr('transform', d => {
                if (!d._arcMeta) return '';
                const { sx, sy, mx, my, tx, ty } = d._arcMeta;
                const midX = 0.25 * sx + 0.5 * mx + 0.25 * tx;
                const midY = 0.25 * sy + 0.5 * my + 0.25 * ty;
                const angle = Math.atan2(ty - sy, tx - sx) * 180 / Math.PI;
                return `translate(${midX},${midY}) rotate(${angle})`;
            });
        }, duration + 50);
    }

    /**
     * Restart the live D3 force simulation, releasing fixed positions.
     */
    restartSimulation() {
        if (!this._simulation || !this._simNodes) return;

        this._isStaticLayout = false;

        // Release all fixed positions
        this._simNodes.forEach(n => {
            n.fx = null;
            n.fy = null;
        });

        // Restart simulation
        this._simulation.alpha(0.5).restart();
    }

    // ── Rendering ─────────────────────────────────────────────────────────────

    _render() {
        const { nodes, edges, meta } = this._graph;
        const { width, height } = this.svgEl.getBoundingClientRect();

        // Scales
        const maxFlow = meta.maxNodeFlow;
        const rScale = d3.scaleSqrt()
            .domain([0, maxFlow])
            .range([4, 28])
            .clamp(true);

        const logMin = Math.log10(Math.max(meta.minEdgeAmount, 1));
        const logMax = Math.log10(meta.maxEdgeAmount);
        const strokeScale = d3.scaleLinear()
            .domain([logMin, logMax])
            .range([0.8, 8])
            .clamp(true);

        // Build lookup
        const nodeById = Object.fromEntries(nodes.map(n => ({ ...n, r: rScale(n.totalIn + n.totalOut) })).map(n => [n.id, n]));
        nodes.forEach(n => { n.r = rScale(n.totalIn + n.totalOut); });

        // Always-label set: top N by degree
        const sortedByDegree = [...nodes].sort((a, b) => b.degree - a.degree);
        this._alwaysLabelIds = new Set(sortedByDegree.slice(0, ALWAYS_LABEL_COUNT).map(n => n.id));

        // ── Force Simulation ───────────────────────────────────────────────────
        const simNodes = nodes.map(n => ({ ...n }));
        const simEdges = edges.map(e => ({
            ...e,
            source: e.source,
            target: e.target,
        }));

        this._simulation = d3.forceSimulation(simNodes)
            .force('link', d3.forceLink(simEdges)
                .id(d => d.id)
                .distance(d => {
                    // Shorter distance for high-value edges
                    const logAmt = Math.log10(Math.max(d.totalAmount, 1));
                    return Math.max(60, 200 - logAmt * 12);
                })
                .strength(0.4)
            )
            .force('charge', d3.forceManyBody()
                .strength(d => -Math.max(120, d.degree * 40))
                .distanceMax(400)
                .theta(0.9)
            )
            .force('center', d3.forceCenter(0, 0))
            .force('collision', d3.forceCollide(d => d.r + 6).strength(0.8))
            .alphaDecay(0.015)
            .velocityDecay(0.4);

        // ── Edge paths ─────────────────────────────────────────────────────────
        const edgeSel = this._gEdges.selectAll('.link-path')
            .data(simEdges, d => d.id)
            .join('path')
            .attr('class', 'link-path')
            .attr('id', d => `edge-${CSS.escape(d.id)}`)
            .attr('stroke', d => TIER_COLORS[d.dominantTier] || '#555')
            .attr('stroke-width', d => strokeScale(Math.log10(Math.max(d.totalAmount, 1))))
            .attr('stroke-dasharray', d => TIER_DASH[d.dominantTier] || 'none')
            .attr('opacity', 0.55)
            .attr('fill', 'none')
            .on('click', (event, d) => {
                event.stopPropagation();
                this.onEdgeClick?.(d);
            })
            .on('mouseenter', (event, d) => this._showEdgeTooltip(event, d))
            .on('mouseleave', () => this._hideTooltip());

        // ── Arrows (Midpoint) ──────────────────────────────────────────────────
        const arrowSel = this._gArrows.selectAll('.link-arrow')
            .data(simEdges, d => d.id)
            .join('path')
            .attr('class', 'link-arrow')
            .attr('d', 'M-6,-4.5 L6,0 L-6,4.5 Z') // Slender arrow shape
            .attr('fill', d => TIER_COLORS[d.dominantTier] || '#555')
            .attr('opacity', 0.85)
            .style('pointer-events', 'none'); // Let clicks pass through to the edge path underneath

        // ── Nodes ──────────────────────────────────────────────────────────────
        const nodeSel = this._gNodes.selectAll('.node-g')
            .data(simNodes, d => d.id)
            .join('g')
            .attr('class', 'node-g')
            .call(d3.drag()
                .on('start', (event, d) => {
                    if (!event.active) this._simulation.alphaTarget(0.3).restart();
                    d.fx = d.x; d.fy = d.y;
                })
                .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
                .on('end', (event, d) => {
                    if (!event.active) this._simulation.alphaTarget(0);
                    d.fx = null; d.fy = null;
                })
            )
            .on('click', (event, d) => {
                event.stopPropagation();
                if (this._selectedId === d.id) {
                    this._clearHighlight();
                } else {
                    this._selectedId = d.id;
                    this._applyHighlight(d.id);
                    this.onNodeClick?.(d);
                }
            })
            .on('dblclick', (event, d) => {
                event.stopPropagation();
                this.onNodeDblClick?.(d);
            })
            .on('mouseenter', (event, d) => {
                this._showNodeTooltip(event, d);
                // Show label on hover even if not always-labeled
                d3.select(`#label-${CSS.escape(d.id)}`).classed('hover-visible', true);
            })
            .on('mouseleave', (event, d) => {
                this._hideTooltip();
                d3.select(`#label-${CSS.escape(d.id)}`).classed('hover-visible', false);
            });

        // Apply instant transform to center the graph to avoid top-left initial jump
        this.svg.call(this._zoom.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(0.65));

        nodeSel.append('circle')
            .attr('class', 'node-circle')
            .attr('r', d => d.r)
            .attr('fill', d => {
                const tierColor = TIER_COLORS[d.sourceTiers?.[0]] || '#56b4e9';
                return tierColor + '22'; // very transparent fill
            })
            .attr('stroke', d => TIER_COLORS[d.sourceTiers?.[0]] || '#56b4e9')
            .attr('stroke-width', 1.5);

        // ── Labels ─────────────────────────────────────────────────────────────
        const labelSel = this._gLabels.selectAll('.node-label')
            .data(simNodes, d => d.id)
            .join('text')
            .attr('class', d => `node-label${this._alwaysLabelIds.has(d.id) ? ' always-visible' : ''}`)
            .attr('id', d => `label-${CSS.escape(d.id)}`)
            .attr('dy', d => -(d.r + 4))
            .attr('text-anchor', 'middle')
            .text(d => d.label)
            .style('display', d => this._alwaysLabelIds.has(d.id) ? 'block' : 'none');

        // ── Simulation tick ────────────────────────────────────────────────────
        this._simulation.on('tick', () => {
            // Curved edges for multi-edges between same pair
            edgeSel.attr('d', d => this._linkArc(d));

            // Position arrows exactly at the bezier curve midpoint t=0.5
            arrowSel.attr('transform', d => {
                if (!d._arcMeta) return '';
                const { sx, sy, mx, my, tx, ty } = d._arcMeta;

                // Bezier position formula at t=0.5
                const midX = 0.25 * sx + 0.5 * mx + 0.25 * tx;
                const midY = 0.25 * sy + 0.5 * my + 0.25 * ty;

                // Bezier tangent (derivative) at t=0.5 is exactly the vector from Start to End!
                const angle = Math.atan2(ty - sy, tx - sx) * 180 / Math.PI;

                return `translate(${midX},${midY}) rotate(${angle})`;
            });

            nodeSel.attr('transform', d => {
                this._nodePositions.set(d.id, { x: d.x, y: d.y });
                return `translate(${d.x},${d.y})`;
            });

            labelSel
                .attr('x', d => d.x)
                .attr('y', d => d.y);
        });

        // After sim settles, apply visibility
        this._simulation.on('end', () => {
            if (this._visibleNodeIds) this._applyVisibility();
        });

        this._simNodes = simNodes;
        this._simEdges = simEdges;
        this._nodeSel = nodeSel;
        this._edgeSel = edgeSel;
        this._arrowSel = arrowSel;
        this._labelSel = labelSel;
        this._rScale = rScale;

        // Show graph, hide loader
        document.getElementById('graph-loading').style.display = 'none';

        // Initial fit after settling
        setTimeout(() => this.resetView(), 3000);
    }

    // ── Arc path for edges (slight curve to distinguish parallel edges) ───────
    _linkArc(d) {
        const sx = d.source.x ?? 0, sy = d.source.y ?? 0;
        const tx = d.target.x ?? 0, ty = d.target.y ?? 0;
        const dx = tx - sx, dy = ty - sy;
        const dr = Math.sqrt(dx * dx + dy * dy);

        if (dr === 0) {
            d._arcMeta = { sx, sy, mx: sx, my: sy, tx: sx, ty: sy };
            return `M${sx},${sy} L${sx},${sy}`; // Prevent NaN flicker
        }

        // For cleanliness we use quadratic bezier with mild bend
        const curvature = 0.15;
        const mx = (sx + tx) / 2 - dy * curvature;
        const my = (sy + ty) / 2 + dx * curvature;

        // Pull back target point exactly to the border of the target node
        const dtx = tx - mx;
        const dty = ty - my;
        const distControlToTarget = Math.sqrt(dtx * dtx + dty * dty);

        if (distControlToTarget === 0) {
            d._arcMeta = { sx, sy, mx, my, tx, ty };
            return `M${sx},${sy} Q${mx},${my} ${tx},${ty}`; // safety
        }

        // Target pullback radius (target node size) + 1px padding
        const targetPullback = (d.target.r || 10) + 1;

        // Shorten the end point along the curve tangent
        const ratio = distControlToTarget > targetPullback
            ? (distControlToTarget - targetPullback) / distControlToTarget
            : 0.01;

        const endX = mx + dtx * ratio;
        const endY = my + dty * ratio;

        // Store the exact curve coordinates for the arrow positioner in _tick
        d._arcMeta = { sx, sy, mx, my, tx: endX, ty: endY };
        return `M${sx},${sy} Q${mx},${my} ${endX},${endY}`;
    }

    // ── Highlight ─────────────────────────────────────────────────────────────

    _applyHighlight(nodeId) {
        if (!this._nodeSel) return;

        // Find adjacent node IDs
        const adjacentIds = new Set([nodeId]);
        const connectedEdgeIds = new Set();

        this._simEdges.forEach(e => {
            const srcId = e.source.id ?? e.source;
            const tgtId = e.target.id ?? e.target;
            if (srcId === nodeId || tgtId === nodeId) {
                adjacentIds.add(srcId);
                adjacentIds.add(tgtId);
                connectedEdgeIds.add(e.id);
            }
        });

        // Fade non-adjacent nodes
        this._nodeSel
            .classed('node-faded', d => !adjacentIds.has(d.id))
            .select('circle')
            .attr('filter', d => d.id === nodeId ? 'url(#glow)' : null)
            .attr('stroke-width', d => d.id === nodeId ? 2.5 : 1.5);

        // Fade non-connected edges
        this._edgeSel
            .classed('link-faded', d => !connectedEdgeIds.has(d.id))
            .attr('opacity', d => connectedEdgeIds.has(d.id) ? 0.9 : 0.04);

        // Hollow out the highlighted arrows so they don't blend into the thick lines    
        this._arrowSel
            .classed('link-faded', d => !connectedEdgeIds.has(d.id))
            .attr('opacity', d => connectedEdgeIds.has(d.id) ? 1 : 0.04)
            .attr('fill', d => connectedEdgeIds.has(d.id) ? '#070810' : (TIER_COLORS[d.dominantTier] || '#555'))
            .attr('stroke', d => connectedEdgeIds.has(d.id) ? (TIER_COLORS[d.dominantTier] || '#555') : 'none')
            .attr('stroke-width', d => connectedEdgeIds.has(d.id) ? 1.5 : 0);

        // Labels
        this._labelSel
            .style('display', d => (adjacentIds.has(d.id) || this._alwaysLabelIds.has(d.id)) ? 'block' : 'none')
            .classed('selected', d => d.id === nodeId);
    }

    _clearHighlight() {
        this._selectedId = null;
        if (!this._nodeSel) return;

        this._nodeSel
            .classed('node-faded', false)
            .select('circle')
            .attr('filter', null)
            .attr('stroke-width', 1.5);

        this._edgeSel
            .classed('link-faded', false)
            .attr('opacity', 0.55);

        this._arrowSel
            .classed('link-faded', false)
            .attr('opacity', 0.85)
            .attr('fill', d => TIER_COLORS[d.dominantTier] || '#555')
            .attr('stroke', 'none')
            .attr('stroke-width', 0);

        this._labelSel
            .classed('selected', false)
            .style('display', d => this._alwaysLabelIds.has(d.id) ? 'block' : 'none');

        this.onNodeClick?.(null);
    }

    // ── Visibility (filters) ──────────────────────────────────────────────────

    _applyVisibility() {
        if (!this._nodeSel || !this._visibleNodeIds) return;

        this._nodeSel.style('display', d =>
            this._visibleNodeIds.has(d.id) ? null : 'none'
        );
        this._edgeSel.style('display', d =>
            this._visibleEdgeIds.has(d.id) ? null : 'none'
        );
        this._arrowSel.style('display', d =>
            this._visibleEdgeIds.has(d.id) ? null : 'none'
        );
        this._labelSel.style('display', d => {
            if (!this._visibleNodeIds.has(d.id)) return 'none';
            return this._alwaysLabelIds.has(d.id) ? 'block' : 'none';
        });
    }

    // ── Label zoom visibility ─────────────────────────────────────────────────
    _updateLabelVisibility() {
        if (!this._labelSel || !this._currentTransform) return;
        const k = this._currentTransform.k;

        // At low zoom: only always-label nodes
        // At medium zoom (>1): also show degree >= 3 nodes
        // At high zoom (>2): show all visible nodes
        this._labelSel.style('display', d => {
            const isVisible = !this._visibleNodeIds || this._visibleNodeIds.has(d.id);
            if (!isVisible) return 'none';
            if (d.id === this._selectedId) return 'block';
            if (this._alwaysLabelIds.has(d.id)) return 'block';
            if (k >= 2 && d.degree >= 2) return 'block';
            if (k >= 1.5 && d.degree >= 3) return 'block';
            return 'none';
        });
    }

    // ── Fly to node ───────────────────────────────────────────────────────────
    _flyToNode(nodeId) {
        const pos = this._nodePositions.get(nodeId);
        if (!pos) return;
        const { width, height } = this.svgEl.getBoundingClientRect();
        const scale = Math.min(2.5, this._currentTransform.k > 1 ? this._currentTransform.k : 1.8);
        const tx = width / 2 - pos.x * scale;
        const ty = height / 2 - pos.y * scale;
        this.svg.transition().duration(700).ease(d3.easeCubicInOut)
            .call(this._zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
    }

    // ── Tooltips ──────────────────────────────────────────────────────────────
    _showNodeTooltip(event, d) {
        const inFlow = d.totalIn ? `$${this._fmtAmt(d.totalIn)}` : '—';
        const outFlow = d.totalOut ? `$${this._fmtAmt(d.totalOut)}` : '—';

        this._tooltip
            .style('display', 'block')
            .style('opacity', 1)
            .html(`
        <div class="tooltip-name">${d.label}</div>
        <div class="tooltip-row"><span class="tooltip-key">In</span><span class="tooltip-val">${inFlow}</span></div>
        <div class="tooltip-row"><span class="tooltip-key">Out</span><span class="tooltip-val">${outFlow}</span></div>
        <div class="tooltip-row"><span class="tooltip-key">Directed Edges</span><span class="tooltip-val">${d.degree}</span></div>
        <div class="tooltip-row"><span class="tooltip-key">Tier</span><span class="tooltip-val">${d.sourceTiers?.join(', ') || '—'}</span></div>
      `);
        this._positionTooltip(event);
        document.addEventListener('mousemove', this._moveTooltip);
    }

    _showEdgeTooltip(event, d) {
        this._tooltip
            .style('display', 'block')
            .style('opacity', 1)
            .html(`
        <div class="tooltip-name">${d.source.id ?? d.source} → ${d.target.id ?? d.target}</div>
        <div class="tooltip-row"><span class="tooltip-key">Total</span><span class="tooltip-val">$${this._fmtAmt(d.totalAmount)}</span></div>
        <div class="tooltip-row"><span class="tooltip-key">Txns</span><span class="tooltip-val">${d.transactionCount}</span></div>
        <div class="tooltip-row"><span class="tooltip-key">Tier</span><span class="tooltip-val">${d.dominantTier}</span></div>
        ${d.exhibits.length ? `<div class="tooltip-row"><span class="tooltip-key">Exhibit</span><span class="tooltip-val">${d.exhibits.join(', ')}</span></div>` : ''}
      `);
        this._positionTooltip(event);
    }

    _moveTooltip = (event) => this._positionTooltip(event);

    _positionTooltip(event) {
        const tt = this._tooltip.node();
        const { width: ttW, height: ttH } = tt.getBoundingClientRect();
        const x = Math.min(event.clientX + 14, window.innerWidth - ttW - 10);
        const y = Math.min(event.clientY + 14, window.innerHeight - ttH - 10);
        this._tooltip.style('left', `${x}px`).style('top', `${y}px`);
    }

    _hideTooltip() {
        this._tooltip.style('opacity', 0).style('display', 'none');
        document.removeEventListener('mousemove', this._moveTooltip);
    }

    _fmtAmt(n) {
        if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
        if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
        return n.toFixed(0);
    }
}
