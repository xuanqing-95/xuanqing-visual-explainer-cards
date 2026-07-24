# Theme Presets

Switch via `<html data-accent="...">` on the template. The seed `template.html` ships with all four blocks wired.

One set — one accent. Never mix.

## Indigo Porcelain (default, dual-color)

The primary palette. Two-layer color logic: IKB Blue for structure, Mustard Yellow for emphasis. Use for AI knowledge series, product mechanism, educational content, design, engineering.

```css
:root,
[data-accent="indigo-porcelain"] {
  --paper: #fafaf8;
  --paper-deep: #f0f0ee;
  --ink: #0a0a0a;
  --ink-soft: #1f1f1f;
  --grey-1: #f0f0ee;
  --grey-2: #d4d4d2;
  --grey-3: #737373;
  --accent: #002FA7;       /* IKB Klein Blue — system structure */
  --accent-on: #ffffff;
  --highlight: #F2D24B;    /* Mustard Yellow — emphasis only */
  --highlight-on: #0a0a0a;
}
```

**See `design-system.md` Two-Layer Color Logic.** `--accent` and `--highlight` have different roles. Don't mix them.

## Alternate Accents (single-color)

When Indigo Porcelain doesn't fit, fall back to one of these three. They collapse `--accent` and `--highlight` to one color — emphasis and structure share the same color, so cards read flatter.

### Lemon Yellow

Young, consumer, playful information.

```css
[data-accent="lemon-yellow"] {
  --paper:#fafaf8; --paper-deep:#f0f0ee;
  --ink:#0a0a0a; --ink-soft:#1f1f1f;
  --grey-1:#f0f0ee; --grey-2:#d4d4d2; --grey-3:#737373;
  --accent:#FFD500; --accent-on:#0a0a0a;
  --highlight:#FFD500; --highlight-on:#0a0a0a;
}
```

### Lemon Green

Ecology, future, emerging tech, health.

```css
[data-accent="lemon-green"] {
  --paper:#fafaf8; --paper-deep:#f0f0ee;
  --ink:#0a0a0a; --ink-soft:#1f1f1f;
  --grey-1:#f0f0ee; --grey-2:#d4d4d2; --grey-3:#737373;
  --accent:#C5E803; --accent-on:#0a0a0a;
  --highlight:#C5E803; --highlight-on:#0a0a0a;
}
```

### Safety Orange

Industrial, warning, urgency, decision points.

```css
[data-accent="safety-orange"] {
  --paper:#fafaf8; --paper-deep:#f0f0ee;
  --ink:#0a0a0a; --ink-soft:#1f1f1f;
  --grey-1:#f0f0ee; --grey-2:#d4d4d2; --grey-3:#737373;
  --accent:#FF6B35; --accent-on:#ffffff;
  --highlight:#FF6B35; --highlight-on:#ffffff;
}
```

## Rules

- Use exactly one `data-accent` per set.
- Indigo Porcelain is the recommended default. Switch only when palette truly doesn't fit.
- Do not invent new accent values. If none of the four fits, fall back to Indigo Porcelain.
- Do not use gradients, shadows, or glass effects in any palette.
- Single-color palettes (Lemon Yellow / Green / Safety Orange) lose the structure-vs-emphasis distinction — design cards more sparsely to compensate.
