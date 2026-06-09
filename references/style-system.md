# Style System

This skill is **Editorial-first**. The default mode produces magazine-style educational cards: serif display titles, sans body, mono meta, dual-color (IKB Blue structure + Mustard Yellow emphasis).

A secondary **Swiss mode** is available for users who explicitly want it — pure Helvetica/Inter, one accent, ultra-light huge type, hairline rules. Switch via `data-mode="swiss"` on `<html>`.

## Shared Rules (both modes)

- Content shape decides layout. Do not pick a pretty layout first and invent content to fit it.
- Use strong hierarchy: chrome, kicker, display title, evidence, caption.
- Use real images or generated illustrations as evidence, not decoration.
- Avoid visible clutter: no random SVG circles, oval drops, blobs, bokeh, ornamental stickers, fake diagram decorations, or decorative gradients.
- Keep all pages in a set visually related through grid, typography, palette, and recurring metadata.
- Every page should have a clear focal point.

---

## Editorial Mode (default)

Visual anchors:

- **Serif** for display: Playfair Display (English) + Noto Serif SC (Chinese).
- **Sans** for body: Noto Sans SC, Inter.
- **Mono** for meta: IBM Plex Mono in chrome/foot/kicker.
- Strict 12-column grid feel, left alignment, asymmetric whitespace.
- Off-white paper (`#fafaf8`), ink black, refined greys.
- Dual color: IKB Klein Blue (`#002FA7`) for structure + Mustard Yellow (`#F2D24B`) for emphasis only.
- Straight modules, hairline rules, no rounded cards, no shadows, no glassmorphism.

### Editorial Identity Test

A poster is Editorial only if **all four** hold:

1. Every large display title (≥64px) uses `.h-display-zh` / `.h-section-zh` / `.series-zh` / `.term-en`. They all render in serif.
2. Mustard Yellow (`--highlight`) only appears on: `.kicker`, `em` inside titles, `.ledger .num`, `.hr-accent`, `.term-en::before` bar, `.closing .opt.is-key`. Nowhere else.
3. IKB Blue (`--accent`) is the only structural color. Used inside illustrations + brand chrome only — NOT on display titles.
4. Section dividers are hairlines (1px) or chrome top/bottom borders, not boxes with drop shadows.

If any one fails, the poster is not Editorial — it is generic infographic. Fix it before delivery.

---

## Swiss Mode (opt-in via `data-mode="swiss"`)

Use when the user explicitly asks for "Swiss style" or when content is so dense that serif display titles feel wrong (e.g., 10+ data points per page).

Visual anchors:

- Inter, Helvetica Neue feel.
- Very light display weights (200-300) for huge type.
- One accent, no highlight pair.
- "The larger, the lighter" — ≥72px must use weight ≤300.

### Swiss Identity Test

A Swiss poster is Swiss only if **all three** hold:

1. Every display title ≥72px has `font-weight ≤ 300`.
2. No serif family is loaded — no Noto Serif SC, no Playfair Display.
3. Exactly one accent palette in use, no highlight pair.

---

## Image Rules

- Photos: crop with intent. Keep faces, hands, products, and main objects in safe areas.
- Generated illustrations: pick the ratio that matches the final slot; do not default everything to 3:4.
- Use `.illust-frame` (object-fit: contain) for AI-generated illustrations.
- Use `.frame-img` (object-fit: cover) for photographic evidence where cropping is acceptable.
- Generated images must respect the system palette — see `illustration-prompts.md` Palette Lock.
- Generated images should not include page chrome, titles, borders, captions, or fake UI unless required by the concept.

## Anti-Patterns

### Anti-pattern A: Highlight color overuse

```html
<!-- WRONG: highlight on every page element -->
<div class="kicker">Action</div>
<h2 class="h-display-zh"><em>每一行</em>都<em>这样</em></h2>
<hr class="hr-accent">
<p class="lead" style="background:var(--highlight);">连正文都黄</p>
```

`--highlight` is **emphasis only**. If 5+ things on a page wear yellow, none of them are emphasized — they all become decoration. Hard cap: **1 em block per display title, 1 kicker per page**.

### Anti-pattern B: Mixing accent and highlight roles

```html
<!-- WRONG: structure color used as emphasis -->
<h2 class="h-display-zh"><em style="background:var(--accent);color:white">这里很重要</em></h2>

<!-- WRONG: highlight color used as structure -->
<div class="content" style="background:var(--highlight);">整页都黄</div>
```

IKB Blue and Mustard Yellow have specific, non-overlapping roles. Mixing them breaks the calm-vs-accent rhythm — the system reads as "two random colors" instead of "structure + emphasis".

### Anti-pattern C: Footer overlap

When `.foot` is positioned with `position: absolute; bottom: ...`, any content above that grows past its expected height crashes through the footer. Use the seed template's `margin-top: auto` flex column pattern — don't override it.

### Anti-pattern D: Illustration repeats the title

If the outer HTML title says `LLMOps`, the generated illustration must NOT render `LLMOps` as an in-image label. The illustration explains the mechanism; the outer card states the topic. Duplication wastes the card's most expensive visual moment.

### Anti-pattern E: Generic decorative SVG

Random ovals, blobs, sparkles, gradient shapes — any visual element that does not point to a specific piece of information — break the editorial identity. If a shape cannot be labeled, remove it.
