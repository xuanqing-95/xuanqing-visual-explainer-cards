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

A poster is Editorial only if **all five** hold:

1. Every large display title (≥64px) uses `.h-display` / `.h-xl` / `.h-md` / `.series-zh` / `.term-en` / `.pullquote`. They all render in serif.
2. **Display weights are ≤500.** "The larger, the lighter." Body and lead are also serif-zh, never sans.
3. IKB Blue (`--accent`) is visible on every page — at minimum on the chrome hairline + category label, foot hairline + page number.
4. Mustard Yellow (`--highlight`) appears in the entire set exactly once: the cover bar under `.term-en`. Not on content-page titles, kickers, numbers, key options, or backgrounds.
5. Section dividers are hairlines (1px) or chrome top/bottom borders, not boxes with drop shadows.

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

### Anti-pattern A: Mustard yellow leaks onto content pages

```html
<!-- WRONG: yellow on a content-page title -->
<h2 class="h-xl">Demo 漂亮<br>
  <em style="background:var(--highlight);padding:0 12px;">上生产翻车</em>
</h2>

<!-- WRONG: yellow kicker on every page -->
<p class="kicker" style="background:var(--highlight);">缺 LLMOps 的典型症状</p>

<!-- WRONG: yellow number blocks -->
<span class="num" style="background:var(--highlight);">01</span>

<!-- WRONG: yellow "key option" letter -->
<span class="letter" style="background:var(--highlight);">C</span>
```

**Mustard yellow is for the cover bar. That's it.** When yellow appears on three content pages, the cover stops looking like a cover and the set turns into a yellow-themed deck. Use IKB blue for everything that needs to read as "structure" or "system marker"; use IKB underline for in-title emphasis.

### Anti-pattern B: IKB blue invisible on the page

```html
<!-- WRONG: chrome with no IKB -->
<div class="chrome" style="border-bottom:1px solid var(--grey-2);">
  <span style="color:var(--grey-3);">CATEGORY</span>
  <span style="color:var(--grey-3);">02 / 05</span>
</div>
```

The page renders as pure black/grey/paper. IKB blue is the system color — if a reader can't tell which design system this card came from at a glance, the system has no presence. Put IKB on the chrome hairline, the category label, the foot hairline, and the page number at minimum.

### Anti-pattern C: Footer overlap

When `.foot` is positioned with `position: absolute; bottom: ...`, any content above that grows past its expected height crashes through the footer. Use the seed template's `margin-top: auto` flex column pattern — don't override it.

### Anti-pattern D: Illustration repeats the title

If the outer HTML title says `LLMOps`, the generated illustration must NOT render `LLMOps` as an in-image label. The illustration explains the mechanism; the outer card states the topic. Duplication wastes the card's most expensive visual moment.

### Anti-pattern E: Generic decorative SVG

Random ovals, blobs, sparkles, gradient shapes — any visual element that does not point to a specific piece of information — break the editorial identity. If a shape cannot be labeled, remove it.

### Anti-pattern F: Pinned content-page templates

Designing every set as "cover → concept+image → tall ledger → before/after → closing" produces visually identical decks across totally different topics. Read `layouts.md` — the cover is fixed; content pages are composed fresh from primitives based on content shape.

### Anti-pattern G: Heavy display weights / sans body

```html
<!-- WRONG: bold serif display reads as "heavy infographic banner" -->
<h1 class="h-display" style="font-weight:700;">每天吃透一个 AI 知识点</h1>

<!-- WRONG: sans body reads as "landing page", not magazine -->
<p class="body" style="font-family:var(--sans-zh);">…</p>
```

The single most important rule of the system is **"the larger, the lighter"**. Display sizes use weight 500, never 700+. The second most important rule is **body and lead are serif-zh, not sans**. Sans display + sans body + small type was the symptom of the 2026-06-09 regression — when the cover felt cramped and the content felt like a slide deck, this rule was being violated.

### Anti-pattern H: Tracking too tight on display + mono

```html
<!-- WRONG: serif Chinese display with negative tracking looks crushed -->
<h2 class="h-xl" style="letter-spacing:-.01em;">…</h2>

<!-- WRONG: kicker without wide tracking looks like body text -->
<p class="kicker" style="letter-spacing:normal;">…</p>
```

Display titles use **positive** tracking (+.03 to +.04em on display, +.02em on mid). Kicker, meta, section-label, chrome, foot all use **+.20em or more**. Tight mono uppercase reads as code editor, not magazine label.
