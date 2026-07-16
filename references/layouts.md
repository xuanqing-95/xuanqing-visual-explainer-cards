# Layout Recipes — Principles, Not Templates

Read this when designing any page in a card set.

This skill ships **exactly one fixed layout**: the S00 Series Cover. Compose every other page fresh from the content shape and shared primitives.

## Contents

- S00 Series Cover
- Content-page composition workflow
- Slot-first image placement
- Shared template primitives
- Content-page hard rules

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

The storyboard must already have passed `scripts/validate-storyboard.mjs`. Treat `pages[].layout` and `page_rhythm.beats[].silhouette` as design inputs, not descriptions added after the page is finished.

### Step 1 — Identify the content shape

Read the page's storyboard message and ask: what shape is this? The seed template ships six **named content-page snippets** (commented HTML at the bottom of `assets/template.html`) that map to common shapes. Copy one as a starting point, then adjust.

| Content shape | Snippet to copy | What it gives you |
|---|---|---|
| One metaphor / mental model / "X is like Y" | **P-METAPHOR** | Large 540px illustration + IKB caption + 2-3 line body |
| Numbered list of 3-4 visible items (symptoms / tools / signals) | **P-LIST** | One 200px generated thumbnail per row + exact HTML copy |
| Two visibly different states (before / after, wrong / right, demo / 生产) | **P-COMPARE** | Two 240px generated state images + exact HTML columns |
| A sequence / pipeline / process with distinct visible steps | **P-MECHANISM** | One 130px generated icon per step + numbered HTML copy |
| One pull-quote or definition that is the whole page | **P-QUOTE** | Pullquote left + 420px illustration right (the rare type-led page) |
| Closing self-check / call to action | **P-ACTION** | Small 200px illustration + 2-3 lettered options + IKB accent line |

These snippets are starting points, not constraints. You may invent variants, combine two shapes, drop sections — but every content page must follow the **Hard Rules** below.

### Step 2 — Decide the illustration role and size

Every non-cover content page pairs **text + at least one model-generated illustration**. Text leads, illustration explains. HTML diagrams and screenshots may be added for precision, but they do not replace the generated illustration.

Count independently visible referents. Use one image when one scene genuinely explains the whole page. Use multiple images when separate list items, comparison states, or process steps need separate visual evidence. A single generated strip remains an optional composition, not the default replacement for several referents.

Default to including an illustration when:
- The page introduces a metaphor or concrete scene
- The page describes a mechanism, flow, or transformation
- The page lists items that have visible referents (kitchen stations, dashboard panels, food, tools, body parts, etc.)
- The page compares two states that look different

Use a compact supporting illustration when:
- The page is a pure pull-quote or definition
- The page is a checklist of abstract verbs ("review", "decide", "ship")
- Exact code, numbers, prices, or table data must remain in HTML

The S00 cover is the only default page without an illustration. Let the source content decide the exact page count before choosing layouts. Typical sets are **4-7 pages including the cover**. Vary the illustration scale so concept pages may be image-led while checklist or data pages use compact support.

### Step 3 — Size the illustration to support, not dominate

This is the rule that prevents illustrations from taking over the page:

- Concept page where image IS the explanation: `.illust-frame` 480-560px tall
- Page with visible list items: one 160-260px thumbnail per item
- Page comparing visible states: one 200-280px image per state
- Page with visible process steps: one inline 100-160px image per step

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

Before writing an image prompt, define every final `illustrations[].image_slot`. Each slot decides that illustration's HTML wrapper, rendered size, requested orientation, explicit model output canvas, and pixel-safe subject box. Do not generate images first and then pick slots afterward.

Minimum `image_slot` shape:

```yaml
image_slot:
  html_wrapper: evidence-figure landscape
  slot_px: 904x603
  slot_ratio: 3:2
  requested_orientation: landscape
  model_output_size: 1536x1024
  subject_bbox: x=120-1416,y=128-896
  fit: contain
```

Slot choice:

- Normal generated concept/metaphor/mechanism image: request `landscape` at `1536x1024`, then place it in `.evidence-figure.landscape`. The slot must stay close to 3:2 or the image will shrink.
- Wide process/metaphor/comparison wells: use `.evidence-figure.wide` only for genuinely long horizontal diagrams or HTML-native diagrams. If the generated bitmap is `1536x1024`, prefer `.evidence-figure.landscape` unless you intentionally crop/enlarge after inspecting labels.
- Tall standalone evidence: request `portrait` at `1024x1536`, then place it in `.evidence-figure.portrait` or another deliberate vertical evidence well.
- Square objects: request `square` at `1024x1024`, then use `.evidence-figure.square`, a side-by-side text/image module, or row thumbnails.
- Row thumbnails or small mechanism marks: use square or landscape output, then place them in 100-260px wells.

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

1. **Model-generated illustration evidence is required.** Include every storyboard-planned `<img data-generated-illustration="true" data-illustration-id="...">` inside `.illust-frame`, with its generator-written `.generation.json` sidecar.
2. **IKB blue must be visible.** At minimum on: top chrome hairline + category label, bottom foot hairline + page number. Plus at least one of: section label, divider, body `<strong>`, illustration caption.
3. **Mustard yellow does not appear.** Not on titles, not on backgrounds, not on numbers, not on key options. Yellow lives only on the cover.
4. **Content density ≥ 75%.** No pure-whitespace band wider than 216px without a stated reason.
5. **Each page has a section label** (`.section-label`) explaining what kind of page this is in 2-5 mono English/Chinese words.
6. **No 1-of-N letter highlight.** Don't pick a "key option" and wrap it in yellow. If a step is more important, write it that way in the copy.
7. **Bind HTML to the storyboard.** Set `data-page-id`, `data-layout`, and `data-silhouette` on every `.poster`; keep each `data-illustration-id`, asset path, and wrapper class equal to its declared `illustrations[]` contract.
