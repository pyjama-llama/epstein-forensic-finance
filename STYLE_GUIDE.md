# Epstein Forensic Finance — Style Guide

A professional design reference documenting the typography, color system, spacing, and component library used across this application.

---

## Typography

### Font Families

| Role | Family | Fallback |
|------|--------|---------|
| UI / Body | **Inter** | system-ui, sans-serif |
| Monospace / Data | **IBM Plex Mono** | Fira Mono, monospace |

Loaded via Google Fonts with preconnect for performance.

### Type Scale

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `--font-ui` headings | 17–18px | 600 | Chart titles, section headings |
| Body text | 13px | 400 | Labels, descriptions, legend items |
| UI labels / metadata | 12–13px | 400–500 | Filter labels, KPI labels |
| Micro-labels | 9–10px | 500–600 | Group headers (ALL CAPS + letter-spacing) |
| Monospace data | 13–15px | 400–500 | KPI values, amount labels, dates |
| Monospace large | 24–28px | 500 | Dashboard KPI cards |

> [!IMPORTANT]
> **Minimum font size is 13px** for all visible text including SVG chart labels and axis ticks. Never go below this.

### Letter Spacing
- Micro-labels (9–10px, ALL CAPS): `letter-spacing: 0.10–0.15em`
- UI tabs, buttons: `letter-spacing: 0` (natural)
- Mono values: `letter-spacing: -0.02em` (tight, for readability at size)

---

## Color System

### Backgrounds (darkest → lightest)

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-base` | `#070810` | Page background |
| `--bg-surface` | `#0e1020` | Panel backgrounds, topbar |
| `--bg-elevated` | `#141729` | Cards, inputs, active pills |
| `--bg-overlay` | `rgba(7,8,16,0.92)` | Floating tooltips, hint bars |

### Borders

| Token | Hex | Usage |
|-------|-----|-------|
| `--border` | `#1c2140` | Default borders, dividers |
| `--border-light` | `#242848` | Hover states, active controls |

### Text

| Token | Value | Usage |
|-------|-------|-------|
| `--text-bright` | `#ffffff` | Primary values, headings |
| `--text-primary` | `#eef2ff` | Body text, active items |
| `--text-secondary` | `#7a85a3` | Labels, descriptions |
| `--text-muted` | `#4a5270` | Subdued metadata, placeholders |

### Data Tier Colors (encode meaning — do not reuse for UI chrome)

> [!CAUTION]
> These colors are **semantically encoded** to data tier confidence levels. They must NEVER be used for UI controls, interactive states, or decorative elements. Misuse creates false data relationships.

| Token | Hex | Tier | Visual |
|-------|-----|------|--------|
| `--tier-verified` | `#00d4ff` | Verified court wires | Solid line |
| `--tier-proven` | `#00e87a` | Audited — Proven | Dashed |
| `--tier-strong` | `#ffd026` | Audited — Strong | Dashed |
| `--tier-moderate` | `#ff6b35` | Audited — Moderate | Dotted |

### Accent (UI chrome only — not data)

| Token | Value | Usage |
|-------|-------|-------|
| `--accent` | `#00d4ff` | Logo highlight, spinner, node hover glow |
| `--accent-dim` | `rgba(0,212,255,0.4)` | Subtle borders where data association is clear |
| `--accent-glow` | `rgba(0,212,255,0.15)` | Focus halos where absolutely necessary |

> [!WARNING]
> `--accent` shares the same hex as `--tier-verified`. Use it **only** where the context is unambiguous (the logo, the graph nodes). In filter panels and form controls, always use neutral tokens.

---

## Components

### Filter Panel Controls

| Control | Inactive state | Active/selected state |
|---------|---------------|----------------------|
| Checkbox | `--border-light` border, transparent bg | `--text-muted` fill, dark checkmark |
| Pills | `--border-light` border, `--text-muted` label | `--bg-elevated` bg, `--text-primary` label |
| Range slider thumb | `--text-secondary` circle | `--text-primary` circle on hover |
| Date input focus | `--border-light` border | No glow/shadow |

**Rationale**: Filter controls use structural neutrals only. Colored states would suggest a data relationship that doesn't exist.

### Navigation Tabs

| State | Background | Text |
|-------|-----------|------|
| Default | transparent | `--text-secondary` |
| Hover | `rgba(fff,4%)` | `--text-primary` |
| Active | `--bg-elevated` | `--text-bright` |

Border: `1px solid var(--border-light)` on active.

### KPI Cards (Analytics Dashboard)

- Background: `--bg-elevated`
- Border: `--border`  
- Value: `--font-mono`, 26px, `--text-bright`
- Label: 11px, ALL CAPS, `letter-spacing: 0.08em`, `--text-muted`

---

## Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `--topbar-h` | 56px | Fixed topbar height |
| `--panel-w` | 260px | Left filter panel width |
| `--detail-w` | 320px | Right detail panel width |
| `--radius` | 6px | Default border radius |
| `--radius-sm` | 3px | Small elements (checkboxes, buttons) |

---

## Transitions

| Token | Value | Usage |
|-------|-------|-------|
| `--t-fast` | `0.12s ease` | Hover states, interactive feedback |
| `--t-mid` | `0.25s ease` | Panel reveals, state changes |
| `--t-slow` | `0.4s ease` | Layout transitions |

---

## Chart Typography Rules

- All SVG text: minimum **13px**
- All axis tick labels: **13px**, `--text-muted`
- Chart titles: **17–18px**, `600` weight, `--text-bright`
- Chart subtitles: **13px**, `--text-muted`, italic or light weight
- Tooltip labels: **13px** bold, **15–16px** mono for values
- Tier color dots in legend: the 4 explicit tier hex colors only

---

## Legend Rules

- **Tier color swatches** use only the 4 data tier tokens
- **Node size / edge width** indicators use `--text-muted` neutral circles/lines — not tier colors
- Legend dots/icons are purely informational geometry, not interactive
