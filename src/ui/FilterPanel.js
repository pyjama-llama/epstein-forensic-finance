// src/ui/FilterPanel.js
// Wires all filter UI controls to the shared store

import { store, computeVisibleGraph } from '../state/store.js';

export class FilterPanel {
    constructor(graph) {
        this._graph = graph;
        this._bindTierCheckboxes();
        this._bindExhibitPills();
        this._bindAmountSlider();
        this._bindDateInputs();
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

    _bindAmountSlider() {
        const minSlider = document.getElementById('amount-min');
        const maxSlider = document.getElementById('amount-max');
        const labelMin = document.getElementById('amount-label-min');
        const labelMax = document.getElementById('amount-label-max');
        const display = document.getElementById('amount-display');

        const { meta } = this._graph;
        const logMin = Math.log10(Math.max(meta.minEdgeAmount, 1));
        const logMax = Math.log10(meta.maxEdgeAmount);

        const toAmt = pct => Math.pow(10, logMin + (pct / 100) * (logMax - logMin));
        const fmtAmt = n => n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n.toFixed(0)}`;

        const update = () => {
            let minV = parseInt(minSlider.value);
            let maxV = parseInt(maxSlider.value);
            if (minV > maxV) { minSlider.value = maxV; minV = maxV; }

            labelMin.textContent = fmtAmt(toAmt(minV));
            labelMax.textContent = maxV === 100 ? `$${fmtAmt(toAmt(100))}+` : fmtAmt(toAmt(maxV));
            display.textContent = minV === 0 && maxV === 100 ? 'All' : `${fmtAmt(toAmt(minV))} – ${fmtAmt(toAmt(maxV))}`;

            store.set({ amountMin: minV, amountMax: maxV });
            this._dispatch();
        };

        minSlider.addEventListener('input', update);
        maxSlider.addEventListener('input', update);
    }

    _bindDateInputs() {
        const fromInput = document.getElementById('date-from');
        const toInput = document.getElementById('date-to');
        const display = document.getElementById('date-display');

        const update = () => {
            const from = fromInput.value.trim() || null;
            const to = toInput.value.trim() || null;
            display.textContent = from || to ? `${from || '?'} – ${to || '?'}` : 'All';
            store.set({ dateFrom: from, dateTo: to });
            this._dispatch();
        };

        fromInput.addEventListener('input', update);
        toInput.addEventListener('input', update);
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
            // Reset sliders
            document.getElementById('amount-min').value = 0;
            document.getElementById('amount-max').value = 100;
            document.getElementById('amount-label-min').textContent = '$0';
            document.getElementById('amount-label-max').textContent = '$23M+';
            document.getElementById('amount-display').textContent = 'All';
            // Reset date
            document.getElementById('date-from').value = '';
            document.getElementById('date-to').value = '';
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
