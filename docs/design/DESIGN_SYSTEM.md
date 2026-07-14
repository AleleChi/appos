# AppOS Design System

This document outlines the design foundations and specifications implemented for the AppOS Premium Enterprise SaaS landing page, matching the high-fidelity Stitch mockups and specifications.

## 1. Brand Color Palette

We utilize a high-contrast, premium color scheme designed to appeal to enterprise-grade teams, emphasizing trust, performance, and modern developer tooling.

| Token | Hex Value | Role | Usage |
|---|---|---|---|
| `--color-brand-bg` | `#F7F9FC` | Primary Light Background | Page container background, subtle card alternate backdrops. |
| `--color-brand-dark` | `#0A1020` | Primary Dark | Dark section background (Security), hero badges, bold title accents. |
| `--color-brand-primary`| `#635BFF` | Brand Accent (Indigo) | Primary call-to-action buttons, active states, pipeline visual flow. |
| `--color-brand-accent` | `#00A8FF` | Accent Blue | Secondary metrics highlight, active visual indicators. |
| `--color-brand-neutral`| `#FFFFFF` | Core Neutral White | Card backgrounds, navigation headers, primary structural containers. |
| `--color-brand-text-primary` | `#0A1020` | Text Primary | Title fonts, bold headers, primary text reads. |
| `--color-brand-text-secondary`| `#4A5568` | Text Secondary | Descriptive prose, label text, secondary documentation reads. |

---

## 2. Typography Hierarchy

Typography is configured inside Tailwind v4 with the following families and sizes:

### Font Families
- **Display Typography**: `Plus Jakarta Sans`, designed with tight-tracking and bold weights for modern tech-forward marketing titles.
- **UI Typography**: `Inter`, clean, highly readable, and versatile across multiple responsive viewport configurations.
- **Monospace Code/Telemetry**: `JetBrains Mono`, used strictly for badges, numerical progress counts, and literal status indicators.

### Sizing and Weights
- **Hero Title**: `text-4.5xl` to `text-5.5xl` (Desktop), `text-3.5xl` (Mobile), bold weight, tracking-tight.
- **Section Heading**: `text-3xl` to `text-4.5xl`, bold weight, tracking-tight.
- **Card Subheading**: `text-lg` to `text-2xl`, bold weight.
- **Body Prose**: `text-base` to `text-lg` (Desktop), `text-sm` (Mobile), normal weight, leading-relaxed.
- **Metadata Labels**: `text-[10px]` to `text-xs`, semibold weight, uppercase tracking-wider.

---

## 3. Responsive Breakpoints

We adhere to a responsive-first framework optimized across three specific viewport matrices:

1. **Desktop (1440px+)**: Multi-column grids (asymmetric feature lists, side-by-side scorecards), generous negative space, inline list-nav links.
2. **Tablet (768px - 1024px)**: Standard double-column columns, proportional spacing, collapse/hamburger menu, standard scale adjustments.
3. **Mobile (320px - 480px)**: Stacked single-column card flows, touch-friendly interactives (min 44px target sizes), responsive Mobile Hero Copy ("Your website. Your app. One platform.").
