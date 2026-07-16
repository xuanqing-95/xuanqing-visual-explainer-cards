# Design System

Use this as the single source of truth for canvas, typography, colors, components, image containers, and background patterns.

## Contents

- Canvas and Editorial identity
- Color and typography
- Required page structure
- Image containers
- Page rhythm and background patterns
- Release checks

## Canvas

- Final board: `1080x1440` (3:4).
- Content padding: 96px top/bottom and 88px left/right.
- Stable pixels only inside posters; do not use `vw` or `vh`.
- Spacing scale: 8, 12, 16, 24, 32, 40, 48, 64, 80, 96px.
- Every `.poster` uses `overflow:hidden`.

## Editorial identity

The default identity is magazine-like Editorial:

- serif Chinese display, body, and lead;
- Playfair Display for large English terms and italic subtitles;
- IBM Plex Mono for chrome, labels, captions, and metadata;
- straight modules and hairline rules;
- off-white paper, black ink, restrained accent color;
- no rounded cards, shadows, gradients, glass effects, or decorative blobs.

Content shape decides layout. Visual evidence must explain, not decorate.

## Color

Default **Indigo Porcelain**:

```css
--paper: #fafaf8;
--paper-deep: #f0f0ee;
--ink: #0a0a0a;
--ink-soft: #1f1f1f;
--grey-1: #f0f0ee;
--grey-2: #d4d4d2;
--grey-3: #737373;
--accent: #002FA7;
--accent-on: #ffffff;
--highlight: #F2D24B;
--highlight-on: #0a0a0a;
```

Hard rules for the default:

- IKB blue is visible on every page through chrome, foot, labels, dividers, page numbers, inline emphasis, or illustration accents.
- Mustard yellow appears once per set: the bar under the cover's English term.
- Do not use mustard on content-page titles, numbers, options, or backgrounds.
- Use one accent preset for the entire set.

The template also includes three working single-color alternatives:

| `data-accent` | Accent | Best fit |
|---|---:|---|
| `lemon-yellow` | `#FFD500` | young, consumer, playful |
| `lemon-green` | `#C5E803` | ecology, health, emerging tech |
| `safety-orange` | `#FF6B35` | warning, urgency, decisions |

These alternatives use the same color for `--accent` and `--highlight`. Use them only when Indigo Porcelain does not fit; do not invent extra presets.

## Typography

The larger, the lighter. Display text uses weight 500 unless the cover's English term explicitly calls for heavier Playfair.

| Role | Class | Size | Weight | Family |
|---|---|---:|---:|---|
| Display | `.h-display` | 124px | 500 | serif-zh |
| Section title | `.h-xl` | 88px | 500 | serif-zh |
| Mid title | `.h-md` | 56px | 500 | serif-zh |
| English subtitle | `.h-sub` | 36px | 400 italic | serif-en |
| Pull quote | `.pullquote` | 64px | 500 italic | serif-zh |
| Lead | `.lead` | 28px | 400 | serif-zh |
| Body | `.body` | 24px | 400 | serif-zh |
| Kicker / section label | `.kicker`, `.section-label` | 21px | 500 | mono |
| Meta / caption / chrome | `.meta`, `.img-cap`, `.chrome`, `.foot` | 18px | 500 | mono |

Cover-only:

| Role | Class | Size | Weight |
|---|---|---:|---:|
| Series title | `.cover-series .series-zh` | 96px | 500 |
| English term | `.cover-series .term-en` | 240px | 900 |
| Chinese explanation | `.cover-series .term-zh` | 42px | 500 |
| Scenario question | `.cover-series .term-question` | 56px | 500 |

Rules:

- Body and lead are serif Chinese, never sans.
- Display tracking is positive, about `+.03em` to `+.04em`.
- Mono labels use at least `+.20em` tracking.
- Keep mono out of body copy.
- Minimum body size is 24px; cut copy instead of shrinking below it.
- The cover `.term-zh` is a Chinese explanation, not an English slogan.

### Chinese title bands

