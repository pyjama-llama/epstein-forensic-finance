import fs from 'fs';
import path from 'path';

const INPUT_FILE = path.resolve('./src/data/graph.json');
const OUTPUT_FILE = path.resolve('./epstein_network.gexf');

function escapeXml(unsafe) {
    if (!unsafe) return '';
    return unsafe.toString().replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
    });
}

function generateGexf() {
    console.log(`[Gephi Exporter] Reading from ${INPUT_FILE}...`);
    const rawData = fs.readFileSync(INPUT_FILE, 'utf-8');
    const graphData = JSON.parse(rawData);

    const { nodes, edges, meta } = graphData;

    console.log(`[Gephi Exporter] Parsing ${nodes.length} nodes and ${edges.length} aggregate edges...`);

    let gexf = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    gexf += `<gexf xmlns="http://www.gexf.net/1.2draft" version="1.2">\n`;

    // Meta
    const today = new Date().toISOString().split('T')[0];
    gexf += `  <meta lastmodifieddate="${today}">\n`;
    gexf += `    <creator>Epstein Network Exporter</creator>\n`;
    gexf += `    <description>Total Flow: $${(meta.totalFlow / 1e6).toFixed(2)}M</description>\n`;
    gexf += `  </meta>\n`;

    // Graph
    gexf += `  <graph defaultedgetype="directed" mode="static">\n`;

    // Node Attributes Definitions
    gexf += `    <attributes class="node">\n`;
    gexf += `      <attribute id="totalIn" title="Total In" type="float" />\n`;
    gexf += `      <attribute id="totalOut" title="Total Out" type="float" />\n`;
    gexf += `      <attribute id="transactionCount" title="Transaction Count" type="integer" />\n`;
    gexf += `      <attribute id="bankInvolved" title="Bank Involved" type="boolean" />\n`;
    gexf += `      <attribute id="degree" title="Local Degree" type="integer" />\n`;
    gexf += `    </attributes>\n`;

    // Edge Attributes Definitions
    gexf += `    <attributes class="edge">\n`;
    gexf += `      <attribute id="totalAmount" title="Total Amount" type="float" />\n`;
    gexf += `      <attribute id="transactionCount" title="Transaction Count" type="integer" />\n`;
    gexf += `      <attribute id="dominantTier" title="Dominant Tier" type="string" />\n`;
    gexf += `    </attributes>\n`;

    // Nodes
    gexf += `    <nodes>\n`;
    nodes.forEach(node => {
        const id = escapeXml(node.id);
        const label = escapeXml(node.label || node.id);

        gexf += `      <node id="${id}" label="${label}">\n`;
        gexf += `        <attvalues>\n`;
        gexf += `          <attvalue for="totalIn" value="${node.totalIn || 0}" />\n`;
        gexf += `          <attvalue for="totalOut" value="${node.totalOut || 0}" />\n`;
        gexf += `          <attvalue for="transactionCount" value="${node.transactionCount || 0}" />\n`;
        gexf += `          <attvalue for="bankInvolved" value="${node.bankInvolved ? 'true' : 'false'}" />\n`;
        gexf += `          <attvalue for="degree" value="${node.degree || 0}" />\n`;
        gexf += `        </attvalues>\n`;
        gexf += `      </node>\n`;
    });
    gexf += `    </nodes>\n`;

    // Edges
    gexf += `    <edges>\n`;
    edges.forEach((edge, index) => {
        const id = `e${index}`;
        const source = escapeXml(edge.source);
        const target = escapeXml(edge.target);
        const weight = edge.totalAmount || 1; // Native gephi edge weight

        gexf += `      <edge id="${id}" source="${source}" target="${target}" weight="${weight}">\n`;
        gexf += `        <attvalues>\n`;
        gexf += `          <attvalue for="totalAmount" value="${edge.totalAmount || 0}" />\n`;
        gexf += `          <attvalue for="transactionCount" value="${edge.transactionCount || 0}" />\n`;
        gexf += `          <attvalue for="dominantTier" value="${escapeXml(edge.dominantTier || 'unknown')}" />\n`;
        gexf += `        </attvalues>\n`;
        gexf += `      </edge>\n`;
    });
    gexf += `    </edges>\n`;

    gexf += `  </graph>\n`;
    gexf += `</gexf>\n`;

    fs.writeFileSync(OUTPUT_FILE, gexf, 'utf-8');
    console.log(`[Gephi Exporter] Successfully wrote GEXF to ${OUTPUT_FILE}`);
    console.log(`[Gephi Exporter] Instructions: Load this file into Gephi, run ForceAtlas 2 layout, and export the graph data (JSON/GEXF) back to src/data/layouts/.`);
}

generateGexf();
