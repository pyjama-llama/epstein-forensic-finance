// src/ui/FilterPanel.js
// Wires all filter UI controls to the shared store

import { store, computeVisibleGraph } from '../state/store.js';
import { TimelineBrush } from './TimelineBrush.js';
import { AmountBrush } from './AmountBrush.js';

export class FilterPanel {
    constructor(graph) {
        this._graph = graph;
        this._bindTierCheckboxes();
        this._bindExhibitPills();
        this._bindBrushComponents(graph.data);
        this._bindBankFilter();
        this._bindClearAll();
    }

    _dispatch() {
        const state = store.get();
        const { visibleNodeIds, visibleEdgeIds } = computeVisibleGraph(state);
        store.set({ visibleNodeIds, visibleEdgeIds });
    }

    _bindTierCheckboxes() {
        document.querySelectorAll('.filter-check input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', () => {
                const tiers = new Set(
                    [...document.querySelectorAll('.filter-check input:checked')].map(el => el.value)
                );
                store.set({ tiers });
                this._dispatch();
            });
        });
    }

    _bindExhibitPills() {
        document.querySelectorAll('#exhibit-pills .pill').forEach(pill => {
            pill.addEventListener('click', () => {
                pill.classList.toggle('active');
                const exhibits = new Set(
                    [...document.querySelectorAll('#exhibit-pills .pill.active')].map(el => el.dataset.value)
                );
                store.set({ exhibits });
                this._dispatch();
            });
        });
    }

    _bindBrushComponents(data) {
        // --- Amount Brush ---
        const amountDisplay = document.getElementById('amount-display');
        const labelMin = document.getElementById('amount-label-min');
        const labelMax = document.getElementById('amount-label-max');

        const { meta } = this._graph;
        const logMin = Math.log10(Math.max(meta.minEdgeAmount, 1));
        const logMax = Math.log10(meta.maxEdgeAmount);

        const toAmt = pct => Math.pow(10, logMin + (pct / 100) * (logMax - logMin));
        const fmtAmt = n => n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n.toFixed(0)}`;

        this.amountBrush = new AmountBrush('amount-brush-container', data, (minPct, maxPct) => {
            if (minPct === 0 && maxPct === 100) {
                amountDisplay.textContent = 'All';
                labelMin.textContent = '$0';
                labelMax.textContent = '$23M+';
            } else {
                amountDisplay.textContent = `${fmtAmt(toAmt(minPct))} – ${fmtAmt(toAmt(maxPct))}`;
                labelMin.textContent = fmtAmt(toAmt(minPct));
                labelMax.textContent = fmtAmt(toAmt(maxPct));
            }

            store.set({ amountMin: minPct, amountMax: maxPct });
            this._dispatch();
        });

        // --- Timeline Brush ---
        const dateDisplay = document.getElementById('date-display');
        this.timelineBrush = new TimelineBrush('date-brush-container', data, (from, to) => {
            dateDisplay.textContent = from || to ? `${from || '?'} – ${to || '?'}` : 'All';
            store.set({ dateFrom: from, dateTo: to });
            this._dispatch();
        });
    }

    _bindBankFilter() {
        ['bank-all', 'bank-yes', 'bank-no'].forEach(id => {
            document.getElementById(id).addEventListener('click', (e) => {
                document.querySelectorAll('[data-bank]').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                store.set({ bankFilter: e.currentTarget.dataset.bank });
                this._dispatch();
            });
        });
    }

    _bindClearAll() {
        document.getElementById('filter-clear').addEventListener('click', () => {
            // Reset checkboxes
            document.querySelectorAll('.filter-check input[type="checkbox"]').forEach(cb => cb.checked = true);
            // Reset exhibit pills
            document.querySelectorAll('#exhibit-pills .pill').forEach(p => p.classList.add('active'));
            // Reset brushes
            if (this.amountBrush) this.amountBrush.reset();
            if (this.timelineBrush) this.timelineBrush.reset();

            document.getElementById('amount-label-min').textContent = '$0';
            document.getElementById('amount-label-max').textContent = '$23M+';
            document.getElementById('amount-display').textContent = 'All';
            document.getElementById('date-display').textContent = 'All';
            // Reset bank
            document.querySelectorAll('[data-bank]').forEach(b => b.classList.remove('active'));
            document.getElementById('bank-all').classList.add('active');

            store.set({
                tiers: new Set(['verified_wires', 'audited_PROVEN', 'audited_STRONG', 'audited_MODERATE']),
                exhibits: new Set(['A', 'B', 'C', 'D', 'E']),
                amountMin: 0, amountMax: 100,
                dateFrom: null, dateTo: null,
                bankFilter: 'all',
            });
            this._dispatch();
        });
    }
}
