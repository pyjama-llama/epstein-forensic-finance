/**
 * Precompute Layouts — Zero-dependency ForceAtlas2 + Circular + Radial
 * 
 * Implements ForceAtlas2 (Jacomy et al., 2014) natively in JS.
 * With 141 nodes, the entire computation runs in < 1 second.
 * 
 * Usage: npm run layouts
 * Output: src/data/layouts/*.json  → { "nodeId": { "x": n, "y": n }, ... }
 */
import fs from 'fs';
import path from 'path';

const INPUT = path.resolve('./src/data/graph.json');
const OUTPUT_DIR = path.resolve('./src/data/layouts');

// ─── Load Data ────────────────────────────────────────────────────────────────
console.log('[Layouts] Reading graph data...');
const graphData = JSON.parse(fs.readFileSync(INPUT, 'utf-8'));
const { nodes, edges } = graphData;

// Build adjacency structure
const adjMap = new Map(); // nodeId → [{ target, weight }]
nodes.forEach(n => adjMap.set(n.id, []));

edges.forEach(edge => {
    const w = Math.log10(Math.max(1, edge.totalAmount || 1));
    if (adjMap.has(edge.source)) adjMap.get(edge.source).push({ target: edge.target, weight: w });
    if (adjMap.has(edge.target)) adjMap.get(edge.target).push({ target: edge.source, weight: w });
});

// ─── ForceAtlas2 Implementation ───────────────────────────────────────────────
function forceAtlas2(nodes, adjMap, iterations = 600) {
    const settings = {
        gravity: 1.0,
        scalingRatio: 10.0,
        linLogMode: true,
        preventOverlap: true,
        edgeWeightInfluence: 1.0,
        jitterTolerance: 1.0,
        barnesHutOptimize: false, // not needed for 141 nodes
    };

    // Initialize positions randomly within a circle
    const positions = new Map();
    const speed = new Map();

    nodes.forEach((n, i) => {
        const angle = (i / nodes.length) * 2 * Math.PI;
        const radius = 100 + Math.random() * 200;
        positions.set(n.id, {
            x: Math.cos(angle) * radius + (Math.random() - 0.5) * 20,
            y: Math.sin(angle) * radius + (Math.random() - 0.5) * 20,
        });
        speed.set(n.id, { x: 0, y: 0 });
    });

    // Degree map for sizing
    const degreeMap = new Map();
    nodes.forEach(n => degreeMap.set(n.id, n.degree || 1));

    for (let iter = 0; iter < iterations; iter++) {
        const forces = new Map();
        nodes.forEach(n => forces.set(n.id, { x: 0, y: 0 }));

        // 1. Repulsion (all pairs)
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const a = nodes[i].id;
                const b = nodes[j].id;
                const pa = positions.get(a);
                const pb = positions.get(b);
                let dx = pa.x - pb.x;
                let dy = pa.y - pb.y;
                let dist = Math.sqrt(dx * dx + dy * dy) || 0.01;

                // Prevent overlap
                const sizeA = Math.sqrt(degreeMap.get(a)) * 5;
                const sizeB = Math.sqrt(degreeMap.get(b)) * 5;
                if (settings.preventOverlap) {
                    dist = Math.max(dist - sizeA - sizeB, 0.1);
                }

                // Repulsive force (LinLog: proportional to degree product)
                const degA = degreeMap.get(a) + 1;
                const degB = degreeMap.get(b) + 1;
                const repulsion = settings.scalingRatio * degA * degB / dist;

                const fx = (dx / (dist || 0.01)) * repulsion;
                const fy = (dy / (dist || 0.01)) * repulsion;

                forces.get(a).x += fx;
                forces.get(a).y += fy;
                forces.get(b).x -= fx;
                forces.get(b).y -= fy;
            }
        }

        // 2. Attraction (edges only)
        edges.forEach(edge => {
            if (!positions.has(edge.source) || !positions.has(edge.target)) return;
            const pa = positions.get(edge.source);
            const pb = positions.get(edge.target);
            const dx = pa.x - pb.x;
            const dy = pa.y - pb.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;

            const w = Math.pow(Math.log10(Math.max(1, edge.totalAmount || 1)), settings.edgeWeightInfluence);

            // LinLog: attraction = log(1 + dist) * weight
            let attraction;
            if (settings.linLogMode) {
                attraction = w * Math.log(1 + dist);
            } else {
                attraction = w * dist;
            }

            const fx = (dx / dist) * attraction;
            const fy = (dy / dist) * attraction;

            forces.get(edge.source).x -= fx;
            forces.get(edge.source).y -= fy;
            forces.get(edge.target).x += fx;
            forces.get(edge.target).y += fy;
        });

        // 3. Gravity (pull toward center)
        nodes.forEach(n => {
            const p = positions.get(n.id);
            const dist = Math.sqrt(p.x * p.x + p.y * p.y) || 0.01;
            const deg = degreeMap.get(n.id) + 1;
            const gf = settings.gravity * deg;
            forces.get(n.id).x -= (p.x / dist) * gf;
            forces.get(n.id).y -= (p.y / dist) * gf;
        });

        // 4. Apply forces with adaptive speed
        const globalSwing = { total: 0 };
        const globalTraction = { total: 0 };

        nodes.forEach(n => {
            const f = forces.get(n.id);
            const s = speed.get(n.id);
            const swing = Math.sqrt((f.x - s.x) ** 2 + (f.y - s.y) ** 2);
            const traction = Math.sqrt((f.x + s.x) ** 2 + (f.y + s.y) ** 2) / 2;
            globalSwing.total += (degreeMap.get(n.id) + 1) * swing;
            globalTraction.total += (degreeMap.get(n.id) + 1) * traction;
        });

        const globalSpeed = settings.jitterTolerance * globalTraction.total / (globalSwing.total || 1);

        nodes.forEach(n => {
            const f = forces.get(n.id);
            const p = positions.get(n.id);
            const s = speed.get(n.id);
            const fMag = Math.sqrt(f.x * f.x + f.y * f.y) || 0.01;
            const nodeSpeed = Math.min(globalSpeed / fMag, 10);

            p.x += f.x * nodeSpeed;
            p.y += f.y * nodeSpeed;
            s.x = f.x;
            s.y = f.y;
        });

        if (iter % 100 === 0) {
            console.log(`  [ForceAtlas2] Iteration ${iter}/${iterations} — global speed: ${globalSpeed.toFixed(3)}`);
        }
    }

    // Normalize positions to center
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    positions.forEach(p => {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
    });

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const result = {};
    positions.forEach((p, id) => {
        result[id] = { x: p.x - cx, y: p.y - cy };
    });

    return result;
}

