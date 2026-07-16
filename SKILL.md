---
name: xuanqing-visual-explainer-cards
description: Create illustrated Xiaohongshu/Rednote knowledge-card series with editorial HTML typography, slot-matched explanatory images, content-driven layouts, and automated artifact validation. Use when turning abstract concepts, tutorials, AI knowledge, product mechanisms, comparisons, or educational content into clear 3:4 social cards, visual explainers, educational infographics, or illustrated knowledge posts.
---

# Visual Explainer Cards

Create social cards that readers can understand visually before reading closely.

## Output contract

- Render every final card from HTML at `1080x1440` (3:4).
- Treat generated images as evidence inside the card. Their canvas may be landscape, square, portrait, or a supported custom size.
- Define the final `image_slot` before writing an image prompt or generating an image.
- Keep outer titles, body copy, caveats, page chrome, and long explanations in HTML.
- Use only short, high-value labels inside generated illustrations.
- Use the fixed S00 cover for recurring AI concept series unless the user requests another cover.
- Compose content pages from information shape. Do not force them into numbered fixed templates.

## Runtime

Require Node.js 20+, Python 3.9+, Playwright with Chromium, and Pillow.

Check before starting:

```bash
node -e "require('playwright')" &&
python3 -c "import PIL"
```

If Chromium is missing, run `npx playwright install chromium` in the skill directory. If an illustration must be generated, require either `OPENAI_API_KEY` or `ZENMUX_API_KEY`; stop with an actionable error when neither exists.

Resolve `<skill-dir>` to the directory containing this `SKILL.md`.

## Workflow

1. Separate the source into `content_source` and `publish_metadata`. Keep lines under `标签:`, `Tags:`, `Hashtags:`, and standalone `#...` lines out of page copy, footers, captions, and image prompts.
2. Read [`references/beginner-explanation.md`](references/beginner-explanation.md) and create a beginner brief: what it is, what it is not, how it works, one concrete example, why it matters, and the next action.
3. Extract the source's natural message units. Use one complete message per page and let the content determine the page count; 4–7 pages including the cover is common, not mandatory.
4. Create `storyboard.yaml` before designing. Include a page-rhythm plan and vary content-page silhouettes.
5. Read [`references/visual-routing.md`](references/visual-routing.md) to choose HTML-native evidence, generated illustration, comparison, process, ledger, or another visual form.
6. Use the fixed S00 cover from [`references/layouts.md`](references/layouts.md). Compose later pages from the template primitives and content patterns in that reference.
7. For every generated illustration, define `image_slot` before prompting:
   - `html_wrapper`
   - `slot_px`
   - `slot_ratio`
   - `requested_orientation`
   - `model_output_size`
   - `subject_bbox`
   - `fit`
8. Read [`references/illustration-prompts.md`](references/illustration-prompts.md). Choose `labeled-gpt-image`, `html-label-overlay`, or `no-text`.
9. Generate the image with the explicit `model_output_size`. Use `low` for drafts and `medium` or `high` for accepted assets:

```bash
python3 <skill-dir>/scripts/generate-illustration.py \
  --prompt-file prompts/page-02.md \
  --output assets/page-02.png \
  --orientation landscape \
  --size 1536x1024 \
  --quality medium
```

The script calls the local OpenAI-compatible wrapper, verifies the returned dimensions, normalizes edge-connected paper background, and applies conservative auto-framing. Use `--remove-background` only for isolated cutouts, `--skip-background-normalize` for intentional scene backgrounds, and `--no-auto-frame` when blank space is deliberate.

10. Copy `assets/template.html` to the task directory as `index.html`. Read [`references/design-system.md`](references/design-system.md) before editing:
    - body and lead are serif Chinese, not sans;
    - large display text stays light;
    - IKB blue remains visible on every page;
    - mustard yellow appears only on the cover bar in the default theme;
    - use no rounded cards, shadows, or gradients.
11. Place major generated illustrations inside `.evidence-figure` with an `.illust-frame`. Match the wrapper to the declared slot and keep `object-fit: contain`.
12. Render, validate, and inspect:

```bash
node <skill-dir>/scripts/render.mjs <task-dir>
node <skill-dir>/scripts/validate.mjs <task-dir>
```

Fix every FAIL. Inspect every final PNG for factual accuracy, Chinese label accuracy, readability, page rhythm, visual consistency, and complete causal explanation. Show only validated final PNGs unless the user explicitly asks for a rough draft.

## Storyboard contract

```yaml
topic: Token 是什么
audience: AI 初学者
beginner_brief:
  prior_knowledge: 会使用聊天类 AI,但不了解模型原理
  plain_definition: Token 是 AI 读取和生成文字时使用的小单位
  not_this: 它不一定等于一个汉字或一个单词
  why_it_matters: 它影响费用、可处理内容长度和上下文记忆
  concrete_example: 今天天气真好会被拆成若干小块处理
source_tags:
  - AI入门
  - ChatGPT
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
    layout: metaphor-evidence
    visual_type: labeled-gpt-image
    image_slot:
      html_wrapper: evidence-figure landscape
      slot_px: 904x603
      slot_ratio: 3:2
      requested_orientation: landscape
      model_output_size: 1536x1024
      subject_bbox: x=120-1416,y=128-896
      fit: contain
```

## Hard rules

- Keep one complete core message per page.
- Introduce technical terms in plain language on first appearance.
- Include a concrete example and a practical consequence for abstract definitions.
- State important boundaries; do not teach an analogy as the literal mechanism.
- Use HTML when comparison, process, ledger, or numbers explain better than generated imagery.
- Use visual evidence on most content pages, but generate only when the image materially explains something.
- Never duplicate the outer HTML title inside a generated illustration.
- Keep prices, dates, model names, long explanations, and unstable facts out of generated images.
- Keep user-provided hashtags outside the cards unless the user explicitly requests a hashtag page.
- Use `.frame-img` with `cover` only for photographs where intentional cropping is acceptable.
- Do not accept an illustration merely because a file exists. Verify that the picture communicates the intended input, action, direction, result, and practical meaning.

## References

Read only the references needed for the current step:

- [`references/beginner-explanation.md`](references/beginner-explanation.md): beginner brief and copy logic.
- [`references/design-system.md`](references/design-system.md): canvas, typography, colors, components, image containers, and backgrounds.
- [`references/layouts.md`](references/layouts.md): S00 cover and content-shape composition patterns.
- [`references/visual-routing.md`](references/visual-routing.md): choose the right visual evidence.
- [`references/metaphor-library.md`](references/metaphor-library.md): map abstract ideas to concrete scenes.
- [`references/illustration-prompts.md`](references/illustration-prompts.md): slot registry, prompt contracts, and image modes.
- [`references/qa-checklist.md`](references/qa-checklist.md): release checks before delivery.

## Task directory

```text
visual-cards/<slug>/
├── source.md
├── storyboard.yaml
├── prompts/
├── assets/
├── index.html
└── output/
```

Keep source, storyboard, prompts, and accepted assets so the result can be reproduced and revised.
