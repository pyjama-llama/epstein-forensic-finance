// src/ui/SearchBar.js
// Fuse.js fuzzy search — searches entity labels and aliases

import Fuse from 'fuse.js';

export class SearchBar {
    constructor({ onSelect, onClear }) {
        this.onSelect = onSelect;
        this.onClear = onClear;
        this._fuse = null;
        this._activeIndex = -1;
        this._results = [];

        this._input = document.getElementById('search-input');
        this._resultsList = document.getElementById('search-results');

        this._bindEvents();
        this._bindShortcut();
    }

    load(nodes) {
        // Build searchable list including aliases
        const searchList = nodes.map(n => ({
            id: n.id,
            label: n.label,
            aliases: (n.aliases || []).join(' '),
            searchText: [n.label, ...(n.aliases || [])].join(' '),
        }));

        this._fuse = new Fuse(searchList, {
            keys: ['label', 'aliases'],
            threshold: 0.35,
            distance: 100,
            includeMatches: true,
            minMatchCharLength: 2,
        });
        this._nodes = nodes;
    }

    _bindEvents() {
        this._input.addEventListener('input', () => this._onInput());
        this._input.addEventListener('keydown', e => this._onKeydown(e));
        this._input.addEventListener('blur', () => {
            // Delay to allow click on result
            setTimeout(() => this._hideResults(), 150);
        });
        this._input.addEventListener('focus', () => {
            if (this._input.value.trim()) this._onInput();
        });
    }

    _bindShortcut() {
        document.addEventListener('keydown', e => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                this._input.focus();
                this._input.select();
            }
            if (e.key === 'Escape' && document.activeElement === this._input) {
                this._clear();
                this._input.blur();
            }
        });
    }

    _onInput() {
        const q = this._input.value.trim();
        if (!q || !this._fuse) {
            this._hideResults();
            if (!q) this.onClear?.();
            return;
        }

        const results = this._fuse.search(q, { limit: 8 });
        this._results = results;
        this._activeIndex = -1;
        this._renderResults(results, q);
    }

    _renderResults(results, query) {
        if (!results.length) {
            this._resultsList.innerHTML = `<li class="search-result-item"><span class="result-name" style="color:var(--text-muted)">No results for "${query}"</span></li>`;
            this._resultsList.classList.remove('hidden');
            return;
        }

        this._resultsList.innerHTML = results.map((r, i) => {
            const node = this._nodes.find(n => n.id === r.item.id);
            const flow = node ? this._fmtAmt(node.totalIn + node.totalOut) : '';
            const highlighted = this._highlightMatch(r.item.label, query);
            return `
        <li class="search-result-item" role="option" data-index="${i}" data-id="${r.item.id}">
          <span class="result-name">${highlighted}</span>
          <span class="result-meta">${flow ? `$${flow}` : ''}</span>
        </li>
      `;
        }).join('');

        this._resultsList.querySelectorAll('.search-result-item').forEach(el => {
            el.addEventListener('mousedown', (e) => {
                e.preventDefault();
                const id = el.dataset.id;
                const node = this._nodes.find(n => n.id === id);
                if (node) this._selectResult(node);
            });
        });

        this._resultsList.classList.remove('hidden');
    }

    _highlightMatch(text, query) {
        // Simple highlight: bold matching substring
        const idx = text.toLowerCase().indexOf(query.toLowerCase());
        if (idx === -1) return this._esc(text);
        return (
            this._esc(text.slice(0, idx)) +
            `<mark>${this._esc(text.slice(idx, idx + query.length))}</mark>` +
            this._esc(text.slice(idx + query.length))
        );
    }

    _esc(s) {
        return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    _onKeydown(e) {
        const items = this._resultsList.querySelectorAll('.search-result-item[data-id]');
        if (!items.length) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this._activeIndex = Math.min(this._activeIndex + 1, items.length - 1);
            this._updateActive(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this._activeIndex = Math.max(this._activeIndex - 1, 0);
            this._updateActive(items);
        } else if (e.key === 'Enter' && this._activeIndex >= 0) {
            const id = items[this._activeIndex]?.dataset.id;
            const node = this._nodes.find(n => n.id === id);
            if (node) this._selectResult(node);
        }
    }

    _updateActive(items) {
        items.forEach((el, i) => el.classList.toggle('active', i === this._activeIndex));
        items[this._activeIndex]?.scrollIntoView({ block: 'nearest' });
    }

    _selectResult(node) {
        this._input.value = node.label;
        this._hideResults();
        this.onSelect?.(node);
    }

    _hideResults() {
        this._resultsList.classList.add('hidden');
        this._resultsList.innerHTML = '';
        this._activeIndex = -1;
    }

    _clear() {
        this._input.value = '';
        this._hideResults();
        this.onClear?.();
    }

    _fmtAmt(n) {
        if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
        if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
        return n.toFixed(0);
    }
}
