# Layout Recipes — Principles, Not Templates

Read this when designing any page in a card set.

This skill ships **exactly one fixed layout**: the S00 Series Cover. Every other page in a set is composed fresh based on the content shape. Do not invent named layout "S01 / S02 / S03 / S04" and force pages into them — that produces the same five pages no matter what the content is, which is exactly what we don't want.

## The One Fixed Layout: S00 Series Cover

Use the cover skeleton in `assets/template.html` verbatim. Replace these placeholders:

| Variable | Example | Notes |
|---|---|---|
| `Day NN` | `Day 04` | top-right chrome |
| Section label | `Indigo Porcelain` | small IKB tag with square mark |
| `term-en` | `LLMOps` | huge serif English, mustard yellow bar underneath |
| `term-zh` | `AI 代码编辑器` | Chinese explanation of the English technical term; do not use an English subtitle here |
| `term-question` | `为什么同一个模型,别人用起来效果炸裂,你用起来平平无奇?` | open-ended hook |
| `foot-tagline` | `LLMOPS · 从能跑到可控` | bottom-left tag |

Hard rules for the cover:
- The mustard yellow bar under `term-en` is the **only** place mustard yellow appears in the entire card set.
- The cover does NOT carry an illustration. The huge English term IS the visual.
- `term-en` should fit on one line. If your term is >8 characters, switch to two lines or shorten.
- `term-zh` must be the Chinese meaning/explanation of `term-en`, e.g. `AI 代码编辑器`, `上下文窗口`, `智能体`; it is not an English subtitle or slogan.
- `term-question` is one open question, not a sentence summarizing the topic.

## Content Pages: Compose Fresh

For pages 2 onwards, do not pick a pre-named recipe. Instead:

### Step 1 — Identify the content shape

Read the page's storyboard message and ask: what shape is this? The seed template ships six **named content-page snippets** (commented HTML at the bottom of `assets/template.html`) that map to common shapes. Copy one as a starting point, then adjust.

| Content shape | Snippet to copy | What it gives you |
|---|---|---|
| One metaphor / mental model / "X is like Y" | **P-METAPHOR** | Large 540px illustration + IKB caption + 2-3 line body |
| Numbered list of 3-4 typical items (symptoms / steps / signals) | **P-LIST** | Stacked rows, each with 200px thumb + IKB number + body line |
| Two states compared (before / after, wrong / right, demo / 生产) | **P-COMPARE** | Two side-by-side columns, each with 240px illustration + label + 3 bullets |
| A sequence / pipeline / process | **P-MECHANISM** | 3-4 vertical step rows, each with 130px inline icon + IKB step no. + body |
| One pull-quote or definition that is the whole page | **P-QUOTE** | Pullquote left + 420px illustration right (the rare type-led page) |
| Closing self-check / call to action | **P-ACTION** | Small 200px illustration + 2-3 lettered options + IKB accent line |

These snippets are starting points, not constraints. You may invent variants, combine two shapes, drop sections — but every content page must follow the **Hard Rules** below.

### Step 2 — Decide whether to illustrate

Most content pages should pair **text + small illustration**. Text leads, illustration explains.

Default to including an illustration when:
- The page introduces a metaphor or concrete scene
- The page describes a mechanism, flow, or transformation
- The page lists items that have visible referents (kitchen stations, dashboard panels, food, tools, body parts, etc.)
- The page compares two states that look different

Skip illustration only when:
- The page is a pure pull-quote or definition
- The page is a checklist of abstract verbs ("review", "decide", "ship") that has no clear visual
- The page is the cover (already covered by S00)

Let the source content decide the exact page count before choosing layouts. Typical sets are **4-7 pages including the cover**. As a rough rhythm, use **3-4 pages with illustrations, 1-2 type-led pages** when the set lands in that range. Avoid both extremes (one giant illustration on page 2 only / illustration on every single page).

### Step 3 — Size the illustration to support, not dominate

This is the rule that prevents illustrations from taking over the page:

- Concept page where image IS the explanation: `.illust-frame` 480-560px tall
- Page where image supports a list/comparison: thumbnails 160-260px, multiple per page
- Page where image is one small mark of a mechanism: inline 100-160px

The text content should still occupy at least 60% of the page's visual weight. If the illustration is louder than the title, shrink it.

### Step 3.1 — Place the illustration as a native card element

Do not drop generated images into a raw empty block and hope they look balanced. Every major generated illustration must sit inside an `.evidence-figure` wrapper so the image reads as part of the card, not as a pasted screenshot.

Use these defaults:

- Default generated content-page image: `<figure class="evidence-figure landscape"><div class="illust-frame">...</div></figure>`
- Concept / metaphor evidence: `<figure class="evidence-figure hero"><div class="illust-frame wide-flow">...</div></figure>`
- Wide workflow / comparison strip: `<figure class="evidence-figure wide"><div class="illust-frame wide-flow">...</div></figure>`
- Square object / compact scene: `<figure class="evidence-figure square"><div class="illust-frame">...</div></figure>`
- Tall mechanism / stacked scene: `<figure class="evidence-figure portrait"><div class="illust-frame">...</div></figure>`
- Small support mark or action image: `<figure class="evidence-figure compact"><div class="illust-frame">...</div></figure>`

