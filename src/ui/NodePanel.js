// src/ui/NodePanel.js
// Right-side detail panel shown on double-click of a node

const TIER_COLORS = {
  verified_wires: '#00d4ff',
  audited_PROVEN: '#00e87a',
  audited_STRONG: '#ffd026',
  audited_MODERATE: '#ff6b35',
};

function fmtAmt(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function fmtDate(d) {
  if (!d) return '—';
  return d.slice(0, 10);
}

function tierBadge(tier) {
  const c = TIER_COLORS[tier] || '#888';
  const label = tier.replace('audited_', '').replace('verified_wires', 'VERIFIED');
  return `<span class="tier-badge" style="color:${c};border-color:${c}22;background:${c}11">${label}</span>`;
}

export class NodePanel {
  constructor() {
    this._panel = document.getElementById('detail-panel');
    this._content = document.getElementById('detail-content');
    this._title = document.getElementById('detail-panel-title');
    this._app = document.getElementById('app');

    document.getElementById('detail-close').addEventListener('click', () => this.close());
  }

  show(node, graph) {
    this._title.textContent = 'ENTITY DETAIL';
    this._panel.classList.remove('hidden');
    this._app.classList.add('detail-open');

    const net = node.totalIn - node.totalOut;
    const netClass = net >= 0 ? 'positive' : 'negative';

    // Gather all transactions involving this node
    const edges = graph.edges.filter(e => e.source === node.id || e.target === node.id);
    const txCount = edges.reduce((s, e) => s + e.transactionCount, 0);

    const aliasHtml = node.aliases?.length
      ? `<div class="detail-aliases">Also recorded as: ${node.aliases.map(a => `<em>${a}</em>`).join(', ')}</div>`
      : '';

    const tierHtml = (node.sourceTiers || []).map(tierBadge).join(' ');

    const txRows = edges.flatMap(e => {
      const isFrom = e.source === node.id;
      const counterparty = isFrom ? e.target : e.source;
      const direction = isFrom ? '→' : '←';
      return e.transactions.map(tx => ({
        counterparty,
        direction,
        amount: tx.amount,
        date: tx.date,
        tier: tx.source,
        exhibit: tx.exhibit,
        context: tx.context_snippet,
      }));
    }).sort((a, b) => (b.amount || 0) - (a.amount || 0)).slice(0, 50);

    this._content.innerHTML = `
      <div class="detail-section">
        <div class="detail-entity-name">${node.label}</div>
        ${aliasHtml}
        <div style="margin-bottom:8px">${tierHtml}</div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">Money Flow</div>
        <div class="stat-grid">
          <div class="stat-box">
            <div class="stat-box-label">Total In</div>
            <div class="stat-box-value positive">${fmtAmt(node.totalIn)}</div>
          </div>
          <div class="stat-box">
            <div class="stat-box-label">Total Out</div>
            <div class="stat-box-value negative">${fmtAmt(node.totalOut)}</div>
          </div>
          <div class="stat-box">
            <div class="stat-box-label">Net Flow</div>
            <div class="stat-box-value ${netClass}">${fmtAmt(Math.abs(net))} ${net >= 0 ? '▲' : '▼'}</div>
          </div>
          <div class="stat-box">
            <div class="stat-box-label">Directed Edges</div>
            <div class="stat-box-value">${node.degree}</div>
          </div>
          <div class="stat-box">
            <div class="stat-box-label">Transactions</div>
            <div class="stat-box-value">${txCount}</div>
          </div>
          <div class="stat-box">
            <div class="stat-box-label">Exhibits</div>
            <div class="stat-box-value">${(node.exhibits || []).join(', ') || '—'}</div>
          </div>
        </div>
        <div style="margin-top:8px;font-family:var(--font-mono);font-size:10px;color:var(--text-muted)">
          ${node.firstDate ? `${fmtDate(node.firstDate)} → ${fmtDate(node.lastDate)}` : 'No dated transactions'}
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">Top Transactions (${txRows.length})</div>
        <ul class="tx-list">
          ${txRows.map(tx => `
            <li class="tx-item">
              <div class="tx-tier-dot" style="background:${TIER_COLORS[tx.tier] || '#888'}"></div>
              <div class="tx-details">
                <div class="tx-counterparty">${tx.direction} ${tx.counterparty}</div>
                <div class="tx-meta">${fmtDate(tx.date)} ${tx.exhibit ? `· Exhibit ${tx.exhibit}` : ''}</div>
                ${tx.context ? `<div class="tx-meta" style="color:var(--text-muted);font-size:9px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${tx.context}</div>` : ''}
              </div>
              <div class="tx-amount">${fmtAmt(tx.amount)}</div>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  close() {
    this._panel.classList.add('hidden');
    this._app.classList.remove('detail-open');
  }
}
