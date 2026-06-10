---
name: xuanqing-visual-explainer-cards
description: Create illustrated Xiaohongshu/Rednote knowledge-card series that combine GPT Image 2 explanatory illustrations with editorial HTML layout (serif display + IKB Blue structure + Mustard Yellow emphasis). Use when turning abstract concepts, tutorials, AI knowledge, product mechanisms, comparisons, or educational content into clear 3:4 social cards with small in-image Chinese labels, accurate outer typography, reusable layouts, and automated validation. Use this skill whenever the user mentions creating social cards, knowledge posts, visual explanations, educational infographics, Xiaohongshu/Rednote content, or illustrated explainer series — even if they don't explicitly ask for "visual explainer cards."
---

## Dependencies

This skill requires the following to be installed:

| Dependency | Install | Purpose |
|---|---|---|
| Playwright (npm) | `npm install playwright` in the skill directory | Renders HTML to PNG |
| Pillow (Python) | `pip install Pillow` | Background normalization for generated illustrations |
| [baoyu-imagine](~/.openclaw/skills/baoyu-imagine) | OpenClaw skill | GPT Image 2 labeled illustration generation (Step 10) |
| [mz-image-gen](~/.openclaw/skills/mz-image-gen) | OpenClaw skill | No-text fallback illustration generation (Step 11) |
| bun | `curl -fsSL https://bun.sh/install \| bash` | Required by baoyu-imagine |

> `<skill-dir>` in the commands below refers to the directory containing this SKILL.md file.

---

# Visual Explainer Cards

Create social cards that readers understand visually before reading closely.

This skill is **Editorial-first**: serif display titles (Playfair Display + Noto Serif SC), sans body, mono meta. IKB Klein Blue is the visible system color on every page (chrome, foot, section labels, dividers, page numbers). Mustard Yellow appears exactly once per set, on the cover horizontal bar — nowhere else.

It pairs that strict typography system with GPT Image 2 illustrations that may carry a small number of exact Chinese labels.

Default to a hybrid composition:

- Render the outer card, large titles, body copy, bottom takeaways, page rhythm, and editorial structure in HTML.
- Generate illustrations for most content pages — text leads, illustration explains. Use small, supporting illustrations (160-560px depending on page role), not one full-canvas centerpiece per set.
- Allow only small, high-value in-image labels inside generated illustrations. Keep long explanations and caveats in HTML.
- The cover (S00) is the only fixed layout in the system. Content pages are composed fresh from primitives based on content shape — do not invent named "S01/S02/S03" templates and force pages into them.

## Core Workflow

0. Verify dependencies are ready:
   ```bash
   python3 -c "import PIL" 2>/dev/null || pip install Pillow
   node -e "require('playwright')" 2>/dev/null || (cd <skill-dir> && npm install playwright)
   test -f ~/.openclaw/skills/baoyu-imagine/scripts/main.ts || echo "WARN: baoyu-imagine skill not installed"
   test -f ~/.openclaw/skills/mz-image-gen/scripts/main.py || echo "WARN: mz-image-gen skill not installed"
   ```

1. Read the source and verify unstable facts when necessary.
2. Build a beginner explanation brief using `references/beginner-explanation.md`. Do not begin layout work until the concept can be explained without jargon.
3. Create `storyboard.yaml` before designing. Give each page one message and one visual role.
4. For recurring AI knowledge series, make page 1 a fixed `series-cover`: series line, English term, Chinese explanation, and one user-scenario question. Do not generate a cover illustration unless the user explicitly asks.
5. Add a page-rhythm plan before coding: list each content page's silhouette and evidence type. Use at least four distinct silhouettes in a 5-7 page set after the cover.
6. Route each content page using `references/visual-routing.md`.
7. The cover (page 1) uses the fixed S00 layout in `references/layouts.md`. For pages 2 onwards, do NOT pick a pre-named recipe — read `references/layouts.md` to choose a layout pattern based on the content shape, and compose the page fresh from primitives.
8. For every illustration-led page, choose one illustration mode using `references/illustration-prompts.md`: `labeled-gpt-image`, `html-label-overlay`, or `no-text`.
9. For the default `labeled-gpt-image` mode, write a compact GPT Image 2 prompt with 3-8 exact in-image labels and no duplicate card title inside the illustration.
10. Generate labeled GPT Image 2 illustrations:

```bash
python3 <skill-dir>/scripts/generate-labeled-illustration.py \
  --prompt-file prompts/page-01.md \
  --output assets/page-01.png \
  --ar 3:4
```

The script uses an OpenAI-compatible base URL (configurable via `OPENAI_BASE_URL`) and accepts `ZENMUX_API_KEY` as an `OPENAI_API_KEY` fallback when configured.

11. Generate no-text fallback illustrations with:

```bash
python3 <skill-dir>/scripts/generate-illustration.py \
  --prompt-file prompts/page-01.md \
  --output assets/page-01.png \
  --ar 4:3
```

The generation script normalizes the generated edge-connected background to the page paper color `#fafaf8` by default. Add `--remove-background` only for isolated objects or characters that must overlap HTML regions. Add `--skip-background-normalize` only when preserving an intentional scene background.

