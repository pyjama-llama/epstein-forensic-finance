# Epstein Network - Typography & Style Guide

To ensure a robust, professional "forensic dashboard" aesthetic that scales well on desktop and laptop monitors, we strictly adhere to the following typography rules. 

**Core Philosophies:**
1. **Minimize variations:** Too many small font sizes (10px, 11px, 12px) cause visual noise and ruin hierarchy.
2. **Scale for Desktop:** The application is built for monitors, meaning the baseline text size should be large enough to fill space comfortably without feeling cramped.
3. **Data is Mono:** All numbers, dates, and quantitative values MUST use the monospace font to ensure tabular alignment and forensic precision.

---

## 1. Typefaces

| Role | Font Family | CSS Variable | Usage |
| :--- | :--- | :--- | :--- |
| **Primary (UI)** | `Inter`, `system-ui` | `var(--font-sans)` | All standard text, labels, buttons, and search interfaces. |
| **Data (Quantitative)** | `IBM Plex Mono`, `monospace` | `var(--font-mono)` | All transaction amounts, dates, KPI numbers, and filter numeric labels. |

---

## 2. Global Font Sizing Scale

We have eliminated micro-fonts (10-12px) from the default layout to improve readability. 

| Tier | Size (Base) | Size (Large Monitor >1400px) | Weight | Line Height | Usage Example |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **H1 (Mega)** | 26px / 32px | 32px / 40px | 600 (Semi-bold) | 1.1 | Total Flow KPI (`.kpi-value`), Entity Detail Header (`.val-amount`) |
| **H2 (Title)** | 20px | 24px | 500 (Medium) | 1.2 | Entity Name in Detail Panel (`.detail-entity-name`) |
| **H3 (Section)**| 16px | 18px | 600 (Semi-bold) | 1.3 | Panel Headers, Filter Group Labels |
| **Base (Body)** | 14px | 16px | 400 (Regular) | 1.5 | Checkbox labels, Legend text, Transaction rows, Search results |
| **Small (Data)**| 13px (Mono) | 14px (Mono) | 400 (Regular) | 1.4 | Range slider numbers, Exhibit pill text, TX metadata timestamps |

> *Note: There are NO fonts smaller than 13px in the system. If it seems too big, rely on color muting (`var(--text-muted)`) rather than shrinking the font size to establish hierarchy.*

---

## 3. Color Hierarchy applied to Typography

Instead of making less-important information tiny, we make it dimmer.

| Variable | Hex Code | Visual | Usage |
| :--- | :--- | :--- | :--- |
| `var(--text-bright)` | `#ffffff` | Pure White | Data values, Active search results, Selected nodes |
| `var(--text-primary)`| `#e2e8f0` | Light Gray | Standard body copy, labels, panel titles |
| `var(--text-secondary)`| `#94a3b8` | Mid Gray | Deselected items, secondary table rows |
| `var(--text-muted)` | `#64748b` | Dark Gray | Meta-data, timestamps, explanatory subtext |

---

## 4. UI Examples

### Filter Checkboxes
- **Font:** `var(--font-sans)`, 14px (16px large), `var(--text-primary)`
- *Rationale: Must be immediately legible as primary interactive elements.*

### Transaction Amounts (Detail Panel)
- **Font:** `var(--font-mono)`, 16px (18px large), `var(--text-bright)`
- *Rationale: This is the core forensic data; it must be monospaced to align decimals visually and bright to stand out.*

### Meta-Timestamps (Detail Panel)
- **Font:** `var(--font-mono)`, 13px (14px large), `var(--text-muted)`
- *Rationale: It is secondary information. It uses the Small scale (13px) but relies on `--text-muted` to stay out of the way of the primary Transaction Amount.*
