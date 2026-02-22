// scripts/preprocess.js
// Reads raw JSON, applies alias map, builds graph.json for the web app
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { ALIAS_MAP, buildReverseMap, resolveEntity } from './aliases.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const raw = JSON.parse(readFileSync(resolve(ROOT, 'data/master_wire_ledger_phase25.json'), 'utf8'));
const reverseMap = buildReverseMap(ALIAS_MAP);

// ── 1. Normalize dates ──────────────────────────────────────────────────────
function normalizeDate(d) {
    if (!d) return null;
    // Handle M/D/YYYY format
    const mdy = d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (mdy) {
        const [, m, day, y] = mdy;
        // Guard against obviously wrong years (data error: "2916")
        const year = parseInt(y);
        if (year > 2030 || year < 2000) return null;
        return `${y}-${m.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    // Already ISO
    const iso = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) {
        const year = parseInt(iso[1]);
        if (year > 2030 || year < 2000) return null;
        return d;
    }
    return null;
}

// ── 2. Build nodes + edges ──────────────────────────────────────────────────
const nodeMap = new Map(); // canonicalId -> node metadata
const edgePairs = new Map(); // `fromId||toId` -> aggregated edge

function getNode(canonicalId, rawName) {
    if (!nodeMap.has(canonicalId)) {
        nodeMap.set(canonicalId, {
            id: canonicalId,
            label: canonicalId,
            aliases: new Set(),
            totalIn: 0,
            totalOut: 0,
            transactionCount: 0,
            exhibits: new Set(),
            sourceTiers: new Set(),
            firstDate: null,
            lastDate: null,
            bankInvolved: false,
        });
    }
    const node = nodeMap.get(canonicalId);
    if (rawName !== canonicalId) node.aliases.add(rawName);
    return node;
}

raw.forEach((tx, idx) => {
    const fromRaw = tx.entity_from || 'UNKNOWN';
    const toRaw = tx.entity_to || 'UNKNOWN';
    const fromId = resolveEntity(fromRaw, reverseMap);
    const toId = resolveEntity(toRaw, reverseMap);
    const date = normalizeDate(tx.date);
    const amount = typeof tx.amount === 'number' ? tx.amount : 0;

    const fromNode = getNode(fromId, fromRaw);
    const toNode = getNode(toId, toRaw);

    // Update node stats
    fromNode.totalOut += amount;
    fromNode.transactionCount += 1;
    if (tx.exhibit) fromNode.exhibits.add(tx.exhibit);
    fromNode.sourceTiers.add(tx.source);
    if (date) {
        if (!fromNode.firstDate || date < fromNode.firstDate) fromNode.firstDate = date;
        if (!fromNode.lastDate || date > fromNode.lastDate) fromNode.lastDate = date;
    }
    if (tx.bank_involved) fromNode.bankInvolved = true;

    toNode.totalIn += amount;
    toNode.transactionCount += 1;
    if (tx.exhibit) toNode.exhibits.add(tx.exhibit);
    toNode.sourceTiers.add(tx.source);
    if (date) {
        if (!toNode.firstDate || date < toNode.firstDate) toNode.firstDate = date;
        if (!toNode.lastDate || date > toNode.lastDate) toNode.lastDate = date;
    }
    if (tx.bank_involved) toNode.bankInvolved = true;

    // Build collapsed edge — group by canonical from→to pair
    const pairKey = `${fromId}||${toId}`;
    if (!edgePairs.has(pairKey)) {
        edgePairs.set(pairKey, {
            id: pairKey,
            source: fromId,
            target: toId,
            totalAmount: 0,
            transactionCount: 0,
            transactions: [],
            exhibits: new Set(),
            sourceTiers: new Set(),
            bankInvolved: false,
            dominantTier: tx.source,
        });
    }
    const edge = edgePairs.get(pairKey);
    edge.totalAmount += amount;
    edge.transactionCount += 1;
    if (amount > 0 && amount > (edgePairs.get(pairKey)._maxAmount || 0)) {
        edge._maxAmount = amount;
        edge.dominantTier = tx.source; // edge color driven by highest-value transaction's tier
    }
    if (tx.exhibit) edge.exhibits.add(tx.exhibit);
    edge.sourceTiers.add(tx.source);
    if (tx.bank_involved) edge.bankInvolved = true;
    edge.transactions.push({
        amount,
        date,
        source: tx.source,
        exhibit: tx.exhibit || null,
        bank_involved: tx.bank_involved || false,
        tier: tx.tier || null,
        context_snippet: tx.context_snippet || null,
        date_recovery_confidence: tx.date_recovery_confidence || null,
    });
});

// ── 3. Compute derived node metrics ────────────────────────────────────────
const nodes = [...nodeMap.values()].map(n => ({
    ...n,
    aliases: [...n.aliases],
    exhibits: [...n.exhibits],
    sourceTiers: [...n.sourceTiers],
    degree: 0, // filled below
    inDegree: 0,
    outDegree: 0,
}));

const nodeById = Object.fromEntries(nodes.map(n => [n.id, n]));

// ── 4. Finalize edges ───────────────────────────────────────────────────────
const edges = [...edgePairs.values()].map(e => ({
    ...e,
    exhibits: [...e.exhibits],
    sourceTiers: [...e.sourceTiers],
    // Sort transactions chronologically
    transactions: e.transactions.sort((a, b) => (a.date || '').localeCompare(b.date || '')),
}));

// Compute degree
edges.forEach(e => {
    if (nodeById[e.source]) {
        nodeById[e.source].outDegree += 1;
        nodeById[e.source].degree += 1;
    }
    if (nodeById[e.target]) {
        nodeById[e.target].inDegree += 1;
        nodeById[e.target].degree += 1;
    }
});

// ── 5. Compute graph-level metadata ────────────────────────────────────────
const allAmounts = edges.map(e => e.totalAmount);
const meta = {
    totalTransactions: raw.length,
    totalEdges: edges.length,
    totalNodes: nodes.length,
    totalFlow: raw.reduce((s, d) => s + (d.amount || 0), 0),
    maxEdgeAmount: Math.max(...allAmounts),
    minEdgeAmount: Math.min(...allAmounts.filter(a => a > 0)),
    maxNodeFlow: Math.max(...nodes.map(n => n.totalIn + n.totalOut)),
    dateRange: {
        min: raw.map(d => normalizeDate(d.date)).filter(Boolean).sort()[0],
        max: raw.map(d => normalizeDate(d.date)).filter(Boolean).sort().at(-1),
    },
    sourceTiers: ['verified_wires', 'audited_PROVEN', 'audited_STRONG', 'audited_MODERATE'],
    exhibits: ['A', 'B', 'C', 'D', 'E'],
};

const graph = { meta, nodes, edges };

// ── 6. Write output ─────────────────────────────────────────────────────────
mkdirSync(resolve(ROOT, 'src/data'), { recursive: true });
writeFileSync(
    resolve(ROOT, 'src/data/graph.json'),
    JSON.stringify(graph, null, 2),
    'utf8'
);

console.log('✅ Preprocessing complete');
console.log(`   Nodes: ${nodes.length} (from ${new Set(raw.flatMap(d => [d.entity_from, d.entity_to])).size} raw names)`);
console.log(`   Edges: ${edges.length} collapsed (from ${raw.length} raw transactions)`);
console.log(`   Total flow: $${meta.totalFlow.toLocaleString()}`);
console.log(`   Date range: ${meta.dateRange.min} → ${meta.dateRange.max}`);