Placement rules:

- The evidence block should sit between title and explanatory copy, vertically centered in its own band.
- Do not align the image to the top of the available space. If the band has extra room, center the image optically.
- Do not leave more than one-third of the evidence band as blank paper above or below the visual subject.
- If a generated image still feels pasted in, first adjust the frame class (`wide-flow`, `zoom-110`, `zoom-125`) and band height; only regenerate if labels or composition remain wrong.
- Avoid task-specific CSS like `margin-top:-40px` or arbitrary absolute positioning. That fixes one card and breaks the next.

### Step 3.5 — Define the slot before generating

Before writing an image prompt, define the final `image_slot`. The slot decides the HTML wrapper, the approximate rendered size, the generator `--ar`, the expected physical canvas, and the pixel-safe subject box. Do not generate an image first and then pick a slot afterward.

Minimum `image_slot` shape:

```yaml
image_slot:
  html_wrapper: evidence-figure landscape
  slot_px: 904x603
  slot_ratio: 3:2
  generator_ar: 4:3
  generator_canvas: 1536x1024
  subject_bbox: x=120-1416,y=128-896
  fit: contain
```

Slot choice:

- Normal generated concept/metaphor/mechanism image: generate `4:3` or `16:10`, then place in `.evidence-figure.landscape`. The local generator returns a `1536x1024` landscape image; the slot must stay close to 3:2 or the image will shrink.
- Wide process/metaphor/comparison wells: use `.evidence-figure.wide` only for genuinely long horizontal diagrams or HTML-native diagrams. If the generated bitmap is `1536x1024`, prefer `.evidence-figure.landscape` unless you intentionally crop/enlarge after inspecting labels.
- Tall standalone evidence: generate `3:4`, then place in `.evidence-figure.portrait` or another deliberate vertical evidence well.
- Square objects: generate `1:1`, then use `.evidence-figure.square`, a side-by-side text/image module, or row thumbnails.
- Row thumbnails or small mechanism marks: generate `1:1` or `4:3`, then place in 100-260px wells.

Do not put a square generated image into a wide workflow slot unless you intentionally add `.zoom-125` or `.zoom-140` and verify no label is cropped. If the image looks correct but too small because of safe margins, use these classes on the frame:

- `.wide-flow` for wide workflow diagrams that should fill the available width.
- `.zoom-110` for a subtle crop-safe enlargement.
- `.zoom-125` for margin-heavy generated images.
- `.zoom-140` only when the image has very large paper margins and all labels remain visible.

### Step 4 — Use only primitives from the seed

Build with these classes (all defined in `assets/template.html`):

- `.poster.xhs` — the 1080×1440 board
- `.content` — the flex column inside
- `.chrome` + `.foot` — top/bottom IKB hairline bars (required on every page)
- `.section-label` — the per-page IKB tag with square mark
- `.h-display` (124px) / `.h-xl` (88px) / `.h-md` (56px) / `.pullquote` (64px italic) — display titles; add `.title-underline` only for rare in-title emphasis
- `.h-sub` (36px italic Playfair) — English subtitles
- `.lead` (28px serif) / `.body` (24px serif) — body copy
- `.kicker` (21px mono) / `.meta` `.label` (18px mono) — small meta text
- `.illust-frame` — AI-generated illustrations (object-fit: contain)
- `.evidence-figure` — stable wrapper for generated illustrations; use for every major content-page illustration
- `.illust-frame.wide-flow`, `.zoom-110`, `.zoom-125`, `.zoom-140` — controlled enlargement for generated images with too much paper margin
- `.frame-img` — photographic evidence (object-fit: cover)
- `.hr-accent` (IKB) / `.hr-hairline` (grey) — dividers
- `.img-cap` — IKB mono caption under illustrations

Add task-scoped CSS (inside `<style>` in `index.html`) for anything else the specific content needs — grid columns for a comparison, padding for a special card, etc. Do not add the task-scoped CSS back into the seed; it should not be reusable.

## Hard Rules That Apply to Every Content Page

1. **IKB blue must be visible.** At minimum on: top chrome hairline + category label, bottom foot hairline + page number. Plus at least one of: section label, divider, body `<strong>`, illustration caption.
2. **Mustard yellow does not appear.** Not on titles, not on backgrounds, not on numbers, not on key options. Yellow lives only on the cover.
3. **Content density ≥ 75%.** No pure-whitespace band wider than 216px without a stated reason.
4. **Each page has a section label** (`.section-label`) explaining what kind of page this is in 2-5 mono English/Chinese words.
5. **No 1-of-N letter highlight.** Don't pick a "key option" and wrap it in yellow. If a step is more important, write it that way in the copy.

## What Was Removed and Why

Earlier versions of this file listed S01-S04 as fixed templates (concept+image, tall ledger, before/after, closing). They were removed because:

- They produced visually identical card sets across different topics.
- They taught the agent to fit content to a template instead of designing for content.
- They concentrated mustard yellow on multiple content-page elements (ledger numbers, key options, kickers), which over-saturated the emphasis color.
- They led to "one illustration per set" because only the concept template had an `.illust-frame` slot.

If you want a recipe-driven mode in the future, build it as an alternate seed under `assets/`, not by re-pinning S01-S04 here.
