# Snip Design System

Derived from the visual language of lovable.dev: dark minimal canvas, warm
coral/pink/orange glow, pill-shaped inputs, rounded surface cards.

---

## Color Tokens

| Token                   | Value                       | Usage                          |
|-------------------------|-----------------------------|--------------------------------|
| `--color-bg`            | `#09090b`                   | Page background (zinc-950)     |
| `--color-surface`       | `#111116`                   | Card / panel fill              |
| `--color-surface-raised`| `#1c1c24`                   | Elevated / hover surface       |
| `--color-border`        | `rgba(255,255,255,0.08)`    | Subtle borders everywhere      |
| `--color-text`          | `#f4f4f6`                   | Primary text                   |
| `--color-muted`         | `#6b6b7b`                   | Secondary / placeholder text   |
| `--color-accent-a`      | `#f97316`                   | Gradient start (orange)        |
| `--color-accent-b`      | `#ec4899`                   | Gradient mid (pink)            |
| `--color-accent-c`      | `#f43f5e`                   | Gradient end (rose)            |
| `--color-success`       | `#4ade80`                   | Success notices                |
| `--color-error`         | `#fb7185`                   | Error notices                  |

---

## Gradients

```css
/* Hero ambient glow — radial behind the headline */
--glow: radial-gradient(
  ellipse 90% 60% at 50% 0%,
  rgba(249,115,22,0.18) 0%,
  rgba(244,63,94,0.12) 40%,
  transparent 70%
);

/* Accent — button fill, active states */
--gradient-accent: linear-gradient(135deg, #f97316 0%, #ec4899 100%);

/* Accent text (clip to text for headings if desired) */
--gradient-accent-text: linear-gradient(90deg, #f97316, #ec4899);
```

---

## Typography

```css
--font-sans: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Scale */
--text-hero:   clamp(2.75rem, 6vw, 4.25rem);  /* page H1          */
--text-sub:    1.125rem;                        /* hero subline     */
--text-lg:     1rem;                            /* input / button   */
--text-base:   0.9375rem;                       /* body / table     */
--text-sm:     0.8125rem;                       /* captions, muted  */

/* Weights */
--weight-bold:    700;
--weight-medium:  500;
--weight-normal:  400;

/* Tracking */
--tracking-tight: -0.03em;   /* hero headline */
--tracking-wide:  0.04em;    /* caps labels   */
```

---

## Spacing

Base unit: `0.25rem` (4 px)

| Name   | Value    | Usage                         |
|--------|----------|-------------------------------|
| `xs`   | `0.25rem`| Icon gaps                     |
| `sm`   | `0.5rem` | Inline gaps                   |
| `md`   | `1rem`   | Component inner padding       |
| `lg`   | `1.5rem` | Section row gaps              |
| `xl`   | `2.5rem` | Between major sections        |
| `2xl`  | `5rem`   | Hero top/bottom padding       |
| `3xl`  | `8rem`   | Hero top on large screens     |

---

## Border Radius

| Token          | Value      | Usage                          |
|----------------|------------|--------------------------------|
| `--radius-sm`  | `0.375rem` | Badges, chips                  |
| `--radius-md`  | `0.75rem`  | Notices, small cards           |
| `--radius-lg`  | `1.25rem`  | Primary cards / table wrapper  |
| `--radius-pill`| `9999px`   | Chat-style input, buttons      |

---

## Borders, Shadows & Glow

```css
/* Default card border */
border: 1px solid var(--color-border);

/* Card elevation shadow */
box-shadow: 0 1px 2px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04);

/* Input focus ring */
outline: 2px solid rgba(249,115,22,0.45);
outline-offset: 2px;

/* Primary button glow */
box-shadow: 0 4px 20px rgba(249,115,22,0.35), 0 1px 3px rgba(0,0,0,0.4);
```

---

## Component Mapping

| Snip element         | Design role               | Tokens applied                              |
|----------------------|---------------------------|---------------------------------------------|
| Page `<body>`        | Canvas                    | `--color-bg`, `--glow` overlay              |
| `<h1>` "Snip"        | Hero headline             | `--text-hero`, `--weight-bold`, accent clip |
| Hero subline `<p>`   | Supporting copy           | `--text-sub`, `--color-muted`               |
| URL `<form>`         | Chat-style pill input     | `--radius-pill`, `--color-surface`, glow    |
| `<input>`            | Pill left half            | `--radius-pill`, `--color-muted` placeholder|
| "Shorten" `<button>` | Attached CTA              | `--gradient-accent`, `--radius-pill`, glow  |
| Success notice       | Inline feedback card      | `--color-success`, `--radius-md`, surface   |
| Error notice         | Inline error card         | `--color-error`, `--radius-md`, surface     |
| Links `<table>`      | Content card below hero   | `--radius-lg`, `--color-surface`, border    |
