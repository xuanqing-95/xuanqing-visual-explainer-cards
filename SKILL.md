---
name: xuanqing-visual-explainer-cards
description: Create illustrated Xiaohongshu/Rednote knowledge-card series that combine GPT Image 2 explanatory illustrations with Guizang-style editorial HTML layout. Use when turning abstract concepts, tutorials, AI knowledge, product mechanisms, comparisons, or educational content into clear 3:4 social cards with small in-image Chinese labels, accurate outer typography, reusable layouts, and automated validation. Use this skill whenever the user mentions creating social cards, knowledge posts, visual explanations, educational infographics, Xiaohongshu/Rednote content, or illustrated explainer series — even if they don't explicitly ask for "visual explainer cards."
---

## Dependencies

| Dependency | Install | Purpose |
|---|---|---|
| Playwright (npm) | `npm install playwright` in the skill directory | Renders HTML to PNG and validates cards |

> `<skill-dir>` in the commands below refers to the directory containing this SKILL.md file.

## Image Generation

Built-in `scripts/generate.mjs` — standalone, no npm dependencies, uses Node.js built-in fetch.

```bash
node <skill-dir>/scripts/generate.mjs --promptfile prompts/page-02.md --output assets/page-02.png --ar 3:4 --quality 2k
```

Environment variables:
- `OPENAI_API_KEY` — required
- `OPENAI_BASE_URL` — API base URL (default: `https://api.openai.com/v1`)
- `OPENAI_IMAGE_MODEL` — model override (default: `gpt-image-2`)

After generating illustrations, verify the background color matches your card's `--paper` value. Add `BACKGROUND: solid #f1f3f5` to your prompt if colors don't match.

---

# Visual Explainer Cards

Create social cards that readers understand visually before reading closely.

Default to a hybrid composition:

- Render the outer card, large titles, body copy, bottom takeaways, page rhythm, and Guizang-style editorial structure in HTML.
- Generate the central explanation illustration with GPT Image 2 when the concept needs integrated labels inside the picture.
- Allow only small, high-value in-image labels inside generated illustrations. Keep long explanations and caveats in HTML.
- Use no-text or HTML-overlay illustrations only when generated text is unnecessary or too risky.
- Validate before delivery.

## Core Workflow

### Step 0: Verify dependencies

```bash
node -e "require('playwright')" 2>/dev/null || (cd <skill-dir> && npm install playwright)
echo $OPENAI_API_KEY > /dev/null || echo "WARN: OPENAI_API_KEY not set"
```

### Step 1: Read the source

Read the source material and verify unstable facts when necessary.

### Step 2: Build beginner explanation brief

Use `references/beginner-explanation.md`. Do not begin layout work until the concept can be explained without jargon. Answer all six questions: What is it? What is it not? How does it work? What does it look like? Why should the reader care? What can the reader do next?

### Step 3: Image strategy

**If the user supplies only text (no images), ask once:**

```
这篇我需要 1-2 张图。三种走法：
A. 你自己有照片 / 截图，传给我（推荐——最不"AI 感"）
B. 我去 Unsplash / Pexels 帮你找
C. 用 AI 生成
```

Recommend A. Accept whatever the user picks and proceed. Do not re-prompt later.

### Step 4: Create storyboard

Create `storyboard.yaml` before designing. Give each page one message and one visual role. Use this shape:

```yaml
topic: Token 是什么
audience: AI 初学者
beginner_brief:
  prior_knowledge: 会使用聊天类 AI，但不了解模型原理
  plain_definition: Token 是 AI 读取和生成文字时使用的小单位
  not_this: 它不一定等于一个汉字或一个单词
  why_it_matters: 它会影响费用、可处理内容长度和对话记忆
  concrete_example: 今天天气真好会被拆成若干小块处理
pages:
  - id: 1
    message: Token 会影响 AI 怎么读文字、花多少钱、能记住多少上下文
    role: cover
    layout: series-cover
  - id: 2
    message: Token 是 AI 处理文字的单位
    role: concept
    visual_type: labeled-gpt-image
    layout: annotated-canvas
```

### Step 5: Plan page rhythm

List each content page's silhouette and evidence type. Use at least four distinct silhouettes in a 5-7 page set after the cover. For recurring AI knowledge series, page 1 uses the fixed `series-cover` layout.

### Step 6: Route content pages

Use `references/visual-routing.md` to decide whether and how to illustrate each page. Use `references/layouts.md` to select page structures. Reject side-by-side portrait layouts that leave large empty upper or lower bands.

### Step 7: Write illustration prompts

For every illustration-led page, choose one mode using `references/illustration-prompts.md`: `labeled-gpt-image`, `html-label-overlay`, or `no-text`. For the default `labeled-gpt-image` mode, write a compact prompt with 3-8 exact in-image labels.

### Step 8: Generate illustrations

```bash
node <skill-dir>/scripts/generate.mjs --promptfile prompts/page-02.md --output assets/page-02.png --ar 3:4 --quality 2k
```

Save prompts in `prompts/` and output images in `assets/`. Ensure the illustration background color matches the card's `--paper` value (default: `#f1f3f5`).