// ─── Circular Layout ──────────────────────────────────────────────────────────
function circularLayout(nodes) {
    const result = {};
    const r = nodes.length * 8; // Scale radius with node count
    nodes.forEach((n, i) => {
        const angle = (i / nodes.length) * 2 * Math.PI;
        result[n.id] = { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
    });
    return result;
}

// ─── Radial Layout (centered on highest-degree node) ──────────────────────────
function radialLayout(nodes, adjMap) {
    const result = {};
    // Find center node (highest degree)
    const sorted = [...nodes].sort((a, b) => (b.degree || 0) - (a.degree || 0));
    const center = sorted[0];
    result[center.id] = { x: 0, y: 0 };

    // BFS from center
    const visited = new Set([center.id]);
    const queue = [{ id: center.id, depth: 0 }];
    const depthNodes = new Map(); // depth → [nodeIds]

    while (queue.length > 0) {
        const { id, depth } = queue.shift();
        if (!depthNodes.has(depth)) depthNodes.set(depth, []);
        depthNodes.get(depth).push(id);

        const neighbors = adjMap.get(id) || [];
        for (const n of neighbors) {
            if (!visited.has(n.target)) {
                visited.add(n.target);
                queue.push({ id: n.target, depth: depth + 1 });
            }
        }
    }

    // Place unvisited nodes at the outermost ring
    const maxDepth = Math.max(...depthNodes.keys()) + 1;
    nodes.forEach(n => {
        if (!visited.has(n.id)) {
            if (!depthNodes.has(maxDepth)) depthNodes.set(maxDepth, []);
            depthNodes.get(maxDepth).push(n.id);
        }
    });

    // Position nodes in concentric rings
    depthNodes.forEach((ids, depth) => {
        if (depth === 0) return; // Center already placed
        const ringRadius = depth * 120;
        ids.forEach((id, i) => {
            const angle = (i / ids.length) * 2 * Math.PI;
            result[id] = { x: Math.cos(angle) * ringRadius, y: Math.sin(angle) * ringRadius };
        });
    });

    return result;
}

// ─── Run All Layouts ──────────────────────────────────────────────────────────
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('[Layouts] Computing ForceAtlas2 (600 iterations)...');
const fa2 = forceAtlas2(nodes, adjMap, 600);
fs.writeFileSync(path.join(OUTPUT_DIR, 'forceatlas2.json'), JSON.stringify(fa2, null, 2));
console.log(`  → Saved forceatlas2.json (${Object.keys(fa2).length} nodes)`);

console.log('[Layouts] Computing Circular layout...');
const circ = circularLayout(nodes);
fs.writeFileSync(path.join(OUTPUT_DIR, 'circular.json'), JSON.stringify(circ, null, 2));
console.log(`  → Saved circular.json (${Object.keys(circ).length} nodes)`);

console.log('[Layouts] Computing Radial layout...');
const rad = radialLayout(nodes, adjMap);
fs.writeFileSync(path.join(OUTPUT_DIR, 'radial.json'), JSON.stringify(rad, null, 2));
console.log(`  → Saved radial.json (${Object.keys(rad).length} nodes)`);

console.log('[Layouts] All layouts computed successfully!');