| Shape | Suggested size |
|---|---:|
| 1 line, up to 6 Chinese characters | 124px display / 88px xl |
| 1 line, 7–10 characters | 108px / 78px |
| 2 lines, up to 8 characters each | 96px / 78px |
| 2 lines, 9–12 characters on a line | 84px / 68px |
| 3 lines | shorten or split the page |

### Emphasis

Plain `em` is semantic emphasis only. Add `.title-underline` for an IKB underline on at most 0–2 key turning-point pages.

```html
<h2 class="h-xl title-underline">Demo 漂亮<br><em>上生产翻车</em></h2>
```

Use `.body strong` for restrained IKB inline emphasis. Do not create yellow text backgrounds on content pages.

## Required page structure

Every page contains:

1. `.chrome` at the top;
2. a clear focal title or statement;
3. visual or structural evidence;
4. `.foot` pinned at the bottom with `margin-top:auto`.

```html
<div class="chrome">
  <span class="c-cat">核心比喻 · METAPHOR</span>
  <span class="c-num">02 / 05</span>
</div>
...
<div class="foot">
  <span class="f-tag">一句收束</span>
  <span class="f-num">02 / 05</span>
</div>
```

Use `.section-label` for the per-page IKB marker. Use `.img-cap` for image captions.

## Image containers

| Class | Natural role |
|---|---|
| `.evidence-figure.landscape` | default 3:2 evidence well for `1536x1024` output |
| `.evidence-figure.hero` | 500–600px concept or metaphor band |
| `.evidence-figure.wide` | 340–460px genuinely wide strip |
| `.evidence-figure.square` | centered 1:1 object or compact scene |
| `.evidence-figure.portrait` | centered tall mechanism or scene |
| `.evidence-figure.compact` | 220–300px supporting mark |
| `.illust-frame` | generated illustration with `object-fit:contain` |
| `.frame-img` | photograph with intentional `object-fit:cover` crop |

Major generated illustrations use both layers:

```html
<figure class="evidence-figure landscape">
  <div class="illust-frame">
    <img src="assets/page-03.png" alt="具体描述图中机制">
  </div>
  <figcaption class="img-cap">Fig. 03 · 一句说明</figcaption>
</figure>
```

Small row thumbnails and inline step marks may use `.illust-frame` directly. Do not place a square or portrait image in a shallow full-width band.

Available recovery classes:

- `.wide-flow`: enlarge a margin-heavy wide diagram to about 118%;
- `.zoom-110`, `.zoom-125`, `.zoom-140`: controlled enlargement after background normalization.

Use them only after checking that no label, arrow, or subject is cropped.

## Page rhythm

For a typical 4–7 page set:

1. cover;
2. concept or metaphor;
3. mechanism or causal chain;
4. example or comparison;
5. boundary, tradeoff, or misconception;
6. closing action.

This is a rhythm reference, not a fixed page count. Every non-cover content page needs a model-generated illustration. HTML diagrams, comparisons, processes, and ledgers may supplement that illustration when they communicate exact information more clearly.

Record the chosen rhythm in `storyboard.yaml` before writing HTML. Every `.poster` must expose the planned `data-page-id`, `data-layout`, and `data-silhouette`; final validation compares them with the storyboard.

## Background patterns

Use at most one quiet matrix layer on a sparse cover or statement page:

- `.dot-mat`: sparse dot matrix;
- `.cross-mat`: cross-hatch matrix;
- `.ring-mat`: ring matrix.

Place it before `.content` so the pattern stays at z-index 1 and content at z-index 2. Omit patterns on dense pages and never stack them.

## Release checks

- storyboard preflight passes before HTML design;
- HTML page ids, layouts, silhouettes, wrappers, and generated asset paths match the storyboard;
- final board is 1080×1440;
- content uses at least 75% of the vertical canvas;
- one accent preset per set;
- no rounded cards, shadows, or gradients;
- body remains at least 24px;
- generated image wrapper and actual canvas match the storyboard;
- no broken images or placeholder artwork;
- fonts, media, and final PNG artifacts pass `scripts/validate.mjs`.
