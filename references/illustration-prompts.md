# Illustration Prompt Protocol

Create the central visual evidence for an educational card.

Default mode is **GPT Image 2 labeled illustration**: the generated image may contain a small number of exact Chinese labels, while the outer card remains HTML-led.

## When to Generate an Illustration (hard rule)

**Most content pages should pair text + small illustration.** Text leads, illustration explains. The point of this skill is the *combination* — pure-text card sets and one-giant-illustration card sets both fail the brief.

Default to including an illustration when the page has any of:

- A metaphor or concrete scene (kitchen, dashboard, traffic light)
- A mechanism, flow, or transformation (input → process → output)
- Items with visible referents (stations, tools, products, body parts, food)
- Two states being compared visually (before/after, wrong/right)

Skip illustration only when:

- The page is a pure pull-quote or one-line definition
- The page is a checklist of abstract verbs ("review", "decide", "ship") with no clear visual
- The page is the cover (the huge English term IS the visual)

Typical 5-page set: **3-4 pages with illustrations + 1-2 type-only pages**. Avoid both:

- One giant illustration on page 2, nothing else → boring
- One full-page illustration on every page → overwhelming

## How Big Should the Illustration Be (hard rule)

Text-led pages need small, supporting illustrations. Illustration-led pages can go larger but never fill the whole canvas.

| Page role | `.illust-frame` height |
|---|---|
| Concept page where image IS the explanation | 480-560px |
| Page where image supports a list (one mini per row) | 160-260px each |
| Page where image is one small mark on a mechanism | 100-160px inline |

The text content should still occupy at least 60% of the page's visual weight. If the illustration is louder than the title, shrink it.

## Aspect Ratio and Cropping Contract

Generate the image for its final slot, not for a generic square canvas.

| Final slot | Use `--ar` | Prompt opening | Composition requirement |
|---|---|---|---|
| Wide workflow / process strip | `16:10` or `4:3` | `Generate a wide 16:10 Chinese educational illustration panel.` | Main diagram spans 82-90% of canvas width; no large empty margins |
| Large concept evidence well | `4:3` | `Generate a wide 4:3 Chinese educational illustration panel.` | Main subject fills 72-84% of canvas width and 60-78% height |
| Tall standalone mechanism | `3:4` | `Generate a clean 3:4 vertical Chinese educational illustration panel.` | Use only when the image itself is the main vertical evidence |
| Inline icon / row thumbnail | `1:1` or `4:3` | `Generate a compact icon-like illustration.` | One object, centered, no labels unless essential |

For content-page illustrations, avoid square-looking compositions unless the final HTML slot is square. A square drawing inside a wide slot will render too small. The local generator maps `4:3` to a landscape canvas; if your output log says `1024x1024` for a `4:3` request, stop and fix the generator before accepting the image.

Always add this to `SCENE` for wide content-page illustrations:

```text
Fill the central 82-90% of the image width with the diagram. Keep only a narrow paper margin. Do not create a small centered diagram surrounded by empty paper.
All labels must be horizontal and placed inside or directly below their modules.
```

If GPT Image 2 returns a valid but margin-heavy image, use the HTML class `.wide-flow`, `.zoom-110`, `.zoom-125`, or `.zoom-140` on `.illust-frame` after checking no labels are cropped.

## Composition Contract

Every generated illustration prompt must include a measurable subject-size contract. Do not rely on vague words like "large" or "balanced".

Use one of these contracts:

| Illustration role | Required content width | Required content height |
|---|---:|---:|
| Wide workflow / process / comparison | 88-94% of canvas | 50-64% of canvas |
| Concept explanation / mechanism | 82-90% of canvas | 62-76% of canvas |
| Metaphor scene | 84-92% of canvas | 58-72% of canvas |
| Compact icon / action mark | 68-80% of canvas | 68-80% of canvas |

Add this block to prompts:

```text
COMPOSITION CONTRACT
The main diagram, including labels and arrows, must occupy {{role width}} of the canvas width and {{role height}} of the canvas height.
Keep balanced margins on all sides.
The visual center of the diagram must align with the canvas center.
Do not create a small centered illustration surrounded by large blank paper.
```

After generation, the wrapper runs `auto-frame` by default: it detects the real content bounds, trims excessive paper margin conservatively, then re-centers the image on the original aspect-ratio canvas. Use `--no-auto-frame` only when a scene intentionally needs large blank space.

## Native Placement Contract

The generated bitmap should feel as if it was drawn for the card, not pasted onto the card afterward.

Before writing the prompt, define:

```yaml
slot:
  html_wrapper: evidence-figure hero | evidence-figure wide | evidence-figure compact
  final_frame_height: 220-600px
  final_frame_shape: wide | tall | square
  optical_center: center | slightly_above_center
```

Prompt implications:

- For `.evidence-figure.hero`, ask for a complete diagram that fills 74-86% of image width and 62-78% of image height.
- For `.evidence-figure.wide`, ask for a horizontal diagram that fills 82-90% of image width and 46-62% of image height.
- For `.evidence-figure.compact`, ask for one strong object or mini scene that fills 62-76% of the image area.
- Tell the model to keep the main subject optically centered, not stuck to the top edge.
- Avoid huge empty paper margins inside the generated image. The HTML page already provides the quiet paper space.

Add this to `SCENE` when placement matters:

```text
Compose for a centered editorial evidence well. Keep the main subject optically centered in the canvas, with balanced top and bottom paper margin. The image should feel native to a 3:4 social card, not like a pasted screenshot.
```

## Palette Lock (hard rule)

Generated illustrations must match the card's `data-accent` palette. **Never** introduce a color that isn't in the system.

| System palette | Allowed ink colors in illustration |
|---|---|
| Indigo Porcelain | IKB Blue `#002FA7`, paper `#fafaf8`, ink `#0a0a0a`, greys. **NO mustard yellow inside illustration.** Mustard is reserved for the cover bar. |
| Lemon Yellow | `#FFD500`, paper, ink, greys |
| Lemon Green | `#C5E803`, paper, ink, greys |
| Safety Orange | `#FF6B35`, paper, ink, greys |

Always include this line in every prompt's STYLE section:

```
PALETTE LOCK
Only these colors may appear: <ACCENT HEX>, off-white paper #fafaf8, ink black #0a0a0a, light grey lines.
Do NOT use yellow, orange, red, green, purple, or any other color.
Do NOT use gradients, glows, shadows, or 3D rendering.
```

## Three Illustration Modes

| Mode | Use When | Text Handling |
|---|---|---|
| `labeled-gpt-image` | Beginner needs to understand the picture without reading nearby copy | GPT Image 2 generates 3-8 short exact labels inside the illustration |
| `html-label-overlay` | Text must be perfectly editable or the model struggles with labels | Generated image has no text; HTML labels are overlaid inside the image well |
| `no-text` | The image is a metaphor, atmosphere, object, or evidence that does not need labels | Generated image has no text |

Default to `labeled-gpt-image` for abstract AI concepts such as token, context window, hallucination, embeddings, retrieval, agent, model, prompt, and tool use.

## Responsibility Split

Generated illustration may contain:

- short labels: `原始文字`, `切分规则`, `Token 块`, `交给模型`;
- very short example text: `今天`, `天气`, `真`, `好`;
- arrows, braces, simple stage labels;
- one compact explanatory sentence only when the illustration is standalone.

HTML must contain:

- outer title and hook;
- precise definition;
- caveats and misconception boundaries;
- pricing, dates, model names, and unstable facts;
- long sentences;
- series metadata and page rhythm.

Never duplicate the outer card title inside the generated illustration. If the HTML title says `Token 是 AI 处理文字的小单位`, the illustration should show the mechanism, not repeat `Token 是什么？`.

## Labeled GPT Image Prompt Template

Use this structure for GPT Image 2 via ZenMux:

```markdown
Generate a clean {{wide 16:10 | wide 4:3 | 3:4 vertical}} Chinese educational illustration panel.

PURPOSE
The reader should understand: {{one mechanism or relationship}}.

VISUAL FLOW
Show a clear {{left-to-right | top-to-bottom}} flow:
{{stage 1}} -> {{stage 2}} -> {{stage 3}} -> {{stage 4}}.

EXACT IN-IMAGE TEXT
Only render these Chinese labels, exactly:
- {{label 1}}
- {{label 2}}
- {{label 3}}
- {{label 4}}

Do not add any other words.
Do not render an internal big title.

SCENE
{{specific objects and actions}}
Fill the central {{82-90% for wide layouts | 70-82% for vertical layouts}} of the image with the diagram. Keep only a narrow paper margin.
Compose for a centered editorial evidence well. Keep the main subject optically centered in the canvas, with balanced top and bottom paper margin.
All labels must be horizontal and placed inside or directly below their modules.

COMPOSITION CONTRACT
The main diagram, including labels and arrows, must occupy {{role width}} of the canvas width and {{role height}} of the canvas height.
Keep balanced margins on all sides.
The visual center of the diagram must align with the canvas center.
Do not create a small centered illustration surrounded by large blank paper.

TEXT QUALITY
All Chinese must be simplified Chinese, crisp, upright, readable, and typo-free.
Use clean modern sans-serif Chinese lettering.
Use large labels; avoid tiny captions.

STYLE
Editorial textbook isometric × electronic ink.
Off-white paper background #fafaf8, visually flat and uniform.
Thin ink linework, precise geometric forms, restrained fills.
Use accent color only as a small analytical accent or for one focal object, not as large chunky filled regions.
Hairline arrows, fine rules, quiet whitespace, magazine-diagram hierarchy.
No cartoon toy look, no childish icon style, no 3D blocks, no glossy shadows.
No people unless the role requires an agent (e.g., chef, operator, driver).

PALETTE LOCK
Only these colors may appear: <ACCENT HEX>, off-white paper #fafaf8, ink black #0a0a0a, light grey lines.
Do NOT use yellow, orange, red, green, purple, or any other color.
Do NOT use gradients, glows, shadows, or 3D rendering.

EXCLUDE
No logos, watermark, decorative clutter, fake UI, extra titles, extra labels, or noisy background.
```

## Text Budget

For generated labels:

- 3-6 labels is ideal.
- 8 labels is the upper limit.
- Each Chinese label should usually be 2-5 characters.
- One optional sentence may appear only when it is central and short, under 24 Chinese characters.
- Do not place paragraphs inside the image.

If the page needs more text than this, use HTML outside or overlay mode.

## Image Role

Choose exactly one role:

| Role | What the image must do |
|---|---|
| `mechanism-flow` | Show input -> transformation -> output |
| `capacity-scene` | Show a container filling or overflowing |
| `comparison-panel` | Show two states side by side |
| `cause-effect` | Show one action causing one result |
| `object-map` | Show a labeled object or system part |
| `hero-metaphor` | Make the concept memorable with one symbolic scene |

For beginner concept pages, prefer `mechanism-flow`, `capacity-scene`, or `comparison-panel`.

## GPT Image 2 Command

```bash
python3 <skill-dir>/scripts/generate-labeled-illustration.py \
  --prompt-file prompts/page-01.md \
  --output assets/page-01.png \
  --ar 3:4 \
  --quality 2k
```

The wrapper uses ZenMux as the OpenAI-compatible base URL and maps `ZENMUX_API_KEY` to `OPENAI_API_KEY` when needed.
The wrapper normalizes the edge-connected image background to the exact paper color by default, then runs conservative `auto-frame` to remove excessive blank paper margins. Disable only with `--no-auto-frame`.

Use `--ar 3:4` only when the image is a central vertical standalone panel. Use `16:10` or `4:3` for wide workflow, comparison, and metaphor wells. Use `1:1` only for inline icons or row thumbnails.

## Good Token Prompt Shape

Good:

```markdown
Generate a clean 3:4 vertical Chinese educational illustration panel.

PURPOSE
The reader should understand: one sentence is split into Token blocks before the model processes it.

VISUAL FLOW
Show a clear left-to-right flow:
paper strip -> cutting machine -> four token blocks -> model box.

EXACT IN-IMAGE TEXT
Only render these Chinese labels, exactly:
- 原始文字
- 切分规则
- 今天
- 天气
- 真
- 好
- Token 块
- 交给模型

Do not add any other words.
Do not render an internal big title.
...
```

Bad:

```text
Token 是什么？画一张完整信息图，解释定义、费用、上下文窗口和实验步骤。
```

This duplicates the outer card title and overloads one illustration.

## Review Rules

Reject and regenerate if:

- any Chinese character is wrong, missing, fuzzy, or cramped;
- the model adds unrequested labels or an internal title;
- the illustration repeats the outer HTML title;
- the reading direction is unclear;
- the text becomes too small at phone-thumbnail size;
- the picture has good labels but weak mechanism;
- the image panel fights the outer card layout instead of acting as evidence.
- the style looks like a chunky cartoon icon set instead of a refined editorial diagram;
- the image background visibly differs from the outer card paper;
- the image introduces colors not in the system palette (e.g., yellow in an Indigo Porcelain set).

## Fallback Modes

Use `html-label-overlay` when:

- exact wording matters more than image naturalness;
- labels must be edited after generation;
- GPT Image 2 repeatedly introduces wrong characters.

Use `no-text` when:

- the image is only atmosphere or a metaphor;
- the concept is already explained well by HTML;
- generated labels would create clutter.