12. Copy `assets/template.html` into the task directory as `index.html`. The template is an Editorial seed (Indigo Porcelain default) with serif display fonts, IKB Blue as the visible system color, and ONE fixed layout: the S00 Series Cover. Switch `data-accent` on `<html>` to change palette (`indigo-porcelain` | `lemon-yellow` | `lemon-green` | `safety-orange`). The alt accents collapse to single-color (no separate highlight) — only Indigo Porcelain carries the cover-bar yellow.
13. Keep the cover (S00) structure verbatim, replacing only the placeholders. For content pages, **copy a named snippet from the bottom of `assets/template.html`** as your starting point and adjust:
    - **P-METAPHOR** — concept + large 540px illustration
    - **P-LIST** — numbered list with 200px thumb illustrations per row
    - **P-COMPARE** — two-column before/after with 240px illustrations
    - **P-MECHANISM** — vertical pipeline with 130px inline step icons
    - **P-QUOTE** — pull-quote + 420px supporting illustration
    - **P-ACTION** — closing self-check with 200px illustration + options

    Read `references/layouts.md` for which snippet maps to which content shape, and `references/components.md` for the full type scale. Two hard rules from the reference system: **(a) "the larger, the lighter"** — display weights are 500, never 700+; **(b) body and lead are serif-zh, not sans**. Most content pages should pair text + small illustration (`.illust-frame` 130-560px depending on role). Add task-scoped CSS in the page's `<style>` only when necessary — do NOT add it back into the seed.
14. Render:

```bash
node <skill-dir>/scripts/render.mjs <task-dir>
```

15. **Show first, validate on request.** Show the user the rendered PNGs (absolute paths) with a one-sentence summary. Ask once: "先你自己看,还是我先跑核查?" (Review first, or auto-check?) Only run the validator if the user asks:

```bash
node <skill-dir>/scripts/validate.mjs <task-dir>
```

Fix every FAIL before final delivery. WARN is advisory.

16. Inspect the final PNGs. Run both image-only and full-page explanation checks, then check generated Chinese text accuracy, factual accuracy, readability, page rhythm, and series consistency.

## Storyboard Contract

Create this shape before image generation:

```yaml
topic: Token 是什么
audience: AI 初学者
beginner_brief:
  prior_knowledge: 会使用聊天类 AI,但不了解模型原理
  plain_definition: Token 是 AI 读取和生成文字时使用的小单位
  not_this: 它不一定等于一个汉字或一个单词
  why_it_matters: 它会影响费用、可处理内容长度和对话记忆
  concrete_example: 今天天气真好会被拆成若干小块处理
pages:
  - id: 1
    message: Token 会影响 AI 怎么读文字、花多少钱、能记住多少上下文
    role: cover
    layout: series-cover
    cover:
      series_line: 每天吃透一个 AI 知识点
      english_term: Token
      chinese_explanation: 文字处理单位
      user_question: 为什么 AI 聊久了会忘记前面说过什么?
  - id: 2
    message: Token 是 AI 处理文字的单位
    role: concept
    visual_type: labeled-gpt-image
    metaphor: 一整句话被拆成积木块
    layout: annotated-canvas
```

Hard rules:

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
- Use 3-4 illustrations in a typical 5-page set (most content pages should pair text + small illustration). Not one giant illustration per set, not one on every single page either.
- Reserve composition safe zones before generating illustrations.
- Prefer concrete actions over static collections of objects.
- Illustration presence is not success. Every illustration-led page must visibly communicate a causal chain and pass both image-only and full-page explanation checks.
- Generated illustrations explain one decisive visual moment. HTML completes exact causal chains, labels, definitions, and caveats.
- Generate for the final image slot. Do not default every embedded illustration to 3:4.
- Reuse a textual style anchor across the series. Use the first approved illustration as a reference only when the active generator supports reference images; the default `mz-image-gen` backend currently does not.
- When using GPT Image 2, visually inspect every generated Chinese label. Regenerate if any label is wrong, fuzzy, cramped, duplicated, or invented.

## Required References

- Read `references/visual-routing.md` when deciding whether and how to illustrate a page.
- Read `references/beginner-explanation.md` before storyboarding or writing card copy.
- Read `references/metaphor-library.md` when translating abstract ideas into scenes.
- Read `references/illustration-prompts.md` before generating any illustration.
- Read `references/design-system.md` before editing the HTML template (typography, spacing, two-layer color logic).
- Read `references/theme-presets.md` when choosing an accent palette (default: Indigo Porcelain).
- Read `references/background-systems.md` only when setting up sparse-page backgrounds.
- Read `references/layouts.md` when selecting page structures (S00-S04).
- Read `references/style-system.md` for Editorial identity rules and anti-patterns.
- Read `references/components.md` for class names, emphasis patterns, and image containers.
- Read `references/platform-specs.md` to confirm the Xiaohongshu 1080×1440 dimension and safe zones.
- Read `references/qa-checklist.md` before delivery.

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