### Step 9: Build HTML

1. Copy `assets/template.html` into the task directory as `index.html`.
2. Read `references/components.md` before editing — it defines every CSS class, font size, and image container.
3. Replace the placeholder posters with real pages. Use layout recipes from `references/layouts.md`.
4. Add background layers (dot-mat, cross-mat, ring-mat) from `references/background-systems.md` on covers and sparse pages.
5. For images, use `.frame-img` with a standard ratio class (`.r-3x4`, `.r-4x3`, etc.) and set `object-position` inline.
6. For AI-generated illustrations, use `.illust-frame` with a ratio class.
7. Add task-scoped CSS only when necessary. Define `.foot` in task-scoped CSS:
   ```css
   .foot {
     display: flex;
     justify-content: space-between;
     font-size: 18px;
     letter-spacing: .06em;
     color: var(--grey-3);
     padding: 0 80px 40px;
     position: absolute;
     bottom: 0;
     left: 0;
     right: 0;
   }
   ```

### Step 10: Render

```bash
node <skill-dir>/scripts/render.mjs <task-dir>
```

Output: `output/<id>.png` at 1080×1440 (3:4) or 1080×1080 (1:1).

### Step 11: Validate and fix

```bash
node <skill-dir>/scripts/validate.mjs <task-dir>
```

Checks: R1 overflow · R2 footer collision · R3 swiss bold display · R4 min font · R5 4-band density · R6 h-xl cap · R7 figure margin drift. Exit code 1 on FAIL. Fix every FAIL before delivery.

### Step 12: Inspect and deliver

Inspect the final PNGs. Run both image-only and full-page explanation checks, then check generated Chinese text accuracy, factual accuracy, readability, page rhythm, and series consistency.

## Hard Rules

- Keep one core message per page.
- Page 1 of a recurring AI concept series should use the fixed `series-cover` layout unless the user asks for another cover format.
- The cover must contain exactly four content units: series line, English technical term, Chinese explanation, and one scenario question.
- Cover typography must be rendered in HTML, not generated into an image.
- A core message must be a complete sentence with a subject, mechanism, and consequence. A keyword is not a message.
- Introduce every necessary technical term with plain-language meaning on first appearance.
- For every abstract definition, include at least one concrete example and one "why it matters" consequence in the card set.
- State important boundaries or misconceptions. Avoid teaching an analogy as if it were the literal mechanism.
- Use HTML as the default expression. Use illustrations to explain, not decorate.
- Do not generate an illustration when a comparison, process, ledger, or number communicates better.
- Keep long explanations, caveats, prices, dates, and unstable facts out of generated images.
- In `labeled-gpt-image` mode, generated images may contain only short exact labels that make the picture self-explanatory.
- Never duplicate the outer HTML title inside the generated illustration. The illustration should explain the mechanism, while the outer card introduces the topic.
- Do not add top metadata/category/page labels by default. Use them only when the user requests an editorial issue system.
- Use 1-3 illustrations in a typical 5-page set, not one on every page.
- Reserve composition safe zones before generating illustrations.
- Prefer concrete actions over static collections of objects.
- Illustration presence is not success. Every illustration-led page must visibly communicate a causal chain and pass both image-only and full-page explanation checks.
- Generated illustrations explain one decisive visual moment. HTML completes exact causal chains, labels, definitions, and caveats.
- Generate for the final image slot. Do not default every embedded illustration to 3:4.
- Reuse a textual style anchor across the series. Use the first approved illustration as a reference only when the active generator supports reference images.
- When using GPT Image 2, visually inspect every generated Chinese label. Regenerate if any label is wrong, fuzzy, cramped, duplicated, or invented.
- **"The larger, the lighter"** — display titles use weight 200-300, small text uses weight 500-600. Never use weight 700+ on display titles.
- **Cut copy, don't shrink type** — if content overflows, remove words. Never reduce body text below 22px.
- Every `.poster` must have `overflow: hidden` and stable dimensions. Never use `vw`/`vh` inside posters.

## Required References

| Reference | When to read |
|---|---|
| `references/components.md` | Before editing the HTML template (every class, font size, image container) |
| `references/visual-routing.md` | When deciding whether and how to illustrate a page |
| `references/beginner-explanation.md` | Before storyboarding or writing card copy |
| `references/metaphor-library.md` | When translating abstract ideas into scenes |
| `references/illustration-prompts.md` | Before generating any illustration |
| `references/design-system.md` | Before editing the HTML template (typography, spacing, theme tokens) |
| `references/theme-presets.md` | When choosing a color palette |
| `references/background-systems.md` | When setting up page backgrounds |
| `references/layouts.md` | When selecting page structures |
| `references/style-system.md` | For Editorial vs Swiss mode rules |
| `references/platform-specs.md` | For exact ratios and output sizes |
| `references/qa-checklist.md` | Before delivery |

## Task Directory

```text
visual-cards/<slug>/
├── source.md
├── storyboard.yaml
├── prompts/
├── assets/
├── index.html
└── output/
```

Keep prompts and source files so the result can be revised and reproduced.
