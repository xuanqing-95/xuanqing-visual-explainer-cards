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
| `term-zh` | `大模型运维体系` | IKB blue sub-line |
| `term-question` | `为什么同一个模型,别人用起来效果炸裂,你用起来平平无奇?` | open-ended hook |
| `foot-tagline` | `LLMOPS · 从能跑到可控` | bottom-left tag |

Hard rules for the cover:
- The mustard yellow bar under `term-en` is the **only** place mustard yellow appears in the entire card set.
- The cover does NOT carry an illustration. The huge English term IS the visual.
- `term-en` should fit on one line. If your term is >8 characters, switch to two lines or shorten.
- `term-question` is one open question, not a sentence summarizing the topic.

## Content Pages: Compose Fresh

For pages 2 onwards, do not pick a pre-named recipe. Instead:

### Step 1 — Identify the content shape

Read the page's storyboard message and ask: what shape is this?

| Content shape | Suggests |
|---|---|
| One metaphor explaining an abstract concept | Image-dominant: large `.illust-frame` + short caption |
| A numbered list of 3 items | Type rhythm: 3 stacked rows, IKB number marks, small thumb illustrations beside each |
| Two states being compared (before/after, wrong/right) | Two columns side-by-side, each with mini illustration + label |
| One mechanism with steps | Vertical or horizontal flow, small illustrations marking each step |
| One self-check or call to action | Type-led, IKB structural marks, optional small illustration |
| One quote or insight | Type-led pull quote, IKB rule above, possibly no illustration |

This is a starting prompt, not a recipe. Many pages combine two shapes.

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

Typical 5-page set: **3-4 pages with illustrations, 1-2 type-only pages**. Avoid both extremes (one giant illustration on page 2 only / illustration on every single page).

### Step 3 — Size the illustration to support, not dominate

This is the rule that prevents illustrations from taking over the page:

- Concept page where image IS the explanation: `.illust-frame` 480-560px tall
- Page where image supports a list/comparison: thumbnails 160-260px, multiple per page
- Page where image is one small mark of a mechanism: inline 100-160px

The text content should still occupy at least 60% of the page's visual weight. If the illustration is louder than the title, shrink it.

### Step 4 — Use only primitives from the seed

Build with these classes (all defined in `assets/template.html`):

- `.poster.xhs` — the 1080×1440 board
- `.content` — the flex column inside
- `.chrome` + `.foot` — top/bottom IKB hairline bars (required on every page)
- `.section-label` — the per-page IKB tag with square mark
- `.h-display` (124px) / `.h-xl` (88px) / `.h-md` (56px) / `.pullquote` (64px italic) — display titles, with IKB underline `em`
- `.h-sub` (36px italic Playfair) — English subtitles
- `.lead` (28px serif) / `.body` (24px serif) — body copy
- `.kicker` (21px mono) / `.meta` `.label` (18px mono) — small meta text
- `.illust-frame` — AI-generated illustrations (object-fit: contain)
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
