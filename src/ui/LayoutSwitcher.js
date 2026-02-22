/**
 * Layout Switcher UI
 * Renders layout selection buttons and handles transitions between
 * pre-computed static layouts and the live D3 simulation.
 */

const LAYOUTS = [
    { id: 'd3-live', label: 'D3 Live', file: null },
    { id: 'forceatlas2', label: 'ForceAtlas 2', file: 'forceatlas2.json' },
    { id: 'circular', label: 'Circular', file: 'circular.json' },
    { id: 'radial', label: 'Radial', file: 'radial.json' },
];

const BASE_URL = import.meta.env.BASE_URL;
const layoutCache = new Map();

export function initLayoutSwitcher(containerSelector, forceGraph) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    // Build UI
    const wrapper = document.createElement('div');
    wrapper.id = 'layout-switcher';
    wrapper.innerHTML = `<span class="layout-label">LAYOUT</span>`;

    LAYOUTS.forEach(layout => {
        const btn = document.createElement('button');
        btn.className = `layout-btn${layout.id === 'd3-live' ? ' active' : ''}`;
        btn.textContent = layout.label;
        btn.dataset.layoutId = layout.id;
        btn.addEventListener('click', () => handleSwitch(layout, wrapper, forceGraph));
        wrapper.appendChild(btn);
    });

    container.appendChild(wrapper);
}

async function handleSwitch(layout, wrapper, forceGraph) {
    // Update active state
    wrapper.querySelectorAll('.layout-btn').forEach(b => b.classList.remove('active'));
    wrapper.querySelector(`[data-layout-id="${layout.id}"]`).classList.add('active');

    if (layout.id === 'd3-live') {
        // Restart the D3 force simulation
        forceGraph.restartSimulation();
        return;
    }

    // Load layout JSON (with caching)
    let positions = layoutCache.get(layout.id);
    if (!positions) {
        try {
            const res = await fetch(`${BASE_URL}src/data/layouts/${layout.file}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            positions = await res.json();
            layoutCache.set(layout.id, positions);
        } catch (err) {
            console.error(`[LayoutSwitcher] Failed to load ${layout.file}:`, err);
            return;
        }
    }

    // Apply layout via ForceGraph
    forceGraph.transitionToLayout(positions);
}
