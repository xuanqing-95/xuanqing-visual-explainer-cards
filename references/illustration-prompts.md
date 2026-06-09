# Illustration Prompt Protocol

Create the central visual evidence for an educational card.

Default mode is **GPT Image 2 labeled illustration**: the generated image may contain a small number of exact Chinese labels, while the outer card remains HTML-led.

## When to Generate an Illustration (hard rule)

**Illustration is supporting, not primary.** Text carries the load; illustration only earns space when it does something text cannot.

Generate an illustration only if the page meets one of:

1. **Metaphor page** — concept is abstract (LLMOps, RAG, agent loop), reader needs a concrete mental anchor
2. **Mechanism flow** — input → transform → output where the spatial layout IS the explanation
3. **Comparison panel** — two states side-by-side where visual contrast is the message

Do NOT generate illustrations for:

- Numbered lists (use S02 ledger — type rhythm is the visual)
- Before/After text comparisons (use S03 ba — typography carries it)
- Closing pages with options (use S04 — letter blocks are the visual)
- Cover pages (use S00 — huge serif term is the visual)

Typical 5-page set: **1 illustration on page 2**. Not one per page.

## Palette Lock (hard rule)

Generated illustrations must match the card's `data-accent` palette. **Never** introduce a color that isn't in the system.

| System palette | Allowed ink colors in illustration |
|---|---|
| Indigo Porcelain | IKB Blue `#002FA7`, paper `#fafaf8`, ink `#0a0a0a`, greys. **NO mustard yellow inside illustration.** Mustard is reserved for HTML emphasis. |
| Lemon Yellow | `#FFD500`, paper, ink, greys |
| Lemon Green | `#C5E803`, paper, ink, greys |
| Safety Orange | `#FF6B35`, paper, ink, greys |

The reason mustard is excluded from Indigo Porcelain illustrations: yellow is the page's emphasis surface (kicker, em, ledger numbers). If the illustration also wears yellow, emphasis loses its signal.

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
Generate a clean 3:4 vertical Chinese educational illustration panel.

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
The wrapper normalizes the edge-connected image background to the exact paper color by default.

Use `--ar 3:4` when the image is a central standalone panel. Use `4:3`, `3:2`, or `16:10` only when the illustration is a smaller embedded well.

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
