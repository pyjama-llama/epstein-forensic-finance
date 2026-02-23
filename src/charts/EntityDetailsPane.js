import * as d3 from 'd3';
import { fmtAmount } from './chartUtils.js';
import { entityNarratives } from '../data/entityNarratives.js';

/**
 * EntityDetailsPane
 * Autonomous component to render a side-panel ledger of transactions for a specific entity.
 */
export function renderEntityDetails(selector, entityName, data, onClose) {
    const container = d3.select(selector);
    container.html(''); // Clear previous content

    if (!entityName) {
        container.html('<p style="color: var(--text-muted); text-align: center; margin-top: 40px; font-size: 13px;">Select an entity to view details</p>');
        return;
    }

    // 1. Extract and format the ledger
    const ledger = [];
    let totalIn = 0;
    let totalOut = 0;

    data.edges.forEach(edge => {
        if (!edge.transactions) return;

        if (edge.source === entityName) {
            // Money leaving the entity (they are the source)
            edge.transactions.forEach(tx => {
                const amt = parseFloat(tx.amount) || 0;
                totalOut += amt;
                ledger.push({
                    date: tx.date || 'Unknown Date',
                    amount: amt,
                    type: 'out',
                    counterparty: edge.target,
                    purpose: tx.purpose || 'Unknown'
                });
            });
        } else if (edge.target === entityName) {
            // Money entering the entity (they are the target)
            edge.transactions.forEach(tx => {
                const amt = parseFloat(tx.amount) || 0;
                totalIn += amt;
                ledger.push({
                    date: tx.date || 'Unknown Date',
                    amount: amt,
                    type: 'in',
                    counterparty: edge.source,
                    purpose: tx.purpose || 'Unknown'
                });
            });
        }
    });

    // 2. Sort ledger by date descending
    ledger.sort((a, b) => new Date(b.date) - new Date(a.date));

    // 3. Render Header Profile
    const header = container.append('div')
        .style('position', 'relative')
        .style('margin-bottom', '24px');

    if (onClose) {
        header.append('button')
            .html('&times;')
            .style('position', 'absolute')
            .style('right', '0')
            .style('top', '0')
            .style('background', 'transparent')
            .style('border', 'none')
            .style('color', 'var(--text-muted)')
            .style('font-size', '20px')
            .style('line-height', '1')
            .style('cursor', 'pointer')
            .on('click', () => {
                onClose();
            })
            .on('mouseover', function () { d3.select(this).style('color', 'var(--text-bright)'); })
            .on('mouseout', function () { d3.select(this).style('color', 'var(--text-muted)'); });
    }

    header.append('h3')
        .style('margin', '0 0 12px')
        .style('font-size', '17px')
        .style('color', 'var(--text-bright)')
        .style('word-break', 'break-word')
        .style('line-height', '1.3')
        .style('padding-right', '24px') // leave room for close btn
        .text(entityName);

    const statsGroup = header.append('div')
        .style('display', 'flex')
        .style('gap', '24px')
        .style('font-family', 'var(--font-mono)')
        .style('font-size', '13px');

    statsGroup.append('div')
        .style('display', 'flex')
        .style('flex-direction', 'column')
        .html(`<span style="color:var(--text-muted); font-size: 11px; text-transform: uppercase; margin-bottom: 2px;">Total In</span><span style="color: #4CAF50; font-weight: 500;">${fmtAmount(totalIn)}</span>`);

    statsGroup.append('div')
        .style('display', 'flex')
        .style('flex-direction', 'column')
        .html(`<span style="color:var(--text-muted); font-size: 11px; text-transform: uppercase; margin-bottom: 2px;">Total Out</span><span style="color: #F44336; font-weight: 500;">${fmtAmount(totalOut)}</span>`);

    // 3.5 Inject Entity Narrative Context
    if (entityNarratives[entityName]) {
        container.append('article')
            .style('margin-bottom', '24px')
            .style('padding', '16px')
            .style('background', 'rgba(255, 255, 255, 0.03)')
            .style('border-left', '3px solid var(--text-muted)')
            .style('border-radius', '0 4px 4px 0')
            .style('color', 'var(--text-secondary)')
            .style('font-size', '13px')
            .style('line-height', '1.5')
            .style('font-style', 'italic')
            .text(entityNarratives[entityName]);
    }

    // 4. Render Ledger List
    const tableContainer = container.append('div')
        .style('display', 'flex')
        .style('flex-direction', 'column')
        .style('gap', '12px');

    if (ledger.length === 0) {
        tableContainer.append('div')
            .style('color', 'var(--text-muted)')
            .style('font-size', '13px')
            .style('padding', '20px 0')
            .style('text-align', 'center')
            .text('No transaction history found.');
        return;
    }

    tableContainer.append('div')
        .style('font-size', '12px')
        .style('font-weight', '600')
        .style('color', 'var(--text-secondary)')
        .style('text-transform', 'uppercase')
        .style('letter-spacing', '0.05em')
        .style('padding-bottom', '8px')
        .style('border-bottom', '1px solid var(--border)')
        .text(`Transactions (${ledger.length})`);

    const scrollArea = tableContainer.append('div')
        .style('display', 'flex')
        .style('flex-direction', 'column')
        .style('gap', '8px');

    ledger.forEach(tx => {
        const row = scrollArea.append('div')
            .style('display', 'flex')
            .style('flex-direction', 'column')
            .style('padding', '12px')
            .style('background', 'var(--bg-base)')
            .style('border-radius', '6px')
            .style('border', '1px solid var(--border)');

        const topRow = row.append('div')
            .style('display', 'flex')
            .style('justify-content', 'space-between')
            .style('align-items', 'center')
            .style('margin-bottom', '6px');

        const isOut = tx.type === 'out';

        topRow.append('span')
            .style('font-family', 'var(--font-mono)')
            .style('font-size', '14px')
            .style('color', isOut ? '#F44336' : '#4CAF50')
            .style('font-weight', '600')
            .text(`${isOut ? '-' : '+'}${fmtAmount(tx.amount)}`);

        topRow.append('span')
            .style('font-family', 'var(--font-mono)')
            .style('font-size', '11px')
            .style('color', 'var(--text-muted)')
            .text(tx.date.substring(0, 10)); // YYYY-MM-DD

        const bottomRow = row.append('div')
            .style('font-size', '12px')
            .style('color', 'var(--text-secondary)')
            .style('display', 'flex')
            .style('flex-direction', 'column')
            .style('gap', '4px')
            .style('line-height', '1.4');

        bottomRow.append('span')
            .html(`<span style="color:var(--text-muted)">${isOut ? 'To:' : 'From:'}</span> <strong style="color:var(--text-bright);font-weight:500;">${tx.counterparty}</strong>`);

        if (tx.purpose && tx.purpose !== 'Unknown') {
            bottomRow.append('span')
                .style('font-style', 'italic')
                .style('color', 'var(--text-muted)')
                .text(tx.purpose);
        }
    });
}
